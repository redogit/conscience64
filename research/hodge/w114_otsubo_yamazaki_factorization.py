#!/usr/bin/env python3
"""Exact W114 Otsubo-Yamazaki Fermat-motive recursion check.

This verifies only the character arithmetic needed to apply Proposition 4.11(ii)
of Otsubo-Yamazaki, "Motivic Gauss and Jacobi sums" (AFST 2026, DOI 10.5802/afst.1842)
to the W114 Fermat-fourfold eigenspace under the standard fixed-u0 convention.

It does NOT construct the explicit Chow correspondence.
"""
from __future__ import annotations
import json

D = 114
ALPHA = (1, 7, 78, 79, 86, 91)
CHI = ALPHA[1:]  # fixed-u0 projective convention candidate

def nz(x): return x % D != 0

def reduce_once(chars):
    if len(chars) < 3:
        raise ValueError("need at least 3 characters for recursive reduction")
    a, b = chars[-2], chars[-1]
    merged = (a + b) % D
    if not nz(a) or not nz(b) or not nz(merged):
        raise ValueError("Proposition 4.11(ii) nontrivial-pair condition fails")
    lower = tuple(chars[:-2]) + (merged,)
    curve = (a % D, b % D)
    return lower, curve, merged

def run():
    if sum(ALPHA) % D != 0:
        raise AssertionError("projective Fermat character must sum to 0 mod d")
    if any(not nz(x) for x in ALPHA):
        raise AssertionError("all W114 projective character entries must be nonzero")
    # For the fixed-u0 action, product(chi_i) = zeta^{-a0}.
    if sum(CHI) % D != (-ALPHA[0]) % D:
        raise AssertionError("fixed-u0 character translation consistency failed")

    current = tuple(CHI)
    curves = []
    steps = []
    while len(current) > 2:
        lower, curve, merged = reduce_once(current)
        steps.append({
            "input": list(current),
            "paired": list(curve),
            "merged": merged,
            "lower": list(lower),
            "prop_4_11_ii_condition": "PASS",
        })
        curves.append(curve)
        current = lower

    if len(current) != 2 or any(not nz(x) for x in current):
        raise AssertionError("final Fermat-curve character invalid")
    if sum(current) % D == 0:
        raise AssertionError("final Fermat-curve pair would be trivial-product exceptional case")
    curves.append(current)

    expected = [(86,91),(79,63),(78,28),(7,106)]
    if curves != expected:
        raise AssertionError(f"unexpected recursive factors: {curves}")

    return {
        "schema": "conscience64/w114-otsubo-yamazaki-factorization/v1",
        "degree": D,
        "alpha": list(ALPHA),
        "fixed_u0_character": list(CHI),
        "steps": steps,
        "curve_factors": [list(x) for x in curves],
        "motivic_statement": (
            "Conditional on the standard fixed-u0 translation of the six-entry "
            "projective character, repeated Proposition 4.11(ii) gives "
            "h(F_114^(5))^(7,78,79,86,91) ≅ "
            "h(F_114^(2))^(7,106) ⊗ h(F_114^(2))^(78,28) ⊗ "
            "h(F_114^(2))^(79,63) ⊗ h(F_114^(2))^(86,91)."
        ),
        "claim_ceiling": [
            "CHARACTER_ARITHMETIC_PASS != EXPLICIT_CHOW_CORRESPONDENCE",
            "MOTIVIC_ISOMORPHISM_EXISTENCE != TRACED_CYCLE",
            "FIXED_U0_TRANSLATION_MUST_MATCH_TARGET_NATIVE_CONVENTION",
            "FERMAT_CURVE_TENSOR_FACTORIZATION != STANDARD_PART_X_ARTIN_MATCH",
            "MOT_1_REMAINS_OPEN",
        ],
    }

if __name__ == "__main__":
    print(json.dumps(run(), indent=2, sort_keys=True))
