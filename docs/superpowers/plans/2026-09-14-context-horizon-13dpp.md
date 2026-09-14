# Context Horizon 13D++ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an explainable, deterministic 13D++ Context Horizon navigation layer that ranks existing Conscience64 web routes, surfaces context “hairs” around a black-hole-like focus, asks one bounded clarifying question when route intent is ambiguous, and always preserves direct ordinary links as the canonical fallback.

**Architecture:** `play/mmo/context-horizon/route-registry.mjs` becomes the canonical admitted web-route graph. Pure modules normalize context, score routes, derive emergent D13 relations, and select clarification questions; a separate presenter renders either a standalone horizon or an overlay on the existing root Space Lens. The existing `play/mmo/web-links.json` and `web-links.html` become validated materializations of the canonical registry rather than competing route sources.

**Tech Stack:** Browser-native ES modules, Node.js 22+, dependency-free `node:assert/strict` tests, existing Chrome DevTools Protocol browser harness, existing Conscience64/Space Lens HTML/CSS/JavaScript, GitHub Pages static hosting.

**Spec:** `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md`

## Global Constraints

- `PROXIMITY != TRUTH`
- `RELEVANCE != EVIDENCE`
- `CONFIDENCE != AUTHORITY`
- `NAVIGATION_PREDICTION != USER_INTENT`
- `VIEWPOINT_CHANGE != WORLD_STATE_CHANGE`
- `REFERENCE != EVIDENCE`
- `LOCAL_STATE != WORLD_AUTHORITY`
- `HISTORY_LINK != CURRENT_STATE`
- `D13_EMERGENCE != PREDECLARED_DIMENSION`
- `QUESTION_SELECTION != ANSWER_ASSUMPTION`
- The same admitted route graph + context snapshot + versioned weights must produce the same ranking.
- Explicit user signals outrank inferred/session signals.
- No route ranking can promote evidence, canon, multiplayer authority, or prize authority.
- The first rollout uses no remote personalization service and no cross-user model.
- The adaptive horizon is an enhancement only; direct URLs and plain semantic links remain usable if JavaScript fails or is disabled.
- Reduced-motion, forced-colors, keyboard navigation, and screen-reader routes must remain usable.
- The Mystery 13th is derived at runtime from D1–D12 interactions and is never stored as an ordinary route category.

---

## File Structure

### Create

- `play/mmo/context-horizon/route-registry.mjs` — canonical route graph, 12D metadata, relations, provenance, and validation.
- `play/mmo/context-horizon/route-registry.test.mjs` — unique IDs/hrefs, required dimensions, valid relation targets, canonical-primary-route tests.
- `play/mmo/context-horizon/sync-web-links.mjs` — materialize `web-links.json` from the canonical route graph and verify `web-links.html` contains each public page route.
- `play/mmo/context-horizon/engine.mjs` — context normalization, versioned deterministic scoring, explanation output, confidence, graph distance.
- `play/mmo/context-horizon/engine.test.mjs` — ranking determinism, explicit-intent precedence, history boosts, authority boundary tests.
- `play/mmo/context-horizon/emergence.mjs` — D13 derived relation detection only; no stored D13 route axis.
- `play/mmo/context-horizon/emergence.test.mjs` — positive and negative D13 cases.
- `play/mmo/context-horizon/questions.mjs` — bounded distinction table and one-question discriminator.
- `play/mmo/context-horizon/questions.test.mjs` — ambiguity threshold, separation, and no-fabricated-question tests.
- `play/mmo/context-horizon/session.mjs` — bounded per-tab context snapshot state.
- `play/mmo/context-horizon/session.test.mjs` — truncation, normalization, no hidden identity fields.
- `play/mmo/context-horizon/presenter.mjs` — semantic route list + visual hair geometry + progressive disclosure view model.
- `play/mmo/context-horizon/bootstrap.mjs` — page integration, intent form, question buttons, navigation/session wiring.
- `play/mmo/context-horizon/context-horizon.css` — standalone and Space Lens overlay styles, focus, reduced motion, forced colors.
- `play/mmo/context-horizon/browser-test.mjs` — focused browser verification of horizon behavior and accessibility fallback.

### Modify

- `play/mmo/web-links.json` — generated machine-readable mirror, schema v2.
- `play/mmo/web-links.html` — plain all-pages fallback plus horizon host.
- `play/index.html` — Play Hub horizon integration.
- `play/mmo/simple/index.html` — primary Red Wilds horizon integration.
- `play/mmo/index.html` — advanced/predecessor route identity + horizon integration.
- `play/mmo/forge.html` — creator-route identity + horizon integration.
- `play/mmo/simple/visual-samples/index.html` — visual-reference route identity + horizon integration.
- `play/explorer-world/index.html` — game-route identity + horizon integration.
- `research/projects/index.html` — research-route identity + horizon integration.
- `history/index.html` — history-route identity + horizon integration.
- `index.html` — existing Space Lens receives Context Horizon overlay, not a second black-hole widget.
- `space-lens-master.js` — expose the current route question to the horizon adapter without changing evidence authority.
- `space-lens-field.js` — accept presentation-only horizon events for hair emphasis without changing world/research state.
- `.github/workflows/playground.yml` — add unit and browser verification steps.

---

### Task 1: Canonical 12D Web Route Registry

**Files:**
- Create: `play/mmo/context-horizon/route-registry.mjs`
- Create: `play/mmo/context-horizon/route-registry.test.mjs`
- Create: `play/mmo/context-horizon/sync-web-links.mjs`
- Modify: `play/mmo/web-links.json`
- Modify: `play/mmo/web-links.html`

**Interfaces:**
- Produces: `DIMENSION_KEYS: readonly string[]`
- Produces: `ROUTE_REGISTRY: {schema:string, version:string, primaryRoute:string, routes:RouteRecord[]}`
- Produces: `getRoute(id:string): RouteRecord | null`
- Produces: `validateRegistry(registry=ROUTE_REGISTRY): {ok:true, routeCount:number}`; throws on invalid graph.
- Produces: `materializeWebLinks(registry=ROUTE_REGISTRY): object`
- Later tasks consume route records with exact fields: `id`, `href`, `title`, `kind`, `status`, `dimensions`, `relations`, `provenance`, `keywords`.

- [ ] **Step 1: Write the failing registry test**

Create `play/mmo/context-horizon/route-registry.test.mjs`:

