# REDOGIT — Conscience64

Conscience64 is redone by regenerating trustworthy carriers from explicit source and manifests instead of accumulating opaque archive dumps.

## Rule

1. Preserve source identity and provenance.
2. Generate derived carriers deterministically where possible.
3. Record byte size and SHA-256 for directly verified artifacts.
4. Keep semantic claims separate from byte identity.
5. Keep unresolved research explicitly unresolved.
6. Retire failed transport formats from the current tree while preserving their commits as historical evidence.
7. Prefer small inspectable source, schemas, manifests, and verification code over redundant opaque binaries.
8. Keep source-package inventory distinct from repository-materialization state.

## Current boundary

The browser surface remains the lightweight static Conscience64 application.

The Cross-Carrier / Float64 research checkpoints live under `research/cross-carrier/2026-09-12/`. The package index records identities for full generated checkpoints; the `v2.2` directory exposes the compact governing source and validation surface.

Within `v2.2`:

- `manifest.json` preserves the original full generated-package inventory.
- `repository_manifest.json` describes the compact files directly committed in this repository and is checked by byte count and SHA-256.
- `transports/` contains retained recovery/transport evidence and is not treated as equivalent to directly materialized package files.

Large `.npy`, `.npz`, JSONL, and ZIP products remain generated/checkpoint artifacts unless directly materialized. Their recorded hashes establish identity only; they do not establish the truth of the research represented inside them.

## Verification

The current repository state is verified by `.github/workflows/redogit-local.yml`.

The workflow intentionally has no external GitHub Action dependency. It uses ordinary Git to fetch the exact public `$GITHUB_SHA`, then runs:

```bash
python3 tools/redogit_selfcheck.py
python3 tools/verify_research_manifest.py \
  research/cross-carrier/2026-09-12/v2.2/repository_manifest.json \
  research/cross-carrier/2026-09-12/v2.2
```

Verified evidence:

- scheduler-only probe run `34719467106` — PASS;
- first reconciled repository-surface verification run `34719575880` — PASS;
- promoted-current confirmation run `34719651062` — PASS.

Earlier workflows using an external checkout Action or reusable-workflow path repeatedly produced `startup_failure` before jobs were scheduled. Those failures are retained in GitHub Actions history. The exact repository-policy cause is not asserted because Actions administration settings were not readable through the available connector.

## Failed carrier lineage

A partial Base64 shard upload was attempted on 2026-09-12. It was detected as incomplete and removed from the current tree. Its commits remain in Git history as a failed carrier experiment rather than being silently erased.

That is REDOGIT: preserve what happened, stop using what failed, verify the successor, and keep going.
