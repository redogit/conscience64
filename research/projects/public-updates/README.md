# Public research updates

This directory is the static public research-update surface for Conscience64.

## Boundary

Only records listed in `admissions.json` with `classification: "public"` are serialized into `data/latest.json`.

- Default is deny.
- Missing or unknown classification is a hard failure.
- A `private` admission is excluded **before the record file is read**.
- A candidate marked `derived_from_private_history: true` cannot be admitted as `public`; rewriting or sanitizing private history does not make it public.
- Public and private material are never mixed into one payload for client-side filtering.
- This feed does not expose `analytics/server.py`, its POST endpoint, its SSE endpoint, or its append-only local ledger.

`PUBLICATION != INDEPENDENT_EVIDENCE`.

## Freshness and publication

Changes under `research/projects/**` are already inside the existing fully gated Pages source workflow. Therefore a merged admitted public update is automatically published through the same Pages gate as the rest of the research project surface.

`.github/workflows/public-research-updates.yml` additionally runs every six hours to:

1. rebuild/validate the deterministic public snapshot;
2. record the exact Git revision, generation time, included record IDs/hashes and validation result in the workflow log;
3. compare the deployed public endpoint with the checked-in deterministic snapshot on scheduled runs.

The scheduled workflow is read-only. It does not mutate research state or turn the local analytics service into a remote backend.

## Add an update

1. Add a small public record under `records/`.
2. Add it to `admissions.json` with `classification: "public"`.
3. Regenerate the deterministic snapshot:

```sh
python research/projects/public-updates/build_public_updates.py
```

4. Verify:

```sh
python -m unittest discover -s research/projects/public-updates -p 'test_*.py' -v
python research/projects/public-updates/build_public_updates.py --check --source-revision LOCAL
node --check research/projects/public-updates/app.js
```

The public record contains a deliberately written summary and a source path. The generated snapshot records the public record SHA-256 plus the Git blob identity and byte length of its source.

## Private research

No remote private-reader implementation is active here. See `PRIVATE_READER_BOUNDARY.md` for the required TLS, authentication, authorization, retention, redaction and revocation gates before one can be enabled.

Private historical material used only to learn the user's problem-solving language is governed separately by [the Private Language-Learning Boundary](../../history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md). The private material itself is not a public-update source and must not be quoted, identity-correlated, profiled, or promoted into project evidence.
