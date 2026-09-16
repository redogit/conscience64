# W114 Matrix-Factorization Target Contract — 2026-09-15

Status: `ACTIVE_BOUNDED_CONSTRUCTIVE_SEARCH`

## Objective

Turn one surviving W114 Fermat-fourfold Hodge eigenspace into a single exact target-coefficient problem for coherent sheaves / graded matrix factorizations.

This contract is deliberately narrower than the Hodge conjecture.

## Fermat target

Let

```text
Q = x0^114 + x1^114 + x2^114 + x3^114 + x4^114 + x5^114
X = Z(Q) subset P^5.
```

Start with the W114 representative

```text
alpha = (1,7,78,79,86,91).
```

Favero–Kelly Proposition 4.2 associates to a Fermat character

```text
M(alpha) = product_i xi^(alpha_i - 1).
```

Therefore the first target is

```text
M_W114 = x1^6 x2^77 x3^78 x4^85 x5^90.
```

The `x0` exponent is zero. Its total degree is

```text
0 + 6 + 77 + 78 + 85 + 90 = 336 = 3*114 - 6,
```

which is the degree of the middle primitive Jacobian piece for a fourfold hypersurface of degree 114.

The Fermat Jacobian ring is

```text
Jac(Q) = C[x0,...,x5] / (x0^113,...,x5^113).
```

## Exact matrix-factorization oracle

For a coherent sheaf with 2-periodic tail represented by square matrices `A,B` satisfying

```text
AB = BA = Q I,
```

Favero–Kelly Theorem 1.3 gives, for a fourfold (`k=2`, `m=114`),

```text
ch_2^prim(F)
 = -1/228 * T(A,B),
```

where

```text
T(A,B) = tr(
    d0A d1B d2A d3B d4A d5B
  - d0B d1A d2B d3A d4B d5A
).
```

The scalar `-1/228` is nonzero, so the search does not need to carry it when testing whether the target coefficient vanishes.

### Success criterion

Reduce `T(A,B)` in `Jac(Q)` and test

```text
coeff_M_W114(T(A,B)) != 0.
```

Favero–Kelly Proposition 4.4 implies that a nonzero coefficient on `M_W114` puts the corresponding eigenspace `V(alpha)` in the complexification of the image of the Chern character.

The entire polynomial does **not** need to equal `M_W114`.

## Admission after a hit

A nonzero target coefficient is a mathematical witness for the declared coherent-sheaf / matrix-factorization carrier, but it is not permission to skip source authentication.

Before promoting an algebraicity claim:

1. verify `AB = BA = Q I` exactly;
2. verify grading and the associated sheaf / K-class;
3. recompute the primitive Chern character independently;
4. verify the target coefficient after exact Jacobian reduction;
5. verify the character/eigenspace correspondence;
6. state exactly which W114 Galois block is closed;
7. only then update the Hodge claim matrix.

## Control 1 — standard linear complete intersections

Favero–Kelly Example 4.5 recovers the standard linear complete-intersection classes. Their characters have the form

```text
(ell0, 114-ell0, ell1, 114-ell1, ell2, 114-ell2)
```

up to permutation.

Equivalently, the target monomial exponents must partition into three pairs summing to `114-2 = 112`.

An exact finite check was run on all three W114 wall representatives and every unit modulo 114:

- 36 Galois conjugates per representative;
- 15 perfect coordinate pairings per conjugate;
- 0 conjugates with even one complementary pair;
- 0 conjugates with a full complementary pairing.

The positive control

```text
(1,113,7,107,36,78)
```

is detected correctly.

Verdict:

```text
NO_W114_STANDARD_LINEAR_COMPLETE_INTERSECTION_HIT.
```

This is not a general Koszul obstruction.

## Control 2 — disjoint-binary rank-one Thom–Sebastiani carriers

Lin–Zhang (arXiv:2609.03784) construct explicit rank-one matrix factorizations for squarefree binary forms and tensor them across disjoint binary blocks. For a Fermat binary block of degree 114, the boundary–bulk polynomial in that two-variable block has degree `112`.

Therefore any monomial in a tensor product of three such disjoint binary carriers again requires the six exponents to partition into three pairs summing to 112.

The same exact W114 pairing screen rules out the target from this disjoint-binary carrier family at the Fermat point.

Their theorem that these explicit classes exhaust rational Hodge classes is stated for a **very general** sum of independently varying binary forms, not for the special Fermat point. No specialization theorem is assumed here.

Verdict:

```text
NO_W114_DISJOINT_BINARY_RANK_ONE_HIT.
```

## Control 3 — da Silva complete intersection

Favero–Kelly Example 4.7 treats a proposed complete intersection on Fermat fourfolds when `3 | m`. In the associated decomposition, one `b_i` is constant, so the determinant matrix in their complete-intersection formula has a zero column and

```text
ch_2^prim(O_Z) = 0.
```

Since `3 | 114`, this family cannot have a nonzero W114 target coefficient.

Verdict:

```text
ZERO_PRIMITIVE_CHERN_CHARACTER.
```

## Consequence for the next search

The first W114 target has no complementary coordinate pair at all. Therefore a useful next carrier must leave the disjoint-pair regime.

The next bounded experiment should test one **mixed-variable** factorization family at a time. A candidate is admissible only if it genuinely mixes variables across the old binary pair boundaries and still permits exact verification of `AB = BA = QI` and the single target coefficient.

Do not launch an unconstrained symbolic search.

Recommended loop:

```text
PROPOSE one sparse mixed-variable ansatz
-> VERIFY factorization exactly
-> COMPUTE only the target coefficient first
-> if zero: preserve ansatz-specific obstruction
-> if nonzero: compute the full required certificate and independently audit
-> only then consider claim promotion.
```

## Sources

- David Favero and Tyler L. Kelly, *The Chern character of a coherent sheaf on a smooth projective hypersurface*, arXiv:2609.12759v1 (2026-09-11): Theorem 1.3 / 3.6, Propositions 4.2 and 4.4, Examples 4.5 and 4.7, Remark 4.10.
- Xun Lin and Shizhuo Zhang, *A note on the noncommutative Hodge conjecture for graded matrix factorizations*, arXiv:2609.03784 (2026-09): explicit binary rank-one factorizations and Thom–Sebastiani products; the exhaustion theorem is very-general and is not imported to the Fermat point.
- `EVEN_WALL_SHIODA_CUBIC_SCREEN_2026-09-15.md`: immediately preceding exact negative Shioda-cubic route.

## Reproduction

```bash
cd research/hodge
python3 -m unittest test_w114_factorization_controls.py -v
python3 w114_factorization_controls.py > W114_FACTORIZATION_CONTROLS_RESULT.json
```

## Claim ceiling

The controls above exclude only the declared standard linear, disjoint-binary rank-one, and da Silva complete-intersection carriers.

They do **not** exclude:

- general Koszul factorizations;
- mixed-variable complete intersections;
- non-Koszul matrix factorizations;
- ACM sheaves not represented by these ansatz families;
- other algebraic cycles or correspondences;
- algebraicity of W114;
- the Hodge conjecture.

Required invariant:

```text
FAILED_ANSATZ != NONALGEBRAIC_CLASS.
```
