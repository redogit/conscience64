# Conscience64

Privacy-safe universal research space hosted as a static GitHub Pages application.

Visible surface: **I / R / P / O**.

## Try the free projects

The [public playground](https://redogit.github.io/conscience64/play/) turns ongoing ideas into five usable tools:

| Tool | What you can do |
| --- | --- |
| [Orbit Shelf](https://redogit.github.io/conscience64/play/orbit/) | Collect and search notes with source links |
| [Word Weave](https://redogit.github.io/conscience64/play/weave/) | Rearrange writing while keeping the original |
| [Pattern Garden](https://redogit.github.io/conscience64/play/garden/) | Make geometric art and export SVG or text |
| [Small Steps](https://redogit.github.io/conscience64/play/steps/) | Plan a next step and preserve dated checkpoints |
| [Source Compare](https://redogit.github.io/conscience64/play/compare/) | Compare exact text changes and preserve both inputs |

English, Spanish, French, and Arabic interfaces; Unicode writing; keyboard controls; optional local saving; no accounts. The new tools have an MIT license scoped to `play/`. See [the usage and provenance notes](play/README.md). Their [public-tool catalog](play/projects.json) is separate from the research registry below.

## Internal workspace update

[Orbit Search and Conscience space](research/cross-carrier/2026-09-13/internal-update/global_search/index.html) adds 65 enabled search services, 248 country/territory routes excluding Russia, and a geometric 4D-to-3D black-hole view. Run locally for metadata retrieval and a separate headless XY interaction workspace. [Materials, validation and complete recovery bundle](research/cross-carrier/2026-09-13/internal-update/README.md) preserve prior transport results and open failures. Public browsing still depends on network/certificate access; external-page activation is not enabled.

## Research projects

The research portfolio now has a compact project map that preserves both accomplishments and failures instead of presenting only successes.

See [`research/projects/README.md`](research/projects/README.md) for the current highlights, lowlights, claim ceilings, and unresolved remainders across Cross-Carrier Wave, Orbit, Tiny Babel/TBCL, Operator Moonshot, model experiments, geometry/codecs, and historical recovery.

Browser API: `window.Conscience64API`.

Examples:
```js
Conscience64API.search.simple("black hole quantum")
Conscience64API.search.advanced({ text: "language", minDegree: 5 })
Conscience64API.get("project:physics")
Conscience64API.traverse("project:orbit", { depth: 2 })
Conscience64API.irpo({ I: "black hole", R: {}, P: { action: "search.simple" } })
```

Every searchable object has a deterministic `uoid:sha256:...` identifier and microdata.

## REDOGIT

This repository follows an explicit regenerate-and-verify successor rule: keep provenance, keep failed carriers in history, prefer inspectable source and manifests, and regenerate derived artifacts instead of treating archive dumps as the source of truth.

The current contract is **verified**. `.github/workflows/redogit-local.yml` materializes the exact public `$GITHUB_SHA` with Git, runs the compact REDOGIT self-check, and verifies byte counts and SHA-256 identities for the directly committed research surface. This action-free transport is deliberate: external Action/reusable-workflow paths reproduced pre-job `startup_failure` in this repository, while the direct scheduler probe and direct-Git verification path both schedule normally.

See [`REDOGIT.md`](REDOGIT.md) and [`redogit.json`](redogit.json).

## Recovery carriers

Historical/recovery material is modeled as a provenance-preserving carrier graph rather than a flat quote or document corpus. Work, witness, edition, scan, transcription, translation, and reconstruction identities remain distinct; `UNKNOWN` is not treated as `ABSENT`.

See [`RECOVERY_CARRIER_MODEL.md`](RECOVERY_CARRIER_MODEL.md) for the loss/evidence/lineage model and adaptive cross-carrier coordinate overlay.

## Generated research checkpoints

Generated Cross-Carrier / Float64 research material is preserved under [`research/cross-carrier/`](research/cross-carrier/). The 2026-09-12 package index records exact SHA-256 identities for the original, v2.1, v2.2, and SAT64/MCR checkpoints.

The v2.2 checkpoint deliberately keeps two manifest meanings separate:

- `manifest.json` — the original **full generated-package inventory** and its expected artifacts;
- `repository_manifest.json` — the **compact surface actually committed directly** in the repository and verified byte-for-byte in CI.

Transport shards under `v2.2/transports/` remain provenance/recovery evidence; they are not silently promoted to directly materialized package files.

See [`research/cross-carrier/2026-09-12/PACKAGE_INDEX.md`](research/cross-carrier/2026-09-12/PACKAGE_INDEX.md).

The integrity rule is unchanged: a byte hash establishes identity, not semantic truth, proof weight, or independent corroboration. In particular, the preserved v2.2 state explicitly keeps `P ?= NP` as `OPEN`.

To verify the current committed v2.2 surface:

```bash
python3 tools/redogit_selfcheck.py
python3 tools/verify_research_manifest.py \
  research/cross-carrier/2026-09-12/v2.2/repository_manifest.json \
  research/cross-carrier/2026-09-12/v2.2
```

## Corpus transport

The browser corpus is transported through ordered `data-NN.txt` shards. Shard boundaries have no semantic meaning and do not define object identity.

See [`data-manifest.json`](data-manifest.json) for the current browser-transport state. This transport is separate from generated research checkpoints; incomplete research archive shards are not treated as complete current artifacts.

Run `node tools/check_site.mjs` with Node.js 22 or newer to verify all shard identities, decompress the complete corpus, check graph endpoints, and exercise the actual app startup and search/project APIs. Both repository verification and Pages source synchronization run this check. It covers data and API behavior, not visual rendering.

The repaired transport is a documented browser projection of the verified original Pages package. See [`SITE_DATA_RECOVERY.md`](SITE_DATA_RECOVERY.md) for source hashes, retained fields, and the rebuild command.

## GitHub Pages

GitHub Pages publishes the **`gh-pages` branch / repository root**. The `pages-sync.yml` workflow checks the site and synchronizes the exact `main` commit to that publishing branch; GitHub's native Pages build and deployment then publishes it. Changes to the browser files or structured project library trigger synchronization.

The published corpus is privacy-safe; personal/family/private information is outside the site.
