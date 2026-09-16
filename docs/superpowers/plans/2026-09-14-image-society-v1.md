# Conscience64 Image Society v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bounded, replayable Image Society v1 capable of simulating and later executing up to 1000 image-model/provider interactions while preserving provenance, checkpoints, correction lineage, accessibility/authority gates, and the existing ECS/Reality Canon boundaries.

**Architecture:** Add a focused Node.js ESM subsystem under `image-society/`. The subsystem is event-sourced: immutable logical events reference content-addressed artifact metadata, checkpoint projections compact active state, and a bounded scheduler calls an injected provider adapter without storing credentials. It composes the existing image-generation transport and Renderer Society rather than changing ECS or visual-carrier authority.

**Tech Stack:** Node.js ESM, built-in `node:crypto`, built-in `node:test` / `node:assert`, canonical JSON, JSON Schema documents, existing GitHub Actions playground verification.

**Spec:** `docs/superpowers/specs/2026-09-14-image-society-design.md`

## Global Constraints

- Do not modify `play/mmo/simple/core.mjs`.
- Do not modify `play/mmo/simple/ecs.mjs`.
- Do not rewrite historical Visual Carrier v2, Renderer Society, smoke-video, or visual-sample artifacts.
- Preserve `GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON`.
- Preserve `VIDEO_RENDER != WORLD_AUTHORITY` and `VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON`.
- Preserve `OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`.
- Model/provider consensus cannot satisfy the human promotion gate.
- Provider secrets must never be persisted by Image Society.
- Every substantial run must enforce explicit call, concurrency, retry, branch, token, and cost bounds.
- Failure records must remain visible; failed calls cannot silently disappear from run accounting.
- Same preserved ledger records must produce byte-identical canonical checkpoint JSON and checkpoint SHA-256.
- Nondeterministic provider output must never be labeled byte-deterministic merely because the request is replayable.
- The initial real-provider adapter must be dependency-injected; tests use a mock provider and do not spend external calls.

---

## File Structure

Create the following focused surfaces:

```text
image-society/
  README.md                         # subsystem boundary and operator mapping
  canonical.mjs                    # canonical JSON + SHA-256 helpers
  contracts.mjs                    # validation and constructors for v1 records
  ledger.mjs                       # append/replay logical event ledger
  artifacts.mjs                    # content-addressed artifact metadata registry
  checkpoint.mjs                   # checkpoint projection / active-context compaction
  gates.mjs                        # promotion and review gates
  regression.mjs                   # defect/regression corpus
  scheduler.mjs                    # bounded batch/run execution
  provider-adapter.mjs             # injected provider/transport boundary
  prompts.mjs                      # loads/validates role prompt templates
  image-society.test.mjs           # contract/unit tests
  scheduler.test.mjs               # bounded-run / recovery tests
  scale.test.mjs                   # 1000-call mock simulation
  schema/
    image-society.v1.schema.json   # machine-readable record schemas
    run-manifest.example.json      # bounded run example
  prompts/
    role-prompts.v1.json           # role request/response templates
  RUNBOOK_1000_CALLS.md            # operations blueprint

tools/
  run-image-society.mjs            # local/mock run entrypoint
```

No production file in v1 should exceed the responsibility implied by its filename.

---

### Task 1: Lock canonical identity and run-manifest validation

**Files:**
- Create: `image-society/canonical.mjs`
- Create: `image-society/contracts.mjs`
- Create: `image-society/image-society.test.mjs`

**Interfaces:**
- Consumes: plain JSON-compatible values and run-manifest objects.
- Produces: `canonicalJson(value): string`, `sha256Canonical(value): string`, `validateRunManifest(value): object`, and immutable normalized manifest data.

- [ ] **Step 1: Write the failing canonicalization and manifest tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, sha256Canonical } from './canonical.mjs';
import { validateRunManifest } from './contracts.mjs';

