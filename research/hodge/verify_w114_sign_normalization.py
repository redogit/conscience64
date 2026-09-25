#!/usr/bin/env python3
"""Exact W114 level-57 sign-normalization correction verifier.

This is an arithmetic/provenance verifier only. It does not construct the
missing Chow correspondence and does not prove the Hodge conjecture.
"""
from __future__ import annotations

M = 57

ALPHA_S = {
    1: 1, 7: 1, 22: 1, 39: 1, 43: 1,
    23: -1, 29: -1, 32: -1, 11: -1, 17: -1,
}

H1 = (1, 4, 7, 16, 25, 28, 43, 49, 55)

# Power-basis certificate for sqrt(57) in Q(zeta_57).
SQRT57 = (
    3,0,0,2,0,-4,4,0,0,4,-2,-4,2,-2,0,2,0,-4,
    2,2,-4,2,0,-4,0,4,-4,2,4,-2,0,0,-2,2,0,-4,
)

# Exact witness w satisfying
# w^2 * (-15 - 2 sqrt(57)) = 3 * (7 - zeta_57^19).
WITNESS_W = (
    -4,0,0,2,0,-4,4,0,0,4,-2,-4,2,-2,0,2,0,-4,
    2,3,-4,2,0,-4,0,4,-4,2,4,-2,0,0,-2,2,0,-4,
)

# Phi_57(x), low-to-high coefficients.
PHI57 = (
    1,-1,0,1,-1,0,1,-1,0,1,-1,0,1,-1,0,1,-1,0,1,
    0,-1,1,0,-1,1,0,-1,1,0,-1,1,0,-1,1,0,-1,1,
)

BOUNDARIES = (
    "CORRECTED_SIGN_NORMALIZATION != CHOW_CORRESPONDENCE",
    "FULL_ORDER_114_KUMMER_FORMULA_REMAINS_SEPARATE",
    "ARITHMETIC_IDENTITY != HODGE_PROOF",
)


def add(v, a, c=1):
    a %= M
    if a == 0:
        raise ValueError("zero residue is outside R_57")
    v[a - 1] += c


def reflection(a):
    v = [0] * 56
    add(v, a)
    add(v, -a)
    return v


def gamma3(a):
    # Aoki gamma_{l,a}, l=3, d=57/3=19:
    # [a, a+19, a+38, -3a]
    v = [0] * 56
    for r in (a, a + 19, a + 38, -3 * a):
        add(v, r)
    return v


def vec(d):
    v = [0] * 56
    for a, c in d.items():
        add(v, a, c)
    return v


def alpha_aoki():
    # Aoki Proposition 4.1: alpha = eta + [-3] eta_1.
    # Here [-3] is the residue-label action, not a negative coefficient.
    v = [0] * 56
    for a in H1:
        add(v, a)
        add(v, -3 * a)
    return v


def lincomb(terms):
    out = [0] * 56
    for coeff, generator in terms:
        for i, x in enumerate(generator):
            out[i] += coeff * x
    return out


def poly_trim(a):
    while len(a) > 1 and a[-1] == 0:
        a.pop()
    return a


def poly_add(a, b):
    n = max(len(a), len(b))
    out = [0] * n
    for i in range(n):
        out[i] = (a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0)
    return poly_trim(out)


def poly_mul(a, b):
    out = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            out[i + j] += x * y
    return poly_trim(out)


def mod_phi57(a):
    a = list(a)
    phi = list(PHI57)
    deg = len(phi) - 1
    if phi[-1] != 1:
        raise AssertionError("Phi_57 must be monic")
    while len(a) - 1 >= deg:
        k = len(a) - 1 - deg
        c = a[-1]
        if c:
            for j, pj in enumerate(phi):
                a[k + j] -= c * pj
        poly_trim(a)
    a += [0] * (deg - len(a))
    return tuple(a[:deg])


def pconst(c):
    return (c,)


def pzeta(power, coeff=1):
    out = [0] * (power + 1)
    out[power] = coeff
    return tuple(out)