```js
import assert from 'node:assert/strict';
import {DIMENSION_KEYS, ROUTE_REGISTRY, getRoute, validateRegistry, materializeWebLinks} from './route-registry.mjs';

assert.deepEqual(DIMENSION_KEYS, [
  'place','activity','personAgent','object','timeHistory','evidence',
  'research','creation','systemTool','worldGameState','purpose','relation'
]);
assert.equal(ROUTE_REGISTRY.primaryRoute, 'mmo-simple');
assert.equal(new Set(ROUTE_REGISTRY.routes.map(r => r.id)).size, ROUTE_REGISTRY.routes.length);
assert.equal(new Set(ROUTE_REGISTRY.routes.map(r => r.href)).size, ROUTE_REGISTRY.routes.length);
for (const route of ROUTE_REGISTRY.routes) {
  assert.deepEqual(Object.keys(route.dimensions).sort(), [...DIMENSION_KEYS].sort(), route.id);
  assert.equal(route.provenance.status, 'admitted', route.id);
  for (const rel of route.relations) assert.ok(getRoute(rel.to), `${route.id} -> missing ${rel.to}`);
}
assert.equal(getRoute('mmo-simple').href, '/conscience64/play/mmo/simple/');
assert.equal(getRoute('mmo-advanced').status, 'predecessor');
assert.equal(getRoute('history-mmo').kind, 'history');
assert.equal(validateRegistry().ok, true);
const json = materializeWebLinks();
assert.equal(json.schema, 'conscience64.mmo.web-links/v2');
assert.equal(json.routes.find(r => r.id === 'mmo-simple').publicUrl, 'https://redogit.github.io/conscience64/play/mmo/simple/');
console.log(`PASS Context Horizon route registry: ${ROUTE_REGISTRY.routes.length} admitted routes`);
```

- [ ] **Step 2: Run the test and verify it fails before implementation**

Run:

```bash
node play/mmo/context-horizon/route-registry.test.mjs
```

Expected: failure because `route-registry.mjs` does not exist.

- [ ] **Step 3: Implement the registry constants, validator, and exact admitted route set**

Create `route-registry.mjs` with these dimension keys:

```js
export const DIMENSION_KEYS = Object.freeze([
  'place','activity','personAgent','object','timeHistory','evidence',
  'research','creation','systemTool','worldGameState','purpose','relation'
]);
```

Use these admitted route IDs in v1 of the Context Horizon graph:

```text
conscience-root
play-hub
mmo-web-map
mmo-simple
mmo-advanced
arcade-forge
visual-samples
visual-page-1
visual-page-2
visual-page-3
visual-page-4
visual-page-5
visual-page-6
explorer-world
mmo-world-beta
research-projects
history-mmo
orbit
weave
garden
steps
compare
computational-chorus
about-today
```

Use exact absolute GitHub Pages hrefs rooted at `/conscience64/` so one registry works from every page. Required route status values are `current`, `predecessor`, `reference`, `history`, and `support`; `mmo-simple` is `current`, `mmo-advanced` and `mmo-world-beta` are `predecessor`, all `visual-*` routes are `reference`, and `history-mmo` is `history`.

For each route, populate all twelve dimension arrays. The minimum primary tags are:

| Route | Required tags |
|---|---|
| `conscience-root` | `place:conscience64`, `activity:search`, `systemTool:space-lens`, `purpose:understand` |
| `play-hub` | `place:play`, `activity:navigate`, `purpose:explore` |
| `mmo-web-map` | `activity:navigate`, `object:route`, `purpose:recover`, `relation:index-of` |
| `mmo-simple` | `place:red-wilds`, `activity:play`, `worldGameState:local`, `purpose:explore`, `relation:primary-entry` |
| `mmo-advanced` | `place:red-wilds`, `activity:play`, `timeHistory:predecessor`, `relation:predecessor-of` |
| `arcade-forge` | `place:maker-garage`, `activity:make`, `object:plugin`, `creation:build`, `systemTool:forge` |
| `visual-samples` + pages 1–6 | `activity:inspect`, `object:image`, `evidence:reference`, `creation:render`, `purpose:compare` |
| `explorer-world` | `activity:play`, `worldGameState:local`, `purpose:explore` |
| `mmo-world-beta` | `activity:play`, `timeHistory:predecessor`, `worldGameState:local`, `relation:predecessor` |
| `research-projects` | `activity:inspect`, `object:evidence-record`, `evidence:bounded-record`, `research:projects`, `purpose:verify` |
| `history-mmo` | `activity:restore`, `object:history`, `timeHistory:history`, `purpose:recover`, `relation:history-of` |
| `orbit` | `activity:search`, `object:note`, `systemTool:orbit`, `purpose:recover` |
| `weave` | `activity:make`, `object:text`, `creation:rewrite`, `purpose:create` |
| `garden` | `activity:make`, `object:pattern`, `creation:geometry`, `purpose:create` |
| `steps` | `activity:plan`, `object:experiment-record`, `purpose:decide` |
| `compare` | `activity:compare`, `object:text`, `systemTool:source-compare`, `purpose:verify` |
| `computational-chorus` | `activity:make`, `object:music`, `creation:compose`, `research:language`, `purpose:create` |
| `about-today` | `activity:inspect`, `timeHistory:current`, `purpose:understand` |

Required relations include:

```text
play-hub -> mmo-simple (opens-primary)
mmo-simple -> mmo-advanced (has-predecessor)
mmo-simple -> arcade-forge (creates-with)
mmo-simple -> visual-samples (has-reference-visuals)
mmo-simple -> history-mmo (has-history)
mmo-simple -> explorer-world (neighbor-game)
mmo-simple -> conscience-root (cooperates-with)
conscience-root -> research-projects (navigates-to)
research-projects -> conscience-root (returns-to)
arcade-forge -> mmo-simple (creates-content-for)
visual-samples -> mmo-simple (references)
history-mmo -> mmo-simple (history-of)
mmo-advanced -> mmo-simple (predecessor-of)
mmo-world-beta -> mmo-simple (predecessor-of)
```

`validateRegistry()` must reject duplicate IDs, duplicate hrefs, missing dimension keys, relation targets not present in the registry, a missing primary route, or any `provenance.status !== 'admitted'`.

- [ ] **Step 4: Add deterministic JSON materialization**

`materializeWebLinks()` must return:

