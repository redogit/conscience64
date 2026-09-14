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
- Installed plug-ins are now discovered by the main MMO and rendered as local arcade cabinets.
- A validated installed plug-in can be played from the main MMO without rebuilding the site.
- Plug-in rewards are capped and remain local.
- HTML-like plug-in text is rendered as text, not interpreted as executable markup.
- Boundary retained: `PLUGIN_DATA != EXECUTABLE_AUTHORITY`.

### Architecture and governance
- `LEVELS.md` defines Levels 1–12 and the annual emergent Mystery 13th.
- `MYSTERY_13TH != PREPLANNED_LEVEL_13`.
- `LINKAGES.md` and `linkages.json` connect the player, research, plug-in, release, prize, verification and history surfaces.
- `RELEASE_PLAN_2026-11-15.md` defines the v1.0 roadmap and launch gates.
- Prize Vault is visible but redemption is disabled.

## Verification configured

The repository currently contains:

- `play/test.mjs` — Play static/data checks.
- `play/mmo/test-reality.mjs` — Reality Canon and cross-file regression checks.
- `play/mmo/test-plugins.mjs` — executable plug-in validation/storage/reward-boundary checks.
- `play/browser-test.mjs` — existing Play browser checks.
- `play/mmo/browser-test.mjs` — MMO browser smoke test for grounded surfaces, 320px layout, astronomy labeling, plug-in discovery/play, bounded rewards and text safety.
- `.github/workflows/playground.yml` — configured to run all of the above.

### Important verification status

At the time this CURRENT record was written, the new branch changes and verification jobs were configured, but a successful GitHub Actions run for the latest head had **not yet been observed through the available connector**.

Therefore:

`TEST_CONFIGURED != TEST_OBSERVED_PASSING`

Do not call the latest branch green until an actual run/result is observed.

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

- `LOCAL_SCORE != VERIFIED_ACHIEVEMENT`
- `VERIFIED_ACHIEVEMENT != PRIZE_ELIGIBILITY`
- no current local plug-in, local score, client state, or Conscience64 retrieval can establish real-world prize eligibility.

## Scientific boundary

Current astronomy visuals are game reconstructions informed by real observational structure.

They are **not**:

- telescope data;
- a physical black-hole simulation;
- an independent scientific result;
- evidence for any new astrophysical claim.

## Next high-value batches

1. Observe and repair CI failures until the current branch is green.
2. Add persistent/exportable local player-world state without confusing it with authoritative multiplayer state.
3. Expand grounded activities before adding more spectacular anomalies.
4. Add accessible alternatives to timed/reaction activities.
5. Build the first authoritative multiplayer vertical slice only after local state/contracts are stable.
6. Keep prize activation on its separate legal/verification/fulfillment gate.

## Reconstruction rule

When resuming work, load in this order:

`CURRENT.md → REALITY_CANON.md → LINKAGES.md / linkages.json → LEVELS.md → RELEASE_PLAN_2026-11-15.md → implementation files → observed test results`

Current state must not be reconstructed from roadmap prose alone.
