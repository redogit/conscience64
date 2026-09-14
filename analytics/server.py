#!/usr/bin/env python3
import argparse
import hmac
import json
import os
import queue
import threading
import time
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

EVENT_KINDS = {
    "OBSERVATION", "TESTED", "VERIFIED", "CONTRADICTION", "INTERPRETATION",
    "BOUNDARY", "REVISED", "PROMOTED", "REOPENED",
}
INGEST_REQUIRED_FIELDS = {"kind", "project", "message", "evidence"}
CONTRACT_REQUIRED_FIELDS = {
    "time", "kind", "project", "message", "evidence", "source", "status",
}
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/dashboard.mjs": ("dashboard.mjs", "text/javascript; charset=utf-8"),
    "/event-contract.mjs": ("event-contract.mjs", "text/javascript; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
}
CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; "
    "img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'"
)


class LedgerCorruption(RuntimeError):
    pass


class ResumeError(RuntimeError):
    pass


class Subscriber:
    def __init__(self, maxsize=512):
        self.queue = queue.Queue(maxsize=maxsize)
        self.dropped = threading.Event()


def iso_utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def valid_iso_time(value):
    if not isinstance(value, str) or not value.strip():
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def normalize_event(payload):
    if not isinstance(payload, dict):
        raise ValueError("event must be a JSON object")

    missing = sorted(INGEST_REQUIRED_FIELDS - payload.keys())
    if missing:
        raise ValueError("missing required fields: " + ", ".join(missing))

    for field in INGEST_REQUIRED_FIELDS:
        if not isinstance(payload[field], str) or not payload[field].strip():
            raise ValueError(f"invalid field: {field}")

    if payload["kind"] not in EVENT_KINDS:
        raise ValueError("unknown event kind")

    event = dict(payload)
    now = iso_utc_now()

    if "time" in event:
        if not valid_iso_time(event["time"]):
            raise ValueError("time must be an ISO-8601-compatible timestamp")
    else:
        event["time"] = now

    for field, default in (("source", "analytics-ingest"), ("status", "recorded")):
        if field in event:
            if not isinstance(event[field], str) or not event[field].strip():
                raise ValueError(f"invalid field: {field}")
        else:
            event[field] = default

    producer_event_id = event.pop("event_id", None)
    if producer_event_id is not None:
        if not isinstance(producer_event_id, str) or not producer_event_id.strip():
            raise ValueError("invalid field: event_id")
        event["producer_event_id"] = producer_event_id

    # Canonical ledger identity is assigned by the ingestion service so a producer
    # cannot collide with or impersonate an existing ledger event.
    event["event_id"] = str(uuid.uuid4())
    event["ingested_at"] = now
    event["time_unix_ms"] = int(time.time() * 1000)

    for field in CONTRACT_REQUIRED_FIELDS:
        if not isinstance(event.get(field), str) or not event[field].strip():
            raise ValueError(f"invalid contract field after normalization: {field}")
    return event


class EventLedger:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.subscribers = set()

    def _load_events_locked(self):
        if not self.path.exists():
            return []
        events = []
        with self.path.open("r", encoding="utf-8") as fh:
            for line_number, line in enumerate(fh, 1):
                if not line.strip():
                    raise LedgerCorruption(f"blank ledger line at {line_number}")
                try:
                    event = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise LedgerCorruption(f"invalid JSON at ledger line {line_number}") from exc
                if not isinstance(event, dict):
                    raise LedgerCorruption(f"non-object event at ledger line {line_number}")
                events.append(event)
        return events

    def append(self, event):
        line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
        with self.lock:
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(line + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            subscribers = tuple(self.subscribers)

        stale = []
        for subscriber in subscribers:
            try:
                subscriber.queue.put_nowait(event)
            except queue.Full:
                subscriber.dropped.set()
                stale.append(subscriber)
        if stale:
            with self.lock:
                for subscriber in stale:
                    self.subscribers.discard(subscriber)
        return event

    def replay(self, limit=200):
        if limit < 0:
            raise ValueError("limit must be non-negative")
        with self.lock:
            events = self._load_events_locked()
        return events[-limit:] if limit else []

    def replay_and_subscribe(self, replay_limit=200, last_event_id="", max_resume_events=10000):
        if replay_limit < 0 or max_resume_events <= 0:
            raise ValueError("invalid replay limits")
        with self.lock:
            events = self._load_events_locked()
            if last_event_id:
                matches = [i for i, event in enumerate(events) if event.get("event_id") == last_event_id]
                if not matches:
                    raise ResumeError("Last-Event-ID is not present in the ledger")
                replay = events[matches[-1] + 1:]
                if len(replay) > max_resume_events:
                    raise ResumeError("resume window exceeds configured maximum")
            else:
                replay = events[-replay_limit:] if replay_limit else []
            subscriber = Subscriber()
            self.subscribers.add(subscriber)
        return replay, subscriber

    def unsubscribe(self, subscriber):
        with self.lock:
            self.subscribers.discard(subscriber)

    def validate(self):
        with self.lock:
            return len(self._load_events_locked())


class AnalyticsHandler(BaseHTTPRequestHandler):
    server_version = "Conscience64Analytics/1.2"

    def _cors(self):
        origin = self.server.allowed_origin
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _common_security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
        self._common_security_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _static(self, route):
        file_name, content_type = STATIC_FILES[route]
        path = self.server.static_dir / file_name
        if not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        body = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self._common_security_headers()
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors()
        self._common_security_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.end_headers()

    def do_POST(self):
        route = urlsplit(self.path).path
        if route != "/events":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        token = self.server.ingest_token
        if token:
            auth = self.headers.get("Authorization", "")
            expected = f"Bearer {token}"
            if not hmac.compare_digest(auth, expected):
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
                return

        if self.headers.get_content_type() != "application/json":
            self._json(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, {"error": "Content-Type must be application/json"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > self.server.max_body_bytes:
                raise ValueError("invalid content length")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            event = normalize_event(payload)
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return

        self.server.ledger.append(event)
        self._json(HTTPStatus.ACCEPTED, event)

    def do_GET(self):
        route = urlsplit(self.path).path
        if route == "/healthz":
            try:
                count = self.server.ledger.validate()
            except LedgerCorruption as exc:
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                    "status": "degraded",
                    "error": "ledger_corruption",
                    "detail": str(exc),
                })
                return
            self._json(HTTPStatus.OK, {"status": "ok", "events": count})
            return
        if route == "/events":
            self._serve_sse()
            return
        if route in STATIC_FILES:
            self._static(route)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def _serve_sse(self):
        last_event_id = self.headers.get("Last-Event-ID", "").strip()
        try:
            replay, subscriber = self.server.ledger.replay_and_subscribe(
                self.server.replay_limit,
                last_event_id,
                self.server.max_resume_events,
            )
        except LedgerCorruption as exc:
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                "error": "ledger_corruption",
                "detail": str(exc),
            })
            return
        except ResumeError as exc:
            self._json(HTTPStatus.CONFLICT, {
                "error": "resume_gap",
                "detail": str(exc),
            })
            return

        self.send_response(HTTPStatus.OK)
        self._cors()
        self._common_security_headers()
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            for event in replay:
                self._write_sse(event)
            while True:
                if subscriber.dropped.is_set() and subscriber.queue.empty():
                    break
                try:
                    event = subscriber.queue.get(timeout=15)
                    self._write_sse(event)
                except queue.Empty:
                    if subscriber.dropped.is_set():
                        break
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            return
        finally:
            self.server.ledger.unsubscribe(subscriber)

    def _write_sse(self, event):
        event_id = str(event.get("event_id", ""))
        payload = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
        if event_id:
            self.wfile.write(f"id: {event_id}\n".encode("utf-8"))
        self.wfile.write(f"data: {payload}\n\n".encode("utf-8"))
        self.wfile.flush()

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


class AnalyticsServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self, address, handler, ledger, ingest_token, allowed_origin,
        replay_limit, max_resume_events, max_body_bytes, static_dir,
    ):
        super().__init__(address, handler)
        self.ledger = ledger
        self.ingest_token = ingest_token
        self.allowed_origin = allowed_origin
        self.replay_limit = replay_limit
        self.max_resume_events = max_resume_events
        self.max_body_bytes = max_body_bytes
        self.static_dir = static_dir


def main():
    parser = argparse.ArgumentParser(description="Conscience64 append-only analytics ingestion + SSE service")
    parser.add_argument("--host", default=os.getenv("ANALYTICS_HOST", DEFAULT_HOST))
    parser.add_argument("--port", type=int, default=int(os.getenv("ANALYTICS_PORT", DEFAULT_PORT)))
    parser.add_argument("--ledger", default=os.getenv("ANALYTICS_LEDGER", "analytics/events.jsonl"))
    parser.add_argument("--token", default=os.getenv("ANALYTICS_INGEST_TOKEN", ""))
    parser.add_argument("--allow-origin", default=os.getenv("ANALYTICS_ALLOW_ORIGIN", ""))
    parser.add_argument("--allow-public-read", action="store_true", default=os.getenv("ANALYTICS_ALLOW_PUBLIC_READ", "") == "1")
    parser.add_argument("--replay-limit", type=int, default=int(os.getenv("ANALYTICS_REPLAY_LIMIT", "200")))
    parser.add_argument("--max-resume-events", type=int, default=int(os.getenv("ANALYTICS_MAX_RESUME_EVENTS", "10000")))
    parser.add_argument("--max-body-bytes", type=int, default=int(os.getenv("ANALYTICS_MAX_BODY_BYTES", "65536")))
    parser.add_argument("--static-dir", default=os.getenv("ANALYTICS_STATIC_DIR", str(Path(__file__).resolve().parent)))
    args = parser.parse_args()

    for name, value in (
        ("replay-limit", args.replay_limit),
        ("max-resume-events", args.max_resume_events),
        ("max-body-bytes", args.max_body_bytes),
    ):
        if value <= 0:
            raise SystemExit(f"--{name} must be positive")

    non_loopback = args.host not in LOOPBACK_HOSTS
    if non_loopback:
        if len(args.token) < 16:
            raise SystemExit("Refusing non-loopback bind without an ingestion token of at least 16 characters")
        if not args.allow_public_read:
            raise SystemExit(
                "Refusing non-loopback bind without --allow-public-read; the dashboard and SSE read path are unauthenticated"
            )

    static_dir = Path(args.static_dir).resolve()
    if not static_dir.is_dir():
        raise SystemExit(f"static directory does not exist: {static_dir}")

    ledger = EventLedger(Path(args.ledger))
    server = AnalyticsServer(
        (args.host, args.port), AnalyticsHandler, ledger, args.token,
        args.allow_origin, args.replay_limit, args.max_resume_events,
        args.max_body_bytes, static_dir,
    )
    print(f"analytics dashboard: http://{args.host}:{args.port}/")
    print(f"SSE endpoint: http://{args.host}:{args.port}/events")
    print(f"ledger: {Path(args.ledger).resolve()}")
    if non_loopback:
        print("warning: dashboard and SSE read path are intentionally public on the bound interface")
    server.serve_forever()


if __name__ == "__main__":
    main()
