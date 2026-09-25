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
