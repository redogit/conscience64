# Context Horizon 13D++ Site-Wide Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a site-level 13D++ Context Horizon that navigates Conscience64 without collapsing, deleting, reclassifying, or subordinating any individually attempted research, poetry, philosophy, creative, technical, educational, accessibility, software, experimental, or game work.

**Architecture:** The canonical navigator lives in `navigation/context-horizon/`, above every domain. A preservation inventory records individual works and lineage separately from the web-route registry; research, poetry, philosophy, software, games, and other works remain peer entities with domain-specific metadata. The root Space Lens consumes Context Horizon output, while Play/MMO pages consume the same site-level graph as clients rather than owners.

**Tech Stack:** Browser-native ES modules, Node.js 22+, `node:assert/strict`, JSON manifests, existing Conscience64 Space Lens and Chrome DevTools Protocol browser harness, GitHub Pages static hosting.

**Specs:**
- `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md`
- `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-preservation-amendment.md`

## Global Constraints

- `NEW_NAVIGATION != DELETION_OF_EXISTING_WORK`
- `SUCCESSOR != REWRITTEN_PREDECESSOR`
- `REFACTOR != LOSS_OF_CAPABILITY`
- `GAME_INTEGRATION != RESEARCH_RECLASSIFICATION`
- `ROUTE_REBUILD != CONTENT_REPLACEMENT`
- `PLAYFULNESS != RESEARCH_VALUE`
- `GAME_ROUTE != RESEARCH_AUTHORITY`
- `VISUAL_PROMINENCE != RESEARCH_IMPORTANCE`
- `ENGAGEMENT != EVIDENCE`
- `POPULARITY != CONFIDENCE`
- `RELATION != MERGE`
- `POETRY != GAME_CONTENT`
- `PHILOSOPHY != GAME_CONTENT`
- `CREATIVE_WORK != DECORATION`
- `FAILED_EXPERIMENT != DISPOSABLE_WORK`
- `UNRESOLVED != UNIMPORTANT`
- `INDIVIDUAL_WORK != GENERIC_CATEGORY`
- `NAVIGATION_GROUPING != SEMANTIC_COLLAPSE`
- `PROXIMITY != TRUTH`
- `RELEVANCE != EVIDENCE`
- `CONFIDENCE != AUTHORITY`
- `NAVIGATION_PREDICTION != USER_INTENT`
- `D13_EMERGENCE != PREDECLARED_DIMENSION`
- Existing source files are never moved or rewritten merely to make navigation easier.
- Unknown provenance/classification remains `unknown` or `unresolved`; it is never guessed.
- Game engagement, popularity, clicks, fun, and presentation intensity are excluded from research evidence/authority scoring.
- Direct URLs, source paths, version history, and predecessor/successor lineage remain recoverable.

---

## File Structure

### Create

- `navigation/context-horizon/preservation-seeds.json` — named known works/families that must be located or retained as unresolved records.
- `navigation/context-horizon/work-inventory.mjs` — non-destructive inventory normalization and stable-ID/alias lookup.
- `navigation/context-horizon/work-inventory.test.mjs` — identity, alias, unresolved, lineage, and no-collapse tests.
- `navigation/context-horizon/WORK_INVENTORY.json` — generated preservation snapshot; never the source of truth for the works themselves.
- `navigation/context-horizon/route-registry.mjs` — admitted site web routes only.
- `navigation/context-horizon/route-registry.test.mjs` — route validation and domain-peer tests.
- `navigation/context-horizon/engine.mjs` — deterministic 12D ranking plus derived D13 explanation.
- `navigation/context-horizon/engine.test.mjs` — ranking and epistemic-isolation tests.
- `navigation/context-horizon/questions.mjs` — bounded one-question discriminator.
- `navigation/context-horizon/questions.test.mjs` — ambiguity and boundary tests.
- `navigation/context-horizon/presenter.mjs` — accessible link list and context-hair view model.
- `navigation/context-horizon/context-horizon.css` — visual layer, reduced-motion, forced-colors.
- `navigation/context-horizon/browser-test.mjs` — browser/accessibility/fallback verification.

### Modify