```js
{
  schema: 'conscience64.mmo.web-links/v2',
  version: ROUTE_REGISTRY.version,
  base: 'https://redogit.github.io/conscience64/',
  primaryRoute: ROUTE_REGISTRY.primaryRoute,
  routes: ROUTE_REGISTRY.routes.map(({id,title,href,kind,status,dimensions,relations,provenance}) => ({
    id, label: title, path: href.replace(/^\/conscience64\//, ''),
    publicUrl: `https://redogit.github.io${href}`,
    kind, status, dimensions, relations, provenance
  })),
  invariants: [
    'PRIMARY_GAME_ROUTE == play/mmo/simple/',
    'ADVANCED_MMO != PRIMARY_MMO_ENTRY',
    'WEB_LINK != IMPLEMENTATION_STATUS',
    'HISTORY_ROUTE != CURRENT_AUTHORITY',
    'REFERENCE != EVIDENCE'
  ]
}
```

Create `sync-web-links.mjs` to write `../web-links.json` from this object and fail if `../web-links.html` does not contain a direct anchor for every route whose `kind` is a public page route. Use only `node:fs/promises` and `node:path`.

- [ ] **Step 5: Materialize `web-links.json` and update the plain page map**

Run:

```bash
node play/mmo/context-horizon/sync-web-links.mjs
```

Update `play/mmo/web-links.html` so it remains usable without JavaScript and contains direct links for all 24 admitted route IDs. Keep `mmo-simple` visually identified as primary and predecessor/reference/history status visible in text rather than color alone.

- [ ] **Step 6: Run the registry test and sync check**

Run:

```bash
node play/mmo/context-horizon/route-registry.test.mjs
node play/mmo/context-horizon/sync-web-links.mjs --check
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit Task 1**

```bash
git add play/mmo/context-horizon/route-registry.mjs \
  play/mmo/context-horizon/route-registry.test.mjs \
  play/mmo/context-horizon/sync-web-links.mjs \
  play/mmo/web-links.json play/mmo/web-links.html
git commit -m "feat: establish canonical 12D web route registry"
```

---

### Task 2: Deterministic Context Ranking Engine

**Files:**
- Create: `play/mmo/context-horizon/engine.mjs`
- Create: `play/mmo/context-horizon/engine.test.mjs`

**Interfaces:**
- Consumes: `ROUTE_REGISTRY`, `getRoute()` from Task 1.
- Produces: `DEFAULT_WEIGHTS`
- Produces: `normalizeContextSnapshot(input): ContextSnapshot`
- Produces: `rankRoutes(snapshot, registry=ROUTE_REGISTRY, weights=DEFAULT_WEIGHTS): RankedRoute[]`
- Produces: `graphDistance(fromId, toId, registry=ROUTE_REGISTRY): number`
- `RankedRoute` exact fields: `{route, score, confidence, matched, unresolved, factors}`.

- [ ] **Step 1: Write failing engine tests**

Create `engine.test.mjs`:

```js
import assert from 'node:assert/strict';
import {normalizeContextSnapshot, rankRoutes, graphDistance, DEFAULT_WEIGHTS} from './engine.mjs';

const visual = normalizeContextSnapshot({currentRoute:'mmo-simple', explicitIntentTokens:['images','visuals','reference']});
const a = rankRoutes(visual);
const b = rankRoutes(visual);
assert.deepEqual(a, b, 'ranking must be deterministic');
assert.equal(a[0].route.id, 'visual-samples');
assert.ok(a[0].matched.some(x => x.includes('explicitIntent')));

const history = rankRoutes(normalizeContextSnapshot({currentRoute:'mmo-simple', explicitIntentTokens:['restore','what','changed']}));
assert.equal(history[0].route.id, 'history-mmo');

const make = rankRoutes(normalizeContextSnapshot({currentRoute:'mmo-simple', explicitIntentTokens:['build','plugin','game']}));
assert.equal(make[0].route.id, 'arcade-forge');

assert.equal(graphDistance('mmo-simple','arcade-forge'), 1);
assert.equal(DEFAULT_WEIGHTS.explicitIntent, 0.35);
assert.ok(a.every(x => x.score >= 0 && x.score <= 1));
assert.ok(a.every(x => x.confidence >= 0 && x.confidence <= 1));
assert.ok(a.every(x => !('authority' in x.factors)));
console.log('PASS deterministic Context Horizon ranking');
```

- [ ] **Step 2: Verify the tests fail**

```bash
node play/mmo/context-horizon/engine.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement normalization and versioned weights**

Use this exact weight object:

```js
export const DEFAULT_WEIGHTS = Object.freeze({
  version:'context-horizon-weights/v1',
  explicitIntent:0.35,
  dimensionMatch:0.20,
  relationStrength:0.15,
  graphCloseness:0.10,
  currentTaskContinuity:0.08,
  historyUtility:0.06,
  provenanceQuality:0.04,
  ambiguityPenalty:0.01,
  contradictionPenalty:0.01
});
```

`normalizeContextSnapshot()` returns exactly:

```js
{
  currentRoute: String(input.currentRoute || 'play-hub'),
  explicitIntentTokens: uniqueNormalizedTokens,
  recentRouteIds: uniqueValidRouteIds.slice(-5),
  selectedFacet: input.selectedFacet ? String(input.selectedFacet) : null,
  answers: normalizedAnswerObject,
  source: input.source === 'explicit' ? 'explicit' : 'session'
}
```

Token normalization: lowercase, Unicode `NFKD`, remove combining marks, split on non-letter/non-number/`:_-`, drop empty tokens, preserve stable first-seen order.

- [ ] **Step 4: Implement route feature scoring**

For each route compute normalized factors in `[0,1]`:

```text
explicitIntent       keyword/title/dimension token overlap / explicit token count
dimensionMatch       fraction of current route dimension tags shared with candidate
relationStrength     1.0 direct relation, 0.5 reverse relation, 0 otherwise
graphCloseness       1 / (1 + shortest undirected graph distance)
currentTaskContinuity 1 when candidate shares activity or purpose with current route, else 0
historyUtility       1 when tokens include restore/history/changed/previous/predecessor and candidate is history/predecessor; else 0
provenanceQuality    1 only for provenance.status === admitted
ambiguityPenalty     1 only when candidate keywords match a token that also matches >=2 other route classes
contradictionPenalty 1 when explicit tokens request current but candidate status is predecessor/history, or request predecessor/history but candidate is current
```

Score formula:

```js
score = clamp01(
  explicitIntent*w.explicitIntent +
  dimensionMatch*w.dimensionMatch +
  relationStrength*w.relationStrength +
  graphCloseness*w.graphCloseness +
  currentTaskContinuity*w.currentTaskContinuity +
  historyUtility*w.historyUtility +
  provenanceQuality*w.provenanceQuality -
  ambiguityPenalty*w.ambiguityPenalty -
  contradictionPenalty*w.contradictionPenalty
);
```

Sort by descending score, then ascending route ID for deterministic ties. `confidence` is `clamp01(score * (1 - 0.35*ambiguityPenalty - 0.35*contradictionPenalty))`.

`matched` must contain human-readable factor explanations such as `explicitIntent:image`, `systemTool:forge`, `relation:creates-with`. `unresolved` contains only distinction IDs generated from ambiguous matched terms; never infer user identity or truth claims.

- [ ] **Step 5: Run engine tests**

```bash
node play/mmo/context-horizon/engine.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add play/mmo/context-horizon/engine.mjs play/mmo/context-horizon/engine.test.mjs
git commit -m "feat: add deterministic context route ranking"
```

---

### Task 3: Derived D13 Emergence Without a Stored Thirteenth Axis

**Files:**
- Create: `play/mmo/context-horizon/emergence.mjs`
- Create: `play/mmo/context-horizon/emergence.test.mjs`

**Interfaces:**
- Consumes: `RankedRoute[]` from Task 2.
- Produces: `deriveEmergentRelations(ranked, {limit=5, minScore=0.38}={}): EmergentRelation[]`
- `EmergentRelation` exact fields: `{id, routeIds, dimensions, score, explanation, provenance}`.

- [ ] **Step 1: Write the failing emergence tests**

```js
import assert from 'node:assert/strict';
import {deriveEmergentRelations} from './emergence.mjs';

