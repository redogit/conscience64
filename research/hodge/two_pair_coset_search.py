"""Exact grade-2 quotient search for two-pair coset-transfer witnesses.

Requires the independently implemented quotient setup in coset_star_split_search.py.
The mathematical reduction is:
  beta + p1 + p2 = S + Q,
with pairs p1,p2 and standard S in Aoki's S_m, hence [beta]=[Q] mod S_m.
So enumerate all grade-2 Hodge quadruples Q and compare quotient signatures.
"""
from math import gcd
import json

from coset_star_split_search import quotient_setup, signature


def units(m):
    return [t for t in range(1, m) if gcd(t, m) == 1]


def constant_grade(m, entries, grade):
    for t in units(m):
        if sum((t*x) % m or m for x in entries) != grade * m:
            return False
    return True


def grade2_quads(m):
    """Enumerate all sorted nonzero grade-2 Hodge quadruples exactly."""
    us = units(m)
    out = []
    # t=1 already forces a+b+c+d=2m.
    for a in range(1, m):
        for b in range(a, m):
            max_c = min(m - 1, (2*m - a - b) // 2)
            for c in range(b, max_c + 1):
                d = 2*m - a - b - c
                if d < c or d >= m or d <= 0:
                    continue
                q = (a, b, c, d)
                if all(sum((t*x) % m or m for x in q) == 2*m for t in us):
                    out.append(q)
    return out


def scan(m, target):
    setup = quotient_setup(m)
    target_sig = signature(m, target, setup)
    quads = grade2_quads(m)
    hits = [q for q in quads if signature(m, q, setup) == target_sig]
    return {
        "level": m,
        "target": list(target),
        "grade2_hodge_quadruples_enumerated": len(quads),
        "quadruples_in_target_coset": len(hits),
        "hit_examples": [list(q) for q in hits[:10]],
    }


def main():
    # Published positive two-pair calibration at m=45.
    setup45 = quotient_setup(45)
    a45 = (1, 19, 20, 28, 30, 37)
    q45 = (5, 20, 30, 35)
    assert constant_grade(45, a45, 3)
    assert constant_grade(45, q45, 2)
    assert signature(45, a45, setup45) == signature(45, q45, setup45)

    results = [
        scan(70, (1, 20, 24, 42, 61, 62)),
        scan(110, (1, 24, 62, 71, 81, 91)),
    ]
    assert all(r["quadruples_in_target_coset"] == 0 for r in results)

    print(json.dumps({
        "experiment": "HODGE-EVEN-WALL-TWO-PAIR-COSET-OBSTRUCTION",
        "positive_control_m45": "PASS",
        "results": results,
        "W114": "NOT_APPLICABLE_AT_BASE_LEVEL_BECAUSE_5_DOES_NOT_DIVIDE_114",
        "claim_ceiling": (
            "Excludes only same-level witnesses certified by the published 5-standard two-pair "
            "closure. It is not a non-algebraicity result."
        ),
    }, indent=2))


if __name__ == "__main__":
    main()
