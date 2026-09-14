import importlib
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

try:
    bridge = importlib.import_module('knowledge.bridge')
except ModuleNotFoundError:
    bridge = None

WRITE_TOKEN = 'write-token-1234567890'
READ_TOKEN = 'read-token-12345678901'


def packet(content, visibility='public', kind='REFERENCE'):
    return {
        'project': 'conscience64',
        'kind': kind,
        'content': content,
        'source': 'bridge-test',
        'visibility': visibility,
        'evidence': 'source-material',
        'independence': 'same-source',
        'claim_ceiling': 'retrieval only',
    }


class BridgeIntegrationTests(unittest.TestCase):
    def setUp(self):
        if bridge is None:
            self.fail('knowledge.bridge is not implemented yet')
        self.tmp = tempfile.TemporaryDirectory()
        self.server = bridge.build_server(
            host='127.0.0.1',
            port=0,
            ledger_path=Path(self.tmp.name) / 'knowledge.jsonl',
            write_token=WRITE_TOKEN,
            read_token=READ_TOKEN,
            max_body_bytes=4096,
            max_batch=8,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.server.server_address
        self.base = f'http://{host}:{port}'

    def tearDown(self):
        if bridge is not None and hasattr(self, 'server'):
            self.server.shutdown()
            self.server.server_close()
            self.thread.join(timeout=2)
        if hasattr(self, 'tmp'):
            self.tmp.cleanup()

    def request(self, method, path, body=None, token=None, content_type='application/json'):
        data = None if body is None else json.dumps(body).encode('utf-8')
        headers = {}
        if data is not None:
            headers['Content-Type'] = content_type
        if token:
            headers['Authorization'] = f'Bearer {token}'
        req = Request(self.base + path, data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=3) as response:
                return response.status, json.loads(response.read().decode('utf-8'))
        except HTTPError as exc:
            return exc.code, json.loads(exc.read().decode('utf-8'))

    def test_authenticated_post_and_health(self):
        status, saved = self.request('POST', '/v1/knowledge', packet('hello'), WRITE_TOKEN)
        self.assertEqual(status, 202)
        self.assertEqual(saved['ledger_seq'], 1)
        status, health = self.request('GET', '/v1/health')
        self.assertEqual(status, 200)
        self.assertEqual(health['status'], 'ok')
        self.assertEqual(health['entries'], 1)

    def test_bad_write_token_is_rejected(self):
        status, body = self.request('POST', '/v1/knowledge', packet('nope'), 'wrong-token')
        self.assertEqual(status, 401)
        self.assertEqual(body['error'], 'unauthorized')

    def test_restricted_packet_is_concealed_without_read_auth_and_visible_with_it(self):
        _, restricted = self.request('POST', '/v1/knowledge', packet('private carrier', 'restricted'), WRITE_TOKEN)
        uoid = restricted['packet_uoid']
        status, _ = self.request('GET', '/v1/knowledge/' + uoid)
        self.assertEqual(status, 404)
        status, found = self.request('GET', '/v1/knowledge/' + uoid, token=READ_TOKEN)
        self.assertEqual(status, 200)
        self.assertEqual(found['content'], 'private carrier')

    def test_public_sync_excludes_restricted_but_authorized_sync_includes_it(self):
        self.request('POST', '/v1/knowledge', packet('public carrier'), WRITE_TOKEN)
        self.request('POST', '/v1/knowledge', packet('private carrier', 'restricted'), WRITE_TOKEN)
        status, public = self.request('GET', '/v1/knowledge/sync?after=0&limit=10')
        self.assertEqual(status, 200)
        self.assertEqual([row['content'] for row in public['items']], ['public carrier'])
        status, all_rows = self.request('GET', '/v1/knowledge/sync?after=0&limit=10', token=READ_TOKEN)
        self.assertEqual(status, 200)
        self.assertEqual([row['content'] for row in all_rows['items']], ['public carrier', 'private carrier'])

    def test_search_filters_and_invalid_read_token_is_not_silently_downgraded(self):
        self.request('POST', '/v1/knowledge', packet('decision field method', kind='METHOD'), WRITE_TOKEN)
        self.request('POST', '/v1/knowledge', packet('decision field secret', 'restricted', 'HYPOTHESIS'), WRITE_TOKEN)
        status, result = self.request('GET', '/v1/knowledge/search?q=decision%20field&kind=METHOD&limit=5')
        self.assertEqual(status, 200)
        self.assertEqual(len(result['items']), 1)
        self.assertEqual(result['items'][0]['kind'], 'METHOD')
        status, body = self.request('GET', '/v1/knowledge/search?q=decision', token='bad-read-token')
        self.assertEqual(status, 401)
        self.assertEqual(body['error'], 'unauthorized')

    def test_batch_validation_is_atomic_over_http(self):
        bad = packet('bad')
        bad['visibility'] = 'mystery'
        status, _ = self.request('POST', '/v1/knowledge/batch', [packet('good'), bad], WRITE_TOKEN)
        self.assertEqual(status, 400)
        status, health = self.request('GET', '/v1/health')
        self.assertEqual(health['entries'], 0)

    def test_oversized_body_is_rejected(self):
        huge = packet('x' * 5000)
        status, body = self.request('POST', '/v1/knowledge', huge, WRITE_TOKEN)
        self.assertEqual(status, 413)
        self.assertEqual(body['error'], 'body_too_large')


class BridgeExposureGuardTests(unittest.TestCase):
    def test_loopback_requires_strong_write_token(self):
        if bridge is None:
            self.fail('knowledge.bridge is not implemented yet')
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / 'a.jsonl'
            with self.assertRaisesRegex(ValueError, 'write token'):
                bridge.build_server('127.0.0.1', 0, ledger, write_token='', read_token=READ_TOKEN)
            with self.assertRaisesRegex(ValueError, 'write token'):
                bridge.build_server('127.0.0.1', 0, ledger, write_token='short', read_token=READ_TOKEN)

    def test_non_loopback_is_rejected_even_with_strong_tokens(self):
        if bridge is None:
            self.fail('knowledge.bridge is not implemented yet')
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, 'loopback-only'):
                bridge.build_server(
                    '0.0.0.0',
                    0,
                    Path(tmp) / 'a.jsonl',
                    write_token=WRITE_TOKEN,
                    read_token=READ_TOKEN,
                )


if __name__ == '__main__':
    unittest.main()
