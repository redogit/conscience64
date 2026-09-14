# Conscience64 Image Society

Image Society is the long-horizon coordination layer for image generation, critique, correction, comparison, continuity, accessibility, authority review, checkpointing, and promotion review.

It is intentionally **not** a new source of world authority.

## Core boundary

```text
GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON
```

Image Society composes existing Conscience64 components:

- `space-lens-image-gen.js` — provider-agnostic image generation transport;
- Visual Carrier v2 — deterministic visual-carrier planning downstream of ECS;
- Renderer Society — renderer discovery, routing, fan-out, execution isolation, provenance, and governance;
- `skills/SOCIETY.md` — human-purpose / Society / Operator governance;
- `play/mmo/REALITY_CANON.md` — canonical MMO visual/reality presentation boundary.

No Image Society event, model vote, critic agreement, or generated image writes authority back into ECS/world state.

## Approved package

### Architecture

`docs/superpowers/specs/2026-09-14-image-society-design.md`

Defines:

- event-sourced interaction ledger;
- artifact lineage;
- Image Intent and Scene Specification;
- role society;
- Visual Difference Contract;
- Continuity Packs;
- Reality Canon integration;
- accessibility contract;
- provider/renderer boundary;
- reproducibility classes;
- 1000-call wave model;
- checkpoints and active-context compaction;
- Regression Corpus;
- explicit promotion gate.

### Implementation blueprint

`docs/superpowers/plans/2026-09-14-image-society-v1.md`

Defines the test-driven implementation sequence, including a deterministic 1000-call mock scale test before real provider spending.

### 1000-call operational runbook

`image-society/RUNBOOK_1000_CALLS.md`

Defines:

- preconditions;
- call and retry accounting;
- concurrency policy;
- wave allocations;
- correction cycles;
- checkpoint/resume procedures;
- branching/consolidation;
- budget controls;
- provider drift handling;
- refusal handling;
- human promotion gates;
- incident response;
- mock qualification and progressive real-provider qualification.

### Machine-readable contracts

`image-society/schema/image-society.v1.schema.json`

Contains contracts for:

- Run Manifest;
- Image Intent;
- Image Turn Event;
- Image Artifact;
- Visual Difference Contract;
- Continuity Pack;
- Checkpoint;
- Regression Defect;
- Role Envelope.

`image-society/schema/run-manifest.example.json` provides a bounded 1000-call example.

### Role prompt contracts

`image-society/prompts/role-prompts.v1.json`

Defines bounded responsibilities for:

- Director;
- Scene Builder;
- Generator;
- Repairer;
- Semantic Critic;
- Composition Critic;
- Continuity Critic;
- Accessibility Critic;
- Authority Critic;
- Provenance Keeper;
- Integrator;
- Summarizer.

Roles are responsibilities, not independent evidence sources. Shared-model role agreement is not independent corroboration.

## 1000-call principle

A 1000-call run is a **bounded experimental budget**, not a requirement to spend 1000 calls.

The recommended qualification sequence is:

```text
1000-call deterministic mock run
  -> 8 real calls
  -> 32 real calls
  -> 100 real calls
  -> 250 real calls
  -> 1000-call ceiling
```

Progression occurs only when evidence supports the next scale.

## Authority and Reality Canon

For MMO/game images, Image Society preserves:

```text
ordinary physical world
  -> observed natural world
  -> scientific observation reference
  -> processed scientific visualization
  -> game reconstruction
  -> anomaly/fantasy layer
```

Generated people are not presented as real identifiable people. Game reconstructions are not presented as photographs, telescope exposures, or scientific measurements. A visually convincing artifact does not gain evidentiary authority from realism.

## Accessibility

Accessibility is a review input and production-suitability gate where applicable. Accepted artifacts may carry:

- alt text;
- long descriptions;
- text transcription;
- regions of interest;
- known limitations;
- formal checks still requiring programmatic measurement.

Model inspection does not substitute for formal measurements where those are required.

## Promotion

Canonical visual promotion requires an explicit promotion event with the target gate passed and human approval recorded.

```text
MODEL_VOTES != HUMAN_PROMOTION_APPROVAL
```

No scheduler, generator, critic, or integrator may bypass that rule.

## Current evidence state

This package currently records an approved architecture, implementation plan, runbook, schema, and role-prompt contracts.

It does **not** yet constitute evidence that:

- Image Society runtime code has been implemented;
- a 1000-call mock run has executed;
- real provider calls have executed;
- any renderer/provider has been newly admitted;
- any image has been promoted to canonical visual state.

Those claims require implementation and executed test evidence from the implementation plan.
