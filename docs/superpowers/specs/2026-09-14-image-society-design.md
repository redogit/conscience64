# Conscience64 Image Society Design

## Status

Approved architecture specification for long-horizon, provenance-preserving image generation, critique, correction, comparison, accessibility review, continuity review, and promotion within Conscience64.

This architecture is intended for bounded runs that may contain hundreds or thousands of model/provider calls. It does **not** make generated images, repeated model agreement, critique consensus, or aesthetic preference into world authority.

## Goal

Support high-volume iterative image work while preserving deterministic reconstruction where available, explicit uncertainty where determinism is unavailable, complete provenance, bounded resource use, accessibility, human review, rollback, and the existing Reality Canon / ECS authority boundaries.

## Existing Baseline

Image Society composes existing Conscience64 surfaces rather than replacing them:

- `space-lens-image-gen.js` remains the provider-agnostic generation transport and request normalizer.
- Visual Carrier v2 remains the deterministic carrier layer downstream of ECS `SceneVideoJobs`.
- Renderer Society remains the governance and routing layer for renderer implementations and pipelines.
- `skills/SOCIETY.md` remains the higher-level human-purpose / society / operator governance model.
- `play/mmo/REALITY_CANON.md` remains canonical for MMO world presentation and future game art.

The authority flow remains one-way:

```text
human purpose / approved intent
        |
        v
Society / Operators
        |
        v
ECS or other authoritative source state
        |
        v
sealed visual intent / carrier input
        |
        v
Image Society orchestration
        |
        +--> provider image generation/edit transport
        +--> Renderer Society execution
        +--> critique/comparison/accessibility/continuity roles
        |
        v
artifacts + observations + corrections + evidence
        |
        v
review / candidate classification / explicit promotion

NO reverse authority edge into ECS/world state.
```

## Non-Negotiable Invariants

- `GENERATED != OBSERVED`
- `OBSERVED != VERIFIED`
- `VERIFIED != ACCEPTED`
- `ACCEPTED != WORLD_CANON`
- `MODEL_OUTPUT != FACT`
- `MODEL_OUTPUT != WORLD_STATE`
- `MODEL_AGREEMENT != INDEPENDENT_CORROBORATION`
- `VISUAL_AGREEMENT != WORLD_AUTHORITY`
- `QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING`
- `PROMOTION_CHANGES_TRUST_CLASSIFICATION_NOT_ARTIFACT_HISTORY`
- `IMAGE_EDIT != AUTHORITY_TO_CHANGE_SOURCE_STATE`
- `CRITIQUE != TRUTH`
- `STYLE_MATCH != SEMANTIC_MATCH`
- `HUMAN_APPROVAL != RETROACTIVE_PROVENANCE`
- `OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`
- Generation, critique, repair, and comparison MUST NOT mutate ECS/world authority.
- Every failed or rejected attempt remains evidence when preservation is technically possible.
- Repeated calls MUST be bounded by explicit call, concurrency, retry, token, and cost budgets.
- Historical events and artifacts are append-only from the logical perspective; correction creates successor events rather than rewriting predecessor evidence.

## 1. Scope

Image Society covers six classes of activity:

1. generation and variation;
2. targeted edit / repair;
3. structured critique;
4. candidate comparison;
5. continuity, accessibility, provenance, and authority review;
6. checkpointing, context compaction, replay, and promotion review.

It does not define a new model provider API. Provider execution is delegated through the existing image transport or an explicitly registered Renderer Society implementation.

## 2. Event-Sourced Interaction Ledger

The durable unit of work is an immutable logical event, not a chat turn.

Every event has:

- stable event ID;
- run ID and branch ID;
- monotonic sequence number within the branch;
- event type;
- parent event IDs;
- input artifact IDs;
- output artifact IDs;
- actor identity and role;
- intent / scene-spec references;
- request and response provenance;
- observations and corrections;
- evaluation state;
- cost/resource evidence where available;
- authority state;
- terminal status.

Initial event types:

```text
plan
generate
variation
edit
critique
compare
continuity-review
accessibility-review
authority-review
provenance-review
correction-propose
evaluate
integrate
checkpoint
summarize
promote
reject
archive
```

