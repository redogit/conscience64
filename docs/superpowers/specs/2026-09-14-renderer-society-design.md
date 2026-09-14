# Renderer Society Design

## Status

Approved architecture specification for extending the existing deterministic visual-carrier layer into a multi-renderer society with routing, fan-out, composable pipelines, two-tier admission, isolated execution, and content-addressed provenance.

This document defines architecture only. It does not implement renderers, registry code, routing code, execution sandboxes, or promotion logic.

## Goal

Support many independently versioned renderers and renderer pipelines downstream of sealed ECS scene-video jobs while preserving the existing authority boundary, deterministic provenance, and historical artifact lineage.

The system must permit rapid experimental rendering without allowing visual output, renderer admission, renderer agreement, or production suitability to become world authority.

## Existing Baseline

The current visual-carrier v2 layer consumes deterministic ECS `SceneVideoJobs`, selects bounded jobs, preserves ECS render intent, binds the carrier plan to recipe content by SHA-256, derives domain-separated render seeds, and seals the canonical carrier plan.

The existing authority flow is one-way:

```text
core.mjs -> ECS -> SceneVideoJobs -> sealed carrier plan -> visual recipe -> renderer/toolchain -> artifact
```

There is no reverse authority path from recipes, renderers, frames, videos, evaluations, or admission state into ECS/world state.

The renderer-society architecture extends the downstream carrier layer. It does not modify the meaning or authority of the ECS job surface.

## Non-Negotiable Invariants

- `VIDEO_RENDER != WORLD_AUTHORITY`
- `VISUAL_CARRIER != WORLD_AUTHORITY`
- `VISUAL_INTERPRETATION != WORLD_FACT`
- `VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON`
- `QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING`
- `REFERENCE_RENDERER != UNIQUE_TRUTH`
- `VISUAL_AGREEMENT != WORLD_AUTHORITY`
- `PROMOTION_CHANGES_TRUST_CLASSIFICATION_NOT_ARTIFACT_HISTORY`
- Renderer execution MUST NOT mutate ECS/world authority.
- Renderer discovery MUST NOT imply admission.
- Renderer success MUST NOT imply promotion.
- Renderer failure MUST remain visible as evidence.
- Historical artifacts MUST retain the renderer, pipeline, admission, and toolchain identities that existed at execution time.

## Architectural Overview

```text
ECS/world authority
        |
        v
sealed carrier job
        |
        +--> visual recipe
        |
        +--> render request
                |
                v
          routing policy
                |
                v
         renderer registry
                |
          route / fan-out
                |
                v
     isolated renderer execution
        |                 |
        |                 +--> complete renderer
        |                 +--> composable pipeline
        |
        v
stage/artifact provenance
        |
        v
evaluation and comparison
        |
        v
renderer governance
(admit / trust / reference / production-candidate / suspend)

No governance or artifact edge writes back into ECS/world authority.
```

## 1. Renderer Registry

The registry is a versioned catalog of render capabilities rather than a flat list of executable names.

### 1.1 Registry Entry Kinds

A registry entry is exactly one of:

1. `complete-renderer` — an end-to-end implementation capable of producing a carrier artifact from a sealed render input;
2. `stage` — a bounded transformation inside a composable render pipeline;
3. `pipeline` — an ordered composition of immutable stage identities and versions.

Examples of complete renderers include a headless Blender/Cycles implementation, an Unreal-based implementation, a procedural renderer, a neural renderer, or future implementations that do not yet exist.

Example stage capabilities include:

- scene construction;
- geometry;
- materials;
- lighting;
- character rendering;
- motion;
- atmosphere/effects;
- accessibility transforms;
- diagnostic overlays;
- post-processing;
- encoding.

### 1.2 Stable Identity

Every registry entry has a stable logical ID plus an immutable versioned manifest.

A logical ID such as:

```text
renderer:blender-cycles-reference
```

is not sufficient provenance by itself. An execution MUST also bind to the exact manifest content digest and version.

### 1.3 Minimum Manifest Fields

A renderer, stage, or pipeline manifest records at minimum:

- stable ID;
- version;
- kind (`complete-renderer`, `stage`, `pipeline`);
- discovery tier;
- governance classifications;
- capabilities;
- accepted input contracts;
- produced output contracts;
- determinism declaration;
- resource class declarations;
- toolchain/container identity requirements;
- authority: `none`;
- manifest SHA-256.

### 1.4 Pipeline Identity

A composable pipeline identity is content-addressed over its ordered composition.

Conceptually:

```text
pipeline identity = SHA256(
  ordered stage identities
  + exact stage versions
  + stage manifest digests
  + stage parameters
)
```

Changing one stage or one stage parameter creates a distinct pipeline identity without changing the ECS job identity.

## 2. Two-Tier Discovery and Admission

