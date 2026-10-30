# Horizon Integral Runtime D2 — Tasks 1–4

This subtree is the publication-safe consolidation of the first four approved Horizon Integral Runtime D2 tasks.

## Included

1. **Baseline/workspace contract** — exact approved digests, safe archive verification, single-root bootstrap rules, external-origin records.
2. **Horizon schema 1.2.0** — occurrence/semantic identity, working sets, progression, observers, capability requirements, Homeward, knowledge-decay, third-plane records, and auditable 1.0/1.1→1.2 migration.
3. **SCDL → canonical Horizon IR** — expanded inert vocabulary, exact integers/rationals and UTF-16 spans, deterministic occurrences/references, cross-domain evidence boundary.
4. **Gradient Talker source-topology observer** — extracted pure cumulative-gradient kernel, source topology, LOOK observer report, parity/adversarial tests.

## Publication boundary

The large/mixed-scope `Horizon_Phase1.zip`, `shapecodex-export.zip`, `PRMAL_RMAL_Coordinate_Build_021.zip`, fitted Gradient Talker carriers, and separate Chrono Fantasy Legend source are **not** embedded in this public subtree. Their exact digests and provenance are retained in `baselines/manifest.json` and origin records. This avoids publishing unrelated/private research simply because it shared a recovery archive.

`components/horizon/` and `components/shapecodex/` in this public merge contain the reviewed Task 2/3 current files plus exact patches against the pinned baselines; the public subtree is intentionally not a second copy of the recovery archives. `components/gradient-talker/` is the standalone Task 4 extraction. Task 1 records PRMAL as an external pinned baseline rather than republishing its full archive.

## Verification

### Standalone checks in this public subtree

```bash
python3 -m unittest tests.test_baseline_manifest -v
node --test components/gradient-talker/tests/*.test.mjs
```

These exercise the safe bootstrap verifier and the self-contained Gradient Talker extraction.

### Full reconstructed baseline checks

Task 2 and Task 3 are verified by reconstructing their pinned baselines, applying:

```text
patches/task2-horizon-core.patch
patches/task3-scdl.patch
```

and then running the native suites. The fresh release-preparation receipt in `evidence/tasks1-4-merge-verification.json` records:

- Task 1 baseline verifier: 5 passed, 0 failed
- Horizon Task 2: 84 passed, 0 failed
- SCDL legacy: 32 passed, 0 failed
- SCDL integrity + Horizon IR: 14 passed, 0 failed
- Gradient Talker: 9 passed, 0 failed
- PRMAL pinned external baseline: 27 passed, 0 failed

The public subtree does **not** claim those reconstructed suites can be rerun without obtaining the pinned baseline carriers first.

No finite software test, geometric projection, Gradient Talker output, or cross-domain bridge is promoted into a mathematical proof by this integration.

## Reconstruction

Apply `patches/task2-horizon-core.patch` to the Horizon Phase 1 baseline and `patches/task3-scdl.patch` to the ShapeCodex baseline. Exact baseline digests are in `baselines/manifest.json`. The complete verified local Tasks 1–4 source carrier hash is recorded in `evidence/source-bundle.json`.
