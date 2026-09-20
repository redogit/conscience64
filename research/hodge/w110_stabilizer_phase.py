#!/usr/bin/env python3
"""Exact stabilizer and Frobenius-phase symmetry check for W110^(2).

This checker proves the elementary character symmetry directly and then uses
exact_jacobi_phase.py for finite split-prime probes.  The symmetry statement is
independent of the probes:

H = {t in (Z/110)^* : t*a is a coordinate permutation of a}
  = {t : t == 1 mod 5 and (t/11)=+1}.

Hence a root of unity zeta_110^r fixed by H must have r divisible by 11,
so its order divides 10.

The finite probes test, but do not prove, that the normalized Jacobi value is
a root of unity at the selected primes.
"""
from math import gcd
import json
from exact_jacobi_phase import exact_phase, split_primes

M=110
A=(1,31,55,71,81,91)

def units(m):
    return [t for t in range(1,m) if gcd(t,m)==1]

def legendre11(t):
    r=pow(t%11,5,11)
    return 1 if r==1 else -1 if r==10 else 0

def stabilizer():
    target=sorted(A)
    return [t for t in units(M) if sorted((t*x)%M for x in A)==target]

def fixed_root_exponents(H):
    return [r for r in range(M) if all(((t-1)*r)%M==0 for t in H)]

def root_order(r):
    return 1 if r==0 else M//gcd(M,r)

def main():
    H=stabilizer()
    arithmetic=[t for t in units(M) if t%5==1 and legendre11(t)==1]
    allowed=fixed_root_exponents(H)
    ps=split_primes(M,25)
    phases=[exact_phase(M,p,A) for p in ps]
    assert H==[1,31,71,81,91]
    assert H==arithmetic
    assert len(units(M))//len(H)==8
    assert allowed==list(range(0,110,11))
    assert all(row["phase_exponent"]%11==0 for row in phases)
    p2531=next(row for row in phases if row["p"]==2531)
    assert p2531["phase_exponent"]==11 and p2531["phase_order"]==10
    print(json.dumps({
      "claim_ceiling":"Character-stabilizer facts are exact. The 25 Jacobi identities are exact finite computations. No global algebraicity or non-algebraicity conclusion follows.",
      "character":list(A),
      "stabilizer":H,
      "stabilizer_arithmetic_description":"t == 1 (mod 5) and LegendreSymbol(t,11)=+1",
      "unit_group_size":len(units(M)),
      "galois_orbit_size":len(units(M))//len(H),
      "fixed_root_exponents":allowed,
      "possible_fixed_root_orders":sorted(set(root_order(r) for r in allowed)),
      "tested_split_primes":ps,
      "exact_phase_exponents":[row["phase_exponent"] for row in phases],
      "exact_phase_orders":[row["phase_order"] for row in phases],
      "order5_hypothesis_counterexample":{"p":2531,"phase_exponent":11,"phase_order":10},
      "all_25_tested_phases_in_mu10":all(row["phase_exponent"]%11==0 for row in phases)
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
