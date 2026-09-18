# Conscience64 MMO RPG v1.0 — Major Release Plan

**Target:** Sunday, November 15, 2026  
**Release name:** `RIPPING MANY ARMS OFF 1.0`  
**Current starting point:** local browser prototype with four mini-games, player role/joy/progress state, future prize vault, private non-graphic shapeshifter companion, Conscience64 browser-API cooperation, Twelve Levels architecture, and the annual Mystery 13th rule.

## Release promise

Ship a game people can actually enjoy playing, not a roadmap pretending to be a game.

The v1.0 release should let a person:

1. enter a persistent shared world;
2. choose or change a role without that role becoming a value judgment;
3. play multiple games inside the game;
4. explore places and trigger strange world events;
5. make, repair, remix, discover, and cooperate;
6. encounter monsters, Fuzzball, stories, and changing world conditions;
7. retain meaningful progress and history;
8. use the game with keyboard, touch, and accessible alternatives;
9. see when Conscience64 is actually contributing bounded context;
10. distinguish game fiction, research context, local progress, verified multiplayer achievements, and any real-world prize eligibility;
11. recover from failures without destroying the player's history by default;
12. have fun without needing to optimize money, status, streaks, or grind.

The annual Mystery 13th is **not** a November launch feature to invent. It is the eventual yearly result of Levels 1–12 and may remain `UNRESOLVED` until the evidence of the year exists.

---

# v1.0 scope

## RMAO successor gate

The release name now refers to the **Ripping Many Arms Off** successor. The target architecture is a massive 3D roguelike MMORPG, but release language must remain evidence-bounded. A build may claim only the gates it has actually passed.

Required successor mechanics:
- deterministic 3D world hierarchy: `WorldSeed → Region → Sector → Chunk → Cell → Entity`;
- chunk streaming with stable chunk IDs and reproducible generation hashes;
- floating-origin or equivalent precision management for very large coordinates;
- arbitrary creature limb graphs with `attached → damaged → disabled → detached` arm-state transitions;
- arm removal must change game capability through data (reach, equipment slots, attacks, defense, carrying), not hard-coded cosmetic scripting;
- roguelike run identity and run seed separated from persistent account/world history;
- run loss may reset run-scoped state while preserving explicitly persistent discoveries/history;
- authoritative server ownership of shared identity, inventory, combat resolution, limb state, loot, progression and persistent world state before the project claims a live MMORPG;
- optional non-graphic presentation that preserves identical mechanics using disable/disarm/break visual language instead of explicit gore.

`CLIENT_PREDICTION != COMBAT_AUTHORITY`  
`RUN_RESET != HISTORY_ERASURE`  
`LIMB_REMOVAL_GAMEPLAY != REAL_ANATOMY`

## Must ship

### World
- Ripping Many Arms Off as the first coherent world region.
- At least 6 meaningful places: Monster District, Impossible Speedway, Cipher Ruins, Maker Quarter, Common Ground, Fuzzball anomaly, plus connective exploration space.
- World-event system with deterministic event IDs and versioned content.
- Day/night or equivalent world-state variation with reduced-motion fallback.
- Loud regional ambience and fauna/flora flavor may exist, but essential information cannot depend on audio alone.

### Games inside the game
Minimum **12 replayable activities**, with at least:
- 3 reaction/movement games;
- 3 puzzle/language/pattern games;
- 2 creative/maker games;
- 2 cooperative/helping activities;
- 1 monster game;
- 1 Fuzzball research-question activity.

Every activity must have:
- an immediate understandable goal;
- a tap/click path;
- a keyboard path when applicable;
- observable completion/failure state;
- a non-punitive recovery path;
- bounded rewards;
- no requirement to purchase anything.

### Player life
- Persistent account or pseudonymous player ID.
- Role switching: Explorer, Builder, Helper, Researcher, Storyteller, Chaos Mechanic.
- World chronicle/history.
- Discoveries and creations.
- Joy meter as a **game-state reflection**, not a measure of human wellbeing or worth.
- Player-controlled profile visibility.
- Export/delete controls for player-created content and account data where technically applicable.