The registry uses the approved two-tier model.

### 2.1 Experimental Pool

Conforming manifests may be auto-discovered into the `experimental` pool.

Experimental means only that the implementation is visible and eligible for explicitly experimental execution. It does not mean the implementation is trusted, admitted, reproducible, safe for ordinary routing, or suitable for production.

Experimental implementations may fail conformance or reproducibility tests and remain discoverable as long as their actual state is represented accurately.

### 2.2 Admitted Pool

Normal trusted/reference/production-candidate routing uses only admitted implementations unless a render request explicitly permits experimental candidates.

Admission is evidence-based and reversible.

Admission does not confer world authority.

## 3. Governance Classification

Admission state and usage classification are separate concepts.

A renderer can be admitted without being a reference renderer or production candidate.

### 3.1 Lifecycle Evidence States

The evidence lifecycle is:

```text
discovered -> experimental -> tested -> admitted
```

After admission, classifications may branch:

```text
                  +--> reference
admitted -> trusted
                  +--> production-candidate
```

`reference` and `production-candidate` are independent classifications. An implementation can be either, both, or neither.

### 3.2 Experimental to Tested

Requires evidence for:

- manifest/schema validity;
- capability declaration checks;
- malformed-input behavior;
- deterministic seed handling where declared;
- provenance emission;
- no ECS/world write-back.

### 3.3 Tested to Admitted

Additionally requires:

- successful bounded execution set;
- resource limits documented;
- output hashes captured;
- failure semantics documented;
- asset/license provenance appropriate for the execution context;
- measured reproducibility class rather than assumed reproducibility.

### 3.4 Admitted to Trusted

Requires repeated successful execution across more than one meaningful scene/perspective class, not merely one Mercer demonstration.

### 3.5 Trusted to Reference

Reference renderers are evidence instruments and require stronger guarantees:

- frozen toolchain identity;
- demonstrated repeatability;
- stable output semantics;
- deterministic failure behavior where practical;
- complete provenance capsule;
- explicit version pinning;
- documented long-term regeneration path.

Multiple reference renderers may coexist.

Agreement between independent reference renderers is evidence about carrier stability or interpretation overlap, not proof of world truth.

### 3.6 Production-Candidate Classification

Production candidacy measures operational suitability rather than scientific reproducibility alone.

Relevant evidence includes:

- acceptable latency;
- acceptable cost;
- scalability;
- available hardware/runtime support;
- accessibility requirements;
- platform portability;
- operational reliability.

### 3.7 Suspension and Regression

Admission and classification are reversible.

An implementation may be suspended or demoted if behavior changes, dependencies drift, provenance is invalidated, security boundaries fail, reproducibility claims weaken, or new evidence contradicts prior classification.

Historical artifacts are never rewritten when governance state changes.

## 4. Render Requests

A render request describes desired carrier properties. It does not describe world truth.

A render request references:

- sealed ECS job identity/digest;
- visual recipe identity/digest;
- requested intent;
- capability requirements;
- determinism requirements;
- accessibility requirements;
- resource/budget class;
- latency class;
- experimental-admission policy;
- fan-out mode.

Initial supported intents are:

- `reference-deterministic`;
- `photoreal-cinematic`;
- `stylized`;
- `diagnostic`;
- `accessibility`;
- `fast-preview`;
- `research-experimental`.

These intents are carrier-routing hints only.

## 5. Routing Policy

Routing determines candidate eligibility.

A routing policy filters registry entries by declared and admitted evidence, including:

- capability compatibility;
- experimental/admitted tier;
- trusted/reference/production-candidate classifications;
- determinism requirement;
- resource/budget class;
- latency class;
- allowed execution surface;
- accessibility requirements;
- policy constraints specific to the render request.

Routing MUST be deterministic for the same sealed registry snapshot, policy, and render request.

The exact candidate set and its canonical ordering MUST be content-addressed.

## 6. Fan-Out

Routing determines who is eligible. Fan-out determines how many eligible candidates execute.

The initial fan-out modes are:

### 6.1 `single-best`

Execute exactly one policy-selected candidate.

Use for routine regeneration, low-cost reference work, and narrow deterministic checks.

### 6.2 `comparison-set`

Execute a bounded set of candidates.

Use for renderer comparison, photoreal/stylized contrasts, accessibility comparison, reference/preview comparison, or bounded quality exploration.

### 6.3 `society-sweep`

Execute a broader explicitly bounded pool, normally including experimental implementations.

Use for research, renderer discovery, stress testing, and quality/cost/reproducibility exploration.

A society sweep MUST still have explicit upper bounds on candidate count and resource consumption.

### 6.4 Fan-Out Provenance

A fan-out decision records:

