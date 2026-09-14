"""Independent bounded search for same-level *-split coset-transfer witnesses.

This implementation uses SymPy's Hermite normal form rather than the source package's
membership reducer. It shares only the published definition of Aoki's S_m generator family.

Contract:
  - target: one base representative of W70, W110, W114;
  - candidate beta: union of two unordered nonzero zero-sum triples at the same level;
  - necessary coset condition: nu(target)-nu(beta) in S_m;
  - calibration: known m=168 target/beta coset-transfer witness must have equal quotient signature.

A negative result is only about this exact same-level *-split witness family.
"""
from collections import defaultdict
from math import gcd, isqrt, lcm
import json

import sympy as sp
from sympy.matrices.normalforms import hermite_normal_form


def primes_dividing(m):
    out = []
    for p in range(2, m + 1):
        if m % p == 0 and all(p % q for q in range(2, isqrt(p) + 1)):
            out.append(p)
    return out


def vec(m, entries):
    v = [0] * (m - 1)
    for x in entries:
        x %= m
        assert x != 0
        v[x - 1] += 1
    return v


def generators_S(m):
    """Published pair + standard-element generating family for S_m."""
    G = []
    for a in range(1, m):
        G.append(vec(m, [a, m - a]))
    for p in primes_dividing(m):
        if p == 2:
            for a in range(1, m // 2):
                ent = [a, a + m // 2, m - 2 * a, m // 2]
                if any(e % m == 0 for e in ent):
                    continue
                G.append(vec(m, ent))
        else:
            d = m // p
            for a in range(1, d):
                ent = [a + j * d for j in range(p)] + [m - p * a]
                if any(e % m == 0 for e in ent):
                    continue
                G.append(vec(m, ent))
    return G


def quotient_setup(m):
    """Build an exact signature for Q^(m-1)/S_m from an HNF column basis.

    For v in the rational span, the signature is the fractional coefficient vector
    modulo Z. A residual component is retained as well, so vectors outside the rational
    span cannot alias a lattice coset.
    """
    G = generators_S(m)
    A = sp.Matrix(m - 1, len(G), lambda i, j: G[j][i])
    H = hermite_normal_form(A)

    # Choose independent rows of the full-column-rank HNF basis.
    _, pivots = H.T.rref()
    rows = list(pivots)
    B = H[rows, :]
    assert B.rows == B.cols and B.det() != 0
    Binv = B.inv()

    row_pos = {row: j for j, row in enumerate(rows)}
    nonrows = [i for i in range(m - 1) if i not in row_pos]
    P = H[nonrows, :] * Binv if nonrows else sp.zeros(0, H.cols)

    D = 1
    for x in list(Binv) + list(P):
        D = lcm(D, int(x.q))

    # Linear contribution of one occurrence of residue k+1.
    contrib = []
    for k in range(m - 1):
        if k in row_pos:
            j = row_pos[k]
            c = [int(D * Binv[i, j]) for i in range(H.cols)]
            residual = [int(-D * P[i, j]) for i in range(len(nonrows))]
        else:
            c = [0] * H.cols
            residual = [D if nonrows[i] == k else 0 for i in range(len(nonrows))]
        contrib.append((c, residual))

    return {
        "H": H,
        "D": D,
        "contrib": contrib,
        "rank": H.cols,
        "residual_dim": len(nonrows),
    }


def signature(m, entries, setup):
    r, D = setup["rank"], setup["D"]
    cs = [0] * r
    rs = [0] * setup["residual_dim"]
    for x in entries:
        c, residual = setup["contrib"][(x % m) - 1]
        cs = [a + b for a, b in zip(cs, c)]
        rs = [a + b for a, b in zip(rs, residual)]
    return tuple(x % D for x in cs) + tuple(rs)


def subtract_signature(target, s, D, rank):
    return (
        tuple((target[i] - s[i]) % D for i in range(rank))
        + tuple(target[i] - s[i] for i in range(rank, len(target)))
    )


def zero_sum_triples(m):
    """All unordered nonzero residue multisets of length 3 summing to 0 mod m."""
    out = []
    for a in range(1, m):
        for b in range(a, m):
            c = (-a - b) % m
            if c != 0 and c >= b:
                out.append((a, b, c))
    return out


def constant_grade(m, entries, grade):
    for t in range(1, m):
        if gcd(t, m) == 1:
            if sum((t * x) % m or m for x in entries) != grade * m:
                return False
    return True


def search_level(m, target):
    setup = quotient_setup(m)
    target_sig = signature(m, target, setup)
    triples = zero_sum_triples(m)

    by_sig = defaultdict(list)
    triple_sig = {}
    for t in triples:
        s = signature(m, t, setup)
        triple_sig[t] = s
        by_sig[s].append(t)

    same_coset = set()
    grade3 = set()
    raw_pairs = 0
    for t1 in triples:
        need = subtract_signature(target_sig, triple_sig[t1], setup["D"], setup["rank"])
        for t2 in by_sig.get(need, []):
            if t2 < t1:
                continue
            raw_pairs += 1
            beta = tuple(sorted(t1 + t2))
            if beta in same_coset:
                continue
            same_coset.add(beta)
            if constant_grade(m, beta, 3):
                grade3.add(beta)

    return {
        "level": m,
        "target": target,
        "lattice_rank": setup["rank"],
        "signature_denominator": setup["D"],
        "zero_sum_triple_multisets": len(triples),
        "triple_signature_classes": len(by_sig),
        "raw_matching_triple_pairs": raw_pairs,
        "distinct_same_coset_star_split_multisets": len(same_coset),
        "hodge_grade3_same_coset_star_splits": len(grade3),
        "examples": [list(x) for x in sorted(grade3)[:10]],
    }


def main():
    # Positive calibration from the companion paper's m=168 closure.
    setup168 = quotient_setup(168)
    a168 = (1, 25, 79, 121, 127, 151)
    beta168 = (6, 54, 60, 108, 126, 150)
    assert signature(168, a168, setup168) == signature(168, beta168, setup168)
    assert constant_grade(168, beta168, 3)
    assert (6 + 54 + 108) % 168 == 0
    assert (60 + 126 + 150) % 168 == 0

    targets = [
        (70, (1, 20, 24, 42, 61, 62)),
        (110, (1, 24, 62, 71, 81, 91)),
        (114, (1, 7, 78, 79, 86, 91)),
    ]
    results = [search_level(m, a) for m, a in targets]

    print(json.dumps({
        "experiment": "HODGE-EVEN-WALL-SAME-LEVEL-STAR-SPLIT-COSET-SEARCH",
        "positive_control_m168": "PASS",
        "results": results,
        "claim_ceiling": (
            "Complete only for same-level witnesses beta that are unions of two nonzero "
            "zero-sum triples under the published S_m generator definition. No absence claim "
            "is made for other algebraic gap families, lifts, correspondences, or new mechanisms."
        ),
    }, indent=2))


if __name__ == "__main__":
    main()
