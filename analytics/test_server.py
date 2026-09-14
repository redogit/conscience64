#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path

from server import (
    EVENT_KINDS,
    AnalyticsHandler,
    AnalyticsServer,
    EventLedger,
    LedgerCorruption,
    ResumeError,
    normalize_event,
)


HERE = Path(__file__).resolve().parent


class EventLedgerTests(unittest.TestCase):
    def test_append_and_replay_preserve_browser_contract(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = EventLedger(Path(td) / "events.jsonl")
            event = ledger.append(normalize_event({
                "kind": "OBSERVATION",
                "project": "test",
                "message": "measured",
                "evidence": "executed",
            }))
            replay = ledger.replay()
            self.assertEqual(len(replay), 1)
            self.assertEqual(replay[0]["event_id"], event["event_id"])
            self.assertEqual(replay[0]["message"], "measured")
            self.assertEqual(event["source"], "analytics-ingest")
            self.assertEqual(event["status"], "recorded")
            self.assertTrue(event["time"].endswith("Z"))
            self.assertIsInstance(event["time_unix_ms"], int)

    def test_producer_event_id_is_not_ledger_identity(self):
        event = normalize_event({
            "kind": "TESTED",
            "project": "test",
            "message": "producer supplied an id",
            "evidence": "executed",
            "event_id": "producer-123",
        })
        self.assertEqual(event["producer_event_id"], "producer-123")
        self.assertNotEqual(event["event_id"], "producer-123")

    def test_invalid_provided_contract_fields_fail_before_append(self):
        with self.assertRaisesRegex(ValueError, "time must be"):
            normalize_event({
                "kind": "TESTED",
                "project": "test",
                "message": "bad time",
                "evidence": "executed",
                "time": "not-a-time",
            })
        with self.assertRaisesRegex(ValueError, "source"):
            normalize_event({
                "kind": "TESTED",
                "project": "test",
                "message": "bad source",
                "evidence": "executed",
                "source": "",
            })

    def test_resume_is_gap_free_across_subscription_boundary(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = EventLedger(Path(td) / "events.jsonl")
            first = ledger.append(normalize_event({
                "kind": "OBSERVATION", "project": "test", "message": "one", "evidence": "executed",
            }))
            second = ledger.append(normalize_event({
                "kind": "OBSERVATION", "project": "test", "message": "two", "evidence": "executed",
            }))
            replay, subscriber = ledger.replay_and_subscribe(last_event_id=first["event_id"])
            try:
                self.assertEqual([event["event_id"] for event in replay], [second["event_id"]])
                third = ledger.append(normalize_event({
                    "kind": "OBSERVATION", "project": "test", "message": "three", "evidence": "executed",
                }))
                delivered = subscriber.queue.get(timeout=1)
                self.assertEqual(delivered["event_id"], third["event_id"])
            finally:
                ledger.unsubscribe(subscriber)

    def test_unknown_resume_id_fails_instead_of_silently_skipping(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = EventLedger(Path(td) / "events.jsonl")
            ledger.append(normalize_event({
                "kind": "OBSERVATION", "project": "test", "message": "one", "evidence": "executed",
            }))
            with self.assertRaises(ResumeError):
                ledger.replay_and_subscribe(last_event_id="missing")

    def test_corrupt_ledger_is_visible(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "events.jsonl"
            path.write_text('{"kind":"OBSERVATION"}\nnot-json\n', encoding="utf-8")
            ledger = EventLedger(path)
            with self.assertRaises(LedgerCorruption):
                ledger.replay()

    def test_python_kind_set_matches_browser_contract(self):
        source = (HERE / "event-contract.mjs").read_text(encoding="utf-8")
        match = re.search(r"EVENT_KINDS\s*=\s*Object\.freeze\(\[(.*?)\]\);", source, re.S)
        self.assertIsNotNone(match)
        browser_kinds = set(re.findall(r"'([A-Z_]+)'", match.group(1)))
        self.assertEqual(browser_kinds, EVENT_KINDS)


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        ledger = EventLedger(Path(self.tmp.name) / "events.jsonl")
        self.server = AnalyticsServer(
            ("127.0.0.1", 0), AnalyticsHandler, ledger,
            "0123456789abcdef", "", 20, 1000, 65536, HERE,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.tmp.cleanup()

    def request(self, method, path, body=None, headers=None):
        conn = HTTPConnection("127.0.0.1", self.port, timeout=2)
        conn.request(method, path, body=body, headers=headers or {})
        response = conn.getresponse()
        payload = response.read()
        result = response.status, dict(response.getheaders()), payload
        conn.close()
        return result

    def post_event(self, event, token="0123456789abcdef"):
        return self.request("POST", "/events", json.dumps(event), {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        })

    def test_health(self):
        status, _, payload = self.request("GET", "/healthz")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload), {"status": "ok", "events": 0})

    def test_health_reports_corruption(self):
        self.server.ledger.path.write_text("not-json\n", encoding="utf-8")
        status, _, payload = self.request("GET", "/healthz")
        self.assertEqual(status, 500)
        self.assertEqual(json.loads(payload)["error"], "ledger_corruption")

    def test_dashboard_is_served_same_origin_with_security_headers(self):
        status, headers, payload = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn(b"Research Event Stream", payload)
        self.assertIn("default-src 'self'", headers["Content-Security-Policy"])
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")

    def test_post_requires_token(self):
        event = {"kind":"TESTED","project":"test","message":"x","evidence":"executed"}
        status, _, _ = self.request("POST", "/events", json.dumps(event), {"Content-Type": "application/json"})
        self.assertEqual(status, 401)

    def test_post_requires_json_content_type(self):
        event = json.dumps({"kind":"TESTED","project":"test","message":"x","evidence":"executed"})
        status, _, payload = self.request("POST", "/events", event, {
            "Authorization": "Bearer 0123456789abcdef",
            "Content-Type": "text/plain",
        })
        self.assertEqual(status, 415)
        self.assertIn("application/json", json.loads(payload)["error"])

    def test_post_accepts_valid_event_and_assigns_canonical_id(self):
        event = {
            "kind":"TESTED", "project":"test", "message":"x", "evidence":"executed",
            "event_id":"producer-id", "source":"unit-test", "status":"passed",
            "time":"2026-09-14T05:12:43Z",
        }
        status, _, payload = self.post_event(event)
        self.assertEqual(status, 202)
        saved = json.loads(payload)
        self.assertEqual(saved["kind"], "TESTED")
        self.assertEqual(saved["producer_event_id"], "producer-id")
        self.assertNotEqual(saved["event_id"], "producer-id")
        self.assertEqual(saved["status"], "passed")

    def test_post_rejects_missing_required_field(self):
        status, _, payload = self.post_event({"kind":"TESTED","project":"test","message":"x"})
        self.assertEqual(status, 400)
        self.assertIn("evidence", json.loads(payload)["error"])

    def test_post_rejects_unknown_kind(self):
        status, _, payload = self.post_event({"kind":"MAGIC","project":"test","message":"x","evidence":"executed"})
        self.assertEqual(status, 400)
        self.assertIn("unknown event kind", json.loads(payload)["error"])

    def test_post_rejects_invalid_provided_time(self):
        status, _, payload = self.post_event({
            "kind":"TESTED", "project":"test", "message":"x", "evidence":"executed", "time":"yesterday-ish",
        })
        self.assertEqual(status, 400)
        self.assertIn("ISO-8601", json.loads(payload)["error"])

    def test_missing_last_event_id_returns_explicit_resume_gap(self):
        status, _, payload = self.request("GET", "/events", headers={"Last-Event-ID": "missing"})
        self.assertEqual(status, 409)
        self.assertEqual(json.loads(payload)["error"], "resume_gap")

    def test_real_consolidation_event_traverses_ingestion_and_ledger(self):
        fixture = json.loads((HERE / "recorded-events" / "2026-09-14-consolidation.json").read_text(encoding="utf-8"))
        status, _, payload = self.post_event(fixture)
        self.assertEqual(status, 202)
        saved = json.loads(payload)
        self.assertEqual(saved["revision"], "0e213a5d8dd685876d94600c443342d257363006")
        self.assertEqual(saved["source"], "github-actions:34808700520")
        self.assertEqual(saved["independence"], "same-source")
        replay = self.server.ledger.replay()
        self.assertEqual(replay[-1]["event_id"], saved["event_id"])


class StartupBoundaryTests(unittest.TestCase):
    def run_server(self, *args, env=None):
        command = [sys.executable, str(HERE / "server.py"), "--port", "0", *args]
        return subprocess.run(
            command,
            cwd=HERE.parent,
            env=env,
            text=True,
            capture_output=True,
            timeout=5,
            check=False,
        )

    def test_non_loopback_requires_strong_ingest_token(self):
        result = self.run_server("--host", "0.0.0.0", env={})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ingestion token", result.stderr + result.stdout)

    def test_non_loopback_requires_explicit_public_read_acknowledgement(self):
        env = dict(os.environ)
        env["ANALYTICS_INGEST_TOKEN"] = "0123456789abcdef"
        result = self.run_server("--host", "0.0.0.0", env=env)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("allow-public-read", result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
