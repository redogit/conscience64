# Renderer Society Mercer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first bounded renderer-society control plane over the existing Mercer & Red Street visual-carrier-v2 jobs without changing ECS/world authority or historical carrier-v2 seals.

**Architecture:** Add a small data-only registry plus a deterministic control-plane module that content-addresses registry snapshots, render requests, routing decisions, fan-out selections, stage evidence, artifacts, and failures. Complete renderers and ordered pipelines share one execution surface; actual execution is supplied through isolated executor functions, while the control plane owns hashing, routing, provenance, and failure semantics. The first tests use deterministic diagnostic executors only; no output is promoted to production visual canon.

**Tech Stack:** Node.js ESM, `node:crypto`, JSON manifests, existing `visual-carrier-v2.mjs`, existing ECS scene-video jobs, GitHub Actions playground gate.

**Spec:** `docs/superpowers/specs/2026-09-14-renderer-society-design.md`

## Global Constraints

- `VIDEO_RENDER != WORLD_AUTHORITY`
- `VISUAL_CARRIER != WORLD_AUTHORITY`
- `VISUAL_INTERPRETATION != WORLD_FACT`
- `VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON`
- `QUALITY_MAY_INCREASE_WITHOUT_AUTHORITY_INCREASING`
- `REFERENCE_RENDERER != UNIQUE_TRUTH`
- `VISUAL_AGREEMENT != WORLD_AUTHORITY`
- `PROMOTION_CHANGES_TRUST_CLASSIFICATION_NOT_ARTIFACT_HISTORY`
- Renderer execution must not mutate ECS/world authority.
- Historical carrier-v2 plan digests and PR #48 smoke evidence remain unchanged.
- First implementation is Mercer & Red Street only; `society-sweep` is represented but not broadly exercised.
- Registry routing is deterministic for the same sealed registry snapshot, request, and policy.
- Quality, reproducibility, accessibility, cost, and runtime remain independent dimensions.

---

### Task 1: Lock the renderer-society contract with failing tests

**Files:**
- Create: `play/mmo/simple/renderer-society.test.mjs`
- Read: `play/mmo/simple/tools/visual-carrier-v2.mjs`
- Read: `play/mmo/simple/visual-carrier-v2.test.mjs`

**Interfaces:**
- Consumes: `buildCarrierPlan`, `sealCarrierPlan`, `sha256Canonical`, current Mercer ECS jobs.
- Produces test expectations for `loadRegistry`, `buildRenderRequest`, `routeRenderRequest`, `selectFanout`, and `executeSelection`.

- [ ] **Step 1: Write the failing registry/routing test**

Create a test that imports the not-yet-created `renderer-society.mjs`, loads `renderer-society/registry.v1.json`, builds the existing Mercer three-job carrier plan, selects the `player-pov` row, and asserts:

```js
assert.equal(snapshot.schema,'conscience64.renderer-registry-snapshot/v1');
assert.equal(snapshot.entries.length,4);
assert.equal(snapshot.entries.filter(x=>x.discoveryTier==='admitted').length,1);
assert.equal(request.intent,'reference-deterministic');
assert.equal(route.eligible[0].id,'renderer:deterministic-diagnostic');
assert.match(route.candidateSetSha256,/^[0-9a-f]{64}$/);
```

