# Conscience64

Privacy-safe universal research space hosted as a static GitHub Pages application.

Visible surface: **I / R / P / O**.

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

This repository now follows an explicit regenerate-and-verify successor rule: keep provenance, keep failed carriers in history, prefer inspectable source and manifests, and regenerate derived artifacts instead of treating archive dumps as the source of truth.

See [`REDOGIT.md`](REDOGIT.md).

## Recovery carriers

Historical/recovery material is modeled as a provenance-preserving carrier graph rather than a flat quote or document corpus. Work, witness, edition, scan, transcription, translation, and reconstruction identities remain distinct; `UNKNOWN` is not treated as `ABSENT`.

See [`RECOVERY_CARRIER_MODEL.md`](RECOVERY_CARRIER_MODEL.md) for the loss/evidence/lineage model and adaptive cross-carrier coordinate overlay.

## Generated research checkpoints

Generated Cross-Carrier / Float64 research material is preserved under [`research/cross-carrier/`](research/cross-carrier/). The 2026-09-12 package index records exact SHA-256 identities for the original, v2.1, v2.2, and SAT64/MCR checkpoints, while the v2.2 directory exposes its governing README, coordinate schema, exact UTF-8/Float64 codec, search utility, validation result, and byte manifest.

See [`research/cross-carrier/2026-09-12/PACKAGE_INDEX.md`](research/cross-carrier/2026-09-12/PACKAGE_INDEX.md).

The integrity rule is unchanged: a byte hash establishes identity, not semantic truth, proof weight, or independent corroboration. In particular, the preserved v2.2 state explicitly keeps `P ?= NP` as `OPEN`.

To verify a materialized checkpoint against its manifest:

```bash
python tools/verify_research_manifest.py path/to/manifest.json path/to/checkpoint-root
```

## Corpus transport

The browser corpus is transported through ordered `data-NN.txt` shards. Shard boundaries have no semantic meaning and do not define object identity.

See [`data-manifest.json`](data-manifest.json) for the current browser-transport state. This transport is separate from generated research checkpoints; incomplete research archive shards are not kept on the current branch.

## GitHub Pages

This repository is a static site and does not require a GitHub Actions deployment workflow. Configure GitHub Pages to publish from the **`main` branch / repository root**.

The published corpus is privacy-safe; personal/family/private information is outside the site.
