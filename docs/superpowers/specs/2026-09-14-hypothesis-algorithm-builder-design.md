# Governed Hypothesis Algorithm Builder Design

## Goal

Implement a deterministic bridge from a human gut instinct to a bounded, testable hypothesis workflow without allowing intuition, semantic proximity, generated experiments, or model agreement to become evidence or authority.

## Status and authority

The builder is a support tool under the existing Society workflow. It does not canonically activate Operator Moonshot Society, does not verify scientific claims, and does not admit evidence.

Hard boundaries:

- `INTUITION != EVIDENCE`
- `HYPOTHESIS != CLAIM_ESTABLISHED`
- `GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT`
- `TEST_SUPPORT != UNIVERSAL_TRUTH`
- `TEST_CONTRADICTION != UNIVERSAL_FALSEHOOD`
- `SEMANTIC_MATCH != CORROBORATION`
- `ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION`
- `REPAIR != HISTORY_REWRITE`

## Placement

```text
Human intuition
  -> hypothesis seed
  -> bounded formalization
  -> discriminator compilation
  -> optional semantic helper discovery/applicability gate
  -> executable carrier / Algorithm Harness support manifest
  -> Build & Test
  -> observed evidence
  -> bounded evaluation
  -> preserve / revise / supersede / unresolved
  -> Review & Admit
```

## Core data model

### Hypothesis seed

A seed preserves the original intuition verbatim and separates it from the formal working statement.

```js
{
  schema: 'conscience64.hypothesis-seed/v1',
  id: 'hypothesis:<deterministic-hash>',
  intuition: '...',
  subject: '...',
  formalStatement: '...',
  assumptions: [],
  observables: [],
  alternatives: [],
  scope: '...',
  epistemicStatus: 'hypothesis-only',
  authority: 'none',
  provenance: {...},
  boundaries: [...]
}
```

Natural-language intuition may be recorded, but the module does not pretend to infer missing formal semantics. Missing formal statement, observables, or interventions remain explicit unknowns.

### Discriminator plan

A discriminator is a finite plan containing one baseline and one or more one-degree interventions. Every intervention must change exactly one declared factor relative to the baseline.

```js
{
  schema: 'conscience64.hypothesis-discriminator/v1',
  hypothesisId,
  baseline: {id:'baseline', state:{...}},
  conditions: [
    {id:'condition:<factor>', changedFactor:'...', state:{...}}
  ],
  observations: [...],
  expected: [...],
  stopConditions: [...],
  authority: 'plan-only'
}
```

The compiler rejects ambiguous multi-factor intervention entries instead of silently treating them as causal tests.

### Binary state delta

For equal-length binary state strings, the builder exposes the exact reversible delta

`delta = before XOR after`.

The same delta must replay forward and backward:

- `before XOR delta = after`
- `after XOR delta = before`

This is a calibration utility, not a claim that arbitrary scientific state transitions are XOR-linear.

### Bounded evaluation

Evaluation consumes an explicit discriminator plan plus observed condition results. It returns only one of:

- `SUPPORTED_IN_TEST`
- `CONTRADICTED_IN_TEST`
- `INCONCLUSIVE`
- `INVALID_TEST`

Evaluation never returns `TRUE`, `FALSE`, `PROVED`, or `VERIFIED`.

### Hypothesis repair

A repair creates a successor hypothesis packet. It must retain:

- predecessor hypothesis ID;
- original intuition;
- revision reason;
- exact changed fields;
- unchanged fields;
- prior evaluation reference when supplied.

The predecessor is never mutated or rewritten.

## Algorithm Harness relation

The existing Library Algorithm Harness remains support-only. The new builder may emit a declarative support manifest compatible in shape with baseline/intervention experimentation, but it must not claim the manifest was executed. Actual Harness execution remains a separate Build & Test action.

The manifest carries:

- hypothesis ID;
- baseline condition;
- one-factor intervention conditions;
- requested observations;
- deterministic seeds if explicitly supplied;
- `authority: 'support-only'`;
- `executionStatus: 'not-executed'`.

## Determinism

Stable IDs are derived from normalized, explicitly supplied content. Repeating the same seed and plan inputs must produce byte-equivalent JSON-compatible objects.

## Error handling

Reject:

- empty intuition;
- duplicate intervention IDs;
- a declared one-degree intervention that changes zero or more than one baseline factor;
- unequal-length/non-binary inputs to XOR delta;
- evaluation observations for unknown condition IDs;
- successor repair requests that attempt to alter the original intuition.

Missing scientific content is not an error. It is represented as unresolved input rather than synthesized implicitly.

## Verification strategy

Tests must cover:

1. intuition remains `hypothesis-only` with `authority:none`;
2. deterministic stable IDs;
3. one-degree plan construction;
4. rejection of multi-factor interventions;
5. XOR delta and exact round-trip replay;
6. bounded support/contradiction/inconclusive/invalid dispositions;
7. manifest remains `not-executed` and support-only;
8. repair creates a successor while preserving predecessor and original intuition;
9. no API surface returns truth/proof authority language.

## Claim ceiling

Passing these tests establishes only that the software preserves the declared governance contract for the tested finite inputs. It does not establish that a hypothesis is scientifically correct, that XOR is a universal state-transition law, or that Algorithm Builder has discovered a mechanism.