test('canonicalJson is insensitive to object key insertion order', () => {
  const a = { z: 2, a: { y: 4, x: 3 } };
  const b = { a: { x: 3, y: 4 }, z: 2 };
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(sha256Canonical(a), sha256Canonical(b));
});

test('run manifest rejects an unbounded call budget', () => {
  assert.throws(() => validateRunManifest({ run_id: 'r1', max_calls: 0 }), /max_calls/);
});

test('run manifest accepts a bounded 1000-call configuration', () => {
  const out = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'pilot-1000',
    max_calls: 1000,
    max_parallelism: 8,
    max_retries_per_call: 2,
    checkpoint_every_events: 25,
    summary_every_events: 10,
    max_branches: 32,
    promotion_mode: 'manual',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(out.max_calls, 1000);
  assert.equal(out.promotion_mode, 'manual');
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
node --test image-society/image-society.test.mjs
```

Expected: FAIL because `canonical.mjs` and `contracts.mjs` do not yet exist.

- [ ] **Step 3: Implement minimal recursive canonicalization and SHA-256**

`canonical.mjs` must recursively sort object keys, preserve array order, reject unsupported cyclic/non-JSON values, and hash UTF-8 canonical JSON with SHA-256.

- [ ] **Step 4: Implement strict bounded run-manifest normalization**

`validateRunManifest` must require a non-empty `run_id`, integer `max_calls` in `1..100000`, integer `max_parallelism` in `1..64`, integer retries in `0..10`, positive checkpoint/summary intervals, positive `max_branches`, and enumerated modes. Optional token/cost budgets must be finite non-negative numbers.

- [ ] **Step 5: Run the tests and verify GREEN**

Run:

```bash
node --test image-society/image-society.test.mjs
```

Expected: all Task 1 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add image-society/canonical.mjs image-society/contracts.mjs image-society/image-society.test.mjs
git commit -m "feat: add Image Society canonical contracts"
```

---

### Task 2: Implement append-only logical event ledger

**Files:**
- Modify: `image-society/contracts.mjs`
- Create: `image-society/ledger.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Consumes: normalized `ImageTurnEvent` records.
- Produces: `createLedger(runManifest)`, `appendEvent(ledger, event)`, `eventsForBranch(ledger, branchId)`, `replayLedger(events)`, and `ledgerDigest(ledger)`.

- [ ] **Step 1: Add failing ledger tests**

```js
import { createLedger, appendEvent, eventsForBranch, ledgerDigest } from './ledger.mjs';

test('ledger assigns monotonic branch sequence and preserves failed events', () => {
  const ledger = createLedger({ run_id: 'r1', max_calls: 10 });
  appendEvent(ledger, {
    event_id: 'e1', branch_id: 'main', event_type: 'generate',
    status: 'succeeded', input_artifact_ids: [], output_artifact_ids: ['a1']
  });
  appendEvent(ledger, {
    event_id: 'e2', branch_id: 'main', event_type: 'critique',
    status: 'failed-provider', input_artifact_ids: ['a1'], output_artifact_ids: []
  });
  const rows = eventsForBranch(ledger, 'main');
  assert.deepEqual(rows.map(x => x.sequence_no), [1, 2]);
  assert.equal(rows[1].status, 'failed-provider');
});

test('ledger rejects duplicate event IDs', () => {
  const ledger = createLedger({ run_id: 'r1', max_calls: 10 });
  const row = { event_id: 'e1', branch_id: 'main', event_type: 'plan', status: 'succeeded' };
  appendEvent(ledger, row);
  assert.throws(() => appendEvent(ledger, row), /duplicate event_id/);
});
```

- [ ] **Step 2: Verify RED**

Run the focused test file; expected failure is missing ledger implementation.

- [ ] **Step 3: Implement event validation**

Require known event types and terminal states. Preserve `parent_event_ids`, input/output artifact IDs, actor/role, request/response provenance, observations, corrections, evaluation, budget evidence, and authority state without inferring missing authority.

- [ ] **Step 4: Implement append-only in-memory ledger and canonical digest**

Appending an event copies and freezes its logical record. Existing event records cannot be updated in place through the public API.

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test image-society/image-society.test.mjs
git add image-society/contracts.mjs image-society/ledger.mjs image-society/image-society.test.mjs
git commit -m "feat: add append-only Image Society ledger"
```

---

### Task 3: Add artifact lineage, Visual Difference Contracts, and Continuity Packs

**Files:**
- Create: `image-society/artifacts.mjs`
- Modify: `image-society/contracts.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Produces: `createArtifactRegistry()`, `registerArtifact(registry, artifact)`, `getArtifact(registry, id)`, `validateVisualDifference(value)`, and `validateContinuityPack(value)`.

- [ ] **Step 1: Add failing content-address and correction tests**

```js
import { createArtifactRegistry, registerArtifact } from './artifacts.mjs';
import { validateVisualDifference, validateContinuityPack } from './contracts.mjs';

test('artifact registry preserves parent lineage and rejects ID collision with different hash', () => {
  const r = createArtifactRegistry();
  registerArtifact(r, { artifact_id: 'a1', sha256: 'a'.repeat(64), parent_artifact_ids: [] });
  registerArtifact(r, { artifact_id: 'a2', sha256: 'b'.repeat(64), parent_artifact_ids: ['a1'] });
  assert.throws(() => registerArtifact(r, { artifact_id: 'a1', sha256: 'c'.repeat(64) }), /collision/);
});

test('visual difference requires intended and unintended delta fields', () => {
  assert.throws(() => validateVisualDifference({ before_artifact_id: 'a1' }), /requested_delta/);
});

test('continuity pack distinguishes protected and variable traits', () => {
  const pack = validateContinuityPack({
    pack_id: 'char-main-v1', version: '1', entities: [{
      entity_id: 'hero', protected_traits: ['identity'], variable_traits: ['jacket color']
    }]
  });
  assert.deepEqual(pack.entities[0].protected_traits, ['identity']);
});
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement artifact registry and validators**

Artifact bytes are not stored by this module. It stores metadata and byte/content hashes supplied by trusted artifact storage surfaces.

- [ ] **Step 4: Verify GREEN and commit**

```bash
node --test image-society/image-society.test.mjs
git add image-society/artifacts.mjs image-society/contracts.mjs image-society/image-society.test.mjs
git commit -m "feat: add image artifact and continuity contracts"
```

---

### Task 4: Implement checkpoint projection and bounded active context

**Files:**
- Create: `image-society/checkpoint.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Produces: `buildCheckpoint({ledger, artifacts, previousCheckpoint, budget})`, `checkpointDigest(checkpoint)`, and `buildActiveContext(checkpoint, options)`.

- [ ] **Step 1: Add failing checkpoint determinism tests**

```js
import { buildCheckpoint, checkpointDigest, buildActiveContext } from './checkpoint.mjs';

test('same preserved ledger state yields byte-identical checkpoint identity', () => {
  const a = buildCheckpoint(fixtureState());
  const b = buildCheckpoint(fixtureState());
  assert.equal(checkpointDigest(a), checkpointDigest(b));
});

test('active context keeps unresolved defects and source event IDs', () => {
  const cp = buildCheckpoint(fixtureStateWithDefect('face-drift'));
  const active = buildActiveContext(cp, { maxRecentCorrections: 8 });
  assert.ok(active.unresolved_issues.some(x => x.defect_id === 'face-drift'));
  assert.ok(active.source_event_ids.length > 0);
});
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement pure checkpoint projection**

Checkpoint content excludes wall-clock creation time from its hashed semantic payload; timestamps may exist in an envelope outside the canonical state digest.

- [ ] **Step 4: Implement active-context compaction**

Keep current objective, candidate IDs, continuity versions, unresolved defects, recent successful/failed correction patterns, authority/accessibility notes, budget consumption, and checkpoint identity. Preserve source event links.

- [ ] **Step 5: Verify GREEN and commit**

---

### Task 5: Implement promotion and authority/accessibility gates

**Files:**
- Create: `image-society/gates.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Produces: `evaluatePromotionGate(candidate, reviews, options)` returning `{allowed, blockers, warnings}`.

- [ ] **Step 1: Add failing gate tests**

```js
import { evaluatePromotionGate } from './gates.mjs';

test('model consensus cannot promote without explicit human approval', () => {
  const result = evaluatePromotionGate(
    { artifact_id: 'a1', status: 'authority-reviewed-candidate' },
    { provenance: 'pass', continuity: 'pass', accessibility: 'pass', authority: 'pass', model_votes: 100 },
    { target: 'mmo-production-canon', human_approval: null }
  );
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('human-approval-required'));
});

test('critical unresolved defects block promotion', () => {
  const result = evaluatePromotionGate(
    { artifact_id: 'a1', critical_unresolved: ['unsupported-science-claim'] },
    { provenance: 'pass', continuity: 'pass', accessibility: 'pass', authority: 'pass' },
    { target: 'mmo-production-canon', human_approval: { actor_id: 'human', approved_at: '2026-09-14T00:00:00Z' } }
  );
  assert.equal(result.allowed, false);
});
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement explicit target-dependent gate rules**

At minimum distinguish `experimental`, `accepted-noncanonical`, and `mmo-production-canon` targets. The canonical target requires complete provenance, applicable continuity/accessibility/authority reviews, no critical unresolved defects, explicit human approval, and a clear Reality Canon classification.

- [ ] **Step 4: Verify GREEN and commit**

---

### Task 6: Add the Regression Corpus

**Files:**
- Create: `image-society/regression.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Produces: `createRegressionCorpus()`, `recordDefect(corpus, defect)`, `recordReplay(corpus, result)`, `queryDefects(corpus, filter)`.

- [ ] **Step 1: Add failing tests for defect preservation and replay history**

```js
import { createRegressionCorpus, recordDefect, recordReplay, queryDefects } from './regression.mjs';

test('regression corpus preserves successful and failed correction history', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, { defect_id: 'hand-face-drift', category: 'continuity', source_event_ids: ['e4'] });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e8', result: 'failed' });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e9', result: 'passed' });
  assert.deepEqual(queryDefects(corpus, { category: 'continuity' })[0].replays.map(x => x.result), ['failed', 'passed']);
});
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement minimal corpus with immutable replay entries**

