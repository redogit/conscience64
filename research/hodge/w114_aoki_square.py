#!/usr/bin/env python3
"""Aoki tensor-square correspondence; no extraction of a quadratic root.

Uses the explicitly defined 19-standard complete intersection and Aoki's
standard-cycle theorem, together with the native primitive join calculation.
"""
from collections import Counter
from fractions import Fraction
from math import gcd
import json

import w114_standard_composition as composition

D = 57
Q = (1, 4, 5, 6, 7, 9, 11, 16, 17)
R = (1, 2, 4, 7, 8, 14, 16, 19, 25, 28)


def standard_parity_obstruction():
    # Found by GF(2) row reduction, verified here by all admitted generators.
    support = (17, 21, 26, 31, 36, 40)
    sign = composition.standard.sign
    generators = []
    for a in range(1, 57):
        generators.append(('R', a, sign.reflection(a)))
        if a % 19:
            generators.append(('gamma3', a, sign.gamma3(a)))
        if a % 3:
            labels = tuple((a+3*j) % D for j in range(19))+(-19*a % D,)
            generators.append(('gamma19', a, sign.vec(Counter(labels))))
    def functional(word):
        return sum(word[i-1] for i in support) % 2
    if any(functional(word) for _, _, word in generators) or functional(sign.alpha_aoki()) != 1:
        raise ValueError("standard parity obstruction is invalid")
    return {"functional_support": list(support), "modulus": 2, "generators_checked": len(generators),
            "generator_values": {name: 0 for name in ('R', 'gamma3', 'gamma19')}, "aoki_value": 1,
            "conclusion": "alpha_Aoki is outside the integer span of all admitted level57 reflection, 3-standard and 19-standard words",
            "scope": "this free-word ansatz only; not an obstruction to mixed cycles, other motivic relations, or algebraicity",
            "status": "EXACT_COUNTERCERTIFICATE_FOR_UNSQUARED_STANDARD_WORD_ROUTE"}


def newton_containment():
    # Polynomials in e10,...,e19; e1,...,e9 are set to zero.
    power_sums = [{}]
    for k in range(1, 20):
        result = Counter()
        for j in range(10, k):
            for monomial, c in power_sums[k-j].items():
                result[tuple(sorted((j,)+monomial))] += (-1)**(j-1)*c
        if k >= 10:
            result[(k,)] += (-1)**(k-1)*k
        power_sums.append({m: c for m, c in result.items() if c})
    if any(power_sums[k] for k in range(1, 10)) or power_sums[19] != {(19,): 19}:
        raise ValueError("Newton containment identity fails")
    return {"p19": [[list(m), c] for m, c in sorted(power_sums[19].items())],
            "root_power": -19, "fermat_remainder_coefficient": 19-19}


def standard19():
    character = tuple(2+3*j for j in range(19))+(19,)
    stabilizer = 3**18*19
    index = Fraction(57**19, stabilizer)
    aoki_pairing = -19**17*57**19
    pairing = Fraction(aoki_pairing, index**2)
    if index != 3*19**18 or pairing != -3**17:
        raise ValueError("19-standard stabilizer/pairing normalization fails")
    inverse = 1/(3*pairing)
    orbit = []
    for u in range(D):
        if gcd(u, D) == 1:
            conjugate = tuple(u*x % D for x in character)
            if sum(conjugate)//D-1 != 9:
                raise ValueError("19-standard character has wrong Tate grade")
            orbit.append({"u": u, "character": list(conjugate), "artin_19_exponent": 19*u % D})
    return {"character": list(character), "dimension": 18, "cycle_dimension": 9,
            "source": "A_57(19,19)(9)", "target": "h^18(F_57^18)^gamma19,2",
            "equations": "sum_(j=0..18) x_j^(3*k)=0 (k=1..9); x19^19-rho*product_(j=0..18) x_j=0; rho^3=-19",
            "containment_proof": "Newton: power sums p1..p9=0 in nineteen u_j=x_j^3 imply p19=19*product u_j; x19^57=-19*product u_j",
            "newton_containment": newton_containment(),
            "finite_carrier": "E3=Spec K[rho]/(rho^3+19)", "carrier_degree": 3,
            "irreducible_reason": "if -19 were a cube in K its root cubic field would be an abelian subfield of cyclotomic K, but Q(cuberoot(-19))/Q is non-Galois; the ramified valuation v_K(19)=18 alone cannot prove this",
            "stabilizer": stabilizer, "index": str(index), "aoki_w_pairing": aoki_pairing,
            "projected_pairing": str(pairing), "inverse_scale": str(inverse),
            "forward": "e_gamma [Gamma19] e_xi", "inverse": "(1/(3*c19)) e_xi [Gamma19]^t e_gamma",
            "roundtrip_scalar": str(3*pairing*inverse),
            "galois_action": "rho -> zeta3*rho realized by x19 -> zeta57*x19; homological eigenvalue zeta3",
            "minus_sign_dictionary": "A_57(-19,19)=A_57(19,19), since -1 is a cube in K",
            "galois_units_checked": len(orbit), "galois_orbit": orbit,
            "theorem_use": "Aoki 1987 Theorem 2.1 and w_gamma definition; OY invertibility. No independent CI class computation at p19 is claimed"}


