# Even Fermat-Wall Shioda–Cubic Screen — 2026-09-15

Status: `EXECUTED_EXACT_FINITE_OBSTRUCTION`

## Question

Can any of the current even-degree Fermat-fourfold wall characters be reached directly by pulling back a degree-3 Jacobian-ring monomial from a six-monomial Delsarte cubic in the prime-order symplectic cubic families, using an exact Shioda cover?

This is a mechanism test, not a test of algebraicity in general.

## Why this route

Favero–Kelly, *The Chern character of a coherent sheaf on a smooth projective hypersurface* (arXiv:2609.12759v1, 2026-09-11), gives an explicit Jacobian-ring formula for the primitive Chern character of a coherent sheaf and proves the Hodge conjecture for the degree-33 Fermat fourfold. Their degree-33 argument also uses a Shioda map from a Fermat fourfold to a special cubic fourfold.

Billi–Grossi–Marquand, *Cubic fourfolds with a symplectic automorphism of prime order* (arXiv:2501.03869), supplies explicit prime-order cubic families and their algebraic/transcendental lattice structure.

The existing Conscience64 even-wall frontier had already produced exact negative results for the same-level star-split route, the published two-pair route at the tested base/lift levels, and direct odd-divisor inflation. This experiment therefore tests a different carrier: cubic Jacobian classes pulled back by exact Shioda maps.

## Exact character formula used

Let `A` be the 6×6 exponent matrix of an invertible cubic Delsarte polynomial, and let `M` be a Fermat-cover level for which

```text
B = M A^{-1}
```

is integral. For a degree-3 target Jacobian monomial with exponent row vector `e`, the pulled-back Fermat character is computed as

```text
alpha = (M/3) * (1,1,1,1,1,1) + e B   (mod M).
```

Only characters with no zero coordinate are retained.

The verifier uses integer Bareiss determinants and exact adjugates. It additionally checks both identities

```text
A B = M I
B A = M I.
```

No floating-point matrix inversion is used.

## Positive control

The loop-five-plus-Fermat cubic used in the degree-33 construction, at cover level `M=33`, with target monomial exponent

```text
(1,0,0,0,1,1)
```

reproduces exactly

```text
(19,7,13,10,28,22),
```

the degree-33 character used by Favero–Kelly.

Verdict: `PASS`.

## Direct W114@114 screen

The three W114 representatives are compared up to coordinate permutation and multiplication by every unit modulo 114.

| cubic support family | invariant cubic monomials | six-monomial supports | invertible | exact level-114 covers | valid pullbacks | distinct canonical pullbacks | W114 hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `phi3_3` | 26 | 230,230 | 46,220 | 40,734 | 1,132,940 | 24 | **0** |
| `phi4_3` | 20 | 38,760 | 11,025 | 9,409 | 243,164 | 13 | **0** |
| `phi6_3` | 20 | 38,760 | 19,848 | 18,808 | 444,240 | 20 | **0** |

Verdict: no direct character witness occurs in this complete finite Delsarte-support screen.

## Existing lifted targets checked with the p=5 family

The same exact verifier also checked the `phi1_5` family against the already-recorded lifted targets:

| wall | level | six-monomial supports | invertible | exact covers | valid pullbacks | distinct | hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| W70 | 210 | 924 | 374 | 366 | 19,982 | 52 | **0** |
| W114 | 570 | 924 | 374 | 366 | 19,982 | 52 | **0** |

The W114@570 target here is also the canonical fivefold power-map pullback of the base W114 representative.

## Canonical power-map lift/descent screen

For a positive integer `q`, the coordinatewise power map

```text
pi_q : X^4_{q m} -> X^4_m
       [x_0:...:x_5] |-> [x_0^q:...:x_5^q]
```

is a finite morphism of degree `q^5`. On the Fermat character labels used here, pullback sends

```text
alpha |-> q alpha.
```

Thus a cycle realizing the canonical lifted character gives a rational descent route by proper pushforward, because `pi_{q*} pi_q^*` acts by the nonzero degree `q^5` on rational cohomology.

The smallest canonical cubic-compatible lift for W70 and W110 is `q=3`:

```text
W70@210  = 3 * (1,20,24,42,61,62)
          = (3,60,72,126,183,186)

W110@330 = 3 * (1,24,62,71,81,91)
          = (3,72,186,213,243,273).
```

