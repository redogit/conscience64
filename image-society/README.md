# Conscience64 Image Society

Image Society is the replayable collaboration layer for long-horizon image generation, critique, correction, comparison, continuity review, accessibility review, authority review, checkpointing, and promotion review.

It extends the existing visual stack without changing ECS/world authority:

```text
Human intent / obligations
        |
        v
Image Society
        |
        +--> role contracts
        +--> append-only event ledger
        +--> artifact lineage
        +--> continuity / regression memory
        +--> checkpoints / active context
        +--> promotion gates
        |
        v
provider / Renderer Society transport
        |
        v
candidate visual artifacts
```

The authority path remains one-way. Image Society can inspect and classify downstream visual work; it cannot rewrite the source ECS/world state merely because an image, critic, model, or renderer agrees with something.

## Core invariants

- `GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON`
- `MODEL_OUTPUT != FACT`
- `MODEL_AGREEMENT != INDEPENDENT_CORROBORATION`
- `VISUAL_AGREEMENT != WORLD_AUTHORITY`
- `QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING`
- `IMAGE_EDIT != AUTHORITY_TO_CHANGE_SOURCE_STATE`
- `OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`

Canonical MMO promotion remains an explicit human-gated action.

## Runtime modules

- `canonical.mjs` — deterministic canonical JSON and SHA-256 identities.
- `contracts.mjs` — bounded run, event, Visual Difference, and Continuity Pack normalization.
- `ledger.mjs` — append-only replayable logical-event history.
- `artifacts.mjs` — immutable content-addressed artifact metadata and parent lineage.
- `checkpoint.mjs` — deterministic semantic checkpoint projection and bounded active context.
- `gates.mjs` — explicit experimental/noncanonical/canonical promotion gates.
- `regression.mjs` — stable defect records and replay outcomes.
- `provider-adapter.mjs` — secret-free injected-provider boundary plus explicit capability negotiation.
- `scheduler.mjs` — bounded concurrency, retry, budget, branch, resume, and checkpoint execution.
- `prompts.mjs` — executable validation of the 12 role prompt contracts.

## 1000-call qualification

The checked-in example manifest defines a hard **1000 logical-call ceiling** with parallelism capped at 8. The CLI may narrow these values but cannot widen them.

```bash
node tools/run-image-society.mjs --mock
node tools/run-image-society.mjs --mock --calls 100 --parallelism 4
```

The current CLI deliberately executes only the deterministic `mock` provider. Real provider execution must be injected by an authorized runtime and should advance through the runbook qualification ladder rather than silently reusing mock evidence.

`MOCK_STRUCTURAL_ORCHESTRATION_ONLY != REAL_PROVIDER_QUALITY_OR_COST_EVIDENCE`

## Provider capability negotiation

Desired geometry is intent-level data rather than a hardcoded global size list.

A provider adapter must either:

1. support the requested dimensions/aspect ratio/format/variant count directly;
2. fail explicitly with `failed-capability`; or
3. when the intent explicitly allows it, apply a named adapter fallback with recorded requested and executed geometry.

Silent substitution is prohibited. A capability failure occurs before provider execution and does not spend provider retries.

The current browser `Conscience64ImageGen` size list remains one transport's capabilities, not Image Society's architecture ceiling.

## Deterministic scheduling

Logical call count is independent of retry count. Calls may execute concurrently in bounded waves, but terminal events are appended in logical-call order so provider completion timing does not scramble checkpoint identity.

Resume uses preserved terminal records and continues at the next logical call ID. `executeBatch` and `executeRun` share the same scheduling path.

## Checkpoints

A checkpoint is a content-addressed projection of full ledger history, not a replacement for it. Its semantic state retains:

- ledger digest and source-event links;
- accepted/candidate/rejected artifact identities;
- active constraints;
- unresolved defects;
- successful and failed correction patterns;
- authority/accessibility/continuity notes;
- budget evidence.

Wall-clock creation time is excluded from the semantic digest. Active context is bounded separately while retaining checkpoint/source identities.

## Roles

The role package defines stable contracts for:

1. Director
2. Scene Builder
3. Generator
4. Repairer
5. Semantic Critic
6. Composition Critic
7. Continuity Critic
8. Accessibility Critic
9. Authority Critic
10. Provenance Keeper
11. Integrator
12. Summarizer

Roles are responsibilities, not independent sources of truth. Multiple roles backed by the same model do not become independent corroboration.

## Reality Canon

For MMO/Red Wilds work, visual reasoning preserves the hierarchy:

```text
ordinary physical world
-> observed natural world
-> scientific observation reference
-> processed scientific visualization
-> game reconstruction
-> anomaly / fantasy
```

Generated people are not presented as real identifiable people. Game reconstructions are not presented as photographs, telescope exposures, or scientific measurements.

## Files

- `RUNBOOK_1000_CALLS.md` — operational wave/budget/recovery procedure.
- `schema/image-society.v1.schema.json` — runtime-congruent interchange schema.
- `schema/run-manifest.example.json` — bounded pilot manifest.
- `prompts/role-prompts.v1.json` — role instructions and evidence boundaries.
- `prompts/production-image-profile.v1.json` — high-fidelity photoreal production profile with flexible geometry.
- `../docs/superpowers/specs/2026-09-14-image-society-design.md` — approved predecessor design.
- `../docs/superpowers/specs/2026-09-14-image-society-runtime-reconciliation.md` — implementation-derived refinements.

## Verification

```bash
node --test image-society/*.test.mjs
```

The suite covers canonical identities, run bounds, ledger preservation, event defaults, artifact lineage, Visual Difference, Continuity Packs, checkpoints, promotion gates, regression records, role contracts, explicit capability negotiation, resumability, concurrency, schema/runtime congruence, and a deterministic 1000-call scale exercise.

The playground CI also enforces the CLI hard ceiling, re-runs the existing image-generation transport test, and then runs the existing MMO/ECS/visual-carrier/Renderer Society/Reality Canon and browser contracts.

The qualification sequence for a real provider remains:

```text
1000-call deterministic mock
-> 8 real calls
-> 32 real calls
-> 100 real calls
-> 250 real calls
-> 1000-call ceiling
```

Progression requires new evidence at each scale.
