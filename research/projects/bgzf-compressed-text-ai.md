# Project — BGZF / ZIP Compressed-Text AI

Status: `ACTIVE_BOUNDED_RESEARCH_SUCCESSOR`

## I — What do we have?

A compact C execution path that interprets ZIP/DEFLATE symbolically, computes task summaries without materializing the complete plaintext, and evaluates exact and learned carriers over those summaries.

The retained lineage is:

```text
ZIP/DEFLATE whole-grammar analyzer
  -> BGZF bounded per-member grammar + exact summary
  -> corrected exact 1/2/3-gram composition
  -> ZIP 32 KiB symbolic frontier
  -> associative learned affine operator
```

BGZF remains a bounded predecessor, not a discarded prior project.

## R — What difference matters?

```text
COMPRESSED_BYTES != LOGICAL_TEXT
GRAMMAR_SHAPE != LOGICAL_TEXT_IDENTITY
COMPRESSED_SIZE != COMPUTATION_COST
NON_MATERIALIZING_INTERPRETATION != UNTOUCHED-BIT_INFERENCE
ASSOCIATIVE_COMPOSITION != AUTOMATIC_SEMANTIC_GENERALIZATION
```

If a carrier satisfies `E(xy) = E(x) ⊗ E(y)`, recompression invariance requires `⊗` to be associative on reachable states. Exact summaries satisfy that law. The learned successor represents byte actions as affine operators and composes them by matrix multiplication.

## P — What should we do next?

1. Preserve recompression invariance as a mandatory counterprobe.
2. Keep the 32 KiB DEFLATE history obligation explicit.
3. Replace suffix-copy compaction with live-node reclamation or another bounded history structure.
4. Test direct sums / mixtures of small associative operators before simply widening one affine state.
5. Distill stronger byte models into a closed associative family.
6. Add selective expansion for unresolved/uncertain regions rather than silently making predictions compressor-shape dependent.
7. Continue comparing learned operators against exact carriers and simple decompressed baselines.

## O — What happened?

The 2026-09-30 five-experiment descent established:

- 361/361 legal recompressions of one logical text had zero exact-embedding and prediction drift.
- A 32 KiB symbolic frontier preserved the exact carrier while reducing peak memory sharply, but naïve compaction introduced a time ridge.
- A diagonal associative learned state was weak; an 8-state full affine operator solved the synthetic long-range order counterprobe and remained recompression-stable to floating-point tolerance.
- On real linguistic data, the affine family reached a semantic plateau below a small byte-CNN; widening beyond 8 states did not reliably improve sentiment generalization.
- The optimized static Linux x86-64 runtime plus one 8-state model occupies 905,760 bytes, under the 1,509,949-byte storage envelope.

## Evidence boundary

The current evidence establishes a bounded implementation and several exact/instrumented invariants. It does **not** establish:

- inference on untouched DEFLATE bits;
- general language understanding;
- superiority to decompress-then-infer;
- universal bounded-memory optimality;
- exact bitwise associativity under floating-point regrouping;
- that wider affine state alone escapes the real semantic plateau.

## Current experiment record

See `research/compressed-text-ai/2026-09-30/README.md`.

## Artifact receipts

Local experiment artifacts retained outside this repository during this PR:

- successor C source SHA-256: `e10b069d908feef134978a8a17b2bc73da67034d9d43f5b9bdb7e35b0e0e96d4`
- stripped static runtime SHA-256: `09ab4f7a41dd2d5d9caedff3f0a6da340a34a42d4ba7712075bf3c944213a3a5`
- sentiment AAA8 model SHA-256: `d349116c2310570f8c3e9ee3aec55802881b3bc794a3ca32e0448250624f76d9`
- POS AAA8 model SHA-256: `fe585e6d3a879ff739d91c812b2dd325b2d3e8551625631d14699b854fc662e8`

The source/binary receipts prove identity of the tested local artifacts; this PR does not pretend those bytes are already committed.
