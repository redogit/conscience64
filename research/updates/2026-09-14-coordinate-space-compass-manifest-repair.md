# Coordinate Space Compass release-manifest repair — 2026-09-14

## Status

`RELEASE_IDENTITY_RECONCILIATION / CODEC_SEMANTICS_UNCHANGED`

## Observation

The post-merge Conscience64 publication gate for starter Arcade content passed the history, site/API, analytics, MMO/Forge, playground, and Chrome layers, then stopped at Coordinate Space release verification.

The verifier reported that `coordinate-space/index.html` no longer matched the allowlisted identity in `coordinate-space/release_manifest.json`:

- predecessor index: `10720` bytes, SHA-256 `ffcfbd012037a602cd16ec153426860b50e29360b5b0a891ebd7cda55e770f06`;
- current index: `11841` bytes, SHA-256 `2eafb385f64a95d8d27a6568e7481ad3acb4cfc6d9046e9d38b936185a1bc9f1`.

The failure was therefore a release-identity mismatch, not evidence that the starter Arcade pack or Coordinate Space codec had failed.

## Source of change

Commit `1935ad6a31f155e5872236788950361086672a50` merged an intentional 2.5D/3D Compass presentation successor. Its Coordinate Space change modified only `coordinate-space/index.html` inside the Coordinate Space release directory. The change adds depth/presentation styling and expanded Conscience64 Compass/navigation links.

The page itself continues to state that the `exact-utf8-f64/v1` format is unchanged and that old envelopes still decode.

## Repair

`coordinate-space/release_manifest.json` now:

1. updates only the `index.html` byte/hash identity to the current verified file identity;
2. retains the predecessor index identity in `presentation_successor.predecessor_index`;
3. records the Compass merge commit as the source of the presentation successor;
4. explicitly states that this is a presentation/navigation reconciliation, not a codec-schema or audited-core-module change;
5. leaves the audited `coordinate_runtime.py` and `float64_coordinate_builder.py` identities unchanged.

The manifest schema remains `coordinate-space-public-release/v1.2.1`; this repair does not claim a new codec or envelope version.

## Evidence boundary

A matching release manifest establishes that the declared public file allowlist and byte identities agree with the repository state. It does not by itself re-prove every functional/accessibility claim, establish scientific truth, or convert a visual-depth presentation change into new Coordinate Space semantics.

Full release, browser, Musilanguage, MUSIC64, and Pages publication gates must pass again before this successor is treated as publicly deployed.
