# Semantic Applicability Gate

The semantic map can tell the Society **where to inspect next**. This gate decides whether a discovered helper has enough explicit contract information to be proposed for one bounded test.

It does not infer applicability from similarity.

## Pipeline

```text
Situation
  -> Recover & Bound
  -> semantic helper candidates
  -> explicit applicability gate
  -> bounded Operator proposal
  -> Build & Test
  -> Review & Admit
```

The critical separation is:

```text
semantic candidate != applicable helper != verified operator != admitted operator
```

## API

```js
import {
  evaluateHelperApplicability,
  gateSemanticHelperCandidates,
  proposeBoundedOperators
} from './semantic-applicability.mjs';
```

### `evaluateHelperApplicability(situation, helper)`

Checks only declared contract fields. It returns one of:

- `APPLICABLE_FOR_BOUNDED_TEST`
- `UNRESOLVED`
- `BLOCKED`

Missing contract information returns `UNRESOLVED`. It never becomes implicit permission.

### `gateSemanticHelperCandidates(candidateResult, situation, registry)`

Combines semantic helper candidates with an explicit Operator/contract registry. The semantic score remains a navigation signal only; the applicability result is determined by the declared contract checks.

### `proposeBoundedOperators(gated, situation)`

Produces proposal-only records for candidates that passed the applicability gate. Each proposal's next gate is `Build & Test`.

A proposal cannot admit itself.

## Situation contract fields

Supported fields include:

- `requiredCapabilities`
- `obligations` / `obligationIds`
- `availableCarriers`
- `requiredEvidenceKinds`
- `allowedAuthorities`
- `forbiddenAuthorities`
- `allowedScopes`
- `forbiddenScopes`
- `maxCost`
- `accessibilityRequired`
- `privacyRequired`

These may also use snake_case aliases.

## Helper / Operator contract fields

A helper may declare fields directly or under `operatorContract` / `operator_contract` / `contract`:

- `capabilities`
- `preserves`
- `requiredCarriers`
- `evidenceKinds`
- `authorities`
- `scopes`
- `cost`
- `accessibility`
- `privacy`

The gate uses exact normalized contract identifiers. It does not infer that a document preserves an obligation merely because its prose sounds similar.

## Status semantics

### `BLOCKED`

At least one explicit conflict exists, for example:

- required capability is explicitly absent from the declared capability set;
- required carrier is unavailable;
- forbidden authority is requested;
- declared scope violates the allowed/forbidden scope contract;
- declared cost exceeds the ceiling;
- accessibility/privacy is explicitly incompatible with a required boundary.

### `UNRESOLVED`

Information needed for the decision is missing.

Examples:

- no Operator contract exists;
- capabilities are required but not declared;
- cost is bounded but unknown;
- accessibility is required but unreported.

`UNRESOLVED` is not a soft pass.

### `APPLICABLE_FOR_BOUNDED_TEST`

Every required applicability check is explicitly satisfied and no blocker remains.

This status authorizes **proposal for a bounded test only**.

## Hard boundaries

- `HELPER_CANDIDATE != APPLICABLE_HELPER`
- `APPLICABLE_FOR_BOUNDED_TEST != VERIFIED`
- `OPERATOR_PROPOSAL != ADMISSION`
- `SEMANTIC_SCORE != APPLICABILITY`
- `MISSING_CONTRACT != IMPLIED_PERMISSION`
- `RELATED != SUPPORTS`

## Real-corpus negative control

The repository semantic corpus currently consists mostly of file records, not explicit Operator contracts. The applicability test therefore requires those semantic candidates to remain unresolved when no registry contract is supplied.

That negative control is intentional: a highly relevant document is not automatically an executable skill, carrier, or authorized Operator.