- [ ] **Step 4: Verify GREEN and commit**

---

### Task 7: Implement provider adapter and bounded scheduler

**Files:**
- Create: `image-society/provider-adapter.mjs`
- Create: `image-society/scheduler.mjs`
- Create: `image-society/scheduler.test.mjs`

**Interfaces:**
- `createProviderAdapter({name, generate})`
- `executeBatch({manifest, plan, ledger, provider, checkpointState, signal})`
- `executeRun({manifest, planner, ledger, provider, onCheckpoint, signal})`

- [ ] **Step 1: Write failing bounded scheduler tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRun } from './scheduler.mjs';
import { createProviderAdapter } from './provider-adapter.mjs';

test('scheduler never exceeds max_calls', async () => {
  let calls = 0;
  const provider = createProviderAdapter({
    name: 'mock',
    async generate(request) { calls += 1; return { images: [{ url: `mock://${calls}` }] }; }
  });
  const result = await executeRun({
    manifest: boundedManifest({ max_calls: 17, max_parallelism: 4 }),
    planner: endlessGeneratePlanner(),
    provider
  });
  assert.equal(calls, 17);
  assert.equal(result.call_count, 17);
});

test('scheduler records retry exhaustion instead of dropping the call', async () => {
  const provider = createProviderAdapter({ name: 'fail', async generate() { throw new Error('provider down'); } });
  const result = await executeRun({
    manifest: boundedManifest({ max_calls: 1, max_retries_per_call: 2 }),
    planner: oneGeneratePlanner(),
    provider
  });
  assert.equal(result.call_count, 1);
  assert.equal(result.terminal_events[0].status, 'retry-exhausted');
  assert.equal(result.terminal_events[0].attempt_count, 3);
});
```

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement the injected provider adapter**

The adapter stores provider name/capabilities only. It never accepts or persists secret fields. A browser integration may wrap `globalThis.Conscience64ImageGen.generate`; a server/runtime integration may wrap an admitted renderer/provider function.

- [ ] **Step 4: Implement bounded scheduling**

Requirements:

- `max_calls` counts logical provider/model calls, not retries;
- retries are capped independently and recorded;
- concurrency never exceeds `max_parallelism`;
- cancellation produces terminal `cancelled` evidence;
- budget stop conditions are checked before admitting another logical call;
- planner output cannot override manifest hard bounds;
- checkpoint callback runs at configured event intervals;
- promotion is never executed by scheduler consensus.

- [ ] **Step 5: Verify GREEN and commit**

---

### Task 8: Prove 1000-call structural scale with a mock provider

**Files:**
- Create: `image-society/scale.test.mjs`

**Interfaces:**
- Consumes scheduler/provider/ledger/checkpoint interfaces from Tasks 1–7.
- Produces executed evidence for exactly 1000 bounded mock logical calls without external provider spending.

- [ ] **Step 1: Write the scale test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRun } from './scheduler.mjs';

// Test timeout may be increased locally if CI hardware is slow.
test('1000-call mock run preserves accounting and bounded context', async () => {
  const result = await executeRun({
    manifest: boundedManifest({
      run_id: 'scale-1000',
      max_calls: 1000,
      max_parallelism: 16,
      checkpoint_every_events: 25,
      summary_every_events: 10
    }),
    planner: deterministicThousandCallPlanner(),
    provider: deterministicMockProvider()
  });
  assert.equal(result.call_count, 1000);
  assert.equal(result.terminal_events.length, 1000);
  assert.equal(result.missing_terminal_records.length, 0);
  assert.ok(result.checkpoints.length >= 40);
  assert.ok(result.active_context.source_event_ids.length < 250);
});
```