const ranked = [
  {route:{id:'visual-samples',dimensions:{activity:['inspect'],object:['image'],creation:['render'],purpose:['compare']}},score:.82},
  {route:{id:'arcade-forge',dimensions:{activity:['make'],object:['plugin'],creation:['build'],purpose:['create']}},score:.71},
  {route:{id:'mmo-simple',dimensions:{activity:['play'],object:['world'],creation:['make'],purpose:['explore']}},score:.68}
];
const out = deriveEmergentRelations(ranked);
assert.ok(out.length >= 1);
assert.equal(out[0].provenance.status, 'derived');
assert.ok(out[0].routeIds.length >= 3);
assert.ok(!out[0].dimensions.includes('D13'));
assert.match(out[0].explanation, /emergent/i);
assert.deepEqual(deriveEmergentRelations(ranked), deriveEmergentRelations(ranked));
assert.deepEqual(deriveEmergentRelations([{route:{id:'only',dimensions:{}},score:.9}]), []);
console.log('PASS D13 is derived, deterministic, and not stored as an axis');
```

- [ ] **Step 2: Verify failure before implementation**

```bash
node play/mmo/context-horizon/emergence.test.mjs
```

- [ ] **Step 3: Implement the D13 derivation rule**

Rules:

1. Consider at most the top five routes with `score >= minScore`.
2. Evaluate every stable lexicographic triple of candidate routes.
3. For each triple, collect dimension keys for which at least two routes have non-empty values and the triple collectively spans at least two distinct tags.
4. Emit an emergent relation only if at least four distinct dimension keys participate and the three route IDs are not already represented by one identical direct-relation type.
5. Score with `geometricMean(routeScores) * min(1, participatingDimensionCount / 6)`.
6. ID is `emergent:${sortedRouteIds.join('+')}`.
7. `provenance` is exactly `{status:'derived', source:'context-horizon/d1-d12-interaction'}`.
8. Explanation format: `Emergent navigation relation across <dimension list>; derived from D1–D12 interaction, not asserted as fact.`
9. Never write `D13` into route `dimensions` or back into the canonical registry.

- [ ] **Step 4: Run emergence tests**

```bash
node play/mmo/context-horizon/emergence.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add play/mmo/context-horizon/emergence.mjs play/mmo/context-horizon/emergence.test.mjs
git commit -m "feat: derive emergent D13 navigation relations"
```

---

### Task 4: One-Question Ambiguity Discriminator

**Files:**
- Create: `play/mmo/context-horizon/questions.mjs`
- Create: `play/mmo/context-horizon/questions.test.mjs`

**Interfaces:**
- Consumes: top ranked routes from Task 2.
- Produces: `QUESTION_GAP_THRESHOLD = 0.08`
- Produces: `selectClarifyingQuestion(ranked, snapshot): ClarifyingQuestion | null`
- Produces: `applyQuestionAnswer(snapshot, question, optionId): ContextSnapshot`
- `ClarifyingQuestion` exact fields: `{id, prompt, candidateRouteIds, options}` where each option is `{id,label,addTokens,preferRouteIds}`.

- [ ] **Step 1: Write failing discriminator tests**

```js
import assert from 'node:assert/strict';
import {QUESTION_GAP_THRESHOLD, selectClarifyingQuestion, applyQuestionAnswer} from './questions.mjs';

assert.equal(QUESTION_GAP_THRESHOLD, .08);
const ranked = [
  {route:{id:'visual-samples',kind:'visual-reference'},score:.72},
  {route:{id:'arcade-forge',kind:'creator-tool'},score:.69}
];
const q = selectClarifyingQuestion(ranked,{explicitIntentTokens:['images','make']});
assert.equal(q.id,'visual-reference-vs-creator');
assert.equal(q.options.length,2);
const next = applyQuestionAnswer({explicitIntentTokens:['images','make'],answers:{}},q,q.options[0].id);
assert.ok(next.explicitIntentTokens.includes('reference'));
assert.equal(next.answers[q.id],q.options[0].id);
assert.equal(selectClarifyingQuestion([{route:{id:'visual-samples'},score:.90},{route:{id:'arcade-forge'},score:.40}],{}),null);
console.log('PASS bounded one-question ambiguity discriminator');
```

- [ ] **Step 2: Verify failure before implementation**

```bash
node play/mmo/context-horizon/questions.test.mjs
```

- [ ] **Step 3: Implement the bounded distinction table**

Use exactly these first-rollout distinction IDs and prompts:

```js
const DISTINCTIONS = [
  {
    id:'visual-reference-vs-creator',
    routes:[['visual-samples','visual-page-1','visual-page-2','visual-page-3','visual-page-4','visual-page-5','visual-page-6'],['arcade-forge']],
    prompt:'Do you want to inspect visual references, or make/install game content?',
    options:[
      {id:'references',label:'Inspect visual references',addTokens:['visual','reference','inspect'],preferRouteIds:['visual-samples']},
      {id:'creator',label:'Make game content',addTokens:['build','plugin','forge'],preferRouteIds:['arcade-forge']}
    ]
  },
  {
    id:'current-vs-predecessor',
    routes:[['mmo-simple'],['mmo-advanced','mmo-world-beta']],
    prompt:'Do you want the current simplified Red Wilds entry, or an earlier/advanced predecessor surface?',
    options:[
      {id:'current',label:'Current simple Red Wilds',addTokens:['current','simple'],preferRouteIds:['mmo-simple']},
      {id:'predecessor',label:'Earlier / advanced surface',addTokens:['predecessor','advanced'],preferRouteIds:['mmo-advanced','mmo-world-beta']}
    ]
  },
  {
    id:'current-vs-history',
    routes:[['mmo-simple','mmo-advanced'],['history-mmo']],
    prompt:'Do you want to continue the current game surface, or inspect what changed and restore history?',
    options:[
      {id:'continue',label:'Continue the game',addTokens:['current','continue'],preferRouteIds:['mmo-simple']},
      {id:'history',label:'Inspect history / restore',addTokens:['history','restore','changed'],preferRouteIds:['history-mmo']}
    ]
  },
  {
    id:'play-vs-research',
    routes:[['play-hub','mmo-simple','explorer-world'],['research-projects','conscience-root']],
    prompt:'Are you trying to play/explore, or inspect research and evidence records?',
    options:[
      {id:'play',label:'Play / explore',addTokens:['play','explore'],preferRouteIds:['play-hub','mmo-simple']},
      {id:'research',label:'Research / evidence records',addTokens:['research','evidence','verify'],preferRouteIds:['research-projects','conscience-root']}
    ]
  }
];
```

Select a question only when top-two score gap is `<= 0.08` and a distinction separates those candidate route groups. If no bounded distinction matches, return `null` and let the UI show both candidates instead of inventing a question.

- [ ] **Step 4: Run question tests**

```bash
node play/mmo/context-horizon/questions.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add play/mmo/context-horizon/questions.mjs play/mmo/context-horizon/questions.test.mjs
git commit -m "feat: add bounded context clarification questions"
```

---

### Task 5: Bounded Per-Tab Context Session

**Files:**
- Create: `play/mmo/context-horizon/session.mjs`
- Create: `play/mmo/context-horizon/session.test.mjs`

**Interfaces:**
- Produces: `SESSION_KEY = 'conscience64.context-horizon/session/v1'`
- Produces: `createSessionStore(storage=sessionStorage)` returning `{read, write, recordRoute, setIntent, answer, clear}`.
- Session document exact schema: `{schema,currentRoute,recentRouteIds,explicitIntentTokens,answers}`.

- [ ] **Step 1: Write the failing session test using an in-memory Storage-compatible object**

```js
import assert from 'node:assert/strict';
import {SESSION_KEY, createSessionStore} from './session.mjs';