All comparisons below again use the full unit orbit and coordinate permutations.

### W70@210

| family | six-monomial supports | invertible | exact covers | valid pullbacks | distinct | hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `phi3_3` | 230,230 | 46,220 | 41,028 | 1,144,472 | 42 | **0** |
| `phi4_3` | 38,760 | 11,025 | 9,409 | 243,164 | 13 | **0** |
| `phi6_3` | 38,760 | 19,848 | 18,832 | 445,440 | 28 | **0** |
| `phi1_5` | 924 | 374 | 366 | 19,982 | 52 | **0** |
| `phi1_7` | 28 | 22 | 21 | 1,176 | 17 | **0** |

### W110@330

| family | six-monomial supports | invertible | exact covers | valid pullbacks | distinct | hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `phi3_3` | 230,230 | 46,220 | 41,028 | 1,144,472 | 42 | **0** |
| `phi4_3` | 38,760 | 11,025 | 9,409 | 243,164 | 13 | **0** |
| `phi6_3` | 38,760 | 19,848 | 18,832 | 445,440 | 28 | **0** |
| `phi1_5` | 924 | 374 | 366 | 19,982 | 52 | **0** |
| `phi1_11` | 1 | 1 | 1 | 51 | 5 | **0** |

The `p=11` row is especially useful as a counterprobe because its invariant Delsarte support is uniquely determined within this six-monomial screen; it still does not hit the canonical W110 lift.

## Result

Within the declared finite family, the following direct mechanism is obstructed:

```text
surviving even Fermat wall
-> direct/canonical power lift
-> exact Delsarte Shioda cover to a tested prime-order cubic family
-> degree-3 cubic Jacobian monomial
-> matching Fermat wall character.
```

No tested row produces a character hit.

This is a `COUNTEREXAMPLE_TO_ROUTE`, not a non-algebraicity result.

## What this does not exclude

The computation does **not** exclude:

- non-Delsarte cubic fourfolds;
- coherent sheaves whose Chern characters are not represented by this direct monomial pullback screen;
- arbitrary matrix factorizations;
- linear combinations whose geometry is not captured by a single pulled-back degree-3 monomial;
- different rational correspondences;
- other lift/descent constructions;
- new algebraic gap families;
- algebraicity of W70, W110, or W114 by any other route;
- the Hodge conjecture.

In particular:

```text
NO_SHIODA_CHARACTER_HIT != NONALGEBRAIC_HODGE_CLASS.
```

## Next bounded experiment

The strongest new direction supplied by Favero–Kelly is no longer another finite variant of the same coset/Shioda search. It is the coherent-sheaf formulation itself:

```text
wall character / Jacobian monomial
-> candidate graded matrix factorization or 2-periodic resolution
-> exact primitive Chern-character formula
-> compare with target Jacobian class
-> if matched, authenticate the corresponding coherent sheaf / algebraic K-class
-> only then promote the algebraicity claim.
```

Start with one W114 representative because it is already a direct level-114 object and avoids an additional lift/descent layer.

A negative result for a declared factorization ansatz should be preserved as an ansatz-specific obstruction, not generalized beyond that family.

## Reproduction

```bash
g++ -O3 -std=c++17 research/hodge/even_wall_shioda_cubic_screen.cpp -o /tmp/even_wall_shioda
/tmp/even_wall_shioda > research/hodge/EVEN_WALL_SHIODA_CUBIC_SCREEN_RESULT.json
python3 -m unittest research/hodge/test_even_wall_shioda_cubic_screen.py -v
```

Artifact SHA-256 values for this revision:

```text
2e044bca11f586d409b570fef38afa59cb7bd72754cdcb501434aeb65fd58fea  even_wall_shioda_cubic_screen.cpp
06aa16715db0386834f3cfd3fbf169c90e69a4092edde7c64b71b30d936bbb13  test_even_wall_shioda_cubic_screen.py
8b9a46f4712fa02cce623517e036493a4b791498306a04979dfea09ed445d908  EVEN_WALL_SHIODA_CUBIC_SCREEN_RESULT.json
```

## Claim ceiling

`EXECUTED_EXACT_FINITE_OBSTRUCTION` only.

The Hodge conjecture remains open. The unresolved scientific question is whether a genuinely new algebraic construction—now most concretely a coherent-sheaf / matrix-factorization construction—can realize one of the surviving even-wall classes.
