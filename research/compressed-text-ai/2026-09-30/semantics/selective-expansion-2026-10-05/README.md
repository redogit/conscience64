# Bounded uncertainty-triggered selective expansion — 2026-10-05

Status: `BOUNDED_NONLINEAR_RESIDUAL_PROBE_COMPLETE`

This is the single selective-expansion probe requested after the live-node-reclamation systems ridge. It does **not** open a new width, window-size, or seed sweep.

## Question

Can the exact representation-invariant 128-D byte 1/2/3-gram carrier decide when to spend a bounded amount of logical-text expansion on a nonlinear local reader, while keeping the expansion decision independent of ZIP/DEFLATE layout?

## Fixed protocol

- Carrier: retained exact associative signed-hashed byte 1/2/3-gram summary.
- Closed head: `128 -> tanh(32) -> 1`, **4,161 trainable floats / 16,644 bytes**.
- Trigger: `u = 1 - abs(2*p_closed - 1)`; thresholds are derived only from a calibration split.
- Expanded region: one fixed **64-logical-byte prefix window**, `[0, min(64, logical_length))`.
- Nonlinear reader: `Embedding(256,8) -> Conv1d(8,24,k=3) -> ReLU -> Conv1d(24,26,k=3) -> ReLU -> masked global max -> Linear(26,1)`, **4,573 floats / 18,292 bytes**.
- Combination after a gate fires: logistic residual fusion over `[closed_carrier_logit, local_cnn_logit]`.
- Data seed: `20260930`; model seed: `20261005`.
- No test-set threshold selection. No compression-layout feature enters the trigger.

The local CNN intentionally reuses the parameter-count/architecture shape of the separately retained CNN reconstruction, but it is newly trained here on only the bounded window. It is **not** the missing historical CNN.

## Task-identity boundary

The retained Experiment-4 Python generator, exact text encoding, and exact split identity were not recovered. This probe therefore rebuilds the two documented TextBlob resource families deterministically and count-matches the retained task sizes without using labels for sentiment selection.

```text
TASK_RECONSTRUCTION != HISTORICAL_SPLIT_IDENTITY
RECONSTRUCTION != ORIGINAL_IDENTITY
PRESERVED_RESULT != REPRODUCIBLE_EXPERIMENT
```

This means the curves below are internally comparable within this probe. The retained affine and CNN numbers are reference bands, not same-split numerical head-to-heads.

## Result

### Sentiment

Closed-carrier baseline: **61.65%** balanced accuracy.

| expanded logical bytes | balanced accuracy | expanded samples |
|---:|---:|---:|
| 0.00% | 61.65% | 0 / 264 |
| 9.42% | 63.20% | 35 / 264 |
| 13.67% | 65.15% | 52 / 264 |
| **25.59%** | **66.17%** | **102 / 264** |
| 51.82% | 65.04% | 213 / 264 |
| 64.35% | 65.04% | 264 / 264 |

The predeclared curve therefore contains an observed **+4.52 percentage-point** internal gain at 25.59% expanded logical bytes. Expanding every document's local window was not best, so the uncertainty gate is doing useful selection rather than merely reproducing an always-expanded reader.

### POS morphology

Closed-carrier baseline: **76.80%** balanced accuracy.

| expanded logical bytes | balanced accuracy | expanded samples |
|---:|---:|---:|
| 0.00% | 76.80% | 0 / 1,250 |
| 6.04% | 77.52% | 77 / 1,250 |
| 10.18% | 78.64% | 127 / 1,250 |
| 25.29% | 81.36% | 322 / 1,250 |
| **50.49%** | **82.24%** | **639 / 1,250** |
| 100.00% | 82.00% | 1,250 / 1,250 |

The predeclared curve contains an observed **+5.44 percentage-point** internal gain at 50.49% expanded logical bytes. Again, always expanding was slightly worse than selective expansion.

## Recompression / carrier gate

For each task, 16 held-out logical documents were each encoded eight ways: stored, DEFLATE levels 1/6/9, filtered, Huffman-only, fixed, and forced full-flush chunks.

Per task:

- recompression cases: **128**;
- max exact embedding drift: **0.0**;
- max whole-grammar vs bounded-stream embedding drift: **0.0**;
- uncertainty-trigger mismatches: **0**;
- selected logical-window mismatches: **0**.

The inherited C selftest also passed **8/8** with zero embedding and split-embedding error.

Therefore, in the tested family:

```text
COMPRESSION_LAYOUT != EXPANSION_TRIGGER
EQUIVALENT_RECOMPRESSION -> SAME_LOGICAL_EXPANSION
EXACT_CARRIER_INVARIANTS = RETAINED
```

## Comparison to retained semantic ridge

The same-day retained affine rerun remains a shallow plateau:

- sentiment affine family: **57.86%–59.76%** across the reported widths;
- POS affine family: **75.44%–78.08%**.

The separately labeled 18,292-byte CNN reconstruction remains:

- sentiment: **63.32%–69.46%** across three seeds;
- POS: **82.40%–83.36%**.

The selective residual reaches **66.17% sentiment** and **82.24% POS** on its deterministic task reconstruction while expanding only part of the logical bytes. Those values land in/near the nonlinear reconstruction band and above the retained affine reference band, but the missing historical generator prevents promoting the cross-record numerical difference as a same-split win.

## Interpretation

The strongest bounded conclusion is narrower and useful:

```text
CLOSED_CARRIER_UNCERTAINTY CAN ALLOCATE LOCAL NONLINEAR WORK
SELECTIVE_LOCAL_EXPANSION CAN BE BETTER THAN ALWAYS_EXPAND
RECOMPRESSION_EQUIVALENCE CAN PRESERVE THE GATE AND LOGICAL WINDOW
```

This closes the requested nonlinear-residual probe. It does **not** recover the historical CNN, prove a universal semantic advantage, or justify another parameter/window sweep from this result alone.

The exact executed artifacts are retained losslessly as gzip members: `results.json.gz` contains the full curve, identities, fusion coefficients, resource hashes, and counterprobe details; `run_probe.py.gz` contains the exact executed protocol. Decompress them before replay.
