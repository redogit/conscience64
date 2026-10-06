# Compressed-Text AI — Five-Experiment Descent

**Date:** 2026-09-30  
**Status:** `BOUNDED_SUCCESS_WITH_OPEN_PLATEAUS`  
**Target:** learned computation over ZIP/DEFLATE text without materializing the complete plaintext.  
**Envelope:** 1.44 MiB shipped storage, 8 GiB runtime RAM, modern CPU/GPU.

## Governing invariant

For a task summary `E`:

```text
E(xy) = E(x) ⊗ E(y)
```

If distinct legal compressed representations of the same logical text may induce different parse trees, the carrier must not change with parenthesization. Therefore `⊗` must be associative on reachable states for strict representation invariance.

## Experiment 1 — recompression invariance

361 distinct legal ZIP encodings of the same 30,713-byte logical text were tested across stored entries, DEFLATE levels, strategies, and forced block boundaries.

- passed: **361/361**
- max exact embedding drift: **0.0**
- max classifier probability drift: **0.0**
- ZIP bytes: **890 … 48,894**
- grammar nodes: **1,632 … 33,802**

**Success:** logical-text carrier survived large representation changes.  
**Divot:** equivalent logical text can induce >20× grammar-node variation.

## Experiment 2 — 32 KiB symbolic frontier

A bounded DEFLATE history carrier replaced the complete-file grammar. Anything outside DEFLATE's reachable 32 KiB history was folded into the global exact carrier and reclaimed.

For a 924,000-byte stored entry:

- whole-grammar peak RSS: **492,672 KiB**
- bounded-frontier peak RSS: **38,820 KiB**
- whole runtime: **0.22 s**
- bounded runtime: **2.51 s**
- embedding drift: **0.0**

For a 924,000-byte DEFLATE entry:

- whole peak RSS: **25,984 KiB**
- bounded peak RSS: **4,456 KiB**
- whole runtime: **0.01 s**
- bounded runtime: **0.05 s**
- embedding drift: **0.0**

**Success:** strong bounded-memory descent.  
**Failure/ridge:** naïve suffix-copy compaction trades memory for extra reconstruction work.

## Experiment 3 — associative learned operator

A 16-state diagonal affine model reached **57.03%** held-out accuracy on a long-range order task; the exact local n-gram network reached **48.44%**.

Replacing diagonal dynamics with an 8-state full affine operator reached:

- train: **100%**
- held-out: **100%**
- serialized model: **73,808 bytes**

Across 181 recompressions:

- unique prediction: **1**
- max score drift: **1.023e-12**
- max probability drift: **0.0**

**Success:** learned long-range state can remain composition-closed.  
**Divot:** real-number associativity becomes approximate on finite floating point; synthetic logits saturated heavily.

## Experiment 4 — real-corpus generalization

Identity-disjoint train/test splits were used on two real linguistic resources already present in the runtime environment.

### Sentiment sense task — test balanced accuracy

| model | bytes | balanced accuracy |
|---|---:|---:|
| exact n-gram + MLP | 16,644 | **62.80%** |
| decompressed byte-CNN | 18,292 | **69.54%** |
| tree composer h=12 | 14,164 | 54.68% |
| tree composer h=24 | 31,780 | 54.77% |
| associative AAA k=4 | 20,516 | 56.68% |
| associative AAA k=8 | 73,796 | **57.71%** |
| associative AAA k=12 | 159,844 | 57.53% |
| associative AAA k=16 | 278,660 | 57.09% |

### POS morphology task — test balanced accuracy

| model | bytes | balanced accuracy |
|---|---:|---:|
| exact n-gram + MLP | 16,644 | 78.72% |
| decompressed byte-CNN | 18,292 | **82.48%** |
| tree composer h=12 | 14,164 | 79.28% |
| tree composer h=24 | 31,780 | 81.92% |
| associative AAA k=4 | 20,516 | 72.32% |
| associative AAA k=8 | 73,796 | 76.48% |
| associative AAA k=12 | 159,844 | 77.12% |

Compressed C verification of AAA8 on 160 held-out real examples produced:

