# Conscience64 MMO RPG — Linkage Map

This file connects the MMO surfaces without collapsing their responsibilities.

## Load order

Resume current work in this order:

`CURRENT.md → REALITY_CANON.md → LINKAGES.md / linkages.json → LEVELS.md → RELEASE_PLAN_2026-11-15.md → implementation files → observed test results`

This prevents roadmap prose from being mistaken for current implementation.

## Canonical reality chain

`ordinary physical world → observed natural world → scientific observation → processed scientific image → game reconstruction → anomaly`

- **Current state ledger:** `CURRENT.md`
- **Reality canon:** `REALITY_CANON.md`
- **MMO main page:** `index.html`
- **Astronomy boundary:** in-game reconstruction is labeled; linked EHT/NASA sources retain the scientific evidence role.

When an older MMO aesthetic or content note conflicts with `REALITY_CANON.md`, the reality canon controls the current presentation. Historical predecessor files remain historical; they are not rewritten.

Boundary:

`OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`

## Player-facing chain

`Play Hub → MMO Main Page → Neighborhood / Observatory / World / Arcade → Arcade Forge → Grounded Starter Pack / user recipes → Installed Plug-ins → Portable Local Save → Chronicle / History`

- **Play Hub:** `../index.html`
- **MMO Main Page:** `index.html`
- **Current state:** `CURRENT.md`
- **Arcade Forge:** `forge.html`
- **Reality canon:** `REALITY_CANON.md`
- **Plug-in contract:** `plugin-contract.json`
- **Plug-in runtime:** `plugin-runtime.js`
- **Portable save runtime:** `save-runtime.js`
- **Known-good sample:** `plugins/duck-rescue.json`
- **History / restore:** `../../history/index.html?facet=mmo`

Installed plug-ins complete the local content chain:

`Forge install → validated local storage → MMO runtime discovery → local arcade cabinet → bounded local reward`

A plug-in result remains local state. It does not become server authority, multiplayer achievement proof, or real-world prize eligibility.

## Grounded Starter Pack chain

`explicit Forge button → six validated data-only recipes → local plug-in storage → MMO cabinet discovery → untimed local play`

The starter recipes live in `forge.js` and use the same `conscience64.mmo.plugin/v1` validator as user-created recipes:

- **Market Closing Shift** — corner-market helping choice.
- **Bus Transfer** — fictional in-game transit-reading input.
- **Workshop Sort** — maker-garage organization choice.
- **Observatory Label Check** — astronomy evidence-boundary choice.
- **Repair Bench Remix** — creative/maker activity using harmless ordinary materials.
- **Fuzzball: Question or Claim?** — research-boundary activity separating an open question from fact or proof.

The pack does not install automatically. The player must select **Install Grounded Starter Pack** in Arcade Forge.

Boundary:

`STARTER_PACK_INSTALL != SERVER_AUTHORITY`

Installing or completing a starter activity does not establish multiplayer achievement authority or real-world prize eligibility. The Fuzzball activity also preserves:

`OPEN_QUESTION != EVIDENCE != PROOF`

## Activity-mix linkage

Current explicit activity slots after installing the six-game pack:

`4 built-in + 6 Starter Pack = 10`

Current category coverage toward the November v1.0 mix:

- puzzle/language/pattern: covered;
- creative/maker: covered;
- cooperative/helping: covered;
- monster: covered;
- Fuzzball question: covered;
- movement/reaction: Redline provides one slot; **two additional movement/reaction activities remain**.

Those future movement/reaction activities should each include an accessible non-timed alternative rather than making motor speed the only participation path.

## Portable local-life chain

`current local run → validated save document → explicit browser save OR exported JSON → explicit load/import → restored local run`

- **Schema:** `conscience64.mmo.save/v1`
- **Runtime:** `save-runtime.js`
- **Player controls:** `index.html#save-title`

The save carries bounded local progress, role, shapeshifter form, motto, and the visible chronicle. It does not load automatically. Importing a portable save does not silently persist it as the browser's saved copy.

Boundary:

`LOCAL_SAVE != SERVER_AUTHORITY`

A portable save does not establish:

- multiplayer identity;
- server-authoritative achievements;
- scarce-item authority;
- anti-cheat attestation;
- real-world prize eligibility.

## Conscience64 cooperation chain

