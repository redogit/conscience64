# Context Horizon 13D++ Navigation Design

Status: approved design specification
Date: 2026-09-14
Repository: `redogit/conscience64`
Initial rollout surface: Conscience64 / Play / Red Wilds MMO

## 1. Purpose

Context Horizon is an adaptive navigation layer over the existing Conscience64 web pages. It is modeled visually as a black-hole-like focus with context “hairs” that become more prominent as the system gains evidence about what the user is trying to reach.

The feature must improve navigation without replacing direct links, rewriting history, or presenting inferred intent as truth.

The system answers one question:

> Given the user’s current page, actions, explicit words, and available route graph, which nearby destinations are most likely to help next, and when should the system ask a discriminating question instead of choosing?

The 13D++ terminology describes a navigation/context model. It does not claim thirteen physical dimensions.

## 2. Design principles

1. **Adaptive layer, reliable substrate.** Ordinary links remain canonical, crawlable, keyboard-accessible, screen-reader-accessible, and usable with JavaScript disabled where practical. Context Horizon sits above them.
2. **Inference is inspectable.** A suggested route can expose why it was ranked: matched dimensions, relation type, provenance, confidence, and unresolved ambiguity.
3. **Questions beat guessing.** When several interpretations remain materially close, the system asks one targeted question designed to separate them.
4. **Deterministic core.** The same route graph, context snapshot, and inputs produce the same ranking. Visual animation may vary without changing route semantics.
5. **No authority inflation.** Navigation relevance does not upgrade evidence, canon, truth, multiplayer authority, or prize authority.
6. **History remains reachable.** Predecessors and restore/history routes are first-class context hairs, not hidden cleanup paths.
7. **The Mystery 13th is emergent.** D13 is derived from interactions among D1–D12 and must not be hard-coded as an ordinary category.
8. **Progressive disclosure.** The closer a route gets to the center, the more contextual detail is exposed: route title, relation, provenance, predecessor/successor, evidence status, and likely next actions.

## 3. Scope

### In scope for the first rollout

- Play Hub
- Simple MMO
- Advanced/predecessor MMO
- Arcade Forge
- Red Wilds visual/sample pages
- Explorer World
- Conscience64 root/research surfaces
- History/restore pages
- Existing route/link registries
- One deterministic ranking engine
- One accessible Context Horizon presentation
- Clarifying-question generation from bounded templates
- Route provenance and explanation
- Tests for ranking, ambiguity, fallback navigation, and evidence/authority invariants

### Explicitly out of scope for the first rollout

- Remote personalization service
- Hidden behavioral profiling
- Network account identity
- Cross-user recommendation models
- Autonomous mutation of world authority
- Prize eligibility decisions
- Replacement of browser history
- Replacement of canonical URLs
- Treating navigation confidence as evidence or truth
- A learned model that can invent routes not present in the admitted route graph

## 4. 13D++ model

Each route receives a normalized context vector over twelve explicit dimensions. The vector is descriptive metadata used for navigation, not a claim about the user or the world.

| Dimension | Meaning | Example signals |
|---|---|---|
| D1 Place | Where the material belongs | Red Wilds, Maker Garage, research space, history |
| D2 Activity | What can be done there | play, make, inspect, compare, restore, learn |
| D3 Person/Agent | Who or what is involved | player, companion, Conscience64, renderer, researcher |
| D4 Object | Relevant artifact/object | save, plug-in, image, video, route, evidence record |
| D5 Time/History | Temporal position | current, predecessor, release target, prior version |
| D6 Evidence | Evidence role/status | observation, reference, reconstruction, test result |
| D7 Research | Research domain/context | Hodge, P vs NP, carrier work, astronomy, project registry |
| D8 Creation | Construction intent | build, mutate, render, compose, export |
| D9 System/Tool | Technical subsystem | ECS, Renderer Society, Forge, save runtime, API |
| D10 World/Game State | Runtime/world relevance | local state, world place, activity state, visual candidate |
| D11 Purpose | Why the route may matter | understand, decide, create, recover, verify, explore |
| D12 Relation | Structural role | parent, child, predecessor, successor, dependency, evidence-of |

### D13 — Mystery 13th

D13 is not stored as another route category. It is computed from the interaction pattern among D1–D12 and the current route graph.

Examples of D13-like emergent structures:

- several independent routes converge on the same unresolved question;
- a predecessor, current successor, and evidence record form a meaningful reconstruction path;
- a game activity, research project, and tool form a useful cross-surface workflow;
- an unexpected relation becomes important only after multiple dimensions align.

D13 must be represented as a derived explanation such as `emergentRelation`, never as an asserted fact.

### `++` derived modifiers