A provider call is normally represented by one execution event plus zero or more downstream review events.

## 3. Artifacts

An Image Society artifact is content-addressed whenever stable bytes are available.

Artifact record minimum:

- stable artifact ID;
- origin event ID;
- origin kind (`generation`, `edit`, `import`, `reference`, `derived`);
- storage/content URI or repository path where permitted;
- SHA-256 when bytes are available;
- width/height and media type when known;
- parent artifact IDs;
- provider/model/toolchain identity;
- declared and measured determinism class;
- current trust/use classification;
- accessibility metadata status;
- authority: `none` unless an external authoritative source is explicitly referenced as source evidence.

Artifact trust/use states are:

```text
experimental
candidate
accepted-noncanonical
authority-reviewed-candidate
human-approved-asset
promoted-canonical
rejected
archived
```

Promotion changes classification. It never changes predecessor bytes, hashes, prompts, or prior observations.

## 4. Intent and Scene Specification

Every generation or repair chain references an explicit intent.

Intent records include:

- purpose;
- required content;
- prohibited content;
- style constraints;
- composition constraints;
- continuity targets;
- accessibility targets;
- authority targets;
- audience/context requirements;
- success criteria;
- predecessor intent IDs.

A Scene Specification is a carrier for renderable interpretation. It may include subject placement, camera/framing, environment, materials, lighting, weather, motion hints, text requirements, realism level, and anomaly layer.

Scene Specifications are interpretation metadata, not world facts.

## 5. Roles and Society Coordination

Roles are responsibilities, not independent sources of truth. One model may instantiate multiple roles; shared-model agreement is not independent corroboration.

Initial roles:

- **Director** — decomposes intent and schedules bounded batches.
- **Scene Builder** — creates structured scene specifications.
- **Generator** — invokes the generation transport or admitted renderer.
- **Repairer** — performs targeted edits with protected-region obligations.
- **Semantic Critic** — evaluates intent fidelity.
- **Composition Critic** — evaluates framing, hierarchy, and visual focus.
- **Continuity Critic** — evaluates character/environment/style continuity.
- **Accessibility Critic** — evaluates readability, contrast, distinguishability, and descriptive metadata readiness.
- **Authority Critic** — detects unsupported world/science/reality claims.
- **Provenance Keeper** — checks traceability and required metadata.
- **Integrator** — classifies artifacts without changing source authority.
- **Summarizer** — compacts run state while preserving links to full history.

Coordination modes follow `skills/SOCIETY.md`: single worker, delegated team, or explicitly tested swarm coordination. Parallel execution alone is not called swarm behavior.

## 6. Operator Mapping

Image Society reuses the existing three Operator families instead of proliferating overlapping skills:

### `recover-bound`

Recover:

- active intent;
- authoritative source identities;
- continuity packs;
- prior checkpoint;
- unresolved defects;
- provider/renderer availability;
- resource budget;
- promotion boundary.

### `build-test`

Execute the smallest useful visual intervention:

- generate;
- edit;
- compare;
- critique;
- accessibility transform;
- bounded renderer fan-out.

Preserve the before/after evidence.

### `review-admit`

Review:

- intent fidelity;
- continuity;
- accessibility;
- provenance;
- resource cost;
- failure evidence;
- authority boundary;
- promotion eligibility.

Output `admit`, `revise`, `archive`, or `unresolved` without silently promoting world state.

## 7. Visual Difference Contract

Every targeted correction SHOULD use a Visual Difference Contract.

Minimum fields:

```text
before artifact
requested delta
protected invariants
observed intended delta
observed unintended delta
remaining error
comparison evidence
recommendation
```

For diagnostic/canonical-candidate work, prefer one-degree changes when practical so causality remains interpretable.

For exploratory art, broader changes are permitted but MUST be represented as branch/fork operations rather than falsely attributed to one isolated correction.

## 8. Continuity Packs

A Continuity Pack is versioned, content-addressed working context for recurring visual entities and environments.

It records:

- entity IDs and names;
- reference artifact IDs;
- protected traits;
- variable traits;
- environment/material rules;
- style rules;
- prohibited drift;
- source/provenance links;
- authority class of each rule;
- version and digest.

Continuity rules derived only from generated outputs remain generated working constraints unless separately admitted.