- [ ] **Step 2: Verify RED if any scale-path assumption is missing**

This test may expose scheduler/checkpoint defects even after unit tests pass. Treat those as implementation defects, not reasons to weaken assertions.

- [ ] **Step 3: Make only the minimal fixes needed for GREEN**

- [ ] **Step 4: Run the scale test twice and compare final semantic checkpoint digest**

```bash
node --test image-society/scale.test.mjs
node --test image-society/scale.test.mjs
```

Expected: both runs PASS and the deterministic mock run reports the same final checkpoint semantic digest.

- [ ] **Step 5: Commit**

---

### Task 9: Add prompt/schema package and validate role envelopes

**Files:**
- Create: `image-society/schema/image-society.v1.schema.json`
- Create: `image-society/schema/run-manifest.example.json`
- Create: `image-society/prompts/role-prompts.v1.json`
- Create: `image-society/prompts.mjs`
- Modify: `image-society/image-society.test.mjs`

**Interfaces:**
- Produces stable prompt-template IDs and request/response contracts for Director, Scene Builder, Generator, Repairer, Semantic Critic, Composition Critic, Continuity Critic, Accessibility Critic, Authority Critic, Provenance Keeper, Integrator, and Summarizer.

- [ ] **Step 1: Add failing template tests**

Assert each required role has a unique stable ID, explicit input contract, explicit output contract, evidence boundary, stop condition, and invariant block.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Add machine-readable schemas/templates**