- Python-vs-C prediction mismatches: **0**
- stored-vs-DEFLATE prediction mismatches: **0**
- worst probability difference: **2.08e-7**

**Plateau (original sweep):** affine width alone did not recover the nonlinear semantic advantage of the byte-CNN. The original single-seed sweep happened to peak near k=8; a later same-day rerun showed that this width ordering is not stable and must not be promoted as a robust optimum.

## Experiment 5 — deployment and lineage

Strict optimized dynamic and static builds both pass the inherited 8/8 selftest.

- stripped dynamic runtime: **109,008 bytes**
- stripped static runtime: **831,952 bytes**
- AAA8 model: **73,808 bytes**
- static runtime + model: **905,760 bytes**
- target: **1,509,949 bytes**
- remaining: **604,189 bytes**

## Plateau map

```text
exact local carrier
    -> invariant but local-context ceiling
whole-file grammar
    -> exact but memory-shape ridge
32 KiB frontier
    -> memory valley, compaction time ridge
diagonal affine
    -> insufficient interaction plateau
full affine
    -> long-range synthetic divot
wider affine
    -> real semantic plateau
nonlinear byte CNN
    -> better generalization, loses compressed-domain closure as currently formulated
```

## Next descent

The evidence points toward a two-axis carrier:

```text
exact / representation-invariant algebra
+
bounded nonlinear semantic residual
```

Candidate next probes:

1. live-node reclamation instead of repeated frontier copying;
2. direct sums / mixtures of small affine automata with block-diagonal associative composition;
3. low-rank/tensor associative operator families;
4. distillation from the stronger byte-CNN into the closed operator family;
5. uncertainty-triggered selective expansion, measuring expanded-byte fraction against accuracy.

Do not promote a gain that disappears under recompression counterprobes.


## Same-day rerun / correction

The five experiments were re-executed from the preserved artifacts rather than accepted from the prior JSON reports.

### Reproduced exactly or structurally

- Experiment 1: **361/361** recompressions passed again; max embedding drift **0.0**, max prediction-probability drift **0.0**.
- Experiment 2: exact carrier drift remained **0.0**. Stored-entry RSS reproduced at **492,672 KiB whole** versus **38,824 KiB frontier**; DEFLATE reproduced at **25,984 KiB whole** versus **4,456 KiB frontier**.
- Experiment 3: diagonal affine **57.03%**, n-gram **48.44%**, full 8-state affine **100%** held-out again. Across 181 recompressions, max score drift again measured **1.023e-12** with one unique prediction and zero probability drift.
- Experiment 5: rebuilt dynamic and static binaries are bit-for-bit identical to the earlier tested binaries. Static runtime + AAA8 remains **905,760 bytes**.

### Experiment 4 correction

A fresh deterministic rerun of the preserved architectures produced these balanced accuracies:

| model | sentiment rerun | POS rerun |
|---|---:|---:|
| exact n-gram + MLP | 60.51% | 79.20% |
| tree composer h=12 | 54.11% | 79.84% |
| tree composer h=24 | 54.69% | 81.44% |
| associative AAA k=4 | 58.96% | 75.44% |
| associative AAA k=8 | 57.86% | 77.92% |
| associative AAA k=12 | 58.33% | 78.08% |
| associative AAA k=16 | 59.76% | — |

Therefore:

```text
AAA8_IS_BEST != ESTABLISHED
AFFINE_FAMILY_REAL_DATA_PLATEAU = RETAINED
SINGLE_SEED_WIDTH_ORDERING = UNSTABLE
```

The robust observation is a broad, shallow affine plateau on the real semantic task, not a stable optimum at k=8.

### CNN provenance failure and independent reconstruction

The original **18,292-byte** byte-CNN result JSON survived, but its exact source/training code was not preserved in the experiment package. Its exact numerical result is therefore **not independently rerunnable from the retained package**.

A separately labeled reconstruction with exactly the same 4,573-float / 18,292-byte parameter budget:

```text
Embedding(256,8)
 -> Conv1d(8,24,k=3)
 -> ReLU
 -> Conv1d(24,26,k=3)
 -> ReLU
 -> masked global max
 -> Linear(26,1)
```

