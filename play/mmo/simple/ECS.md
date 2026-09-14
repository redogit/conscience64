# Simple MMO ECS Import

The current one-page game remains the player-facing interface. This ECS is an execution/data substrate underneath it, not a second game.

## Current imported domain

- 1 world entity;
- 1 local-player entity;
- 8 place entities;
- 12 activity entities;
- 3 camera/perspective entities.

The adapter imports directly from `core.mjs` so the current simple-game definitions remain the source of truth during this transition.

## Three scene perspectives

Every place produces exactly three deterministic video jobs:

1. `player-pov` — first-person player view;
2. `character-view` — social/third-person view suitable for player + companion/NPC interaction;
3. `world-view` — wide establishing view of place, movement, and anomaly context.

Current total:

`8 places × 3 perspectives = 24 scene-video jobs`

Each job carries place identity, context, camera parameters, duration/fps/resolution intent, and the invariant:

`VIDEO_RENDER != WORLD_AUTHORITY`

## ECS semantics

`ECSWorld` keeps:

- stable entity IDs;
- component maps;
- ordered systems;
- append-only tick history;
- deterministic snapshots for the current deterministic import.

Current systems:

- `import-integrity` — verifies the 8-place / 12-activity topology and location links;
- `scene-video-jobs` — materializes deterministic render-job identities from Place × Perspective.

The adapter functions `ecsGo`, `ecsNext`, `ecsAnswer`, and `ecsMake` currently delegate the player-state transition semantics to `core.mjs` and write the result back into the ECS `PlayerState` component. `ecs.test.mjs` compares these ECS transitions against direct core transitions.

This is an incremental import boundary: behavior equivalence is tested before any future migration of the transition logic itself into standalone ECS systems.

## Video carrier

`tools/render-ecs-videos.mjs` is an explicit FFmpeg carrier.

It consumes ECS render jobs and writes WebM artifacts plus a manifest. The current renderer is deliberately a **procedural smoke renderer**, not production visual canon. It demonstrates that all scene/perspective jobs are executable artifacts while preserving the separation between world state and rendering machinery.

A higher-quality renderer can replace this carrier later without changing place/activity/player authority.

## Local executed smoke test — 2026-09-14

Executed in the working environment before PR creation:

```text
PASS game ECS import: 8 places, 12 activities, 24 deterministic video jobs, 3 perspectives/place
Rendered 24 WebM smoke clips
```

The locally rendered clips establish carrier execution for the smoke renderer only. They do not establish production art quality, visual canon, browser portability, or game authority.

## Society relationship

The reusable workflow lives under `/skills/`:

`Recover & Bound -> Build & Test -> Review & Admit`

Three levels above the individual skill:

`Human Purpose -> Society -> Operator -> Skill -> ECS -> Carrier`

The recovered Operator Moonshot Society structure remains advisory in project status; these files use its governance pattern without claiming canonical Society genesis.

## Boundaries

- `LOCAL != AUTHORITY`
- `REFERENCE != EVIDENCE`
- `VIDEO_RENDER != WORLD_AUTHORITY`
- `ECS_EQUIVALENCE_TEST != COMPLETE_MIGRATION`
- `PROCEDURAL_SMOKE_VIDEO != PRODUCTION_VISUAL_CANON`
- `SOCIETY_STRUCTURE_USED != SOCIETY_CANONICALLY_ACTIVATED`
