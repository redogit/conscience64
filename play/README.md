# Conscience64 / Play

> **Current publication state — 2026-09-25:** the repository-wide Play surface remains non-public on GitHub Pages, **except for the explicitly owner-authorized curated Musilanguage Studio route** at `play/musilanguage/`. The Pages builder projects only the Musilanguage runtime allowlist; older single/radio/Word Forge pages remain preserved source history and are not separate public routes. Existing MIT rights for material already covered by the scoped `play/` license remain intact; current no-commercial policy does not retroactively revoke those rights. See [../COMMERCIAL_ACCESS_POLICY.md](../COMMERCIAL_ACCESS_POLICY.md).


Free browser play and creative tools built from ongoing ideas. Open the [project hub](https://redogit.github.io/conscience64/play/).

## The priority: a world worth growing up with

The game world is the main product goal. Research, mathematics, science, language work, accessibility work, and experimental systems are supporting materials for making the games deeper, stranger, more useful, and more durable — not prerequisites for playing them.

The design target is simple:

`EARLIER PLAY REMAINS VALID + NEW OPTIONAL DEPTH = GROWTH`

A player should be able to begin by wandering, collecting, dancing, racing, building, making patterns, and hearing stories, then discover deeper crafting, ecology, strategy, science, creation tools, and long-form mysteries when they want them. Those are readiness layers, not age labels; ordinary play should not require collecting a child's age.

The default public game surface is intended to be child-safe. Adult material does not belong in child-facing play. Gambling-like monetization, paid random rewards, loot-box pressure, manipulative streaks, fear-of-missing-out timers, pay-to-win design, and child-targeted purchase pressure are outside the game contract.

The project is also allowed to become financially sustainable for the family, friends, collaborators, maintainers, artists, and infrastructure around it. Preferred revenue comes from clear value — straightforward ownership/permanent access, optional creator or pro tools, supporter/family packs, substantial expansions, donations, and other transparent offerings — rather than turning players into the product.

See the full [Grow-With-You Game Contract](GROW_WITH_YOU_GAME_CONTRACT.md).

| Project | Use it for | Current boundary |
| --- | --- | --- |
| [Conscience64 MMO RPG](https://redogit.github.io/conscience64/play/mmo/) | Live in a grounded world of neighborhoods, work, travel, games, people and real-sky observation before monsters, Fuzzball and impossible events intrude | Local-first MMO-world prototype today; networked MMO and real-world prize redemption are not yet active |
| [MMO World Beta](https://redogit.github.io/conscience64/play/mmo-world/) | Explore the earlier founding shard while the grounded successor evolves | Preserved predecessor; shared networking remains gated |
| [Explorer World](https://redogit.github.io/conscience64/play/explorer-world/) | Cross strange regions, fight monsters, collect Echo Shards, follow story signals, and find Fuzzball | Browser-game prototype; world and progression remain bounded to implemented behavior |
| [Orbit Shelf](https://redogit.github.io/conscience64/play/orbit/) | Collect and search notes, source links, and writing-language metadata | Import/export a project file; optional browser storage |
| [Word Weave](https://redogit.github.io/conscience64/play/weave/) | Arrange lines of writing while preserving the original | Download the remix or export the project |
| [Pattern Garden](https://redogit.github.io/conscience64/play/garden/) | Explore a six-by-six pattern with shapes, rotation, mirroring, and undo | Download SVG/text or export the project |
| [Small Steps](https://redogit.github.io/conscience64/play/steps/) | Plan one next step and record dated checkpoints | Export the current draft and prior checkpoints |
| [Source Compare](https://redogit.github.io/conscience64/play/compare/) | Inspect exact line additions and removals between two texts | Open UTF-8 files; export both versions and comparison |
| [Computational Chorus](https://redogit.github.io/conscience64/play/computational-chorus/) | Turn bounded research notation into exact, speakable, mnemonic, and musical forms | Mnemonics/sonification are memory aids, not proof |
| [Musilanguage Studio](https://redogit.github.io/conscience64/play/musilanguage/) | Turn language, symbols, emoji, or exact UTF-8 into multi-style instrumental music; shape six instrument buses; export MIDI/WAV; inspect the preserved lineage inside the app | Artistic/generative mapping; 64 style profiles and procedural instruments do not imply cultural authenticity or semantic truth |

## Musilanguage Studio — one public music application

The current public Musilanguage surface is intentionally **one application**:

```text
language / symbols / UTF-8
-> MUSIC64 cells
-> 64 style profiles
-> six procedural instrument buses
-> listener-controlled mix / reversible variation
-> playback / MIDI / WAV
-> preserved in-app history
```

The six rendered buses are guitar/distorted strings, bass/low voice, keys/harp/plucked voice, strings/sustained ensemble, lead/melodic voice, and drums/percussion. A style supplies an initial arrangement; the listener can mute, foreground, or rebalance each bus without changing the source text or MUSIC64 cells.

Earlier public-facing Musilanguage forms—**Carry the Fire**, **Musilanguage Radio**, and **Word Forge / MUSIC64**—remain preserved in Git history and repository source. They are predecessors, not deleted work, and their lineage is visible inside the unified Studio.

```text
ONE PUBLIC APP != ONE HISTORICAL VERSION
INSTRUMENT MIX != SOURCE MUTATION
LANGUAGE-TO-MUSIC != SEMANTIC TRANSLATION
STYLE PROFILE != CULTURAL AUTHENTICITY CLAIM
```

## MMO RPG

The MMO prototype is intentionally about **fun, doing things, and being somebody** rather than maximizing grind or spending. Its world starts from recognizable ordinary life: apartments, markets, workshops, transit, parks, weathered materials, believable light, people doing everyday things, and a real-sky/astronomy reference layer. Monsters, impossible geometry, Fuzzball, strange research connections and other anomalies are layered above that baseline rather than replacing it.

The grow-with-you direction means later systems should add optional depth rather than invalidate earlier ways to play. A player who loves exploring or building should not be forced into a more complicated progression system just because it exists. Different play styles are parallel paths rather than a single maturity ladder.

The current visual/world direction is canonical in [`mmo/REALITY_CANON.md`](mmo/REALITY_CANON.md). If older MMO aesthetic notes conflict with it, the Reality Canon controls the current successor while predecessor history remains preserved.

Key boundary:

`OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`

The in-game roof observatory uses real astronomy as a structural reference. EHT black-hole imagery and NASA/Webb processing explanations remain evidence/reference sources; the game's star field and black-hole view are labeled reconstructions, not telescope data.

The architectural zoom is documented in [`mmo/LEVELS.md`](mmo/LEVELS.md): twelve levels from one action through human purpose, followed by a **Mystery 13th** that is the annual emergent result of the twelve rather than a preplanned Level 13.

The cross-surface graph is documented in [`mmo/LINKAGES.md`](mmo/LINKAGES.md) and [`mmo/linkages.json`](mmo/linkages.json).

### Plug-and-play Arcade Forge

Arcade Forge follows the same grounded rule: real place/object/activity first, then an optional strange complication. Fully ordinary mini-games are valid.

The local plug-in path is now end-to-end:

`Forge recipe → validation → local installation → main-MMO discovery → arcade cabinet → local play → bounded local reward`

The main MMO reads installed `conscience64.mmo.plugin/v1` recipes from the validated local runtime and renders them as additional arcade cabinets without rebuilding the application. Choice, answer, and creative plug-ins can be played directly from the main page.

Plug-ins remain data-only. They cannot add executable JavaScript, arbitrary HTML, network authority, server authority, multiplayer achievement authority, or real-world prize authority. HTML-like text in a plug-in is rendered as text.

The full major-release target is **November 15, 2026**. See [`mmo/RELEASE_PLAN_2026-11-15.md`](mmo/RELEASE_PLAN_2026-11-15.md). The plan separates the game release from real-world prize activation: the game may release with the Prize Vault visible but redemption disabled if legal, verification, fraud-control, privacy, or fulfillment gates are not complete.

### Conscience64 cooperation boundary

The MMO uses the public read-only Conscience64 browser API as a cooperating context/research carrier. It can retrieve bounded objects, projects, lessons, and IRPO records to seed questions or world events. `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`: retrieval does not transfer proof, authority, or prize eligibility.

### Real-world prizes

The prototype does **not** currently redeem real-world prizes. Any future prize program must have official rules, verified server-side achievements, eligibility and jurisdiction review, fraud controls, privacy-minimized fulfillment, and funding before activation. The current design does not require a purchase, wager, purchasable random chance, or cash-equivalent loot-box route for prize participation.

## Sustainable game economics

Making money is compatible with the project; predatory game economics are not.

The working preference is to sell or accept support for things a person can understand before paying: ownership/permanent access, optional creator/pro capabilities, family/supporter packages, meaningful expansions, donations, or physical extras when fulfillment is ready. Ordinary progress should not depend on payment, random purchases, artificial scarcity, or pressure aimed at children.

A successful business outcome is not just revenue. It is revenue that can support the people doing the work while leaving the game enjoyable for someone who simply wants to play.

## Local-first tools and data

No account, payment, backend, analytics, remote font, or package installation is needed to use the existing local tools. Work stays in memory unless the person explicitly saves to their browser or downloads a file. Opening a source link makes a normal browser request to that website in another tab. Browser storage can be cleared or unavailable; exported files are portable backups. Do not rely on keeping an unsaved tab open as storage.

The MMO is also local-first in its current public prototype. Networked identity, authoritative multiplayer state, and server-attested achievements are November-release work and must not be represented as already implemented until they exist.

## Language and access

The original Play suite includes English, Spanish, French, and Arabic interface translations and supports Unicode writing in any language. The MMO v1.0 plan requires localization/accessibility work before claiming equivalent language coverage.

The interfaces use native labeled form controls, visible keyboard focus, status announcements, responsive layouts, reduced-motion support, and forced-colors support where implemented. Automated browser checks do not establish universal accessibility, cultural suitability, or WCAG conformance. The November MMO plan explicitly requires manual assistive-technology review in addition to automation.

## Run and verify

From the repository root, serve the static files:

```bash
python3 -m http.server 8000
# Open http://localhost:8000/play/
# MMO: http://localhost:8000/play/mmo/
```

Run the dependency-free checks with Node.js 22 or newer:

```bash
node play/test.mjs
node play/mmo/test-reality.mjs
node play/mmo/test-plugins.mjs
```

For browser checks, install Google Chrome locally or use the included GitHub Actions gate:

```bash
node play/browser-test.mjs
node play/mmo/browser-test.mjs
```

The MMO-specific browser smoke test checks the grounded neighborhood and observatory, 1100px and 320px layout behavior, astronomy labeling, local plug-in installation/discovery/play, exact bounded local rewards, and that HTML-like plug-in text does not execute as markup.

These checks verify the current prototype surfaces only. Dedicated multiplayer, manual accessibility, security, load, recovery, child-safety, moderation, and prize-verification gates remain separate v1.0 work and must not be inferred from passing local/browser tests.

## Origins and rights

These are new implementations made for the user's GitHub rollout and game requests, not recovered historical code unless a specific source record says otherwise. `projects.json` records source relationships and boundaries. Relationships do not transfer research authority or establish new scientific claims.

The MIT license in this directory applies to the new code and documentation under `play/`. It does not relicense the surrounding repository, linked sources, historical archives, or material entered by users. Users retain their rights and responsibilities for their own content.

## Existing local data format

The original local tools export `conscience64.play/v1` documents with validated application IDs. The MMO plug-in surface uses the separate data-only `conscience64.mmo.plugin/v1` contract. Neither local format is an authoritative multiplayer or prize record. Multiplayer persistence and verified achievements require separate server-side schemas under the v1.0 release plan.
