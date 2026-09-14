# Living World Alpha 0.1 — Polyform Design

**Status:** Design polyform for written-spec review. The architectural direction was approved in chat; implementation remains gated on review of this file and a subsequent implementation plan.

**Branch:** `living-world-alpha-0-1-design-2026-09-14`

**Base:** `fa4d63261e7b9d22c9316449d5efc8499b867db0`

## 1. Purpose

Build the smallest defensible first-person playable Alpha that demonstrates a living, dynamical system-of-systems rather than a fixed activity/query interface.

The Alpha must let a player enter Red Wilds, observe a world whose systems depend on one another, intervene through a small compositional action vocabulary, see consequences propagate, form and falsify hypotheses through play, discover voluntary FUN, and save/replay the resulting history deterministically.

The Alpha is a vertical slice, not a production MMO and not a full civilization simulator.

## 2. Constitutional principles

### 2.1 FUN — Principle 0

FUN is not a scalar objective to maximize. It is the preserved possibility of voluntary joy, play, curiosity, relief, wonder, connection, silliness, mastery, beauty, surprise, or laughter.

Laughter is a valid observation that can witness relief or joy, but:

- `LAUGHTER != FUN`
- `ENGAGEMENT != FUN`
- `RETENTION != FUN`
- `REWARD != FUN`

FUN never overrides life, safety, consent, dignity, or agency.

### 2.2 Authority and evidence boundaries

The existing boundaries remain in force and are extended:

- `LOCAL != AUTHORITY`
- `REFERENCE != EVIDENCE`
- `VIDEO_RENDER != WORLD_AUTHORITY`
- `RENDER != WORLD_AUTHORITY`
- `QUERY != EVIDENCE`
- `REQUESTED_ACTION != ACCEPTED_CONSEQUENCE`
- `GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT`
- `TEST_SUPPORT != UNIVERSAL_TRUTH`
- `SOURCE != ADAPTATION`

A renderer may depict the world. A GraphQL operation may request or inspect state. Neither may directly redefine authoritative world state.

### 2.3 History is state

Destroyed or transformed systems are not silently erased.

`DESTROYED != ERASED`

History preserves consequential traces: descendants, ruins, language, tools, ecological changes, debts, technologies, records, myths, roads, institutions, unresolved mistakes, and other downstream effects.

### 2.4 People and systems remain distinct

The simulation may model agents and social systems, but a simulated or recorded model is not a person.

`PERSON != RECORDED_MODEL`

## 3. Core world model

The authoritative living-world kernel is intentionally small:

`W = (E, C, R, S, T, H, O)`

where:

- `E` — entities
- `C` — components and local state
- `R` — typed relations and dependencies
- `S` — systems that transform state
- `T` — time and authoritative events
- `H` — append-only consequential history
- `O` — obligations and invariants

The kernel supplies only general operations such as observing, relating, transforming, exchanging, remembering, and composing. Domain systems build richer behavior from those primitives.

No single `CivilizationEngine`, `EconomyEngine`, or `FunEngine` owns the world.

## 4. System-of-systems model

A participating system is modeled conceptually as:

`S_i = (X, N, W, C, D, P, R, V, H, Sigma)`

where:

- `X` — present state
- `N` — needs
- `W` — wants
- `C` — capabilities
- `D` — dependencies
- `P` — productions/contributions
- `R` — relationships
- `V` — viability vector
- `H` — history
- `Sigma` — continuity regime

`NEED != WANT`

A system can be materially viable yet live in a state it does not want.

### 4.1 Typed dependencies

The world is a typed dependency graph `G_t = (S_t, E_t)`.

A dependency edge carries consequential information rather than mere connectivity, for example:

- what is exchanged or relied upon
- amount or capacity
- quality
- latency
- reliability
- cost
- authority
- history/provenance

Changing a dependency can therefore change downstream systems without requiring a scripted quest.

### 4.2 Viability domains

Alpha models enough of the following domains to demonstrate interaction without pretending that all are reducible to one score:

- matter/resources
- energy
- ecology
- health/capacity
- knowledge
- infrastructure
- relationships/trust
- meaning/purpose
- FUN

