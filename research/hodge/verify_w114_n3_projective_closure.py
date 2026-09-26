#!/usr/bin/env python3
"""Boundary-projector checks for projectivizing the W114 d=57,n=3 transfer.

Mathematical input: Otsubo-Yamazaki Proposition 3.5(i),(ii) and Theorem 7.2.
The finite checks below verify exactly the character restrictions used to kill
the omitted boundary strata for a in {4,11,16,17}.

This is a support-annihilation verifier, not an independent proof of the cited
localization theorem.
"""
from __future__ import annotations
import json

D=57
N=3
A_VALUES=(4,11,16,17)
CHI=(19,38)
KERNEL_GENERATOR_EXPONENT=3  # zeta_57^3 generates ker(mu_57 -> mu_3)

def mod(x): return x%D

def check(a):
    a=mod(a)
    if a==0: raise AssertionError("alpha trivial")
    diagonal_x=mod(N*a)
    if diagonal_x==0:
        raise AssertionError("X boundary survives diagonal projector")

    curve=[]
    for k in CHI:
        diag=mod(a+k)
        u1_stabilizer=a
        kernel_eval=mod(KERNEL_GENERATOR_EXPONENT*k)
        if diag==0:
            raise AssertionError(f"Fermat-curve u0 boundary survives for a={a}, k={k}")
        if u1_stabilizer==0:
            raise AssertionError("Fermat-curve u1 boundary survives")
        if kernel_eval!=0:
            raise AssertionError("character does not descend through C quotient")
        curve.append({
          "chi_exponent":k,
          "u0_boundary_diagonal_exponent":diag,
          "u1_boundary_alpha_exponent":u1_stabilizer,
          "mu19_kernel_character_exponent":kernel_eval,
          "u0_boundary":"PROJECTOR_ZERO",
          "u1_boundary":"PROJECTOR_ZERO",
          "quotient_descent":"PASS",
        })
    return {
      "a":a,
      "X_boundary_diagonal_exponent":diagonal_x,
      "X_boundary":"PROJECTOR_ZERO",
      "curve_factors":curve,
      "projective_closure_rule":(
        "sandwich the Zariski closure of the open transfer correspondence "
        "between the same character projectors; boundary-supported corrections "
        "factor through projector-zero strata"
      ),
    }

def run():
    cases=[check(a) for a in A_VALUES]
    return {
      "schema":"conscience64/w114-n3-projective-closure/v1",
      "degree":D,
      "n":N,
      "cases":cases,
      "candidate_projective_forward":(
        "barPhi_a = e_X o [closure(Gamma_open_forward)] o "
        "(e_(a,19) x e_(a,38))"
      ),
      "candidate_projective_inverse":(
        "barPsi_a = (e_(a,19) x e_(a,38)) o "
        "[closure(Gamma_open_inverse)] o e_X"
      ),
      "support_lemma":(
        "Any correction supported on an omitted boundary stratum is killed "
        "after projector sandwiching because that boundary motive has zero "
        "component for the declared character."
      ),
      "claim_ceiling":[
        "BOUNDARY_CHARACTER_CHECK != INDEPENDENT_PROOF_OF_LOCALIZATION",
        "PROJECTOR_SANDWICHED_CLOSURE_FORMULA != CYCLE_LEVEL_COMPOSITION_AUDIT",
        "N3_PROJECTIVE_EDGE != FULL_MOT_1_CORRESPONDENCE",
        "HODGE_CONJECTURE_REMAINS_OPEN",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
