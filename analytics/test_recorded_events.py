#!/usr/bin/env python3
import json
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path

from server import AnalyticsHandler, AnalyticsServer, EventLedger, normalize_event

HERE = Path(__file__).resolve().parent
RECORDED = HERE / "recorded-events"
TOKEN = "0123456789abcdef"


def fixtures():
    return [(path, json.loads(path.read_text(encoding="utf-8"))) for path in sorted(RECORDED.glob("*.json"))]


class RecordedEventCorpusTests(unittest.TestCase):
    def test_every_recorded_event_has_provenance_and_contract_shape(self):
        rows = fixtures()
        self.assertGreaterEqual(len(rows), 2)
        revisions = set()
        for path, event in rows:
            with self.subTest(path=path.name):
                checked = normalize_event(event)
                self.assertTrue(event.get("source"))
                self.assertTrue(event.get("scope"))
                self.assertIn(event.get("independence"), {"same-source", "independent-source", "independent-execution"})
                if "revision" in event:
                    self.assertRegex(event["revision"], r"^[0-9a-f]{40}$")
                    revisions.add(event["revision"])
                self.assertEqual(checked["source"], event["source"])
                self.assertEqual(checked["status"], event["status"])
        self.assertGreaterEqual(len(revisions), 2)

    def test_every_recorded_event_traverses_http_ingestion_and_replay(self):
        rows = fixtures()
        with tempfile.TemporaryDirectory() as td:
            ledger = EventLedger(Path(td) / "events.jsonl")
            server = AnalyticsServer(("127.0.0.1", 0), AnalyticsHandler, ledger, TOKEN, "", 50, 1000, 65536, HERE)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                port = server.server_address[1]
                accepted = []
                for path, event in rows:
                    with self.subTest(path=path.name):
                        conn = HTTPConnection("127.0.0.1", port, timeout=2)
                        conn.request("POST", "/events", body=json.dumps(event), headers={
                            "Authorization": f"Bearer {TOKEN}",
                            "Content-Type": "application/json",
                        })
                        response = conn.getresponse()
                        payload = json.loads(response.read())
                        conn.close()
                        self.assertEqual(response.status, 202)
                        self.assertEqual(payload["source"], event["source"])
                        self.assertEqual(payload["status"], event["status"])
                        self.assertEqual(payload["independence"], event["independence"])
                        if "revision" in event:
                            self.assertEqual(payload["revision"], event["revision"])
                        accepted.append(payload["event_id"])
                replay = ledger.replay()
                self.assertEqual([event["event_id"] for event in replay], accepted)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