Templates must instruct critics to separate observation, inference, unsupported interpretation, and recommendation. Generator/Repairer templates must not grant authority. Integrator must not promote without a passed gate record.

- [ ] **Step 4: Verify GREEN and commit**

---

### Task 10: Add runbook, local entrypoint, and documentation

**Files:**
- Create: `image-society/RUNBOOK_1000_CALLS.md`
- Create: `image-society/README.md`
- Create: `tools/run-image-society.mjs`
- Create or modify: `.github/workflows/playground.yml` only if Image Society checks belong in the existing playground verifier; otherwise create a narrowly scoped workflow using repository-permitted actions.

**Interfaces:**
- `node tools/run-image-society.mjs --mock --calls 1000`
- optional real runtime injection through a provider adapter; no secret flags are written to repository files.

- [ ] **Step 1: Add a failing CLI smoke test or invoke the CLI against missing implementation before adding the entrypoint**

Expected initial failure: module/entrypoint missing.

- [ ] **Step 2: Implement `--mock`, `--calls`, `--parallelism`, and `--resume-checkpoint` parsing**

Hard bounds from the run manifest win over CLI requests. `--calls 1000` creates a 1000-call upper bound, not permission to ignore stop conditions.

- [ ] **Step 3: Document the exact 1000-call wave model, incident handling, checkpoint/recovery procedure, promotion procedure, and cost controls**

