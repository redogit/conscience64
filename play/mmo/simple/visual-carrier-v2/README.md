# Visual Carrier V2

Status: bounded higher-fidelity carrier experiment for Mercer & Red Street only.

The implementation consumes the existing ECS scene-video jobs without changing `core.mjs` or `ecs.mjs` and keeps all visual interpretation downstream of world authority.

## Authority flow

```text
core.mjs -> ECS -> SceneVideoJobs -> sealed carrier plan -> visual recipe -> renderer/toolchain -> frames -> encoded video
```

There is no reverse authority path from recipe, renderer, frame, or video output into ECS/world state.

## Provenance model

The carrier plan is deterministic and canonicalized before SHA-256 sealing. Every selected job preserves the ECS duration, fps, resolution, camera, `authority`, and `boundary` fields exactly. Render-local pseudo-randomness is derived independently from the stable job ID for `layout`, `lighting`, `motion`, `materials`, and `crowd`, so adding a new random domain does not renumber existing decisions.

Future rendered artifacts should additionally pin:

- repository commit and source job digest;
- recipe digest and asset-manifest digest;
- renderer/container/toolchain identity;
- per-frame hashes with a frame-sequence Merkle root;
- encoder identity and arguments;
- final artifact byte length and SHA-256.

## Evidence levels

Do not collapse these claims:

- `INPUT_DETERMINISTIC`: sealed jobs, recipe, assets, seeds, and commands are identical.
- `REFERENCE_RUNNER_BYTE_IDENTICAL`: repeated execution on the same pinned reference runner produces identical bytes.
- `CROSS_RUNNER_BYTE_IDENTICAL`: only after byte identity has actually been demonstrated across runners.
- `VISUAL_EQUIVALENCE`: similar visual output; weaker than byte identity.

## Mercer admission gate

The first renderer experiment is exactly three jobs: Mercer & Red Street in `player-pov`, `character-view`, and `world-view`.

Before expansion to all 24 jobs:

1. carrier-plan tests pass;
2. `core.mjs` and `ecs.mjs` remain unchanged;
3. PR #48 smoke lock remains unchanged;
4. one pinned reference renderer executes the three jobs twice;
5. both runs produce identical frame hashes and encoded-video hashes, or the weaker reproducibility boundary is recorded explicitly;
6. a one-property recipe mutation changes carrier provenance without changing ECS/job identity.

The next renderer may be higher fidelity, including a headless Blender/Cycles implementation, but its output remains a candidate carrier rather than production visual canon.
