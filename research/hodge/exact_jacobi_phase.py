#!/usr/bin/env python3
"""Exact normalized Jacobi-phase checker for selected Fermat-fourfold wall characters.

No external census or CAS is imported.  For p == 1 (mod m), choose a primitive root g,
compute pair Jacobi sums by exact discrete-log counting, multiply them using the standard
recursive Jacobi identity, and reduce in Z[x]/Phi_m(x).  For six nontrivial characters
whose product is trivial, the Fermat convention used here is j(a) = -J(a_1,...,a_6).

A reported exponent r means the exact identity
    j_p(a) = p^2 * zeta_m^r
was verified by zero polynomial remainder modulo Phi_m.  These are finite arithmetic facts,
not algebraicity statements.
"""
from __future__ import annotations
from functools import lru_cache
from itertools import permutations
from math import gcd
import json

W70=(1,20,24,42,61,62)
W110=((1,24,62,71,81,91),(1,31,55,71,81,91))
W114=((1,7,78,79,86,91),(1,13,43,72,103,110),(1,13,43,80,102,103))

def trim(a):
    a=list(a)
    while len(a)>1 and a[-1]==0:
        a.pop()
    return a

def divisors(n):
    return [d for d in range(1,n+1) if n%d==0]

def poly_div_exact(a,b):
    a=trim(a); b=trim(b)
    if b[-1]!=1:
        raise ValueError("cyclotomic divisor must be monic")
    q=[0]*max(1,len(a)-len(b)+1)
    db=len(b)-1
    while len(a)-1>=db:
        c=a[-1]; k=(len(a)-1)-db
        q[k]=c
        for j,bj in enumerate(b):
            a[k+j]-=c*bj
        a=trim(a)
    if any(a):
        raise ArithmeticError("non-exact polynomial division")
    return trim(q)

@lru_cache(None)
def cyclotomic(n):
    p=[-1]+[0]*(n-1)+[1]  # x^n - 1
    for d in divisors(n):
        if d==n:
            break
        p=poly_div_exact(p,cyclotomic(d))
    return tuple(p)

def poly_mod_monic(a,b):
    a=trim(a); b=trim(b); db=len(b)-1
    while len(a)-1>=db:
        c=a[-1]
        if c:
            k=(len(a)-1)-db
            for j,bj in enumerate(b):
                a[k+j]-=c*bj
        a=trim(a)
    return a+[0]*(db-len(a))

def mul_mod(a,b,phi):
    c=[0]*(len(a)+len(b)-1)
    for i,ai in enumerate(a):
        if ai:
            for j,bj in enumerate(b):
                if bj:
                    c[i+j]+=ai*bj
    return poly_mod_monic(c,phi)

def prime_factors(n):
    out=[]; d=2
    while d*d<=n:
        if n%d==0:
            out.append(d)
            while n%d==0:
                n//=d
        d+=1
    if n>1:
        out.append(n)
    return out

def is_prime(n):
    if n<2:
        return False
    if n%2==0:
        return n==2
    d=3
    while d*d<=n:
        if n%d==0:
            return False
        d+=2
    return True

def primitive_root(p):
    fac=prime_factors(p-1)
    for g in range(2,p):
        if all(pow(g,(p-1)//q,p)!=1 for q in fac):
            return g
    raise ArithmeticError("primitive root not found")

def discrete_logs(p,g):
    out=[-1]*p
    x=1
    for k in range(p-1):
        out[x]=k
        x=(x*g)%p
    if x!=1 or any(v<0 for v in out[1:]):
        raise ArithmeticError("discrete-log table incomplete")
    return out

def safe_order(a,m):
    for aa in permutations(a):
        s=0
        ok=True
        for v in aa[:-1]:
            s=(s+v)%m
            if s==0:
                ok=False
                break
        if ok:
            return aa
    raise ArithmeticError("no recursion order avoids a trivial intermediate character")

def pair_jacobi(m,p,logs,A,B,phi):
    coeff=[0]*m
    for x in range(1,p):
        y=(1-x)%p
        if y==0:
            continue
        e=(A*logs[x]+B*logs[y])%m
        coeff[e]+=1
    return poly_mod_monic(coeff,phi)

def root_order(m,r):
    return 1 if r==0 else m//gcd(m,r)

def exact_phase(m,p,a):
    if not is_prime(p) or (p-1)%m:
        raise ValueError("p must be prime and congruent to 1 mod m")
    if any(x<=0 or x>=m for x in a) or sum(a)%m:
        raise ValueError("invalid nonzero character tuple")
    phi=list(cyclotomic(m)); deg=len(phi)-1
    g=primitive_root(p); logs=discrete_logs(p,g)
    aa=safe_order(a,m)
    acc=[1]+[0]*(deg-1)
    s=aa[0]%m
    for v in aa[1:]:
        acc=mul_mod(acc,pair_jacobi(m,p,logs,s,v%m,phi),phi)
        s=(s+v)%m
    acc=[-x for x in acc]  # Fermat six-character convention: j = -J
    hits=[]
    for r in range(m):
        rhs=poly_mod_monic([0]*r+[p*p],phi)
        if rhs==acc:
            hits.append(r)
    if len(hits)!=1:
        raise ArithmeticError(f"expected one root-of-unity phase, got {hits}")
    r=hits[0]
    return {
        "m":m,"p":p,"primitive_root":g,"character":list(a),
        "recursive_order":list(aa),"phase_exponent":r,
        "phase_order":root_order(m,r),
        "identity":f"j_p(a) = {p}^2 * zeta_{m}^{r}",
        "cyclotomic_remainder_verified_zero":True
    }

def split_primes(m,count):
    out=[]; k=1
    while len(out)<count:
        p=k*m+1
        if is_prime(p):
            out.append(p)
        k+=1
    return out

def profile(m,characters,count=6):
    ps=split_primes(m,count)
    return {
        "m":m,
        "split_primes":ps,
        "characters":[
            {"character":list(a),"checks":[exact_phase(m,p,a) for p in ps]}
            for a in characters
        ]
    }

def main():
    result={
      "claim_ceiling":"Exact finite Jacobi-sum identities at the listed split primes only. Root-of-unity phases constrain possible fields of definition under an explicit Frobenius-fixed cycle hypothesis; they do not prove algebraicity or non-algebraicity.",
      "implementation":"pure Python integer arithmetic; no external census code or CAS",
      "profiles":[
        profile(70,(W70,),6),
        profile(110,W110,6),
        profile(114,W114,6),
      ]
    }
    print(json.dumps(result,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
