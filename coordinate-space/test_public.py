"""Public regression tests use authored fixtures, never private source records."""
import hashlib
import json
from pathlib import Path
import random
import tempfile
import unittest
import numpy as np
from coordinate_runtime import encode_utf8_exact, decode_utf8_exact, exact_integer, stable_id_52, CoordinateSpace
from float64_coordinate_builder import Float64CoordinateBuilder


def registry():
    return [dict(ns='demo', sym=s, name=s, kind='scalar', domain='research',
                 definition='Authored public example: '+s, provenance='assistant', bounded=True)
            for s in ['input', 'output']]


class PublicReleaseTests(unittest.TestCase):
    def test_unicode_roundtrips(self):
        rng = random.Random(20260913)
        samples = ['', '\ufeffA\r\nB\0', 'é e\u0301 🙂 مرحبا नमस्ते 你好', '</script><img src=x>']
        for _ in range(512):
            cps = [rng.randrange(0x110000) for _ in range(rng.randrange(80))]
            samples.append(''.join(chr(c) for c in cps if not 0xD800 <= c <= 0xDFFF))
        for text in samples:
            a, m = encode_utf8_exact(text)
            self.assertEqual(decode_utf8_exact(a, m['utf8_bytes'], expected_sha256=m['sha256']), text)
            self.assertEqual(m['sha256'], hashlib.sha256(text.encode()).hexdigest())

    def test_invalid_payloads(self):
        a, m = encode_utf8_exact('a')
        for bad in [np.r_[a, 0], a+.25, np.array([np.nan]), np.array([np.inf]), np.array([-1]), np.array([2**48]), np.array([True]), np.array([[0]])]:
            with self.subTest(bad=repr(bad)), self.assertRaises((ValueError, UnicodeDecodeError)):
                decode_utf8_exact(bad, 1)
        with self.assertRaises(ValueError): decode_utf8_exact(a+1, 1)
        with self.assertRaises(ValueError): decode_utf8_exact(a, 1, expected_sha256='0'*64)
        with self.assertRaises(UnicodeDecodeError): decode_utf8_exact([255*256**5], 1)
        with self.assertRaises(UnicodeEncodeError): encode_utf8_exact('\ud800')

    def test_exact_integer_bounds(self):
        for n in [True, 1.5, float('nan'), float('inf'), -1, 2**53]:
            with self.subTest(n=n), self.assertRaises(ValueError): exact_integer(n, 'n')
        self.assertEqual(exact_integer(2**53-1, 'n'), 2**53-1)

    def test_symbol_integrity(self):
        b = Float64CoordinateBuilder(registry())
        x = b.encode('demo::input', value=2, lower=0, upper=3)
        self.assertTrue(b.verify_vector(x))
        bad = x.copy(); bad[2] += .5
        self.assertFalse(b.verify_vector(bad))
        bad = x.copy(); bad[3] += 1
        self.assertFalse(b.verify_vector(bad))
        for kwargs in [dict(value=4, upper=3), dict(confidence=2), dict(lower=4, upper=3), dict(depth=-1)]:
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError): b.encode('demo::input', **kwargs)

    def test_unknown_state_and_endpoints(self):
        b = Float64CoordinateBuilder(registry())
        with self.assertRaises((ValueError, KeyError)): b.build_state({'absent': 1})
        with self.assertRaises((ValueError, KeyError)): b.relation_vector('demo::input', 'supports', 'absent')

    def test_nine_and_eleven_layers(self):
        b = Float64CoordinateBuilder(registry())
        s = b.build_state({'demo::input': 1}, [('demo::input', 'carries', 'demo::output', 1)])
        for count in [1, 9, 11]:
            stacked = b.stack_states([s]*count)
            self.assertEqual(stacked['symbols'].shape, (count, 2, 64))
            self.assertEqual(len(stacked['relations']), count)
        with self.assertRaises(ValueError): b.stack_states([])
        altered = dict(s, names=list(reversed(s['names'])))
        with self.assertRaises(ValueError): b.stack_states([s, altered])

    def test_state_save_reload(self):
        b = Float64CoordinateBuilder(registry())
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'example.npz'
            b.save_npz(p, values={'demo::input': 1}, relations=[('demo::input', '|::→', 'demo::output', 1)])
            loaded = Float64CoordinateBuilder(registry()).load_npz(p)
            self.assertEqual(loaded['relations'].shape, (1, 64))
            self.assertEqual(loaded['symbols'].shape, (2, 64))

    def test_empty_registry(self):
        b = Float64CoordinateBuilder([])
        names, x = b.encode_many()
        self.assertEqual(names, [])
        self.assertEqual(x.shape, (0, 64))

    def test_typed_reader_with_public_fixture(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d); schema = {'version': 2.2, 'spaces': {}}; lookup = {}
            for kind, array, records in [('entity','ENTITY64','entities'),('relation','RELATION64','relations'),('math','MATH64','math_records'),('search','SEARCH64','search_records')]:
                key = 'public-demo-'+kind
                row = np.zeros((1,64)); row[0,0] = 2.2; row[0,2] = stable_id_52(kind+'::'+key)
                np.save(p/(array+'.npy'), row, allow_pickle=False)
                record = {'key':key, 'note':'Authored synthetic carrier example, not evidence.', 'entity_type':'artifact'}
                (p/(records+'.jsonl')).write_text(json.dumps(record)+'\n')
                schema['spaces'][array] = {'shape':[1,64]}
                lookup[str(int(row[0,2]))] = {'space':records, 'key':key}
            text = 'Public fixture: 你好 🙂'; a,m = encode_utf8_exact(text)
            np.savez(p/'EXACT_UTF8_F64_PAYLOADS.npz', example=a)
            catalog = [dict(m, payload_id='example', kind='utf8_exact_float64', float64_values=len(a))]
            for name,value in [('coordinate_schema.json',schema),('coordinate_lookup.json',lookup),('payload_catalog.json',catalog),('source_availability.json',[])]:
                (p/name).write_text(json.dumps(value))
            space = CoordinateSpace(p)
            self.assertEqual(len(space.by_id),4)
            self.assertEqual(space.payload('example')['text'],text)
            for kind in ['entity','relation','math','search','artifact']:
                self.assertEqual(len(space.search(kind,'carrier')),1)
            with self.assertRaises(ValueError): space.search('not-a-space','')
            with self.assertRaises(ValueError): space.search('entity','',0)
            sid = next(iter(space.by_id)); self.assertEqual(space.get(sid)['coordinate_id_52'],sid)


if __name__ == '__main__': unittest.main(verbosity=2)
