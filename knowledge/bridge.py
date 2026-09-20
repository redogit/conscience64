#!/usr/bin/env python3
"""HTTP bridge for provenance-preserving Conscience64 knowledge packets."""

from __future__ import annotations

import argparse
import hmac
import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from .handoff import HandoffResponseLedger
from .ledger import KnowledgeLedger, LedgerCorruption
from .packet import is_private_method_origin

SERVICE_VERSION = "1.0.0"
LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8776


class Unauthorized(RuntimeError):
    pass


class BodyTooLarge(RuntimeError):
    pass


class KnowledgeBridgeServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, handler, *, ledger, response_ledger, write_token, read_token, max_body_bytes, max_batch):
        super().__init__(address, handler)
        self.ledger = ledger
        self.response_ledger = response_ledger
        self.write_token = write_token
        self.read_token = read_token
        self.max_body_bytes = max_body_bytes
        self.max_batch = max_batch


class KnowledgeBridgeHandler(BaseHTTPRequestHandler):
    server_version = "Conscience64KnowledgeBridge/1.0"

    def _common_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")

    def _json(self, status: int, payload) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self._common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _bearer_matches(self, token: str) -> bool:
        if not token:
            return False
        supplied = self.headers.get("Authorization", "")
        return hmac.compare_digest(supplied, f"Bearer {token}")

    def _require_write_auth(self) -> None:
        if not self._bearer_matches(self.server.write_token):
            raise Unauthorized()

    def _restricted_read_allowed(self) -> bool:
        supplied = self.headers.get("Authorization", "")
        if not supplied:
            return False
        token = self.server.read_token
        if token and hmac.compare_digest(supplied, f"Bearer {token}"):
            return True
        raise Unauthorized()

    def _read_json(self):
        if self.headers.get_content_type() != "application/json":
            raise ValueError("Content-Type must be application/json")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ValueError("invalid Content-Length") from exc
        if length <= 0:
            raise ValueError("request body is required")
        if length > self.server.max_body_bytes:
            raise BodyTooLarge()
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ValueError("invalid JSON body") from exc

    def do_POST(self):
        route = urlsplit(self.path).path
        if route not in {"/v1/knowledge", "/v1/knowledge/batch", "/v1/handoff-response"}:
            self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        try:
            self._require_write_auth()
            body = self._read_json()
            if route == "/v1/handoff-response":
                if not isinstance(body, dict):
                    raise ValueError("handoff response must be a JSON object")
                in_reply_to = body.get("in_reply_to")
                request_packet = self.server.ledger.get(
                    in_reply_to, include_restricted=True
                )
                if request_packet is None or not is_private_method_origin(request_packet):
                    raise ValueError(
                        "handoff response requires admitted private-method request"
                    )
                saved = self.server.response_ledger.append(body)
                self._json(HTTPStatus.ACCEPTED, saved)
                return

            if route == "/v1/knowledge":
                if not isinstance(body, dict):
                    raise ValueError("knowledge packet must be a JSON object")
                saved = self.server.ledger.append(body)
                self._json(HTTPStatus.ACCEPTED, saved)
                return

            if not isinstance(body, list):
                raise ValueError("batch body must be a JSON array")
            if not body or len(body) > self.server.max_batch:
                raise ValueError(f"batch size must be between 1 and {self.server.max_batch}")
            saved = self.server.ledger.append_many(body)
            self._json(HTTPStatus.ACCEPTED, {"items": saved, "count": len(saved)})
        except Unauthorized:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
        except BodyTooLarge:
            self._json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "body_too_large"})
        except ValueError as exc:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid_request", "detail": str(exc)})
        except LedgerCorruption as exc:
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "ledger_corruption", "detail": str(exc)})

    def do_GET(self):
        parsed = urlsplit(self.path)
        route = parsed.path
        if route == "/v1/health":
            try:
                count = self.server.ledger.validate()
                response_count = self.server.response_ledger.validate()
                self._json(HTTPStatus.OK, {
                    "status": "ok",
                    "entries": count,
                    "handoff_responses": response_count,
                    "version": SERVICE_VERSION,
                })
            except LedgerCorruption as exc:
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                    "status": "degraded", "error": "ledger_corruption", "detail": str(exc)
                })
            return

        handoff_prefix = "/v1/handoff-response/"
        if route.startswith(handoff_prefix) and len(route) > len(handoff_prefix):
            try:
                include_restricted = self._restricted_read_allowed()
                response_id = unquote(route[len(handoff_prefix):])
                item = self.server.response_ledger.get(
                    response_id, include_restricted=include_restricted
                )
                if item is None:
                    self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
                else:
                    self._json(HTTPStatus.OK, item)
            except Unauthorized:
                self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
            except (ValueError, TypeError) as exc:
                self._json(HTTPStatus.BAD_REQUEST, {
                    "error": "invalid_request", "detail": str(exc)
                })
            except LedgerCorruption as exc:
                self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {
                    "error": "ledger_corruption", "detail": str(exc)
                })
            return

        if not route.startswith("/v1/knowledge"):
            self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return

        try:
            include_restricted = self._restricted_read_allowed()
            query = parse_qs(parsed.query, keep_blank_values=False)
            if route == "/v1/knowledge/sync":
                after = int(query.get("after", ["0"])[0])
                limit = int(query.get("limit", ["100"])[0])
                items = self.server.ledger.sync(
                    after=after, limit=limit, include_restricted=include_restricted
                )
                self._json(HTTPStatus.OK, {"items": items, "count": len(items), "after": after})
                return

            if route == "/v1/knowledge/search":
                q = query.get("q", [""])[0]
                project = query.get("project", [None])[0]
                kind = query.get("kind", [None])[0]
                limit = int(query.get("limit", ["100"])[0])
                items = self.server.ledger.search(
                    q=q,
                    project=project,
                    kind=kind,
                    limit=limit,
                    include_restricted=include_restricted,
                )
                self._json(HTTPStatus.OK, {"items": items, "count": len(items)})
                return

            prefix = "/v1/knowledge/"
            if route.startswith(prefix) and len(route) > len(prefix):
                packet_uoid = unquote(route[len(prefix):])
                item = self.server.ledger.get(packet_uoid, include_restricted=include_restricted)
                if item is None:
                    self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
                else:
                    self._json(HTTPStatus.OK, item)
                return

            self._json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
        except Unauthorized:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
        except (ValueError, TypeError) as exc:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid_request", "detail": str(exc)})
        except LedgerCorruption as exc:
            self._json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "ledger_corruption", "detail": str(exc)})

    def log_message(self, fmt, *args):
        return