### Multiplayer
- Authoritative server for shared-world state.
- Presence and shared zones.
- Cooperative activities.
- Basic groups/parties.
- Rate limiting and abuse controls.
- Server-authoritative scarce rewards and achievement verification.
- Client state never trusted for real-world reward eligibility.
- Version negotiation so old clients cannot silently corrupt current world state.

### Conscience64 cooperation
- Same-origin or authenticated bounded API adapter.
- Read-only Conscience64 retrieval for event/question seeds.
- `stats`, `search.simple`, selected `projects.*`, `projects.lessons`, and `irpo` integration where appropriate.
- Visible connected/degraded/offline state.
- No private data written into the public research registry.
- Preserve `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`.
- Game may transform retrieved context into fiction only when the fiction/research boundary is visible in provenance.

### Accessibility
- WCAG 2.2 AA target for the web game surface.
- Keyboard-complete core gameplay.
- Touch targets around 44×44 CSS px or larger.
- Visible focus.
- Screen-reader-readable state for all essential actions.
- Reduced motion.
- Forced-colors/high-contrast support.
- No color-only game state.
- Captions/text equivalents for meaningful audio.
- No timed task required for core progression without an adjustable or alternative route.
- Test at 320 CSS px without page-level horizontal scrolling.
- Manual assistive-technology testing before release; automated checks alone are not sufficient.

### Safety and community
- Report, block, mute, and moderation path before public multiplayer.
- No public adult/sexual presentation in general-audience shared spaces.
- The private shapeshifter remains fictional, adult, non-graphic, and isolated from child-facing/shared presentation.
- Player-generated names/text sanitized and treated as data, never executable content.
- No doxxing/location-sharing mechanics required for play.
- Minimum personal-data collection.

### Reliability
- Health/status endpoint or equivalent observability.
- Structured error logging without private content by default.
- Backups.
- Tested restore procedure.
- Rollback release artifact.
- Versioned world schema and migrations.
- Graceful degraded mode when Conscience64 or optional services fail.

---

# Real-world prize track

Prize support is a **separate release gate**. Failure of this gate must not block the game release.

## Default v1.0 behavior
`Prize Vault visible; redemption disabled.`

## Required before real-world redemption may turn on
- Published official rules reviewed by qualified counsel for every included jurisdiction.
- Clearly identified sponsor/operator.
- Exact prize inventory and approximate retail value.
- Eligibility, age, geography, entry period, judging/achievement criteria, tie handling, winner verification, fulfillment, taxes, privacy, dispute process, and support contact.
- No purchase/payment required to enter or improve a participant's chance to win.
- No purchasable random chances, paid loot-box route, or wager tied to real-world prizes.
- Server-side achievement attestation and tamper/fraud review.
- Separation between ordinary in-game currency and real-world prize eligibility.
- Data minimization: shipping/contact information collected only when needed for verified fulfillment and kept outside public game/research records.
- Fulfillment budget reserved before announcing prizes.
- Jurisdiction-specific filing/bond/registration checks completed where applicable.

### External legal check recorded September 13, 2026
- FTC business guidance states that sweepstakes requiring a purchase are unlawful and that state law may impose disclosures, licensing, or bonding requirements.
- Florida FDACS states that chance-based game promotions with total prizes above $5,000 and open in Florida require filing at least seven days before commencement and may require a surety bond or trust arrangement.

These checks are planning inputs, not legal clearance. Rules can change. Re-check immediately before enabling any promotion.

## Prize go/no-go date
**October 23, 2026.**

If counsel, fulfillment, verification, fraud controls, rules, and jurisdiction checks are not all green by that date, v1.0 ships November 15 with prize redemption disabled. No exception.

---

# Schedule

## Sept 14–20 — Foundation freeze
**Goal:** turn the current prototype into a testable product baseline.

- Register MMO in Play hub and project registry.
- Fix Play tests that assume six projects.
- Add dedicated MMO static/source checks.
- Finish Twelve Levels + Mystery 13th architecture.
- Establish release branch convention and version file.
- Define event/achievement/world schemas.
- Define privacy boundary and content provenance fields.
- Confirm Conscience64 adapter behavior and fail-soft state.
- Add release checklist to CI.

**Exit gate:** clean static checks; no unresolved resource links; current prototype still playable without network services.

## Sept 21–27 — Gameplay vertical slice
**Goal:** one complete, enjoyable 30-minute loop.

