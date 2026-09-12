from __future__ import annotations
import hashlib, json
from pathlib import Path
import numpy as np

DIM=64

def stable_id_52(text:str)->int:
    d=hashlib.sha256(text.encode("utf-8")).digest()
    return int.from_bytes(d[:7],"big")>>4

def fingerprint8(text:str)->np.ndarray:
    d=hashlib.sha256(text.encode("utf-8")).digest()
    vals=np.frombuffer(d[:16],dtype=">u2").astype(np.float64)
    return vals/32767.5-1.0

def encode_utf8_exact(text:str):
    raw=text.encode("utf-8")
    pad=(-len(raw))%6
    b=raw+b"\x00"*pad
    arr=np.asarray([float(int.from_bytes(b[i:i+6],"big")) for i in range(0,len(b),6)],dtype=np.float64)
    return arr,{"utf8_bytes":len(raw),"pad_bytes":pad,"sha256":hashlib.sha256(raw).hexdigest()}

def decode_utf8_exact(arr,byte_len:int)->str:
    out=bytearray()
    for x in np.asarray(arr,dtype=np.float64):
        i=int(x)
        if float(i)!=float(x) or i<0 or i>=2**48:
            raise ValueError("non-exact payload element")
        out.extend(i.to_bytes(6,"big"))
    return bytes(out[:byte_len]).decode("utf-8")

def load_bundle(root):
    root=Path(root)
    return {
        "entity":np.load(root/"ENTITY64.npy"),
        "relation":np.load(root/"RELATION64.npy"),
        "math":np.load(root/"MATH64.npy"),
        "search":np.load(root/"SEARCH64.npy"),
        "payloads":np.load(root/"EXACT_UTF8_F64_PAYLOADS.npz"),
        "schema":json.loads((root/"coordinate_schema.json").read_text()),
        "payload_catalog":json.loads((root/"payload_catalog.json").read_text()),
    }

def extract_payload(root,payload_id):
    b=load_bundle(root)
    meta=next(x for x in b["payload_catalog"] if x["payload_id"]==payload_id)
    if meta["kind"]!="utf8_exact_float64":
        raise ValueError("payload is binary_reference")
    text=decode_utf8_exact(b["payloads"][payload_id],meta["utf8_bytes"])
    if hashlib.sha256(text.encode("utf-8")).hexdigest()!=meta["sha256"]:
        raise ValueError("SHA256 mismatch")
    return text