The `++` portion contains extensible modifiers that affect ranking or explanation without becoming permanent top-level dimensions:

- provenance
- confidence
- recency
- contradiction
- dependency depth
- viewpoint
- accessibility preference
- directness
- reversible/history relation
- unresolved ambiguity
- user-explicitness
- evidence quality
- graph distance
- newly discovered relation candidates

Modifiers may be added without changing the meaning of D1–D12.

## 5. Core invariants

These are hard boundaries and should be executable tests where practical:

- `PROXIMITY != TRUTH`
- `RELEVANCE != EVIDENCE`
- `CONFIDENCE != AUTHORITY`
- `NAVIGATION_PREDICTION != USER_INTENT`
- `VIEWPOINT_CHANGE != WORLD_STATE_CHANGE`
- `REFERENCE != EVIDENCE`
- `LOCAL_STATE != WORLD_AUTHORITY`
- `HISTORY_LINK != CURRENT_STATE`
- `D13_EMERGENCE != PREDECLARED_DIMENSION`
- `VISUAL_PROMINENCE != SEMANTIC_PRIORITY` unless the ranking output explicitly says so
- `QUESTION_SELECTION != ANSWER_ASSUMPTION`

## 6. Canonical data model

The existing route/link registry remains the source of admitted destinations. Context Horizon adds metadata rather than duplicating page truth.

A route record should minimally contain:

```json
{
  "id": "arcade-forge",
  "href": "../forge.html",
  "title": "Arcade Forge",
  "kind": "creator-tool",
  "dimensions": {
    "place": ["maker-garage", "red-wilds"],
    "activity": ["make", "test", "install"],
    "personAgent": ["player"],
    "object": ["plugin", "recipe"],
    "timeHistory": ["current"],
    "evidence": ["none"],
    "research": [],
    "creation": ["build"],
    "systemTool": ["forge", "plugin-runtime"],
    "worldGameState": ["local"],
    "purpose": ["create", "play"],
    "relation": ["tool-for-mmo"]
  },
  "relations": [
    {"to": "simple-mmo", "type": "creates-content-for"},
    {"to": "plugin-contract", "type": "constrained-by"}
  ],
  "provenance": {
    "source": "canonical-web-route-registry",
    "status": "admitted"
  }
}
```

The initial implementation should prefer one route registry with both machine-readable metadata and ordinary page links derived from or validated against it.

## 7. Context snapshot

The ranking engine receives a bounded context snapshot. The snapshot contains only information needed for navigation and should be ephemeral by default.

```json
{
  "currentRoute": "simple-mmo",
  "explicitIntentTokens": ["images", "video", "renderer"],
  "recentActions": ["opened-visual-samples"],
  "selectedFacet": null,
  "historyDepth": 2,
  "accessibilityMode": "standard",
  "timestampBucket": "session"
}
```

No hidden personal profile is required for the first rollout.

## 8. Ranking model

The ranking engine is deterministic and explainable.

A route score should be a weighted composition of bounded factors:

`score = explicitIntent + dimensionMatch + relationStrength + graphCloseness + currentTaskContinuity + historyUtility + provenanceQuality - ambiguityPenalty - contradictionPenalty`

Requirements:

- weights are versioned and inspectable;
- explicit user signals outrank inferred signals;
- direct graph relations outrank weak lexical similarity when intent is otherwise equal;
- history/restore routes receive a positive boost when the action concerns correction, comparison, rollback, predecessor state, or “what changed”;
- evidence routes receive a boost for verification/research intent but never become more authoritative because of navigation score;
- no route can receive authority by ranking;
- ties are stable and deterministic.

The engine returns both score and explanation:

```json
{
  "route": "renderer-society",
  "score": 0.84,
  "matched": ["systemTool:renderer", "purpose:inspect", "relation:downstream-of-visual-carrier"],
  "confidence": 0.72,
  "unresolved": ["production-rendering-vs-diagnostic-rendering"]
}
```

## 9. Context hairs

A context hair is a presentation of one ranked candidate route or relation.

Each hair has:

- destination route;
- semantic relation to the current focus;
- score;
- confidence;
- provenance;
- ambiguity markers;
- optional predecessor/successor relations;
- explanation text suitable for screen-reader output.

Visual properties may map to ranking output:

- radial distance: current relevance;
- length: context available behind the route;
- thickness: relation strength;
- brightness: confidence in the navigation prediction;
- segmentation: provenance/evidence type;
- pulse/animation: recent change or newly surfaced relation.

These mappings must be documented and must not imply scientific truth, emotional state, or user worth.

## 10. Center / focus model

The center is the system’s current best navigation hypothesis, not the user’s “true intent.”

