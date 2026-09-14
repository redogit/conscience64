# Conscience64 Society Skills

Three reusable project skills implement the documented Society working cycle without claiming canonical Society activation.

## Where an agent fits

An agent performs the work, a skill guides a reusable workflow, and a connector supplies authorized access to supported tools or data. A plugin can package skills and connections. One agent can use many skills; a shared skill does not require one dedicated agent per copy.

A society organizes relationships, responsibilities, and decision authority. A swarm is a coordination pattern in which participants adapt through local interactions and feedback. An agent can participate in both; running several workers in parallel alone does not establish swarm behavior.

See [the component map, coordination choices, and proposed Visual Studio workflow](SOCIETY.md#agents-skills-connectors-societies-and-swarms). These are architectural distinctions, not a claim of a connected editor, an executed swarm, or canonical Society activation.

## Fast routing

| Situation | Skill | Result |
|---|---|---|
| State is unclear, scattered, stale, or authority/evidence boundaries matter | [`recover-bound`](recover-bound/SKILL.md) | Truthful current-state packet + next discriminating question |
| A bounded change, experiment, import, repair, or implementation should be executed | [`build-test`](build-test/SKILL.md) | Executed change + observations + failures + evidence ceiling |
| A candidate result/operator/release should be promoted, revised, archived, or rejected | [`review-admit`](review-admit/SKILL.md) | Explicit disposition + scope + cost + rollback + remainder |

Default cycle:

`Recover & Bound -> Build & Test -> Review & Admit -> repeat only if justified`

## Three levels up

See [`SOCIETY.md`](SOCIETY.md).

```text
Human Purpose / Constitutional Boundary
        ↓
Society / Orchestration
        ↓
Capability / Operator
        ↓
Skill
        ↓
ECS / explicit carriers
```

The compact project shorthand is:

`HUMAN PURPOSE -> SOCIETY -> OPERATORS -> ECS -> CARRIERS`

## Current project use

For the Red Wilds / Conscience64 game:

1. **Recover & Bound** imports the actual current game state, predecessor history, 8 places, 12 activities, five verbs, evidence/authority boundaries, and available render carriers.
2. **Build & Test** imports those objects into ECS entities/components/systems and executes deterministic world/video-job tests.
3. **Review & Admit** checks equivalence, accessibility, local/server authority separation, render provenance, lifecycle cost, rollback, and whether the ECS carrier should become the default implementation.

The first video contract uses only three scene perspectives:

- `player-pov`
- `character-view`
- `world-view`

For 8 current places this produces 24 deterministic scene-video job identities.

`VIDEO_RENDER != WORLD_AUTHORITY`

## Status language

Use these transitions explicitly:

`PROPOSED -> IMPLEMENTED -> EXECUTED/TESTED -> VERIFIED -> ADMITTED`

Any stage may instead become:

`REVISE | ARCHIVE | UNRESOLVED | REJECT`

Never skip a transition merely because the implementation is convenient or visually convincing.
