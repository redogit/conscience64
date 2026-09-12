#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import json, sys, hashlib
import numpy as np

ROOT=Path(__file__).resolve().parent

def rows(path):
    with path.open(encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield json.loads(line)

def stable_id_52(text):
    d=hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(d[:7],"big")>>4

def search_jsonl(kind, query, limit=20):
    query=query.casefold()
    file_map={
        "entity":"entities.jsonl",
        "claim":"entities.jsonl",
        "evidence":"entities.jsonl",
        "artifact":"entities.jsonl",
        "math":"math_records.jsonl",
        "search":"search_records.jsonl",
        "relation":"relations.jsonl",
    }
    path=ROOT/file_map[kind]
    found=[]
    for r in rows(path):
        if kind in {"claim","evidence","artifact"} and r.get("entity_type")!=kind:
            continue
        hay=json.dumps(r,ensure_ascii=False).casefold()
        if query in hay:
            key=r.get("key","")
            found.append({
                "key":key,
                "coordinate_id_52":stable_id_52(
                    ("math::" if kind=="math" else "search::" if kind=="search" else
                     "relation::" if kind=="relation" else "entity::")+key
                ) if key else None,
                "record":r
            })
            if len(found)>=limit:
                break
    return found

def payload(payload_id):
    cat=json.loads((ROOT/"payload_catalog.json").read_text())
    meta=next(x for x in cat if x["payload_id"]==payload_id)
    if meta["kind"]!="utf8_exact_float64":
        return {"metadata":meta,"text":None}
    z=np.load(ROOT/"EXACT_UTF8_F64_PAYLOADS.npz")
    arr=z[payload_id]
    out=bytearray()
    for x in arr:
        i=int(x)
        if float(i)!=float(x) or not (0<=i<2**48):
            raise ValueError("non-exact Float64 payload")
        out.extend(i.to_bytes(6,"big"))
    text=bytes(out[:meta["utf8_bytes"]]).decode("utf-8")
    h=hashlib.sha256(text.encode("utf-8")).hexdigest()
    if h!=meta["sha256"]:
        raise ValueError("SHA256 mismatch")
    return {"metadata":meta,"text":text}

def main():
    if len(sys.argv)<3:
        print("Usage:")
        print("  search_float64_space.py claim|evidence|artifact|entity|math|search|relation QUERY [LIMIT]")
        print("  search_float64_space.py payload P00001")
        raise SystemExit(2)
    kind=sys.argv[1]
    if kind=="payload":
        print(json.dumps(payload(sys.argv[2]),ensure_ascii=False,indent=2))
        return
    q=sys.argv[2]
    lim=int(sys.argv[3]) if len(sys.argv)>3 else 20
    print(json.dumps(search_jsonl(kind,q,lim),ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