def standard_right():
    for a in Q:
        if composition.standard.jacobian_pairing(a)['pairing'] != '-19':
            raise ValueError("a square-word standard divisor has wrong pairing")
        for u in range(D):
            if gcd(u, D) == 1:
                character = tuple(u*x % D for x in composition.standard.gamma(a))
                composition.standard.check_galois_sector(a, u, tuple(-x % D for x in character))
    blocks = [composition.standard.gamma(a) for a in Q]+[(b, -b % D) for b in R]
    pairings = [Fraction(-19)]*len(Q)+[Fraction(1, 57)]*len(R)
    character, pairing = tuple(blocks[0]), pairings[0]
    joins = []
    for block, c in zip(blocks[1:], pairings[1:]):
        joins.append(composition.join(character, block))
        character += tuple(block)
        pairing *= -57*c
    if -3*sum(Q) % D or -sum(Q) % 19 or pairing != -57**8*19**9:
        raise ValueError("standard right padding fails to descend or has wrong pairing")
    return {"character": list(character), "dimension": 54, "cycle_dimension": 27,
            "source": "Lambda(27)", "gamma3_a": list(Q), "point_a": list(R),
            "cycle": "iterated join of nine rho^19=-3 divisors and ten [-1:1] points, projected then (1/19) trace to K",
            "descent": "same rho on all nine divisors; total exponent -sum(Q)=0 mod19, hence actual projected class is fixed under E19/K",
            "carrier_degree": 1, "projected_pairing": str(pairing), "joins": joins,
            "additional_standard_divisors": "same explicit D_rho; nonzero dual-pullback coefficient, -19 pairing and rho eigencharacter checked for all Q and all 36 units",
            "forward": "F_Z=e_Z[Z]", "inverse": "(1/cZ)[Z]^t e_Z", "inverse_scale": str(1/pairing),
            "roundtrip_scalar": "1"}


def compose():
    aoki = composition.standard.positive_stabilization()['aoki_positive_tuple']
    g19 = standard19()
    right = standard_right()
    j1 = composition.join(aoki, aoki)
    j2 = composition.join(j1['target'], g19['character'])
    if Counter(j2['target']) != Counter(right['character']) or len(j2['target']) != 56:
        raise ValueError("tensor-square word is not a positive endpoint equality")
    permutation = composition.coordinate_permutation(j2['target'], right['character'])
    left_inverse = Fraction(j1['inverse_scale'])*Fraction(j2['inverse_scale'])*Fraction(g19['inverse_scale'])
    if left_inverse*(-57)**2*3*Fraction(g19['projected_pairing']) != 1:
        raise ValueError("tensor-square left inverse normalization fails")
    orbit = []
    for u in range(D):
        if gcd(u, D) == 1:
            lu, ru = [tuple(u*x % D for x in labels) for labels in (j2['target'], right['character'])]
            if composition.coordinate_permutation(lu, ru) != permutation or sum(lu)//D-1 != 27:
                raise ValueError("tensor-square common carrier has wrong Galois behavior")
            orbit.append({"u": u, "normalized_square_artin_19_exponent": 38*u % D})
    return {"source": "(h^16(F_57^16)^T_A) tensor-square tensor A_57(19,19)(11)",
            "target": "Lambda(27)", "source_weight": 54, "target_weight": 54,
            "support": "F_57^16 x F_57^16 x E3", "cycle_dimension": 16,
            "forward": "Theta=G_Z o P o J_(AA,g19) o (J_AA tensor F_g19)",
            "inverse": "(J_AA_inverse tensor G_g19) o J_(AA,g19)_inverse o P_inverse o F_Z",
            "standard19": g19, "standard_right": right, "joins": [j1, j2], "permutation": permutation,
            "left_inverse_scale": str(left_inverse), "right_inverse_scale": right['inverse_scale'],
            "roundtrip_scalar": "1", "galois_units_checked": len(orbit), "galois_orbit": orbit,
            "normalized_square": "(h^16(F_57^16)^T_A(-8)) tensor-square -> A_57(19,38)=A_114(19,76)",
            "square_artin_cancellation": composition.finite_artin_product(3, 1, 2),
            "quadratic_residual": "N=h^16(F_57^16)^T_A(-8) tensor A_114(19,76); N tensor-square -> Lambda",
            "residual_square_artin_products": [composition.finite_artin_product(3, 2, 2), composition.finite_artin_product(3, 2, 1)],
            "status": "EXPLICIT_CHOW_TENSOR_SQUARE; UNSQUARED_QUADRATIC_ROOT_NOT_CONSTRUCTED",
            "boundary": "an isomorphism N^2=1 does not produce N -> A_114(3*(7-zeta3),57); no theorem identifying all order-two Chow lines with explicit Artin cycles is invoked"}


def check(certificate):
    if certificate != compose():
        raise ValueError("square certificate differs from explicit standard-cycle construction")
    return True


def run():
    result = compose()
    check(result)
    counterprobes = []
    for key, value in (("target", "corrected quadratic Artin root"),
                       ("left_inverse_scale", "-1/57"), ("cycle_dimension", 0)):
        try:
            check({**result, key: value})
        except ValueError as error:
            counterprobes.append({"key": key, "proposed_value": value, "status": "REJECTED", "reason": str(error)})
        else:
            raise ValueError("square counterprobe was admitted")
    return {"schema": "conscience64/w114-aoki-square/v1", "composition": result, "counterprobes": counterprobes,
            "standard_word_countercertificate": standard_parity_obstruction(),
            "mot_1": "MOT-1 REMAINS OPEN", "review": "self-review",
            "claim_ceilings": ["TENSOR_SQUARE_ISOMORPHISM != QUADRATIC_ROOT_CORRESPONDENCE",
                               "THEOREM_USE != INDEPENDENT_REPROOF",
                               "W114_BOUNDED_RESULT != HODGE_CONJECTURE_PROOF"]}


if __name__ == '__main__':
    print(json.dumps(run(), indent=2, sort_keys=True))
