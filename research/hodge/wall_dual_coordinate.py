#!/usr/bin/env python3
"""Reproduce compact mod-2 dual coordinates for W70/W110/W114 and prove support minimality.

Only finite F_2 statements are certified. Pair generators force any annihilator to be
negation-symmetric (with the even-level self residue handled separately), so exhaustive
search over smaller negation-pair supports gives an independent lower bound.
"""
from itertools import combinations
from math import gcd
import json
from wall_parity_screen import (
    GF2Basis, s_generators_mod2, parity_vector, units, prime_divisors
)

WALLS={
  70:[(1,20,24,42,61,62)],
  110:[(1,24,62,71,81,91),(1,31,55,71,81,91)],
  114:[(1,7,78,79,86,91),(1,13,43,72,103,110),(1,13,43,80,102,103)]
}
CANDIDATES={
  70:[14,28,42,56],
  110:[17,19,27,28,38,41,69,72,82,83,91,93],
  114:[1,20,29,37,47,56,58,67,77,85,94,113]
}

def dot(a,b): return ((a&b).bit_count()&1)

def support_bits(m,S):
    z=0
    for x in S: z|=1<<(x-1)
    return z

def standard_entries(m):
    out=[]
    for p in prime_divisors(m):
        d=m//p
        if p==2:
            for a in range(1,m//2):
                e=(a,a+m//2,m-2*a,m//2)
                if all(x%m for x in e): out.append(e)
        else:
            for a in range(1,d):
                e=tuple(a+j*d for j in range(p))+(m-p*a,)
                if all(x%m for x in e): out.append(e)
    return out

def pair_reduced_columns(m,target):
    rows=[parity_vector(m,e) for e in standard_entries(m)]+[parity_vector(m,target)]
    wanted=1<<(len(rows)-1)
    cols=[]
    for k in range(1,m//2):
        s=(1<<(k-1))|(1<<(m-k-1))
        syn=sum((dot(s,row)<<j) for j,row in enumerate(rows))
        cols.append((k,syn))
    selfk=m//2; s=1<<(selfk-1)
    selfsyn=sum((dot(s,row)<<j) for j,row in enumerate(rows))
    return cols,(selfk,selfsyn),wanted

def lower_bound(m,target,candidate_weight):
    # Candidate supports here are unions of negation pairs, so prove no smaller pair count.
    maxpairs=candidate_weight//2-1
    cols,selfcol,wanted=pair_reduced_columns(m,target)
    checked=0
    for k in range(maxpairs+1):
        for comb in combinations(range(len(cols)),k):
            syn=0
            for i in comb: syn^=cols[i][1]
            checked+=1
            if syn==wanted or (syn^selfcol[1])==wanted:
                return {"proved_minimal":False,"counterexample_pair_count":k,"checked":checked}
    return {"proved_minimal":True,"smaller_supports_checked":checked,"max_pair_count_exhausted":maxpairs}

def mul_support(m,bits,t):
    out=0
    for x in range(1,m):
        if (bits>>(x-1))&1:
            out|=1<<(((t*x)%m)-1)
    return out

def check(m):
    reps=WALLS[m]; S=CANDIDATES[m]; phi=support_bits(m,S)
    gens=s_generators_mod2(m)
    annih=all(dot(phi,g)==0 for g in gens)
    targetvals=[dot(phi,parity_vector(m,a)) for a in reps]
    conjugatevals=[]
    for t in units(m):
        conjugatevals.append(dot(phi,parity_vector(m,tuple((t*x)%m for x in reps[0]))))
    lb=lower_bound(m,reps[0],len(S))
    return {
      "support":S,
      "support_weight":len(S),
      "annihilates_all_pair_and_standard_generators":annih,
      "wall_representative_values":targetvals,
      "all_unit_conjugates_value_one":all(v==1 for v in conjugatevals),
      **lb
    }

print(json.dumps({
 "claim_ceiling":"Finite F_2 dual-coordinate facts only; no algebraicity or general Hodge conclusion.",
 "W70":check(70),"W110":check(110),"W114":check(114)
},indent=2,sort_keys=True))
