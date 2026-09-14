# Conscience64 / Play

Seven free browser projects built from ongoing ideas. Open the [project hub](https://redogit.github.io/conscience64/play/).

| Project | Use it for | Current boundary |
| --- | --- | --- |
| [Conscience64 MMO RPG](https://redogit.github.io/conscience64/play/mmo/) | Explore the Red Wilds, play games inside the game, create, help, discover, meet monsters and Fuzzball, choose roles, and cooperate with the Conscience64 browser API | Local-first MMO-world prototype today; networked MMO and real-world prize redemption are not yet active |
| [Orbit Shelf](https://redogit.github.io/conscience64/play/orbit/) | Collect and search notes, source links, and writing-language metadata | Import/export a project file; optional browser storage |
| [Word Weave](https://redogit.github.io/conscience64/play/weave/) | Arrange lines of writing while preserving the original | Download the remix or export the project |
| [Pattern Garden](https://redogit.github.io/conscience64/play/garden/) | Explore a six-by-six pattern with shapes, rotation, mirroring, and undo | Download SVG/text or export the project |
| [Small Steps](https://redogit.github.io/conscience64/play/steps/) | Plan one next step and record dated checkpoints | Export the current draft and prior checkpoints |
| [Source Compare](https://redogit.github.io/conscience64/play/compare/) | Inspect exact line additions and removals between two texts | Open UTF-8 files; export both versions and comparison |
| [Computational Chorus](https://redogit.github.io/conscience64/play/computational-chorus/) | Turn bounded research notation into exact, speakable, mnemonic, and musical forms | Mnemonics/sonification are memory aids, not proof |

## MMO RPG

The MMO prototype is intentionally about **fun, doing things, and being somebody** rather than maximizing grind or spending. Its initial world includes mini-games, districts, creative/maker play, cooperative/helping activities, monsters, discoveries, identity/role choices, a Joy game-state indicator, a private fictional adult shapeshifter companion kept non-graphic in the public build, and direct bounded cooperation with the public Conscience64 browser API.

The architectural zoom is documented in [`mmo/LEVELS.md`](mmo/LEVELS.md): twelve levels from one action through human purpose, followed by a **Mystery 13th** that is the annual emergent result of the twelve rather than a preplanned Level 13.

The full major-release target is **November 15, 2026**. See [`mmo/RELEASE_PLAN_2026-11-15.md`](mmo/RELEASE_PLAN_2026-11-15.md). The plan separates the game release from real-world prize activation: the game may release with the Prize Vault visible but redemption disabled if legal, verification, fraud-control, privacy, or fulfillment gates are not complete.

### Conscience64 cooperation boundary

The MMO uses the public read-only Conscience64 browser API as a cooperating context/research carrier. It can retrieve bounded objects, projects, lessons, and IRPO records to seed questions or world events. `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`: retrieval does not transfer proof, authority, or prize eligibility.

### Real-world prizes

The prototype does **not** currently redeem real-world prizes. Any future prize program must have official rules, verified server-side achievements, eligibility and jurisdiction review, fraud controls, privacy-minimized fulfillment, and funding before activation. The current design does not require a purchase, wager, purchasable random chance, or cash-equivalent loot-box route for prize participation.

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

Run the dependency-free core checks with Node.js 22 or newer:

```bash
node play/test.mjs
```

For existing browser checks, install Google Chrome locally or use the included GitHub Actions gate:

```bash
node play/browser-test.mjs
```

The MMO is now included in the static/project-registry checks. Dedicated multiplayer, accessibility, security, load, recovery, and prize verification gates are tracked in its November release plan and must be added before v1.0.

## Origins and rights

These are new implementations made for the user's GitHub rollout and game requests, not recovered historical code unless a specific source record says otherwise. `projects.json` records source relationships and boundaries. Relationships do not transfer research authority or establish new scientific claims.

The MIT license in this directory applies to the new code and documentation under `play/`. It does not relicense the surrounding repository, linked sources, historical archives, or material entered by users. Users retain their rights and responsibilities for their own content.

## Existing local data format

The original local tools export `conscience64.play/v1` documents with validated application IDs. The MMO does not reuse that format as an authoritative multiplayer or prize record. Multiplayer persistence and verified achievements require separate server-side schemas under the v1.0 release plan.
