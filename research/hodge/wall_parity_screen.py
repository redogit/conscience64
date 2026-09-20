#!/usr/bin/env python3
"""Independent bounded parity screens for the current Fermat-fourfold walls.

This program intentionally does not import the external census implementation.
It implements only the finite definitions needed for the present negative tests:
Aoki-style S_m generators from formulas, exact F_2 row-space reduction, Hodge
grade checks over every unit, *-split enumeration, grade-2 quotient classes,
and exhaustive proper-divisor inflation screening.

A mod-2 non-membership is used only as a necessary-condition obstruction to
integer-lattice membership. No positive algebraicity or general Hodge claim is inferred.
"""
from __future__ import annotations
from collections import defaultdict
from math import gcd
import json

W110=[(1,24,62,71,81,91),(1,31,55,71,81,91)]
W114=[(1,7,78,79,86,91),(1,13,43,72,103,110),(1,13,43,80,102,103)]

def units(m):
    return [t for t in range(1,m) if gcd(t,m)==1]

def prime_divisors(n):
    out=[]; d=2; x=n
    while d*d<=x:
        if x%d==0:
            out.append(d)
            while x%d==0: x//=d
        d+=1
    if x>1: out.append(x)
    return out

def divisors(n):
    return [d for d in range(1,n+1) if n%d==0]

def parity_vector(m,entries):
    bits=0
    for e in entries:
        r=e%m
        if r==0: raise ValueError("zero residue")
        bits ^= 1<<(r-1)
    return bits

def s_generators_mod2(m):
    out=[]
    for a in range(1,m):
        out.append(parity_vector(m,(a,m-a)))
    for p in prime_divisors(m):
        d=m//p
        if p==2:
            for a in range(1,m//2):
                ent=(a,a+m//2,m-2*a,m//2)
                if any(e%m==0 for e in ent): continue
                out.append(parity_vector(m,ent))
        else:
            for a in range(1,d):
                ent=tuple(a+j*d for j in range(p))+(m-p*a,)
                if any(e%m==0 for e in ent): continue
                out.append(parity_vector(m,ent))
    return out

class GF2Basis:
    def __init__(self,vectors=()):
        self.rows={}
        for v in vectors: self.add(v)
    def add(self,v):
        x=v
        while x:
            p=x.bit_length()-1
            if p in self.rows:
                x ^= self.rows[p]
            else:
                self.rows[p]=x
                for q,row in list(self.rows.items()):
                    if q!=p and ((row>>p)&1):
                        self.rows[q]=row^x
                return True
        return False
    def reduce(self,v):
        x=v
        for p in sorted(self.rows,reverse=True):
            if (x>>p)&1: x ^= self.rows[p]
        return x
    @property
    def rank(self): return len(self.rows)

def zero_sum_triples(m):
    out=[]
    for a in range(1,m):
        for b in range(a,m):
            for k in (1,2):
                c=k*m-a-b
                if 1<=c<m and c>=b: out.append((a,b,c))
    return out

def triple_sig(tr,m,U):
    return tuple(sum((t*x)%m for x in tr) for t in U)

def star_split_mod2_hits(m,target):
    B=GF2Basis(s_generators_mod2(m))
    qt=B.reduce(parity_vector(m,target))
    U=units(m); triples=zero_sum_triples(m)
    index=defaultdict(int); rows=[]
    for tr in triples:
        sig=triple_sig(tr,m,U); q=B.reduce(parity_vector(m,tr))
        index[(sig,q)]+=1; rows.append((sig,q))
    hits=0
    for sig,q in rows:
        comp=tuple(3*m-x for x in sig)
        hits += index.get((comp,qt^q),0)
    return {"m":m,"rank_mod2":B.rank,"zero_sum_triples":len(triples),
            "target_nonzero_mod2_coset":qt!=0,"ordered_triple_pair_hits":hits}

def grade2_quotient_classes(m):
    B=GF2Basis(s_generators_mod2(m)); U=units(m)
    sig_to_q=defaultdict(set); pair_count=0
    for a in range(1,m):
        for b in range(a,m):
            pair_count+=1
            sig=tuple((t*a)%m+(t*b)%m for t in U)
            q=B.reduce(parity_vector(m,(a,b)))
            sig_to_q[sig].add(q)
    qs=set()
    for sig,qs1 in sig_to_q.items():
        comp=tuple(2*m-x for x in sig); qs2=sig_to_q.get(comp)
        if not qs2: continue
        for q1 in qs1:
            for q2 in qs2: qs.add(q1^q2)
    meta={"pair_count":pair_count,"pair_signature_count":len(sig_to_q),
          "grade2_quotient_class_count":len(qs),
          "grade2_nonzero_quotient_class_count":sum(q!=0 for q in qs)}
    return B,qs,meta

def any_hodge_sextuple_lift_match(d,M,target,B):
    e=M//d; U=units(d); qt=B.reduce(parity_vector(M,target))
    index=defaultdict(int); rows=[]; triple_count=0
    for a in range(1,d):
        for b in range(a,d):
            for c in range(b,d):
                triple_count+=1; tr=(a,b,c)
                sig=tuple(sum((t*x)%d for x in tr) for t in U)
                q=B.reduce(parity_vector(M,(e*a,e*b,e*c)))
                index[(sig,q)]+=1; rows.append((sig,q))
    hits=0
    for sig,q in rows:
        comp=tuple(3*d-x for x in sig)
        hits += index.get((comp,qt^q),0)
    return {"source_level":d,"triple_count":triple_count,"ordered_pair_hits":hits}

def first_lift_report(base,reps):
    M=2*base; lifted=[tuple(2*x for x in a) for a in reps]
    star=[star_split_mod2_hits(M,t) for t in lifted]
    B,qs,meta=grade2_quotient_classes(M)
    qts=[B.reduce(parity_vector(M,t)) for t in lifted]
    targets=[]
    for rep,qt in zip(reps,qts):
        targets.append({"representative":list(rep),
            "decomposable_mod2_possible":qt in qs,
            "quasi_mod2_possible":any((qt^q) in qs for q in qs)})
    lower=[d for d in divisors(M) if 3<=d<base]
    inherited=[any_hodge_sextuple_lift_match(d,M,lifted[0],B) for d in lower]
    return {"base_level":base,"lift_level":M,"representatives":[list(x) for x in reps],
            "all_representatives_same_mod2_coset":len(set(qts))==1,
            "star_split":star,"grade2":{**meta,"targets":targets},
            "proper_divisor_inflation":inherited}

def main():
    print(json.dumps({
        "claim_ceiling":"Finite mod-2 obstruction results only. A zero hit rules out the declared witness family because integer S_m membership would imply mod-2 membership. No algebraicity or general Hodge conclusion follows.",
        "implementation":"independent bounded checker; no external census code imported",
        "W110":first_lift_report(110,W110),
        "W114":first_lift_report(114,W114),
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