def build_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    ledger_path: Path | str = "knowledge/knowledge.jsonl",
    *,
    response_ledger_path: Path | str | None = None,
    write_token: str = "",
    read_token: str = "",
    max_body_bytes: int = 1024 * 1024,
    max_batch: int = 256,
) -> KnowledgeBridgeServer:
    if not isinstance(max_body_bytes, int) or max_body_bytes <= 0:
        raise ValueError("max_body_bytes must be positive")
    if not isinstance(max_batch, int) or max_batch <= 0 or max_batch > 1000:
        raise ValueError("max_batch must be between 1 and 1000")
    if host not in LOOPBACK_HOSTS:
        raise ValueError(
            "knowledge bridge v1 is loopback-only; remote serving requires a separate TLS/access-control deployment boundary"
        )
    if len(write_token) < 16:
        raise ValueError("write token must be at least 16 characters")
    if len(read_token) < 16:
        raise ValueError("read token must be at least 16 characters")

    if response_ledger_path is None:
        knowledge_path = Path(ledger_path)
        response_ledger_path = knowledge_path.with_name(
            knowledge_path.stem + ".handoff-responses.runtime.jsonl"
        )

    return KnowledgeBridgeServer(
        (host, port),
        KnowledgeBridgeHandler,
        ledger=KnowledgeLedger(ledger_path),
        response_ledger=HandoffResponseLedger(response_ledger_path),
        write_token=write_token,
        read_token=read_token,
        max_body_bytes=max_body_bytes,
        max_batch=max_batch,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Conscience64 direct knowledge bridge")
    parser.add_argument("--host", default=os.getenv("C64_KNOWLEDGE_HOST", DEFAULT_HOST))
    parser.add_argument("--port", type=int, default=int(os.getenv("C64_KNOWLEDGE_PORT", str(DEFAULT_PORT))))
    parser.add_argument("--ledger", default=os.getenv("C64_KNOWLEDGE_LEDGER", "knowledge/knowledge.jsonl"))
    parser.add_argument(
        "--response-ledger",
        default=os.getenv(
            "C64_HANDOFF_RESPONSE_LEDGER",
            "knowledge/handoff-responses.runtime.jsonl",
        ),
    )
    parser.add_argument("--write-token", default=os.getenv("C64_KNOWLEDGE_WRITE_TOKEN", ""))
    parser.add_argument("--read-token", default=os.getenv("C64_KNOWLEDGE_READ_TOKEN", ""))
    parser.add_argument("--max-body-bytes", type=int, default=int(os.getenv("C64_KNOWLEDGE_MAX_BODY_BYTES", str(1024 * 1024))))
    parser.add_argument("--max-batch", type=int, default=int(os.getenv("C64_KNOWLEDGE_MAX_BATCH", "256")))
    args = parser.parse_args()

    server = build_server(
        args.host,
        args.port,
        args.ledger,
        response_ledger_path=args.response_ledger,
        write_token=args.write_token,
        read_token=args.read_token,
        max_body_bytes=args.max_body_bytes,
        max_batch=args.max_batch,
    )
    host, port = server.server_address
    print(f"Conscience64 knowledge bridge: http://{host}:{port}")
    print(f"ledger: {Path(args.ledger).resolve()}")
    print(f"handoff response ledger: {Path(args.response_ledger).resolve()}")
    print("scope: v1 loopback-only")
    print("claim boundary: INGESTED != ACCEPTED_AS_FACT")
    server.serve_forever()


if __name__ == "__main__":
    main()
