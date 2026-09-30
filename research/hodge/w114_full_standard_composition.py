#!/usr/bin/env python3
"""Explicit W114 standard reduction, with duplication divisors and plane pullback.

This computes cycle-class coefficients and typed Chow inverse scalars.  Its
proof leaves are stated in W114_FULL_STANDARD_REDUCTION_2026-09-30.md.  It does
not produce the exceptional Aoki-to-quadratic-Artin correspondence.
"""
from collections import Counter
from fractions import Fraction
from functools import lru_cache
from hashlib import sha256
from itertools import permutations
from math import gcd
import json

import w114_standard_composition as composition

D = 114
W = (1, 7, 78, 79, 86, 91)
F = (29, 11, 17, 28, 40, 46)
GENERATORS = (7, 22, 23, 56)
ORDERED_WORD = (("D2", 7, 1), ("D2", 22, 1), ("D2", 23, -1),
                ("D2", 56, -1), ("N", 1, 1), ("N", 2, -1))
BASE_CHECKPOINT = "389c1b705d1af91cdc0e6d3ffd6c14d0133597c0"


def add(*polys):
    result = Counter()
    for poly in polys:
        result.update(poly)
    return {k: v for k, v in result.items() if v}


def mon(exponents, coefficient=1, rho=0, i=0):
    return {(*exponents, rho, i): coefficient}


def mul(left, right, *, jacobian=False, rho_power=2):
    result = Counter()
    for x, cx in left.items():
        for y, cy in right.items():
            exponents = tuple(x[k]+y[k] for k in range(4))
            if jacobian and any(v >= D-1 for v in exponents):
                continue
            qr, r = divmod(x[4]+y[4], 57)
            qi, i = divmod(x[5]+y[5], 2)
            result[(*exponents, r, i)] += cx*cy*rho_power**qr*(-1)**qi
    return {k: v for k, v in result.items() if v}


def derivative(poly, variable):
    result = {}
    for k, coefficient in poly.items():
        if k[variable]:
            new = list(k)
            new[variable] -= 1
            result[tuple(new)] = coefficient*k[variable]
    return result


def equations():
    f1 = add(mon((57, 0, 0, 0)), mon((0, 57, 0, 0)), mon((0, 0, 0, 57), i=1))
    g1 = add(mon((57, 0, 0, 0)), mon((0, 57, 0, 0)), mon((0, 0, 0, 57), -1, i=1))
    f2 = add(mon((0, 0, 2, 0)), mon((1, 1, 0, 0), -1, rho=1))
    g2 = add(*(mon((j, j, 2*(56-j), 0), rho=j) for j in range(57)))
    return f1, g1, f2, g2


def containment(rho_power=2):
    f1, g1, f2, g2 = equations()
    minus_fermat = add(*(mon(tuple(D if k == v else 0 for k in range(4)), -1) for v in range(4)))
    if add(mul(f1, g1, rho_power=rho_power), mul(f2, g2, rho_power=rho_power), minus_fermat):
        raise ValueError("duplication divisor containment fails")
    return True


@lru_cache(maxsize=1)
def determinant():
    rows = [[derivative(poly, j) for j in range(4)] for poly in equations()]
    result = {}
    for perm in permutations(range(4)):
        sign = (-1)**sum(perm[i] > perm[j] for i in range(4) for j in range(i+1, 4))
        term = mon((0, 0, 0, 0), sign)
        for i, j in enumerate(perm):
            term = mul(term, rows[i][j], jacobian=True)
        result = add(result, term)
    if len(result) != 112 or any(sum(k[:4]) != 224 for k in result):
        raise ValueError("wrong duplication Jacobian determinant")
    return result


def gamma(a):
    return (a % D, (a+57) % D, -2*a % D, 57)


def reflection(a):
    return (a, -a % D)


def sector(character):
    return {k: v for k, v in determinant().items() if k[:4] == tuple(x-1 for x in character)}