const data = new Map();
const storage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const s = createSessionStore(storage);
s.recordRoute('mmo-simple');
s.recordRoute('arcade-forge');
s.setIntent('Build BUILD plugin');
let state = s.read();
assert.deepEqual(state.recentRouteIds,['mmo-simple','arcade-forge']);
assert.deepEqual(state.explicitIntentTokens,['build','plugin']);
assert.equal(state.schema,'conscience64.context-horizon/session/v1');
assert.ok(!('name' in state));
assert.ok(!('identity' in state));
for (const id of ['a','b','c','d','e','f']) s.recordRoute(id);
assert.equal(s.read().recentRouteIds.length,5);
s.clear();
assert.equal(storage.getItem(SESSION_KEY),null);
console.log('PASS bounded Context Horizon session state');
```

- [ ] **Step 2: Verify failure before implementation**

```bash
node play/mmo/context-horizon/session.test.mjs
```

- [ ] **Step 3: Implement bounded state**

Rules:

- Use `sessionStorage`, not `localStorage`, in browser default construction.
- Keep at most five recent route IDs.
- Keep at most sixteen explicit intent tokens.
- Keep at most four distinction answers.
- Do not store timestamps, names, account IDs, location, health, finances, or free-form conversation transcripts.
- Invalid JSON resets to an empty valid session document.
- `setIntent(text)` tokenizes using the same normalization behavior as Task 2 and replaces rather than appends the explicit intent token set.
- `clear()` removes only `SESSION_KEY`.

- [ ] **Step 4: Run session tests**

```bash
node play/mmo/context-horizon/session.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add play/mmo/context-horizon/session.mjs play/mmo/context-horizon/session.test.mjs
git commit -m "feat: add bounded per-tab context session"
```

---

### Task 6: Context Hair View Model and Accessible Presenter

**Files:**
- Create: `play/mmo/context-horizon/presenter.mjs`
- Create: `play/mmo/context-horizon/context-horizon.css`
- Create: `play/mmo/context-horizon/bootstrap.mjs`

**Interfaces:**
- Consumes: registry, engine, emergence, questions, session modules.
- Produces: `buildHorizonViewModel({currentRoute, ranked, emergent, question}): HorizonViewModel`
- Produces: `mountContextHorizon({host, currentRoute, mode='standalone'}): {refresh,destroy}`
- Emits: `context-horizon-update` `CustomEvent` detail `{currentRoute, focusRoute, ranked, emergentRelations, question}`.

- [ ] **Step 1: Add a pure view-model test to `engine.test.mjs` before DOM implementation**

Append:

```js
import {buildHorizonViewModel} from './presenter.mjs';
const vm = buildHorizonViewModel({
  currentRoute:'mmo-simple',
  ranked:[{route:{id:'visual-samples',title:'Visual Samples',href:'/conscience64/play/mmo/simple/visual-samples/',status:'reference'},score:.8,confidence:.7,matched:['explicitIntent:visual'],unresolved:[]}],
  emergent:[], question:null
});
assert.equal(vm.center.label,'Simple MMO');
assert.equal(vm.hairs[0].routeId,'visual-samples');
assert.equal(vm.hairs[0].href,'/conscience64/play/mmo/simple/visual-samples/');
assert.match(vm.hairs[0].accessibleLabel,/Visual Samples/);
```

Run and confirm failure because `presenter.mjs` does not exist.

- [ ] **Step 2: Implement the pure view model**

`buildHorizonViewModel()` must expose at most eight hairs and map visual semantics exactly:

```text
radialDistance = 1 - score
length         = min(1, 0.25 + 0.10 * relationCount + 0.08 * matchedCount)
thickness      = 1 + 4 * directRelationStrength
brightness     = confidence
segmented      = route.status !== 'current'
pulse          = unresolved.length > 0
```

These are presentation values only. `accessibleLabel` format:

```text
<rank>. <title>. <status>. Relevance <percent>. <first two matched explanations>. Navigation relevance is not evidence or authority.
```

- [ ] **Step 3: Implement standalone semantic markup**

`mountContextHorizon()` creates one section with:

```html
<section class="context-horizon" aria-labelledby="context-horizon-title">
  <div class="context-horizon-stage">
    <svg class="context-horizon-hairs" aria-hidden="true"></svg>
    <div class="context-horizon-core" aria-hidden="true"></div>
  </div>
  <div class="context-horizon-controls">
    <form class="context-horizon-intent" role="search">
      <label>What are you trying to find?<input type="search" autocomplete="off"></label>
      <button type="submit">Focus</button>
    </form>
    <div class="context-horizon-question" hidden></div>
  </div>
  <ol class="context-horizon-links" aria-label="Suggested routes"></ol>
  <p class="context-horizon-boundary">PROXIMITY != TRUTH · RELEVANCE != EVIDENCE · CONFIDENCE != AUTHORITY</p>
  <a class="context-horizon-all" href="/conscience64/play/mmo/web-links.html">All pages</a>
