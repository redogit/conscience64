#!/usr/bin/env python3
"""Exact finite-field counterprobe for the W114 even-level reflection sign.

This checks the current 114->57 compiler normalization by evaluating the
six-fold W114 and level-57 Jacobi sums in finite residue fields and then
reducing cyclotomic values through exact maps Z[zeta_114] -> F_ell.

A mismatch modulo one such exact reduction refutes the corresponding claimed
cyclotomic identity.  The calculation is integer modular arithmetic only.
"""
from __future__ import annotations
import json
from math import gcd

D=114
ALPHA=(1,7,78,79,86,91)
F57=(29,11,17,28,40,46)

def prime_factors(n):
    out=[]
    d=2
    while d*d<=n:
        if n%d==0:
            out.append(d)
            while n%d==0:n//=d
        d+=1
    if n>1:out.append(n)
    return out

def primitive_root(p):
    fac=prime_factors(p-1)
    for g in range(2,p):
        if all(pow(g,(p-1)//q,p)!=1 for q in fac):
            return g
    raise ValueError("no primitive root")

def dlog_table(p,g):
    out=[None]*p
    x=1
    for k in range(p-1):
        out[x]=k
        x=x*g%p
    if any(out[x] is None for x in range(1,p)):
        raise AssertionError("primitive-root table incomplete")
    return out

def conv(a,b,p,ell):
    out=[0]*p
    for i,ai in enumerate(a):
        if not ai:continue
        for j,bj in enumerate(b):
            if bj:
                out[(i+j)%p]=(out[(i+j)%p]+ai*bj)%ell
    return out

def eval_root114(ell):
    if (ell-1)%D:
        raise ValueError("ell must be 1 mod 114")
    h=primitive_root(ell)
    r=pow(h,(ell-1)//D,ell)
    if pow(r,D,ell)!=1 or pow(r,D//2,ell)==1:
        raise AssertionError("chosen residue root does not have exact order 114")
    return r

def jacobi_eval(p, exponents, ell, root=None, generator=None):
    if (p-1)%D:
        raise ValueError("p must split at level 114")
    g=primitive_root(p) if generator is None else generator
    logs=dlog_table(p,g)
    r=eval_root114(ell) if root is None else root
    dp=[0]*p
    dp[0]=1
    for a in exponents:
        f=[0]*p
        for x in range(1,p):
            f[x]=pow(r,(a*logs[x])%D,ell)
        dp=conv(dp,f,p,ell)
    ans=dp[1]
    if (len(exponents)-1)%2:
        ans=(-ans)%ell
    return ans,g,r,logs

def current_twist_eval(p,ell,g,r,logs):
    z114=pow(g,(p-1)//D,p)
    z3=pow(z114,38,p)
    q=(7-z3)%p
    def chi(x):
        if x%p==0:raise ValueError("character at zero")
        return pow(r,logs[x%p]%D,ell)
    current=1
    for x,e in ((2,100),(3,3),(19,38),(q,57)):
        current=current*pow(chi(x),e,ell)%ell
    minus_one=chi(p-1)
    corrected=current*minus_one%ell
    return {
        "zeta3_mod_p":z3,
        "q_mod_p":q,
        "recorded_twist_mod_ell":current,
        "chi_minus_one_mod_ell":minus_one,
        "corrected_twist_mod_ell":corrected,
    }

def check_prime(p,ell):
    r=eval_root114(ell)
    jw,g,r,logs=jacobi_eval(p,ALPHA,ell,r)
    # eta=chi_114^2, so level-57 exponents embed by doubling.
    jf,_,_,_=jacobi_eval(p,tuple(2*a for a in F57),ell,r,g)
    if jf%ell==0:
        raise AssertionError("chosen reduction kills level-57 Jacobi value")
    twist=current_twist_eval(p,ell,g,r,logs)
    ratio=jw*pow(jf,-1,ell)%ell
    discrepancy=ratio*pow(twist["recorded_twist_mod_ell"],-1,ell)%ell
    corrected_discrepancy=ratio*pow(twist["corrected_twist_mod_ell"],-1,ell)%ell
    return {
        "p":p,"ell":ell,"primitive_root_p":g,"zeta114_eval_mod_ell":r,
        "J114_mod_ell":jw,"J57_mod_ell":jf,"ratio_mod_ell":ratio,
        **twist,
        "ratio_over_recorded_twist":discrepancy,
        "ratio_over_corrected_twist":corrected_discrepancy,
    }

def reflection_factor():
    # Current exact duplication word contains +N_1-N_2.
    # Under the characteristic-zero Fermat reflection
    # J(a,-a) ~= A(-1,a) tensor Lambda(1), the signed quotient contributes
    # A(-1,1-2)=A(-1,-1).  On the quadratic Kummer quotient only parity
    # matters, hence this equals A(-1,1).
    exponent=(1-2)%D
    return {
        "word":"N_1-N_2",
        "raw_exponent_mod114":exponent,
        "quadratic_parity":exponent%2,
        "factor":"A(-1,1)",
        "equivalent_character_notation":"chi_114(-1)",
    }

def run():
    p229=check_prime(229,457)
    if p229["ratio_over_recorded_twist"]!=1:
        raise AssertionError("p=229 calibration no longer matches preserved exact identity")

    p571a=check_prime(571,229)
    p571b=check_prime(571,457)
    for x in (p571a,p571b):
        if x["ratio_over_recorded_twist"] != x["ell"]-1:
            raise AssertionError("p=571 discrepancy is not the exact -1 sign")
        if x["ratio_over_recorded_twist"] != x["chi_minus_one_mod_ell"]:
            raise AssertionError("p=571 discrepancy does not equal chi_114(-1)")
        if x["ratio_over_corrected_twist"] != 1:
            raise AssertionError("adding chi_114(-1) did not close the p=571 check")

    return {
        "schema":"conscience64/w114-even-reflection-sign-correction/v1",
        "calibration_p229":p229,
        "counterprobe_p571":[p571a,p571b],
        "reflection_word_factor":reflection_factor(),
        "forward_correction":(
            "epsilon_full = chi_114(-1) * chi_114(2)^100 * "
            "chi_114(3)^3 * chi_114(19)^38 * chi_114(7-zeta_3)^57"
        ),
        "corrected_artin_target":(
            "A(-1,1) tensor A(2,100) tensor A(3,60) tensor "
            "A(19,38) tensor A(3*(7-zeta_3),57)"
        ),
        "preserved_level57_sign":"A(3*(7-zeta_3),57)",
        "claim_ceiling":[
            "FINITE_RESIDUE_COUNTERPROBE != FULL_CHOW_CORRESPONDENCE",
            "LEVEL57_AOKI_SIGN_REMAINS_UNCHANGED",
            "FULL_114_COMPILER_TARGET_REQUIRES_EXTRA_EVEN_REFLECTION_FACTOR",
            "MOT_1_REMAINS_OPEN",
        ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
