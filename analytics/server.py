#!/usr/bin/env python3
import argparse
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
REQUIRED_FIELDS = {"kind", "project", "message", "evidence"}
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/dashboard.mjs": ("dashboard.mjs", "text/javascript; charset=utf-8"),
    "/event-contract.mjs": ("event-contract.mjs", "text/javascript; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
}


def iso_utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class EventLedger:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.subscribers = set()

    def append(self, event):
        event = dict(event)
        event.setdefault("event_id", str(uuid.uuid4()))
        event.setdefault("time", iso_utc_now())
        event.setdefault("time_unix_ms", str(int(time.time() * 1000)))
        event.setdefault("source", "analytics-ingest")
        event.setdefault("status", "recorded")
        line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
        with self.lock:
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(line + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            subscribers = tuple(self.subscribers)
        for subscriber in subscribers:
            try:
                subscriber.put_nowait(event)
            except queue.Full:
                pass
        return event

    def replay(self, limit=200):
        if not self.path.exists():
            return []
        with self.lock:
            lines = self.path.read_text(encoding="utf-8").splitlines()
        out = []
        for line in lines[-limit:]:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return out

    def subscribe(self):
        q = queue.Queue(maxsize=512)
        with self.lock:
            self.subscribers.add(q)
        return q

    def unsubscribe(self, q):
        with self.lock:
            self.subscribers.discard(q)


class AnalyticsHandler(BaseHTTPRequestHandler):
    server_version = "Conscience64Analytics/1.1"

    def _cors(self):
        origin = self.server.allowed_origin
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
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
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors()
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
            if auth != f"Bearer {token}":
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
                return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > self.server.max_body_bytes:
                raise ValueError("invalid content length")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("event must be a JSON object")
            missing = sorted(REQUIRED_FIELDS - payload.keys())
            if missing:
                raise ValueError("missing required fields: " + ", ".join(missing))
            if payload["kind"] not in EVENT_KINDS:
                raise ValueError("unknown event kind")
            for field in REQUIRED_FIELDS:
                if not isinstance(payload[field], str) or not payload[field].strip():
                    raise ValueError(f"invalid field: {field}")
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            self._json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        event = self.server.ledger.append(payload)
        self._json(HTTPStatus.ACCEPTED, event)

    def do_GET(self):
        route = urlsplit(self.path).path
        if route == "/healthz":
            self._json(HTTPStatus.OK, {"status": "ok"})
            return
        if route == "/events":
            self._serve_sse()
            return
        if route in STATIC_FILES:
            self._static(route)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def _serve_sse(self):
        self.send_response(HTTPStatus.OK)
        self._cors()
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            for event in self.server.ledger.replay(self.server.replay_limit):
                self._write_sse(event)
            subscriber = self.server.ledger.subscribe()
            try:
                while True:
                    try:
                        event = subscriber.get(timeout=15)
                        self._write_sse(event)
                    except queue.Empty:
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
            finally:
                self.server.ledger.unsubscribe(subscriber)
        except (BrokenPipeError, ConnectionResetError):
            return

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

    def __init__(self, address, handler, ledger, ingest_token, allowed_origin, replay_limit, max_body_bytes, static_dir):
        super().__init__(address, handler)
        self.ledger = ledger
        self.ingest_token = ingest_token
        self.allowed_origin = allowed_origin
        self.replay_limit = replay_limit
        self.max_body_bytes = max_body_bytes
        self.static_dir = static_dir


def main():
    parser = argparse.ArgumentParser(description="Conscience64 append-only analytics ingestion + SSE service")
    parser.add_argument("--host", default=os.getenv("ANALYTICS_HOST", DEFAULT_HOST))
    parser.add_argument("--port", type=int, default=int(os.getenv("ANALYTICS_PORT", DEFAULT_PORT)))
    parser.add_argument("--ledger", default=os.getenv("ANALYTICS_LEDGER", "analytics/events.jsonl"))
    parser.add_argument("--token", default=os.getenv("ANALYTICS_INGEST_TOKEN", ""))
    parser.add_argument("--allow-origin", default=os.getenv("ANALYTICS_ALLOW_ORIGIN", ""))
    parser.add_argument("--replay-limit", type=int, default=int(os.getenv("ANALYTICS_REPLAY_LIMIT", "200")))
    parser.add_argument("--max-body-bytes", type=int, default=int(os.getenv("ANALYTICS_MAX_BODY_BYTES", "65536")))
    parser.add_argument("--static-dir", default=os.getenv("ANALYTICS_STATIC_DIR", str(Path(__file__).resolve().parent)))
    args = parser.parse_args()

    if args.host not in {"127.0.0.1", "localhost", "::1"} and not args.token:
        raise SystemExit("Refusing non-loopback bind without ANALYTICS_INGEST_TOKEN / --token")

    static_dir = Path(args.static_dir).resolve()
    ledger = EventLedger(Path(args.ledger))
    server = AnalyticsServer(
        (args.host, args.port), AnalyticsHandler, ledger, args.token,
        args.allow_origin, args.replay_limit, args.max_body_bytes, static_dir,
    )
    print(f"analytics dashboard: http://{args.host}:{args.port}/")
    print(f"SSE endpoint: http://{args.host}:{args.port}/events")
    print(f"ledger: {Path(args.ledger).resolve()}")
    server.serve_forever()


if __name__ == "__main__":
    main()