## 9. Reality Canon Integration

For MMO/game art, the Image Society MUST preserve the Reality Canon hierarchy:

1. ordinary physical world;
2. observed natural world;
3. scientific observation references;
4. processed scientific visualization;
5. game reconstruction;
6. anomaly/fantasy layer.

Required behaviors:

- believable ordinary materials, scale, weathering, light, and human activity are the default grounding surface;
- red is an identity/accent color, not an all-world baseline;
- astronomical references preserve source/provenance and distinguish processed imagery from unaided-eye appearance;
- generated people are not presented as real identifiable people;
- game reconstructions are not presented as photographs, telescope exposures, or measurements;
- fictional game weather/time/location remains distinguishable from real-world state when confusion is plausible.

## 10. Accessibility Contract

Accessibility is part of acceptance, not optional polish.

Where applicable, accepted artifacts record:

- concise alt text;
- long description or structured scene description;
- meaningful on-image text transcription;
- contrast/readability concerns;
- color-only encoding concerns;
- clutter/cognitive-load observations;
- critical regions of interest;
- known limitations.

Accessibility review may classify an artifact as visually attractive but operationally unsuitable without changing its historical evidence.

## 11. Provider and Renderer Boundary

`space-lens-image-gen.js` remains an execution transport with request normalization and secret-separation guarantees.

Image Society wraps it with ledger/provenance context; it does not move long-lived run state or authority into the browser companion.

Renderer Society remains responsible for renderer/pipeline discovery, admission, routing, fan-out, toolchain identity, execution isolation, reproducibility claims, and renderer governance.

Image Society may request Renderer Society modes:

- `single-best`;
- `comparison-set`;
- `society-sweep`.

Image Society adds iteration semantics above those executions: critique, repair, comparison, checkpoint, and promotion review.

## 12. Reproducibility Classes

Reuse Renderer Society evidence classes where applicable:

- `INPUT_DETERMINISTIC`;
- `REFERENCE_RUNNER_BYTE_IDENTICAL`;
- `CROSS_RUNNER_BYTE_IDENTICAL`;
- `VISUAL_EQUIVALENCE`.

For external generative providers that cannot promise byte-identical replay, record a separate class such as:

- `REQUEST_REPLAYABLE_OUTPUT_NONDETERMINISTIC`.

The system MUST NOT label a nondeterministic provider result deterministic merely because the request JSON is reconstructable.

## 13. Run Manifest and Budgets

Every substantial run begins with a Run Manifest.

Minimum controls:

- `max_calls`;
- `max_parallelism`;
- `max_retries_per_call`;
- `checkpoint_every_events`;
- `summary_every_events`;
- token/input-output budgets where measurable;
- cost budget where measurable;
- storage/output budget where relevant;
- branch-count limit;
- stop conditions;
- promotion mode;
- allowed providers/renderers;
- authority mode;
- accessibility mode.

The requested value `1000` is a run upper bound, not a requirement to spend calls when stop conditions have already been met.

## 14. 1000-Call Wave Model

A recommended full-scale run uses waves rather than a flat loop:

1. initialization and calibration;
2. wide exploration;
3. cluster refinement;
4. targeted repair;
5. continuity/authority hardening;
6. accessibility/usability review;
7. finalist comparison;
8. final repair/promotion review;
9. regression/summarization closure.

Each wave has explicit call ranges in the operational runbook but may terminate early if its success criteria are met.

## 15. Batch and Checkpoint Semantics

Calls are grouped into bounded batches.

After each batch:

- complete terminal event records;
- record failures and retry exhaustion;
- update active candidate set;
- summarize new distinctions;
- preserve unresolved issues;
- emit a checkpoint at configured intervals;
- compute or record checkpoint digest;
- schedule the next bounded batch.

Checkpoints are compact projections of the ledger, never replacements for it.

A checkpoint contains:

- through-sequence number;
- accepted/candidate/rejected artifact IDs;
- active constraints;
- continuity pack versions;
- unresolved defects;
- known successful correction patterns;
- known failed correction patterns;
- authority notes;
- accessibility notes;
- budget consumption;
- state digest.

## 16. Context Compaction

Full history remains addressable. Active context is intentionally small.

