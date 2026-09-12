# SQL Mutilation — Frontier Audit

Date: 2026-09-12

## Input boundary
This database normalizes four exact finite artifacts:
- WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json
- FORMULA_VS_DAG_SHARING_WITNESSES_S10.json
- PARTIAL_PARITY_MINIMUM_HARD_CERTIFICATE_SIZE8.json
- SHOR_HSP_PROMISE_DEFECT_AUDIT.json

No universal P-vs-NP conclusion is admitted from these finite artifacts.

## SQL-forced distinctions

1. Candidate population: 60.
2. Certified size-6 avoiders: 8.
3. Candidates with nontrivial partial translation stabilizer: 4.
4. Certified avoider AND nontrivial stabilizer: 0.
5. Exact-DAG-verified ecology candidates: 10.
6. Exact ecology candidates with formula > DAG gap: 0.
7. Geometry-family certified candidates with a formula > DAG gap: 0.
8. The two independent DAG-sharing witnesses have gaps [4, 1] and both anti-join against the 60-candidate ecology: ['NOT_IN_60_CANDIDATE_ECOLOGY', 'NOT_IN_60_CANDIDATE_ECOLOGY'].

## Consequence
The current finite evidence does not yet contain one candidate carrying all of:
- certified range avoidance on the declared size-6 surface,
- nontrivial translation symmetry,
- observed formula-to-DAG sharing gain,
- geometry-family/nonlocal candidate lineage.

The absence is a bounded dataset fact, not an asymptotic lower bound.

## HSP audit
- 2SAT: 0/30 standard-HSP rows; fraction 0.0; nontrivial stabilizer rows 16.
- 3SAT: 0/60 standard-HSP rows; fraction 0.0; nontrivial stabilizer rows 8.
- XOR: 6/36 standard-HSP rows; fraction 0.166667; nontrivial stabilizer rows 30.

## Next SQL-shaped experiment
Grow the candidate table rather than inventing a new conclusion. For each newly generated Partial-Hard candidate, record:
`construction_cost, verification_cost, dag_min, formula_min, stabilizer_size, generator_family, restriction_depth, refuter_count, aggregate_pair_cost`.

Then require a queryable witness for the missing intersection instead of scoring by prose:
```sql
SELECT *
FROM candidate_features
WHERE certified_hard = 1
  AND formula_dag_gap > 0
  AND nontrivial_stabilizer = 1
  AND construction_cost <= polynomial_budget;
```

If this remains empty under a growing, independently verified family, that is negative evidence about this hybrid route. It is still not a general circuit lower bound.
