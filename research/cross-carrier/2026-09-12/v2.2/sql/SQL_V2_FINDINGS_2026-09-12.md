# SQL Mutilation v2

**Bounded finite result. P vs NP remains OPEN.**

| observations | symmetric partials | hard | affine-consistent hard | non-affine hard | non-affine rank 3 | non-affine rank 4 |
|---:|---:|---:|---:|---:|---:|---:|
| 4 | 1,120 | 0 | 0 | 0 | 0 | 0 |
| 6 | 6,720 | 204 | 204 | 0 | 0 | 0 |
| 8 | 15,600 | 2,272 | 1,908 | 364 | 364 | 0 |
| 10 | 26,880 | 8,332 | 2,930 | 5,402 | 0 | 5,402 |

Finite thresholds:
- hard + translation symmetry: 6 observations;
- non-affine hard + symmetry: 8 observations;
- full-rank non-affine hard + symmetry: 10 observations.

Selected 10-point target:
`coords={0,1,6,7,8,10,11,12,13,15}`
`bits={0,1,1,0,1,0,0,0,0,1}`
`t=7`

Exact finite results:
- NAND size<=6 exclusion: PASS;
- affine extension: none;
- affine rank: 4;
- exact NAND formula minimum: 13;
- exact NAND DAG minimum: 8 (7 UNSAT, 8 SAT);
- formula->DAG reuse gain: 5 gates.

The symmetry quotient H={0,7} collapses 10 observations to 5.
With quotient coordinates supplied for free, the quotient target needs 7 NAND gates.
Computing the two nontrivial quotient coordinates jointly needs 8 NAND gates.
Therefore the declared staged transform-then-quotient route needs 15 gates versus the direct 8-gate DAG: COST_MIGRATION.

The 15-gate number is only for that staged separation. It is not a lower bound on circuits allowed to share gates across the transform/target boundary.

Updated target:
`hard AND symmetry AND DAG-sharing AND quotient-benefit-after-transform-cost`.

That stronger cell remains empty for this selected full-rank witness.
