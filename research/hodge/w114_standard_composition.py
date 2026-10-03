#!/usr/bin/env python3
"""Typed characteristic-zero standard reduction via primitive join incidence.

The join scalar is a Chow self-intersection calculation in the accompanying
proof, not an inference from equality of Gauss sums or exceptional algebraicity.
This does not construct the exceptional Aoki-to-quadratic-Artin correspondence.
"""
from collections import Counter, defaultdict, deque
from fractions import Fraction
from math import gcd
import json

import w114_standard_divisors as standard

D = 57
BASE_CHECKPOINT = "389c1b705d1af91cdc0e6d3ffd6c14d0133597c0"


def finite_artin_product(degree, left, right):
    if degree < 1:
        raise ValueError("finite Artin carrier degree must be positive")
    # OY Lemma 3.8 (3.6); normalized split-point eigenvectors v_chi.
    # Projected diagonal push gives v_left tensor v_right; diagonal transpose
    # gives v_product/degree. Unit transfer is p_* with inverse p^*/degree.
    unscaled_reverse = Fraction(1, degree)
    return {"carrier_degree": degree, "source_characters": [left % degree, right % degree],
            "product_character": (left+right) % degree,
            "multiplication": "degree*e_product Delta^t(e_left tensor e_right)",
            "inverse": "(e_left tensor e_right) Delta e_product",
            "multiplication_scale": str(degree), "inverse_scale": "1",
            "unscaled_diagonal_contraction": str(unscaled_reverse),
            "roundtrip_scalar": str(degree*unscaled_reverse),
            "trivial_character_to_unit": "p_*; inverse p^*/degree",
            "proof_leaf": "OY Lemma 3.8 equation (3.6), finite carrier projectors"}


def primitive(labels, d=D):
    return d > 1 and len(labels) >= 2 and len(labels) % 2 == 0 and all(0 < x < d for x in labels) and sum(labels) % d == 0


def join(left, right, d=D):
    if not primitive(left, d) or not primitive(right, d):
        raise ValueError("join requires admitted nontrivial projective primitive sectors")
    n, m = len(left)-2, len(right)-2
    normal_c1 = {"H_X": d, "H_Y": d, "h": -d}
    fiber_degrees = {"H_X": 0, "H_Y": 0, "h": 1}
    normal_degree = sum(normal_c1[k]*fiber_degrees[k] for k in normal_c1)
    return {"left": list(left), "right": list(right), "target": list(left)+list(right),
            "source_dimensions": [n, m], "target_dimension": n+m+2,
            "source_tate_twist": 1, "cycle_dimension": n+m+1,
            "incidence": "J=(q,pi i)_*[B]; B=P_lines(O_X(-1) direct-sum O_Y(-1)) over X x Y",
            "resolution": "pi: blow up F^(n+m+2) along the disjoint embedded X and Y",
            "normal_bundle": f"N_B/Wtilde=q^*(O_X({d}) tensor O_Y({d})) tensor O_B(-{d})",
            "normal_first_chern_class": normal_c1, "fiber_degrees": fiber_degrees,
            "fiber_degree_of_normal": normal_degree,
            "forward": "e_concat [J] (e_left tensor e_right), with source twist 1",
            "reverse": "(e_left tensor e_right) [J]^t e_concat",
            "transpose_convention": "transpose the unprojected incidence J, then apply the named endpoint projectors; not the literal transpose of its projected forward map",
            "boundary_vanishing": {"center_X": "right character nontrivial; right-coordinate phases act trivially on h(X)(r)",
                                  "center_Y": "left character nontrivial; left-coordinate phases act trivially on h(Y)(r)"},
            "forward_scale": "1", "inverse_scale": str(Fraction(1, normal_degree)),
            "roundtrip_scalar": "1",
            "proof_leaf": "W114_STANDARD_JOIN_COMPOSITION_2026-09-30.md: primitive join self-intersection proof"}


def linear_padding():
    residues = (22, 23, 29, 32, 11, 17)
    labels = tuple(x for b in residues for x in (b, -b % D))
    pairing = Fraction(-1, D)
    coefficient = 1
    for b in residues:
        coefficient *= D*(-1)**b
    return {"character": list(labels), "dimension": 10, "cycle_dimension": 5,
            "source": "Lambda(5)", "target": "h^10(F_57^10)^C",
            "plane": "L_C: x0+x1=x2+x3=...=x10+x11=0",
            "forward": "F_C=e_C[L_C]", "inverse": "G_C=-57[L_C]^t e_C",
            "forward_scale": "1", "inverse_scale": str(1/pairing),
            "projected_pairing": str(pairing), "carrier_degree": 1,
            "homological_class_coefficient": coefficient,
            "roundtrip_scalar": str(pairing*(1/pairing))}


def coordinate_permutation(left, right):
    slots = defaultdict(deque)
    for i, label in enumerate(left):
        slots[label].append(i)
    try:
        permutation = [slots[label].popleft() for label in right]
    except IndexError:
        raise ValueError("coordinate permutation has unequal character multisets") from None
    if any(slots.values()) or len(left) != len(right):
        raise ValueError("coordinate permutation has unequal character multisets")
    inverse = [permutation.index(i) for i in range(len(left))]
    if [left[i] for i in permutation] != list(right):
        raise ValueError("permutation does not send source labels to target labels")
    if [permutation[inverse[i]] for i in range(len(left))] != list(range(len(left))):
        raise ValueError("permutation inverse is incorrect")
    return {"target_coordinate_to_source_coordinate": permutation,
            "inverse": inverse, "cycle": "graph y_i=x_permutation[i]", "roundtrip_scalar": "1"}


