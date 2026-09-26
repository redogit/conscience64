#!/usr/bin/env python3
"""Exact W114 duplication/reflection primitive checks.

Compiles:
- four n=2,d=114 Davenport-Hasse correspondence edges;
- reflection/norm primitives used by the duplication word.

Mathematical input:
Otsubo-Yamazaki Theorem 7.2, Proposition 3.5, Proposition 4.5(i),
and Lemma 4.4.

The script verifies finite character/group arithmetic only.
"""
from __future__ import annotations
import json
import math

D=114
A_VALUES=(7,22,23,56)
QUADRATIC_EXP=57

def mod(x): return x%D

def order(exp): return D//math.gcd(D,exp%D)

def n2_case(a):
    a=mod(a)
    if a==0 or mod(2*a)==0:
        raise AssertionError("Theorem 7.2 requires alpha^2 != 1")
    # C -> T has group mu_d -> mu_d by identity, so kernel degree 1.
    deg_c=1
    # X -> T has kernel of mu_d^2 -> mu_d product, order d.
    deg_x=D
    # C is quotient of the open Fermat curve by mu_(d/2)=mu_57;
    # chi^57 is trivial on that kernel.
    kernel_eval=mod(2*QUADRATIC_EXP)
    if kernel_eval!=0: raise AssertionError("quadratic character fails quotient descent")
    # Projective boundary checks from the same Prop 3.5 argument.
    x_boundary=mod(2*a)
    curve_u0=mod(a+QUADRATIC_EXP)
    curve_u1=a
    if 0 in (x_boundary,curve_u0,curve_u1):
        raise AssertionError("boundary projector component survives")
    # Convenient mutually inverse normalization:
    # Cpiece -> T is degree 1; T -> X is f_X^*.
    # reverse uses (1/d) f_X*.
    return {
      "a":a,
      "alpha_squared_exponent":mod(2*a),
      "alpha_squared_nontrivial":True,
      "curve_factor":[a,QUADRATIC_EXP],
      "deg_C_to_T":deg_c,
      "deg_X_to_T":deg_x,
      "forward":"Phi_a = f_X^* o f_C* on projected open motives",
      "inverse":"Psi_a = (1/114) f_C^* o f_X* on projected open motives",
      "composition_scalar":"1",
      "projective_boundary":{
        "X_diagonal_exponent":x_boundary,
        "curve_u0_diagonal_exponent":curve_u0,
        "curve_u1_alpha_exponent":curve_u1,
        "mu57_kernel_eval_exponent":kernel_eval,
        "status":"PROJECTOR_ZERO_BOUNDARIES_AND_QUOTIENT_DESCENT_PASS",
      },
      "twist_relation":(
        "h(F_114^(2)<2>)^(a,a) ~= h(F_114^(2))^(a,57); "
        "Prop 4.7 rewrites the left side as "
        "h(F_114^(2))^(a,a) tensor A(2,2a)"
      ),
      "artin_2_exponent":mod(2*a),
    }

def reflection_case(a):
    a=mod(a)
    if a==0: raise AssertionError("reflection character must be nontrivial")
    return {
      "a":a,
      "character_exponents":[a,mod(-a)],
      "intersection_number":-1,
      "projector_recipe":(
        "P_ref = - (E_(psi,a) external_product E_(barpsi,-a)) "
        "after the canonical factor permutation"
      ),
      "forward_to_rank_one":"Lambda(1) -> M via projected E_(psi,a)",
      "inverse_from_rank_one":"M -> Lambda(1) via -E_(barpsi,-a)",
      "source":"Otsubo-Yamazaki Proposition 4.5(i) + Lemma 4.4",
    }

def run():
    d2=[n2_case(a) for a in A_VALUES]
    refl=[reflection_case(a) for a in (1,2)]
    # Signed duplication word Artin exponent.
    signed=((7,1),(22,1),(23,-1),(56,-1))
    exponent=sum(sgn*(-2*a) for a,sgn in signed)%D
    if exponent!=100: raise AssertionError(exponent)
    # The N1-N2 pair contributes equal Tate/reflection rank-one factors
    # with opposite word signs; no residual Tate power remains.
    return {
      "schema":"conscience64/w114-duplication-reflection-primitives/v1",
      "degree":D,
      "n2_edges":d2,
      "reflection_edges":refl,
      "duplication_word":"D2_7 + D2_22 - D2_23 - D2_56 + N_1 - N_2",
      "signed_artin_2_exponent":exponent,
      "reflection_net_tate_exponent":0,
      "claim_ceiling":[
        "PRIMITIVE_CORRESPONDENCE_RECIPES != FULL_COMPILER_COMPOSITION",
        "THEOREM_HYPOTHESES_PASS != INDEPENDENT_REPROOF",
        "SIGNED_WORD_STILL_REQUIRES_DIRECTIONAL_COMPOSITION_AUDIT",
        "MOT_1_REMAINS_OPEN",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
