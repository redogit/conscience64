"""Validated readers for the recovered coordinate corpus. No network or pickle.
The typed index, exact payload carrier and symbolic schema are separate contracts.
"""
from __future__ import annotations
import hashlib
import json
import math
import numbers
from pathlib import Path
from typing import Any
import numpy as np

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
SPACES = {
    'entity': ('ENTITY64', 'entities'),
    'relation': ('RELATION64', 'relations'),
    'math': ('MATH64', 'math_records'),
    'search': ('SEARCH64', 'search_records'),
}
MAX_PAYLOAD_BYTES = 64 * 1024 * 1024

def exact_integer(value: Any, name: str, *, minimum: int = 0, maximum: int = 2**53-1) -> int:
    if isinstance(value, (bool, np.bool_)) or not isinstance(value, numbers.Real):
        raise ValueError(f'{name} must be an exact integer')
    if isinstance(value, numbers.Integral):
        n = int(value)  # Validate huge Python integers before any float conversion.
    else:
        if not math.isfinite(value) or value != int(value):
            raise ValueError(f'{name} must be a finite exact integer')
        n = int(value)
    if not minimum <= n <= maximum:
        raise ValueError(f'{name} outside [{minimum}, {maximum}]')
    return n

def stable_id_52(text: str) -> int:
    if not isinstance(text, str):
        raise TypeError('identity must be UTF-8 text')
    return int.from_bytes(hashlib.sha256(text.encode('utf-8')).digest()[:7], 'big') >> 4

def fingerprint8(text: str) -> np.ndarray:
    d = hashlib.sha256(text.encode('utf-8')).digest()
    return np.frombuffer(d[:16], dtype='>u2').astype(np.float64) / 32767.5 - 1.0

def encode_utf8_exact(text: str) -> tuple[np.ndarray, dict]:
    if not isinstance(text, str):
        raise TypeError('text must be str')
    raw = text.encode('utf-8')
    if len(raw) > MAX_PAYLOAD_BYTES:
        raise ValueError('payload exceeds 64 MiB implementation limit')
    pad = (-len(raw)) % 6
    padded = raw + b'\0' * pad
    arr = np.array([int.from_bytes(padded[i:i+6], 'big') for i in range(0, len(padded), 6)], dtype=np.float64)
    return arr, {'utf8_bytes': len(raw), 'pad_bytes': pad, 'sha256': hashlib.sha256(raw).hexdigest()}

def decode_utf8_exact(arr: Any, byte_len: int, *, expected_sha256: str | None = None) -> str:
    n = exact_integer(byte_len, 'byte_len', maximum=MAX_PAYLOAD_BYTES)
    values = np.asarray(arr)
    if values.ndim != 1 or values.dtype.kind not in 'fiu':
        raise ValueError('payload must be a one-dimensional real numeric array')
    if len(values) != (n + 5) // 6:
        raise ValueError('coordinate count does not match byte length')
    if not np.isfinite(values).all() or (values < 0).any() or (values >= 2**48).any():
        raise ValueError('payload elements must be finite unsigned 48-bit integers')
    if not np.equal(values, np.floor(values)).all():
        raise ValueError('fractional payload element')
    raw = b''.join(int(x).to_bytes(6, 'big') for x in values)
    if any(raw[n:]):
        raise ValueError('nonzero padding is not canonical')
    raw = raw[:n]
    if expected_sha256 is not None and hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise ValueError('SHA-256 mismatch')
    return raw.decode('utf-8', errors='strict')

def reject_constant(value: str) -> None:
    raise ValueError(f'nonstandard JSON constant: {value}')

def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'), parse_constant=reject_constant)

def json_safe(value: Any) -> Any:
    """Explicit presentation adapter only; never overwrites authoritative bytes."""
    if isinstance(value, np.ndarray): return json_safe(value.tolist())
    if isinstance(value, np.generic): return json_safe(value.item())
    if isinstance(value, float) and not math.isfinite(value): return None
    if isinstance(value, dict): return {k: json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)): return [json_safe(v) for v in value]
    return value

