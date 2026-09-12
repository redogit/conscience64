# SQL Mutilation v5 — Symmetry-Aware Construction

**Status:** bounded finite result. **P vs NP remains OPEN.**

## One representation for both baselines

The exact size<=6 four-input NAND class contains **3,310 functions**.
Both construction policies use the same 3,310-row bitset index and the same
dynamic input-permutation orbit reduction. A candidate score is charged in
64-bit survivor-mask word operations.

This removes the unfairness in v4 where the symmetry route had a structural
compression that generic greedy was not also allowed to use.

## Structural selector

For a nonzero translation `t` of Hamming weight `w`, its permutation
stabilizer is `S_w x S_(n-w)`.

An unordered pair `{x,x xor t}` is classified by

- `min(|x intersect supp(t)|, w-|x intersect supp(t)|)`, and
- `|x outside supp(t)|`.

Therefore the exact number of pair-action orbits before any observation is

`R_n(w) = (floor(w/2)+1)(n-w+1)`.

For every `n>=3`, `R_n(w)>=n` when `w<n`, while
`R_n(n)=floor(n/2)+1<n`. Hence the all-ones translation uniquely minimizes
the initial action-orbit count.

For `n=4`:

| weight | representative | pair-action orbits |
|---:|---:|---:|
| 1 | 1 | 4 |
| 2 | 3 | 6 |
| 3 | 7 | 4 |
| 4 | 15 | 3 |

So **`t=15` is selected without scanning the circuit class**.

## Matched exact finite routes

| route | observations | candidate scores | bitset word ops | survivor path |
|---|---:|---:|---:|---|
| generic symmetry-aware | 5 | 56 | 2,912 | 3310→1371→417→90→1→0 |
| paired t=1 | 10 | 30 | 3,120 | 3310→790→160→45→10→0 |
| paired t=3 | 6 | 30 | 3,120 | 3310→582→32→0 |
| paired t=7 | 6 | 22 | 2,288 | 3310→500→21→0 |
| **paired t=15** | **8** | **20** | **2,080** | 3310→548→78→7→0 |

Relative to symmetry-aware generic greedy, the structurally selected route:

- reduces candidate-score count by **64.3%**;
- reduces charged bitset word operations by **28.6%**;
- retains an 8-observation certificate instead of 5.

The planning win is therefore real under this declared representation, but it
is not a free lifecycle win.

## Parametric lifecycle boundary

If one retained observation costs `lambda` word-op-equivalents, compare

`2912 + 5 lambda`

with

`2080 + 8 lambda`.

The selected symmetry route wins exactly when

`lambda < 277.333`.

This is a transparent tradeoff, not an empirical calibration of observation
cost.

## Counterprobe

A different cheap-looking rule—choose the translation with the smallest
first-step survivor count—selects `t=7` because its first step leaves 500
survivors. But under the matched bitset+orbit cost, `t=15` is cheaper over the
whole route.

Therefore:

**prediction target must equal charged consequence.**

`best immediate shrink != cheapest complete plan`.

## Consequence

v4 separated:

`use carrier != discover carrier != select carrier`.

v5 adds:

`select carrier by semantic shrink != select carrier by execution cost`.

The all-ones carrier is selected from group structure alone and produces a
finite planning-cost improvement. What remains unresolved is whether such a
structural selector continues to produce hard, low-total-cost partial tables
as the number of variables and circuit budget grow.
