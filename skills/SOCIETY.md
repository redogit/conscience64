# Society Skill Architecture — Three Levels Up

This file is the routing layer above individual project skills.

It does **not** canonically activate Operator Moonshot Society. It is an implementation of the documented advisory structure for reusable project work.

## Level 0 — Skill

A skill is one bounded reusable transformation.

A skill must declare:

- trigger / applicability;
- required inputs;
- obligations it must preserve;
- procedure;
- outputs;
- evidence boundary;
- failure / stop conditions;
- completion test.

A skill does not authorize itself.

## Level +1 — Capability / Operator

An Operator is a skill plus an explicit reusable contract.

Operator record:

```text
Operator = (
  skill,
  applicability,
  input_contract,
  obligations,
  carrier_requirements,
  cost,
  evidence_requirement,
  failure_modes,
  output_contract,
  rollback
)
```

An Operator may be proposed or executed without becoming an admitted reusable capability.

Promotion requires evidence appropriate to the claimed scope.

`EXECUTED != VERIFIED != ADMITTED`

## Level +2 — Society / Orchestration

The Society layer receives a Situation and chooses the smallest useful composition of Operators.

Human control loop:

`NOTICE -> GOAL -> OBLIGATIONS -> HELPERS -> APPLICABILITY -> CHEAPEST INFORMATIVE TRY -> OBSERVE -> KEEP/REVISE/WIDEN -> REPEAT`

Machine loop:

`observe -> situation/obligation -> retrieve operators/carriers -> compose -> intervene -> preserve execution -> evaluate evidence -> verify -> evaluate lifecycle cost -> admit/archive -> transfer -> causal retest -> update scope`

The Society router must:

1. recover enough current state;
2. preserve authority and provenance;
3. identify consequential distinctions;
4. select the smallest applicable Operator set;
5. route execution to explicit carriers;
6. preserve every attempt and failure;
7. require evidence before promotion;
8. evaluate lifecycle cost and human burden;
9. admit, revise, archive, or leave unresolved;
10. keep rollback and predecessor identity available.

The Society is not a hidden model. Its state must remain inspectable data.

## Level +3 — Human Purpose / Constitutional Boundary

The Society is subordinate to affected human reality.

Before lower layers optimize anything, retain:

- human aim / need;
- minimal necessities for life, learning, and living;
- pursuit of happiness and room for curiosity/play;
- privacy and consent;
- accessibility and human reconstruction burden;
- ethics, safety, and dignity;
- cost, sustainability, attention, and opportunity cost;
- freedom to think, learn, communicate, dissent, create, and cooperate.

No lower layer may redefine these obligations merely because a representation, score, model, schema, or implementation makes another answer convenient.

### Constitutional invariants

- `PERSON != COMPONENT`
- `HUMAN_PURPOSE > SYSTEM_CONVENIENCE`
- `ACCESSIBILITY != OPTIONAL_POLISH`
- `CONSENT != INFERRED_PERMISSION`
- `LOCAL_STATE != EXTERNAL_AUTHORITY`
- `REFERENCE != EVIDENCE`
- `RETRIEVAL != CORROBORATION`
- `ROADMAP != IMPLEMENTED_STATE`
- `SUCCESSFUL_EXECUTION != SCIENTIFIC_VALIDITY`
- `LOWER_LAYER_OPTIMIZATION != AUTHORITY_TO_CHANGE_OBLIGATION`

## Current project Operators

The first three reusable Operators are:

1. `recover-bound` — recover current state and bind obligations/evidence scope;
2. `build-test` — execute the smallest informative change and record consequences;
3. `review-admit` — verify integrity, accessibility, economics, evidence, and decide admit/revise/archive/unresolved.

These three are intended to compose rather than proliferate into dozens of overlapping skills.

## ECS relationship

The ECS is the execution substrate below the Society:

- entities carry identity;
- components carry inspectable state;
- systems perform reusable transformations;
- carriers execute bounded actions;
- evidence gates determine what may advance;
- snapshots preserve continuity and restart;
- Society Operators select and govern ECS transformations;
- the human-purpose boundary remains above both.

`HUMAN PURPOSE -> SOCIETY -> OPERATORS -> ECS -> CARRIERS`

Authority flows downward only as explicitly granted. Evidence flows upward only with provenance.
