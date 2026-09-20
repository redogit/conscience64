import importlib
import tempfile
import unittest
from pathlib import Path

try:
    handoff = importlib.import_module('knowledge.handoff')
except ModuleNotFoundError:
    handoff = None

REQUEST_UOID = 'uoid:sha256:' + 'a' * 64


class HandoffResponseTests(unittest.TestCase):
    def require_module(self):
        if handoff is None:
            self.fail('knowledge.handoff is not implemented yet')
        return handoff

    def test_private_method_response_is_deterministic_restricted_and_linked(self):
        module = self.require_module()
        response = module.make_private_method_response(
            in_reply_to=REQUEST_UOID,
            from_party='redogit/conscience64',
            to_party='redogit/redogit',
            status='NEEDS_EVIDENCE',
            decision_reason='Current authorized project evidence is required before promotion.',
        )
        same = module.make_private_method_response(
            in_reply_to=REQUEST_UOID,
            from_party='redogit/conscience64',
            to_party='redogit/redogit',
            status='NEEDS_EVIDENCE',
            decision_reason='Current authorized project evidence is required before promotion.',
        )
        self.assertEqual(response['response_id'], same['response_id'])
        self.assertTrue(module.verify_handoff_response_id(response))
        self.assertEqual(response['in_reply_to'], REQUEST_UOID)
        self.assertEqual(response['status'], 'NEEDS_EVIDENCE')
        self.assertEqual(response['privacy']['classification'], 'restricted')
        self.assertEqual(
            response['privacy']['privacy_origin'],
            {'classification': 'private-history-method-only', 'independently_regrounded': False},
        )
        self.assertEqual(response['successor_refs'], [])
        self.assertEqual(response['evidence_refs'], [])
        self.assertEqual(response['unresolved'], [])
        self.assertEqual(response['way_back'], [REQUEST_UOID])
        self.assertEqual(response['claim_ceiling'], 'abstract method only; no source or identity claim')

    def test_private_method_response_rejects_privacy_or_claim_laundering(self):
        module = self.require_module()
        response = module.make_private_method_response(
            in_reply_to=REQUEST_UOID,
            from_party='redogit/conscience64',
            to_party='redogit/redogit',
            status='ACCEPTED',
            decision_reason='Accepted only as a restricted method carrier.',
        )
        producer = {k: v for k, v in response.items() if k != 'response_id'}

        public = dict(producer)
        public['privacy'] = {'classification': 'public'}
        with self.assertRaisesRegex(ValueError, 'restricted'):
            module.normalize_handoff_response(public)

        regrounded = dict(producer)
        regrounded['privacy'] = {
            'classification': 'restricted',
            'privacy_origin': {
                'classification': 'private-history-method-only',
                'independently_regrounded': True,
            },
        }
        with self.assertRaisesRegex(ValueError, 'pre-regrounding'):
            module.normalize_handoff_response(regrounded)

        promoted = dict(producer)
        promoted['claim_ceiling'] = 'verified project evidence'
        with self.assertRaisesRegex(ValueError, 'claim ceiling'):
            module.normalize_handoff_response(promoted)

        injected = dict(producer)
        injected['private_source'] = 'PRIVATE_STORY_CANARY'
        with self.assertRaisesRegex(ValueError, 'unknown field'):
            module.normalize_handoff_response(injected)

    def test_response_ledger_is_append_only_idempotent_and_concealed(self):
        module = self.require_module()
        response = module.make_private_method_response(
            in_reply_to=REQUEST_UOID,
            from_party='redogit/conscience64',
            to_party='redogit/redogit',
            status='UNRESOLVED',
            decision_reason='The target cannot resolve the request from current authorized evidence.',
        )
        producer = {k: v for k, v in response.items() if k != 'response_id'}
        with tempfile.TemporaryDirectory() as tmp:
            ledger = module.HandoffResponseLedger(Path(tmp) / 'responses.jsonl')
            first = ledger.append(producer)
            second = ledger.append(producer)
            self.assertEqual(first['response_id'], response['response_id'])
            self.assertEqual(first['response_seq'], 1)
            self.assertEqual(second['response_seq'], 1)
            self.assertEqual(ledger.validate(), 1)
            self.assertIsNone(ledger.get(first['response_id']))
            authorized = ledger.get(first['response_id'], include_restricted=True)
            self.assertEqual(authorized['in_reply_to'], REQUEST_UOID)
            self.assertEqual(authorized['status'], 'UNRESOLVED')


if __name__ == '__main__':
    unittest.main()
