# Boolean Membership Oracles: HSP Boundary and Fourier Quotient Theorem

## Setup

Let `G` be a finite group written additively, let `S ⊆ G`, and let

`χ_S : G -> {0,1}`

be the membership indicator.

Define the translation stabilizer

`H = { h in G : S + h = S }`.

Then `χ_S` is constant on each `H`-coset, so it factors through the quotient
`G/H`.

This quotient fact alone is **not** the ordinary Hidden Subgroup Problem promise.

---

## Theorem 1 — Boolean HSP boundary

The Boolean membership oracle `χ_S` satisfies the standard HSP promise

`χ_S(x) = χ_S(y)  iff  x-y in H`

for its translation stabilizer `H` if and only if one of the following holds:

1. `S = ∅`;
2. `S = G`;
3. `[G:H] = 2` and `S` is exactly one of the two `H`-cosets.

### Proof

Under the HSP promise, equal oracle values must be exactly the equivalence
classes `x+H`.

A Boolean oracle has at most two nonempty level sets. Hence `G/H` can have at
most two cosets.

If the oracle is constant, then `S=∅` or `S=G`, and `H=G`.

Otherwise both Boolean values occur, so there must be exactly two cosets.
The `1`-level set is therefore exactly one `H`-coset and the `0`-level set the
other.

Conversely, if `S` is one coset of an index-2 subgroup `H`, membership is
constant and distinct on the two cosets, which is exactly the HSP promise.
QED.

### Consequence for Boolean search

Rank-1 affine parity constraints over `F_2^n` are genuine Simon/HSP-style
membership oracles.

Higher-codimension affine subspaces are still highly symmetric, but their
Boolean membership indicator merges many distinct `H`-cosets into the same
output value. Recovering the partition symmetry is therefore a broader hidden
symmetry problem, not ordinary HSP.

---

## Theorem 2 — Fourier support of an invariant Boolean search space

Now take `G = F_2^n`.

If `χ_S(x+h)=χ_S(x)` for every `h in H`, then the Walsh-Fourier transform of
`χ_S` is supported inside the annihilator

`H^⊥ = { y : <y,h> = 0 mod 2 for all h in H }`.

### Proof

For Fourier character

`χ_y(x)=(-1)^{<x,y>}`,

the coefficient is

`Fhat(y) = sum_x χ_S(x) (-1)^{<x,y>}`.

For any `h in H`, substitute `x -> x+h`. Invariance gives

`Fhat(y)
 = sum_x χ_S(x+h)(-1)^{<x+h,y>}
 = (-1)^{<h,y>} Fhat(y)`.

If some `h in H` has `<h,y>=1`, then

`Fhat(y) = -Fhat(y)`,

so `Fhat(y)=0`.

Thus nonzero Fourier coefficients require `y in H^⊥`. QED.

---

## Theorem 3 — exact quotient search when the stabilizer is known

If `H` is known, membership in `S` depends only on the coset `x+H`.
Therefore exact exhaustive search over `G` may be replaced by exact search over
`G/H`, with one representative per coset.

The state-space reduction factor is exactly

`|H|`.

This does **not** say finding `H` is easy.

---

## Research boundary

Shor's algorithm solves a specific abelian HSP obtained from modular
periodicity. Simon's algorithm solves the corresponding `F_2^n` hidden-subgroup
problem under its promise.

A generic SAT oracle does not satisfy that promise merely because its satisfying
set has a translation stabilizer. The relevant broader object is partition
symmetry / hidden symmetry.

Therefore:

`periodicity -> quotient`

is a valid carrier principle,

but

`SAT -> Shor`

is false without an additional efficiently discoverable symmetry promise.

These statements do not imply `BQP ⊇ NP`, `P=NP`, or `P!=NP`.