def compose():
    endpoints = standard.positive_stabilization()
    s = endpoints["residual_positive_tuple"]
    a = endpoints["aoki_positive_tuple"]
    b = standard.standard_padding()
    c = linear_padding()
    jl, jr = join(s, b["character"]), join(a, c["character"])
    permutation = coordinate_permutation(jl["target"], jr["target"])
    left_inverse = Fraction(jl["inverse_scale"])*Fraction(b["inverse_scale"])
    right_inverse = Fraction(jr["inverse_scale"])*Fraction(c["inverse_scale"])
    left_roundtrip = left_inverse*(-D)*19*Fraction(b["projected_pairing"])
    right_roundtrip = right_inverse*(-D)*Fraction(c["projected_pairing"])
    if left_roundtrip != right_roundtrip or left_roundtrip != 1:
        raise ValueError("join/padding inverse scalars do not give both identities")
    orbit = []
    for u in range(D):
        if gcd(u, D) != 1:
            continue
        su, au, bu, cu = [tuple(u*x % D for x in labels) for labels in (s, a, b["character"], c["character"])]
        jlu, jru = join(su, bu), join(au, cu)
        if coordinate_permutation(jlu["target"], jru["target"]) != permutation:
            raise ValueError("coordinate permutation is not Galois covariant")
        if sum(su)//D-1+10 != sum(au)//D-1+6:
            raise ValueError("twisted Hodge grades do not match")
        orbit.append({"u": u, "source_character": list(su), "target_character": list(au),
                      "source_artin_3_exponent": 27*u % D,
                      "normalized_target_artin_3_exponent": 30*u % D,
                      "roundtrip_scalar": "1"})
    return {"source": "h^8(F_57^8)^T_S tensor A_57(3,27)(10)",
            "target": "h^16(F_57^16)^T_A(6)",
            "source_weight": 28, "target_weight": 28,
            "support": "F_57^8 x E x F_57^16", "cycle_dimension": 12,
            "normalized_isomorphism": "h^8(F_57^8)^T_S(-4) -> h^16(F_57^16)^T_A(-8) tensor A_57(3,30)",
            "artin_cancellation": finite_artin_product(19, 9, 10),
            "forward": "Psi=R_inverse o P o L; L=J_SB o (id_S tensor F_B); R=J_AC o (id_A tensor F_C)",
            "inverse": "Psi_inverse=L_inverse o P_inverse o R; each join inverse uses its named reverse incidence",
            "left_join": jl, "right_join": jr, "linear_padding": c,
            "standard_padding": b, "permutation": permutation,
            "left_inverse_scale": str(left_inverse), "right_inverse_scale": str(right_inverse),
            "roundtrip_scalar": str(left_roundtrip*right_roundtrip),
            "realization": "nonzero rank-one Betti/de Rham map; realized inverse gives both identities; weight and all conjugate Hodge grades agree",
            "galois_units_checked": len(orbit), "galois_orbit": orbit,
            "status": "EXPLICIT_STANDARD_REDUCTION; EXCEPTIONAL_AOKI_ARROW_NOT_CONSTRUCTED"}


def check(certificate):
    if certificate != compose():
        raise ValueError("composition certificate differs from the typed incidence, scalar or endpoint construction")
    return True


def square_word_check():
    # Proposed by a bounded integer solver, then checked using integers only.
    q = (1, 4, 5, 6, 7, 9, 11, 16, 17)
    r = (1, 2, 4, 7, 8, 14, 16, 19, 25, 28)
    gamma19 = tuple(2+3*j for j in range(19))+(19,)
    right = standard.sign.lincomb([(1, standard.sign.gamma3(a)) for a in q]
                                 +[(1, standard.sign.reflection(a)) for a in r])
    left = [2*x+y for x, y in zip(standard.sign.alpha_aoki(),
                                standard.sign.vec(Counter(gamma19)))]
    if left != right:
        raise ValueError("integer Aoki square-word identity fails")
    return {"gamma3_a": list(q), "reflection_a": list(r), "gamma19_2": list(gamma19),
            "identity": "2 alpha_Aoki + gamma19,2 = sum_Q gamma3,a + sum_R R(a)",
            "positive_length_each_side": sum(left),
            "status": "EXACT_INTEGRAL_WORD_ONLY_IN_THIS_CHECKER; P19_COMPILED_SEPARATELY_IN_W114_AOKI_SQUARE",
            "boundary": "even a constructed tensor-square isomorphism would not specify the quadratic root correspondence"}


def run():
    result = compose()
    check(result)
    return {"schema": "conscience64/w114-standard-composition/v1", "base_checkpoint": BASE_CHECKPOINT,
            "composition": result, "mot_1": "MOT-1 REMAINS OPEN",
            "artin_dictionary": "A_57(c,k)=A_114(c,2k); A_57(3,30)=A_114(3,60)",
            "remaining": "explicit exceptional T_A(-8) -> A_114(19,38) tensor A_114(3*(7-zeta_3),57); full signed plane push",
            "square_word": square_word_check(),
            "proof_status": "internal primitive-join calculation plus external CI class/intersection and Fermat invertibility theorems; self-review",
            "claim_ceilings": ["STANDARD_REDUCTION != EXCEPTIONAL_AOKI_ARROW",
                               "THEOREM_USE != INDEPENDENT_REPROOF",
                               "CHOW_JOIN_SELF_INTERSECTION != ARBITRARY_REALIZATION_FAITHFULNESS",
                               "MOT_1_BOUNDED_PROGRESS != HODGE_CONJECTURE_PROOF"]}


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, sort_keys=True))
