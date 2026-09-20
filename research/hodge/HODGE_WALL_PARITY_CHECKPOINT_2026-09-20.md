# Hodge wall parity checkpoint — 2026-09-20

Status: `BOUNDED_NEGATIVE_EVIDENCE / STRUCTURAL_COORDINATE_FOUND / GENERAL_HODGE_UNRESOLVED`

## Epistemic rule

`FOUND != KNOWN`.

External papers, repositories, and prior receipts are mechanism generators only.  This checkpoint
promotes only finite statements reproduced by the independent scripts on this branch.

## Active objects

Even Fermat-fourfold wall representatives currently carried:

- `W70`: `(1,20,24,42,61,62)`
- `W110`: `(1,24,62,71,81,91)`, `(1,31,55,71,81,91)`
- `W114`: `(1,7,78,79,86,91)`, `(1,13,43,72,103,110)`,
  `(1,13,43,80,102,103)`

No statement below proves algebraicity or non-algebraicity of any wall.

## Independent first-lift screens

Implemented in `wall_parity_screen.py`.

### W110 -> level 220

- both listed representatives reduce to the same nonzero mod-2 `S_220` quotient coordinate;
- 8,066 zero-sum triples were exhaustively considered;
- no same-coset `*-split` witness exists even modulo 2;
- grade-2 Hodge quadruples occupy only two quotient classes;
- neither decomposable `pair + Q` nor quasi-decomposable `Q1 + Q2 - pair` can reach the wall
  quotient;
- every lower divisor source level
  `4,5,10,11,20,22,44,55` was exhaustively screened by a meet-in-the-middle Hodge test;
  none has a sextuple whose lift reaches the wall quotient.

### W114 -> level 228

- all three listed representatives reduce to the same nonzero mod-2 `S_228` quotient coordinate;
- 8,664 zero-sum triples were exhaustively considered;
- no same-coset `*-split` witness exists even modulo 2;
- grade-2 Hodge quadruples occupy only two quotient classes;
- decomposable and quasi-decomposable grade-2 routes cannot reach the wall quotient;
- lower divisor levels `3,4,6,12,19,38,57,76` were exhaustively screened;
  none has a Hodge sextuple whose lift reaches the wall quotient.

A mod-2 failure is a valid obstruction because integer `S_m` membership would imply
membership after reduction mod 2.  A mod-2 success would *not* certify integer membership.

## First-lift exchange screen

Implemented in `wall_exchange_screen.py`.

At both levels 220 and 228:

- the algebraic `*-split` family occupies only two mod-2 quotient classes;
- the grade-2 family generates only a two-class subgroup;
- the wall lies outside
  `Q_star + span(Q_grade2)`.

Therefore a grade-2 exchange applied to a one-step `*-split` carrier cannot reach the wall
within this finite quotient contract.

## New-prime one-degree experiment

Instead of increasing a bound without changing structure, one new prime divisor was introduced:

- `W110: 110 -> 330`, adding prime 3;
- `W114: 114 -> 570`, adding prime 5.

Exact finite results:

### level 330

- 18,150 zero-sum triples;
- `*-split` Hodge sextuples occupy 3 quotient classes;
- grade-2 Hodge quadruples occupy 3 quotient classes;
- the wall is in neither family nor their grade-2 exchange closure;
- every lower divisor level
  `3,5,6,10,11,15,22,30,33,55,66` was exhaustively screened;
  no lifted Hodge sextuple reaches the wall quotient.

### level 570

- 54,150 zero-sum triples;
- `*-split` and grade-2 families each occupy only 2 quotient classes;
- the wall is outside both and their exchange closure;
- every lower divisor level
  `3,5,6,10,15,19,30,38,57,95` was exhaustively screened;
  no lifted Hodge sextuple reaches the wall quotient.

Interpretation: adding one genuinely new prime factor does not make the existing induced/grade-2
carrier families reach the missing wall direction.

## Minimal dual coordinates

Implemented in `wall_dual_coordinate.py`.

Every detector below annihilates every pair/standard generator mod 2 and evaluates to 1 on every
unit conjugate of its wall.

### W70

Minimum support (4 residues):

`{14,28,42,56}`.

This is exactly the gcd stratum `gcd(x,70)=14`, equivalently the nonzero residues of additive
order 5.

### W110

Minimum support (12 residues / 6 negation pairs):

`{17,19,27,28,38,41,69,72,82,83,91,93}`.

An easier non-minimal arithmetic representative is

`x mod 10 in {2,5,8}`.

Its unit orbit has exactly two states:

- `A={2,5,8} mod 10`;
- `B={4,5,6} mod 10`.

Independent Wolfram evaluation confirmed that all 40 units mod 110 split 20/20:
quadratic residues mod 5 preserve A and quadratic nonresidues swap A and B.
Thus this dual direction carries a two-state quadratic mod-5 action.

No detector depending only on the gcd stratum of `x mod 110` can detect the wall while
annihilating the standard lattice.

### W114

Minimum support (12 residues / 6 negation pairs):

`{1,20,29,37,47,56,58,67,77,85,94,113}`.

A simple Galois-invariant representative is the gcd stratum

`gcd(x,114)=6`.

## Geometric consequence

For a fourfold, a one-step binary induced join has only the dimension partitions

- `0 + 2` -> pair + grade-2 quadruple;
- `1 + 1` -> triple + triple.

The independent quotient screens reject both families for W110 and W114 at their base levels
and at the tested lifts.  Therefore the next useful route must introduce a genuinely different
correspondence/cycle mechanism, not merely another one-step induced join or another standard
lattice combination.

## Candidate next mechanism — not evidence

Literature discovery surfaced motivic Gauss/Jacobi-sum correspondences as a possible
mechanism family capable of expressing relations between Fermat motives outside the elementary
pair/standard presentation.  No theorem from that literature has been imported into the claim
state.

For W110, the quadratic mod-5 two-state dual coordinate is the first concrete target:
seek an explicit algebraic correspondence whose character transport crosses that dual direction.
For W70/W114, seek an explicit cycle/correspondence with odd intersection against the respective
Galois-invariant gcd-stratum detector.

## Claim ceiling

Known from this checkpoint:

- exact finite mod-2 obstructions for the declared carrier families and levels;
- exact minimal parity detectors and their stated unit-action behavior;
- exact absence of lower-divisor Hodge lifts in the enumerated divisor sets.

Not known from this checkpoint:

- algebraicity or non-algebraicity of W70, W110, or W114;
- completeness of all possible algebraic correspondences;
- any result for the general Hodge conjecture.
