from math import gcd
import json

WALLS = {
    "W70": [
        (70, (1,20,24,42,61,62)),
        (210, (2,9,129,142,168,180)),
    ],
    "W110": [
        (110, (1,24,62,71,81,91)),
        (110, (1,31,55,71,81,91)),
        (220, (1,62,111,142,162,182)),
    ],
    "W114": [
        (114, (1,7,78,79,86,91)),
        (114, (1,13,43,72,103,110)),
        (114, (1,13,43,80,102,103)),
    ],
}


def residues(m, t, a):
    return tuple((t*x) % m or m for x in a)


def constant_grade(m, a):
    units = [t for t in range(1, m) if gcd(t, m) == 1]
    sums = [sum(residues(m, t, a)) for t in units]
    assert all(s % m == 0 for s in sums)
    grades = {s // m for s in sums}
    return len(units), sorted(grades), sorted(set(sums))


def main():
    rows = []
    for wall, members in WALLS.items():
        for m, a in members:
            units, grades, sums = constant_grade(m, a)
            rows.append({
                "wall": wall,
                "level": m,
                "character": a,
                "units_checked": units,
                "grades": grades,
                "integer_sums": sums,
                "hodge_22_character_check": grades == [3],
            })

    # Explicit exchange displayed in the companion source:
    # 3-lift of the m=70 champion and a Galois conjugate of the m=210 member
    # differ by exchanger q=(46,72,116,186).
    q = (46,72,116,186)
    units, grades, sums = constant_grade(210, q)
    exchange = {
        "level": 210,
        "exchanger": q,
        "units_checked": units,
        "grades": grades,
        "integer_sums": sums,
        "hodge_11_quadruple_check": grades == [2],
    }

    print(json.dumps({
        "experiment": "DF-HODGE-03-EVEN-WALL-ARITHMETIC",
        "wall_rows": rows,
        "displayed_W70_exchange": exchange,
        "claim_ceiling": (
            "Exact finite character arithmetic only. Wall claim-equivalence and algebraicity "
            "implications require the separately authenticated Exchange theorem and Lefschetz (1,1)."
        ),
    }, indent=2))


if __name__ == "__main__":
    main()
