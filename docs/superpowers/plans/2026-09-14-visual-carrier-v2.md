# Visual Carrier V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a higher-fidelity visual-carrier boundary for the three Mercer & Red Street perspectives without changing ECS/world authority or weakening deterministic provenance.

**Architecture:** Treat the existing ECS `SceneVideoJobs` as immutable inputs. Build a pure deterministic carrier plan that copies the authoritative render intent exactly, adds only render-local interpretation metadata and domain-separated seeds, binds the plan to the canonical recipe SHA-256, and seals the canonical plan with SHA-256. Keep the existing smoke renderer and PR #48 lock unchanged.

**Tech Stack:** Node.js ESM, built-in `node:crypto`, JSON recipes, existing GitHub Actions playground verifier.

**Spec:** `play/mmo/simple/ECS.md`

## Global Constraints

- Do not modify `play/mmo/simple/core.mjs`.
- Do not modify `play/mmo/simple/ecs.mjs`.
- Preserve `VIDEO_RENDER != WORLD_AUTHORITY`.
- Preserve `PROCEDURAL_SMOKE_VIDEO != PRODUCTION_VISUAL_CANON` and the PR #48 smoke lock.
- The v2 carrier must copy ECS duration, fps, resolution, camera, authority, and boundary fields exactly.
- Render-local interpretation must be explicitly non-canonical and non-authoritative.
- Same inputs must produce byte-identical canonical plan JSON and SHA-256 seal.
- Recipe content identity must participate in carrier provenance without changing ECS job identity.
- Randomness must be domain-separated by stable job ID and named purpose.

---

### Task 1: Lock the carrier contract in tests

**Files:**
- Create: `play/mmo/simple/visual-carrier-v2.test.mjs`
- Modify: `.github/workflows/playground.yml`

**Interfaces:**
- Consumes: `initializeECS()` and `videoJobs(world)` from `ecs.mjs`.
- Produces: executable expectations for `buildCarrierPlan`, `canonicalJson`, `carrierSeed`, `sealCarrierPlan`, and `sha256Canonical`.

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Add the test to the existing playground CI**
- [x] **Step 3: Observe the expected carrier-contract failure on the draft PR before implementation**

### Task 2: Implement deterministic carrier planning

**Files:**
- Create: `play/mmo/simple/tools/visual-carrier-v2.mjs`

**Interfaces:**
- Consumes: a plain array of existing ECS video jobs plus `{place, recipeId, recipeSha256, renderer}`.
- Produces: deterministic plan rows that preserve ECS render intent and add non-authoritative render metadata.

- [x] **Step 1: Implement recursive canonical JSON key ordering**
- [x] **Step 2: Implement SHA-256 canonical hashing**
- [x] **Step 3: Implement domain-separated seed derivation**
- [x] **Step 4: Implement the three-job Mercer carrier plan without mutating source jobs**
- [x] **Step 5: Bind recipe SHA-256 and implement plan sealing over the canonical unsealed payload**
- [x] **Step 6: Run the PR verifier and require the implementation assertions to pass**

### Task 3: Add the explicit interpretation recipe

**Files:**
- Create: `play/mmo/simple/visual-carrier-v2/recipes/mercer-and-red-street.v1.json`

**Interfaces:**
- Consumes: the already-authoritative place identity and context only.
- Produces: render-local environment, lighting, motion, and material hints marked `authority: none`, `interpretationOnly: true`, and `canon: false`.

- [x] **Step 1: Add the Mercer recipe with all three visual-boundary invariants**
- [x] **Step 2: Keep exact asset choices outside world/ECS authority**
- [x] **Step 3: Run the PR verifier and require recipe assertions to pass**

### Task 4: Document provenance and admission gates

**Files:**
- Create: `play/mmo/simple/visual-carrier-v2/README.md`
- Create: `play/mmo/simple/visual-carrier-v2/BOUNDARY.md`

**Interfaces:**
- Consumes: the tested carrier plan and recipe contract.
- Produces: the next renderer handoff: sealed jobs -> recipe -> pinned renderer/toolchain -> frame hashes/Merkle root -> encoded artifact hash.

- [x] **Step 1: Document the one-way authority flow**
- [x] **Step 2: Document reference-runner byte-identity vs cross-runner equivalence as separate claims**
- [x] **Step 3: Define the three-render Mercer admission gate before expanding to all 24 jobs**

### Task 5: Verify no authority drift

**Files:**
- Verify only; no ECS/core changes permitted.

**Interfaces:**
- Consumes: PR diff and CI result.
- Produces: review evidence that only carrier/test/docs/workflow surfaces changed.

- [x] **Step 1: Confirm `core.mjs` and `ecs.mjs` are absent from the diff**
- [x] **Step 2: Confirm PR #48 artifact lock remains unchanged by this PR**
- [x] **Step 3: Confirm the complete playground CI suite passes at the final implementation head**

## Executed evidence

- Initial draft run failed only at the newly added carrier-v2 contract while existing core/ECS/smoke checks passed.
- Intermediate red runs preserved the same isolation while the implementation and recipe binding were added.
- Final implementation run on head `f6c3ecc060b6de5985536c8c7dc13b7d60cb34ec` passed the carrier-v2 contract and every existing playground verification step, including browser exercises.