`SURVIVAL != FLOURISHING`

`FLOURISHING != FUN`

`FUN != COMFORT`

The implementation must not average away a critical zero in one domain.

## 5. ABCDE continuity regimes

Each system may operate under a different continuity contract:

- **A — law only:** nothing is guaranteed beyond simulation law.
- **B — protected life floor:** a bounded protection exists for selected beings or introductory contexts.
- **C — continuity kernel:** enough resources, ecology, infrastructure, or knowledge are preserved to make recovery possible.
- **D — constructed continuity:** even the continuity kernel can fail; survival depends on what inhabitants actually build and preserve.
- **E — polyform survival:** A–D coexist across scales and can transition over history.

The Alpha must exercise more than one continuity regime. Later world scales may allow settlements, habitats, institutions, civilizations, or regions to collapse, fragment, migrate, transform, assimilate, or enter dormancy.

Recovery is never an unconditional timer. A recovery path requires surviving carriers, resources, agents, relationships, or knowledge sufficient to reconstruct a viable successor.

## 6. Wants, cognition, and IRPO

Sufficiently autonomous inhabitants and systems may change their wants, values, commitments, and working models over time.

The common cognitive/adaptive loop is:

`I -> R -> P -> O -> I'`

- **I — What do we have?** inventory of believed state
- **R — What difference matters?** consequential distinction
- **P — What should we do next?** smallest useful action or experiment
- **O — What happened?** observed consequence

Assumptions, tests, unknowns, and inactive context remain available underneath rather than being deleted.

Agents act from partial internal models, not omniscient world state. Their models may be wrong. Model/world disagreement is a source of learning, surprise, comedy, failure, discovery, and repair.

## 7. Birth of an idea

An idea begins as a candidate possibility, never as established truth.

Playable idea lifecycle:

`NOTICE -> WONDER -> TRY -> WORLD RESPONDS -> OBSERVE -> COMPARE -> KEEP / REPAIR / ABANDON -> NEW POLYFORM`

A candidate records at least:

- source/provenance
- triggering observation
- assumptions
- context
- expected consequence
- unknowns

The world adjudicates ideas through consequences. A textual explanation may help a player understand those consequences, but text is not the authority.

`IDEA != ANSWER`

## 8. Alpha 0.1 vertical slice

### 8.1 Place

Use the existing Red Wilds simple MMO as the starting simulation cell rather than discarding it. The current eight places remain valid scene identities and navigation anchors.

The Alpha proves the architecture inside one neighborhood before widening to regions or civilizations.

### 8.2 Minimum interacting ecology

The first playable slice requires a small but real dependency ecology spanning at least:

- residents/agents
- local market/resources
- workshop/repair capability
- transport/infrastructure
- park/ecology
- knowledge/relationships
- Arcade/Observatory as discovery and FUN surfaces

At least one visible dependency must propagate a consequence across two or more systems.

### 8.3 Player verbs

The first-person player uses a deliberately small compositional vocabulary:

`MOVE, LOOK, TALK, TAKE, GIVE, USE, MAKE, HELP, WAIT, ASK`

Higher-level behavior is composed from these verbs rather than implemented as hundreds of unrelated special-case actions.

### 8.4 Alpha proof scenario

The Alpha passes only when a run can demonstrate this shape:

A player enters Red Wilds. Something consequential begins changing. No canned quest is required. The player can inspect the world, speak with inhabitants, form a theory, try an intervention, be wrong, learn, discover something useful or fun, and leave the neighborhood materially different from how it began.

The same run must demonstrate:

1. at least one dependency genuinely matters;
2. at least one NPC/system want changes from experience;
3. at least one hypothesis can be falsified;
4. at least one failure persists rather than auto-resetting;
5. at least one historical consequence survives save/reload;
6. at least one FUN event is discoverable and voluntary rather than a mandatory reward;
7. the same seed plus authoritative event history reconstructs the same authoritative state.

## 9. Authoritative event and replay model

Alpha authority is event-driven.

A player action request identifies at least:

- actor
- verb
- target
- arguments
- authoritative world tick or precondition version
- event/request identity

