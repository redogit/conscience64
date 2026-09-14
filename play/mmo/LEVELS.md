# Conscience64 MMO RPG — Twelve Levels Up

This document zooms the game from one immediate player action to the entire world ecosystem. Each level must preserve the lower levels rather than silently replacing them.

## 1. Action
One tap, keypress, choice, move, answer, build step, conversation, scan, race input, or creative act.

**Invariant:** an action is observable and reversible where practical.

## 2. Activity
A short thing worth doing: a mini-game, puzzle, monster interaction, maker task, conversation, exploration event, or cooperative job.

**Invariant:** activities should be enjoyable or useful without requiring a reward.

## 3. Session
A bounded play period containing activities, discoveries, identity choices, world events, and a local chronicle.

**Invariant:** stopping is allowed; failure must not erase meaningful discoveries by default.

## 4. Player Life
The player's evolving roles, preferences, creations, discoveries, relationships, history, and chosen direction.

**Invariant:** role != worth. Progress systems may unlock options but must not score human value.

## 5. Place
Districts, towns, wild areas, buildings, arcades, maker spaces, laboratories, races, gardens, ruins, and strange locations.

**Invariant:** each place has a reason to exist beyond visual decoration.

## 6. World
The Red Wilds and future regions: changing ecology, monsters, stories, games, social spaces, jobs, creative systems, events, seasons, and exploration.

**Invariant:** the world may surprise the player, but it must remain legible enough to act in.

## 7. Community
Players cooperating, competing, teaching, trading permitted in-game items, forming groups, staging events, making games, and helping improve the world.

**Invariant:** participation, consent, accessibility, moderation, and safety boundaries precede growth metrics.

## 8. Game Network
Authoritative multiplayer state, matchmaking, event scheduling, identity/account boundaries, anti-cheat, persistence, moderation, version compatibility, and server observability.

**Invariant:** local client state is not authoritative for scarce or real-world rewards.

## 9. Prize & Fulfillment Layer
Optional free-entry, skill/achievement-based real-world rewards with official rules, verified achievements, eligibility checks, fraud controls, privacy minimization, fulfillment, support, and dispute handling.

**Invariant:** no purchase, wager, purchasable random chance, or cash-equivalent loot-box mechanic is required to participate in the current design. Prize claims require server-side verification and published rules.

## 10. Conscience64 Cooperation Layer
The game uses the public read-only Conscience64 browser API for bounded context, research/project retrieval, lessons, graph traversal, and IRPO records.

**Invariant:** `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`. Research context can seed games or questions; it cannot silently become proof, authority, or prize verification.

## 11. Platform Ecosystem
Web, desktop, mobile, console, accessibility surfaces, creator tooling, APIs, saved-world transport, version history, localization, community extensions, and deployment infrastructure.

**Invariant:** platform differences must not erase player identity, provenance, accessibility, or world history.

## 12. Human Purpose
Why the whole thing exists: fun, curiosity, doing things, being someone, creating, helping, discovering, cooperating, learning, laughing, and having a world worth returning to.

**Invariant:** the system serves human life and enjoyment; the human does not exist to optimize the system.

---

## Compression

`Action → Activity → Session → Player Life → Place → World → Community → Network → Prize Layer → Conscience64 → Platform Ecosystem → Human Purpose`

Going upward changes scope, not ownership of truth. A success at one level does not automatically establish success at a higher one.

Examples:

- winning a mini-game != being a better person;
- a local score != verified multiplayer achievement;
- a verified multiplayer achievement != prize eligibility;
- a Conscience64 retrieval != independent evidence;
- a fun prototype != a functioning MMO network;
- a functioning MMO network != a healthy community.
