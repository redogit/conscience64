#!/usr/bin/env python3
"""Verify W114 explicit Katsura-Shioda correspondence hypotheses.

Checks exact character arithmetic for the three recursive stages.
The cited Otsubo-Yamazaki theorems supply the Chow-motive identities.
"""
from __future__ import annotations
import json

D=114
STAGES=(
  {"target":(7,78,79,86,91),"lower":(7,78,79,63),"curve":(86,91)},
  {"target":(7,78,79,63),"lower":(7,78,28),"curve":(79,63)},
  {"target":(7,78,28),"lower":(7,106),"curve":(78,28)},
)

def mod(x): return x % D

def check_stage(stage):
    target=stage["target"]; lower=stage["lower"]; curve=stage["curve"]
    a,b=target[-2:]
    merged=mod(a+b)
    expected=tuple(target[:-2])+(merged,)
    if lower!=expected: raise AssertionError((lower,expected))
    if curve!=(a,b): raise AssertionError((curve,(a,b)))
    if merged==0: raise AssertionError("merged character is trivial")
    if a==0 or b==0: raise AssertionError("last character is trivial")
    h_exp=mod(merged-a-b)
    if h_exp!=0: raise AssertionError("source character is not H-trivial")
    return {
      "target":list(target),
      "lower":list(lower),
      "curve":list(curve),
      "merged_exponent":merged,
      "H_restriction_exponent":h_exp,
      "source_exceptional_Z":"VANISHES: merged character nontrivial",
      "target_exceptional_Z1":"VANISHES: merged character nontrivial",
      "target_exceptional_Z2":"VANISHES: last two characters individually nontrivial",
      "quotient_degree":D,
      "forward_correspondence":"C=e_target o Gamma_beta o Gamma_f o tGamma_alpha o e_source",
      "inverse_correspondence":"D=(1/114) e_source o Gamma_alpha o tGamma_f o tGamma_beta o e_target",
      "finite_quotient_identity":"f_* f^*=114 id; f^* f_*=sum_H h_*=114 id on H-trivial source projector",
    }

def run():
    checked=[check_stage(x) for x in STAGES]
    if [x["merged_exponent"] for x in checked] != [63,28,106]:
        raise AssertionError("unexpected merge sequence")
    return {
      "schema":"conscience64/w114-explicit-ks-correspondence/v1",
      "degree":D,
      "stages":checked,
      "full_forward":"C1 o (C2 tensor id_(86,91)) o (C3 tensor id_(79,63) tensor id_(86,91))",
      "full_inverse":"(D3 tensor id_(79,63) tensor id_(86,91)) o (D2 tensor id_(86,91)) o D1",
      "consequence":"Under cited blow-up/quotient identities, graph/projector cycles give mutually inverse Chow-motive correspondences between W114 eigenspace and four admitted Fermat-curve factors.",
      "claim_ceiling":[
        "HYPOTHESIS_VERIFIER != INDEPENDENT_PROOF_OF_CITED_THEOREMS",
        "EXPLICIT_W114_RECURSION_CORRESPONDENCE != MOT_1_CLOSED",
        "STANDARD_RELATION_WORD_COMPOSED_CYCLE_REMAINS_OPEN",
        "HODGE_CONJECTURE_REMAINS_OPEN",
      ],
    }

if __name__=="__main__":
    print(json.dumps(run(),indent=2,sort_keys=True))
