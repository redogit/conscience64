#!/usr/bin/env python3
"""Typed projective transfer blocks and a fail-closed W114 composition audit.

Arithmetic: Z[zeta_d], d=57,114; scalar normalizations: Q.
Geometry: Chow(K,Lambda), K=Q(zeta_114), Lambda=Q(zeta_114).
External inputs are Otsubo--Yamazaki, not independently reproved here.
No Gauss symbol is treated as a characteristic-zero Chow object.
"""
from __future__ import annotations

from collections import Counter
from copy import deepcopy
from fractions import Fraction
from functools import lru_cache
from hashlib import sha256
from math import gcd
from pathlib import Path
import json

import verify_w114_compiler_endpoints as endpoints
import verify_w114_sign_normalization as sign
import verify_w114_explicit_ks_correspondence as ks
import verify_w114_explicit_artin_carrier as artin

BASE_COMMIT = "3b213dfee92c8015ca3add613357c6819f9f24c7"
D2_WORD = ((7, 1), (22, 1), (23, -1), (56, -1))
N_WORD = ((1, 1), (2, -1))
UNITS = tuple(u for u in range(114) if gcd(u, 114) == 1)
INPUTS = (
    "W114_EXPLICIT_KATSURA_SHIODA_CORRESPONDENCE_2026-09-25.md",
    "W114_EXPLICIT_ARTIN_CARRIER_2026-09-25.md",
    "W114_COMPILER_ENDPOINTS_2026-09-25.md",
    "W114_DUPLICATION_REFLECTION_PRIMITIVES_2026-09-25.md",
    "W114_N3_TRANSFER_CORRESPONDENCE_2026-09-25.md",
    "W114_N3_PROJECTIVE_CLOSURE_2026-09-25.md",
    "W114_MOTIVIC_STANDARD_WORD_2026-09-25.md",
    "W114_SIGN_NORMALIZATION_CORRECTION_2026-09-25.md",
    "verify_w114_compiler_endpoints.py", "verify_w114_sign_normalization.py",
    "verify_w114_explicit_ks_correspondence.py", "verify_w114_explicit_artin_carrier.py",
    "verify_w114_duplication_reflection_primitives.py",
    "verify_w114_n3_transfer_correspondence.py", "verify_w114_n3_projective_closure.py",
    "w114_research_loop.py", "HODGE_COMPASS_API.md",
)


def clean(v):
    return {k: c for k, c in v.items() if c}


def word_check(word=D2_WORD):
    """All 36 residue-label Galois actions; this is NOT a cycle compiler."""
    jw = Counter({1: 1, 7: 1, 78: 1, 79: 1, 86: 1, 23: -1})
    jf = Counter(2*a for a in (29, 17, 28, 40))
    residual = Counter({2*a: c for a, c in sign.ALPHA_S.items()})
    lhs = Counter(jw)
    lhs.subtract(jf)
    lhs.subtract(residual)
    rhs = Counter()
    for a, s in word:
        for k, c in endpoints.d2(a).items():
            rhs[k] += s*c
    for a, s in N_WORD:
        for k, c in endpoints.norm(a).items():
            rhs[k] += s*c
    rows = []
    for u in UNITS:
        def action(v):
            return clean(Counter({k*u % 114: c for k, c in clean(v).items()}))
        if action(lhs) != action(rhs):
            raise ValueError("signed word fails exact free-vector identity")
        exponent = sum(-2*a*s*u for a, s in word) % 114
        if exponent != 100*u % 114:
            raise ValueError("signed word fails Artin exponent covariance")
        rows.append({"u": u, "artin_2_exponent": exponent})
    return {"word": [list(x) for x in word+N_WORD],
            "free_vector": {str(k): c for k, c in sorted(clean(lhs).items())},
            "artin_2_exponent": 100, "net_norm_tate": 0,
            "galois_units_checked": len(rows), "galois_orbit": rows,
            "status": "EXACT_ARITHMETIC_ONLY"}


