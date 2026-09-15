# Image Society v1 Runtime Reconciliation

**Status:** additive implementation reconciliation for the approved Image Society v1 design.  
**Predecessor:** `docs/superpowers/specs/2026-09-14-image-society-design.md`.  
**Rule:** this note records implementation-derived refinements without rewriting the predecessor specification into having always contained them.

## Evidence boundary

These refinements were introduced while executing the v1 plan with test-first development and adversarial review. They describe the implemented v1 contracts. They do **not** claim that any real external image/model provider has executed the 1000-call pilot.

`MOCK_STRUCTURAL_ORCHESTRATION_EVIDENCE != REAL_PROVIDER_QUALITY_OR_COST_EVIDENCE`

## Reconciled contracts

### 1. Provider capability failure

`failed-capability` is an explicit terminal Image Society call state. A request rejected before provider execution because its requested output geometry, format, aspect ratio, or per-call variant count is unsupported produces terminal evidence and does not consume provider retries.

### 2. Output geometry negotiation

Requested image geometry remains intent-level data and is not constrained to the current browser transport's fixed size list.

A provider adapter must either:

- accept the requested geometry directly;
- reject it as `failed-capability`; or
- when `adapter_fallback_allowed=true`, apply only an explicitly declared fallback containing `width`, `height`, and transformation `operation`.

Requested and executed geometry remain separately recorded. Silent substitution is not permitted.

### 3. Deterministic scheduling and recovery

Logical call identity is monotonic within a run and independent of retry count. Parallel provider calls may execute concurrently, but terminal ledger records are appended in logical-call order so completion timing does not make checkpoint identity nondeterministic.

`executeBatch` and `executeRun` use the same scheduler path. Resuming a preserved ledger continues from the next logical call ID instead of restarting at call 1.

### 4. Turn-event defaults

When a bounded internal event omits actor or authority metadata, normalization supplies explicit non-authoritative defaults:

- actor: `system / conscience64-image-society`;
- `canonical=false`;
- review flags false;
- reality classification `not-applicable`.

Absence therefore never implies authority.

### 5. Checkpoint envelope

The implemented checkpoint is a content-addressed envelope around deterministic semantic state:

```text
checkpoint
  -> checkpoint_id
  -> semantic_digest
  -> semantic_state
       -> ledger digest
       -> through-event count
       -> accepted / candidate / rejected artifact identities
       -> active constraints
       -> unresolved issues
       -> successful / failed correction patterns
       -> authority / accessibility / continuity notes
       -> budget evidence
       -> source event identities
```

Wall-clock creation time is not part of the semantic checkpoint hash.

Artifact trust classifications remain distinct:

- candidate: `experimental`, `candidate`, `authority-reviewed-candidate`;
- accepted: `accepted-noncanonical`, `human-approved-asset`, `promoted-canonical`;
- rejected: `rejected`.

Checkpoint projection does not promote artifacts.

### 6. Visual Difference and Continuity records

The runtime Visual Difference Contract preserves protected invariants and explicitly separates intended from unintended observed deltas.

Continuity Packs use the canonical field `prohibited_drift` and retain per-entity authority classes:

- `source-authoritative`;
- `human-approved-working-rule`;
- `generated-working-rule`;
- `experimental`.

Repeated generated appearance does not become source authority.

### 7. Regression replay semantics

Regression replay outcomes are exactly:

- `passed`;
- `failed`;
- `inconclusive`.

Regression records retain triggering event/artifact IDs, protected invariants, successful corrections, failed corrections, and replay history.

## Machine-schema lock

`image-society/schema-runtime.test.mjs` compares important machine-schema enumerations and required shapes against runtime exports and actual checkpoint construction. Runtime and interchange contracts must be revised together.

## Preserved authority invariants

None of these refinements alter the higher boundaries:

- `GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON`;
- `VISUAL_AGREEMENT != WORLD_AUTHORITY`;
- `MODEL_AGREEMENT != INDEPENDENT_CORROBORATION`;
- provider/renderer output cannot write back into ECS/world authority;
- canonical MMO promotion still requires the explicit human gate;
- game reconstruction remains distinct from photographs, telescope exposures, and scientific measurements;
- generated people are not presented as real identifiable people.