class CoordinateSpace:
    def __init__(self, root: str | Path = DATA):
        self.root = Path(root)
        seal = ROOT / 'ARTIFACT_HASHES.json'
        if self.root.resolve() == DATA.resolve() and seal.exists():
            for relative, expected in read_json(seal).items():
                if relative.startswith('data/'):
                    path = ROOT / relative
                    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                        raise ValueError(f'changed or missing data dependency: {relative}')
        self.schema = read_json(self.root / 'coordinate_schema.json')
        self.lookup_index = read_json(self.root / 'coordinate_lookup.json')
        self.catalog = read_json(self.root / 'payload_catalog.json')
        self.arrays, self.records, self.by_id = {}, {}, {}
        for kind, (array_name, record_name) in SPACES.items():
            a = np.load(self.root / (array_name + '.npy'), allow_pickle=False)
            records = [json.loads(line, parse_constant=reject_constant) for line in (self.root / (record_name + '.jsonl')).read_text(encoding='utf-8').splitlines() if line.strip()]
            if a.dtype != np.float64 or a.shape != (len(records), 64) or not np.isfinite(a).all():
                raise ValueError(f'{kind}: invalid coordinate array')
            if list(a.shape) != self.schema['spaces'][array_name]['shape']:
                raise ValueError(f'{kind}: schema/array shape mismatch')
            if not np.equal(a[:, 0], self.schema['version']).all():
                raise ValueError(f'{kind}: schema version mismatch')
            a.setflags(write=False)
            self.arrays[kind], self.records[kind] = a, records
            for i, record in enumerate(records):
                sid = exact_integer(a[i, 2], 'coordinate ID', maximum=2**52-1)
                if sid != stable_id_52(kind + '::' + record['key']):
                    raise ValueError(f'{kind}: ID/record mismatch at row {i}')
                if sid in self.by_id:
                    raise ValueError('coordinate ID collision')
                if self.lookup_index.get(str(sid)) != {'space': record_name, 'key': record['key']}:
                    raise ValueError(f'{kind}: lookup mismatch at row {i}')
                self.by_id[sid] = (kind, i)
        if len(self.by_id) != len(self.lookup_index):
            raise ValueError('lookup coverage mismatch')
        self.payload_by_id = {x['payload_id']: x for x in self.catalog}
        if len(self.payload_by_id) != len(self.catalog):
            raise ValueError('duplicate payload ID')

    def get(self, coordinate_id: int) -> dict:
        sid = exact_integer(coordinate_id, 'coordinate ID', maximum=2**52-1)
        if sid not in self.by_id:
            raise KeyError(f'unknown coordinate ID: {sid}')
        kind, i = self.by_id[sid]
        return {'space': kind, 'row': i, 'coordinate_id_52': sid,
                'record': dict(self.records[kind][i]), 'vector': self.arrays[kind][i].copy()}

    def search(self, kind: str, query: str, limit: int = 20) -> list[dict]:
        limit = exact_integer(limit, 'limit', minimum=1, maximum=10000)
        if not isinstance(query, str): raise TypeError('query must be text')
        base_kind = 'entity' if kind in {'claim', 'evidence', 'artifact'} else kind
        if base_kind not in SPACES: raise ValueError(f'unknown search kind: {kind}')
        out, needle = [], query.casefold()
        for i, record in enumerate(self.records[base_kind]):
            if kind in {'claim', 'evidence', 'artifact'} and record.get('entity_type') != kind: continue
            if needle in json.dumps(record, ensure_ascii=False, separators=(',', ':')).casefold():
                out.append(self.get(int(self.arrays[base_kind][i, 2])))
                if len(out) >= limit: break
        return out

    def payload(self, payload_id: str) -> dict:
        if payload_id not in self.payload_by_id: raise KeyError(f'unknown payload ID: {payload_id}')
        meta = self.payload_by_id[payload_id]
        if meta['kind'] != 'utf8_exact_float64':
            return {'metadata': meta, 'text': None, 'status': 'REFERENCE_ONLY'}
        n = exact_integer(meta['utf8_bytes'], 'utf8_bytes', maximum=MAX_PAYLOAD_BYTES)
        if meta['pad_bytes'] != (-n) % 6 or meta['float64_values'] != (n + 5) // 6:
            raise ValueError('payload catalog length/padding mismatch')
        with np.load(self.root / 'EXACT_UTF8_F64_PAYLOADS.npz', allow_pickle=False) as archive:
            text = decode_utf8_exact(archive[payload_id], n, expected_sha256=meta['sha256'])
        return {'metadata': dict(meta), 'text': text, 'status': 'BYTE_VERIFIED_NOW'}

    def source_status(self) -> dict:
        sources = read_json(self.root / 'source_availability.json')
        missing = [r['source_name'] for r in sources if not r['materialized']]
        return {'rule': 'Prior pass materialization is provenance, not proof of current source freshness.',
                'payloads_locally_available': len(self.catalog),
                'prior_reference_only_sources': missing,
                'knowledge_decay_guard': 'Re-run verify.py after changes; missing or changed dependencies remain unresolved.'}

def load_bundle(root: str | Path = DATA) -> dict:
    space = CoordinateSpace(root)
    with np.load(space.root / 'EXACT_UTF8_F64_PAYLOADS.npz', allow_pickle=False) as z:
        payloads = {key: z[key].copy() for key in z.files}
    return {**space.arrays, 'payloads': payloads, 'schema': space.schema, 'payload_catalog': space.catalog}

def extract_payload(root: str | Path, payload_id: str) -> str:
    result = CoordinateSpace(root).payload(payload_id)
    if result['text'] is None: raise ValueError('payload is reference-only')
    return result['text']