- fan-out mode;
- routing policy digest;
- registry snapshot digest;
- eligible candidate-set digest;
- ordered selected execution identities;
- deterministic selection rationale data;
- request digest.

The system must be able to answer why every output exists.

## 7. Execution Isolation

Each complete renderer or pipeline execution runs as an isolated job over a sealed input bundle.

The bundle includes:

- sealed ECS job;
- recipe and digest;
- render request and digest;
- routing/fan-out decision and digest;
- exact renderer/pipeline manifests;
- asset manifest;
- seed bundle;
- resource limits;
- toolchain requirements.

Execution may produce artifacts, measurements, logs, stage evidence, and failure evidence.

Execution MUST NOT mutate:

- ECS/world state;
- visual recipes;
- registry manifests;
- admission records;
- historical provenance records.

## 8. Composable Pipeline Semantics

A pipeline is an ordered transformation graph, initially restricted to a linear ordered stage sequence unless a later design explicitly adds general DAG execution.

For each stage, provenance records at minimum:

- stage identity/version;
- stage manifest SHA-256;
- input SHA-256;
- canonical parameter SHA-256;
- output SHA-256 on success;
- failure record digest on failure;
- measured execution metadata.

Changing one stage SHOULD leave upstream stage identities and outputs unchanged when their sealed inputs are unchanged. All changed downstream identities must remain observable.

## 9. Deterministic Randomness

Existing carrier-v2 seed-domain separation remains the baseline.

Random decisions MUST be derived from stable identities and named domains rather than one shared sequential PRNG stream.

Initial domains include:

- layout;
- lighting;
- motion;
- materials;
- crowd.

Renderers or stages may introduce additional namespaced domains without renumbering existing domains.

Pipeline stages MUST NOT silently reuse another stage's private random stream.

## 10. Failure Semantics

Failures are evidence and remain visible in fan-out and comparison results.

Every execution ends in exactly one terminal state:

- `succeeded`;
- `failed-input`;
- `failed-capability`;
- `failed-toolchain`;
- `failed-resource`;
- `failed-render`;
- `failed-provenance`;
- `timed-out`;
- `cancelled`.

A failed execution MUST produce a content-addressed failure record when sufficient infrastructure remains available to do so.

A failed candidate MUST NOT silently disappear from a comparison set.

For partial pipeline failure, successful upstream stage evidence is retained, the failed stage is recorded, and no nonexistent downstream artifact may be represented as successful.

## 11. Provenance Graph

The renderer society generalizes the existing carrier seal into a content-addressed provenance graph.

A final artifact must be traceable through:

```text
ECS job SHA
  -> recipe SHA
  -> render-request SHA
  -> routing-policy SHA
  -> registry-snapshot SHA
  -> candidate-set SHA
  -> renderer/pipeline SHA
  -> ordered stage evidence
  -> frame/output evidence
  -> encoder manifest
  -> final artifact SHA
```

Every final artifact records at minimum:

- source repository revision where applicable;
- ECS job digest;
- recipe digest;
- render request digest;
- routing/fan-out decision digest;
- renderer or pipeline identity and manifest digest;
- admission record digest and governance state at execution time;
- toolchain/container/runtime identity;
- asset-manifest digest;
- stage evidence;
- frame/output hashes;
- encoder identity/arguments when applicable;
- final byte length and SHA-256.

Promotion after execution MUST NOT retroactively change this record.

## 12. Reproducibility Claims

The existing evidence classes remain distinct:

- `INPUT_DETERMINISTIC` — sealed inputs, manifests, assets, seeds, and commands are identical;
- `REFERENCE_RUNNER_BYTE_IDENTICAL` — repeated execution on the same pinned reference runner produced identical bytes;
- `CROSS_RUNNER_BYTE_IDENTICAL` — byte identity has been demonstrated across distinct pinned runners;
- `VISUAL_EQUIVALENCE` — outputs are judged materially similar, a weaker claim than byte identity.

Renderer manifests may declare intended determinism behavior, but governance records must report measured evidence separately from declarations.

## 13. Evaluation

Evaluation is downstream of execution and does not change world authority.

Candidate artifacts may be compared on independent dimensions including:

- adherence to sealed job camera/duration/resolution semantics;
- recipe adherence;
- visual clarity;
- human realism;
- motion quality;
- accessibility clarity;
- reproducibility;
- runtime;
- cost;
- peak resource use;
- output size;
- operational reliability.

The system MUST NOT collapse these dimensions into one universal renderer-truth score.

A renderer may optimize one dimension while performing poorly on another.

## 14. Resource and Cost Evidence

Where measurable and reliable, every execution records:

- wall-clock runtime;
- CPU time;
- GPU/device identity;
- peak memory;
- disk/output bytes;
- renderer samples/iterations where meaningful;
- external-service cost when applicable;
- energy measurements when available and trustworthy.