- `index.html` — integrate site-level Context Horizon with existing Space Lens; do not replace Space Lens search/evidence semantics.
- `space-lens-master.js` — pass explicit navigation intent to Context Horizon without changing claim authority.
- `space-lens-field.js` — consume presentation-only hair emphasis; no evidence/world mutation.
- `research/projects/index.html` — add ordinary link to site-wide navigator while preserving the existing project-record page and wording.
- `play/index.html` — add site-wide navigator link/adapter; Play remains one domain.
- `play/mmo/simple/index.html` — consume site navigator; game remains a participant.
- `play/mmo/web-links.json` and `play/mmo/web-links.html` — remain game-specific route materializations, validated against the site graph rather than becoming the site graph.
- `history/index.html` — expose preservation inventory/history route.
- `spatial-ui-test.mjs` — add preservation and fallback assertions.
- `.github/workflows/spatial-ui-check.yml` — run Context Horizon unit/browser tests.

### Preserve as predecessor

- `docs/superpowers/plans/2026-09-14-context-horizon-13dpp.md` — do not delete; it records the earlier MMO-owned architecture that this plan corrects.

---

### Task 1: Build the Non-Destructive Whole-Body Preservation Inventory

**Files:**
- Create: `navigation/context-horizon/preservation-seeds.json`
- Create: `navigation/context-horizon/work-inventory.mjs`
- Create: `navigation/context-horizon/work-inventory.test.mjs`
- Create: `navigation/context-horizon/WORK_INVENTORY.json`

**Interfaces:**
- Produces: `normalizeWork(record): WorkRecord`
- Produces: `buildInventory({sources,seeds}): {schema:string,works:WorkRecord[]}`
- Produces: `findWork(key:string): WorkRecord | null`
- `WorkRecord` fields: `id`, `canonicalName`, `aliases`, `domain`, `sourceLocations`, `provenanceStatus`, `publicationStatus`, `state`, `predecessors`, `successors`, `preservationStatus`.

- [ ] **Step 1: Write the failing identity-preservation test**

Create `work-inventory.test.mjs`:

```js
import assert from 'node:assert/strict';
import {buildInventory, findInInventory} from './work-inventory.mjs';

const inventory = buildInventory({
  sources:[
    {id:'hodge',canonicalName:'Hodge Conjecture Research Spine',domain:'research',sourceLocations:['research/projects/hodge-conjecture.md'],state:'current'},
    {id:'poem-one',canonicalName:'Unnamed recovered poem',domain:'poetry',sourceLocations:[],state:'unresolved'},
    {id:'red-wilds',canonicalName:'Red Wilds',domain:'game',sourceLocations:['play/mmo/simple/'],state:'current'}
  ],
  seeds:[]
});
assert.equal(findInInventory(inventory,'hodge').domain,'research');
assert.equal(findInInventory(inventory,'poem-one').domain,'poetry');
assert.equal(findInInventory(inventory,'red-wilds').domain,'game');
assert.notEqual(findInInventory(inventory,'hodge').domain, findInInventory(inventory,'red-wilds').domain);
assert.equal(findInInventory(inventory,'poem-one').state,'unresolved');
assert.equal(inventory.works.length,3);
console.log('PASS preservation inventory keeps individual works distinct');
```

- [ ] **Step 2: Run it and confirm failure**

