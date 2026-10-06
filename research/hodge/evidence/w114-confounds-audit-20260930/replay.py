#!/usr/bin/env python3
"""Separate arithmetic audit, with no imports from W114 producer/checkers.

Different implementations do not make this a fresh-agent geometric proof.
The exceptional cycle and its intersection pairing are not supplied here.
"""
from collections import Counter
from fractions import Fraction as Q
from math import gcd
import json


def parity():
    support = {17, 21, 26, 31, 36, 40}
    h1 = (1, 4, 7, 16, 25, 28, 43, 49, 55)
    aoki = Counter(h1+tuple(-3*a % 57 for a in h1))
    words = []
    for a in range(1, 57):
        words.append(('R', a, Counter((a, -a % 57))))
        if a % 19:
            words.append(('gamma3', a, Counter((a, (a+19) % 57, (a+38) % 57, -3*a % 57))))
        if a % 3:
            words.append(('gamma19', a, Counter(tuple((a+3*j) % 57 for j in range(19))+(-19*a % 57,))))
    rows = []
    for u in range(1, 57):
        if gcd(u, 57) != 1:
            continue
        su = {u*a % 57 for a in support}
        target = Counter({u*a % 57: c for a, c in aoki.items()})
        assert sum(target[a] for a in su) % 2 == 1
        assert all(sum(word[a] for a in su) % 2 == 0 for _, _, word in words)
        rows.append({'u': u, 'functional_support': sorted(su), 'aoki_value': 1, 'generator_values': 0})
    return {'generators': len(words), 'galois_units': len(rows), 'generator_evaluations': len(words)*len(rows),
            'rows': rows, 'scope': 'integer span of these free-character words only; no nonalgebraicity assertion'}


def plane():
    gram = ((Q(0), Q(1, 57)), (Q(1, 57), Q(0)))
    def matrix(first, second):
        return [[str(57*second[i]*sum(first[k]*gram[k][j] for k in range(2)))
                 for j in range(2)] for i in range(2)]
    correct, reversed_ = matrix((0, 1), (1, 0)), matrix((1, 0), (0, 1))
    assert correct == [['1', '0'], ['0', '0']]
    assert reversed_ == [['0', '0'], ['0', '1']]
    return {'correct_matrix': correct, 'historical_reversed_matrix': reversed_,
            'dependency': 'recorded external primitive plane pairing 1/57; that formula is not independently proved here'}


def quadratic_sign():
    rows = []
    roots = [x for x in range(571) if (x*x+x+1) % 571 == 0]
    assert roots == [109, 461]
    def legendre(x):
        v = pow(x % 571, 285, 571)
        assert v in (1, 570)
        return 1 if v == 1 else -1
    for z in roots:
        q = (7-z) % 571
        assert legendre(q) == 1 and legendre(3*q) == -1
        rows.append({'zeta3': z, 'q': q, 'q_sign': legendre(q), 'three_q_sign': legendre(3*q)})
    return {'prime': 571, 'rows': rows, 'scope': 'exact local sign discriminator; not a global Frobenius proof'}


def target_projector():
    # Exact coefficient arithmetic in Q[z]/(z^2+z+1).
    zero, one, z = (Q(0), Q(0)), (Q(1), Q(0)), (Q(0), Q(1))
    def add(x, y):
        return (x[0]+y[0], x[1]+y[1])
    def mul(x, y):
        return (x[0]*y[0]-x[1]*y[1], x[0]*y[1]+x[1]*y[0]-x[1]*y[1])
    def scale(x, s):
        return (s*x[0], s*x[1])
    def zpow(n):
        value = one
        for _ in range(n % 3):
            value = mul(value, z)
        return value
    group = [(j, k) for j in range(3) for k in range(2)]
    def convolution(a, b):
        out = {g: zero for g in group}
        for (j, k), x in a.items():
            for (r, s), y in b.items():
                g = ((j+r) % 3, (k+s) % 2)
                out[g] = add(out[g], mul(x, y))
        return out
    def projector(sign):
        return {(j, k): scale(zpow(-j), Q(sign**k, 6)) for j, k in group}
    correct, wrong = projector(-1), projector(1)
    assert convolution(correct, correct) == correct
    assert convolution(wrong, wrong) == wrong
    assert all(x == zero for x in convolution(correct, wrong).values())
    assert convolution({(1, 0): one}, correct) == {g: mul(z, x) for g, x in correct.items()}
    assert convolution({(0, 1): one}, correct) == {g: scale(x, -1) for g, x in correct.items()}
    assert scale(correct[(0, 0)], 6) == one
    return {'carrier': 'E6=Spec K[r,t]/(r^3+19,t^2-3*(7-zeta3)); K=Q(zeta57)',
            'group': 'C3 x C2', 'cubic_eigenvalue': 'zeta3', 'quadratic_eigenvalue': -1,
            'idempotent': True, 'trace_and_rank_in_regular_representation': 1,
            'wrong_quadratic_projector_times_correct': 0,
            'coefficients': [{'j': j, 'k': k, 'one': str(correct[(j, k)][0]), 'zeta3': str(correct[(j, k)][1])}
                             for j, k in group],
            'source': 'h(E6)^chi(8)', 'target': 'h^16(F57^16)^T_A', 'cycle_dimension_required': 8,
            'inverse_obligation': '(1/(6*c)) e_chi [Gamma]^t e_T_A, once Gamma exists and its projected fiber pairing c is nonzero',
            'boundary': 'finite projector verified; no exceptional Gamma, no value of c, no MOT-1 closure'}


def run():
    wrong = 19*Q(-19)*Q(-1, 19)
    correct = 19*Q(-19)*Q(-1, 361)
    assert wrong == 19 and correct == 1
    return {'schema': 'conscience64/w114-confounds-audit/v1',
            'source_commit': '0ffcdce1e3731e4fa293ac69ca294b4b8772b90d',
            'review': 'self-review; separate arithmetic implementations, no W114 producer/checker imports; no independent geometry audit',
            'parity': parity(), 'plane': plane(), 'quadratic_sign': quadratic_sign(),
            'inverse_example': {'projected_pairing': '-19', 'carrier_degree': 19,
                                'wrong_inverse': '-1/19', 'wrong_roundtrip': str(wrong),
                                'correct_inverse': '-1/361', 'correct_roundtrip': str(correct)},
            'next_target_projector': target_projector(), 'MOT-1': 'OPEN',
            'ceilings': ['SOFTWARE_VERIFICATION != MATHEMATICAL_PROOF', 'THEOREM_USE != INDEPENDENT_REPROOF',
                         'ARITHMETIC_REIMPLEMENTATION != INDEPENDENT_GEOMETRIC_REPROOF', 'HODGE_CONJECTURE_REMAINS_OPEN']}


if __name__ == '__main__':
    print(json.dumps(run(), indent=2, sort_keys=True))
