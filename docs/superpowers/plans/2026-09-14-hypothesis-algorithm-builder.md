# Governed Hypothesis Algorithm Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic, governance-preserving Algorithm Builder that converts an explicit human intuition into bounded hypothesis/discriminator artifacts without promoting intuition, plans, semantic matches, or support manifests to evidence.

**Architecture:** Implement one focused ES module under `tools/` plus one CLI wrapper and one test file. The module is pure/deterministic and emits JSON-compatible packets. It integrates conceptually with the existing Society/semantic/applicability flow but does not mutate those modules or import Library Algorithm Harness runtime code.

**Tech Stack:** Node.js ES modules, built-in `node:crypto`, `node:assert/strict`, existing GitHub Actions conventions.

**Spec:** `docs/superpowers/specs/2026-09-14-hypothesis-algorithm-builder-design.md`

## Global Constraints

- `INTUITION != EVIDENCE`.
- `HYPOTHESIS != CLAIM_ESTABLISHED`.
- `GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT`.
- `TEST_SUPPORT != UNIVERSAL_TRUTH`.
- `TEST_CONTRADICTION != UNIVERSAL_FALSEHOOD`.
- `ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION`.
- Predecessor hypotheses are immutable; repairs create successors.
- Missing scientific semantics remain unresolved and are never invented by the module.

---

### Task 1: Core hypothesis carrier and XOR calibration

**Files:**
- Create: `tools/hypothesis-algorithm-builder.mjs`
- Test: `tools/hypothesis-algorithm-builder.test.mjs`

**Interfaces:**
- Produces: `createHypothesisSeed(input)`, `xorStateDelta(before, after)`, constants `HYPOTHESIS_BUILDER_SCHEMA`, `HYPOTHESIS_BOUNDARIES`.

- [ ] **Step 1: Write failing tests** asserting that `createHypothesisSeed` preserves intuition verbatim, returns `epistemicStatus:'hypothesis-only'`, `authority:'none'`, produces deterministic IDs, and that `xorStateDelta('101101','011001')` returns `110100` with exact forward/backward replay.
- [ ] **Step 2: Run** `node tools/hypothesis-algorithm-builder.test.mjs` and confirm failure because the module is absent.
- [ ] **Step 3: Implement minimal code** using `node:crypto` SHA-256 over stable canonical JSON for IDs; validate non-empty intuition and equal-length binary XOR inputs.
- [ ] **Step 4: Run the test** and confirm Task 1 assertions pass.
- [ ] **Step 5: Commit** with message `Add governed hypothesis seed and XOR delta`.

### Task 2: One-degree discriminator compiler

**Files:**
- Modify: `tools/hypothesis-algorithm-builder.mjs`
- Modify: `tools/hypothesis-algorithm-builder.test.mjs`

**Interfaces:**
- Produces: `compileDiscriminatorPlan(seed, input)`.
- Input shape: `{baselineState, interventions:[{id,factor,value}], observations, expected, stopConditions}`.

- [ ] **Step 1: Add failing tests** for deterministic plan construction, exactly-one-factor changes, duplicate intervention rejection, and multi-factor intervention rejection.
- [ ] **Step 2: Run tests** and confirm failure because `compileDiscriminatorPlan` is absent.
- [ ] **Step 3: Implement minimal compiler** by cloning baseline state and changing exactly the declared `factor` to `value` for each condition; reject unknown factors and no-op values.
- [ ] **Step 4: Run tests** and confirm all discriminator tests pass.
- [ ] **Step 5: Commit** with message `Compile one-degree hypothesis discriminators`.

### Task 3: Bounded evaluation and successor repair

**Files:**
- Modify: `tools/hypothesis-algorithm-builder.mjs`
- Modify: `tools/hypothesis-algorithm-builder.test.mjs`

**Interfaces:**
- Produces: `evaluateDiscriminator(plan, observations)`, `repairHypothesis(seed, revision)`.
- Evaluation statuses: `SUPPORTED_IN_TEST | CONTRADICTED_IN_TEST | INCONCLUSIVE | INVALID_TEST`.

- [ ] **Step 1: Add failing tests** for all four evaluation statuses and for a repair that preserves original intuition/predecessor while changing only explicit successor fields.
- [ ] **Step 2: Run tests** and confirm failure on missing APIs.
- [ ] **Step 3: Implement minimal evaluation** requiring explicit expected records `{conditionId, field, relation, value}` and explicit observed records. Support only exact finite relations `eq`, `neq`, `gt`, `gte`, `lt`, `lte`; unknown/missing conditions are invalid or inconclusive as declared by the spec.
- [ ] **Step 4: Implement successor repair** with `predecessorId`, `revisionReason`, `changedFields`, immutable `intuition`, and deterministic successor ID.
- [ ] **Step 5: Run tests** and confirm all pass.
- [ ] **Step 6: Commit** with message `Evaluate and repair bounded hypotheses`.

### Task 4: Algorithm Harness support manifest and CLI

**Files:**
- Modify: `tools/hypothesis-algorithm-builder.mjs`
- Create: `tools/run-hypothesis-algorithm-builder.mjs`
- Modify: `tools/hypothesis-algorithm-builder.test.mjs`

**Interfaces:**
- Produces: `toAlgorithmHarnessSupportManifest(plan, options)`.
- CLI accepts one JSON file and prints/writes seed, plan, optional XOR calibration, and support manifest.

- [ ] **Step 1: Add failing tests** asserting manifest `authority:'support-only'`, `executionStatus:'not-executed'`, exact baseline/intervention conditions, and explicit boundary `ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION`.
- [ ] **Step 2: Run tests** and confirm failure.
- [ ] **Step 3: Implement minimal manifest emitter and CLI** using only built-in Node modules.
- [ ] **Step 4: Run syntax checks** with `node --check` on both modules and run the unit test.
- [ ] **Step 5: Commit** with message `Emit support-only Algorithm Harness manifests`.

### Task 5: CI and documentation

**Files:**
- Create: `tools/HYPOTHESIS_ALGORITHM_BUILDER.md`
- Modify: `.github/workflows/semantic-crossref-check.yml`

**Interfaces:**
- CI runs syntax plus `node tools/hypothesis-algorithm-builder.test.mjs`.

- [ ] **Step 1: Add the new files to semantic/research workflow path filters and add a dedicated verification step.**
- [ ] **Step 2: Document API, examples, statuses, XOR calibration scope, Algorithm Harness relation, and claim ceiling.**
- [ ] **Step 3: Run exact-head CI and broad REDOGIT verification.**
- [ ] **Step 4: Record bounded evidence in PR review comment.**
- [ ] **Step 5: Merge only if both workflows pass.**

## Self-review

- Spec coverage: every design requirement maps to Tasks 1–5.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: all function names and status strings are fixed above and reused consistently.
- Scope: no automatic scientific inference, no world-inventory ingestion, and no canonical Algorithm Harness import in this change.