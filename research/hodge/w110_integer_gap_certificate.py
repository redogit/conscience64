#!/usr/bin/env python3
"""Exact, self-contained certificate for the two W110 representatives.

This proves only:
  * each tuple satisfies the finite Hodge-character test;
  * their multiplicity-vector difference lies in the declared standard lattice S_110
    by an explicit one-standard + two-pair identity;
  * a simple mod-2 functional annihilates every pair/standard generator and evaluates
    to 1 on both representatives, proving that their common S_110 coset is nonzero.

No abstract gap-group theorem and no external census code is used.
"""
from math import gcd
import json

M=110
A1=(1,24,62,71,81,91)
A2=(1,31,55,71,81,91)
SIGMA=(24,79,62,55)   # sigma_{2,24}
PAIR1=(31,79)
PAIR2=(55,55)
PHI_RESIDUES={2,5,8}  # modulo 10

def units(m):
    return [t for t in range(1,m) if gcd(t,m)==1]

def vec(entries):
    v=[0]*(M-1)
    for x in entries:
        r=x%M
        assert r
        v[r-1]+=1
    return v

def add(*vs):
    return [sum(xs) for xs in zip(*vs)]

def sub(a,b):
    return [x-y for x,y in zip(a,b)]

def scale(c,v):
    return [c*x for x in v]

def is_hodge(a):
    U=units(M)
    vals=[sum((t*x)%M for x in a) for t in U]
    return all(v==3*M for v in vals), vals

def prime_divisors(n):
    out=[]; p=2
    while p*p<=n:
        if n%p==0:
            out.append(p)
            while n%p==0: n//=p
        p+=1
    if n>1: out.append(n)
    return out

def standard_generators():
    out=[]
    for p in prime_divisors(M):
        d=M//p
        if p==2:
            for a in range(1,M//2):
                e=(a,a+M//2,M-2*a,M//2)
                if all(x%M for x in e):
                    out.append(e)
        else:
            for a in range(1,d):
                e=tuple(a+j*d for j in range(p))+(M-p*a,)
                if all(x%M for x in e):
                    out.append(e)
    return out

def pairs():
    return [(a,M-a) for a in range(1,M)]

def phi(entries):
    return sum(1 for x in entries if (x%10) in PHI_RESIDUES)%2

def main():
    ok1,vals1=is_hodge(A1); ok2,vals2=is_hodge(A2)
    assert ok1 and ok2

    delta=sub(vec(A1),vec(A2))
    rhs=add(vec(SIGMA),scale(-1,vec(PAIR1)),scale(-1,vec(PAIR2)))
    assert delta==rhs

    assert SIGMA==(24,79,62,55)
    assert all((x+y)==M for x,y in (PAIR1,PAIR2))
    assert phi(A1)==phi(A2)==1
    assert all(phi(g)==0 for g in standard_generators())
    assert all(phi(p)==0 for p in pairs())

    print(json.dumps({
      "claim_ceiling":"Exact finite character/lattice certificate only. This proves the two W110 representatives occupy the same nonzero S_110 coset. It does not prove algebraicity or identify the full abstract gap group without an external theorem.",
      "m":M,
      "representatives":[list(A1),list(A2)],
      "hodge_test":{"units":len(units(M)),"all_sums_equal_3m":True},
      "integer_certificate":{
        "identity":"nu(A1)-nu(A2)=nu(sigma_{2,24})-nu(31,79)-nu(55,55)",
        "sigma_2_24":list(SIGMA),
        "vanishing_pairs":[list(PAIR1),list(PAIR2)],
        "exact_vector_equality":True
      },
      "nonzero_coset_certificate":{
        "functional":"parity of entries whose residue mod 10 is in {2,5,8}",
        "annihilates_all_pair_generators":True,
        "annihilates_all_standard_generators":True,
        "A1_value":1,
        "A2_value":1
      }
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
