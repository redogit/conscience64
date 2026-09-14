# Renderer Society — Mercer v1

## Status

`BOUNDED_CONTROL_PLANE / MERCER_ONLY / NO_WORLD_AUTHORITY`

This directory is the first executable slice of the renderer-society architecture. It sits **downstream** of the existing sealed Visual Carrier v2 jobs and does not alter `core.mjs`, ECS world state, scene-video job identity, the PR #48 smoke artifacts, or historical carrier-v2 seals.

## Current bounded surface

The current registry contains four entries:

- `renderer:deterministic-diagnostic` — **admitted**, complete renderer interface, no `trusted` or `reference` governance classification yet;
- `stage:diagnostic-envelope` — experimental stage;
- `stage:diagnostic-markers` — experimental stage;
- `pipeline:experimental-diagnostic` — experimental ordered two-stage pipeline.

`reference-deterministic` is a routing/determinism intent. It is **not** a declaration that the current renderer has earned the separate `reference` governance classification.

The diagnostic executors exist to test the control plane; their outputs are not production imagery. `renderer-society.test.mjs` exercises detailed execution/failure provenance on the Mercer `player-pov` job. `renderer-society-metamorphic.test.mjs` separately verifies the admitted deterministic renderer across all three existing Mercer perspectives: `character-view`, `player-pov`, and `world-view`.

## Implemented control-plane behavior

`../renderer-society.mjs` provides:

- content-addressed registry snapshots and manifests;
- pipeline identity bound to exact ordered stage versions and manifest digests;
- sealed render requests referencing the existing carrier-plan/job/recipe identities;
- deterministic candidate routing;
- bounded `single-best` and `comparison-set` fan-out;
- a bounded `society-sweep` interface that is not broadly exercised here;
- isolated complete-renderer and ordered-pipeline execution through injected executor functions;
- content-addressed stage, artifact, execution, and execution-set provenance;
- explicit `failed-toolchain`, `failed-render`, and `failed-provenance` records;
- retention of successful upstream-stage evidence after a downstream failure.

Stable provenance hashes intentionally exclude wall-clock timestamps and mutable runtime measurements.

## Verified metamorphic properties

The bounded verification suite now establishes, for the declared Mercer diagnostic fixture:

- the three perspectives retain three distinct source-job identities;
- their render-request, diagnostic-artifact, and execution-set identities remain distinct rather than collapsing across viewpoints;
- repeated execution with identical sealed inputs is deterministic under the injected diagnostic executor;
- all three perspective executions reuse the same registry snapshot;
- changing only one experimental stage version changes that stage manifest digest;
- the containing pipeline digest changes because pipeline identity binds the exact ordered stage versions/digests;
- the registry snapshot, candidate-set, and fan-out decision identities change downstream of that stage mutation;
- the unmodified admitted renderer digest does not change;
- neither the stage mutation nor three-perspective execution changes the sealed carrier plan or ECS job identities.

This is structural/provenance evidence. It is not a measurement of production image quality or a governance promotion.

## Authority and claim ceiling

```text
VIDEO_RENDER != WORLD_AUTHORITY
VISUAL_CARRIER != WORLD_AUTHORITY
VISUAL_INTERPRETATION != WORLD_FACT
VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON
QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING
REFERENCE_RENDERER != UNIQUE_TRUTH
VISUAL_AGREEMENT != WORLD_AUTHORITY
EXPERIMENTAL != ADMITTED
ADMITTED != TRUSTED
ADMITTED != REFERENCE
ROUTING_INTENT_REFERENCE_DETERMINISTIC != GOVERNANCE_CLASS_REFERENCE
VIEWPOINT_CHANGE != WORLD_STATE_CHANGE
STAGE_MANIFEST_CHANGE => PIPELINE_IDENTITY_CHANGE
```

Renderer execution receives cloned downstream inputs. It has no supported write path into ECS/world authority.

A passing test establishes the declared deterministic control-plane behavior for this bounded fixture. It does **not** establish production rendering quality, cross-runner byte identity, accessibility quality, operational scalability, low cost, trusted/reference status, or production visual canon.

## Intentionally deferred

- broad `society-sweep` execution;
- production photoreal/cinematic renderers;
- automatic governance promotion;
- `trusted`, `reference`, or `production-candidate` promotion of the current diagnostic renderer;
- remote untrusted renderer execution;
- general DAG pipelines beyond ordered stages;
- write-back into ECS/world authority;
- replacement or rewriting of prior carrier-v2 or smoke-render evidence.

## Verify

From the repository root:

```bash
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/renderer-society-metamorphic.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/ecs.test.mjs
node play/mmo/simple/test.mjs
```

The public playground workflow runs both renderer-society contracts alongside the existing MMO/ECS/browser gates.