def divisor(a):
    if a not in GENERATORS:
        raise ValueError("outside the four duplication generators")
    rows = []
    for u in range(D):
        if gcd(u, D) != 1:
            continue
        character = tuple(u*x % D for x in gamma(a))
        dual = tuple(-x % D for x in character)
        coeff = sector(dual)
        if not coeff or {k[4:] for k in coeff} != {(-a*u % 57, 1)} or sum(character) != 2*D:
            raise ValueError("duplication homological coefficient has wrong Galois sector")
        top = mul(sector(character), coeff, jacobian=True)
        if set(top) != {(112, 112, 112, 112, 0, 0)}:
            raise ValueError("zero or non-rational projected duplication socle product")
        pairing = -Fraction(top[(112, 112, 112, 112, 0, 0)], D**5)
        if pairing != -57:
            raise ValueError("duplication pairing is not -57")
        rows.append({"u": u, "homological_character": list(character),
                     "dual_pullback_coefficient": [[list(k), v] for k, v in sorted(coeff.items())],
                     "artin_2_exponent": -2*a*u % D, "artin_minus_1_exponent": 57,
                     "projected_pairing": str(pairing)})
    inverse = Fraction(-1, 114*57)
    return {"a": a, "source": f"A_114(2,{-2*a % D}) tensor A_114(-1,57)(1)",
            "target": {"variety": "F_114^2", "character": list(gamma(a))},
            "finite_carrier": "E114=Spec K[rho,i]/(rho^57-2,i^2+1)", "carrier_degree": 114,
            "cycle": "Gamma2={(rho,i,x): x0^57+x1^57+i*x3^57=x2^2-rho*x0*x1=0}",
            "forward": "e_gamma [Gamma2] e_xi", "inverse": "(-1/6498) e_xi [Gamma2]^t e_gamma",
            "inverse_scale": str(inverse), "projected_pairing": "-57",
            "roundtrip_scalar": str(114*(-57)*inverse),
            "galois_actions": {"rho_to_zeta57_rho": "x2 -> zeta114*x2; homological eigenvalue zeta57^(-a)",
                               "i_to_minus_i": "x3 -> -x3; homological eigenvalue -1"},
            "galois_units_checked": len(rows), "galois_orbit": rows,
            "theorem_use": "Villaflor CI class and primitive intersection; Fermat invertibility; Aoki Remark 2.2 provides an additional pairing check"}


def power_transfer(dimension, character):
    if len(character) != dimension+2 or not composition.primitive(character):
        raise ValueError("invalid level-57 power-transfer sector")
    degree = 2**(dimension+1)
    return {"map": "q:[x_i] -> [x_i^2]", "source_variety": f"F_114^{dimension}",
            "target_variety": f"F_57^{dimension}", "degree": degree,
            "level_114_character": [2*x for x in character], "level_57_character": list(character),
            "forward": "projected q^*", "inverse": f"projected q_* / {degree}",
            "kernel": f"mu_2^{dimension+2}/diagonal_mu_2", "kernel_restriction": "trivial on every doubled character",
            "roundtrip_scalar": "1"}


def plane_pullback():
    transfer = power_transfer(4, F)
    return {"character": [2*x for x in F], "dimension": 4, "cycle_dimension": 2,
            "source": "Lambda(2)", "target": "h^4(F_114^4)^(2f)",
            "cycle": "e_2f q^*L; L:x0+x3=x1+x5=x2+x4=0 in F_57^4",
            "equations": "x0^2+x3^2=x1^2+x5^2=x2^2+x4^2=0",
            "projected_pairing": str(Fraction(transfer['degree'], 57)),
            "inverse": "(57/32) [q^*L]^t e_2f", "inverse_scale": "57/32",
            "roundtrip_scalar": "1", "power_transfer": transfer,
            "variance": "source-times-target; e_f is the homological sector; the cohomological pullback class is in -f"}


def stabilized_endpoints():
    s = tuple(2*x for x in composition.standard.positive_stabilization()['residual_positive_tuple'])
    left_point_a = (22, 22, 56, 50, 34, 14, 44)
    right_point_a = (1, 23)
    left_pad = gamma(23)+gamma(56)+sum((reflection(a) for a in left_point_a), ())
    right_pad = tuple(2*x for x in F)+gamma(7)+gamma(22)+sum((reflection(a) for a in right_point_a), ())
    left, right = W+left_pad, s+right_pad
    if Counter(left) != Counter(right) or len(left) != 28:
        raise ValueError("full standard positive stabilization fails")
    # Recompute the requested signed word in Z[R114], retaining its order.
    signed_word = Counter()
    ordered = []
    for name, a, sign in ORDERED_WORD:
        labels = ((a, 1), ((a+57) % D, 1), (2*a % D, -1), (57, -1)) if name == 'D2' else ((a, 1), (-a % D, 1))
        # Arithmetic signs are not geometric directions. Positive D2 uses
        # the inverse on the right padding; negative D2 uses the forward
        # divisor on the left. N has no individual characteristic-zero leaf.
        direction = ("inverse" if sign > 0 else "forward") if name == 'D2' else None
        role = ("right_padding_reverse" if sign > 0 else "left_padding_forward") if name == 'D2' else "reflection_point_padding"
        ordered.append({"primitive": f"{name}_{a}", "sign": sign,
                        "direction": direction, "geometric_role": role,
                        "integer_word": [[x, c] for x, c in labels]})
        for x, c in labels:
            signed_word[x] += sign*c
    residual_word = Counter(W)
    residual_word.subtract(reflection(23))
    residual_word.subtract(tuple(2*x for x in F))
    residual_word.update(reflection(22))
    residual_word.subtract(s)
    for a in (23, 29, 32, 11, 17):
        residual_word.update(reflection(2*a))
    if {x: c for x, c in signed_word.items() if c} != {x: c for x, c in residual_word.items() if c}:
        raise ValueError("requested signed word differs from stabilized endpoints")
    return {"W": list(W), "S114": list(s), "left_padding": list(left_pad), "right_padding": list(right_pad),
            "left_point_a": list(left_point_a), "right_point_a": list(right_point_a),
            "ordered_signed_word": ordered, "positive_length": 28,
            "reflection_phase": "same-psi N1-N2 phase chi114(-1) is cancelled by all-plus F114 coefficient; no finite-field Artin-Schreier map imported into characteristic zero"}