`MMO → Conscience64 browser API → bounded retrieval / projects / lessons / IRPO → world-event seed`

- **API contract:** `../../API.md`
- **Conscience64 root surface:** `../../index.html`
- **Research projects:** `../../research/projects/`
- **Project registry:** `../../research/projects/projects.json`

Boundary:

`CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`

The game may use retrieved context as inspiration, navigation, or a bounded world-event seed. Retrieval does not become proof, authority, multiplayer verification, or prize verification.

## Astronomy reference chain

`EHT / NASA observation and processing references → Reality Canon → labeled game reconstruction → player-facing observatory`

External references currently linked by the MMO:

- Event Horizon Telescope — M87* first black-hole image.
- Event Horizon Telescope — Sagittarius A* image.
- NASA/Webb — explanation of how infrared data are mapped into visible-color imagery.

The external scientific source retains the evidence role. The game visual retains only the reconstruction role.

## Scope chain

`Action → Activity → Session → Player Life → Place → World → Community → Network → Prize Layer → Conscience64 → Platform Ecosystem → Human Purpose → Mystery 13th`

- **Twelve levels + annual Mystery 13th:** `LEVELS.md`
- The Mystery 13th is an observed yearly result of the interaction of Levels 1–12.
- `MYSTERY_13TH != PREPLANNED_LEVEL_13`.

## Release chain

`Current grounded local prototype → plug-in content growth → authoritative multiplayer → moderation / accessibility / security gates → RC → RED WILDS 1.0`

- **Current state:** `CURRENT.md`
- **Major release plan:** `RELEASE_PLAN_2026-11-15.md`
- **Target:** November 15, 2026
- **Current art/world precedence:** `REALITY_CANON.md`

Roadmap status never upgrades itself into implementation status.

`ROADMAP != IMPLEMENTED_STATE`

## Prize chain

`In-game achievement → authoritative server verification → eligibility/rules check → fulfillment → support/dispute record`

The current public Prize Vault stops before redemption.

- local save != server authority
- local score != verified achievement
- verified achievement != prize eligibility
- prize eligibility != fulfillment completion
- no purchase, wager, or purchasable random chance is required by the current design

## Plug-in chain

`grounded place/object/activity → optional anomaly → Forge recipe → schema validation → local installation → runtime discovery → bounded mini-game → local game reward`

Plug-ins are data-only. They cannot ship executable JavaScript, arbitrary HTML, URLs, network authority, server authority, or prize authority.

## Verification chain

`source change → static project checks → Reality Canon regression → plug-in runtime test → save runtime test → existing Play Chrome suite → dedicated MMO Chrome smoke test`

- **Reality regression:** `test-reality.mjs`
- **Plug-in runtime test:** `test-plugins.mjs`
- **Portable save test:** `test-save.mjs`
- **MMO browser smoke test:** `browser-test.mjs`
- **CI gate:** `../../.github/workflows/playground.yml`

The dedicated MMO browser test checks:

- Grounded Starter Pack installation in Forge and discovery of all six cabinets in the MMO;
- grounded neighborhood and observatory surfaces load;
- 1100px and 320px layouts avoid page-level horizontal overflow;
- astronomy reconstruction stays labeled `NOT TELESCOPE DATA`;
- a data-only plug-in can be installed, discovered, rendered as a cabinet, and played;
- the exact bounded reward is applied locally;
- plug-in text containing HTML-like markup remains text rather than executable markup;
- the untimed Redline route remains playable;
- a local run can be explicitly saved, changed, and explicitly restored;
- reloading the page does **not** auto-load the saved run;
- explicit load after reload restores the saved state.

A configured check is not a passing result until CI actually reports success.

`TEST_CONFIGURED != TEST_OBSERVED_PASSING`

## Machine-readable map

`linkages.json` is the machine-readable form of this map. It includes the current-state ledger, Reality Canon, Grounded Starter Pack, external astronomy references, plug-in runtime, portable save runtime, verification scripts, CI gate, and evidence-boundary invariants.

## History and correction

All links are forward-facing navigation. They do not rewrite predecessor state.

`current surface → history/restore → predecessor → reviewed successor`

The REDOGIT rule remains: preserve what happened, make the difference inspectable, and treat a repair as a successor rather than a rewritten past.
