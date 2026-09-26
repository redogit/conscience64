#!/usr/bin/env python3
"""Exact character arithmetic for an explicit W114 corrected Artin-sign carrier.

Uses the two already-admitted Fermat-curve factors (7,106) and (79,63)
and Otsubo-Yamazaki Proposition 4.7.

This verifies the character identity only. The cited proposition supplies the
Chow-motive twist isomorphism; this script does not itself prove that theorem.
"""
from __future__ import annotations
import json, math

D=114
C="3*(7-zeta_3)"
P=(7,106)
Q=(79,63)

def product_exponent(pair):
    return sum(pair) % D

def order(exp):
    return D // math.gcd(D,exp%D)

def run():
    p=product_exponent(P)
    q=product_exponent(Q)
    exponent=(p-2*q)%D
    if p!=113: raise AssertionError(p)
    if q!=28: raise AssertionError(q)
    if exponent!=57: raise AssertionError(exponent)
    if order(exponent)!=2: raise AssertionError(order(exponent))
    if pow(-1,1) != -1: raise AssertionError
    return {
      "schema":"conscience64/w114-explicit-artin-carrier/v1",
      "degree":D,
      "coefficient_c":C,
      "factor_P":list(P),
      "factor_P_product_exponent":p,
      "factor_Q":list(Q),
      "factor_Q_product_exponent":q,
      "artin_exponent_relation":f"{p}-2*{q} == {exponent} (mod {D})",
      "resulting_character_exponent":exponent,
      "resulting_character_order":order(exponent),
      "motivic_formula":(
        "T_P(c) tensor T_Q(c)^(-2) ~= Lambda<c>^(chi_114^57), "
        "where T_(a,b)(c)=h(F_114^(2)<c>)^(a,b) tensor "
        "(h(F_114^(2))^(a,b))^vee."
      ),
      "quadratic_identification":(
        "chi_114^57 factors through mu_2, so by the Kummer-motive "
        "factor-through rule this is the quadratic Artin motive for k(sqrt(c))/k."
      ),
      "claim_ceiling":[
        "EXACT_CHARACTER_IDENTITY != MOT_1_CLOSED",
        "PROP_4_7_MOTIVIC_TWIST != ONE_COMPOSED_W114_CORRESPONDENCE",
        "ARTIN_SIGN_CARRIER_EXPLICIT != STANDARD_PART_CORRESPONDENCE_EXPLICIT",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