The four entries are one admitted complete renderer, two experimental stages, and one experimental two-stage pipeline.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node play/mmo/simple/renderer-society.test.mjs
```

Expected: FAIL because `renderer-society.mjs` and/or `renderer-society/registry.v1.json` do not exist.

- [ ] **Step 3: Add fan-out, immutability, and failure expectations before implementation**

The same test must also assert:

```js
assert.deepEqual(single.selectedIds,['renderer:deterministic-diagnostic']);
assert.deepEqual(comparison.selectedIds,[
  'renderer:deterministic-diagnostic',
  'pipeline:experimental-diagnostic'
]);
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore);
assert.equal(failure.terminalState,'failed-toolchain');
assert.match(failure.failureRecordSha256,/^[0-9a-f]{64}$/);
```

and that repeated identical routing/fan-out operations produce identical digests.

- [ ] **Step 4: Re-run and verify the failure remains for missing production code**

Run the same command. Expected: FAIL for missing renderer-society implementation, not for syntax errors in the test.

- [ ] **Step 5: Commit the RED test**

Commit message:

```text
test(renderer-society): define Mercer routing and provenance contract
```

### Task 2: Add the versioned registry and deterministic routing control plane

**Files:**
- Create: `play/mmo/simple/renderer-society/registry.v1.json`
- Create: `play/mmo/simple/renderer-society.mjs`
- Test: `play/mmo/simple/renderer-society.test.mjs`

**Interfaces:**
- `loadRegistry(registryObject) -> {schema, entries, snapshotSha256}`
- `buildRenderRequest({sealedPlan, jobId, intent, capabilityRequirements, allowExperimental, fanoutMode, maxCandidates}) -> request`
- `routeRenderRequest(snapshot, request) -> {eligible, candidateSetSha256, routingPolicySha256, requestSha256}`
- `selectFanout(route, request) -> {mode, selectedIds, decisionSha256}`

- [ ] **Step 1: Create the registry payload**

Use schema `conscience64.renderer-registry/v1` with exactly four entries:

```text
renderer:deterministic-diagnostic   admitted     complete-renderer
stage:diagnostic-envelope           experimental stage
stage:diagnostic-markers            experimental stage
pipeline:experimental-diagnostic    experimental pipeline
```

The admitted renderer declares intents `reference-deterministic` and `diagnostic`, measured classification metadata limited to the current bounded test surface, and `authority: none`. The pipeline references the two stage IDs in fixed order. No manifest embeds its own digest.

- [ ] **Step 2: Implement manifest validation and snapshot hashing**

`loadRegistry` must reject duplicate IDs, unknown kinds/tiers, non-`none` authority, malformed pipeline stage references, and unsorted/duplicate pipeline stages where order is ambiguous. It computes each immutable manifest digest and a registry snapshot digest over the ordered manifest-digest list.

- [ ] **Step 3: Implement render-request construction**

`buildRenderRequest` must verify the sealed carrier plan, locate one exact existing carrier job, and carry only downstream references: carrier-plan seal, source job ID/hash, recipe digest, requested intent/capabilities, experimental policy, bounded fan-out mode, and max-candidate limit. It must not modify the sealed plan.

- [ ] **Step 4: Implement deterministic routing and fan-out**

Routing filters by input contract, requested intent/capabilities, determinism requirement, and discovery tier. Canonical candidate order is stable ID then manifest digest. `single-best` selects the first eligible admitted candidate. `comparison-set` selects up to `maxCandidates`, including experimental candidates only when explicitly allowed. `society-sweep` is accepted only with an explicit positive `maxCandidates`; this plan does not exercise broad sweeps.

- [ ] **Step 5: Run tests and verify GREEN for registry/routing**

Run:

```bash
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/ecs.test.mjs
```

Expected: all routing tests and predecessor carrier/ECS tests PASS.

- [ ] **Step 6: Commit**

Commit message:

```text
feat(renderer-society): add deterministic registry and routing
```

### Task 3: Execute complete renderers and ordered pipelines with sealed provenance

**Files:**
- Modify: `play/mmo/simple/renderer-society.mjs`
- Modify: `play/mmo/simple/renderer-society.test.mjs`

**Interfaces:**
- `executeSelection({snapshot, request, route, selection, executors, sealedInput}) -> executionSet`
- Complete renderer executor signature: `({entry, input, request}) -> object|string|Buffer`
- Stage executor signature: `({entry, input, request}) -> object|string|Buffer`

- [ ] **Step 1: Add failing execution/provenance tests**

Before implementation, extend the test with deterministic diagnostic executors. Assert complete-renderer execution and the two-stage pipeline both produce content-addressed artifacts, pipeline stage records retain ordered input/output hashes, and repeated execution yields identical artifact/provenance hashes.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
node play/mmo/simple/renderer-society.test.mjs
```

Expected: FAIL because `executeSelection` is absent or incomplete.

- [ ] **Step 3: Implement isolated execution evidence**

The control plane clones sealed inputs before passing them to executors, computes input/output hashes itself, and records terminal state, renderer/pipeline manifest digest, registry/request/route/fan-out digests, source-job identity, stage evidence, and artifact byte length/hash. Executor return values never become ECS/world authority.

- [ ] **Step 4: Implement explicit failure records**

Missing executor -> `failed-toolchain`; thrown executor error -> `failed-render`; malformed stage output -> `failed-provenance`. Failed candidates remain in the execution set with a content-addressed failure record. No nonexistent downstream pipeline stage is represented as successful.

- [ ] **Step 5: Verify GREEN and metamorphic invariants**

Run:

```bash
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/ecs.test.mjs
```

The test must additionally show:

```text
change renderer only => ECS/source-job hash unchanged
change one stage parameter => pipeline/downstream identity changes
same sealed inputs => same route/fan-out/provenance hashes
missing executor => visible failed-toolchain record
```

- [ ] **Step 6: Commit**

Commit message:

```text
feat(renderer-society): add isolated execution provenance
```

### Task 4: Gate the bounded implementation in CI and document the claim ceiling

**Files:**
- Modify: `.github/workflows/playground.yml`
- Create: `play/mmo/simple/renderer-society/README.md`
- Modify: `docs/superpowers/plans/2026-09-14-renderer-society-mercer-v1.md`

**Interfaces:**
- CI command: `node play/mmo/simple/renderer-society.test.mjs`

- [ ] **Step 1: Add the renderer-society test to playground CI**

Insert after the visual-carrier-v2 contract:

```yaml
      - name: Verify bounded renderer society contract
        run: node play/mmo/simple/renderer-society.test.mjs
```

- [ ] **Step 2: Document the bounded surface**

README must state that this is a Mercer-only control-plane demonstration; diagnostic executor outputs are not production visual canon; experimental discovery is not admission; renderer agreement is not world truth; no ECS/world write-back exists; broad society sweeps, remote untrusted execution, and production visual promotion remain out of scope.

- [ ] **Step 3: Run the full relevant local command set**

Run:

```bash
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/ecs.test.mjs
node play/mmo/simple/test.mjs
```

Expected: all PASS.

- [ ] **Step 4: Self-review against the architecture spec**

Confirm the implementation covers the first bounded target in §20 and does not cross any §21 out-of-scope boundary. Record any intentionally deferred items in the README rather than silently omitting them.

- [ ] **Step 5: Commit**

Commit message:

```text
ci(renderer-society): gate Mercer bounded implementation
```

## Final Verification

Run the branch through the existing pull-request CI and require the playground gate to pass on the exact head. Before merge, compare the branch to current `main` and rebase/reconcile any concurrent changes. Preserve the implementation branch/history until the merged successor and public deployment are verified.