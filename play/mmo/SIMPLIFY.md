# Conscience64 MMO — Vast Simplification

The current successor should be understandable without loading the entire project history.

## One sentence

A grounded world where a person can **go, play, make, save, and learn**.

## Five verbs

1. **Go** — move somewhere.
2. **Play** — do one clear activity.
3. **Make** — create something small.
4. **Save** — keep local progress.
5. **Learn** — inspect references and boundaries.

Everything player-facing should reduce to one of these verbs or stay out of the default surface.

## Three local data types

- **player** — local progress and recent life;
- **activity** — one bounded thing to do;
- **context** — optional reference material.

Avoid creating a new state type unless one of these genuinely cannot carry it.

## Two hard boundaries

`LOCAL != AUTHORITY`

Local saves, scores, plug-ins, creations, and activity completions are local player state. They are not multiplayer authority and not prize proof.

`REFERENCE != EVIDENCE`

Conscience64 retrieval, linked astronomy sources, and other references may inform play or navigation. Retrieval does not transfer proof into the game.

## One page

The default game surface should be one page with:

- five primary verbs;
- current place;
- XP, Joy, discoveries;
- one activity at a time;
- recent creations/life;
- a small Learn panel.

Advanced surfaces such as Arcade Forge, project history, research records, release plans, prize governance, implementation diagnostics, and visual-reference review remain available but are not part of the default mental model.

## Visual samples

The simple game links to `simple/visual-samples/`, a reference-only gallery built from the current design session.

- 19 image samples total;
- 12 user-supplied references;
- 7 generated Red Wilds concept images;
- optimized preview copies are embedded into five small gallery pages so the review surface works without a separate image build pipeline.

These are **samples to learn from**, not automatic canon or finished production assets.

`SAMPLE != CANON`

`REFERENCE_IMAGE != IMPLEMENTED_GAME_ASSET`

Preserve provenance. For user-supplied images, verify applicable rights and consent before any reuse outside this project or beyond reference/design work.

## Twelve activities, one data shape

The release activity mix remains, but the default UI does not expose twelve different subsystems. Activities use one small data structure and one interaction pattern wherever possible.

The current simple core contains 12 bounded activities covering movement, puzzles, making, helping, monsters, astronomy literacy, and Fuzzball research boundaries.

## No timer pressure in the simple core

The simplified surface defaults to untimed participation. Faster challenge modes may exist elsewhere, but motor speed is not required for core participation.

## Existing work is not deleted

Simplification is a successor, not a rewrite of predecessor history.

- Existing MMO implementation remains in Git history.
- Arcade Forge remains available as an advanced creation surface.
- Detailed release/evidence documents remain available for maintainers.
- Mystery 13th remains an annual observed result, not a prewritten level.

## Release rule

`SIMPLE != DONE`

A simpler interface can satisfy the activity-count/category target and still be unready for production multiplayer, moderation, security, accessibility validation, or real-world prize activation.
