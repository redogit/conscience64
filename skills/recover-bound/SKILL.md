---
name: recover-bound
title: Recover & Bound
description: Recover the smallest truthful current state, bind authority/provenance/evidence scope, and identify the next discriminating question before material work begins.
version: 1.2.0
status: active-project-skill
society_status: advisory-structure; does not canonically activate Operator Moonshot Society
---

# Recover & Bound

## Use when

Use this skill before material research, recovery, design, migration, game/ECS import, or consequential decision work when any of these are true:

- current state is uncertain or distributed across files/chats/branches;
- roadmap and implementation may be mixed;
- provenance or authority matters;
- a predecessor/successor relationship must be preserved;
- the next action depends on an unresolved distinction.

## Human surface

Return the smallest truthful structure sufficient for the next good decision while preserving a route to omitted detail.

Prefer these four views when useful:

- **NOW** — what is happening now;
- **WEB** — what can help, compose, or block applicability;
- **EVIDENCE** — why we believe each consequential statement;
- **HISTORY** — how we got here without rewriting predecessors.

## Inputs

At minimum:

- goal;
- affected reality/parties;
- obligations that must remain true;
- known constraints/costs;
- unresolved uncertainty;
- available sources/carriers.

Working situation frame:

`Q = (G, A, O, C, U)`

where `G` = goal, `A` = affected reality, `O` = obligations, `C` = constraints/costs, and `U` = unresolved uncertainty.

## Procedure

1. **Notice** — state what is actually happening, not what the roadmap hoped would happen.
2. **Recover chronology first** — order observations, attempts, artifacts, failures, corrections, and transitions before imposing a preferred ontology.
3. **Separate identities** — keep person, assistant, companion, source, artifact, carrier, and system authorship distinct.
4. **Classify state** — distinguish at least: implemented, executed/tested, externally validated, planned, hypothesis, failed, superseded, unresolved.
5. **Bind provenance** — retain stable file/version/commit/run/source identities when available.
6. **Bind authority** — identify what may describe, propose, test, verify, admit, activate, or merely advise.
7. **Bind evidence scope** — retrieval/reference/assistant interpretation never silently becomes independent evidence.
8. **Preserve contradictions and failures** — never delete a predecessor failure to simplify the current story.
9. **Identify the consequential distinction** — ask what single distinction would most change the next action.
10. **Find helpers when useful** — a semantic Situation query may identify records worth inspecting, but semantic candidates remain navigation only.
11. **Gate applicability explicitly** — before turning a discovered helper into an Operator proposal, require an explicit applicability contract covering the Situation's required capabilities, preserved obligations, carrier availability, evidence kinds, authority/scope limits, cost, accessibility, and privacy as applicable. Missing contract data remains `UNRESOLVED`.
12. **Stop at missing evidence** — do not manufacture dependencies that belong to a human, sensor, external source, or unavailable carrier.
13. **Emit the smallest next-state packet** — enough to begin bounded work, plus pointers to deeper material.

## Private language-learning boundary

When historical or personal material is explicitly private and supplied only so the system can learn how the user framed and solved problems, recovery must preserve the privacy boundary before extracting method.

Allowed use is limited to abstract problem-solving structure: distinctions, search strategy, testing/repair sequence, protected obligations, and reusable language structure that no longer carries private facts.

For that material:

- do not quote it into project or public artifacts;
- do not correlate identities from names, handles, relationships, or associations;
- do not profile people from tone, history, language, or behavior;
- do not promote the private history as project evidence;
- do not export names, handles, links, relationships, or private events;
- do not treat a rewritten or sanitized private narrative as newly public;
- re-ground any later project claim in current authorized project/public evidence.

Required distinctions:

- `PRIVATE_HISTORY != PUBLIC_EVIDENCE`
- `PRIVATE_HISTORY != PROJECT_ARTIFACT`
- `LANGUAGE_PATTERN != PERSONAL_PROFILE`
- `LEARNED_METHOD != DISCLOSURE`
- `DERIVED_FROM_PRIVATE_HISTORY != SAFE_TO_PUBLISH`

See `research/history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md`.

## Semantic helper routing

When the semantic cross-reference helpers are available, the governed path is:

```text
Situation
  -> semantic helper candidates
  -> inspect explicit Operator contracts
  -> applicability gate
  -> bounded Operator proposal
  -> Build & Test
```

Required distinctions:

- `QUERY_MATCH != SUPPORT`
- `HELPER_CANDIDATE != APPLICABLE_HELPER`
- `SEMANTIC_SCORE != APPLICABILITY`
- `MISSING_CONTRACT != IMPLIED_PERMISSION`
- `APPLICABLE_FOR_BOUNDED_TEST != VERIFIED`
- `OPERATOR_PROPOSAL != ADMISSION`

A repository document with a high semantic score must remain unresolved if no explicit Operator contract is available. Do not infer capabilities, preserved obligations, authority, cost, accessibility, or privacy guarantees from prose similarity.

## Required boundaries

- `ROADMAP != IMPLEMENTED_STATE`
- `RETRIEVAL != INDEPENDENT_EVIDENCE`
- `REFERENCE != EVIDENCE`
- `PERSON != RECORDED_MODEL`
- `CURRENT_SUCCESSOR != REWRITTEN_PREDECESSOR`
- `UNKNOWN != NEGATIVE_RESULT`
- `CONFIDENCE != AUTHORITY`
- `HELPER_CANDIDATE != APPLICABLE_HELPER`
- `OPERATOR_PROPOSAL != ADMISSION`

## Output contract

Produce:

1. current state;
2. goal;
3. obligations;
4. consequential distinctions;
5. evidence/provenance table or compact equivalent;
6. helper candidates and applicability state when helper discovery was used;
7. unresolved remainder;
8. cheapest informative next action;
9. explicit claim ceiling.

## Completion test

This skill is complete only when a new worker can answer:

- What are we trying to do?
- What must remain true?
- What is actually implemented or observed?
- What is only planned/interpreted?
- What evidence supports the consequential claims?
- Which candidate helpers are merely related, which are blocked, which remain unresolved, and which—if any—are explicitly applicable for one bounded test?
- What remains unresolved?
- What is the next bounded action?

If any answer requires guessing, recovery is incomplete.
