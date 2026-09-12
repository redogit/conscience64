# REDOGIT — Conscience64

Conscience64 is redone by regenerating trustworthy carriers from explicit source and manifests instead of accumulating opaque archive dumps.

## Rule

1. Preserve source identity and provenance.
2. Generate derived carriers deterministically where possible.
3. Record byte size and SHA-256 for every generated artifact.
4. Keep semantic claims separate from byte identity.
5. Keep unresolved research explicitly unresolved.
6. Retire failed transport formats from the current tree while preserving their commits as historical evidence.
7. Prefer small inspectable source, schemas, manifests, and verification code over redundant opaque binaries.

## Current boundary

The browser surface remains the lightweight static Conscience64 application.

The Cross-Carrier / Float64 research checkpoints live under `research/cross-carrier/2026-09-12/`. The package index records identities for full generated checkpoints; the `v2.2` directory exposes the compact governing source and validation surface.

Large `.npy`, `.npz`, JSONL, and ZIP products are derived/checkpoint artifacts. Their hashes establish identity only; they do not establish the truth of the research represented inside them.

## Failed carrier lineage

A partial Base64 shard upload was attempted on 2026-09-12. It was detected as incomplete and removed from the current tree. Its commits remain in Git history as a failed carrier experiment rather than being silently erased.

That is REDOGIT: preserve what happened, stop using what failed, and make the successor easier to reconstruct and check.