The engine validates the request, applies accepted actions through systems, records observations/consequences, and appends authoritative history.

Deterministic target:

`(initial seed, admitted event history) -> same authoritative world state`

Randomness must therefore use named deterministic streams or record enough information to replay authoritative consequences exactly.

Save data is not merely player stats. It is reconstructible authoritative world state plus the event/history material needed for deterministic continuation.

## 10. Browser-native generative graphics

"DHTML" in this design means standards-based dynamic HTML/DOM/CSS/JavaScript, not legacy browser-specific DHTML APIs.

Graphics are generated from world state using browser-native carriers:

`ECS WORLD STATE -> SCENE MODEL -> JS RENDER GENERATOR -> HTML/CSS/SVG/CANVAS`

The renderer can derive buildings, signs, weather, light, wetness, particles, NPC positions, environmental details, and UI state from deterministic scene inputs instead of relying on large pre-rendered image sets.

For an authoritative scene state `W`, render seed `s`, and camera `c`:

`R(W, s, c) = reproducible visual scene within the declared renderer/version boundary`

The renderer is not world authority. A rendering defect cannot mutate the living simulation.

### 10.1 Accessibility of generated visuals

Canvas or generated visual geometry must never be the only carrier of consequential information or interaction.

The semantic HTML/DOM layer remains a first-class representation of:

- player actions
- nearby interactable entities
- status and consequences
- dialogue/content
- critical environmental information

Keyboard, screen-reader, reduced-motion, non-drag alternatives, focus visibility, and target-size requirements are designed from the start.

The target is WCAG 2.2 AA. No conformance claim may be made until the implemented Alpha has been tested accordingly.

## 11. GraphQL membrane

GraphQL is a query/command schema membrane around the authoritative simulation, not the world engine.

`WORLD ENGINE <-> GRAPHQL MEMBRANE <-> UI / TOOLS / FEDERATION`

### 11.1 Queries

Queries expose permitted snapshots or projections of authoritative state.

`QUERY != EVIDENCE`

### 11.2 Mutations

GraphQL mutations submit action requests. They do not directly overwrite ECS components.

`GRAPHQL MUTATION -> VALIDATE -> ADMITTED EVENT -> SYSTEMS -> CONSEQUENCE`

Therefore:

`GRAPHQL MUTATION != WORLD MUTATION`

### 11.3 Event delivery

Alpha 0.1 does not require a nonstandard GraphQL subscription transport.

Use standards-based HTTP/Fetch for GraphQL query/mutation transport and HTML `EventSource`/Server-Sent Events for one-way authoritative world-event delivery where live push is needed. WebSocket support is deferred until bidirectional low-latency transport is demonstrated to be necessary.

The schema may model subscription-shaped concepts later without allowing transport choice to become world authority.

## 12. Standards baseline

The project follows stable normative standards or stable profiles. Living Standards are pinned in this design by an observed revision date and must be rechecked before release because they continue to evolve.

Stable baseline observed on 2026-09-14:

- **HTML:** WHATWG HTML Living Standard, developer edition observed updated 2026-09-08.
- **DOM:** WHATWG DOM Living Standard, observed updated 2026-08-25.
- **Fetch:** WHATWG Fetch Living Standard, observed updated 2026-09-02.
- **URL:** WHATWG URL Living Standard, observed updated 2026-09-10.
- **JavaScript:** ECMA-262, ECMAScript 2026, 17th edition, June 2026. The ECMAScript 2027 document is a draft and is not the Alpha's stable baseline.
- **CSS:** W3C CSS Snapshot 2025 stable profile; use modules in its stable definition or separately justified interoperable features, not draft-only dependencies.
- **GraphQL:** GraphQL Specification, September 2025 Edition.
- **Accessibility:** WCAG 2.2 Recommendation and WAI-ARIA 1.2 Recommendation. WAI-ARIA 1.3 remains a draft and is not the stable baseline.
- **Vector graphics:** use stable SVG features; do not make Alpha authority depend on SVG 2 draft-only behavior. SVG 1.1 Second Edition remains the W3C Recommendation baseline where a numbered stable SVG Recommendation is required.
- **Canvas 2D / EventSource:** use the APIs defined by the current WHATWG HTML Living Standard.

