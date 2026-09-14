# Internal cross-carrier connection work

Read `global_search/README.md` for the new search interface, separate headless interaction workspace, and 4D-to-3D black-hole view. Start with `global_search/index.html`; run its local server for research APIs and the workspace.

The earlier transport continuation is documented in `connection_next/README.md`.

**Passing transport:** 39 packets traversed the recovered TBCL serializer, C++ Runtime Relation Index, Orbit database, and ECS JSONL bridge. All were reconstructed exactly, and all 39 tampering controls were rejected. Provenance-table loss and restoration were also exercised.

**Open correctness issue:** the old router overstates corroboration. A stricter candidate is included for review with 36 passing and 11 failing legacy tests. It is not promoted and is not used by the passing transport run.

**Coverage:** `connection_next/coverage.json` records all 39 known branches. Most remain catalogued rather than individually executed. This bundle does not establish live cross-site connectivity or complete historical-tool coverage.

The earlier baseline is preserved in `connection_test/`; its source packages are under `internal_sources/` and `internal_run/`. New sources and observations are under `connection_next/`.