def transfer(n, a):
    """Explicit graph fiber-product cycle between PROJECTIVE Fermat pieces.

    Y=product F_d^(2)^(a,k), X=F_d^(n)<n>^(a,...,a).
    Q:Y(open)->C^(n-1) has degree (d/n)^(n-1).
    Z=Y(open) x_T X(open); barZ is its closure in Y x X.
    F=c_F e_X [barZ] e_sym e_Y; G=c_G e_Y e_sym [barZ]^t e_X.
    """
    if n not in (2, 3):
        raise ValueError("bounded transfer supports n=2,3 only")
    d = 114 if n == 2 else 57
    a %= d
    characters = tuple(d*i//n for i in range(1, n))
    if a == 0 or n*a % d == 0 or any((a+k) % d == 0 for k in characters):
        raise ValueError("boundary or multiplication hypothesis fails")
    deg_q = (d//n)**(n-1)
    sym = 1 if n == 2 else 2
    deg_c = d**(n-2)*sym
    deg_x = d**(n-1)
    fscale = Fraction(1) if n == 2 else Fraction(1, deg_x)
    gscale = Fraction(1, deg_x*deg_q) if n == 2 else Fraction(sym, deg_c*deg_q)
    return {
        "n": n, "d": d, "a": a,
        "source": f"Y({d};{a};{','.join(map(str, characters))})",
        "target": f"X({d};{n};{a};twist={n})",
        "curve_characters": [[a, k] for k in characters],
        "surface_character": [a]*n,
        "deg_Q": deg_q, "deg_C_to_T": deg_c, "deg_X_to_T": deg_x,
        "symmetrizer_order": sym,
        "forward_scale": str(fscale), "inverse_scale": str(gscale),
        "forward_cycle": f"{fscale} e_X [closure(Y_open x_T X_open)] e_sym e_Y",
        "inverse_cycle": f"{gscale} e_Y e_sym [closure(Y_open x_T X_open)]^t e_X",
        "geometry": {"C": f"x^{d}+y^{n}=1, x!=0",
                     "T": f"t^{d}=prod(s_i); sum(s_i)={n}; prod(s_i)!=0",
                     "X": f"sum(t_i^{d})={n}; prod(t_i)!=0",
                     "Q": f"(u,v)->(u,v^{d//n}) in each curve factor",
                     "C_to_T": "s_i=prod_j(1-zeta_n^i*y_j), t=prod_j x_j",
                     "X_to_T": f"s_i=t_i^{d}, t=prod_i t_i"},
        "boundary": {"X_diagonal": n*a % d, "X_coordinate_hyperplanes": [a]*n, "curve_u1": a,
                     "curve_u0": [(a+k) % d for k in characters],
                     "quotient_kernel": [(n*k) % d for k in characters]},
        "theorem_dependencies": ["OY 3.5, 3.6, 4.11(iv), 7.2", "Chow-to-DM full faithfulness (3.5)"],
        "status": "THEOREM_DEPENDENT_PROJECTIVE_TRANSFER",
    }


def roundtrip_scalar(edge):
    # Compute, rather than assert, the transfer/projector reduction scalar.
    return (Fraction(edge["forward_scale"])*Fraction(edge["inverse_scale"])
            *edge["deg_Q"]*edge["deg_C_to_T"]*edge["deg_X_to_T"]
            /edge["symmetrizer_order"])


def check_transfer(edge):
    ref = transfer(edge["n"], edge["a"])
    if roundtrip_scalar(edge) != 1:
        raise ValueError(f"inverse normalization gives {roundtrip_scalar(edge)}, expected 1")
    if set(edge) != set(ref):
        raise ValueError("transfer metadata fields were changed")
    for key in ref:
        if edge[key] != ref[key]:
            raise ValueError(f"transfer metadata mismatch: {key}")
    return True


def signed_block():
    """Six historical word occurrences retained; only four D2 leaves lift here.

    For +D2 use G:Xtw->Y; for -D2 use F:Y->Xtw. This direction
    gives the positive Gauss relation on SOURCE/TARGET after removing twists.
    The twist difference is -100, canceling the Gauss residual +100.
    N1-N2 is kept in the separate arithmetic ledger, never silently deleted.
    """
    edges = [transfer(2, a) for a, _ in D2_WORD]
    source = ["P_f"] + [e["target"] if s > 0 else e["source"]
                         for e, (_, s) in zip(edges, D2_WORD)]
    state = source[:]
    steps = []
    for i, (e, (a, s)) in enumerate(zip(edges, D2_WORD), 1):
        after = state[:]
        after[i] = e["source"] if s > 0 else e["target"]
        steps.append({"occurrence_id": f"D2:{a}:signed-position:{i}",
                      "generator": f"D2_{a}", "sign": s,
                      "direction": "inverse" if s > 0 else "forward",
                      "source": state[:], "target": after[:],
                      "cycle": f"id_P_f tensor spectator identities tensor ({e['inverse_cycle'] if s > 0 else e['forward_cycle']})",
                      "primitive": e})
        state = after
    return {"source": source, "target": state, "steps": steps,
            "composition": "B=B_4 o B_3 o B_2 o B_1 (rightmost first)",
            "inverse": "B^-1=B_1^-1 o B_2^-1 o B_3^-1 o B_4^-1",
            "dimension_each_product": 8, "cycle_dimension_in_source_x_target": 8,
            "motivic_weight": 8,
            "nonzero_reason": "Each graph transfer has a theorem-dependent inverse; P_f is nonzero by pairing 1/57.",
            "plane_action": "z_f tensor v -> z_f tensor B_curves(v); this is not B(z_f) alone",
            "w114_endpoint": False}


def check_chain(steps, source):
    state = source[:]
    if len(steps) != len(D2_WORD):
        raise ValueError("bounded block needs exactly four signed D2 occurrences")
    for i, (step, (a, s)) in enumerate(zip(steps, D2_WORD), 1):
        if step["source"] != state:
            raise ValueError("composition source does not equal previous target")
        edge = step["primitive"]
        check_transfer(edge)
        direction = "inverse" if s > 0 else "forward"
        expected = state[:]
        if len(state) != 5 or state[0] != "P_f" or edge["n"] != 2 or edge["a"] != a:
            raise ValueError("wrong block source or signed occurrence")
        if state[i] != (edge["target"] if s > 0 else edge["source"]):
            raise ValueError("primitive source does not match tensor context")
        expected[i] = edge["source"] if s > 0 else edge["target"]
        cycle = f"id_P_f tensor spectator identities tensor ({edge[direction+'_cycle']})"
        if (step["target"] != expected or step["direction"] != direction
                or step["sign"] != s or step["generator"] != f"D2_{a}"
                or step["occurrence_id"] != f"D2:{a}:signed-position:{i}"
                or step["cycle"] != cycle):
            raise ValueError("signed cycle or tensor target was changed")
        state = expected
    return state


def check_norm_category(base_field):
    if base_field == "Q(zeta_114)":
        raise ValueError("Artin-Schreier norm primitive in OY 4.5 has finite-field base, not Q(zeta_114)")
    raise ValueError("no finite-field norm cycle is compiled in this bounded characteristic-zero block")


def galois_check():
    """Covariance under Gal(K/Q), not descent of a single sector to Q."""
    rows = []
    for u in UNITS:
        sectors = []
        for n, values in ((2, (7, 22, 23, 56)), (3, (4, 11, 16, 17))):
            d = 114 if n == 2 else 57
            characters = [d*i//n for i in range(1, n)]
            moved = [u*k % d for k in characters]
            if sorted(moved) != characters:
                raise ValueError("Galois transport lost quotient character")
            for a in values:
                au = a*u % d
                if not au or not n*au % d or any((au+k) % d == 0 for k in moved):
                    raise ValueError("transported boundary survives")
                if any(n*k % d for k in moved):
                    raise ValueError("transported quotient descent fails")
                sectors.append({"d": d, "n": n, "a": au,
                                "ordered_quotient_characters": moved,
                                "factor_permutation": [characters.index(k) for k in moved]})
        rows.append({"u": u, "sectors": sectors, "all_transfer_boundaries_pass": True,
                     "plane_character": [u*a % 57 for a in endpoints.F],
                     "sign_exponent": 57*u % 114,
                     "sign_radicand": "3*(7-zeta_3)" if u % 3 == 1 else "3*(7-zeta_3^2)",
                     "claim": "covariance only; no Q-descent or residual Chow arrow inferred"})
    return rows


def reduce_poly(coeff, d):
    phi = list(sign.PHI57)
    if d == 114:
        phi = [c*(-1)**i for i, c in enumerate(phi)]
    elif d != 57:
        raise ValueError("only Phi_57 and Phi_114 supported")
    out = list(coeff)
    while len(out) >= len(phi):
        c = out.pop()
        offset = len(out)-len(phi)+1
        for i in range(len(phi)-1):
            out[offset+i] -= c*phi[i]
    return tuple(out+[0]*(36-len(out)))


def multiply(x, y, d):
    out = [0]*(len(x)+len(y)-1)
    for i, a in enumerate(x):
        for j, b in enumerate(y):
            out[i+j] += a*b
    return reduce_poly(out, d)


def shift(x, exponent, d):
    return reduce_poly([0]*(exponent % d)+list(x), d)


@lru_cache(None)
def finite_field(p):
    # This function deliberately supports only the two declared primes.
    if p not in (229, 571):
        raise ValueError("outside frozen prime bounds")
    factors = (2, 3, 19) if p == 229 else (2, 3, 5, 19)
    g = next(x for x in range(2, p) if all(pow(x, (p-1)//r, p) != 1 for r in factors))
    logs = [-1]*p
    x = 1
    for k in range(p-1):
        logs[x] = k
        x = x*g % p
    if x != 1 or any(k < 0 for k in logs[1:]):
        raise ValueError("primitive-root discrete log enumeration failed")
    return g, tuple(logs)


def jacobi(p, d, exponents):
    """Raw exact sum over x_1+...+x_n=1, n=2,3, each x_i!=0.

    OY's sign (-1)^(n-1) cancels in each identity tested here.
    No floating root recognition, Gauss relation, or predicted result is used.
    """
    _, logs = finite_field(p)
    a, b = exponents[:2]
    coeff = [0]*d
    if len(exponents) == 2:
        for x in range(1, p):
            y = (1-x) % p
            if y:
                coeff[(a*logs[x]+b*logs[y]) % d] += 1
    elif len(exponents) == 3:
        c = exponents[2]
        for x in range(1, p):
            ax = a*logs[x]
            for y in range(1, p):
                z = (1-x-y) % p
                if z:
                    coeff[(ax+b*logs[y]+c*logs[z]) % d] += 1
    else:
        raise ValueError("bounded direct Jacobi sum supports arity 2,3")
    return reduce_poly(coeff, d)


def reflection_phase_check(p):
    """Keep the same-psi reflection phase and the all-plus Fermat coefficient.

    OY (2.2),(2.3): G(psi,a)G(psi,-a)=chi(-1)^a*p.
    Direct two-variable Jacobi sums check the character phase separately.
    """
    _, logs = finite_field(p)
    unit = (1,)+(0,)*35
    phase = (-logs[p-1]) % 114  # N1-N2: chi(-1)^(1-2)
    normalized = []
    for a in (1, 2):
        value = tuple(-x for x in jacobi(p, 114, (a, (-a) % 114)))
        if value != shift(unit, a*logs[p-1], 114):
            raise ValueError("reflection phase fails direct Jacobi countercheck")
        normalized.append(value)
    if normalized[0] != multiply(normalized[1], shift(unit, phase, 114), 114):
        raise ValueError("N1-N2 phase mismatch")
    coefficient_phase = 23*logs[p-1] % 114
    if (phase+coefficient_phase) % 114:
        raise ValueError("all-plus Fermat coefficient fails phase cancellation")
    return {"prime": p, "norm_ratio_exponent": phase,
            "normalized_norm_phase_power_basis": list(shift(unit, phase, 114)),
            "all_plus_coefficient": "c=-1 in OY convention; omitted 91 has sum 23",
            "coefficient_phase_exponent": coefficient_phase,
            "with_all_plus_coefficient_exponent": (phase+coefficient_phase) % 114,
            "warning": "opposite-psi duality alone does not evaluate the same-psi N1-N2 word"}


@lru_cache(None)
def realization_check(p):
    g, logs = finite_field(p)
    n2, n3 = [], []
    source, target = (1,)+(0,)*35, (1,)+(0,)*35
    for a, s in D2_WORD:
        twisted = shift(jacobi(p, 114, (a, a)), 2*a*logs[2], 114)
        plain = jacobi(p, 114, (a, 57))
        if twisted != plain or not any(plain):
            raise ValueError(f"n2 exact realization mismatch at p={p},a={a}")
        source = multiply(source, twisted if s > 0 else plain, 114)
        target = multiply(target, plain if s > 0 else twisted, 114)
        n2.append({"a": a, "exact_match": True, "nonzero": True,
                   "normalized_power_basis": list(plain)})
    for a in (4, 11, 16, 17):
        lhs = shift(jacobi(p, 57, (a, a, a)), 3*a*logs[3], 57)
        rhs = multiply(jacobi(p, 57, (a, 19)), jacobi(p, 57, (a, 38)), 57)
        if lhs != rhs or not any(rhs):
            raise ValueError(f"n3 exact realization mismatch at p={p},a={a}")
        n3.append({"a": a, "exact_match": True, "nonzero": True,
                   "normalized_power_basis": list(rhs)})
    if source != target or not any(source):
        raise ValueError("signed tensor block realization fails")
    return {"prime": p, "primitive_root": g,
            "character_convention": "chi_d(g)=zeta_d; Kummer(n,k)=zeta_d^(k*log_g(n))",
            "n2": n2, "n3": n3, "signed_block_match": True,
            "signed_block_power_basis": list(source),
            "scope": "two split-prime specializations; not a global realization proof"}


def counterprobes():
    rows = []
    def reject(name, candidate, check):
        try:
            check()
        except ValueError as exc:
            rows.append({"id": name, "candidate": candidate, "rejected": True, "reason": str(exc)})
        else:
            raise AssertionError(f"forged proposal accepted: {name}")
    for n, a in ((2, 7), (3, 4)):
        bad = deepcopy(transfer(n, a))
        bad["inverse_scale"] = str(Fraction(bad["inverse_scale"])*bad["deg_Q"])
        reject(f"omit-quotient-n{n}", bad, lambda bad=bad: check_transfer(bad))
    bad = deepcopy(transfer(3, 11))
    bad["inverse_scale"] = str(Fraction(bad["inverse_scale"])/2)
    reject("omit-symmetrizer-two", bad, lambda: check_transfer(bad))
    reject("reverse-D2-23-sign", [[7, 1], [22, 1], [23, 1], [56, -1]],
           lambda: word_check(((7, 1), (22, 1), (23, 1), (56, -1))))
    reject("finite-field-norm-to-char-zero", {"N": [1, 2], "base": "Q(zeta_114)"},
           lambda: check_norm_category("Q(zeta_114)"))
    reject("bare-plane-as-transfer-block-source", {"source": ["P_f"]},
           lambda: check_chain(signed_block()["steps"], ["P_f"]))
    forged = deepcopy(signed_block()["steps"])
    forged[1]["source"] = ["W114"]
    reject("relabel-transfer-target-as-W114", forged,
           lambda: check_chain(forged, signed_block()["source"]))
    reject("n3-boundary-survives", {"n": 3, "a": 19}, lambda: transfer(3, 19))
    bad_geometry = deepcopy(transfer(2, 7))
    bad_geometry["geometry"]["Q"] = "identity"
    reject("erase-fermat-quotient-geometry", bad_geometry,
           lambda: check_transfer(bad_geometry))
    # Preserve the old q-only sign as a failed interpretation, not erased history.
    def old_sign():
        p = 571
        q = sign.verify_prime571_counterprobe()["q_mod_p"]
        if pow(q, (p-1)//2, p) != pow(3*q % p, (p-1)//2, p):
            raise ValueError("at p=571, q is a square but corrected 3q is a nonsquare")
    reject("old-q-only-gap-sign", {"radicand": "7-zeta_3", "prime": 571}, old_sign)
    def omit_phase():
        if reflection_phase_check(571)["norm_ratio_exponent"]:
            raise ValueError("same-psi N1-N2 leaves chi_114(-1), equal to -1 at p=571")
    reject("drop-same-psi-minus-one-phase", {"word": "N_1-N_2", "claimed_scalar": 1, "prime": 571}, omit_phase)
    return rows


def run():
    edges = [transfer(2, a) for a, _ in D2_WORD]+[transfer(3, a) for a in (4, 11, 16, 17)]
    for e in edges:
        check_transfer(e)
    block = signed_block()
    check_chain(block["steps"], block["source"])
    sign.verify_relation_word()
    sign.verify_cyclotomic_square()
    prime571 = sign.verify_prime571_counterprobe()
    root = Path(__file__).resolve().parent
    return {
        "schema": "conscience64/w114-signed-composition/v1",
        "base_commit": BASE_COMMIT,
        "issue": "https://github.com/redogit/conscience64/issues/99",
        "phase": "VERIFY_BOUNDED; ADMIT_W114_DENIED",
        "mot1_status": "OPEN", "w114_plane_cycle_produced": False,
        "n3_compactification": "LATER_ARTIFACT_CLOSES_BOUNDARY_SEAM_UNDER_OY_THEOREM; NOT_INDEPENDENT_REPROOF",
        "word": word_check(), "projective_transfers": edges,
        "galois_covariance": galois_check(),
        "signed_D2_projective_block": block,
        "plane": endpoints.plane_check(), "corrected_artin": endpoints.artin_target_check(),
        "artin_curve_carrier": artin.run(), "source_KS": ks.run(),
        "prime571_sign_counterprobe": prime571,
        "realizations": [realization_check(p) for p in (229, 571)],
        "reflection_phase_and_fermat_convention": [reflection_phase_check(p) for p in (229, 571)],
        "counterprobes": counterprobes(),
        "input_sha256": {p: sha256((root/p).read_bytes()).hexdigest() for p in INPUTS},
        "unresolved": [
            "N_1-N_2 Artin-Schreier reflection recipe has finite-field base; no characteristic-zero contraction supplied.",
            "Free Gauss symbols and cancellations have no typed characteristic-zero object/coevaluation compiler here.",
            "Residual alpha_Aoki -> standard/Tate tensor A(3*(7-zeta_3)) still needs an actual graph/cycle; field identification alone is not that arrow.",
            "P_f is not the source of the D2 tensor block; B(z_f) in the W114 eigenspace is not constructed.",
        ],
        "claim_ceiling": ["MOT-1 REMAINS OPEN", "HODGE_CONJECTURE_REMAINS_OPEN",
                          "THEOREM_USE != INDEPENDENT_REPROOF", "EXACT_ARITHMETIC != CHOW_MORPHISM",
                          "NONZERO_TRANSFER_BLOCK != NONZERO_W114_CORRESPONDENCE",
                          "SPLIT_PRIME_REALIZATION_CHECK != GLOBAL_REALIZATION_PROOF"],
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write the bounded result JSON instead of stdout")
    args = parser.parse_args()
    result = json.dumps(run(), indent=2, sort_keys=True)+"\n"
    if args.output:
        args.output.write_text(result, encoding="utf-8")
    else:
        print(result, end="")
