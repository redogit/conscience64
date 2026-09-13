# -*- coding: utf-8 -*-
"""
Float64 Coordinate Space Builder
================================

Purpose
-------
Pack a UTF-8 research symbol registry into deterministic Float64 coordinates
without merging overloaded glyphs.

Identity rule
-------------
Identity is namespace-qualified: "context::E" (Ethics) is distinct from
"graph::E" (edge set). Stable identity is a collision-checked 52-bit SHA-256
prefix, exactly representable in IEEE-754 Float64 integers.

Important
---------
Hash/fingerprint coordinates are integrity/identity features, NOT semantic
embeddings. Semantics remain in the UTF-8 registry definitions.

Coordinate vector: R^64, dtype=float64
---------------------------------------
 0 schema_version
 1 entity_type            (1=symbol, 2=relation)
 2 stable_id_52
 3 kind_code
 4 domain_code
 5 status_code
 6 provenance_code
 7 arity
 8 bounded_flag
 9 is_set
10 is_function
11 is_relation
12 is_operator
13 is_metric
14 is_state
15 is_input
16 is_output
17 is_resource
18 is_system
19 is_constraint
20 is_actor
21 algorithmic_relevance
22 carrier_relevance
23 search_relevance
24 decomposition_relevance
25 evidence_relevance
26 cost_relevance
27 human_relevance
28 physical_relevance
29 recursive_relevance
30 boundary_relevance
31 certification_relevance
32 compression_relevance
33 optimization_relevance
34 dynamic_value           (NaN when absent)
35 lower_bound             (NaN when absent)
36 upper_bound             (NaN when absent)
37 confidence              (NaN when absent)
38 depth_or_generation     (NaN when absent)
39 ordinal                 (exact integer when provided)
40..47 integrity fingerprint of qualified symbol (8 signed values in [-1,1])
48..55 integrity fingerprint of UTF-8 definition (8 signed values in [-1,1])
56..63 reserved (0.0)

All categorical codes are deterministic within the frozen builder schema.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from types import MappingProxyType
from coordinate_runtime import exact_integer, json_safe

DIM = 64
SCHEMA_VERSION = 1.1  # successor: strict validation + framed relation identity

KINDS = [
    "actor_set","constraint","context","dimension","function","index","input",
    "metric","operator","output","relation","resource","scalar","set","state",
    "system"
]
DOMAINS = [
    "algorithm","carrier","decomposition","economics","graph","history","human",
    "inference","interaction","normative","physical","planning","process",
    "reasoning","research","search"
]
STATUSES = ["active","bounded","calibration","rejected"]
PROVENANCE = ["user","assistant","user+assistant","external"]

def _code(value: str, table: Sequence[str]) -> float:
    if value not in table:
        raise KeyError(f"Unknown code value {value!r}")
    return float(table.index(value) + 1)

def stable_id_52(text: str) -> int:
    """Return an exact Float64-safe 52-bit stable integer id."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(digest[:7], "big") >> 4  # exactly 52 bits

def fingerprint8(text: str) -> np.ndarray:
    """
    Deterministic integrity fingerprint in [-1,1]^8.
    It is not a semantic embedding.
    """
    d = hashlib.sha256(text.encode("utf-8")).digest()
    vals = np.frombuffer(d[:16], dtype=">u2").astype(np.float64)
    return vals / 32767.5 - 1.0

def infer_flags(record: Mapping[str, Any]) -> Dict[str, float]:
    kind = record["kind"]
    domain = record["domain"]
    definition = record.get("definition","").lower()

    def anyword(*words: str) -> float:
        return float(any(w in definition for w in words))

    return {
        "is_set": float(kind in {"set","actor_set"}),
        "is_function": float(kind == "function"),
        "is_relation": float(kind == "relation"),
        "is_operator": float(kind == "operator"),
        "is_metric": float(kind == "metric"),
        "is_state": float(kind in {"state","context"}),
        "is_input": float(kind == "input"),
        "is_output": float(kind == "output"),
        "is_resource": float(kind == "resource"),
        "is_system": float(kind == "system"),
        "is_constraint": float(kind == "constraint"),
        "is_actor": float(kind == "actor_set"),
        "algorithmic": float(domain in {"algorithm","search","decomposition","inference"} or kind in {"function","operator"}),
        "carrier": float(domain == "carrier" or "carrier" in definition),
        "search": float(domain == "search" or "search" in definition),
        "decomposition": float(domain == "decomposition" or "decomposition" in definition),
        "evidence": anyword("evidence","observed","observation","verified"),
        "cost": float(domain == "economics" or "cost" in definition),
        "human": float(domain == "human" or "human" in definition),
        "physical": float(domain == "physical"),
        "recursive": anyword("recursive","recursion","tree"),
        "boundary": anyword("boundary","separator","interface"),
        "certification": anyword("certificate","certify","proof"),
        "compression": anyword("compress","compression","quotient"),
        "optimization": anyword("optim","maximum","minimum","best"),
    }