```bash
node navigation/context-horizon/work-inventory.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Create preservation seeds without pretending sources are located**

`preservation-seeds.json` must contain individually named entries for known families/works including Cross-Carrier Wave, Orbit Library, Tiny Babel/TBCL, Operator Moonshot, Hodge research, P vs NP research, Model Experiments, Geometry/4D/Codecs, Historical Recovery, Human–Knowledge Working-Set Lab, Conscience64, Orbit Shelf, Word Weave, Pattern Garden, Small Steps, Source Compare, Computational Chorus/Musilanguage, Dream to Action, MauiBrickBreak, FirstNeuralNetwork, Orbit Engine, REDOGIT, Other Projects, ChatGPT and Conscience, Human Expression Archive, symmetry experiments, finite-table checks, API patches, local sandbox builder, 1,024-byte carriers, bounded learning-compression tools, poetry, philosophy, stories/prose/songs, accessibility work, educational experiments, Red Wilds, Explorer World, MMO World, and Fuzzball.

For a seed whose source is not located, use:

```json
{
  "id":"poetry-family",
  "canonicalName":"Poetry",
  "aliases":[],
  "domain":"poetry",
  "sourceLocations":[],
  "provenanceStatus":"known-from-project-history",
  "publicationStatus":"unresolved",
  "state":"unresolved",
  "preservationStatus":"must-locate-or-retain-unresolved"
}
```

Do not invent poem titles or source paths.

- [ ] **Step 4: Implement additive inventory normalization**

Implement duplicate detection by stable ID, but never merge different IDs merely because names are similar. Alias resolution order is:

```text
stable ID -> canonical current name -> historical alias -> unresolved
```

If two different records claim the same alias, retain both and mark the alias lookup ambiguous rather than choosing one.

- [ ] **Step 5: Generate the snapshot from admitted existing indexes plus seeds**

Read without modifying:

```text
research/projects/CURRENT.json
research/projects/projects.json
play/projects.json
play/mmo/web-links.json
```

Write `WORK_INVENTORY.json` as a derived snapshot. The snapshot must include `generatedFrom` source paths and `sourceHash` values where available.

- [ ] **Step 6: Verify preservation behavior**

```bash
node navigation/context-horizon/work-inventory.test.mjs
```

Expected: PASS and no source file modifications.

- [ ] **Step 7: Commit**

```bash
git add navigation/context-horizon/
git commit -m "feat: add non-destructive whole-work preservation inventory"
```

---

### Task 2: Create the Site-Level 12D Route Registry

**Files:**
- Create: `navigation/context-horizon/route-registry.mjs`
- Create: `navigation/context-horizon/route-registry.test.mjs`
- Modify: `play/mmo/web-links.json`
- Modify: `play/mmo/web-links.html`

**Interfaces:**
- Produces: `DIMENSION_KEYS`
- Produces: `ROUTE_REGISTRY`
- Produces: `getRoute(id)`
- Produces: `validateRegistry(registry)`

- [ ] **Step 1: Write the failing domain-peer test**

```js
import assert from 'node:assert/strict';
import {ROUTE_REGISTRY,getRoute,validateRegistry} from './route-registry.mjs';
assert.equal(validateRegistry().ok,true);
assert.equal(getRoute('research-projects').ownerDomain,'research');
assert.equal(getRoute('mmo-simple').ownerDomain,'game');
assert.equal(getRoute('conscience-root').ownerDomain,'site');
assert.notEqual(ROUTE_REGISTRY.primaryRoute,'mmo-simple');
assert.equal(ROUTE_REGISTRY.primaryRoute,'conscience-root');
assert.equal(getRoute('research-projects').epistemicRole,'preserved-project-index');
console.log('PASS site-level routes keep research and game as peers');
```

- [ ] **Step 2: Confirm failure**

```bash
node navigation/context-horizon/route-registry.test.mjs
```

- [ ] **Step 3: Implement the registry**

Use the twelve keys from the approved spec. Every route also has:

```js
{
  ownerDomain: 'site'|'research'|'game'|'tool'|'history'|'creative',
  epistemicRole: 'navigation'|'preserved-project-index'|'reference'|'history'|'none',
  workIds: []
}
```

The registry must include at minimum `conscience-root`, `research-projects`, `play-hub`, `mmo-simple`, `mmo-advanced`, `arcade-forge`, `visual-samples`, `explorer-world`, `mmo-world-beta`, and `history-root`.

- [ ] **Step 4: Make relations typed and non-merging**

Reject relation types `owns`, `absorbs`, `replaces-semantically`, and `proves` for cross-domain navigation. Allow `references`, `visualizes`, `inspired-by`, `teaches-about`, `related-to`, `predecessor-of`, `successor-of`, `depends-on`, and `history-of`.

- [ ] **Step 5: Keep the MMO web map as a projection**

Generate/validate `play/mmo/web-links.json` from game-owned routes only. Do not move research routes into the MMO map.

- [ ] **Step 6: Run tests and commit**

```bash
node navigation/context-horizon/route-registry.test.mjs
git add navigation/context-horizon play/mmo/web-links.*
git commit -m "feat: add site-level Context Horizon route graph"
```

---

### Task 3: Implement Deterministic Ranking Without Value Leakage

**Files:**
- Create: `navigation/context-horizon/engine.mjs`
- Create: `navigation/context-horizon/engine.test.mjs`

**Interfaces:**
- Produces: `rankRoutes(snapshot, registry=ROUTE_REGISTRY): RankedRoute[]`
- Produces: `deriveEmergentRelation(snapshot, ranked): object|null`

- [ ] **Step 1: Write the failing isolation test**

```js
import assert from 'node:assert/strict';
import {rankRoutes} from './engine.mjs';
const base={currentRoute:'conscience-root',explicitIntentTokens:['hodge','evidence'],recentActions:[]};
const withGameFun={...base,recentActions:['played-red-wilds','liked-visual','fun-session']};
const a=rankRoutes(base);
const b=rankRoutes(withGameFun);
const ra=a.find(x=>x.route.id==='research-projects');
const rb=b.find(x=>x.route.id==='research-projects');
assert.equal(ra.route.epistemicRole,rb.route.epistemicRole);
assert.equal(ra.route.ownerDomain,'research');
assert.equal(rb.route.ownerDomain,'research');
assert.equal(ra.authorityDelta,0);
assert.equal(rb.authorityDelta,0);
console.log('PASS game engagement cannot alter research authority or identity');
```

- [ ] **Step 2: Confirm failure**

```bash
node navigation/context-horizon/engine.test.mjs
```

- [ ] **Step 3: Implement versioned deterministic weights**

Use only explicit intent, dimension match, typed relation strength, graph closeness, task continuity, history utility, provenance quality, ambiguity penalty, and contradiction penalty. Do not include click frequency, fun, popularity, visual intensity, reward state, score, or time-spent.

- [ ] **Step 4: Implement D13 as derived explanation only**

Return `emergentRelation` only when at least two independent D1–D12 relation paths converge. Never write `d13` into route input metadata.

- [ ] **Step 5: Run deterministic and permutation tests**

Run the same snapshot twice and with registry entries reordered; assert identical route IDs/scores after stable sorting.

- [ ] **Step 6: Commit**

```bash
git add navigation/context-horizon/engine*
git commit -m "feat: rank Context Horizon routes without epistemic leakage"
```

---

### Task 4: Add the One-Question Discriminator

**Files:**
- Create: `navigation/context-horizon/questions.mjs`
- Create: `navigation/context-horizon/questions.test.mjs`

**Interfaces:**
- Produces: `chooseQuestion(ranked,snapshot): Question|null`
- Produces: `applyAnswer(snapshot,question,answerId): ContextSnapshot`

- [ ] **Step 1: Write ambiguity tests**

Test `video` ambiguity between visual references and renderer/control surfaces, and test `research` versus `game inspired by research`. Assert the question names the distinction and does not imply equivalence.

- [ ] **Step 2: Confirm failure**

```bash
node navigation/context-horizon/questions.test.mjs
```

- [ ] **Step 3: Implement bounded templates**

Example:

```js
{
 id:'research-or-game-use',
 prompt:'Do you want the original research work, or a game surface that references it?',
 options:[
   {id:'research',addTokens:['research','source','evidence']},
   {id:'game',addTokens:['game','play','reference']}
 ]
}
```

- [ ] **Step 4: Preserve unresolved answers**

Unknown answer IDs must leave the distinction unresolved and must not coerce to the first option.

- [ ] **Step 5: Run tests and commit**

```bash
node navigation/context-horizon/questions.test.mjs
git add navigation/context-horizon/questions*
git commit -m "feat: add bounded Context Horizon clarification questions"
```

---

### Task 5: Integrate Context Hairs with Space Lens Without Replacing It

**Files:**
- Create: `navigation/context-horizon/presenter.mjs`
- Create: `navigation/context-horizon/context-horizon.css`
- Modify: `index.html`
- Modify: `space-lens-master.js`
- Modify: `space-lens-field.js`
- Modify: `research/projects/index.html`
- Modify: `play/index.html`
- Modify: `play/mmo/simple/index.html`

**Interfaces:**
- Produces: `buildPresentation(ranked,{reducedMotion=false}): HorizonViewModel`
- Emits: `context-horizon-ranking` and `context-horizon-question` custom events.

- [ ] **Step 1: Add static semantic fallback links first**

Before adding canvas/hair behavior, add a visible/semantic `Context Horizon` link and `All pages / preserved works` link to the root, research index, Play Hub, and Simple MMO. Verify navigation works with JavaScript disabled.

- [ ] **Step 2: Implement presenter as view-model only**

Map score to radial distance, relation strength to thickness, confidence to brightness, and available context depth to hair length. The presenter must never modify route scores or work metadata.

- [ ] **Step 3: Integrate with existing Space Lens center**

Reuse the existing `.space-core`/field. Do not render a second black hole. `space-lens-master.js` sends explicit query/navigation intent; `space-lens-field.js` consumes presentation data only.

- [ ] **Step 4: Add accessibility behavior**

Every visual hair has a mirrored `<a>` entry with title, owner domain, relation, rank, and explanation. Respect `prefers-reduced-motion` and `forced-colors`.

- [ ] **Step 5: Verify research page remains a research page**

Assert the existing text `Records retain their findings, failures, evidence boundaries, and unresolved questions; this page is navigation, not a replacement for them.` remains present in `research/projects/index.html`.

- [ ] **Step 6: Commit**

```bash
git add navigation/context-horizon index.html space-lens-master.js space-lens-field.js research/projects/index.html play/index.html play/mmo/simple/index.html
git commit -m "feat: layer Context Horizon over Space Lens and peer domains"
```

---

### Task 6: Verify Preservation, Accessibility, and No-Loss Rollout

**Files:**
- Create: `navigation/context-horizon/browser-test.mjs`
- Modify: `spatial-ui-test.mjs`
- Modify: `.github/workflows/spatial-ui-check.yml`

- [ ] **Step 1: Add static no-loss assertions**

Extend `spatial-ui-test.mjs` to assert:

```js
assert.match(home,/Context Horizon/);
assert.match(research,/Records retain their findings, failures, evidence boundaries, and unresolved questions/);
assert.match(research,/Research project records/);
assert.doesNotMatch(research,/owned by Red Wilds|game authority|game evidence/i);
```

- [ ] **Step 2: Add browser keyboard/fallback test**

Load the root, Research Projects, Play Hub, and Simple MMO. Verify each contains direct semantic navigation; disable JavaScript and verify direct links remain usable.

- [ ] **Step 3: Add preservation inventory checks**

Verify every seed is either `located` or retained as `unresolved`; no seed may disappear from the generated inventory.

- [ ] **Step 4: Add epistemic-isolation browser assertion**

Trigger a game-oriented navigation event, then inspect the research route/work record and assert its domain, provenance, and epistemic role are unchanged.

- [ ] **Step 5: Update CI**

Add to `.github/workflows/spatial-ui-check.yml`:

```yaml
- name: Verify Context Horizon preservation inventory
  run: node navigation/context-horizon/work-inventory.test.mjs