def verify_relation_word():
    a_s = vec(ALPHA_S)
    a_a = alpha_aoki()
    beta = [x - y for x, y in zip(a_s, a_a)]

    # Exact short standard word found by integer lattice optimization.
    word = lincomb((
        (+1, reflection(22)),
        (-1, reflection(25)),
        (-1, reflection(28)),
        (-1, gamma3(4)),
        (-1, gamma3(11)),
        (-1, gamma3(16)),
        (-1, gamma3(17)),
    ))
    assert word == beta

    # Standard Gauss evaluations:
    # tau(R(a)) = p
    # tau(gamma_3(a)) = eta(3)^(-3a) p^2.
    p_exp = 1 - 1 - 1 - 2 - 2 - 2 - 2
    eta3_exp = 3 * (4 + 11 + 16 + 17) % 57
    assert p_exp == -9
    assert eta3_exp == 30
    return {
        "word_l1": 7,
        "p_exponent": p_exp,
        "eta3_exponent_mod57": eta3_exp,
        "normalization": "tau(alpha_S-alpha_Aoki)=eta(3)^30*p^-9",
        "consequence": "S=epsilon_Aoki*eta(3)^30*eta(19)^19",
    }


def verify_cyclotomic_square():
    sqrt57 = tuple(SQRT57)
    w = tuple(WITNESS_W)

    # First independently authenticate the sqrt(57) power-basis carrier.
    lhs57 = mod_phi57(poly_mul(sqrt57, sqrt57))
    rhs57 = mod_phi57(pconst(57))
    assert lhs57 == rhs57

    d_a = poly_add(pconst(-15), tuple(-2 * x for x in sqrt57))
    q = poly_add(pconst(7), pzeta(19, -1))

    lhs = mod_phi57(poly_mul(poly_mul(w, w), d_a))
    rhs = mod_phi57(tuple(3 * x for x in q))
    assert lhs == rhs

    return {
        "identity": "w^2*(-15-2*sqrt(57))=3*(7-zeta_3)",
        "zeta3": "zeta_57^19",
        "w_coefficients_low_to_high": list(WITNESS_W),
    }


def verify_prime571_counterprobe():
    p = 571
    z = 236
    assert pow(z, 57, p) == 1
    assert all(pow(z, d, p) != 1 for d in (1, 3, 19))
    zeta3 = pow(z, 19, p)
    assert zeta3 == 109

    # This is one reduction of sqrt(57); 253^2 = 57 mod 571.
    sr57 = 253
    assert sr57 * sr57 % p == 57

    q = (7 - zeta3) % p
    d_a = (-15 - 2 * sr57) % p
    three_q = 3 * q % p

    leg = lambda a: pow(a % p, (p - 1) // 2, p)
    assert leg(q) == 1
    assert leg(3) == p - 1
    assert leg(three_q) == p - 1
    assert leg(d_a) == p - 1

    ratio = three_q * pow(d_a, -1, p) % p
    assert ratio == 405
    assert 216 * 216 % p == ratio

    return {
        "prime": p,
        "zeta57_mod_p": z,
        "zeta3_mod_p": zeta3,
        "q_mod_p": q,
        "three_q_mod_p": three_q,
        "dA_mod_p": d_a,
        "ratio_mod_p": ratio,
        "ratio_sqrt_mod_p": 216,
    }


def main():
    import json
    result = {
        "schema": "conscience64/w114-sign-normalization-correction/v1",
        "relation_word": verify_relation_word(),
        "cyclotomic_square": verify_cyclotomic_square(),
        "prime571": verify_prime571_counterprobe(),
        "corrected_quadratic_sign": "chi_114(3*(7-zeta_3))^57",
        "preserved_full_twist": (
            "chi_114(2)^100*chi_114(3)^3*chi_114(19)^38*"
            "chi_114(7-zeta_3)^57"
        ),
        "boundaries": list(BOUNDARIES),
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
