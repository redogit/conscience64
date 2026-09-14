#!/usr/bin/env python3
import json
import tempfile
import threading
import unittest
from datetime import datetime
from http.client import HTTPConnection
from pathlib import Path

from server import AnalyticsHandler, AnalyticsServer, EventLedger


class EventLedgerTests(unittest.TestCase):
    def test_append_and_replay_preserve_event_and_browser_contract(self):
        with tempfile.TemporaryDirectory() as td:
            ledger = EventLedger(Path(td) / "events.jsonl")
            event = ledger.append({
                "kind": "OBSERVATION",
                "project": "test",
                "message": "measured",
                "evidence": "executed",
            })
            replay = ledger.replay()
            self.assertEqual(len(replay), 1)
            self.assertEqual(replay[0]["event_id"], event["event_id"])
            self.assertEqual(replay[0]["message"], "measured")
            self.assertEqual(event["source"], "analytics-ingest")
            self.assertEqual(event["status"], "recorded")
            self.assertTrue(event["time"].endswith("Z"))
            datetime.fromisoformat(event["time"].replace("Z", "+00:00"))


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        ledger = EventLedger(Path(self.tmp.name) / "events.jsonl")
        static_dir = Path(__file__).resolve().parent
        self.server = AnalyticsServer(
            ("127.0.0.1", 0), AnalyticsHandler, ledger,
            "secret", "", 20, 65536, static_dir,
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
        conn.close()
        return response.status, dict(response.getheaders()), payload

    def test_health(self):
        status, _, payload = self.request("GET", "/healthz")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(payload)["status"], "ok")

    def test_dashboard_is_served_same_origin(self):
        status, headers, payload = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn(b"Research Event Stream", payload)

    def test_post_requires_token(self):
        event = json.dumps({"kind":"TESTED","project":"test","message":"x","evidence":"executed"})
        status, _, _ = self.request("POST", "/events", event, {"Content-Type": "application/json"})
        self.assertEqual(status, 401)

    def test_post_accepts_valid_event(self):
        event = json.dumps({"kind":"TESTED","project":"test","message":"x","evidence":"executed"})
        status, _, payload = self.request("POST", "/events", event, {
            "Content-Type": "application/json",
            "Authorization": "Bearer secret",
        })
        self.assertEqual(status, 202)
        saved = json.loads(payload)
        self.assertEqual(saved["kind"], "TESTED")
        self.assertIn("event_id", saved)
        self.assertIn("time", saved)
        self.assertEqual(saved["status"], "recorded")

    def test_post_rejects_missing_required_field(self):
        event = json.dumps({"kind":"TESTED","project":"test","message":"x"})
        status, _, payload = self.request("POST", "/events", event, {
            "Content-Type": "application/json",
            "Authorization": "Bearer secret",
        })
        self.assertEqual(status, 400)
        self.assertIn("evidence", json.loads(payload)["error"])

    def test_post_rejects_unknown_kind(self):
        event = json.dumps({"kind":"MAGIC","project":"test","message":"x","evidence":"executed"})
        status, _, payload = self.request("POST", "/events", event, {
            "Content-Type": "application/json",
            "Authorization": "Bearer secret",
        })
        self.assertEqual(status, 400)
        self.assertIn("unknown event kind", json.loads(payload)["error"])


if __name__ == "__main__":
    unittest.main()
