import importlib
import unittest


def load_module(testcase):
    try:
        return importlib.import_module('knowledge.packet')
    except ModuleNotFoundError:
        testcase.fail('knowledge.packet is not implemented yet')


BASE = {
    'project': 'operator-moonshot',
    'kind': 'HYPOTHESIS',
    'content': 'A bounded research hypothesis',
    'source': 'chatgpt:session',
    'visibility': 'restricted',
    'evidence': 'untested',
    'independence': 'same-source',
    'claim_ceiling': 'hypothesis only',
    'scope': 'bounded example',
    'observed_at': '2026-09-14T13:00:00Z',
    'tags': ['decision-field', 'hodge'],
}


class KnowledgePacketTests(unittest.TestCase):
    def test_normalize_packet_assigns_content_uoid_and_preserves_claim_boundaries(self):
        module = load_module(self)
        packet = module.normalize_packet(dict(BASE))
        self.assertRegex(packet['packet_uoid'], r'^uoid:sha256:[0-9a-f]{64}$')
        self.assertEqual(packet['kind'], 'HYPOTHESIS')
        self.assertEqual(packet['visibility'], 'restricted')
        self.assertEqual(packet['claim_ceiling'], 'hypothesis only')
        self.assertNotIn('ledger_seq', packet)
        self.assertNotIn('ingested_at', packet)

    def test_identical_normalized_payload_has_identical_uoid(self):
        module = load_module(self)
        a = module.normalize_packet(dict(BASE))
        shuffled = dict(reversed(list(BASE.items())))
        b = module.normalize_packet(shuffled)
        self.assertEqual(a['packet_uoid'], b['packet_uoid'])

    def test_rejects_unknown_kind_and_visibility(self):
        module = load_module(self)
        bad_kind = dict(BASE, kind='MAGIC_TRUTH')
        with self.assertRaisesRegex(ValueError, 'kind'):
            module.normalize_packet(bad_kind)
        bad_visibility = dict(BASE, visibility='secret-ish')
        with self.assertRaisesRegex(ValueError, 'visibility'):
            module.normalize_packet(bad_visibility)

    def test_rejects_producer_transport_identity(self):
        module = load_module(self)
        for field in ('packet_uoid', 'entry_id', 'ledger_seq', 'ingested_at'):
            with self.subTest(field=field):
                payload = dict(BASE)
                payload[field] = 'spoofed'
                with self.assertRaisesRegex(ValueError, field):
                    module.normalize_packet(payload)

    def test_normalizes_tags_and_parents_without_duplicates(self):
        module = load_module(self)
        payload = dict(BASE)
        payload['tags'] = [' hodge ', 'decision-field', 'hodge']
        payload['parents'] = ['uoid:sha256:' + 'a' * 64, 'uoid:sha256:' + 'a' * 64]
        packet = module.normalize_packet(payload)
        self.assertEqual(packet['tags'], ['decision-field', 'hodge'])
        self.assertEqual(packet['parents'], ['uoid:sha256:' + 'a' * 64])

    def test_rejects_non_object_metadata(self):
        module = load_module(self)
        with self.assertRaisesRegex(ValueError, 'metadata'):
            module.normalize_packet(dict(BASE, metadata=['not', 'an', 'object']))

    def test_verify_packet_uoid_detects_mutation(self):
        module = load_module(self)
        packet = module.normalize_packet(dict(BASE))
        self.assertTrue(module.verify_packet_uoid(packet))
        packet['content'] = 'mutated after hashing'
        self.assertFalse(module.verify_packet_uoid(packet))


    def test_private_method_helper_builds_non_identifying_restricted_carrier(self):
        module = load_module(self)
        packet = module.make_private_method_packet(
            project='operator-moonshot',
            method='Compare alternatives with the cheapest independent counter-probe.',
        )
        self.assertTrue(module.is_private_method_origin(packet))
        self.assertEqual(packet['kind'], 'METHOD')
        self.assertEqual(packet['source'], 'private-history:withheld')
        self.assertEqual(packet['visibility'], 'restricted')
        self.assertFalse(packet['privacy_origin']['independently_regrounded'])
        self.assertEqual(packet['evidence'], 'method-only; not project evidence')
        self.assertEqual(packet['claim_ceiling'], 'abstract method only; no source or identity claim')
        self.assertTrue(module.verify_packet_uoid(packet))

    def test_private_method_uoid_requires_only_abstract_method_carrier(self):
        module = load_module(self)
        a = module.make_private_method_packet(
            project='operator-moonshot',
            method='Preserve failure provenance before revising a reusable method.',
        )
        b = module.make_private_method_packet(
            project='operator-moonshot',
            method='Preserve failure provenance before revising a reusable method.',
        )
        self.assertEqual(a['packet_uoid'], b['packet_uoid'])
        encoded = module.canonical_json(a)
        self.assertNotIn('chatgpt:session', encoded)
        self.assertNotIn('source_revision', encoded)
        self.assertNotIn('observed_at', encoded)
        self.assertNotIn('parents', encoded)
        self.assertNotIn('metadata', encoded)

    def test_private_method_carrier_rejects_source_pointer_and_public_visibility(self):
        module = load_module(self)
        packet = {
            'project': 'operator-moonshot',
            'kind': 'METHOD',
            'content': 'Abstract reusable method',
            'source': 'private-history:source-pointer',
            'visibility': 'restricted',
            'evidence': module.PRIVATE_METHOD_EVIDENCE,
            'independence': module.PRIVATE_METHOD_INDEPENDENCE,
            'claim_ceiling': module.PRIVATE_METHOD_CLAIM_CEILING,
            'scope': module.PRIVATE_METHOD_SCOPE,
            'privacy_origin': {
                'classification': module.PRIVATE_METHOD_CLASSIFICATION,
                'independently_regrounded': False,
            },
        }
        with self.assertRaisesRegex(ValueError, 'non-identifying source'):
            module.normalize_packet(packet)

        packet['source'] = module.PRIVATE_METHOD_SOURCE
        packet['visibility'] = 'public'
        with self.assertRaisesRegex(ValueError, 'must remain restricted'):
            module.normalize_packet(packet)

    def test_private_method_carrier_rejects_auxiliary_laundering_channels(self):
        module = load_module(self)
        base = {
            'project': 'operator-moonshot',
            'kind': 'METHOD',
            'content': 'Abstract reusable method',
            'source': module.PRIVATE_METHOD_SOURCE,
            'visibility': 'restricted',
            'evidence': module.PRIVATE_METHOD_EVIDENCE,
            'independence': module.PRIVATE_METHOD_INDEPENDENCE,
            'claim_ceiling': module.PRIVATE_METHOD_CLAIM_CEILING,
            'scope': module.PRIVATE_METHOD_SCOPE,
            'privacy_origin': {
                'classification': module.PRIVATE_METHOD_CLASSIFICATION,
                'independently_regrounded': False,
            },
        }
        smuggle_values = {
            'metadata': {'note': 'source-like detail'},
            'tags': ['source-like-detail'],
            'parents': ['uoid:sha256:' + 'a' * 64],
            'source_revision': 'source-like-revision',
            'observed_at': '2026-09-19T00:00:00Z',
        }
        for field, value in smuggle_values.items():
            with self.subTest(field=field):
                payload = dict(base)
                payload[field] = value
                with self.assertRaisesRegex(ValueError, 'forbids auxiliary'):
                    module.normalize_packet(payload)

    def test_private_origin_marker_cannot_encode_free_text_or_claim_regrounding(self):
        module = load_module(self)
        base = {
            'project': 'operator-moonshot',
            'kind': 'METHOD',
            'content': 'Abstract reusable method',
            'source': module.PRIVATE_METHOD_SOURCE,
            'visibility': 'restricted',
            'evidence': module.PRIVATE_METHOD_EVIDENCE,
            'independence': module.PRIVATE_METHOD_INDEPENDENCE,
            'claim_ceiling': module.PRIVATE_METHOD_CLAIM_CEILING,
            'scope': module.PRIVATE_METHOD_SCOPE,
        }
        payload = dict(base, privacy_origin={
            'classification': module.PRIVATE_METHOD_CLASSIFICATION,
            'independently_regrounded': False,
            'note': 'free-text origin detail',
        })
        with self.assertRaisesRegex(ValueError, 'unknown privacy_origin'):
            module.normalize_packet(payload)

        payload = dict(base, privacy_origin={
            'classification': module.PRIVATE_METHOD_CLASSIFICATION,
            'independently_regrounded': True,
        })
        with self.assertRaisesRegex(ValueError, 'pre-regrounding only'):
            module.normalize_packet(payload)


if __name__ == '__main__':
    unittest.main()
