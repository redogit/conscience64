"""Search the minimal 5-activating lift of W114 for a two-pair coset witness.

The two-pair theorem implies [beta]=[Q] mod S_m for a grade-2 Hodge quadruple Q.
At m=570 we enumerate all grade-2 Q exactly. Before integer lattice membership,
we apply the necessary quotient condition modulo 2 using an independently built
GF(2) span of the published S_m generators. A zero match at that stage is decisive.
"""
from collections import defaultdict
from math import gcd, isqrt
import json

M1 = 1 << 64
M2 = (1 << 63) - 25


def primes(m):
    return [q for q in range(2, m) if m % q == 0 and all(q % i for i in range(2, isqrt(q) + 1))]


def generator_entries(m):
    out = [[a, m-a] for a in range(1, m)]
    for p in primes(m):
        if p == 2:
            for a in range(1, m//2):
                e = [a, a+m//2, m-2*a, m//2]
                if all(x % m for x in e):
                    out.append(e)
        else:
            for a in range(1, m//p):
                e = [a+j*(m//p) for j in range(p)] + [m-p*a]
                if all(x % m for x in e):
                    out.append(e)
    return out


def parity_bitset(entries):
    x = 0
    for a in entries:
        x ^= 1 << (a-1)
    return x


def gf2_basis(gens):
    basis = {}
    for e in gens:
        x = parity_bitset(e)
        while x:
            p = x.bit_length()-1
            if p in basis:
                x ^= basis[p]
            else:
                basis[p] = x
                break
    return basis


def quotient_remainder_mod2(x, basis):
    out = 0
    while x:
        p = x.bit_length()-1
        if p in basis:
            x ^= basis[p]
        else:
            out |= 1 << p
            x ^= 1 << p
    return out


def grade2_quads(m):
    units = [t for t in range(1, m) if gcd(t, m) == 1]
    n = len(units)
    w1 = [((i+1)*0x9E3779B185EBCA87 + 0xD1B54A32D192ED03) % M1 for i in range(n)]
    w2 = [((i+1)*0x94D049BB133111EB + 0x2545F4914F6CDD1D) % M2 for i in range(n)]
    profiles = [None] * m
    h1 = [0] * m
    h2 = [0] * m
    for a in range(1, m):
        p = tuple((t*a) % m for t in units)
        profiles[a] = p
        h1[a] = sum(x*w for x, w in zip(p, w1)) % M1
        h2[a] = sum(x*w for x, w in zip(p, w2)) % M2

    target1 = sum(2*m*w for w in w1) % M1
    target2 = sum(2*m*w for w in w2) % M2
    groups = defaultdict(list)
    pairs = []
    for a in range(1, m):
        for b in range(a, m):
            key = ((h1[a]+h1[b]) % M1, (h2[a]+h2[b]) % M2)
            pair = (a, b)
            groups[key].append(pair)
            pairs.append((pair, key))

    out = set()
    raw = 0
    for (a, b), key in pairs:
        need = ((target1-key[0]) % M1, (target2-key[1]) % M2)
        for c, d in groups.get(need, ()):
            if (c, d) < (a, b):
                continue
            raw += 1
            pa, pb, pc, pd = profiles[a], profiles[b], profiles[c], profiles[d]
            # Exact verification. Hash collisions may add work but cannot remove a true hit.
            if all(pa[i]+pb[i]+pc[i]+pd[i] == 2*m for i in range(n)):
                out.add(tuple(sorted((a, b, c, d))))
    return sorted(out), {
        'units': n,
        'pairs': len(pairs),
        'hash_classes': len(groups),
        'raw_hash_matches': raw,
    }


def main():
    # Exact enumerator calibration against the established m=110 count.
    q110, _ = grade2_quads(110)
    assert len(q110) == 1648

    m = 570
    base = (1, 7, 78, 79, 86, 91)
    target = tuple(5*x for x in base)
    gens = generator_entries(m)
    basis = gf2_basis(gens)
    target_rem = quotient_remainder_mod2(parity_bitset(target), basis)
    quads, meta = grade2_quads(m)
    mod2_hits = [q for q in quads if quotient_remainder_mod2(parity_bitset(q), basis) == target_rem]
    assert not mod2_hits

    print(json.dumps({
        'experiment': 'HODGE-W114-5LIFT-TWO-PAIR-COSET-SEARCH',
        'level': m,
        'target': target,
        'gf2_Sm_span_rank': len(basis),
        'grade2_hodge_quadruples': len(quads),
        'enumeration_meta': meta,
        'same_mod2_quotient_remainder': len(mod2_hits),
        'verdict': 'NO_TWO_PAIR_COSET_WITNESS_AT_MINIMAL_5_LIFT',
        'claim_ceiling': 'Necessary-condition obstruction for this lifted two-pair route only.'
    }, indent=2))


if __name__ == '__main__':
    main()