</section>
```

The `<ol>` contains real `<a href>` elements for every displayed hair. Visual SVG hairs are decorative and may not be the only interactive route.

- [ ] **Step 4: Implement progressive disclosure and question interaction**

- Far score `< .35`: title + kind only.
- Near `.35–.59`: title + relation + purpose.
- Close `.60–.79`: add status/provenance and first matched explanation.
- Focused `>= .80`: add neighboring dependency/history links and full explanation.
- If `question` is non-null, render prompt and one button per bounded option; clicking an option applies the answer to the session snapshot and reranks without navigating.
- If no bounded question exists, show the top routes rather than inventing one.
- Submitting the intent form calls `session.setIntent()`, reranks, emits `context-horizon-update`, and never mutates MMO state.

- [ ] **Step 5: Implement CSS accessibility behavior**

`context-horizon.css` must include:

```css
.context-horizon a:focus-visible,.context-horizon button:focus-visible,.context-horizon input:focus-visible{outline:3px solid currentColor;outline-offset:4px}
@media(prefers-reduced-motion:reduce){.context-horizon *{animation:none!important;transition:none!important}}
@media(forced-colors:active){.context-horizon-stage{border:1px solid CanvasText}.context-horizon-hairs{display:none}.context-horizon-core{border:2px solid CanvasText;background:Canvas}}
```

Do not rely on color alone for current/reference/predecessor/history labels; render status text in the semantic list.

- [ ] **Step 6: Implement bootstrap behavior**

`bootstrap.mjs` reads `document.body.dataset.contextRoute`. If absent or invalid, it exits without error. It finds `[data-context-horizon-host]`; if no host exists, it creates one immediately after the first `<header>` or at the start of `<main>`. It records the current route in `sessionStorage`, mounts the presenter, and exposes `globalThis.ContextHorizon = Object.freeze({refresh, currentRoute})` for diagnostics only.

- [ ] **Step 7: Run pure tests**

```bash
node play/mmo/context-horizon/route-registry.test.mjs
node play/mmo/context-horizon/engine.test.mjs
node play/mmo/context-horizon/emergence.test.mjs
node play/mmo/context-horizon/questions.test.mjs
node play/mmo/context-horizon/session.test.mjs
```

Expected: all PASS.

- [ ] **Step 8: Commit Task 6**

```bash
git add play/mmo/context-horizon/presenter.mjs \
  play/mmo/context-horizon/bootstrap.mjs \
  play/mmo/context-horizon/context-horizon.css \
  play/mmo/context-horizon/engine.test.mjs
git commit -m "feat: render accessible Context Horizon hairs"
```

---

### Task 7: Roll the Horizon Across the Admitted Web Pages

**Files:**
- Modify: `play/index.html`
- Modify: `play/mmo/simple/index.html`
- Modify: `play/mmo/index.html`
- Modify: `play/mmo/forge.html`
- Modify: `play/mmo/web-links.html`
- Modify: `play/mmo/simple/visual-samples/index.html`
- Modify: `play/explorer-world/index.html`
- Modify: `research/projects/index.html`
- Modify: `history/index.html`

**Interfaces:**
- Consumes: shared CSS/module from Task 6.
- Produces: every page identifies itself via `data-context-route` and retains ordinary direct navigation.

- [ ] **Step 1: Add route identity and shared assets to the Play Hub**

In `play/index.html`:

```html
<body data-app="home" data-context-route="play-hub">
```

Add to `<head>`:

```html
<link rel="stylesheet" href="./mmo/context-horizon/context-horizon.css">
```

Before `</body>`:

```html
<script type="module" src="./mmo/context-horizon/bootstrap.mjs"></script>
```

Keep the existing normal project nav and project cards unchanged as fallback navigation.

- [ ] **Step 2: Integrate the Simple MMO**

In `play/mmo/simple/index.html` set:

```html
<body data-context-route="mmo-simple">
```

Add `../context-horizon/context-horizon.css`, a `<div data-context-horizon-host></div>` after the header, and `../context-horizon/bootstrap.mjs` after `game.js`. Do not change any game-state IDs or the five verbs.

- [ ] **Step 3: Integrate the advanced MMO and Forge**

Use route IDs:

```text
play/mmo/index.html      -> mmo-advanced
play/mmo/forge.html     -> arcade-forge
```

Both pages use `./context-horizon/context-horizon.css` and `./context-horizon/bootstrap.mjs`. Preserve all current game/save/plug-in behavior.

- [ ] **Step 4: Integrate visuals, Explorer World, research, and history**

Use exact route IDs and relative module paths:

```text
play/mmo/simple/visual-samples/index.html -> visual-samples; ../../context-horizon/
play/explorer-world/index.html            -> explorer-world; ../mmo/context-horizon/
research/projects/index.html              -> research-projects; ../../play/mmo/context-horizon/
history/index.html                        -> history-mmo; ../play/mmo/context-horizon/
```

Each page keeps its existing plain navigation. The horizon is additional navigation only.

- [ ] **Step 5: Integrate the web map page**

`play/mmo/web-links.html` uses route ID `mmo-web-map`, `./context-horizon/context-horizon.css`, and `./context-horizon/bootstrap.mjs`. The static card grid remains complete and usable when scripts fail.

- [ ] **Step 6: Static syntax checks**

Run:

```bash
node --check play/mmo/context-horizon/bootstrap.mjs
node --check play/mmo/context-horizon/presenter.mjs
node play/mmo/context-horizon/sync-web-links.mjs --check
node play/mmo/simple/test.mjs
node play/mmo/test-reality.mjs
node play/mmo/test-plugins.mjs
node play/mmo/test-save.mjs
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit Task 7**

```bash
git add play/index.html play/mmo/simple/index.html play/mmo/index.html play/mmo/forge.html \
  play/mmo/web-links.html play/mmo/simple/visual-samples/index.html play/explorer-world/index.html \
  research/projects/index.html history/index.html
git commit -m "feat: roll Context Horizon across public navigation pages"
```

---

### Task 8: Fuse 13D++ Context Hairs With the Existing Root Space Lens

**Files:**
- Modify: `index.html`
- Modify: `space-lens-master.js`
- Modify: `space-lens-field.js`
- Modify: `play/mmo/context-horizon/presenter.mjs`

**Interfaces:**
- Root page route ID: `conscience-root`.
- Existing Space Lens remains the black-hole visual foundation.
- Context Horizon overlay uses the existing `.space-stage` and `.space-core`; it must not create a second core on the root page.
- Event consumed by Space Lens: `context-horizon-update`.

