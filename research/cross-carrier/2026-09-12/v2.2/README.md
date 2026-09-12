# Cross-Carrier Complete Float64 Coordinate Space — v2

## Scope
This bundle encodes the **surfaced and mapped research universe available in this pass**:
- 44 prior Cross-Carrier/ECS claims and 66 evidence records;
- current P-vs-NP / MCSP / Partial-Hard / gate-elimination / Shor-HSP artifacts in `/pnp_push`;
- category/branch map;
- UTF-8 symbol registry;
- surfaced exact mathematical derivations and search steps;
- source-artifact references even where the primary source was not locally materialized.

It does **not** claim that every file in the user's entire Library has been retrieved.

## Five codecs/spaces

### 1. Entity64
Every claim, evidence item, artifact, category, branch, symbol, theorem, experiment, and project is a 64-dimensional Float64 row.

### 2. Relation64
Every typed edge is a 64-dimensional Float64 row. Relations preserve support/counter/bound/corroboration, source lineage, branch membership, derivation, and search transitions.

### 3. Math64
Every extracted mathematical expression/derivation line is indexed by source artifact and source line.

### 4. Search64
The forward-only P-vs-NP observation → action → result → necessity path is represented directly.

### 5. ExactUTF8-F64
Authoritative UTF-8 source text is packed losslessly:
`6 bytes -> unsigned 48-bit integer -> exact IEEE-754 Float64`.

Because every integer below `2^53` is exactly representable by binary64, each 48-bit payload element round-trips exactly.

## Governing separation

`Float64 coordinate != semantic meaning`

`fingerprint != embedding`

`claim count != proof weight`

`multiple carriers != independent corroboration`

`compact coordinate != authoritative source`

The source is recoverable from ExactUTF8-F64 where materialized. Reference-only source nodes preserve provenance when the primary bytes were not surfaced in this pass.

## Core mathematics retained

The indexed space includes the mathematical path used in the current P-vs-NP search, including:
- observational equivalence and obligation-relative sufficiency;
- explicit quotient-state growth `2^Omega(n^2) = N^Omega(log N)`;
- ZDD implicit-family counterprobe;
- antimatroid accessibility + union closure;
- exact/approximate minority shrink;
- rejection-sampling cost migration;
- formula-vs-DAG distinction;
- DeMorgan parity gate-elimination calibration;
- parity restriction self-similarity;
- restriction-carrier induction;
- finite MCSP / Partial-Hard / Range-Avoidance certificates;
- role-sensitive MUX restrictions;
- Shor/HSP cyclic and `F_2^n` quotient projections.

## Current P-vs-NP boundary
`P ?= NP` remains `OPEN`.
No coordinate, finite experiment, SQL query, symmetry, or codec entry upgrades that status.

## v2.1 quantum/Shor-HSP correction

The coordinate space explicitly distinguishes:

`translation symmetry != ordinary HSP promise`

For a nonconstant Boolean membership oracle, ordinary HSP occurs only when the marked set is one coset of an index-2 stabilizer. Generic SAT indicators merge many quotient cosets into only two Boolean labels, so the relevant object is a broader partition/hidden-symmetry problem.

Added exact/finite carriers:
- free-variable-controlled XOR stabilizer audit;
- standard-HSP promise-defect audit;
- Fourier spectrum vs 3-SAT search-cost counterprobe;
- Boolean HSP boundary theorem;
- Fourier annihilator/support theorem;
- exact known-stabilizer quotient theorem.

## v2.2 whole-research routing
All 46 surfaced branches receive an explicit P-vs-NP disposition. Dormant or human/normative branches are not converted into mathematical evidence. New whole-ecology Partial-Hard and Pareto-ablation artifacts are encoded as exact Float64 UTF-8 payloads.

## SQL frontier audit v1
`sql/frontier_mutilation_2026-09-12.sql` relationalizes the sampled Partial-Hard ecology, exact DAG-sharing witnesses, minimum hard certificate, and HSP promise audit. The sampled 60-candidate ecology had no hard+symmetry intersection. That was a bounded sample result, not a universe claim.

## SQL frontier audit v2 — exhaustive symmetry layers
The follow-on exact finite scan reconstructs the complete four-input NAND/free-constant size<=6 class at **3,310 functions** before testing translation-symmetric partial functions.

