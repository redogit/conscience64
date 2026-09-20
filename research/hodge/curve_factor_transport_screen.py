#!/usr/bin/env python3
"""Independent recursive Fermat-curve transport screen for W70/W110/W114.

For each choice of distinguished coordinate and each ordering of the remaining five
entries, form the four curve-character factors produced by the recursive Fermat-motive
pattern:
  (b4,b5), (b3,b4+b5), (b2,b3+b4+b5), (b1,b2+b3+b4+b5).

A pair P,Q has a raw Galois-offset (1,1) match at s if
  grade(t P) + grade(s t Q) = 3
for every unit t.

Such an offset is counted as transportable only when the needed shift belongs to the
Aoki self-symmetry group
  W_Q = {s : grade(t Q)=grade(s t Q) for every unit t}
(or equivalently can be transported on the other factor).

This script records only finite character/Hodge-type facts.  It does not assert a motivic
factorization theorem; that external correspondence remains a separate theorem dependency.
"""
from itertools import permutations
from math import gcd
import json

CASES={
 "W70":[70,(1,20,24,42,61,62)],
 "W110a":[110,(1,24,62,71,81,91)],
 "W110b":[110,(1,31,55,71,81,91)],
 "W114a":[114,(1,7,78,79,86,91)],
 "W114b":[114,(1,13,43,72,103,110)],
 "W114c":[114,(1,13,43,80,102,103)],
}

def units(m):
    return [t for t in range(1,m) if gcd(t,m)==1]

def grade(pair,m,t):
    x,y=pair
    tri=((-x-y)%m,x%m,y%m)
    if any(v==0 for v in tri):
        return None
    return sum((t*v)%m for v in tri)//m

def factors(order,m):
    b1,b2,b3,b4,b5=order
    out=[
      (b4,b5),
      (b3,(b4+b5)%m),
      (b2,(b3+b4+b5)%m),
      (b1,(b2+b3+b4+b5)%m),
    ]
    for x,y in out:
        if x%m==0 or y%m==0 or (-x-y)%m==0:
            return None
    return out

PAIRINGS=(((0,1),(2,3)),((0,2),(1,3)),((0,3),(1,2)))

def W(pair,m,U):
    g={t:grade(pair,m,t) for t in U}
    return {s for s in U if all(g[t]==g[(s*t)%m] for t in U)}

def offsets(P,Q,m,U):
    gp={t:grade(P,m,t) for t in U}
    gq={t:grade(Q,m,t) for t in U}
    return {s for s in U if all(gp[t]+gq[(s*t)%m]==3 for t in U)}

def transported(P,Q,m,U):
    hs=offsets(P,Q,m,U)
    WP=W(P,m,U); WQ=W(Q,m,U)
    good=set()
    for s in hs:
        if s in WQ:
            good.add(("Q",s))
        inv=pow(s,-1,m)
        if inv in WP:
            good.add(("P",inv))
    return hs,good

def scan(m,a):
    U=units(m)
    raw=0; usable=0; strict=0; valid_orders=0; all_lower=0
    raw_examples=[]
    nontrivial_W={}
    for distinguished in range(6):
        rest=[a[i] for i in range(6) if i!=distinguished]
        for order in permutations(rest):
            fs=factors(order,m)
            if fs is None:
                continue
            valid_orders+=1
            levels=[]
            for P in fs:
                tri=tuple(sorted(((-sum(P))%m,P[0]%m,P[1]%m)))
                g=gcd(m,*tri)
                levels.append(m//g)
                wp=tuple(sorted(W(P,m,U)))
                if len(wp)>1:
                    nontrivial_W[str(tri)]=list(wp)
            if max(levels)<m:
                all_lower+=1
            for p1,p2 in PAIRINGS:
                h1,g1=transported(fs[p1[0]],fs[p1[1]],m,U)
                h2,g2=transported(fs[p2[0]],fs[p2[1]],m,U)
                if 1 in h1 and 1 in h2:
                    strict+=1
                if h1 and h2:
                    raw+=1
                    if len(raw_examples)<3:
                        raw_examples.append({
                          "distinguished_index":distinguished,
                          "order":list(order),
                          "factors":[list(x) for x in fs],
                          "pairing":[list(x) for x in (p1,p2)],
                          "offsets":[sorted(h1),sorted(h2)],
                          "transportable":[sorted(list(g1)),sorted(list(g2))]
                        })
                if g1 and g2:
                    usable+=1
    return {
      "valid_recursive_orders":valid_orders,
      "strict_same_t_pairings":strict,
      "raw_offset_pairings":raw,
      "transportable_offset_pairings":usable,
      "all_four_factors_descend_to_proper_levels":all_lower,
      "nontrivial_factor_W_groups":nontrivial_W,
      "raw_examples":raw_examples
    }

print(json.dumps({
 "claim_ceiling":"Finite character/Hodge-type and Aoki-W symmetry screens only. The recursive motive correspondence itself is an external theorem dependency.",
 "cases":{name:scan(m,a) for name,(m,a) in CASES.items()}
},indent=2,sort_keys=True))