- Expand from 4 to at least 8 mini-games/activities.
- Add exploration loop and place transitions.
- Add monsters with recoverable failure.
- Add Fuzzball question activity.
- Add creations/discoveries history.
- Add role-specific activity variations.
- Tune Joy/XP so optional fun is not punished by progression.
- Add accessible alternatives for reaction/timed content.

**Exit gate:** fresh player can enter, understand, play, fail, recover, discover, and leave with retained local history.

## Sept 28–Oct 4 — Multiplayer alpha
**Goal:** authoritative shared state.

- Build server/API boundary.
- Account/pseudonymous identity.
- World rooms/shards.
- Presence and parties.
- Server-side event IDs.
- Persistence and schema migration.
- Rate limiting.
- Signed/attested achievement events.
- Network disconnect/reconnect behavior.

**Exit gate:** two or more clients can share a place and complete a cooperative activity without trusting client-submitted scarce rewards.

## Oct 5–11 — Community, moderation, accessibility
**Goal:** make multiplayer safe and usable enough to test with people.

- Mute/block/report.
- Moderator audit trail.
- Abuse/rate-limit tests.
- Keyboard pass across core game.
- Screen-reader pass on navigation and essential game state.
- Reduced-motion and no-audio alternatives.
- Mobile 320px/390px layout checks.
- Color/contrast/forced-color checks.
- Plain-language help and first-run onboarding.

**Exit gate:** no known P0 accessibility or moderation blocker in the core loop.

## Oct 12–18 — Content and 12-level integration
**Goal:** make the world feel alive rather than technically complete.

- Reach 12+ activities.
- Finish all six initial districts/places.
- Add regional world events and environmental variation.
- Add maker/help/story loops.
- Add Conscience64-seeded bounded events with visible provenance.
- Add world chronicle and restoration/version hooks.
- Test that each of Levels 1–12 is represented by at least one implemented mechanism or explicit non-v1.0 boundary.

**Exit gate:** content review finds no fake claim that unimplemented network/platform/prize capability already exists.

## Oct 19–23 — Prize gate + security gate
**Goal:** decide whether real-world prize redemption can legally and operationally launch.

- Complete counsel review.
- Finalize official rules if prizes proceed.
- Complete fulfillment sourcing and inventory.
- Verify fraud/achievement pipeline.
- Threat-model auth, session, API, XSS, CSRF where applicable, privilege boundaries, account deletion, server events, and admin tooling.
- Dependency/SBOM review.
- Secret scanning.
- Backup/restore exercise.

**Oct 23 decision:** `PRIZES_ON` or `PRIZES_DEFERRED`.

## Oct 24–Nov 1 — Closed beta
**Goal:** expose mistakes before scale exposes them.

Target cohorts rather than a fixed player count:
1. developers/maintainers;
2. accessibility testers;
3. trusted gameplay testers;
4. first community cohort.

Measure:
- crash/error rate;
- disconnect recovery;
- activity completion/abandonment;
- reports/abuse workflow;
- accessibility failures;
- confusing onboarding;
- whether players voluntarily replay activities;
- whether people actually have fun, using optional qualitative feedback rather than treating telemetry as a substitute.

**Exit gate:** no open P0; P1s have owners/workarounds; restore procedure tested against real beta data.

## Nov 2–8 — Release Candidate 1
**Goal:** stop inventing major systems and stabilize.

- Feature freeze except release blockers.
- Full regression.
- Load/performance tests.
- Security review closure.
- Accessibility regression.
- Localization/string review for supported languages.
- Terms/privacy/community rules finalized.
- Prize rules published only if `PRIZES_ON`.
- Create rollback candidate from known-good build.

**Exit gate:** RC1 reproducibly deploys from a pinned commit and passes the launch matrix.

## Nov 9–12 — Release Candidate 2
**Goal:** rehearse launch.

- Production-like deployment rehearsal.
- Database migration rehearsal.
- Restore rehearsal.
- Incident drill.
- Moderation/support drill.
- Prize fulfillment dry run if enabled.
- Verify all public links, metadata, status pages, source/version pages, and history/restore routes.

**Exit gate:** launch can be completed and rolled back from written procedures.

## Nov 13–14 — Final freeze
**Goal:** touch as little as possible.