- [ ] **Step 4: Document relation to existing transport and Renderer Society**

- [ ] **Step 5: Run all Image Society tests**

```bash
node --test image-society/*.test.mjs
```

Expected: PASS, including the 1000-call mock simulation.

- [ ] **Step 6: Run existing visual/ECS regression tests**

At minimum:

```bash
node --test play/mmo/simple/ecs.test.mjs
node --test play/mmo/simple/visual-carrier-v2.test.mjs
node --test play/mmo/simple/renderer-society.test.mjs
node --test play/mmo/simple/renderer-society-comparison.test.mjs
node --test play/mmo/simple/renderer-society-metamorphic.test.mjs
node tools/test-image-gen.mjs
node play/mmo/test-reality.mjs
```

Expected: all pre-existing contracts remain green.

- [ ] **Step 7: Commit**

```bash
git add image-society tools/run-image-society.mjs .github/workflows/playground.yml
git commit -m "feat: add bounded Conscience64 Image Society v1"
```

---

### Task 11: Two-pass evidence review before completion

**Files:**
- Verify only unless defects are found.

**Interfaces:**
- Produces completion evidence and explicit unresolved items.

- [ ] **Step 1: First pass — architecture and authority review**

Confirm:

- no ECS/world authority file changed;
- no historical lock/artifact was rewritten;
- provider secrets are absent;
- all promotion paths require explicit gate evidence;
- Reality Canon distinctions are represented;
- failure records remain observable;
- a 1000-call mock run is bounded and reconstructable.

- [ ] **Step 2: Second pass — adversarial omission review**

Search specifically for:

- accidental mutable predecessor records;
- call accounting that counts retries incorrectly;
- lost failures under concurrency;
- checkpoint hashes contaminated by nondeterministic timestamps;
- unbounded branches or queues;
- model-vote shortcuts around human approval;
- nondeterministic provider outputs mislabeled deterministic;
- accessibility treated only as prose rather than a gate input;
- source/reconstruction/science-image ambiguity.

- [ ] **Step 3: Run the entire relevant test set again after any correction**

- [ ] **Step 4: Record executed evidence separately from planned capability**

Do not claim real 1000-provider-call execution until it has actually occurred in an authorized runtime. The mock 1000-call test establishes structural orchestration behavior only.

## Completion Definition

Image Society v1 is complete only when:

1. all new tests pass;
2. the 1000-call mock scale test passes twice with stable checkpoint identity;
3. existing ECS, Visual Carrier v2, Renderer Society, image generation, and Reality Canon checks still pass;
4. the implementation cannot promote through model agreement alone;
5. provenance and failure evidence survive checkpoint/recovery;
6. active context is bounded independently of ledger size;
7. no real-provider or cost claim is made from mock evidence;
8. the final diff survives both review passes.
