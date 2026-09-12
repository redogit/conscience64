# SQL Frontier Lineage

This directory is an append-only REDOGIT research surface. Later passes correct or narrow earlier interpretations without deleting predecessor evidence.

## v1 — sampled ecology
The initial relational audit joined 60 generated Partial-Hard candidates, exact DAG-sharing witnesses, a minimum hard certificate, and the HSP promise audit. The sampled ecology contained no hard+translation-symmetry candidate. This was a dataset result only.

## v2 — exhaustive symmetry layers
The four-input NAND/free-constant size<=6 class was independently reconstructed at 3,310 functions. Exhaustive translation-symmetric partial-table scans showed:
- hard+symmetry first at 6 observations;
- non-affine hard+symmetry first at 8 observations, still affine-rank 3;
- full-rank non-affine hard+symmetry first at 10 observations.

A selected ten-point target has exact formula minimum 13 and exact DAG minimum 8, so DAG reuse is consequential.

## v3 — structural correction
The v2 idea of asking a staged quotient construction to beat the exact direct optimum in output gates was rejected. Any exact staged construction is itself a direct circuit, so `C*(P) <= C_stage(P)` by definition.

The corrected question is whether a carrier lowers construction, discovery, planning, search, or verification cost while preserving exactness. On the selected target, the quotient exact-SAT encoding uses substantially fewer Boolean symbols and expression leaves than the direct encoding.

The partial-translation stabilizer lemma and the XOR-autocorrelation/Walsh identity connect same-label pair aggregates to symmetry discovery for explicit partial tables.

## v4 — construction and carrier-selection cost
Generic greedy and translation-paired greedy were compared against the same exact 3,310-function oracle. A fixed useful translation lowers candidate-scoring, survivor-scan, and literal-read work, but selecting among translations can erase the gain.

Input-permutation symmetry provides a structural quotient: for relabeling-invariant paired objectives, nonzero translations collapse from `2^n-1` choices to `n` Hamming-weight orbit representatives. At `n=4`, this reduces full translation-route candidate scoring from 712 to 196, but the resulting selection work is still larger than generic greedy in the raw-scan representation.

## v5 — matched representation and structural carrier selection
Both generic and translation-paired construction now use the same 3,310-row bitset index and dynamic `S_4` input-permutation orbit compression.

For a translation of Hamming weight `w`, its stabilizer partitions unordered pair-actions into

`R_n(w)=(floor(w/2)+1)(n-w+1)`

orbits. For every `n>=3`, this is uniquely minimized at `w=n`, so the all-ones translation is selected from group structure without scanning the circuit class.

At `n=4`, symmetry-aware generic greedy costs 56 candidate scores / 2,912 charged 64-bit word operations and retains five observations. The structurally selected `t=15` route costs 20 scores / 2,080 word operations and retains eight observations. Planning work falls 64.3% by score count and 28.6% by the declared word-operation metric, while certificate size grows by three observations.

The lifecycle tradeoff is explicit:

`generic = 2912 + 5 lambda`

`selected = 2080 + 8 lambda`

so the selected route wins under this accounting exactly when `lambda < 277.333...` word-operation equivalents per retained observation. `lambda` is a parameter, not an empirical calibration.

A counterprobe matters: choosing the translation with the best immediate survivor shrink selects `t=7`, while the cheapest complete paired plan under the matched cost model is `t=15`.

## Current frontier

Keep separate:

`carrier use != carrier discovery != carrier selection`

and

`best immediate semantic shrink != cheapest complete execution plan`.

The next positive target is to test whether the structural all-ones selector continues to produce hard, low-total-cost partial tables as variable count and circuit budget grow, while charging certificate length, representation, construction, verification, and DAG reuse.

**P vs NP remains OPEN.**