Official references:

- https://html.spec.whatwg.org/dev/
- https://dom.spec.whatwg.org/
- https://fetch.spec.whatwg.org/
- https://url.spec.whatwg.org/
- https://262.ecma-international.org/
- https://www.w3.org/TR/css-2025/
- https://spec.graphql.org/September2025/
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/TR/wai-aria-1.2/
- https://www.w3.org/TR/SVG11/

### 12.1 Standards policy

- Prefer semantic native HTML before ARIA.
- Prefer stable standard APIs before framework-specific abstractions.
- Do not use draft-only features in authority-critical paths without an explicit compatibility gate and fallback.
- Recheck Living Standards and current browser interoperability before each release milestone.
- Treat specification currency and browser implementation support as different questions; both must be checked.

## 13. Cross-project federation — here and abroad

The living constitution can be applied across active projects without collapsing them into one repository.

Federation shape:

`P_i <-> Polyform Bridge <-> P_j`

A bridge carries at least:

- identity
- meaning
- obligations
- provenance
- authority
- evidence class
- cost
- rollback/reconstruction information

`CAN CONNECT != SHOULD MERGE`

`SHARED IDEA != SHARED AUTHORITY`

The shared constitutional layer is:

`FUN + IRPO + History + Polyforms + Evidence Boundaries + Human Purpose`

Each project expresses that constitution through its own domain. Conscience64 may coordinate but does not thereby gain authority over unrelated project-local obligations.

External/public systems enter through an Airlock progression rather than being treated as facts on discovery:

`DISCOVERED -> REFERENCED -> RETRIEVED -> IDENTITY_RECONCILED -> INDEPENDENTLY_CHECKED -> EVIDENCE_ADMITTED`

Never `SEARCH_RESULT -> FACT`.

Private material remains private unless separately authorized.

## 14. Error handling and invalid state

Expected world failure and software-invalid state are different classes.

Examples of expected world failure:

- a business closes
- a crop fails
- trust collapses
- an inhabitant migrates
- a knowledge tradition is lost

Examples of invalid simulation state:

- dangling required entity reference
- impossible negative resource caused by transaction corruption
- duplicate authoritative event identity
- replay divergence under the same declared version/seed/event history

Expected world failure becomes gameplay/history. Invalid simulation state fails closed, records evidence, and blocks admission of the invalid transition.

## 15. Testing and evidence

Testing is layered:

1. **Unit tests** — pure rules, components, operators, validators.
2. **System interaction tests** — dependency propagation and multi-system consequences.
3. **Deterministic replay tests** — exact reconstruction for declared seeds, versions, and event histories.
4. **Metamorphic/ablation tests** — removing a claimed causal distinction should remove or alter the consequence it was claimed to produce.
5. **Playable Alpha scenario test** — the full vertical-slice proof scenario.
6. **Accessibility tests** — automated checks plus keyboard, screen-reader, focus, motion, and human inspection appropriate to WCAG 2.2 AA targets.
7. **Standards/interoperability checks** — supported target browsers against the standards baseline and required fallbacks.

A configured test is not a passing test:

`TEST_CONFIGURED != TEST_OBSERVED_PASSING`

Finite success never establishes universal correctness:

`FINITE_VERIFICATION != UNIVERSALITY`

## 16. Deferred from Alpha 0.1

The following are deliberately outside the first implementation boundary:

- production-scale MMO networking
- planetary/civilization-scale simulation
- remote durable multiplayer authority
- economy with real money or prizes
- neural image/video generation as a required graphics path
- WebSocket-only realtime transport
- draft-only web-platform dependencies
- automatic promotion of external research into game truth

These may receive successor polyforms after the Alpha proves the living-world kernel.

## 17. Acceptance boundary

Alpha 0.1 is successful only when the implementation demonstrates the vertical-slice proof with reproducible evidence while preserving the constitutional boundaries above.

The target is not maximum feature count. The target is the smallest playable program that proves:

`small rules × interacting systems × player action × time × history -> a world with consequential emergence`

FUN must remain possible throughout that world without being reduced to a reward metric.