Active context SHOULD contain only:

- current objective;
- active branch objective;
- relevant authoritative source references;
- active continuity pack;
- current best artifacts;
- top unresolved defects;
- recent useful correction evidence;
- regression risks;
- current budgets;
- latest checkpoint identity.

Compaction MUST preserve links back to source events. A summary may omit detail from active context but may not rewrite history.

## 17. Failure Semantics

Every call ends in a terminal state such as:

```text
succeeded
failed-input
failed-policy
failed-provider
failed-toolchain
failed-resource
failed-provenance
timed-out
cancelled
retry-exhausted
```

A failed candidate remains represented in batch/run evidence.

Provider refusals or policy failures are not silently converted to alternate prompts that change user intent. A new compliant branch, when appropriate, is a new event with its own rationale.

## 18. Regression Corpus

Repeatedly observed defects become regression records, not folklore.

A regression record contains:

- stable defect ID;
- category;
- triggering artifact/event identities;
- minimum reproducible visual/request context where available;
- successful corrections, if any;
- failed corrections;
- protected invariants;
- later replay results.

Example classes:

- face drift during hand repair;
- lost required object after composition edit;
- unreadable title text after stylization;
- continuity drift across a series;
- unsupported lore introduced by a generator;
- accidental promotion without complete authority review.

## 19. Evaluation

Evaluation remains multidimensional.

Initial dimensions:

- semantic fidelity;
- composition quality;
- material/lighting credibility;
- continuity fidelity;
- accessibility/readability;
- authority consistency;
- repair stability;
- originality/diversity;
- cost/latency;
- operational reliability.

Do not collapse these into a universal truth score.

## 20. Promotion Gate

Promotion to `promoted-canonical` requires an explicit promotion event and all required gates for the target surface.

For MMO production visual canon, minimum gate:

- complete provenance capsule;
- intended-use statement;
- continuity review passed or explicitly waived with rationale;
- accessibility review passed for applicable use;
- authority review passed;
- no unresolved critical defects;
- explicit human approval identity/time;
- predecessor/candidate IDs retained;
- Reality Canon classification clear.

No number of model votes bypasses this gate.

## 21. Data Retention and Privacy

Run records use privacy minimization:

- do not store provider secrets;
- do not duplicate sensitive source content when a stable authorized reference is sufficient;
- record only metadata needed for replay/audit;
- separate public artifacts from private research inputs;
- preserve access-control classification in provenance metadata.

## 22. Security and Execution Isolation

- Provider credentials remain outside public static assets.
- External URLs and providers must pass existing trust/configuration gates.
- Renderer/provider execution receives bounded inputs and resources.
- Generated artifacts are treated as untrusted data until admitted for their intended use.
- Image metadata and filenames do not confer authority.

## 23. 1000-Call Success Criteria

A full-scale run is successful when the system can demonstrate, with evidence:

- exactly bounded call execution;
- no lost terminal call records;
- resumability from a checkpoint;
- deterministic reconstruction of the ledger/checkpoint projection from preserved records;
- preserved artifact lineage;
- preserved authority boundary;
- failures and rejected candidates remain visible;
- active context remains bounded despite long history;
- budget accounting reconciles to recorded calls where provider metrics are available;
- promotion cannot occur through model consensus alone;
- Regression Corpus can be queried for previously observed defect classes.

The run does not need to consume all 1000 calls if stop criteria are met earlier.

## 24. First Implementation Boundary

Image Society v1 should implement only:

- schemas/contracts;
- append-only local event ledger;
- content-addressed artifact metadata registry;
- checkpoint projection;
- bounded scheduler with mock transport;
- role request envelopes;
- Visual Difference Contract;
- Continuity Pack format;
- promotion gate logic;
- regression records;
- cost/token accounting hooks;
- documentation and conformance tests.

It should **not** initially implement automatic canonical promotion, a distributed cluster, provider-specific credential storage, learned universal scoring, or unbounded autonomous execution.

## 25. Compatibility

Historical Visual Carrier v2 plans, Renderer Society records, smoke-video locks, visual samples, and existing image-generation requests remain valid historical artifacts.

Image Society adds successor records. It does not rewrite predecessor evidence into the new schema.
