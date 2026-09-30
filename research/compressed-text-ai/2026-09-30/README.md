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

**Plateau:** affine width alone does not recover the nonlinear semantic advantage of the byte-CNN. The sentiment sweep peaks near k=8 and then slips.

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
