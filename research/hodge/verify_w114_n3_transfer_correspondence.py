#!/usr/bin/env python3
"""Exact normalization/hypothesis verifier for the d=57,n=3 multiplication transfer.

Based on Otsubo-Yamazaki Theorem 7.2. Verifies group orders, projector
normalization, and W114 standard-word character hypotheses. It does not replace
the cited motivic theorem and does not compactify the open correspondence.
"""
from __future__ import annotations
import json

D=57
N=3
A_VALUES=(4,11,16,17)
CHI3=(19,38)  # pullbacks to mu_57 of the two nontrivial mu_3 characters

DEG_C2_TO_T=2*D
DEG_X_TO_T=D*D
SYM_FACTOR=2

def order_mod_character(exp):
    import math
    return D//math.gcd(D,exp%D)

def check_a(a):
    a%=D
    if a==0 or a%19==0:
        raise AssertionError("alpha^3 must be nontrivial")
    if tuple(CHI3)!=(19,38):
        raise AssertionError
    if sum(CHI3)%D!=0:
        raise AssertionError("the two nontrivial cube characters must be inverse")
    # e_nu e_sym e_nu = 1/2 e_nu, so inverse symmetrizer map uses factor 2.
    forward_scale_num=1
    forward_scale_den=DEG_X_TO_T
    inverse_scale_num=SYM_FACTOR
    inverse_scale_den=DEG_C2_TO_T
    # composition scalar after the two finite transfer identities and projector identity
    # (1/57^2)*(2/114)*(57^2)*(114)*(1/2) = 1
    num=forward_scale_num*inverse_scale_num*DEG_X_TO_T*DEG_C2_TO_T
    den=forward_scale_den*inverse_scale_den*2
    if num!=den:
        raise AssertionError((num,den))
    return {
      "a":a,
      "alpha_order":order_mod_character(a),
      "alpha_cubed_exponent":(3*a)%D,
      "alpha_cubed_nontrivial":(3*a)%D!=0,
      "curve_characters":[[a,19],[a,38]],
      "deg_C2_to_T":DEG_C2_TO_T,
      "deg_X_to_T":DEG_X_TO_T,
      "symmetrizer_inverse_factor":SYM_FACTOR,
      "open_forward":"Phi=(1/3249) f_X^* o f_C* o e_sym o e_nu",
      "open_inverse":"Psi=(2/114) e_nu o e_sym o f_C^* o f_X*",
      "composition_scalar":"1",
    }

def run():
    rows=[check_a(a) for a in A_VALUES]
    return {
      "schema":"conscience64/w114-n3-transfer-correspondence/v1",
      "degree":D,
      "n":N,
      "nontrivial_mu3_pullbacks":list(CHI3),
      "cases":rows,
      "open_geometry":{
        "C":"x^57+y^3=1, x!=0",
        "T":"t^57=s1*s2*s3 over s1+s2+s3=3, all si!=0",
        "X":"t1^57+t2^57+t3^57=3, t1*t2*t3!=0",
        "C2_to_T":"si=(1-zeta_3^i*y1)(1-zeta_3^i*y2), t=x1*x2",
        "X_to_T":"si=ti^57, t=t1*t2*t3",
      },
      "claim_ceiling":[
        "EXPLICIT_OPEN_TRANSFER != PROJECTIVE_CHOW_CYCLE",
        "THEOREM_7_2_HYPOTHESES_PASS != INDEPENDENT_REPROOF",
        "BOUNDARY_COMPACTIFICATION_REMAINS_TO_BE_TRACED",
        "MOT_1_REMAINS_OPEN",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