The center maintains:

- current best route or concept;
- confidence;
- second-best alternatives;
- ambiguity gap;
- explanation;
- question-needed boolean.

The center may move when:

- the user explicitly states intent;
- the user selects a hair;
- page state changes;
- a clarifying answer resolves ambiguity;
- the admitted route graph changes.

The center must not silently mutate world state, saves, canon, or research claims.

## 11. Clarifying-question policy

The system asks a question when navigation uncertainty is material.

A question is warranted when one or more conditions hold:

1. top candidates have a score gap below a configured threshold;
2. the top route contains an unresolved distinction that changes destination or action;
3. the requested term maps to different route classes, such as “video” meaning visual sample, renderer output, or release artifact;
4. choosing automatically would cross a boundary such as current vs predecessor, reference vs evidence, local vs authoritative, or private vs public surface.

Question generation is bounded and deterministic in the first rollout. It selects from templates attached to distinctions.

Example:

> You’re close to two different renderer paths. Do you want **generated visual examples** or the **Renderer Society control/evidence surface**?

A good question maximizes expected separation between competing routes while minimizing user effort.

The first rollout should prefer one question at a time.

## 12. Progressive disclosure

As a route approaches the center, disclosure increases in stages:

1. **Far:** title + broad category.
2. **Near:** title + relation + one-sentence purpose.
3. **Close:** provenance + current/predecessor status + evidence role + likely next action.
4. **Focused:** direct page link + neighboring dependencies + history/restore + explanation of why it was selected.

This implements the “hairs of context grow as you get close” behavior without hiding the actual URL.

## 13. UI and accessibility

The Context Horizon visualization is an enhancement, never the only navigation mechanism.

Required accessibility behavior:

- every hair is mirrored by an ordinary semantic link;
- keyboard users can traverse ranked routes in score order or ordinary document order;
- screen readers receive route title, relation, rank, and explanation without decorative black-hole language unless useful;
- reduced-motion preference disables orbit/pulse effects;
- high-contrast and forced-colors modes remain usable;
- the visualization does not rely on color alone;
- focus state is visually obvious;
- a plain “All pages” route map remains one interaction away;
- no timeout is required to inspect or answer a clarifying question.

## 14. Components

### A. Canonical web route registry

Purpose: one admitted machine-readable list of web destinations and structural relations.

Responsibilities:

- route IDs, hrefs, titles, kinds;
- 12D metadata;
- provenance and status;
- predecessor/successor/dependency relations;
- distinction/question metadata.

### B. Context engine

Purpose: deterministic ranking and ambiguity detection.

Responsibilities:

- normalize context snapshot;
- score admitted routes;
- compute D13 emergent relation candidates;
- produce explanations;
- decide whether a question is needed.

It does not render the UI and does not mutate page/world state.

### C. Question discriminator

Purpose: choose the smallest useful question when ranking remains ambiguous.

Responsibilities:

- identify which distinction best separates top candidates;
- choose a bounded template;
- map the answer back into a context snapshot update.

### D. Horizon presenter

Purpose: render black-hole center, context hairs, progressive disclosure, and semantic fallback links.

Responsibilities:

- visual geometry;
- accessible list representation;
- pointer/keyboard interaction;
- reduced-motion behavior;
- no ranking logic beyond consuming engine output.

### E. Route-map page

Purpose: explicit non-adaptive navigation and debugging surface.

Responsibilities:

- display all admitted web routes;
- show relation class and status;
- provide a permanent fallback;
- optionally expose machine-readable route-registry link.

### F. Explanation/provenance view

Purpose: make a recommendation inspectable.

Responsibilities:

- matched dimensions;
- route provenance;
- current/predecessor status;
- confidence and unresolved distinctions;
- relevant boundaries.

## 15. Data flow

```text
canonical route registry
        ↓
current page + explicit user signal + bounded session actions
        ↓
context snapshot
        ↓
13D normalization
        ↓
deterministic context engine
        ↓
ranked routes + explanations + ambiguity state
        ↓
   ┌───────────────┬────────────────┐
   ↓               ↓                ↓
horizon UI   accessible link list   question discriminator
   ↓               ↓                ↓
user selects route OR answers one clarifying question
        ↓
normal URL navigation / updated context snapshot
```

## 16. Error handling and fail-safe behavior

- Invalid route registry: disable adaptive ranking and show ordinary navigation.
- Missing route metadata: route remains directly navigable and receives neutral/default dimension metadata; log the omission in development diagnostics.
- Broken href: test failure; never substitute an invented destination.
- Ranking exception: preserve current page and show ordinary link map.
- Ambiguous question metadata: show top candidates instead of fabricating a question.
- Unknown user term: retain it as unresolved context and surface broad nearby routes; do not assign a false definition.
- D13 computation failure: omit emergent relation output; D1–D12 navigation still works.
- No JavaScript: direct page links remain usable.

