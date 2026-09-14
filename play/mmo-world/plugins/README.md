# MMO World Arcade Forge starter recipes

These JSON files are **data-only local preview recipes** for the canonical `play/mmo-world/` Arcade Forge. They do not execute plug-in code, modify canonical Explorer progression, create authoritative achievements, call the network, or grant real-world prizes.

## Preserved/adapted from the retired MMO branch

### Monster Mood

The retired runtime selected one of four moods at random: `GRUMPY`, `CONFUSED`, `DELIGHTED`, or `SUSPICIOUS`, then asked the player to match the displayed mood.

The current plug-in schema does not reproduce that random selector. Instead of claiming behavioral identity, the starter pack contains four fixed choice recipes—one for each original mood state:

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

The retired runtime randomly combined materials and purposes. The current schema preserves one bounded **single creative prompt**, not that random generator. `make-something-duck-compass.json` is one explicit adaptation using two source materials and one source purpose.

### Redline — admitted through one new timing mechanic

The retired Redline runtime had four consequential interaction semantics:

1. wait for a random delay of `900 + Math.random() * 1800` milliseconds — a source interval of `[900, 2700)` ms;
2. pressing before `GO` is a false start;
3. once `GO` appears, reaction time is measured from a monotonic `performance.now()` clock;
4. the old local runtime attached `{xp:24, joy:7, tokens:2}` to completion and `{xp:3, joy:1}` to a false start.

`redline-classic.json` is admitted through the `timing` mechanic with `minDelayMs: 900`, `maxDelayMs: 2700`, the source success reward, and the source false-start reward.

The imported JSON still contains **no clock, timer callback, JavaScript, threshold, URL, or network authority**. `timing-runtime.mjs` is trusted canonical code that supplies the local clock/timer behavior.

Status:

`CORE_INTERACTION_SEMANTICS_ADAPTED / OLD_STATE_AUTHORITY_NOT_PRESERVED`

The important difference is reward authority. The old runtime changed its own local game state. Arcade Forge displays those reward values as historical/local **preview metadata only**. It does not modify Explorer progression or create authoritative achievements.

There is deliberately **no reaction-time pass/fail threshold**. The measured time is shown to the player but is not an accessibility gate, player-worth metric, progression requirement, or prize score. The Forge also exposes an immediate **Show signal now (practice)** control so waiting for a random signal is optional during preview.

## Existing example

`duck-rescue.json` remains the known-good ordinary-life sample introduced with Arcade Forge. It is not recovered from the retired mini-game runtime.

## Verification

- `play/mmo-world/timing-runtime.test.mjs` checks the source wait range, false start, monotonic reaction measurement, immediate practice signal, and cancellation with injected clocks/timers.
- `play/mmo-world/forge/test.mjs` validates every JSON plug-in in this directory against `plugin-runtime.mjs`, including timing bounds and rejection of plug-in-supplied clocks/thresholds.
- the broader Playground and Pages workflows exercise the Forge in Chrome.