def padding(side):
    endpoints = stabilized_endpoints()
    if side == 'left':
        generators, points, cycle_dimension, exponent = (23, 56), endpoints['left_point_a'], 10, 70
        blocks = [gamma(a) for a in generators]+[reflection(a) for a in points]
        factor_pairings = [Fraction(-57)]*2+[Fraction(1, 114)]*len(points)
    elif side == 'right':
        generators, points, cycle_dimension, exponent = (7, 22), endpoints['right_point_a'], 8, 56
        blocks = [tuple(2*x for x in F)]+[gamma(a) for a in generators]+[reflection(a) for a in points]
        factor_pairings = [Fraction(32, 57)]+[Fraction(-57)]*2+[Fraction(1, 114)]*len(points)
    else:
        raise ValueError("unknown padding side")
    character, joins = tuple(blocks[0]), []
    pairing = factor_pairings[0]
    for block, c in zip(blocks[1:], factor_pairings[1:]):
        j = composition.join(character, block, D)
        joins.append(j)
        character += tuple(block)
        pairing *= -D*c
    if list(character) != endpoints[f'{side}_padding'] or (len(character)-2)//2 != cycle_dimension:
        raise ValueError("padding has wrong cycle dimension or endpoint")
    i_parity = (len(generators)+sum(points)) % 2
    if i_parity or (-2*sum(generators) % D) != exponent:
        raise ValueError("padding does not descend to declared Artin source")
    inverse = 1/(57*pairing)
    orbit = []
    for u in range(D):
        if gcd(u, D) == 1:
            conjugate = tuple(u*x % D for x in character)
            if sum(conjugate)//D-1 != cycle_dimension:
                raise ValueError("padding is not Tate at every embedding")
            orbit.append({"u": u, "character": list(conjugate), "artin_2_exponent": exponent*u % D})
    return {"side": side, "character": list(character), "dimension": len(character)-2,
            "cycle_dimension": cycle_dimension, "source": f"A_114(2,{exponent})({cycle_dimension})",
            "carrier": "E57=Spec K[rho]/(rho^57-2)", "carrier_degree": 57,
            "rho_exponent": -sum(generators) % 57, "i_parity": i_parity,
            "cycle": "iterated coordinate joins of the named projected cycles; (1/2) trace E114/E57",
            "i_descent": "total i-character trivial; trace divided by 2 has the original geometric projected fiber",
            "point_cycle": "R_b: e_(b,-b)[i:1]; i^114=-1; pair 1/114; conjugation eigenvalue (-1)^b",
            "divisor_a": list(generators), "point_a": list(points), "joins": joins,
            "factor_pairings": list(map(str, factor_pairings)), "projected_pairing": str(pairing),
            "forward": "e_padding [Gamma_padding] e_xi", "inverse": "(1/(57*c_padding)) e_xi [Gamma_padding]^t e_padding",
            "inverse_scale": str(inverse), "roundtrip_scalar": str(57*pairing*inverse),
            "galois_units_checked": len(orbit), "galois_orbit": orbit}


