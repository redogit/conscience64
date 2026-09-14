import json
import tempfile
import unittest
from pathlib import Path
import importlib

try:
    _ledger_module = importlib.import_module('knowledge.ledger')
except ModuleNotFoundError:
    _ledger_module = None

KnowledgeLedger = getattr(_ledger_module, 'KnowledgeLedger', None)
LedgerCorruption = getattr(_ledger_module, 'LedgerCorruption', RuntimeError)


def payload(content='public note', visibility='public', kind='REFERENCE', project='conscience64'):
    return {
        'project': project,
        'kind': kind,
        'content': content,
        'source': 'test-suite',
        'visibility': visibility,
        'evidence': 'source-material',
        'independence': 'same-source',
        'claim_ceiling': 'retrieval only',
    }


class KnowledgeLedgerTests(unittest.TestCase):
    def setUp(self):
        if KnowledgeLedger is None:
            self.fail('knowledge.ledger is not implemented yet')
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'knowledge.jsonl'
        self.ledger = KnowledgeLedger(self.path)

    def tearDown(self):
        self.tmp.cleanup()

    def test_append_assigns_monotonic_transport_identity_separate_from_packet_uoid(self):
        first = self.ledger.append(payload('one'))
        second = self.ledger.append(payload('two'))
        self.assertEqual(first['ledger_seq'], 1)
        self.assertEqual(second['ledger_seq'], 2)
        self.assertNotEqual(first['entry_id'], second['entry_id'])
        self.assertTrue(first['packet_uoid'].startswith('uoid:sha256:'))
        self.assertNotEqual(first['packet_uoid'], first['entry_id'])
        self.assertEqual(self.ledger.validate(), 2)

    def test_exact_packet_reingestion_is_idempotent(self):
        first = self.ledger.append(payload('same'))
        second = self.ledger.append(payload('same'))
        self.assertEqual(first['entry_id'], second['entry_id'])
        self.assertEqual(first['packet_uoid'], second['packet_uoid'])
        self.assertEqual(self.ledger.validate(), 1)

    def test_append_many_is_validation_atomic(self):
        bad = payload('bad')
        bad['visibility'] = 'mystery'
        with self.assertRaises(ValueError):
            self.ledger.append_many([payload('good'), bad])
        self.assertFalse(self.path.exists())

    def test_public_queries_never_return_restricted_without_explicit_access(self):
        public = self.ledger.append(payload('public carrier', 'public'))
        restricted = self.ledger.append(payload('restricted carrier', 'restricted'))
        self.assertEqual(self.ledger.get(public['packet_uoid'])['content'], 'public carrier')
        self.assertIsNone(self.ledger.get(restricted['packet_uoid']))
        self.assertEqual(self.ledger.get(restricted['packet_uoid'], include_restricted=True)['content'], 'restricted carrier')
        self.assertEqual([e['content'] for e in self.ledger.sync(after=0)], ['public carrier'])
        self.assertEqual(
            [e['content'] for e in self.ledger.sync(after=0, include_restricted=True)],
            ['public carrier', 'restricted carrier'],
        )

    def test_sync_orders_by_ledger_sequence_after_cursor(self):
        self.ledger.append(payload('one'))
        self.ledger.append(payload('two'))
        self.ledger.append(payload('three'))
        rows = self.ledger.sync(after=1, limit=10)
        self.assertEqual([row['ledger_seq'] for row in rows], [2, 3])

    def test_search_is_bounded_and_preserves_epistemic_filters(self):
        self.ledger.append(payload('decision field hypothesis', kind='HYPOTHESIS', project='hodge'))
        self.ledger.append(payload('decision field method', kind='METHOD', project='hodge'))
        self.ledger.append(payload('unrelated', kind='REFERENCE', project='orbit'))
        rows = self.ledger.search(q='decision field', project='hodge', kind='METHOD', limit=1)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['kind'], 'METHOD')
        self.assertEqual(rows[0]['project'], 'hodge')

    def test_corrupt_json_and_uoid_mutation_fail_visibly(self):
        self.ledger.append(payload('integrity'))
        self.path.write_text(self.path.read_text(encoding='utf-8') + '{bad json}\n', encoding='utf-8')
        with self.assertRaises(LedgerCorruption):
            self.ledger.validate()

        self.path.write_text('', encoding='utf-8')
        self.ledger = KnowledgeLedger(self.path)
        self.ledger.append(payload('integrity'))
        obj = json.loads(self.path.read_text(encoding='utf-8'))
        obj['content'] = 'mutated'
        self.path.write_text(json.dumps(obj) + '\n', encoding='utf-8')
        with self.assertRaisesRegex(LedgerCorruption, 'packet_uoid'):
            self.ledger.validate()

    def test_non_monotonic_sequence_fails_visibly(self):
        self.ledger.append(payload('one'))
        self.ledger.append(payload('two'))
        lines = [json.loads(line) for line in self.path.read_text(encoding='utf-8').splitlines()]
        lines[1]['ledger_seq'] = 7
        self.path.write_text('\n'.join(json.dumps(row) for row in lines) + '\n', encoding='utf-8')
        with self.assertRaisesRegex(LedgerCorruption, 'ledger_seq'):
            self.ledger.validate()


if __name__ == '__main__':
    unittest.main()
