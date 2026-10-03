# Experiment 2: live-node reclamation probe — 2026-10-03

Status: **BOUNDED_SYSTEMS_GAIN; HISTORICAL_INPUT_REPLAY_UNAVAILABLE**.
Parent obligation: preserve the exact compressed-text carrier while removing the repeated-copy time ridge. This probe changes frontier storage only; no training, semantic-model, affine-family or learned-operator changes.

## Variant and retained baseline

`baseline/compressed_text_ai.c` is the verbatim 124,988-byte source from the retained five-experiment package. SHA-256: `e10b069d908feef134978a8a17b2bc73da67034d9d43f5b9bdb7e35b0e0e96d4`, matching the parent CNN provenance ledger's archive-member receipt. Both historical Experiment 2 JSON reports are preserved verbatim under `baseline/`.

`reclamation.c` keeps the existing 32,768-byte history and 4,096-byte slack. At the same collection boundary it slices the surviving suffix, marks reachable nodes, and puts unreachable slots on a free list. Live nodes keep their IDs, children and already-computed summaries. Subsequent construction reuses free slots. No live suffix is copied into another grammar and no complete plaintext buffer is added.

Collection happens only after a complete piece has been summarized and appended. The new suffix root is established before old forest roots retire; temporary match-construction roots never span collection. Global carrier composition, DEFLATE parsing, literal/match ordering, overlapping matches and summary arithmetic stay unchanged. ID reuse removes the old topological-ID ordering property, so the variant removes the copy helper that depended on that property.

Allocation retains its bounded high-water capacity rather than returning each slot to the OS. Reachability scanning remains an explicit cost. This is one mark/sweep variant, not a universal allocator benchmark or a constant-time processing claim.

## Historical identity limit

The two original 924,000-byte benchmark ZIPs, their logical-text bytes, their generator, the original 361 encoding fixtures and the original classifier fixture were not present in the fetched repository tree or recovered packages searched locally. They are not silently reconstructed as original identities.

This probe uses one **new, deterministic 924,000-byte text**, packaged as stored and DEFLATE entries, identically across whole grammar, retained copy frontier and reclamation. Generator, logical/ZIP hashes, zlib version and every measurement are retained in `run_probe.py` and `results.json`. The same two compression cases and logical size are tested, but exact historical workload replication remains open. Historical figures are not mixed with these fresh measurements. The recovered integrated source stores an inherited 1,120-byte `StreamRule`; its fresh copy-frontier memory differs from the historical report. That difference is preserved, not normalized away.

## Measurements

Seven separate process executions per implementation/case; alternating execution order. Same compiler and flags: `cc -O2 -std=c11 -Wall -Wextra -Werror ... -lm`. `measure.c` measures complete child wall time, user+system CPU and child peak RSS through `wait4`. Its small native launcher avoids the inherited Python-process RSS floor found in a discarded preliminary measurement. All timings include parsing, summaries, reconstruction, reclamation and output; no work is moved outside the timed command. No warmup subtraction.

| Case | Whole wall / RSS | Copy wall / RSS | Reclaim wall / RSS | Speedup vs copy |
|---|---:|---:|---:|---:|
| stored | 0.2127 s / 492,672 KiB | 3.5511 s / 78,084 KiB | 0.4462 s / 42,240 KiB | 7.96× |
| deflate | 0.0125 s / 25,600 KiB | 0.0588 s / 6,332 KiB | 0.0120 s / 3,072 KiB | 4.90× |

Zero embedding drift in all measured runs. The memory valley is retained and the time ridge materially reduced on both fresh cases. Stored processing still takes about twice the whole-grammar time; that remaining cost is not hidden.

| Charged work | Stored copy → reclaim | DEFLATE copy → reclaim |
|---|---:|---:|
| Copied live nodes | 7,110,439 → 0 | 376,778 → 0 |
| Suffix reconstruction nodes | 21,782 → 21,782 | 8,477 → 8,477 |
| Scanned slots | 8,021,052 → 8,021,052 | 429,689 → 429,689 |
| Median reconstruction time | 2.947917 → 0.006484 s | 0.050636 → 0.001020 s |
| Median reclamation time | 0.162358 → 0.084947 s | 0.000102 → 0.003171 s |

Copy reconstruction timing includes suffix slicing, mark/map allocation and the full reachable-copy operation; reclaim reconstruction times suffix slicing only. Reclaim reclamation includes mark allocation/traversal, full high-water sweep, freelist updates and root retirement. Copy reclamation times freeing the old arena. Counters and per-process CPU/RSS/wall samples are retained in JSON. Match construction and all summary composition remain charged in end-to-end runtime; the table isolates collection work, not all processing work.

## Exactness and counterprobes

The C regression compares complete unnormalized n-gram count vectors, length, prefix/suffix metadata and bytes against direct plaintext computation. It also checks the retained suffix's exact summary. Its 249,000-byte sequence runs multiple collections, maximum 32,768-byte distances, distance-1 overlap, and other overlapping matches. The bounded-construction assertion fails on the copy baseline and passes on reclamation. Both inherited selftests pass 8/8.

The recompression matrix is newly generated from inherited categories: stored, DEFLATE levels 0–9, all five zlib strategies, and varied forced sync/full-flush boundaries. It requires **361 distinct legal ZIP byte strings**, compares whole/copy/reclaim embeddings exactly, and compares unchanged fixed-fixture n-gram classifier scores and probabilities exactly. This fixture uses the existing `nn_init` function with its existing seed; no model training or model change occurs. Four additional 100,000-byte cases force actual reclamation under different parse shapes and compare classifier outputs as well. Original fixture identity is not claimed.

AddressSanitizer and UndefinedBehaviorSanitizer pass the regression with leak detection disabled. LeakSanitizer cannot run in this environment (`/proc` task inspection failed); leak checking is therefore **unverified**, not passed.

## Reproduce and rollback

On Linux with C compiler, make and Python 3:

```sh
make all
make check
make benchmark
```

`make check` verifies inherited selftests, exact raw-carrier regression and recompression counterprobes. `make benchmark` regenerates fixtures and writes fresh `results.json`; save the prior results if comparing another environment. Generated binary/input files are ignored; fixture generator and hashes are retained. `baseline_cli stream-embed` remains the unmodified copy baseline. `baseline_instrumented` is mechanically generated for cost measurement only. Rollback selects the baseline binary; the predecessor implementation and evidence are untouched.

No further systems variants or semantic/affine experiments follow this probe. The bounded conclusion applies to these retained workloads. Exact historical replay still requires the original fixtures.
