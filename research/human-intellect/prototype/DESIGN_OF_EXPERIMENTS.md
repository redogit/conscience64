# Design of Experiments — v0.1 Screening

Claim ceiling: `SYNTHETIC_SCREENING_ONLY`.

The purpose is to identify implementation choices worth building/testing with real people or real workloads. Synthetic scores do not validate human preferences or architecture safety.

## Five two-level factors

| Factor | -1 | +1 |
|---|---|---|
| Retrieval | relation-only | hybrid semantic + relation |
| Anchor policy | every divergence | consequential-only |
| Explorer report | full | delta-only |
| Repair | best-local rewrite | one-degree |
| Novelty | eager classification | temporary identity |

A 16-run half-fraction is used with generator `E = A*B*C*D`.

## Responses

- reconstruction fidelity — maximize
- lineage loss — minimize
- active working-set size — minimize subject to fidelity
- false-promotion rate — minimize
- contradiction retention — maximize
- correction burden — minimize
- operation count — minimize subject to the above

## Sequential promotion rule

1. Run the synthetic screen.
2. Select only factors/interactions with consequential response deltas.
3. Build paired deterministic fixtures for those factors.
4. Counterprobe the apparent winner with adversarial cases.
5. Only then run human usability studies where human preference/understanding is the actual outcome.
6. A human-facing default requires human evidence; synthetic DOE cannot authorize it.