@dataclass(frozen=True)
class SymbolRecord:
    ns: str
    sym: str
    name: str
    kind: str
    domain: str
    definition: str
    status: str = "active"
    provenance: str = "user+assistant"
    arity: int = 0
    bounded: bool = False

    @property
    def qualified(self) -> str:
        return f"{self.ns}::{self.sym}"

class Float64CoordinateBuilder:
    def __init__(self, registry: Iterable[Mapping[str, Any]]):
        self.records: List[Dict[str, Any]] = [dict(r) for r in registry]
        self.by_qualified: Dict[str, Dict[str, Any]] = {}
        self.by_id: Dict[int, Dict[str, Any]] = {}
        self._relation_ids = {}
        self._freeze()

    def _freeze(self) -> None:
        for r in self.records:
            for name in ("ns", "sym", "name", "kind", "domain", "definition"):
                if not isinstance(r.get(name), str) or not r[name]:
                    raise ValueError(f"{name} must be nonempty text")
                r[name].encode("utf-8")
            if "::" in r["ns"]:
                raise ValueError("namespace cannot contain the namespace delimiter")
            q = f'{r["ns"]}::{r["sym"]}'
            if r.get("qualified", q) != q:
                raise ValueError("qualified identity contradicts namespace/symbol")
            r["qualified"] = q
            for field, table, default in [("kind", KINDS, None), ("domain", DOMAINS, None),
                                          ("status", STATUSES, "active"),
                                          ("provenance", PROVENANCE, "user+assistant")]:
                _code(r.get(field, default), table)
            exact_integer(r.get("arity", 0), "arity")
            if type(r.get("bounded", False)) is not bool:
                raise ValueError("bounded must be boolean")
            sid = stable_id_52(q)
            if q in self.by_qualified:
                raise ValueError(f"Duplicate qualified symbol: {q}")
            if sid in self.by_id:
                raise ValueError(f"52-bit stable-id collision: {q}")
            self.by_qualified[q] = MappingProxyType(dict(r))
            self.by_id[sid] = self.by_qualified[q]
        self.records = tuple(self.by_qualified[q] for q in sorted(self.by_qualified))
        self.by_qualified = MappingProxyType(self.by_qualified)
        self.by_id = MappingProxyType(self.by_id)

    @staticmethod
    def _numeric(value, name, *, nonnegative=False):
        if value is None:
            return None
        if isinstance(value, (bool, np.bool_)) or not isinstance(value, (int, float, np.integer, np.floating)):
            raise ValueError(f"{name} must be real numeric data")
        if isinstance(value, (int, np.integer)) and abs(int(value)) > 2**53-1:
            raise ValueError(f"{name}: integer is outside the Float64-safe range")
        f = float(value)
        if not math.isfinite(f) or (nonnegative and f < 0):
            raise ValueError(f"{name} outside its finite domain")
        return f

    def encode(
        self,
        qualified: str,
        *,
        value: Optional[float] = None,
        lower: Optional[float] = None,
        upper: Optional[float] = None,
        confidence: Optional[float] = None,
        depth: Optional[float] = None,
        ordinal: Optional[int] = None,
    ) -> np.ndarray:
        r = self.by_qualified[qualified]
        value = self._numeric(value, "value")
        lower = self._numeric(lower, "lower")
        upper = self._numeric(upper, "upper")
        confidence = self._numeric(confidence, "confidence")
        depth = self._numeric(depth, "depth", nonnegative=True)
        if confidence is not None and not 0 <= confidence <= 1:
            raise ValueError("confidence must be in [0,1]")
        if lower is not None and upper is not None and lower > upper:
            raise ValueError("lower bound exceeds upper bound")
        if value is not None and ((lower is not None and value < lower) or (upper is not None and value > upper)):
            raise ValueError("value outside supplied bounds")
        if ordinal is not None:
            ordinal = exact_integer(ordinal, "ordinal")
        x = np.zeros(DIM, dtype=np.float64)
        flags = infer_flags(r)

        x[0] = SCHEMA_VERSION
        x[1] = 1.0
        x[2] = float(stable_id_52(qualified))
        x[3] = _code(r["kind"], KINDS)
        x[4] = _code(r["domain"], DOMAINS)
        x[5] = _code(r.get("status","active"), STATUSES)
        x[6] = _code(r.get("provenance","user+assistant"), PROVENANCE)
        x[7] = float(r.get("arity",0))
        x[8] = float(bool(r.get("bounded",False)))

        flag_keys = [
            "is_set","is_function","is_relation","is_operator","is_metric",
            "is_state","is_input","is_output","is_resource","is_system",
            "is_constraint","is_actor","algorithmic","carrier","search",
            "decomposition","evidence","cost","human","physical","recursive",
            "boundary","certification","compression","optimization"
        ]
        for i,k in enumerate(flag_keys, start=9):
            x[i] = flags[k]

        x[34] = np.nan if value is None else float(value)
        x[35] = np.nan if lower is None else float(lower)
        x[36] = np.nan if upper is None else float(upper)
        x[37] = np.nan if confidence is None else float(confidence)
        x[38] = np.nan if depth is None else float(depth)
        x[39] = np.nan if ordinal is None else float(ordinal)

        x[40:48] = fingerprint8(qualified)
        x[48:56] = fingerprint8(r["definition"])
        return x

    def encode_many(
        self,
        state: Optional[Mapping[str, float]] = None,
        **shared_kwargs: Any,
    ) -> Tuple[List[str], np.ndarray]:
        state = state or {}
        unknown = set(state) - set(self.by_qualified)
        if unknown:
            raise KeyError(f"unknown state identities: {sorted(unknown)}")
        names = sorted(self.by_qualified.keys())
        if not names:
            return names, np.empty((0,DIM), dtype=np.float64)
        mat = np.vstack([
            self.encode(q, value=state.get(q), ordinal=i, **shared_kwargs)
            for i,q in enumerate(names)
        ]).astype(np.float64, copy=False)
        return names, mat

    def decode_identity(self, vector: np.ndarray) -> Dict[str, Any]:
        x = np.asarray(vector)
        if x.shape != (DIM,) or x.dtype != np.float64:
            raise ValueError("symbol vector must have shape (64,) and Float64 dtype")
        if x[0] != SCHEMA_VERSION or x[1] != 1.0:
            raise ValueError("wrong SYMBOL64 schema or row type")
        sid = exact_integer(x[2], "stable ID", maximum=2**52-1)
        if sid not in self.by_id:
            raise KeyError(f"Unknown stable id: {sid}")
        record = self.by_id[sid]
        # Recompute every registry-defined field; optional measurements are not
        # authenticated by a symbol fingerprint and retain their own validation.
        expected = self.encode(record["qualified"])
        fixed = np.r_[0:34,40:64]
        if not np.array_equal(x[fixed], expected[fixed]):
            raise ValueError("registry-defined fields or fingerprints differ")
        if np.isinf(x[34:40]).any():
            raise ValueError("infinite optional measurement")
        opts = [None if np.isnan(v) else float(v) for v in x[34:40]]
        self.encode(record["qualified"], value=opts[0], lower=opts[1], upper=opts[2],
                    confidence=opts[3], depth=opts[4], ordinal=opts[5])
        return dict(record)

    def verify_vector(self, vector: np.ndarray) -> bool:
        try:
            self.decode_identity(vector)
            return True
        except (TypeError, ValueError, KeyError, OverflowError):
            return False

    def nearest(
        self,
        vector: np.ndarray,
        *,
        feature_slice: slice = slice(9,34),
        top_k: int = 5,
    ) -> List[Tuple[str,float]]:
        """
        Compare structural-role coordinates only.
        This is a role-vector nearest-neighbor operation, not semantic NLP similarity.
        """
        self.decode_identity(vector)
        top_k = exact_integer(top_k, "top_k", minimum=1, maximum=10000)
        if not isinstance(feature_slice, slice):
            raise ValueError("feature_slice must select structural-role slots")
        indices = np.arange(DIM)[feature_slice]
        if not len(indices) or ((indices < 9) | (indices >= 34)).any():
            raise ValueError("nearest may compare only structural-role slots 9..33")
        names, mat = self.encode_many()
        a = np.nan_to_num(vector[feature_slice], nan=0.0)
        B = np.nan_to_num(mat[:,feature_slice], nan=0.0)
        d = np.linalg.norm(B-a[None,:],axis=1)
        idx = np.argsort(d, kind="stable")[:top_k]
        return [(names[int(i)],float(d[int(i)])) for i in idx]

    def relation_vector(
        self,
        src: str,
        relation: str,
        dst: str,
        *,
        weight: float = 1.0,
        order: int = 0,
        confidence: float = 1.0,
    ) -> np.ndarray:
        """
        Pack a relation into the same R^64 space.
        relation is arbitrary UTF-8 text such as '→', '⊂', 'depends_on', '⊗'.
        """
        x = np.zeros(DIM,dtype=np.float64)
        if src not in self.by_qualified or dst not in self.by_qualified:
            raise KeyError("relation endpoints must resolve in this registry")
        if not isinstance(relation, str) or not relation:
            raise ValueError("relation must be nonempty UTF-8 text")
        weight = self._numeric(weight, "weight")
        confidence = self._numeric(confidence, "confidence")
        if weight is None or confidence is None or not 0 <= confidence <= 1:
            raise ValueError("relation requires finite weight and confidence in [0,1]")
        order = exact_integer(order, "order")
        rid_text = json.dumps(["relation-v2", src, relation, dst], ensure_ascii=False, separators=(",", ":"))
        rid = stable_id_52(rid_text)
        if rid in self._relation_ids and self._relation_ids[rid] != rid_text:
            raise ValueError("relation ID collision")
        self._relation_ids[rid] = rid_text
        x[0] = SCHEMA_VERSION
        x[1] = 2.0
        x[2] = float(stable_id_52(rid_text))
        x[3] = float(stable_id_52(relation))
        x[4] = float(stable_id_52(src))
        x[5] = float(stable_id_52(dst))
        x[6] = float(weight)
        x[7] = float(order)
        x[8] = float(confidence)
        x[40:48] = fingerprint8(rid_text)
        x[48:56] = fingerprint8(relation)
        return x

    def build_state(
        self,
        values: Mapping[str,float],
        relations: Optional[Iterable[Tuple[str,str,str,float]]] = None,
        *,
        depth: Optional[float] = None,
        confidence: Optional[float] = None,
    ) -> Dict[str, Any]:
        names, symbols = self.encode_many(state=values, depth=depth, confidence=confidence)
        relation_rows=[]
        if relations:
            for i,item in enumerate(relations):
                if len(item) not in (3,4):
                    raise ValueError("relation tuple requires src, relation, dst and optional weight")
                src,rel,dst,*rest = item
                w = rest[0] if rest else 1.0
                relation_rows.append(
                    self.relation_vector(src,rel,dst,weight=w,order=i,
                                         confidence=1.0 if confidence is None else confidence)
                )
        relmat = (
            np.vstack(relation_rows).astype(np.float64,copy=False)
            if relation_rows else np.empty((0,DIM),dtype=np.float64)
        )
        return {"names":names,"symbols":symbols,"relations":relmat}

    def verify_relation(self, vector: np.ndarray) -> bool:
        try:
            x = np.asarray(vector)
            if x.shape != (DIM,) or x.dtype != np.float64 or not np.isfinite(x).all():
                return False
            if x[0] != SCHEMA_VERSION or x[1] != 2.0:
                return False
            sid = exact_integer(x[2], "relation ID", maximum=2**52-1)
            framed = self._relation_ids[sid]
            version, src, rel, dst = json.loads(framed)
            if version != "relation-v2":
                return False
            expected = self.relation_vector(src, rel, dst, weight=x[6], order=x[7], confidence=x[8])
            return bool(np.array_equal(x, expected))
        except (ValueError, KeyError, TypeError):
            return False

    def stack_states(self, states: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
        """I-prime ordered layers over one aligned symbol registry.
        The layer count is not fixed at nine. Relations remain per-layer because
        edge counts may differ; stacking does not assert independent evidence.
        """
        if not states:
            raise ValueError("at least one layer is required")
        names = sorted(self.by_qualified)
        for state in states:
            if list(state["names"]) != names:
                raise ValueError("layer identities/order must align exactly")
            x = np.asarray(state["symbols"])
            if x.shape != (len(names), DIM) or any(not self.verify_vector(row) for row in x):
                raise ValueError("invalid symbol layer")
            if np.asarray(state["relations"]).ndim != 2 or np.asarray(state["relations"]).shape[1] != DIM:
                raise ValueError("invalid relation layer shape")
            if any(not self.verify_relation(row) for row in state["relations"]):
                raise ValueError("invalid or unresolved relation layer")
        return {"names": names, "symbols": np.stack([s["symbols"] for s in states]),
                "relations": [np.array(s["relations"], copy=True) for s in states],
                "layer_count": len(states), "schema_version": SCHEMA_VERSION}

    def save_npz(
        self,
        path: str | Path,
        *,
        values: Optional[Mapping[str,float]] = None,
        relations: Optional[Iterable[Tuple[str,str,str,float]]] = None,
    ) -> None:
        state = self.build_state(values or {}, relations)
        np.savez_compressed(
            path,
            names=np.array(state["names"], dtype="U"),
            symbols=state["symbols"],
            relations=state["relations"],
            relation_identities=np.array([self._relation_ids[int(x[2])] for x in state["relations"]], dtype="U"),
            dimension=np.array([DIM],dtype=np.int64),
            schema_version=np.array([SCHEMA_VERSION],dtype=np.float64),
        )

    def load_npz(self, path: str | Path) -> Dict[str, Any]:
        with np.load(path, allow_pickle=False) as z:
            if z["dimension"].tolist() != [DIM] or z["schema_version"].tolist() != [SCHEMA_VERSION]:
                raise ValueError("saved state schema mismatch")
            state = {"names": z["names"].tolist(), "symbols": z["symbols"].copy(), "relations": z["relations"].copy()}
            for framed in z["relation_identities"].tolist():
                version, src, rel, dst = json.loads(framed)
                if version != "relation-v2":
                    raise ValueError("relation identity version mismatch")
                self.relation_vector(src, rel, dst)
            self.stack_states([state])
            return state

def load_registry(path: str | Path) -> List[Dict[str,Any]]:
    with open(path,"r",encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    registry_path = here / "utf8_symbol_registry.json"
    registry = load_registry(registry_path)
    builder = Float64CoordinateBuilder(registry)

    # Example numeric state. Unknown/non-numeric symbols remain NaN in slot 34.
    values = {
        "framework::Dep": 1.0,
        "boundary::W_eff": 3.0,
        "boundary::R_B": 0.125,
        "decomp::H_D": 2.0,
        "decomp::Ĥ_D": 1.8,
    }

    relations = [
        ("framework::I","→","framework::R",1.0),
        ("framework::Scr","⊂","framework::R",1.0),
        ("boundary::B","→","boundary::B/∼",1.0),
        ("boundary::B/∼","→","boundary::Q(B)",1.0),
        ("boundary::Q(B)","→","boundary::W_eff",1.0),
        ("decomp::C_flat","/","decomp::C_carry",1.0),
    ]

    builder.save_npz(here / "research_symbol_space_float64.npz",
                     values=values, relations=relations)

    names, mat = builder.encode_many(state=values)
    assert mat.dtype == np.float64
    assert mat.shape[1] == 64
    assert all(builder.verify_vector(mat[i]) for i in range(len(names)))
    assert len(set(int(v) for v in mat[:,2])) == len(names)
    print(f"registry={len(names)} symbols")
    print(f"symbol_matrix={mat.shape} dtype={mat.dtype}")
    print("identity collisions=0")
    print("verification=PASS")