def compose():
    endpoints = stabilized_endpoints()
    left, right = padding('left'), padding('right')
    jl = composition.join(endpoints['W'], left['character'], D)
    jr = composition.join(endpoints['S114'], right['character'], D)
    permutation = composition.coordinate_permutation(jl['target'], jr['target'])
    left_inverse = Fraction(jl['inverse_scale'])*Fraction(left['inverse_scale'])
    right_inverse = Fraction(jr['inverse_scale'])*Fraction(right['inverse_scale'])
    orbit = []
    for u in range(D):
        if gcd(u, D) != 1:
            continue
        wu, su = [tuple(u*x % D for x in endpoints[key]) for key in ('W', 'S114')]
        lp, rp = [tuple(u*x % D for x in p['character']) for p in (left, right)]
        if composition.coordinate_permutation(wu+lp, su+rp) != permutation:
            raise ValueError("full permutation is not Galois covariant")
        if sum(wu)//D-1+11 != sum(su)//D-1+9:
            raise ValueError("twisted full W114 Hodge grades differ")
        orbit.append({"u": u, "W": list(wu), "S114": list(su), "normalized_artin_2_exponent": 100*u % D})
    for p, scalar in ((left, left_inverse), (right, right_inverse)):
        if scalar*(-D)*57*Fraction(p['projected_pairing']) != 1:
            raise ValueError("full composition inverse normalization fails")
    return {"source": "h^4(F_114^4)^W tensor A_114(2,70)(11)",
            "target": "h^8(F_114^8)^(2T_S) tensor A_114(2,56)(9)",
            "source_weight": 26, "target_weight": 26,
            "support": "F_114^4 x E57 x F_114^8 x E57", "cycle_dimension": 6,
            "forward": "Psi114=R_inverse o P o L; L=J_WBleft(id_W tensor F_Bleft); R=J_SBRight(id_S114 tensor F_Bright)",
            "inverse": "L_inverse o P_inverse o R", "left_join": jl, "right_join": jr,
            "left_padding": left, "right_padding": right, "permutation": permutation,
            "left_inverse_scale": str(left_inverse), "right_inverse_scale": str(right_inverse),
            "roundtrip_scalar": "1", "galois_units_checked": len(orbit), "galois_orbit": orbit,
            "normalized_isomorphism": "h^4(F_114^4)^W -> h^8(F_57^8)^T_S(-4) tensor A_114(2,100)(2)",
            "artin_cancellation": {"left_with_dual": composition.finite_artin_product(57, 35, 22),
                                   "right_with_left_dual": composition.finite_artin_product(57, 28, 22)},
            "after_level57_standard_composition": "h^4(F_114^4)^W -> h^16(F_57^16)^T_A(-8) tensor A_114(2,100) tensor A_114(3,60)(2)",
            "level57_descent": power_transfer(8, composition.standard.positive_stabilization()['residual_positive_tuple']),
            "plane_pullback": plane_pullback(), "signed_word": endpoints['ordered_signed_word'],
            "status": "EXPLICIT_FULL_STANDARD_REDUCTION; EXCEPTIONAL_ARTIN_ARROW_NOT_CONSTRUCTED"}


def check(certificate):
    if certificate != compose():
        raise ValueError("full certificate differs from its cycle, endpoint or inverse construction")
    return True


def counterprobes():
    results = []
    for name, operation in (("rho57=-2", lambda: containment(-2)),
                            ("forgot finite degree 57", lambda: check({**compose(), 'left_inverse_scale': '-1/114'})),
                            ("quadratic Artin target asserted", lambda: check({**compose(), 'target': 'corrected quadratic Artin'})),
                            ("plane pullback degree 16", lambda: check({**compose(), 'plane_pullback': {**plane_pullback(), 'projected_pairing': '16/57'}}))):
        try:
            operation()
        except ValueError as error:
            results.append({"probe": name, "status": "REJECTED", "reason": str(error)})
        else:
            raise ValueError(f"counterprobe was wrongly admitted: {name}")
    return results


def run():
    containment()
    divisors = [divisor(a) for a in GENERATORS]
    result = compose()
    check(result)
    return {"schema": "conscience64/w114-full-standard-composition/v1", "base_checkpoint": BASE_CHECKPOINT,
            "composition": result, "duplication_divisors": divisors,
            "reduced_determinant_sha256": sha256(json.dumps(sorted(determinant().items()), separators=(',', ':')).encode()).hexdigest(),
            "counterprobes": counterprobes(), "mot_1": "MOT-1 REMAINS OPEN",
            "remaining": "construct nonzero exceptional T_A(-8) -> A_114(19,38) tensor A_114(3*(7-zeta_3),57) and inverse; then perform full W114 plane push",
            "claim_ceilings": ["STANDARD_W114_REDUCTION != EXCEPTIONAL_ARTIN_CORRESPONDENCE",
                               "EXPLICIT_PLANE_IN_PADDING != ALGEBRAIC_W114_CYCLE",
                               "THEOREM_USE != INDEPENDENT_REPROOF",
                               "MOT_1_BOUNDED_PROGRESS != HODGE_CONJECTURE_PROOF"],
            "review": "self-review; no independent audit claimed"}


if __name__ == '__main__':
    print(json.dumps(run(), indent=2, sort_keys=True))