was trained from three fresh seeds. Balanced-accuracy ranges were:

- sentiment: **63.32% – 69.46%**
- POS morphology: **82.40% – 83.36%**

This reconstruction does **not** recover the missing original CNN identity, but it independently preserves the direction of the earlier finding: a tiny nonlinear byte model still exceeds the current affine associative family on these real tasks.

### New invariant admitted from rerun

```text
SINGLE_RUN_PEAK != WIDTH_OPTIMUM
MODEL_FAMILY_PLATEAU != MEMBER_RANKING
PRESERVED_RESULT != REPRODUCIBLE_EXPERIMENT
```

Future affine-width comparisons require multi-seed distributions before selecting a width.


## Original CNN identity audit — 2026-10-01

See [the provenance ledger](provenance/CNN_PROVENANCE_LEDGER_2026-10-01.json) for exact report/archive/member hashes, chronology, searched scopes and unresolved fields.

The original result JSON is **reported to have survived**, but its bytes and filename were not located in the fetched history or the two currently retained September 30 ZIPs. Its hash remains unknown. The original CNN source, command, seeds, exact dataset split identities and serialized weights were also not recovered. This does not establish that they never existed elsewhere.

The [reconstruction result JSON](provenance/experiment4_cnn_reconstruction_rerun.json) is now retained verbatim as a separate identity. Its reported seeds are `20261331`, `20261332`, `20261333`. The reconstruction's executable training source, split manifests and weights are also absent from these packages; preserving its results does not by itself make it rerunnable. This audit checked bytes and metric arithmetic, and did not train either CNN.

```text
PRESERVED_RESULT != REPRODUCIBLE_EXPERIMENT
RECONSTRUCTION != ORIGINAL_IDENTITY
AAA8_IS_BEST != ESTABLISHED
```

The family-level affine plateau and bounded nonlinear-gap direction remain source-reported findings with the existing compressed-text-AI claim ceilings. No original-model identity is admitted.


## Bounded live-node reclamation probe — 2026-10-03

The [systems probe](systems/live-node-reclamation-2026-10-03/README.md) preserves the recovered copy implementation and both historical Experiment 2 reports, and adds one mark/sweep slot-reuse variant. On newly retained, matched 924,000-byte stored/DEFLATE workloads, seven-process median wall times improve from **3.5511 to 0.4462 seconds** and **0.05882 to 0.01200 seconds**, respectively. Peak RSS improves from **78,084 to 42,240 KiB** and **6,332 to 3,072 KiB**. Collection reconstruction and reclamation costs are charged separately in the retained results. Exact raw-carrier checks, 361 distinct recompression fixtures, four larger collection counterprobes and both inherited 8/8 selftests pass with zero embedding/classifier drift in the tested cases.

**Identity limit:** original historical benchmark ZIPs and recompression generator/fixture identities were not recovered. These fresh measurements are not an exact historical workload rerun; the original measurements above remain intact. This is a bounded systems gain only. No semantic-model or affine-family change is included.


## Bounded uncertainty-triggered selective expansion probe — 2026-10-05

The [single bounded semantic residual probe](semantics/selective-expansion-2026-10-05/README.md) uses only uncertainty from the closed exact 128-D associative carrier to decide whether to expose one 64-logical-byte local window to an 18,292-byte nonlinear reader.

- deterministic task reconstruction, sentiment: **61.65% → 66.17% balanced accuracy at 25.59% expanded logical bytes**;
- deterministic task reconstruction, POS: **76.80% → 82.24% at 50.49% expanded logical bytes**;
- recompression counterprobe: **128 cases per task**, with **0 trigger mismatches**, **0 logical-window mismatches**, and **0 exact whole-vs-stream carrier drift**.

**Claim ceiling:** the historical Experiment-4 generator/split identity remains unrecovered. These curves are internally comparable within the new reconstruction; retained affine and CNN results are reference bands rather than same-split head-to-head measurements. `RECONSTRUCTION != ORIGINAL_IDENTITY` remains in force. The requested nonlinear-residual probe stops here without a width/window/seed sweep.