Resource evidence informs routing and production suitability but does not affect world authority.

## 15. Conformance Testing

Every renderer or stage receives a common minimum conformance suite covering:

1. manifest/schema validity;
2. capability declaration consistency;
3. stable identity/version behavior;
4. deterministic canonical configuration;
5. sealed-input preservation;
6. no ECS/world mutation;
7. seed-domain behavior;
8. success provenance;
9. failure provenance;
10. malformed-input handling;
11. resource-limit handling;
12. admission-state independence.

Failing conformance does not require deletion from the experimental pool. It prevents unsupported promotion.

## 16. Metamorphic and Differential Tests

Required architectural tests include:

### Renderer mutation

```text
change renderer only
=> ECS/job hash unchanged
=> renderer/pipeline execution identity changes
```

### Recipe mutation

```text
change recipe
=> recipe/carrier/execution identity changes
=> ECS/job identity unchanged
```

### Stage mutation

```text
change one downstream stage
=> unaffected upstream stage identities remain unchanged
=> changed stage and downstream identities change
```

### Seed-domain extension

```text
add a new seed domain
=> existing seed-domain outputs unchanged
```

### Governance promotion

```text
promote experimental/admitted renderer
=> prior artifact hashes unchanged
=> prior execution provenance unchanged
=> only current governance classification changes
```

### Differential comparison

Independent renderers may render the same sealed job and recipe. Differences are observations to evaluate, not automatic proof that one output is world truth.

## 17. Renderer-Society Health

Registry health may expose multidimensional operational metrics such as:

- registered implementation count;
- experimental count;
- admitted count;
- suspended count;
- successful and failed execution counts;
- reference replay success rate;
- median runtime;
- median output size;
- capability coverage;
- unserved capability requests.

No single universal renderer score is permitted by this design.

## 18. Initial Migration From Carrier V2

The current `renderer` string in the v2 carrier plan becomes an explicit renderer or pipeline reference resolved through a versioned registry snapshot.

Migration MUST preserve historical v2 plans as valid historical artifacts. Existing sealed plan digests are not rewritten.

New plans use the registry architecture; old plans remain interpretable under their original schema.

The first implementation should preserve backward compatibility at the data boundary rather than modifying historical locks.

## 19. Initial Renderer Families

The architecture should be able to represent, without privileging any as truth:

- deterministic reference renderer;
- high-quality photoreal renderer;
- fast photoreal preview renderer;
- stylized renderer;
- cinematic renderer;
- diagnostic renderer;
- accessibility renderer/pipeline stage;
- simulation-oriented renderer;
- procedural renderer;
- neural/generative experimental renderer;
- future renderer classes not currently known.

The registry is extensible by manifest rather than by hard-coded renderer-name enumeration.

## 20. First Bounded Implementation Target

The first implementation after this specification should remain bounded to the existing Mercer & Red Street three-perspective experiment.

It should demonstrate:

- a registry with at least one admitted/reference-compatible implementation and at least one experimental implementation;
- one complete-renderer entry;
- one composable pipeline made from multiple stages;
- deterministic routing over a sealed registry snapshot;
- `single-best` and bounded `comparison-set` fan-out;
- preserved ECS/job identity across renderer changes;
- content-addressed fan-out and pipeline provenance;
- explicit failure records;
- no changes to ECS/world authority;
- no promotion of rendered output into production visual canon.

A `society-sweep` executor may be specified in the implementation interfaces but should not be exercised broadly until resource bounds and the smaller comparison-set behavior are verified.

## 21. Out of Scope for the First Implementation

The following are intentionally deferred:

- changing ECS or `core.mjs` authority;
- declaring production visual canon;
- automatic visual-quality promotion;
- a universal renderer score;
- unrestricted unbounded fan-out;
- general DAG pipeline execution beyond ordered stage composition;
- remote untrusted renderer execution without a separate security design;
- replacing or rewriting PR #48 smoke artifacts or existing carrier-v2 historical seals.

## Acceptance Criteria for the Architecture

The architecture is considered preserved when an implementation can show all of the following simultaneously:

1. one sealed ECS job can route to one or many eligible renderer executions;
2. complete renderers and composed pipelines use the same registry/governance surface;
3. experimental renderers are discoverable without becoming normally trusted;
4. admitted/trusted/reference/production classifications are evidence-backed and reversible;
5. changing renderer, recipe, stage, routing policy, or registry snapshot changes downstream provenance without changing ECS job identity;
6. failed renderers remain represented in execution evidence;
7. promotion changes governance state but does not rewrite artifact history;
8. execution cannot write back into ECS/world authority;
9. historical carrier-v2 plans remain valid and interpretable;
10. quality, reproducibility, accessibility, cost, and runtime remain independent evaluation dimensions.
