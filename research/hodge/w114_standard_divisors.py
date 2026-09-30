#!/usr/bin/env python3
"""Explicit characteristic-zero 3-standard cycles; not the exceptional W114 arrow.

Exact coefficients in Q[rho]/(rho^19+3).  Sparse Jacobian-ring computation
checks the primitive cycle class, conditional on Villaflor's cycle-class
formula.  Chow inverse uses Aoki's intersection theorem and OY invertibility.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction
from functools import lru_cache
from itertools import permutations, product
from math import gcd
from hashlib import sha256
import json

import verify_w114_sign_normalization as sign
import w114_signed_composition as arithmetic

D = 57
ROOT_DEGREE = 19
GENERATORS = (4, 11, 16, 17)
BASE_CHECKPOINT = "5f72db12dece00960103112dfe79e931d8b391f9"


def add(*polys):
    out = Counter()
    for poly in polys:
        out.update(poly)
    return {k: v for k, v in out.items() if v}


def scale(poly, scalar):
    return {k: scalar*v for k, v in poly.items() if scalar*v}


def monomial(exponents, coefficient=1, rho=0):
    return {(*exponents, rho): coefficient}


def mul(left, right, *, jacobian=False, rho_power=-3):
    out = Counter()
    for x, cx in left.items():
        for y, cy in right.items():
            exp = tuple(x[i]+y[i] for i in range(4))
            if jacobian and any(e >= D-1 for e in exp):
                continue
            q, r = divmod(x[4]+y[4], ROOT_DEGREE)
            out[(*exp, r)] += cx*cy*rho_power**q
    return {k: v for k, v in out.items() if v}


def derivative(poly, variable):
    out = {}
    for exp, c in poly.items():
        if exp[variable]:
            new = list(exp)
            new[variable] -= 1
            out[tuple(new)] = c*exp[variable]
    return out


def equations():
    f1 = add(*(monomial(tuple(19 if i == j else 0 for i in range(4)))
               for j in range(3)))
    g1 = add(*(monomial(tuple(38 if i == j else 0 for i in range(4)))
               for j in range(3)),
             *(monomial(tuple(19 if i in (j, k) else 0 for i in range(4)), -1)
               for j, k in ((0, 1), (0, 2), (1, 2))))
    f2 = add(monomial((0, 0, 0, 3)), monomial((1, 1, 1, 0), -1, 1))
    g2 = add(*(monomial((j, j, j, 3*(18-j)), rho=j) for j in range(19)))
    return f1, g1, f2, g2


def containment(*, rho_power=-3):
    f1, g1, f2, g2 = equations()
    fermat = add(*(monomial(tuple(D if i == j else 0 for i in range(4)))
                  for j in range(4)))
    remainder = add(mul(f1, g1, rho_power=rho_power),
                    mul(f2, g2, rho_power=rho_power), scale(fermat, -1))
    if remainder:
        raise ValueError(f"divisor is not contained in F_57: {remainder}")
    return True


@lru_cache(maxsize=1)
def reduced_determinant():
    rows = [[derivative(poly, j) for j in range(4)] for poly in equations()]
    out = {}
    for perm in permutations(range(4)):
        inversions = sum(perm[i] > perm[j] for i in range(4) for j in range(i+1, 4))
        term = monomial((0, 0, 0, 0), (-1)**inversions)
        for i, j in enumerate(perm):
            term = mul(term, rows[i][j], jacobian=True)
        out = add(out, term)
    if any(sum(k[:4]) != 110 for k in out):
        raise ValueError("incorrect degree in the reduced Jacobian determinant")
    return out


def gamma(a):
    return tuple(x % D for x in (a, a+19, a+38, -3*a))


def jacobian_coefficient(character):
    """Coefficient of x^(character-1) in det Jac(f1,g1,f2,g2).

    This labels a cohomological pullback eigenspace.  Homological sector a
    therefore uses the coefficient of -gamma(a), not gamma(a).
    """
    exponents = tuple(x-1 for x in character)
    return {str(k[4]): c for k, c in reduced_determinant().items()
            if k[:4] == exponents and c}


def stabilizer_size():
    # Divide diagonal mu_57 by setting phase x0=0; enumerate the defining
    # equations' necessary and sufficient invariance conditions.
    count = sum(1 for m1, m2, m3 in product(range(D), repeat=3)
                if m1 % 3 == m2 % 3 == 0 and (3*m3-m1-m2) % D == 0)
    if count != 3*19**2:
        raise ValueError("unexpected divisor stabilizer")
    return count


def projected_pairing():
    # Aoki Theorem 2.1: (w_gamma,w_-gamma)=-3*57^3.
    # w_gamma=[G:G_D] e_gamma[D] by its introductory definition.
    index = Fraction(D**3, stabilizer_size())
    return Fraction(-3*D**3, index**2)


def jacobian_pairing(a):
    # Villaflor Corollary 8.1, n=2, primitive sectors: -c*56^4/57.
    # Hess(F57)=(57*56)^4 (x0*x1*x2*x3)^55.
    determinant = reduced_determinant()
    character = gamma(a)
    dual = tuple(-x % D for x in character)
    def sector(labels):
        exp = tuple(x-1 for x in labels)
        return {k: c for k, c in determinant.items() if k[:4] == exp}
    top = mul(sector(character), sector(dual), jacobian=True)
    if set(top) != {(55, 55, 55, 55, 0)}:
        raise ValueError("projected socle product is zero or not rational")
    socle = top[(55, 55, 55, 55, 0)]
    pairing = -Fraction(socle, D**5)
    if pairing != projected_pairing():
        raise ValueError("Jacobian pairing disagrees with Aoki intersection theorem")
    return {"socle_coefficient": socle, "pairing": str(pairing),
            "theorem_use": "Villaflor Theorem 1.1 and Corollary 8.1"}


def inverse_check(inverse_scale=Fraction(-1, 361)):
    """Over a splitting field: v=19^-1 sum xi^-j [rho_j], F(v)=z.

    G_unscaled(z)=sum <z,D_j>[rho_j]=19*c*v.  The extra 19
    comes from the finite-carrier projector, separately from c=-19.
    """
    pairing = projected_pairing()
    scalar = ROOT_DEGREE*pairing*inverse_scale
    if scalar != 1:
        raise ValueError(f"relative inverse gives {scalar}, expected 1")
    return scalar


def check_galois_sector(a, u, pullback_character):
    conjugate = tuple(u*x % D for x in gamma(a))
    if tuple(pullback_character) != tuple(-x % D for x in conjugate):
        raise ValueError("homological target requires the dual pullback sector")
    coefficient = jacobian_coefficient(pullback_character)
    if sum(conjugate) != 2*D or set(coefficient) != {str(-a*u % 19)}:
        raise ValueError("zero, non-Tate or wrong Kummer eigencharacter")
    return coefficient


def divisor(a):
    if a not in GENERATORS:
        raise ValueError("outside the four W114 standard generators")
    character = gamma(a)
    dual = tuple(-x % D for x in character)
    rows = []
    for u in range(D):
        if gcd(u, D) != 1:
            continue
        conjugate = tuple(u*x % D for x in character)
        coefficient = check_galois_sector(a, u, tuple(-x % D for x in conjugate))
        rows.append({"u": u, "character": list(conjugate),
                     "homological_class_coefficient": coefficient,
                     "artin_3_exponent": (-3*a*u) % D})
    inverse_check()
    return {"a": a, "source": f"A(3,{-3*a % D})(1)",
            "target": {"variety": "F_57^2", "character": list(character)},
            "dual_character": list(dual),
            "finite_carrier": "E=Spec K[rho]/(rho^19+3)",
            "projected_pairing": str(projected_pairing()),
            "independent_pairing_path": jacobian_pairing(a),
            "cycle": "Gamma={(rho,x) in E x F_57^2: f1=f2=0}",
            "forward": "F_a=e_gamma [Gamma] e_xi (with source Tate twist 1)",
            "inverse": "G_a=(-1/361) e_xi [Gamma]^t e_gamma",
            "inverse_scale": "-1/361", "roundtrip_scalar": "1",
            "galois": {"rho_action": "rho -> zeta_19*rho",
                       "coordinate_action": "x3 -> zeta_57*x3",
                       "cycle_eigenvalue": f"zeta_19^{(-a)%19}",
                       "finite_projector": f"v_a=(1/19) sum_j zeta_19^({a}*j) [rho_j]",
                       "valuation_at_3": 2,
                       "irreducible_reason": "19 does not divide v_K(3)=2"},
            "realization": "rank one Betti/de Rham; p times Kummer character in good reduction",
            "galois_units_checked": len(rows), "galois_orbit": rows,
            "theorem_use": ["Aoki 1987 Theorem 2.1 and definition of w_a",
                            "Villaflor 2022 Theorem 1.1 and Corollary 8.1 (arXiv v5)",
                            "OY Proposition 4.11: invertibility and End=Lambda"],
            "status": "EXPLICIT_STANDARD_DIVISOR_ISOMORPHISM_WITH_EXTERNAL_THEOREM_INPUTS"}


def positive_stabilization():
    den = (23, 29, 32, 11, 17)
    source = tuple(a for a, c in sign.ALPHA_S.items() if c > 0)+tuple(-a % D for a in den)
    aoki = tuple(sign.H1)+tuple(-3*a % D for a in sign.H1)
    left = Counter(source)
    left.update(x for a in GENERATORS for x in gamma(a))
    left.update((25, 32, 28, 29))
    right = Counter(aoki)
    right.update((22, 35))
    right.update(x for a in den for x in (a, -a % D))
    if left != right or sum(left.values()) != 30:
        raise ValueError("positive stabilized endpoint identity failed")
    for u in range(D):
        if gcd(u, D) == 1:
            if sum(u*x % D for x in source) != 5*D:
                raise ValueError("residual positive tuple is not (4,4) at every embedding")
            if sum(u*x % D for x in aoki) != 9*D:
                raise ValueError("Aoki positive tuple is not (8,8) at every embedding")
    return {"residual_positive_tuple": list(source), "residual_object": "h^8(F_57^8)^T_S(-4)",
            "aoki_positive_tuple": list(aoki), "aoki_object": "h^16(F_57^16)^T_A(-8)",
            "common_positive_tuple": sorted(left.elements()),
            "formal_identity": "T_S + sum gamma_a + R25 + R28 = T_A + R22 + sum_den Rb",
            "standard_artin_exponent": (-sum(-3*a for a in GENERATORS)) % D,
            "status": "EXACT_POSITIVE_ENDPOINT_STABILIZATION; JOIN_AND_CANCELLATION_NOT_COMPILED"}


def frobenius_checks():
    rows = []
    unit = (1,)+(0,)*35
    for p in (229, 571):
        _, logs = arithmetic.finite_field(p)
        for a in GENERATORS:
            actual = arithmetic.jacobi(p, D, gamma(a)[:3])
            expected = tuple(p*c for c in arithmetic.shift(unit, -3*a*logs[3], D))
            if actual != expected:
                raise ValueError(f"direct Jacobi sum disagrees with divisor realization: p={p}, a={a}")
            rows.append({"p": p, "a": a, "direct_jacobi_power_basis": list(actual),
                         "predicted_power_basis": list(expected), "match": True})
    return {"primes": [229, 571], "rows": rows,
            "scope": "exact finite realization check, not a universal Frobenius proof"}


def standard_padding():
    """Join four projected D_rho and two projected points (-1:1).

    Ten equations in disjoint variable blocks are a reduced CI in P^19;
    its projected character has 20 entries and lies on F_57^18.  The
    complete-intersection determinant is block diagonal.  This constructs
    an actual padding cycle without assuming algebraicity of T_S or T_A.
    """
    character = tuple(x for a in GENERATORS for x in gamma(a))+(25, 32, 28, 29)
    # For point x+y=0, coefficient of x^(b-1)y^(56-b) is -57*(-1)^b.
    point_pair = Fraction(1, D)
    pair = (-D)**5 * projected_pairing()**4 * point_pair**2
    if pair != -D**3 * 19**4:
        raise ValueError("padding pairing computation failed")
    coefficient = monomial((0, 0, 0, 0))
    for a in GENERATORS:
        dual = tuple(-x % D for x in gamma(a))
        coefficient = mul(coefficient, { (0, 0, 0, 0, int(k)): c
                                        for k, c in jacobian_coefficient(dual).items() })
    coefficient = scale(coefficient, (D*(-1)**25)*(D*(-1)**28))
    kappa = (-sum(GENERATORS)) % 19
    if len(coefficient) != 1 or next(iter(coefficient))[4] != kappa:
        raise ValueError("padding Galois character does not match its determinant coefficient")
    inverse = Fraction(1, ROOT_DEGREE*pair)
    dual_coefficient = monomial((0, 0, 0, 0))
    for a in GENERATORS:
        dual_coefficient = mul(dual_coefficient, {(0, 0, 0, 0, int(k)): c
                               for k, c in jacobian_coefficient(gamma(a)).items()})
    dual_coefficient = scale(dual_coefficient, (-D*(-1)**25)*(-D*(-1)**28))
    socle = mul(coefficient, dual_coefficient)
    if set(socle) != {(0, 0, 0, 0, 0)} or -Fraction(socle[(0, 0, 0, 0, 0)], D**21) != pair:
        raise ValueError("full block-diagonal determinant pairing disagrees with join normalization")
    orbit = []
    for u in range(57):
        if gcd(u, 57) != 1:
            continue
        conjugate = tuple(u*x % 57 for x in character)
        if sum(conjugate) != 10*57:
            raise ValueError("padding character is not (9,9) at every embedding")
        orbit.append({"u": u, "character": list(conjugate),
                      "galois_exponent_mod_19": kappa*u % 19})
    return {"character": list(character), "dimension": 18, "cycle_dimension": 9,
            "source": "A(3,27)(9)", "target": "h^18(F_57^18)^B",
            "family": "join(D_rho,D_rho,D_rho,D_rho,(-1:1),(-1:1)) over E",
            "equations": "four disjoint copies of (f1,f2), followed by x16+x17=x18+x19=0",
            "forward": "F_B=e_B [Gamma_B] e_kappa, with source twist 9",
            "inverse": f"G_B=({inverse}) e_kappa [Gamma_B]^t e_B",
            "finite_carrier_degree": 19, "galois_exponent_mod_19": kappa,
            "homological_class_coefficient": {str(k[4]): c for k, c in coefficient.items()},
            "projected_pairing": str(pair), "inverse_scale": str(inverse),
            "socle_coefficient": socle[(0, 0, 0, 0, 0)],
            "direct_socle_pairing": str(-Fraction(socle[(0, 0, 0, 0, 0)], D**21)),
            "roundtrip_scalar": str(19*pair*inverse),
            "galois_units_checked": len(orbit), "galois_orbit": orbit,
            "theorem_use": "Villaflor CI class and intersection formulas; OY invertibility",
            "status": "EXPLICIT_NONZERO_STANDARD_PADDING_CYCLE"}


def direct_cycle_counterprobe():
    target = Counter((1, 7, 78, 79, 86, 91))
    rows = []
    for p in (2, 3):
        admitted = 0
        hits = []
        for a in range(1, 114):
            labels = ([a, (a+57) % 114, -2*a % 114, 57] if p == 2
                      else [a, (a+38) % 114, (a+76) % 114, -3*a % 114])
            if 0 in labels:
                continue
            admitted += 1
            block = Counter(labels)
            if any(block[x] > target[x] for x in block):
                continue
            remaining = target-block
            if sum(remaining.values()) == 2 and sum(remaining.elements()) == 114:
                hits.append(a)
        if hits:
            raise ValueError("a direct standard surface-plus-point cycle hits W114")
        rows.append({"prime": p, "admitted_a": admitted, "hits": hits})
    return {"target": list(target.elements()), "rows": rows,
            "scope": "all admitted degree-114 2/3-standard quartets plus one complementary pair, up to permutation",
            "status": "NO_DIRECT_STANDARD_JOIN_HITS; DOES_NOT_RULE_OUT_OTHER_CYCLES"}


def rejected_inputs():
    probes = (("wrong-root-sign", "rho^19=3", lambda: containment(rho_power=3)),
              ("missing-carrier-degree", "inverse=-1/19", lambda: inverse_check(Fraction(-1, 19))),
              ("wrong-inverse-sign", "inverse=1/361", lambda: inverse_check(Fraction(1, 361))),
              ("wrong-variance", "pullback gamma4 for homological gamma4",
               lambda: check_galois_sector(4, 1, gamma(4))))
    rows = []
    for name, bad_input, check in probes:
        try:
            check()
        except ValueError as error:
            rows.append({"probe": name, "input": bad_input, "result": "REJECTED", "reason": str(error)})
        else:
            raise ValueError(f"invalid input passed: {name}")
    return rows


def pairwise_counterprobe():
    # h^1(C_114) factors in the committed explicit KS decomposition.
    curves = ((7, 106), (78, 28), (79, 63), (86, 91))
    rows = []
    for i in range(4):
        for j in range(i+1, 4):
            bad = []
            for u in range(114):
                if gcd(u, 114) != 1:
                    continue
                def grade(c):
                    labels = (*c, -sum(c) % 114)
                    return sum(u*x % 114 for x in labels)//114 - 1
                if grade(curves[i])+grade(curves[j]) != 1:
                    bad.append(u)
            rows.append({"pair": [list(curves[i]), list(curves[j])],
                         "noncomplementary_units": bad, "mismatch_count": len(bad)})
    if any(not row["noncomplementary_units"] for row in rows):
        raise ValueError("a divisor-pair contraction became available; revisit this route")
    return {"rows": rows, "status": "NO_PAIR_DUAL_AT_ALL_EMBEDDINGS_FOR_THIS_DECOMPOSITION"}


def run():
    containment()
    determinant = [[list(k), c] for k, c in sorted(reduced_determinant().items())]
    return {"schema": "conscience64/w114-standard-divisors/v1",
            "base_checkpoint": BASE_CHECKPOINT,
            "coefficient_domain": "K=Lambda=Q(zeta_57); rho^19=-3",
            "projector_convention": "e_chi=(1/|G|) sum chi(g)^-1 [Gamma_g], g_* e_chi=chi(g)e_chi",
            "equations": {"f1": "x0^19+x1^19+x2^19", "f2": "x3^3-rho*x0*x1*x2",
                          "g1": "sum_i<3 x_i^38 - sum_i<j<3 x_i^19*x_j^19",
                          "g2": "sum_j=0^18 x3^(3*(18-j))*(rho*x0*x1*x2)^j"},
            "containment": "F57=f1*g1+f2*g2 exactly",
            "jacobian_ring": "Q[rho][x0,...,x3]/(rho^19+3,x0^56,...,x3^56)",
            "determinant_degree": 110, "determinant_terms": len(reduced_determinant()),
            "determinant_sha256": sha256(json.dumps(determinant, separators=(",", ":")).encode()).hexdigest(),
            "stabilizer_size": stabilizer_size(), "orbit_index": D**3//stabilizer_size(),
            "divisors": [divisor(a) for a in GENERATORS],
            "frobenius": frobenius_checks(), "standard_padding": standard_padding(),
            "stabilization": positive_stabilization(), "failed_pairing_shortcut": pairwise_counterprobe(),
            "failed_direct_cycle_shortcut": direct_cycle_counterprobe(),
            "rejected_inputs": rejected_inputs(),
            "mot_1": "MOT-1 REMAINS OPEN",
            "remaining": ["composed signed W114 plane push with typed joins and cancellations",
                          "explicit exceptional Aoki component to A(19,38) A(3q,57)"] ,
            "claim_ceilings": ["STANDARD_DIVISOR_CYCLE != EXCEPTIONAL_AOKI_CYCLE",
                               "EXTERNAL_THEOREM_USE != INDEPENDENT_REPROOF",
                               "FINITE_EXACT_COMPUTATION != CHOW_CERTIFICATION_BY_SOFTWARE",
                               "MOT_1_BOUNDED_PROGRESS != HODGE_CONJECTURE_PROOF"]}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, sort_keys=True))