- [ ] **Step 1: Add route identity and shared Context Horizon assets to root**

Change root body to include:

```html
<body data-context-route="conscience-root">
```

Add:

```html
<link rel="stylesheet" href="./play/mmo/context-horizon/context-horizon.css">
<script type="module" src="./play/mmo/context-horizon/bootstrap.mjs"></script>
```

`bootstrap.mjs` detects `.space-stage` on `conscience-root` and calls presenter mode `space-lens-overlay`.

- [ ] **Step 2: Implement overlay mode in presenter**

In `space-lens-overlay` mode:

- reuse `.space-stage` as visual host;
- reuse `.space-core` as the center;
- inject only `<svg class="context-horizon-hairs context-horizon-hairs--overlay" aria-hidden="true">` plus the semantic ranked link list immediately after `.space-readout`;
- do not alter the existing `#space` or `#space-field` canvases;
- keep visual hairs `pointer-events:none`; all navigation remains in semantic links.

- [ ] **Step 3: Bridge typed Space Lens questions into explicit Context Horizon intent**

In `space-lens-master.js`, after `route(question)` creates `lastRoute`, dispatch:

```js
dispatchEvent(new CustomEvent('context-horizon-explicit-intent',{detail:{text:q,source:'space-lens'}}));
```

In `bootstrap.mjs`, listen for `context-horizon-explicit-intent`, call `session.setIntent(detail.text)`, rerank, and refresh the overlay. This is navigation context only; it must not alter IRPO evidence status.

- [ ] **Step 4: Let the field react visually without treating hairs as evidence**

In `space-lens-field.js` add one listener:

```js
addEventListener('context-horizon-update', e => {
  const top = e.detail?.ranked?.[0];
  if (!top) return;
  pushEvent('context-hair', .45 + .8 * Number(top.score || 0), {
    text: top.route?.title || '', carrier:'Compass4D', domain:'navigation'
  });
});
```

Add `'navigation'` to the domain list and map it only to presentation. Do not feed route score into evidence confidence, IRPO claims, project admission, world authority, or research acceptance.

- [ ] **Step 5: Preserve the Compass4D distinction**

Update the Space Lens runtime copy to state:

```text
Compass4D remains the local geometric/navigation orientation carrier. Context Horizon adds the 13D++ semantic route field: twelve explicit context dimensions, an emergent Mystery 13th, and extensible derived relations. Neither representation is a physical-dimension claim or evidence authority.
```

- [ ] **Step 6: Syntax check the root integration**

```bash
node --check space-lens-master.js
node --check space-lens-field.js
node --check play/mmo/context-horizon/bootstrap.mjs
node --check play/mmo/context-horizon/presenter.mjs
```

Expected: exit 0.

- [ ] **Step 7: Commit Task 8**

```bash
git add index.html space-lens-master.js space-lens-field.js \
  play/mmo/context-horizon/presenter.mjs play/mmo/context-horizon/bootstrap.mjs
git commit -m "feat: fuse Context Horizon with Space Lens"
```

---

### Task 9: Browser Verification and CI Gate

**Files:**
- Create: `play/mmo/context-horizon/browser-test.mjs`
- Modify: `.github/workflows/playground.yml`

**Interfaces:**
- Verifies static fallback, keyboard/semantic links, deterministic intent routing, question behavior, reduced motion, forced colors, and no game-state mutation.

- [ ] **Step 1: Reuse the existing dependency-free Chrome/CDP harness pattern**

Create `browser-test.mjs` using the same Node 22 + local HTTP server + Chrome DevTools Protocol approach already used by `play/browser-test.mjs`. Serve the repository root and visit these URLs:

```text
/conscience64/play/
/conscience64/play/mmo/simple/
/conscience64/play/mmo/
/conscience64/play/mmo/forge.html
/conscience64/play/mmo/web-links.html
/conscience64/play/mmo/simple/visual-samples/
/conscience64/play/explorer-world/
/conscience64/research/projects/
/conscience64/history/index.html?facet=mmo
/conscience64/
```

The local test server must strip the leading `/conscience64/` before resolving the path so production-absolute registry links remain testable locally.

- [ ] **Step 2: Assert every page retains direct ordinary links**

For each page assert:

```js
const report = await evaluate(() => ({
  route: document.body.dataset.contextRoute,
  horizon: !!document.querySelector('.context-horizon,.context-horizon-links'),
  semanticLinks: [...document.querySelectorAll('.context-horizon-links a')].map(a => a.getAttribute('href')),
  allPages: !!document.querySelector('a[href*="web-links.html"]')
}));
assert.ok(report.route);
assert.ok(report.horizon);
assert.ok(report.semanticLinks.length >= 3);
assert.ok(report.allPages || report.route === 'mmo-web-map');
```

- [ ] **Step 3: Assert explicit visual intent selects Visual Samples**

On Simple MMO:

```js
await evaluate(() => {
  const input = document.querySelector('.context-horizon-intent input');
  input.value = 'show me images and visual references';
  input.form.requestSubmit();
});
const topHref = await evaluate(() => document.querySelector('.context-horizon-links a')?.getAttribute('href'));
assert.equal(topHref, '/conscience64/play/mmo/simple/visual-samples/');
```

- [ ] **Step 4: Assert ambiguous intent asks one bounded question**

Submit `images make` and assert the question prompt equals:

```text
Do you want to inspect visual references, or make/install game content?
```

Assert exactly two answer buttons. Click `Make game content` and assert `arcade-forge` becomes the top route. Confirm no navigation happens until a real anchor is activated.

- [ ] **Step 5: Assert route ranking never mutates Simple MMO state**

Capture `#xp`, `#joy`, `#discoveries`, and `#place` before and after three horizon focus/question operations and assert exact equality.

- [ ] **Step 6: Assert reduced-motion and forced-colors fallbacks**

Use CDP `Emulation.setEmulatedMedia` with `prefers-reduced-motion: reduce`; assert computed animation duration is `0s` or `none` for horizon animated elements. Emulate `forced-colors: active`; assert the semantic link list remains visible and the decorative SVG may disappear without removing links.

- [ ] **Step 7: Assert root Space Lens has one core only**

On `/conscience64/` assert:

```js
const root = await evaluate(() => ({
  cores: document.querySelectorAll('.space-core').length,
  overlay: document.querySelectorAll('.context-horizon-hairs--overlay').length,
  horizonLinks: document.querySelectorAll('.context-horizon-links a').length
}));
assert.equal(root.cores,1);
assert.equal(root.overlay,1);
assert.ok(root.horizonLinks >= 3);
```

