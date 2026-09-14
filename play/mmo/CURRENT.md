# Conscience64 MMO RPG — Current State

**Current successor direction:** grounded reality first.  
**Major-release target:** November 15, 2026 (`RED WILDS 1.0`).  
**Evidence rule:** implemented state, configured verification, observed verification, roadmap, and hypotheses remain separate.

## Implemented now

### Grounded world
- Main MMO page starts from ordinary neighborhood life before anomalies.
- Mercer & Red Street includes apartments, market, maker garage, bus stop, wet pavement, trees, people and everyday activities.
- Ordinary actions include walking, shopping, workshop activity, transit, rest and conversation.
- Red is an accent rather than the entire world palette.
- `REALITY_CANON.md` is the current presentation/content precedence document.

### Astronomy layer
- Roof observatory is present in the playable page.
- Game visuals include a dense star field and black-hole-inspired reconstruction.
- The reconstruction is labeled `IN-GAME RECONSTRUCTION · NOT TELESCOPE DATA`.
- EHT M87*, EHT Sagittarius A*, and NASA/Webb processing references are linked as external scientific references.
- Boundary retained: `OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION`.

### Games and player activity
- Four built-in activities currently exist: Monster Mood, Redline, Cipher Snap, and Make Something.
- Redline retains its reaction-speed route and now also exposes an explicit **untimed route** with no reaction timer and no penalty for waiting.
- The untimed Redline completion uses a smaller bounded local reward (`+12 XP`, `+6 Joy`, `+1 token`) while preserving access to the activity and world progression.
- Player-local state includes role, level, XP, Joy, discoveries, world tokens, chronicle entries and shapeshifter form.
- Joy is game state, not a claim about human wellbeing or worth.
- World districts currently expose bounded local interactions and Conscience64-seeded context where available.

### Direct Conscience64 cooperation
- Main MMO page embeds the same-origin public Conscience64 surface and uses its documented postMessage API.
- Current game code uses bounded `stats`, `search.simple`, and IRPO calls.
- Connected and degraded states are visible.
- Boundary retained: `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`.

### Plug-and-play Arcade Forge
- `forge.html` builds choice, answer, and creative mini-game recipes.
- `conscience64.mmo.plugin/v1` is data-only and validated by `plugin-runtime.js`.
- Plug-ins can be installed, removed, imported and exported locally.
- Installed plug-ins are discovered by the main MMO and rendered as local arcade cabinets.
- A validated installed plug-in can be played from the main MMO without rebuilding the site.
- Plug-in rewards are capped and remain local.
- HTML-like plug-in text is rendered as text, not interpreted as executable markup.
- Boundary retained: `PLUGIN_DATA != EXECUTABLE_AUTHORITY`.

### Portable local player state
- `conscience64.mmo.save/v1` is validated by `save-runtime.js`.
- The game exposes explicit Save, Load, Export, Import, and Clear-saved-copy controls.
- Nothing loads automatically on page startup.
- The save carries bounded local progress, role, shapeshifter form, motto, and up to 12 visible chronicle entries.
- Imported save data changes the current local run but is not automatically persisted as the browser's saved copy.
- Unknown authority-like fields are stripped by validation rather than promoted.
- A local save is portable player data, not authoritative multiplayer state and not prize proof.
- Boundary retained: `LOCAL_SAVE != SERVER_AUTHORITY`.

### Architecture and governance
- `LEVELS.md` defines Levels 1–12 and the annual emergent Mystery 13th.
- `MYSTERY_13TH != PREPLANNED_LEVEL_13`.
- `LINKAGES.md` and `linkages.json` connect the player, research, plug-in, save, release, prize, verification and history surfaces.
- `RELEASE_PLAN_2026-11-15.md` defines the v1.0 roadmap and launch gates.
- Prize Vault is visible but redemption is disabled.

## Verification configured

The repository currently contains:

- `play/test.mjs` — Play static/data checks.
- `play/mmo/test-reality.mjs` — Reality Canon and cross-file regression checks, including the untimed Redline path.
- `play/mmo/test-plugins.mjs` — executable plug-in validation/storage/reward-boundary checks.
- `play/mmo/test-save.mjs` — executable save validation/storage/import-export/boundary checks.
- `play/browser-test.mjs` — existing Play browser checks.
- `play/mmo/browser-test.mjs` — MMO browser smoke test for grounded surfaces, 320px layout, astronomy labeling, plug-in discovery/play, bounded rewards, text safety, the untimed Redline route, explicit save/load and no-auto-load behavior.
- `.github/workflows/playground.yml` — configured to run all of the above.

### Important verification status

At the time this CURRENT record was written, the new branch changes and verification jobs were configured, but a successful GitHub Actions run for the latest head had **not yet been observed through the available connector**.

Therefore:

`TEST_CONFIGURED != TEST_OBSERVED_PASSING`

Do not call the latest branch green until an actual run/result is observed.

## Accessibility boundary

Current implemented accessibility mechanisms include:

- semantic buttons/labels and status regions on the MMO surface;
- visible focus styling and responsive layouts;
- reduced-motion and forced-colors CSS support where implemented;
- 320px browser-layout smoke coverage;
- an explicit untimed alternative for Redline so reaction speed is not required to participate in that activity.

This does **not** establish WCAG conformance or completed assistive-technology compatibility. Manual keyboard, screen-reader, zoom, speech-input, switch/control and user review remain release work.

`AUTOMATED_ACCESSIBILITY_CHECK != MANUAL_AT_VALIDATION`

## Not implemented yet

The following remain roadmap work, not current capabilities:

- authoritative networked MMO server;
- shared persistent multiplayer world;
- production account/pseudonymous identity system;
- server-authoritative achievements;
- parties/presence/shared-zone networking;
- production moderation/report/block/mute systems;
- production anti-cheat/fraud attestation;
- real-world prize redemption;
- official prize rules/fulfillment pipeline;
- payment or store integration;
- app-store/console registration;
- full localization parity for the MMO;
- completed manual assistive-technology testing;
- completed security/load/recovery release gates;
- production deployment of this successor branch.

## Prize boundary

Current state:

`Prize Vault visible → redemption disabled`

Also:

- `LOCAL_SAVE != SERVER_AUTHORITY`
- `LOCAL_SCORE != VERIFIED_ACHIEVEMENT`
- `VERIFIED_ACHIEVEMENT != PRIZE_ELIGIBILITY`
- no current local save, plug-in, local score, client state, or Conscience64 retrieval can establish real-world prize eligibility.

## Scientific boundary

Current astronomy visuals are game reconstructions informed by real observational structure.

They are **not**:

- telescope data;
- a physical black-hole simulation;
- an independent scientific result;
- evidence for any new astrophysical claim.

## Next high-value batches

1. Observe and repair CI failures until the current branch is green.
2. Expand grounded activities before adding more spectacular anomalies.
3. Continue adding equivalent non-timed/non-audio routes wherever an activity otherwise depends on speed or sensory modality.
4. Extend portable player state only when a new field has a clear local-life purpose.
5. Build the first authoritative multiplayer vertical slice only after local state/contracts are stable.
6. Keep prize activation on its separate legal/verification/fulfillment gate.

## Reconstruction rule

When resuming work, load in this order:

`CURRENT.md → REALITY_CANON.md → LINKAGES.md / linkages.json → LEVELS.md → RELEASE_PLAN_2026-11-15.md → implementation files → observed test results`

Current state must not be reconstructed from roadmap prose alone.
