from collections import defaultdict
from math import gcd, isqrt
import json

MOD1 = 1 << 64
MOD2 = (1 << 63) - 25


def primes_dividing(m):
    return [q for q in range(2, m) if m % q == 0 and all(q % i for i in range(2, isqrt(q) + 1))]


def generator_entries(m):
    out = [[a, m-a] for a in range(1, m)]
    for p in primes_dividing(m):
        if p == 2:
            for a in range(1, m//2):
                e = [a, a+m//2, m-2*a, m//2]
                if all(x % m for x in e): out.append(e)
        else:
            for a in range(1, m//p):
                e = [a+j*(m//p) for j in range(p)] + [m-p*a]
                if all(x % m for x in e): out.append(e)
    return out


def parity_bitset(entries, m):
    x = 0
    for a in entries:
        a %= m
        assert a
        x ^= 1 << (a-1)
    return x


def gf2_basis(m):
    basis = {}
    for e in generator_entries(m):
        x = parity_bitset(e, m)
        while x:
            p = x.bit_length()-1
            if p in basis: x ^= basis[p]
            else:
                basis[p] = x
                break
    return basis


def quotient_remainder(x, basis):
    out = 0
    while x:
        p = x.bit_length()-1
        if p in basis: x ^= basis[p]
        else:
            out |= 1 << p
            x ^= 1 << p
    return out


def search_divisor(d, M, target):
    factor = M // d
    assert factor*d == M and d % 2 == 1
    units = [t for t in range(1, d) if gcd(t, d) == 1]
    n = len(units)
    w1 = [((i+1)*0x9E3779B185EBCA87 + 0xD1B54A32D192ED03) % MOD1 for i in range(n)]
    w2 = [((i+1)*0x94D049BB133111EB + 0x2545F4914F6CDD1D) % MOD2 for i in range(n)]
    profile = [None]*d; h1 = [0]*d; h2 = [0]*d
    for a in range(1, d):
        p = tuple((t*a) % d for t in units)
        profile[a] = p
        h1[a] = sum(x*w for x,w in zip(p,w1)) % MOD1
        h2[a] = sum(x*w for x,w in zip(p,w2)) % MOD2
    target_h1 = sum(3*d*w for w in w1) % MOD1
    target_h2 = sum(3*d*w for w in w2) % MOD2

    basis = gf2_basis(M)
    target_rem = quotient_remainder(parity_bitset(target, M), basis)
    groups = defaultdict(list)
    triples = []
    for a in range(1, d):
        for b in range(a, d):
            for c in range(b, d):
                hh = ((h1[a]+h1[b]+h1[c]) % MOD1, (h2[a]+h2[b]+h2[c]) % MOD2)
                rem = quotient_remainder(parity_bitset((factor*a,factor*b,factor*c), M), basis)
                key = (hh[0], hh[1], rem)
                tri = (a,b,c)
                groups[key].append(tri)
                triples.append((tri,key))

    raw = exact = 0
    for t1,key in triples:
        need = ((target_h1-key[0]) % MOD1, (target_h2-key[1]) % MOD2, target_rem ^ key[2])
        for t2 in groups.get(need, ()):
            if t2 < t1: continue
            raw += 1
            cand = tuple(sorted(t1+t2))
            if all(sum((u*x) % d for x in cand) == 3*d for u in units):
                exact += 1
    return {
        'd': d,
        'target_level': M,
        'sorted_triples': len(triples),
        'raw_combined_matches': raw,
        'exact_combined_matches': exact,
        'S_mod2_span_rank': len(basis),
    }


def main():
    jobs = [
        ('W70',210,(2,9,129,142,168,180),[3,5,7,15,21,35,105]),
        ('W110',220,(1,62,111,142,162,182),[5,11,55]),
        ('W114',114,(1,7,78,79,86,91),[3,19,57]),
    ]
    rows = []
    for wall,M,target,divs in jobs:
        rs = [search_divisor(d,M,target) for d in divs]
        assert all(r['raw_combined_matches'] == 0 for r in rs)
        rows.append({'wall':wall,'target_level':M,'target':target,'divisors':rs})
    print(json.dumps({
        'experiment':'HODGE-ODD-DIVISOR-INFLATION-COSET-SEARCH',
        'rows':rows,
        'claim_ceiling':'Necessary-condition obstruction for direct odd-divisor inflation/coset transfer only.'
    }, indent=2))

if __name__ == '__main__': main()
