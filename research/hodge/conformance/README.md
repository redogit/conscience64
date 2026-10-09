# Hodge Lab conformance harness v0.2

This directory implements the frozen `E001`–`E010` conformance suite under the v0.1 command/event kernel.

The harness is intentionally stricter about authority than functionality. Passing it means the tested research substrate preserved the declared boundaries; it does **not** prove a Hodge statement.

## Experiments

- `E001` event replay and rollback
- `E002` authority-leak rejection, with unsafe-promotion mutant
- `E003` exact 2×2 integer Smith-invariant differential: fresh Mathematica output vs an actual WebAssembly exact kernel vs an independent reference formula
- `E004` preserved BRL similarity/identity saturation counterexample
- `E005` real Fermat quartic K3 calibration: construct the standard 48 lines, build their exact intersection matrix, and recover rational rank 20
- `E006` visualization authority isolation
- `E007` correspondence obligation generation
- `E008` crash/recovery integrity
- `E009` parallel branch isolation and explicit conflict handling
- `E010` bounded natural-language to canonical-command equivalence and ambiguity refusal

Every favorable test includes a small mutation or adversarial counterprobe so the suite checks that it can reject bad behavior rather than only exercise happy paths.

## Run

`python research/hodge/conformance/hodge_conformance.py`

The run writes `CONFORMANCE_RESULT.json` with hashes, timings, observations, counterprobes and per-experiment claim ceilings.

## Hard boundaries

```text
SOFTWARE_PASS != MATHEMATICAL_PROOF
METHOD_TRANSFER != EVIDENCE_TRANSFER
SIMILARITY != SOURCE_IDENTITY
VISUALIZATION != EVIDENCE_PROMOTION
FLOATING_POINT != EXACT
TIMEOUT != NEGATIVE_RESULT
```

## E005 scope

The Fermat fixture is the Fermat quartic K3 surface, using its three coordinate pairings and four fourth-roots of `-1` per equation to construct 48 standard lines. Their exact intersection matrix has rational rank 20. This reproduces the repository's existing finite calibration boundary; it does not generalize to arbitrary quartic K3 surfaces or higher-codimension Hodge problems.
