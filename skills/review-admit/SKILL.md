---
name: review-admit
title: Review & Admit
description: Independently review evidence, provenance, accessibility, lifecycle cost, integrity, and rollback before admitting a reusable change or skill.
version: 1.0.0
status: active-project-skill
society_status: advisory-structure; does not canonically activate Operator Moonshot Society
---

# Review & Admit

## Use when

Use after a bounded build/test cycle has produced a candidate result, repair, operator, skill, component, system, carrier, or release change.

## Inputs

Required:

- candidate change/operator;
- predecessor identity;
- declared obligations;
- executed test evidence;
- provenance;
- known failures/counterexamples;
- lifecycle cost estimate;
- accessibility/human burden notes;
- rollback path.

## Procedure

1. **Confirm identity** — candidate, predecessor, branch/version, and authorship are distinct and inspectable.
2. **Review evidence independently** — do not treat the candidate's own explanation as corroboration.
3. **Check claim ceiling** — every promoted claim must fit the actual evidence scope.
4. **Check contradictions** — surface conflicting observations rather than averaging them away.
5. **Check accessibility and human burden** — critical paths must remain usable; automation should reduce unnecessary labor rather than remove judgment.
6. **Check privacy/consent** — no inferred permission for personal/private material.
7. **Check authority** — local/client/reference/model output may not become server, scientific, legal, or prize authority without the required gate.
8. **Check lifecycle cost** — construction, verification, maintenance, retrieval, migration, and human attention count.
9. **Check transfer** — if reuse is claimed, test at least one distinct context or explicitly limit the claim to the original context.
10. **Check rollback** — predecessor and restoration path must remain available.
11. **Choose one disposition**:
    - `ADMIT` — evidence and cost justify governed reuse within declared scope;
    - `REVISE` — useful candidate with a specific repair needed;
    - `ARCHIVE` — preserve history but do not activate;
    - `UNRESOLVED` — evidence insufficient or contradictory;
    - `REJECT` — violates obligation or fails its declared gate.
12. **Record rationale and remainder** — admission never erases failures or superseded state.

## Required boundaries

- `VERIFIED != ADMITTED`
- `ADMITTED != UNIVERSAL`
- `REUSE != TRANSFER_PROOF`
- `CHEAPER_EXECUTION != CHEAPER_LIFECYCLE`
- `AUTOMATED_CHECK != MANUAL_AT_VALIDATION`
- `LOCAL_SCORE != VERIFIED_ACHIEVEMENT`
- `VERIFIED_ACHIEVEMENT != PRIZE_ELIGIBILITY`
- `MODEL_AGREEMENT != INDEPENDENT_CORROBORATION`

## Output contract

Produce:

1. disposition;
2. admitted scope, if any;
3. evidence reviewed;
4. counterevidence/failures;
5. accessibility/human burden result;
6. lifecycle-cost result;
7. rollback/predecessor pointer;
8. unresolved remainder;
9. exact reason the decision would change.

## Completion test

A review is complete only when a future worker can tell:

- why the candidate was admitted/revised/archived/unresolved/rejected;
- what evidence was actually used;
- what authority it has and does not have;
- what it costs to keep;
- how to roll it back;
- what new evidence would change the disposition.
