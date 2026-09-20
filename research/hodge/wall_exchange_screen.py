#!/usr/bin/env python3
"""Independent mod-2 exchange screen for first-lift W110/W114 walls."""
from collections import defaultdict
import json
from wall_parity_screen import (
    W110, W114, GF2Basis, s_generators_mod2, units, zero_sum_triples,
    triple_sig, parity_vector, grade2_quotient_classes
)

def star_split_quotient_classes(m):
    B=GF2Basis(s_generators_mod2(m))
    U=units(m)
    sig_to_q=defaultdict(set)
    triples=zero_sum_triples(m)
    for tr in triples:
        sig=triple_sig(tr,m,U)
        q=B.reduce(parity_vector(m,tr))
        sig_to_q[sig].add(q)
    qs=set()
    for sig,q1s in sig_to_q.items():
        comp=tuple(3*m-x for x in sig)
        q2s=sig_to_q.get(comp)
        if not q2s: continue
        for q1 in q1s:
            for q2 in q2s:
                qs.add(q1^q2)
    return B,qs,{"zero_sum_triples":len(triples),
                 "triple_signature_count":len(sig_to_q),
                 "star_quotient_class_count":len(qs)}

def span_xor(seed):
    out=set(seed); changed=True
    while changed:
        changed=False
        cur=list(out)
        for a in cur:
            for b in cur:
                c=a^b
                if c not in out:
                    out.add(c); changed=True
    return out

def screen(m,reps):
    B,star,meta=star_split_quotient_classes(m)
    _,g2,g2meta=grade2_quotient_classes(m)
    g2span=span_xor(g2)
    rows=[]
    for rep in reps:
        target=tuple(2*x for x in rep)
        qt=B.reduce(parity_vector(m,target))
        rows.append({
            "representative":list(rep),
            "direct_star_split_same_coset":qt in star,
            "star_split_plus_grade2_exchange_possible":any((qt^g) in star for g in g2span)
        })
    return {**meta,
            "grade2_quotient_class_count":g2meta["grade2_quotient_class_count"],
            "grade2_span_size":len(g2span),
            "targets":rows}

print(json.dumps({
    "claim_ceiling":"Finite F_2 quotient obstruction only; no algebraicity or general Hodge conclusion.",
    "W110_at_220":screen(220,W110),
    "W114_at_228":screen(228,W114)
},indent=2,sort_keys=True))
