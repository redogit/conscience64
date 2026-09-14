from math import gcd
import json

M = 39
REPS = [
    (1, 7, 16, 22, 34, 37),
    (1, 14, 16, 22, 29, 35),
]
SPLIT = ((0, 2, 3), (1, 4, 5))


def residue(x: int) -> int:
    r = x % M
    return M if r == 0 else r


def main() -> None:
    units = [t for t in range(1, M) if gcd(t, M) == 1]
    rows = []
    for rep in REPS:
        seen_split_sums = set()
        for t in units:
            b = tuple(residue(t * x) for x in rep)
            total = sum(b)
            left = sum(b[i] for i in SPLIT[0])
            right = sum(b[i] for i in SPLIT[1])
            assert total == 3 * M
            assert left % M == 0 and right % M == 0
            seen_split_sums.add((left, right))
        rows.append({
            "representative": rep,
            "galois_units_checked": len(units),
            "grade3_all_conjugates": True,
            "zero_sum_triple_split_all_conjugates": True,
            "observed_integer_split_sums": sorted(seen_split_sums),
        })

    print(json.dumps({
        "experiment": "HODGE-M39-STAR-SPLIT-HYPOTHESIS",
        "level": M,
        "rows": rows,
        "claim_ceiling": (
            "This verifies the finite character hypothesis only. Algebraicity follows only "
            "through a separately authenticated theorem such as Theorem 1.2 of arXiv:2608.18134v1."
        ),
    }, indent=2))


if __name__ == "__main__":
    main()
