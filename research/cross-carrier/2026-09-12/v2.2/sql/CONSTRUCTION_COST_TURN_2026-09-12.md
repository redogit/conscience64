# SQL Mutilation v4 — Construction Cost and Translation-Orbit Turn

**Bounded finite result. P vs NP remains OPEN.**

## Exact oracle

The constructor independently rebuilds the four-input NAND/free-constant
size<=6 class and admits the experiment only after reproducing **3,310**
functions.

## Matched construction policies

`generic greedy` chooses one unobserved coordinate/label at a time to minimize
the current surviving class.

`paired greedy(t)` fixes a nonzero translation `t`, chooses one unused orbit
`{x,x xor t}` and one common label at a time, and minimizes the same surviving
class while preserving translation symmetry by construction.

The score is exact survivor count. No formula-size proxy is used.

## Results

Generic greedy:
- observations: 5;
- candidate scores: 140;
- survivor scans: 161,090;
- literal reads: 161,090;
- survivor path: `3310 -> 1371 -> 417 -> 90 -> 1 -> 0`.

A fixed useful translation can reduce planning work, but gives a longer
certificate. The best measured fixed route by literal reads is `t=7`:
- observations: 6;
- candidate scores: 42;
- survivor scans: 60,212;
- literal reads: 90,318;
- survivor path: `3310 -> 500 -> 21 -> 0`.

Thus, conditional on already having the useful carrier, candidate scores fall
by 70.0%, survivor scans by about 62.6%, and measured literal reads by about
43.9%. The certificate itself grows from 5 to 6 observations. Separately, the
known exhaustive finite landscape contains a 4-observation certificate, so
neither greedy route is globally optimal in observation count.

## Translation selection cost

Trying all 15 translations as full paired-greedy routes costs:
- 712 candidate scores;
- 937,318 survivor scans;
- 1,405,977 literal reads.

That is worse than generic greedy. The fixed-carrier advantage cannot be
claimed without charging carrier selection.

## Translation-orbit quotient

For a circuit class invariant under permutations of its `n` input variables,
the symmetric group `S_n` acts transitively on translation vectors of equal
Hamming weight. Consequently, any paired-restriction objective that is itself
invariant under variable relabeling needs at most one representative of each
nonzero Hamming weight.

So the translation candidate space contracts from

`2^n - 1 -> n`

orbit representatives.

For n=4, representatives `t={1,3,7,15}` reproduce the four observed cost
classes. Evaluating all four full routes costs:
- 196 candidate scores;
- 249,812 survivor scans;
- 374,718 literal reads.

This is a 72.5% reduction in candidate-score count versus trying all 15
translations, but it is still more planning work than generic greedy on this
finite instance.

## Consequential distinction

The evidence now separates three costs:

`using a carrier != discovering a carrier != selecting among carrier classes`.

Symmetry is beneficial to the fixed-route planner and to the exact quotient
verifier, but selecting the symmetry still consumes enough work here to erase
the construction-side advantage against generic greedy.

## Next target

A scalable positive result now needs a **cheap predictor or aggregate** that
chooses a useful translation-orbit class without running every candidate route,
or it needs the carrier to arise naturally from the construction itself.

This remains a construction/search question, not a P-vs-NP resolution.
