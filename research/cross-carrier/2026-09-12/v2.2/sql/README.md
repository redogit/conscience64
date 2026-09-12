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

Input-permutation symmetry provides a structural quotient: for relabeling-invariant paired objectives, nonzero translations collapse from `2^n-1` choices to `n` Hamming-weight orbit representatives. At `n=4`, this reduces full translation-route candidate scoring from 712 to 196, but the resulting selection work is still larger than generic greedy in the measured finite case.

## Current frontier

Keep separate:

`carrier use cost != carrier discovery cost != carrier selection cost`.

The next positive target is a cheap predictor or aggregate that chooses a useful translation-orbit class without evaluating every route, or a hard-partial construction in which the useful carrier emerges without separate selection.

**P vs NP remains OPEN.**