## 17. Integration with existing Conscience64 boundaries

Context Horizon must preserve the existing project separations.

Examples:

- visual samples remain references unless separately admitted;
- Renderer Society routing does not create world authority;
- local saves remain local state;
- research retrieval remains context, not independent evidence;
- advanced/predecessor MMO remains distinguishable from the simplified current entry;
- history/restore remains inspectable rather than silently rewritten;
- prize redemption remains off until its independent gates are satisfied.

Context navigation is therefore a carrier of relationships, not an authority upgrade mechanism.

## 18. Initial rollout topology

The first admitted graph should explicitly connect:

```text
Play Hub
  ↕
Simple MMO ── Visual Samples
  │  ├── Arcade Forge
  │  ├── Advanced MMO / predecessor
  │  ├── Explorer World
  │  ├── Conscience64 root / research
  │  └── History / Restore
  │
  └── Renderer / ECS / artifact surfaces where a public web page exists
```

Non-page implementation files may appear in explanation/provenance views, but should not masquerade as playable web destinations.

## 19. Rollout phases

### Phase 1 — route truth

- finish canonical web-page registry;
- validate every internal href;
- distinguish current, predecessor, history, research, creator, visual, and game routes;
- keep all static navigation working.

### Phase 2 — deterministic 13D engine

- implement route-vector normalization;
- implement scoring and stable ties;
- implement explanations;
- implement D13 derived relation output.

### Phase 3 — questioning

- add distinction metadata;
- implement ambiguity thresholds;
- implement one-question discriminator;
- test that questions separate candidates rather than merely restate them.

### Phase 4 — Context Horizon UI

- add center + hairs visualization;
- add progressive disclosure;
- add accessible parallel list;
- add reduced-motion behavior.

### Phase 5 — rollout and evidence

- wire Play Hub and Simple MMO first;
- expand to Forge, visuals, Explorer World, research, and history;
- run browser tests and link validation;
- record observed results separately from design claims.

## 20. Verification strategy

### Unit tests

- route normalization is deterministic;
- route scores are stable for identical input;
- explicit intent outranks weaker inferred similarity;
- invalid/missing metadata degrades safely;
- D13 is derived, not stored as an ordinary input dimension;
- invariant boundaries cannot be promoted by scoring;
- stable tie ordering.

### Property/metamorphic tests

- adding irrelevant route metadata must not reorder unrelated top routes materially;
- changing visual presentation must not change semantic ranking;
- changing viewpoint must not change world state;
- removing D13 output must leave D1–D12 baseline navigation functional;
- reordering registry entries must not change scores.

### Question tests

- close competing routes trigger a question;
- clear winner does not trigger unnecessary questioning;
- answer shifts ranking in the intended direction;
- questions do not cross evidence/authority boundaries silently;
- unknown answers remain unresolved rather than coerced.

### Link tests

- every admitted internal page resolves;
- all canonical surfaces link back to either the route map or a parent hub;
- current Simple MMO and advanced predecessor remain distinguishable;
- history/restore remains reachable;
- no implementation file is accidentally advertised as a playable page.

### Browser/accessibility tests

- keyboard-only navigation;
- screen-reader semantic route list;
- 320px and desktop layouts without horizontal overflow;
- reduced-motion mode;
- forced-colors/high-contrast basic usability;
- Context Horizon failure leaves ordinary navigation operational.

## 21. Success criteria

The first rollout is successful when:

1. every admitted game/research web page is reachable through the canonical map;
2. the same context input always produces the same semantic ranking;
3. top-route explanations identify the dimensions/relations that drove the result;
4. materially ambiguous navigation produces one useful discriminating question;
5. users can always bypass the adaptive layer and use plain links;
6. no evidence, world-authority, save-authority, or prize boundary changes because of navigation ranking;
7. D13 appears only as derived emergent context;
8. automated tests verify direct links, deterministic ranking, ambiguity behavior, and fallback navigation;
9. observed test results are recorded separately from the specification.

## 22. Naming

Primary feature name: **Context Horizon**

Technical model name: **13D++ Context Compass**

Visual metaphor: **black-hole focus with context hairs**

The visual metaphor must not obscure the functional terminology used by assistive technologies or tests.

## 23. Decision record

Approved direction: **adaptive Context Horizon layered over normal links**, not a replacement for direct navigation.

Reason: this preserves reliable and accessible web navigation while allowing the higher-dimensional context model to experiment aggressively with relevance, relation, emergence, and targeted questioning.