- [ ] **Step 8: Add CI steps**

Add immediately after `Verify simple MMO core` in `.github/workflows/playground.yml`:

```yaml
      - name: Verify Context Horizon route registry
        run: node play/mmo/context-horizon/route-registry.test.mjs
      - name: Verify Context Horizon deterministic ranking
        run: node play/mmo/context-horizon/engine.test.mjs
      - name: Verify Context Horizon emergent D13 relations
        run: node play/mmo/context-horizon/emergence.test.mjs
      - name: Verify Context Horizon question discriminator
        run: node play/mmo/context-horizon/questions.test.mjs
      - name: Verify Context Horizon bounded session state
        run: node play/mmo/context-horizon/session.test.mjs
      - name: Verify canonical web-link materialization
        run: node play/mmo/context-horizon/sync-web-links.mjs --check
```

Add after the existing Chrome tests:

```yaml
      - name: Exercise Context Horizon navigation in Chrome
        run: node play/mmo/context-horizon/browser-test.mjs
```

- [ ] **Step 9: Run the complete relevant suite locally**

```bash
node play/mmo/context-horizon/route-registry.test.mjs
node play/mmo/context-horizon/engine.test.mjs
node play/mmo/context-horizon/emergence.test.mjs
node play/mmo/context-horizon/questions.test.mjs
node play/mmo/context-horizon/session.test.mjs
node play/mmo/context-horizon/sync-web-links.mjs --check
node play/mmo/simple/test.mjs
node play/mmo/simple/ecs.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/renderer-society-metamorphic.test.mjs
node play/mmo/simple/renderer-society-comparison.test.mjs
node play/test.mjs
node play/mmo/test-reality.mjs
node play/mmo/test-plugins.mjs
node play/mmo/test-save.mjs
node play/mmo/context-horizon/browser-test.mjs
```

Expected: all PASS. If Chrome is unavailable locally, do not claim browser verification; record that only Node/static tests were observed and require CI browser confirmation.

- [ ] **Step 10: Commit Task 9**

```bash
git add play/mmo/context-horizon/browser-test.mjs .github/workflows/playground.yml
git commit -m "test: gate Context Horizon navigation and accessibility"
```

---

### Task 10: Two-Pass Evidence Review and Pull Request

**Files:**
- Modify only if verification reveals an actual defect.
- Review: `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md`
- Review: all Task 1–9 changed files.

**Interfaces:**
- Produces a reviewable PR whose claims are limited to observed tests.

- [ ] **Step 1: First review pass — spec coverage**

Confirm each design requirement is represented by implementation evidence:

```text
12 explicit dimensions          -> route-registry.mjs + registry test
emergent D13                    -> emergence.mjs + emergence test
++ modifiers                    -> engine factors/explanations
black-hole/context hairs        -> presenter + root overlay
questions beat guessing         -> questions.mjs + browser test
plain accessible fallback       -> web-links.html + semantic link list
same snapshot => same ranking   -> engine determinism test
proximity/relevance boundaries  -> presenter copy + tests
history first-class             -> history-mmo route + history intent test
no authority inflation          -> no authority factor + unchanged MMO state browser assertion
reduced motion/forced colors    -> CSS + browser media emulation
```

- [ ] **Step 2: Second review pass — contradiction and contamination audit**

Search changed files for forbidden promotion patterns:

```bash
grep -RniE 'relevance.*(truth|proof)|confidence.*authority|ranking.*evidence|D13.*dimension' play/mmo/context-horizon index.html space-lens-master.js space-lens-field.js || true
```

Manually inspect every match. Accept only explicit boundary statements or test assertions that reject those promotions.

Also verify:

```bash
git diff main...HEAD --check
git status --short
```

Expected: no whitespace errors; working tree clean after any corrective commit.

- [ ] **Step 3: Compare branch to main and verify intended file scope**

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Expected changed scope: route-map/linkage work, Context Horizon modules/tests/styles, explicitly integrated web pages, root Space Lens bridge, workflow, design spec, and this plan. No unrelated gameplay/evidence/research data changes.

- [ ] **Step 4: Push branch and open the PR**

```bash
git push -u origin fix/rebuild-all-web-linkages-20260914
gh pr create \
  --base main \
  --head fix/rebuild-all-web-linkages-20260914 \
  --title "Add 13D++ Context Horizon navigation" \
  --body "Builds the approved Context Horizon navigation layer over canonical web links. Preserves direct URLs, history, evidence/authority boundaries, deterministic ranking, bounded clarifying questions, and accessibility fallbacks. D13 is derived from D1–D12 interactions rather than stored as a fixed axis. See docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md and docs/superpowers/plans/2026-09-14-context-horizon-13dpp.md."
```

- [ ] **Step 5: Observe CI before making any success claim**

Record the exact PR head SHA. Confirm the Context Horizon unit checks, web-link materialization check, existing MMO/renderer checks, and Chrome Context Horizon browser test all report success for that SHA. If any fail, preserve the failure as evidence and correct the smallest defensible defect without weakening invariants.

---

## Plan Self-Review

### Spec coverage

- Adaptive layer over ordinary links: Tasks 6–9.
- 12 explicit context dimensions: Task 1.
- D13 emergent only: Task 3.
- Extensible `++` factors: Task 2 explanations/factors and route metadata.
- Deterministic ranking: Task 2.
- Clarifying question policy: Task 4.
- Progressive disclosure: Task 6.
- Accessibility and no-JS/plain-link fallback: Tasks 1, 6, 7, 9.
- History/restore first class: Tasks 1, 2, 7.
- Root black-hole navigation integration: Task 8, reusing existing Space Lens instead of creating a second field.
- Evidence/authority boundaries: Global Constraints + Tasks 2, 6, 8, 9.
- Error/fail-safe behavior: registry validation, bootstrap no-op on invalid route, semantic fallback, bounded questions, and browser assertions in Tasks 1, 6, 9.
- Initial rollout topology: Tasks 1 and 7.
- Test/CI gate: Task 9.

### Placeholder scan

No `TBD`, `TODO`, “implement later”, unspecified test directives, or undefined function names remain in this plan.

### Type/signature consistency

- `ROUTE_REGISTRY` is the single canonical graph consumed by the engine.
- `rankRoutes()` returns `RankedRoute[]`, consumed by emergence, questions, and presenter.
- `deriveEmergentRelations()` never mutates route dimensions.
- `selectClarifyingQuestion()` consumes ranked output and returns one bounded question or `null`.
- `createSessionStore()` supplies the context snapshot state used by bootstrap.
- `mountContextHorizon()` consumes all pure components and emits one `context-horizon-update` event consumed only for presentation on the root Space Lens.
