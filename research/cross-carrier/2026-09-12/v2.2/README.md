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

The symmetry quotient reduces ten observations to five, but the explicit staged route does not pay for itself: quotient target minimum 7 + quotient-coordinate transform minimum 8 = 15 staged gates versus the direct 8-gate DAG. This is `COST_MIGRATION`, not a shortcut. The 15-gate number is only for the declared separated stages; it is not a general lower bound against circuits that share work across the boundary.

Current stronger search cell:

`hard AND symmetry AND DAG-sharing AND quotient-benefit-after-transform-cost`

The selected full-rank witness fails the final condition. P versus NP remains OPEN.
