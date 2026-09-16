import json
import math

LEVEL = 114
WALLS = [
    (1, 7, 78, 79, 86, 91),
    (1, 13, 43, 72, 103, 110),
    (1, 13, 43, 80, 102, 103),
]


def units_mod(m):
    return [u for u in range(1, m) if math.gcd(u, m) == 1]


def conjugate(alpha, u, m):
    return tuple((u * a) % m for a in alpha)


def has_any_complementary_pair(alpha, m):
    return any(
        (alpha[i] + alpha[j]) % m == 0
        for i in range(len(alpha))
        for j in range(i + 1, len(alpha))
    )


def has_complementary_pairing(alpha, m):
    alpha = tuple(alpha)
    if not alpha:
        return True
    first = alpha[0]
    for j in range(1, len(alpha)):
        if (first + alpha[j]) % m == 0:
            rest = alpha[1:j] + alpha[j + 1 :]
            if has_complementary_pairing(rest, m):
                return True
    return False


def run():
    units = units_mod(LEVEL)
    rows = []
    for alpha in WALLS:
        any_count = 0
        full_count = 0
        for u in units:
            beta = conjugate(alpha, u, LEVEL)
            any_count += int(has_any_complementary_pair(beta, LEVEL))
            full_count += int(has_complementary_pairing(beta, LEVEL))
        exponents = [a - 1 for a in alpha]
        rows.append(
            {
                "representative": list(alpha),
                "monomial_exponents": exponents,
                "middle_jacobian_degree": 3 * LEVEL - 6,
                "galois_conjugates_checked": len(units),
                "conjugates_with_any_complementary_pair": any_count,
                "conjugates_with_full_complementary_pairing": full_count,
            }
        )
    return {
        "schema": "conscience64/w114-factorization-controls/v1",
        "level": LEVEL,
        "units_checked": len(units),
        "criterion": (
            "Example 4.5 / binary rank-one Thom-Sebastiani support requires "
            "alpha coordinates pair into sums congruent to 0 mod m "
            "(equivalently target monomial exponents pair to m-2)."
        ),
        "positive_control": {
            "alpha": [1, 113, 7, 107, 36, 78],
            "full_complementary_pairing": has_complementary_pairing(
                (1, 113, 7, 107, 36, 78), LEVEL
            ),
        },
        "walls": rows,
        "claim_ceiling": (
            "Excludes only complementary-pair / disjoint-binary rank-one carriers "
            "for these W114 Galois orbits; does not exclude general Koszul or "
            "non-Koszul matrix factorizations or algebraicity."
        ),
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, sort_keys=True))