Exact layer results:
- 4 observations: 1,120 symmetric partials; 0 hard;
- 6 observations: 6,720 symmetric partials; 204 hard, all affine-consistent;
- 8 observations: 15,600 symmetric partials; 2,272 hard; 364 non-affine, all affine-rank 3;
- 10 observations: 26,880 symmetric partials; 8,332 hard; 5,402 non-affine, all affine-rank 4.

Selected first-layer full-rank target:
`coords={0,1,6,7,8,10,11,12,13,15}`
`bits={0,1,1,0,1,0,0,0,0,1}`
with translation `t=7`.

Exact finite checks:
- no NAND circuit of size <=6 extends it;
- no affine extension exists;
- exact NAND formula minimum = 13;
- exact partial NAND DAG minimum = 8 (7 gates UNSAT, 8 gates SAT);
- formula-to-DAG reuse gain = 5 gates.

The symmetry quotient reduces ten observations to five. The separated transform-plus-quotient construction costs 15 gates versus the direct exact 8-gate DAG. This is useful as a cost-migration counterprobe, but not as a lower bound against circuits sharing work across the stage boundary.

## SQL frontier audit v3 — structural correction
The v2 gate-count success criterion is superseded. Any exact staged transform/quotient construction is itself a legal direct NAND circuit, so it cannot have fewer gates than the exact direct optimum by definition. The useful question is whether a discovered quotient lowers **construction, discovery, planning, search, or verification cost** while preserving the exact target and DAG reuse.

For the selected ten-point target, the quotient exact-SAT formulation is smaller than the direct formulation:
- minimality UNSAT: 196 -> 120 Boolean symbols and 4,523 -> 2,213 expression leaves;
- witness SAT: 232 -> 147 Boolean symbols and 5,743 -> 2,933 expression leaves.

Single-run Wolfram timings also favored the quotient formulation, but those timings are environment-specific and are not asymptotic evidence.

A new explicit-table stabilizer lemma shows that all nonzero translation stabilizers can be recovered from same-label pairwise XOR differences in `O(m^2)` pair operations for an explicitly listed `m`-point partial table. A 10,000-table deterministic countercheck matched brute force with zero disagreements. The same aggregate is exactly the XOR autocorrelation and has a squared-Walsh-spectrum representation.

## SQL frontier audit v4 — construction cost
A fixed translation can reduce greedy planning work, but exhaustive carrier selection can cost more than generic greedy. Input-permutation symmetry contracts nonzero translations from `2^n-1` candidates to `n` Hamming-weight orbit representatives, separating:

`carrier use != carrier discovery != carrier selection`.

The v4 exact repository evidence is verified by the REDOGIT local workflow.

## SQL frontier audit v5 — matched planning representation
v5 gives generic and paired planners the same 3,310-row bitset index and dynamic `S_4` orbit compression.

For a translation of Hamming weight `w`, the number of unordered pair-action orbits before observations is

`R_n(w)=(floor(w/2)+1)(n-w+1)`.

For every `n>=3`, this is uniquely minimized by the all-ones translation. At `n=4`, the selector therefore chooses `t=15` without scanning the 3,310-function class.

Measured exactly in the finite indexed planner:
- symmetry-aware generic: 56 candidate scores, 2,912 charged 64-bit word operations, 5 observations;
- paired `t=15`: 20 candidate scores, 2,080 word operations, 8 observations.

The selected route reduces score count by 64.3% and declared planning word operations by 28.6%, while retaining three more observations. Under the parametric lifecycle cost `planning + lambda * observations`, it wins exactly when `lambda < 277.333...`; `lambda` is not empirically calibrated.

A counterprobe rejects the wrong predictor: the best immediate survivor shrink chooses `t=7`, while the cheapest complete fixed paired route under the matched execution metric is `t=15`.

Current distinction:

`best immediate semantic shrink != cheapest complete execution plan`.

The active obligation is to test whether this structural selector continues to yield hard, low-total-cost partial tables as variable count and circuit budget grow, while charging construction, representation, certificate length, verification, and DAG reuse.

This does not change the open status of P versus NP.