- name: Verify Context Horizon route graph
  run: node navigation/context-horizon/route-registry.test.mjs
- name: Verify Context Horizon ranking
  run: node navigation/context-horizon/engine.test.mjs
- name: Verify Context Horizon questions
  run: node navigation/context-horizon/questions.test.mjs
- name: Exercise Context Horizon accessibility and fallback
  run: node navigation/context-horizon/browser-test.mjs
```

- [ ] **Step 6: Run the full relevant verification set**

```bash
node navigation/context-horizon/work-inventory.test.mjs
node navigation/context-horizon/route-registry.test.mjs
node navigation/context-horizon/engine.test.mjs
node navigation/context-horizon/questions.test.mjs
node spatial-ui-test.mjs
node history/test.mjs
node history/knowledge-test.mjs
node navigation/context-horizon/browser-test.mjs
```

Expected: all PASS.

- [ ] **Step 7: Compare source inventory before/after**

Use `git diff --name-status` and verify no pre-existing research, poetry/creative, philosophy/conceptual, game, history, or project source file was deleted or renamed by this rollout.

- [ ] **Step 8: Commit verification integration**

```bash
git add navigation/context-horizon/browser-test.mjs spatial-ui-test.mjs .github/workflows/spatial-ui-check.yml
git commit -m "test: verify Context Horizon preservation and accessibility"
```

---

## Self-Review Result

- **Spec coverage:** route truth, 12D ranking, derived D13, questions, Context Horizon presentation, accessibility, direct-link fallback, and evidence/authority boundaries are covered.
- **Preservation coverage:** individual-work identity, poetry/philosophy/creative distinction, research epistemic independence, predecessor lineage, unresolved attempts, failed experiments, and no-deletion rules are covered before adaptive navigation becomes authoritative.
- **Architecture correction:** the earlier MMO-owned `play/mmo/context-horizon/` design is preserved as historical planning evidence but superseded by site-level `navigation/context-horizon/`.
- **No placeholders:** no task requires inventing unknown provenance or source paths; unresolved material is explicitly retained as unresolved.
- **Type consistency:** `WorkRecord`, `RouteRecord`, `RankedRoute`, and `ContextSnapshot` responsibilities stay separate so navigation cannot silently rewrite the work inventory.

## Execution Order

`preservation inventory -> site route graph -> deterministic ranking -> clarification -> Space Lens presentation -> no-loss/accessibility verification`

Do not begin presentation work until the preservation inventory and site-level route graph tests pass.