Allowed changes:
- P0 fixes;
- clearly bounded P1 fixes with tests;
- release metadata/version corrections.

No new gameplay systems, economies, prize mechanics, or migrations.

## Nov 15 — `RIPPING MANY ARMS OFF 1.0`

Release sequence:
1. create immutable v1.0 tag/release artifact;
2. snapshot backups;
3. deploy server/API;
4. run production smoke checks;
5. deploy web client;
6. verify Conscience64 degraded/connected modes;
7. verify moderation/support paths;
8. enable multiplayer incrementally;
9. enable prize redemption **only** if `PRIZES_ON` gate is already complete;
10. publish release notes, known limitations, recovery path, and v1.0 evidence boundary.

---

# Launch blockers

## P0 — blocks release
- account/auth bypass;
- remote code execution or stored/reflected script injection in normal player paths;
- cross-player data exposure;
- unrecoverable world/account data loss;
- client able to mint server-authoritative scarce/reward achievements;
- prize redemption without completed official rules/verification/fulfillment gate;
- payment required for prize eligibility or to improve prize odds;
- child-facing/shared space exposing adult sexual content;
- no keyboard/accessibility path through the core experience;
- moderation/report mechanism nonfunctional in public multiplayer;
- backup exists but restore has not been tested;
- current production build cannot be identified and rolled back.

## P1 — normally blocks unless explicitly waived with documented bounded workaround
- major activity inaccessible on mobile;
- persistent disconnect loops;
- high error rate in a core district;
- severe performance degradation under expected load;
- Conscience64 failure breaks core gameplay instead of degrading gracefully;
- world-version mismatch can corrupt state;
- critical help/support content missing.

---

# Verification matrix

Before v1.0:

- **Unit:** state transitions, rewards, parsers, achievement validation, role rules.
- **Property/invariant:** no negative/overflow reward state; no client-only prize eligibility; version boundaries preserved.
- **Integration:** client/server/world persistence/Conscience64 adapter.
- **Browser:** Chromium, Firefox, WebKit/Safari-equivalent where available.
- **Responsive:** 320px, 390px, tablet, desktop.
- **Accessibility:** automated + keyboard + screen reader + reduced motion + forced colors.
- **Security:** auth/session, injection, API authorization, rate limits, admin boundary, secrets, dependencies.
- **Load:** representative concurrent zone and event load with failure/recovery observation.
- **Recovery:** database restore, deployment rollback, corrupted-event isolation.
- **Prize:** separate legal/fulfillment/fraud verification suite if enabled.
- **Human:** players can identify what to do, find something enjoyable, stop without penalty, and return without unexplained loss.

---

# Release metrics that do not poison the design

Useful:
- successful session starts;
- crash/error/disconnect recovery rates;
- voluntary replay of activities;
- variety of activities chosen;
- creations/discoveries retained;
- reports resolved;
- accessibility defects found/fixed;
- qualitative “what was fun / frustrating / worth returning to?” feedback.

Do **not** optimize v1.0 primarily for:
- maximum time trapped in session;
- compulsive streak preservation;
- spending pressure;
- dark-pattern retention;
- maximizing prize-seeking behavior;
- reducing all human enjoyment to one telemetry score.

---

# Mystery 13th annual process

For the first annual review, inspect Levels 1–12 separately, preserve contradictions and failures, then ask:

> What genuinely emerged from the interaction of the whole system that was not adequately described by any one level?

Candidate Mystery 13th results must include provenance to the year's relevant observations. A result can be promoted only after review. `UNRESOLVED` is valid.

The November 15 launch begins the evidence period; it does not pre-answer the Mystery 13th.

---

# Definition of done for November 15

The major release is complete when:

- v1.0 is reproducibly buildable from a pinned commit;
- the public release page and game are reachable;
- core gameplay is actually playable;
- multiplayer authoritative state passes its launch tests;
- at least 12 activities exist and the player can choose among materially different kinds of fun/do/create/help play;
- Conscience64 cooperation works or degrades safely;
- accessibility and moderation gates pass;
- backups and rollback have been rehearsed;
- unresolved limitations are published;
- prize redemption is either legitimately ready and explicitly enabled, or clearly disabled without blocking the game;
- no roadmap language is presented as already implemented behavior;
- the Mystery 13th remains emergent.
