# Redline Shapeshifter — Reference Dossier

Status: **fictional character design input / not production canon**.

Scope is `redogit/conscience64`, specifically the canonical MMORPG successor under `play/mmo-world/`. This work does **not** create a separate Compass repository or revive the retired MMO architecture.

## Deliverable 1 — provenance-aware reference dossier

The current visual-sample ingestion is recorded in `play/mmo/simple/visual-samples/manifest.json`. The merged snapshot contains 26 image samples: 12 user-supplied references and 14 generated concepts. The ingestion snapshot found no video artifacts, so video coverage is presently `0`, not “complete.”

Hard boundaries:

- `SAMPLE != CANON`
- `REFERENCE_IMAGE != IMPLEMENTED_GAME_ASSET`
- `REFERENCE != EVIDENCE`
- `REFERENCE != IDENTITY`
- a source image is never used to infer a real person's identity, biography, measurements or private attributes;
- user-supplied references require applicable rights/consent review before external reuse;
- generated noir/shapeshifter studies are fictional design references.

## Character direction

The Redline character is a **fictional adult shapeshifter** with a risky, provocative noir presentation expressed through composition and materials rather than explicit sexual content.

Stable visual language:

- rain-soaked urban night;
- redline pulse accents against black, silver and wet concrete;
- dangerous elegance rather than superhero cleanliness;
- reflective leather, technical fabric, brushed metal, glass, water and neon;
- asymmetry, occlusion and silhouette breaks that make a transformation readable at distance;
- visual tension from stance, lighting and environment rather than identity claims about a source person.

## Five deliverables

1. **Reference dossier** — this file and the existing provenance-aware gallery.
2. **Material system** — `materials.json`; PBR families, overlays, LOD policy and wet/dry behavior.
3. **Shapeshifter state system** — `shapeshifter-states.json`; reversible fictional states with explicit transitions.
4. **Cooperation contract** — `cooperation.json`; Master, Compass, Library/Orbit, Reality Canon, Redline runtime and gallery responsibilities inside Conscience64.
5. **Acceptance gate** — `verify-redline.mjs`, executed by the Playground workflow before merge.

## Canon boundary

The dossier specifies direction. It does not assert that a generated image is a production texture, that a source photograph depicts a canonical character, or that any real-world person has the fictional traits described here. Promotion to shipped game content remains a separate reviewed decision.