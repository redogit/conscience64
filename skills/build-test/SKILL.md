---
name: build-test
title: Build & Test
description: Make the smallest informative change, execute it, measure consequences, preserve failures, and update only the distinctions forced by evidence.
version: 1.0.0
status: active-project-skill
society_status: advisory-structure; does not canonically activate Operator Moonshot Society
---

# Build & Test

## Use when

Use after `recover-bound` has established current state, obligations, and the next discriminating question.

Typical triggers:

- implement one bounded feature or repair;
- run a one-degree experiment;
- import a domain into ECS;
- test a proposed Operator/skill;
- compare alternatives without broad architecture churn;
- verify a bug fix or counterexample.

## Inputs

Required:

- current Situation;
- one explicit question/hypothesis;
- obligations to preserve;
- controlled change;
- expected observation;
- stop/failure condition;
- available carrier/executor;
- evidence required to close the claim.

## Procedure

1. **Freeze the question** — state exactly what this experiment/change is meant to discriminate.
2. **Choose one degree of change** — vary the smallest consequential factor that can answer the question.
3. **Keep a valid control** — include OFF/baseline/predecessor behavior whenever meaningful.
4. **Choose the cheapest informative carrier** — use deterministic/local execution before expensive or external carriers when it answers the same question.
5. **Execute** — run the real implementation, not a prose simulation of it.
6. **Capture provenance** — code/version/input/seed/config/environment/tool/run identity where relevant.
7. **Observe before interpreting** — record raw outcome, failure, timing/cost, and unexpected behavior.
8. **Counter-probe** — actively search for the smallest counterexample or confound capable of defeating the favorable interpretation.
9. **Compare to obligation** — determine what actually changed, what remained invariant, and whether the obligation was satisfied.
10. **Preserve negative results** — failed attempts remain first-class history.
11. **Repair minimally** — if failure is local, make the weakest sufficient repair and rerun.
12. **Stop at evidence ceiling** — bounded success does not authorize universal claims.

## Preferred record

```text
Question
Baseline
One change
Carrier/executor
Observation
Consequence
Counter-probe
What changed
What did not change
Failure/remainder
Evidence scope
Next action
```

## Required boundaries

- `ONE_CHANGE != ONE_CAUSE`
- `FINITE_VERIFICATION != UNIVERSALITY`
- `SOFTWARE_PASS != SCIENTIFIC_VALIDITY`
- `MECHANISM_EXISTS != ARCHITECTURE_EARNED`
- `LOCAL_SUCCESS != TRANSFER`
- `CALIBRATION_RESULT != OPEN_PROBLEM_RESULT`
- `NEGATIVE_RESULT != WASTED_WORK`

## ECS use

When working in ECS:

- entities remain identities, not classes of human worth;
- components are inspectable state;
- systems are reusable transformations;
- carrier choice remains explicit;
- system output does not silently gain authority;
- each tick/pass must be reproducible from declared state when deterministic behavior is claimed.

For game work, preserve:

- player-facing simplicity;
- local save boundaries;
- accessibility alternatives;
- place/activity identity;
- deterministic scene/video-job definitions where claimed;
- `VIDEO_RENDER != WORLD_AUTHORITY`.

## Output contract

Return:

1. exact change;
2. executed tests;
3. raw observations;
4. passed/failed criteria;
5. counterexamples/confounds found;
6. cost/lifecycle note;
7. unresolved remainder;
8. smallest next change, if any.

## Completion test

The work is complete only if another worker can reproduce the tested distinction from the recorded inputs and can tell precisely what the result does **not** establish.
