# MMO World Arcade Forge starter recipes

These JSON files are **data-only local preview recipes** for the canonical `play/mmo-world/` Arcade Forge. They do not execute plug-in code, modify canonical Explorer progression, create authoritative achievements, call the network, or grant real-world prizes.

## Preserved/adapted from the retired MMO branch

### Monster Mood

The retired runtime selected one of four moods at random: `GRUMPY`, `CONFUSED`, `DELIGHTED`, or `SUSPICIOUS`, then asked the player to match the displayed mood.

The current plug-in schema has no randomness primitive. Instead of claiming behavioral identity, the starter pack contains four fixed choice recipes—one for each original mood state:

- `monster-mood-grumpy.json`
- `monster-mood-confused.json`
- `monster-mood-delighted.json`
- `monster-mood-suspicious.json`

Each file therefore preserves one possible old-run state, not the old random selection mechanism.

### Cipher Snap

The three exact retired puzzles map directly to the current `input` mechanic:

- `cipher-snap-doubling.json` — `2 · 4 · 8 · ?` → `16`
- `cipher-snap-letters.json` — `A · C · E · ?` → `G`
- `cipher-snap-symbols.json` — `◆ ● ◆ ● ?` → `◆`

### Make Something

The retired runtime randomly combined materials and purposes. The current schema can preserve a bounded **single creative prompt**, not that random generator. `make-something-duck-compass.json` is one explicit adaptation using two source materials and one source purpose.

### Redline — deliberately not admitted

The retired Redline mini-game depended on elapsed reaction time and a delayed `GO` transition. The current `choice | input | creative` data contract cannot represent that timing behavior without changing its semantics.

Status: `DEFERRED_UNREPRESENTABLE_BY_CURRENT_PLUGIN_SCHEMA`.

Do not encode Redline as a fake choice or answer recipe merely to increase the plug-in count. A future timing mechanic, if useful, should be a separate contract decision with its own bounds and browser tests.

## Existing example

`duck-rescue.json` remains the known-good ordinary-life sample introduced with Arcade Forge. It is not recovered from the retired mini-game runtime.

## Verification

`play/mmo-world/forge/test.mjs` validates every JSON plug-in in this directory against `plugin-runtime.mjs` and checks the expected starter lineage IDs. The broader Playground and Pages workflows then exercise the Forge in Chrome.
