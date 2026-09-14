# Connected internal runtimes — continuation 2

## Result

39 synthetic packets, one per recovered ECS branch, passed through four actual local implementations:

1. TBCL 0.1 MAXCTX `render` and `parse_bytes` carried the packet with semantic/custody roots.
2. Runtime Relation Index C++23 implementation returned two scoped recovery candidates for `surface`; the requested interaction scope ranked first while the geometry candidate remained separate.
3. Orbit Lab Reflow 1.0 stored each packet as a quarantined Artifact in SQLite and reconstructed it after closing and reopening the database.
4. The existing ECS JSONL bridge delivered the recovered Orbit object across a restarted adapter.

Every reconstructed packet matched its input, including source context, chronological ordering, separate user/assistant surfaces, obligation, unresolved remainder, and UTF-8 payload. All 39 deliberate byte changes were rejected by TBCL validation.

These are 39 domain-labelled packets, not executions of 39 domain implementations. The C++ lookup used ASCII keys; this does not establish multilingual semantic matching. TBCL compilation and its native evaluator were not exercised. Hashes check supplied content, not authentic authorship.

Orbit's existing connection check passed for 14 branches and 32 non-evidentiary associations. Its compact-carrier probe passed for 14 cases. The new integration additionally removed the actual provenance table, observed reconstruction failure, restored it, and recovered exactly. This strengthens the local reconstruction check; it is not a general model of human Knowledge Decay.

20 targeted Orbit tests passed. Full machine-readable results are in `outputs/connected_results.json`; validation records and exact source identities are included.

## Corroboration defect: candidate retained, not promoted

The existing ECS router sets `corroborated=true` whenever another carrier returns `ok=true`. Its local verifiers may only fingerprint or structurally inspect the primary result. Those operations do not establish independent corroboration.

The candidate under `framework/` separates a successful second-carrier check from a declaration of corroboration. A stronger declaration requires an explicit flag, substantive evidence, evidence identifiers, and a stated independence basis. These are admission metadata, not proof that the verifier is independent. A production resolution needs the actual check and dependency provenance, not trusted labels alone.

The candidate regression run produced **36 passed, 11 failed**. Seven seeded criteria demand corroboration; blocking their prior structural shortcuts changes downstream scheduling, restart and completion expectations. Those 11 failures are retained in `outputs/strict_candidate_regression.log`. Criteria were not weakened to restore green tests. The candidate is not a replacement for the last tested baseline.

The connected packet run imports the baseline ECS **bridge**, and does not call its problematic router. The baseline remains under `connection_test/repaired_framework` with the previous partial-source fix and its prior 46-test result. No repository was published or changed.

## Next obligations

1. Supply meaningful corroborating checks and track shared dependencies for the seven affected criteria; then reconcile the eleven legacy scheduling expectations without weakening evidence requirements.
2. Resolve remaining per-project runtimes and task interfaces from the coverage ledger. A branch inventory entry is not a loaded tool.
3. Connect the coordinate/float64 implementation and test the exact carrier representation. That runtime is not included in this continuation.

## Reproduce from bundle root

Requires Python, NumPy, pytest, and a C++23 compiler.

```bash
python3 connection_next/run_connected.py
```

The command compiles a small adapter that includes the original C++ source unchanged. It uses temporary databases and bridge queues. It writes observations to `connection_next/outputs/`.

To inspect the deliberately unpromoted candidate's regression failures:

```bash
cd connection_next/framework
PYTHONPATH=src python3 -m pytest -q
```

Historical manifests under the candidate framework describe earlier revisions; `CANDIDATE_MANIFEST.sha256` describes the candidate files. Use the top-level `BUNDLE_MANIFEST.sha256` for this deliverable's content identity.
