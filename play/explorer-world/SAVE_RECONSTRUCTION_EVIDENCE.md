# Explorer World save/reconstruction hardening evidence

## Scope

This change hardens the existing browser-local Explorer World save/resume boundary. It does not introduce server authority, account authority, multiplayer authority, new world entities, or a new persistence subsystem.

## Executed evidence

- Baseline reconstruction round-trip remained deterministic: `snapshot -> JSON transport -> hydrate -> snapshot` normalized to the same save document.
- A RED test demonstrated that the previous hydrator silently accepted a foreign echo identifier.
- The repair validates imported entity identifiers against the world produced by the canonical `createWorld(seed)` constructor and validates region identifiers against canonical `REGIONS`.
- The hardened local test passes after the repair.

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
- seeds outside the unsigned 32-bit constructor domain.

Unknown top-level authority-shaped fields remain non-authoritative input: hydration does not install them into runtime state and a subsequent canonical snapshot omits them.

## Claim ceiling

Passing these checks supports only the claim that the current local save format reconstructs a bounded local Explorer session deterministically under the tested inputs. It does not establish server-authoritative persistence, tamper-proof storage, multiplayer synchronization, authenticated identity, or authoritative achievements.
