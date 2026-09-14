# Explorer World save/reconstruction hardening evidence

## Scope

This change hardens the existing browser-local Explorer World save/resume boundary. It does not introduce server authority, account authority, multiplayer authority, new world entities, or a new persistence subsystem.

## Executed evidence

### Pass 1 — identity admission

- Baseline reconstruction round-trip remained deterministic: `snapshot -> JSON transport -> hydrate -> snapshot` normalized to the same save document.
- A RED test demonstrated that the previous hydrator silently accepted a foreign echo identifier.
- The first repair validates imported entity identifiers against the world produced by the canonical `createWorld(seed)` constructor and validates region identifiers against canonical `REGIONS`.

### Pass 2 — reconstructed-state agreement

A second adversarial review found that canonical identifiers alone were insufficient. The hydrator could still accept a known entity carrying impossible mutable state, and the independent `echoes` / `defeated` counters could disagree with the entity state they purported to summarize.

- RED head `73b526f3a70f848833a1af6fbdee88eb048aaa07` added reachable canonical fixture state plus mismatch/impossible-state assertions.
- Playground run `34861683496` failed exactly at the new echo-counter consistency assertion while the predecessor MMO/ECS/renderer-society gates passed.
- The minimal repair binds the echo counter to collected canonical echo IDs, binds the defeat counter to dead imported monster state, and rejects impossible known-monster position/HP/alive combinations.
- GREEN head `3e5ebb63e72543d798f382176c61eb19705cfd2b` passed playground/browser run `34861800361` and spatial-UI run `34861800447`.

The original artificial test fixture had encoded six echoes with only two collected IDs and four defeats with only one dead monster. It was corrected to a reachable canonical state before the new consistency assertions were evaluated. This is a test-fixture correction, not evidence that historical production saves contained that inconsistency.

## Admission rules added

Imported Explorer save documents now reject:

- echo IDs not present in the canonical reconstructed world;
- duplicate echo IDs;
- monster IDs not present in the canonical reconstructed world;
- duplicate monster IDs;
- unknown or duplicate region IDs;
- player position outside the canonical world rectangle;
- health or energy outside 0..100;
- non-integer or out-of-world-range echo/defeat counters;
- seeds outside the unsigned 32-bit constructor domain;
- echo counters that do not equal the number of collected canonical echo IDs;
- defeat counters that do not equal the number of imported dead canonical monsters;
- known monsters outside the world rectangle;
- known monsters with HP above canonical `maxHp`;
- `alive:true` monsters with non-positive HP;
- `alive:false` monsters with positive HP.

Unknown top-level authority-shaped fields remain non-authoritative input: hydration does not install them into runtime state and a subsequent canonical snapshot omits them.

## Preserved distinctions

```text
LOCAL_SAVE != WORLD_AUTHORITY
CANONICAL_ID != AUTOMATICALLY_VALID_STATE
COUNTER != INDEPENDENT_ACHIEVEMENT_AUTHORITY
RECONSTRUCTION_SUCCESS != SERVER_PERSISTENCE
UNKNOWN_TOP_LEVEL_FIELD != RUNTIME_AUTHORITY
```

## Claim ceiling

Passing these checks supports only the claim that the current local save format reconstructs a bounded local Explorer session deterministically under the tested inputs and rejects the tested hostile/inconsistent deltas. It does not establish server-authoritative persistence, tamper-proof storage, multiplayer synchronization, authenticated identity, authoritative achievements, exhaustive malformed-input coverage, or protection against a hostile runtime that can bypass this hydrator.
