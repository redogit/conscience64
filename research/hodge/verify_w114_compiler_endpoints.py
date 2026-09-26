#!/usr/bin/env python3
"""Exact endpoint certificates for the current W114 Chow-correspondence compiler.

Checks:
1. explicit level-57 plane source pairing/projector normalization;
2. exact 114->57 duplication relation word;
3. corrected full finite Artin target factorization.

These are exact finite arithmetic checks, not a proof of the remaining composed
Chow correspondence.
"""
from __future__ import annotations
from collections import Counter
from fractions import Fraction
import json

M114=114
D57=57
F=(29,11,17,28,40,46)

def residue(x,m):
    x%=m
    return x

def vec_add(v,k,n=1):
    k=residue(k,M114)
    if k==0: raise ValueError("zero character not allowed in this free-vector check")
    v[k]+=n

def d2(a):
    v=Counter()
    for k,n in ((a,1),(a+57,1),(2*a,-1),(57,-1)): vec_add(v,k,n)
    return v

def norm(a):
    v=Counter();vec_add(v,a,1);vec_add(v,-a,1);return v

def clean(v):
    return {str(k):n for k,n in sorted(v.items()) if n}

def duplication_check():
    jw=Counter()
    for a in (1,7,78,79,86): vec_add(jw,a,1)
    vec_add(jw,23,-1)

    jf=Counter()
    # J_f after the H_11 numerator/denominator cancellation, embedded by H_a=G_(2a).
    for a in (29,17,28,40): vec_add(jf,2*a,1)

    s=Counter()
    for a in (1,7,22,39,43): vec_add(s,2*a,1)
    for a in (23,29,32,11,17): vec_add(s,2*a,-1)

    lhs=Counter(jw);lhs.subtract(jf);lhs.subtract(s)
    rhs=Counter()
    for a,sgn in ((7,1),(22,1),(23,-1),(56,-1)):
        for k,n in d2(a).items(): rhs[k]+=sgn*n
    for a,sgn in ((1,1),(2,-1)):
        for k,n in norm(a).items(): rhs[k]+=sgn*n
    if clean(lhs)!=clean(rhs): raise AssertionError((clean(lhs),clean(rhs)))

    exponent_2=(-2*(7+22-23-56))%M114
    if exponent_2!=100: raise AssertionError(exponent_2)
    return {
      "free_vector":clean(lhs),
      "word":"D2_7 + D2_22 - D2_23 - D2_56 + N_1 - N_2",
      "chi_114_2_exponent":exponent_2,
    }

def plane_check():
    if not (F[0]+F[3]==57 and F[1]+F[5]==57 and F[2]+F[4]==57):
        raise AssertionError("f does not pair complementarily")
    d=57
    I3=d*d-3*d+3
    I2=2-d
    I1=1
    fourier=I3-3*I2+3*I1
    if fourier!=d*d: raise AssertionError(fourier)
    pairing=Fraction(fourier,d**3)
    if pairing!=Fraction(1,d): raise AssertionError(pairing)
    return {
      "f":list(F),
      "plane_equations":[
        "x0+x3=0","x1+x5=0","x2+x4=0"
      ],
      "intersection":{"I3":I3,"I2":I2,"I1":I1,"I0":0},
      "fourier_coefficient":fourier,
      "projected_pairing":str(pairing),
      "rank_one_projector":"P_f = 57 * (z_f x z_bar_f)",
      "source_motive":"(X_57^4,P_f) ~= Lambda(2)",
    }

def artin_target_check():
    # Historical exact full twist:
    # A(2,100) A(3,3) A(19,38) A(q,57), q=7-zeta_3.
    # Corrected split uses A(3q,57) and shifts the 3 exponent by -57.
    old={"2":100,"3":3,"19":38,"q":57}
    corrected={"2":100,"3":60,"19":38,"3q":57}
    # A(3,60) tensor A(3q,57)
    # = A(3,60+57) tensor A(q,57)
    # = A(3,3) tensor A(q,57) mod 114.
    if (60+57)%114 != 3: raise AssertionError
    return {
      "historical_exact_exponents":old,
      "corrected_factorization":corrected,
      "identity":"A(3,60) tensor A(3q,57) = A(3,3) tensor A(q,57)",
      "q":"7-zeta_3",
      "quadratic_factor":"A(3*(7-zeta_3),57)",
      "quadratic_order":2,
      "full_target":(
        "A(2,100) tensor A(3,60) tensor A(19,38) "
        "tensor A(3*(7-zeta_3),57)"
      ),
    }

def run():
    return {
      "schema":"conscience64/w114-compiler-endpoints/v1",
      "plane_source":plane_check(),
      "duplication":duplication_check(),
      "artin_target":artin_target_check(),
      "compiler_obligation":(
        "compose the explicit level-57 plane projector through the admitted "
        "reflection/multiplication/duplication correspondences and corrected "
        "Artin twist, then verify the resulting W114 projected realization"
      ),
      "claim_ceiling":[
        "EXPLICIT_SOURCE_AND_TARGET != COMPOSED_CHOW_CORRESPONDENCE",
        "EXACT_FREE_VECTOR_IDENTITY != MOTIVE_ISOMORPHISM_WITHOUT_COMPILED_MAPS",
        "PLANE_PROJECTOR_ARITHMETIC != INDEPENDENT_REPROOF_OF_INTERSECTION_FORMULA",
        "MOT_1_REMAINS_OPEN",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
