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
    packet_module = importlib.import_module('knowledge.packet')
except ModuleNotFoundError:
    bridge = None
    packet_module = None

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



def private_method_packet(method='ABSTRACT_METHOD_HANDOFF_CANARY'):
    if packet_module is None:
        raise RuntimeError('knowledge.packet is not implemented yet')
    normalized = packet_module.make_private_method_packet(
        project='conscience64',
        method=method,
    )
    return {key: value for key, value in normalized.items() if key != 'packet_uoid'}


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

    def test_private_method_handoff_preserves_boundary_and_stays_concealed(self):
        private = private_method_packet()
        status, saved = self.request('POST', '/v1/knowledge', private, WRITE_TOKEN)
        self.assertEqual(status, 202)
        self.assertEqual(saved['kind'], 'METHOD')
        self.assertEqual(saved['source'], packet_module.PRIVATE_METHOD_SOURCE)
        self.assertEqual(saved['visibility'], 'restricted')
        self.assertEqual(
            saved['privacy_origin'],
            {
                'classification': packet_module.PRIVATE_METHOD_CLASSIFICATION,
                'independently_regrounded': False,
            },
        )
        self.assertEqual(saved['claim_ceiling'], packet_module.PRIVATE_METHOD_CLAIM_CEILING)
        uoid = saved['packet_uoid']

        status, body = self.request('GET', '/v1/knowledge/' + uoid)
        self.assertEqual(status, 404)
        self.assertEqual(body['error'], 'not_found')

        status, public_sync = self.request('GET', '/v1/knowledge/sync?after=0&limit=10')
        self.assertEqual(status, 200)
        self.assertEqual(public_sync['items'], [])

        status, public_search = self.request(
            'GET',
            '/v1/knowledge/search?q=ABSTRACT_METHOD_HANDOFF_CANARY&limit=10',
        )
        self.assertEqual(status, 200)
        self.assertEqual(public_search['items'], [])

        status, authorized = self.request('GET', '/v1/knowledge/' + uoid, token=READ_TOKEN)
        self.assertEqual(status, 200)
        self.assertEqual(authorized['content'], 'ABSTRACT_METHOD_HANDOFF_CANARY')
        self.assertEqual(authorized['privacy_origin'], saved['privacy_origin'])
        self.assertEqual(authorized['source'], packet_module.PRIVATE_METHOD_SOURCE)

    def test_private_method_target_can_return_restricted_structured_response(self):
        private = private_method_packet()
        status, saved = self.request('POST', '/v1/knowledge', private, WRITE_TOKEN)
        self.assertEqual(status, 202)

        response = {
            'in_reply_to': saved['packet_uoid'],
            'from': 'redogit/conscience64',
            'to': 'redogit/redogit',
            'status': 'NEEDS_EVIDENCE',
            'decision_reason': 'Current authorized project evidence is required before promotion.',
            'successor_refs': [],
            'evidence_refs': [],
            'unresolved': [],
            'privacy': {
                'classification': 'restricted',
                'privacy_origin': {
                    'classification': packet_module.PRIVATE_METHOD_CLASSIFICATION,
                    'independently_regrounded': False,
                },
            },
            'claim_ceiling': packet_module.PRIVATE_METHOD_CLAIM_CEILING,
            'way_back': [saved['packet_uoid']],
        }
        status, returned = self.request('POST', '/v1/handoff-response', response, WRITE_TOKEN)
        self.assertEqual(status, 202)
        self.assertEqual(returned['in_reply_to'], saved['packet_uoid'])
        self.assertEqual(returned['status'], 'NEEDS_EVIDENCE')
        self.assertEqual(returned['response_seq'], 1)

        status, hidden = self.request('GET', '/v1/handoff-response/' + returned['response_id'])
        self.assertEqual(status, 404)
        self.assertEqual(hidden['error'], 'not_found')

        status, authorized = self.request(
            'GET',
            '/v1/handoff-response/' + returned['response_id'],
            token=READ_TOKEN,
        )
        self.assertEqual(status, 200)
        self.assertEqual(authorized['response_id'], returned['response_id'])

    def test_handoff_response_requires_existing_private_method_request(self):
        unknown = {
            'in_reply_to': 'uoid:sha256:' + 'b' * 64,
            'from': 'redogit/conscience64',
            'to': 'redogit/redogit',
            'status': 'REJECTED',
            'decision_reason': 'No admitted request exists for this identifier.',
            'successor_refs': [],
            'evidence_refs': [],
            'unresolved': [],
            'privacy': {
                'classification': 'restricted',
                'privacy_origin': {
                    'classification': packet_module.PRIVATE_METHOD_CLASSIFICATION,
                    'independently_regrounded': False,
                },
            },
            'claim_ceiling': packet_module.PRIVATE_METHOD_CLAIM_CEILING,
            'way_back': ['uoid:sha256:' + 'b' * 64],
        }
        status, body = self.request('POST', '/v1/handoff-response', unknown, WRITE_TOKEN)
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], 'invalid_request')
        self.assertIn('admitted private-method request', body['detail'])

    def test_private_method_handoff_rejects_boundary_laundering(self):
        mutations = [
            ('visibility', 'public', 'restricted'),
            ('source', 'private-history:raw-source', 'non-identifying source'),
        ]
        for field, value, detail in mutations:
            with self.subTest(field=field):
                private = private_method_packet()
                private[field] = value
                status, body = self.request('POST', '/v1/knowledge', private, WRITE_TOKEN)
                self.assertEqual(status, 400)
                self.assertEqual(body['error'], 'invalid_request')
                self.assertIn(detail, body['detail'])

        private = private_method_packet()
        private['privacy_origin']['independently_regrounded'] = True
        status, body = self.request('POST', '/v1/knowledge', private, WRITE_TOKEN)
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], 'invalid_request')
        self.assertIn('pre-regrounding only', body['detail'])

        status, health = self.request('GET', '/v1/health')
        self.assertEqual(status, 200)
        self.assertEqual(health['entries'], 0)

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

    def test_loopback_requires_strong_read_token(self):
        if bridge is None:
            self.fail('knowledge.bridge is not implemented yet')
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / 'a.jsonl'
            with self.assertRaisesRegex(ValueError, 'read token'):
                bridge.build_server('127.0.0.1', 0, ledger, write_token=WRITE_TOKEN, read_token='')
            with self.assertRaisesRegex(ValueError, 'read token'):
                bridge.build_server('127.0.0.1', 0, ledger, write_token=WRITE_TOKEN, read_token='short')

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
