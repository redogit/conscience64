# Hodge Compass API connection

This note connects the target-native `conscience64` Hodge research spine to the executable **Hodge Compass API** proposed in `redogit/Other-Projects-#93`.

## Authority boundary

This repository remains authoritative for its own Hodge research state, claims, source bindings, and W114 obligations.

The API is a **method/query surface**, not an authority transfer.

```text
METHOD_TRANSFER != EVIDENCE_TRANSFER
API_INDEX_ENTRY != VERIFIED_CLAIM
COMPASS_OBSERVATION != ALGEBRAIC_REALIZATION
NONZERO_TARGET_COEFFICIENT != FULL_HODGE_PROOF
FAILED_ANSATZ != NONALGEBRAIC_CLASS
```

Target-local acceptance is required before any API-derived method/result changes this spine.

## What the API connects

The API source catalog pins the exact `conscience64` revision and enumerates the current `research/hodge/` source tree, including:

- the canonical Hodge README/integration/cooperation surfaces;
- Decision Field Hodge results;
- even-wall / Shioda / star-split / coset screens;
- W114 factorization controls and research loop;
- tests and bounded result artifacts;
- method firewall and structural supports.

It also pins the `Other-Projects-` revision containing:

- Hodge Span Lab;
- exact deformation-to-span bridge;
- Hodge run/evidence surfaces;
- Decision Field relation tooling used as method-only infrastructure.

## W114

Current target remains issue #99:

```text
alpha = (1,7,78,79,86,91)
M_W114 = x1^6 x2^77 x3^78 x4^85 x5^90
degree = 336
```

The API exposes this as a frozen target contract and does not change its proof obligation.

## Compass / observer method

The private research lineage may be indexed locally as separate Normal and Work occurrences under stable semantic objects:

```text
2D Surface
-> 3D frame
-> 4D directional observers
-> controlled probe
-> residual/disagreement
-> repair/recenter
-> 3D reprojection
-> 2D return
```

No private Normal/Work text is bundled in the public API repository.

Duplicate occurrences across Normal and Work history provide recoverability/provenance, **not independent corroboration**.

## Fast use

After `Other-Projects-#93` is merged:

```sh
python "Hodge Compass API/hodge_compass_api.py" \
  --db .hodge-compass/index.sqlite3 \
  ingest "Hodge Compass API/bootstrap_manifest.json"

python "Hodge Compass API/hodge_compass_api.py" \
  --db .hodge-compass/index.sqlite3 \
  --repo-root . serve --port 8765
```

Primary API surfaces:

- `GET /v1/hodge/w114`
- `GET /v1/hodge/sources`
- `POST /v1/hodge/sources/search`
- `POST /v1/search`
- `POST /v1/hodge/span`
- `POST /v1/hodge/bridge`
- `POST /v1/observer/remainder`

## Performance boundary

A local synthetic reference run on 2026-09-25 measured approximately:

- 1,893.5 occurrence ingests/second in 1,000-record transactions;
- 3.895 ms FTS5 search p50;
- 4.398 ms p95.

That is a local benchmark, not a universal performance guarantee.

## Current integration state

- executable API: proposed in `redogit/Other-Projects-#93`;
- Hodge native authority: unchanged here;
- W114 issue #99: unchanged;
- evidence transfer: denied by default;
- private history: local-only ingestion.


## v1.1 admitted executable surface

`redogit/Other-Projects-` PR #94 is merged to main at:

`783e09cf7c5f9c511360fee9c5b47270ebcb77bf`

v1.1 adds:

- local UTF-8 source-content ingestion into SQLite/FTS5;
- exact SHA-256 occurrence identity under stable source SemanticObjectIDs;
- idempotent re-indexing of unchanged source bytes;
- changed source bytes preserved as new occurrences rather than silent replacement;
- up to 64 indexed searches per batch request;
- bounded typed relation traversal with `permission` and `evidence_transfer` retained;
- a W114 batch query pack;
- a reproducible source-catalog refresher.

The merged source catalog snapshot contains 168 discoverable artifacts:
- 41 target-native `conscience64` Hodge/CI sources;
- 127 Hodge/query/connected-method sources in `Other-Projects-`.

### Fast local content path

Once both repositories are checked out, the API can index the actual contents of `research/hodge/` and the connected method surfaces locally. Routine proof-work retrieval can then avoid network discovery.

```text
source bytes
-> SHA-256 occurrence
-> stable SemanticObjectID
-> SQLite WAL / FTS5
-> batch query
-> typed relation traversal
-> exact Hodge / observer probe
```

This changes retrieval speed and precision only. It does **not** change the mathematical authority boundary.

```text
SOURCE_TEXT != VERIFIED_CLAIM
RELATION_TRAVERSAL != EVIDENCE_TRANSFER
SEARCH_HIT != HODGE_EVIDENCE
```


## Admitted W114 proof graph

`redogit/Other-Projects-` PR #95 is merged to main at:

`c9395343e135d73842299039fcfdd5240434dbfe`

The API now ships `Hodge Compass API/hodge_proof_graph_seed.json`, distilled from the current target-native Hodge spine, W114 research loop, evidence firewall, issue #99, and Hodge Span Lab.

The graph preserves the current route states:

```text
W114
├─ motivic / Hecke→Chow          CURRENT_CANONICAL
│  └─ MOT-1
├─ matrix factorization          COEXISTING_LINEAGE
│  ├─ MF-1
│  └─ MF-2
├─ higher-level certificate lift PRESERVED_UNRESOLVED
│  └─ LIFT-1
└─ direct cubic Delsarte/Shioda  HISTORICAL_SUPERSEDED
```

It also links W114 to:
- `tool:hodge-span-lab` for exact supplied-span diagnostics;
- `compass:observer-return-loop` as a method/counterprobe surface only;
- `hodge:method:evidence-firewall` for target-native admission control;
- the cycle-span / representation-sector deficit frontier and calibration objects.

Every seeded relation has `evidence_transfer=DENY`.

### Stable-ID hardening

The admitted index now rejects any attempt to reuse:
- a `SemanticObjectID`,
- an explicit `OccurrenceID`, or
- an explicit relation ID

with different immutable metadata.

```text
SAME_STABLE_ID + DIFFERENT_METADATA = REJECT
```

This prevents Normal/Work duplication, later manifests, or regenerated catalogs from silently rewriting object identity.

The graph is a navigation and proof-obligation surface. It does not alter the mathematical status of any route or obligation.
