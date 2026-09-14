# Living World Alpha 0.1A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Red Wilds simple MMO into a deterministic, first-person, browser-native living-world Alpha where typed dependencies propagate consequences, agents can change wants, ideas can be falsified through play, voluntary FUN can emerge, and save/replay reconstructs the same authoritative state.

**Architecture:** Keep `play/mmo/simple/core.mjs` and the existing ECS import as predecessor compatibility surfaces, then add a focused `living-world/` authority layer beside them. The living-world layer owns typed state, deterministic event admission, dependency systems, agent/idea state, replay, and a scene projection; HTML/CSS/JS render that projection without gaining authority. Alpha 0.1A remains local-authority only and exposes an internal request/snapshot seam that Alpha 0.1B can later wrap with GraphQL without changing world semantics.

**Tech Stack:** ECMAScript 2026 ES modules, Node built-ins (`node:assert/strict`, `node:crypto` only if hashing is needed), existing `ECSWorld`, standards-based HTML/DOM/CSS/Canvas/SVG, existing headless-Chrome/CDP browser harness, GitHub Actions `playground.yml`. No new production dependencies in 0.1A.

**Spec:** `docs/superpowers/specs/2026-09-14-living-world-alpha-0-1-design.md`

## Global Constraints

- FUN is a preserved possibility, not a scalar objective. `LAUGHTER != FUN`, `ENGAGEMENT != FUN`, `RETENTION != FUN`, `REWARD != FUN`.
- Preserve `LOCAL != AUTHORITY`, `REFERENCE != EVIDENCE`, `VIDEO_RENDER != WORLD_AUTHORITY`, `RENDER != WORLD_AUTHORITY`, `QUERY != EVIDENCE`, `REQUESTED_ACTION != ACCEPTED_CONSEQUENCE`, `SOURCE != ADAPTATION`.
- `DESTROYED != ERASED`; consequential history is append-only within an admitted run.
- `PERSON != RECORDED_MODEL`; simulated agents are world models, not claims about real people.
- Use the existing Red Wilds eight places as scene/navigation identities; do not replace them with a new world.
- Player verb vocabulary for 0.1A is exactly `MOVE, LOOK, TALK, TAKE, GIVE, USE, MAKE, HELP, WAIT, ASK`.
- Deterministic target: `(initial seed, admitted event history) -> same authoritative world state` for the declared code/schema version.
- Invalid simulation state fails closed; expected world failure remains gameplay/history.
- Browser rendering is downstream of authority and may never be the only carrier of consequential information.
- Target WCAG 2.2 AA; do not claim conformance until implemented Alpha testing supports it.
- Stable standards baseline from the spec: WHATWG HTML/DOM/Fetch/URL Living Standards as observed in September 2026, ECMA-262 ECMAScript 2026 17th edition, CSS Snapshot 2025, GraphQL September 2025 reserved for 0.1B, WAI-ARIA 1.2, stable SVG features.
- Prefer semantic native HTML before ARIA; use stable standard APIs before framework abstractions.
- No GraphQL server/client in 0.1A. Provide a transport-neutral local API seam only.
- Use TDD: every production behavior begins with an observed failing test, then minimal implementation, then refactor only while green.
- Do not weaken or delete existing simple-MMO/ECS/video-carrier tests to make the Alpha pass.

---

## File Structure

Create the living-world authority layer under `play/mmo/simple/living-world/` so the predecessor simple core remains inspectable and rollback is obvious.

- `play/mmo/simple/living-world/world.mjs` — canonical Alpha world state, schema/version, cloning, invariant validation, snapshot.
- `play/mmo/simple/living-world/events.mjs` — action-request normalization, event IDs, admission/rejection, event application, replay.
- `play/mmo/simple/living-world/scenario.mjs` — deterministic Red Wilds Alpha seed state and typed dependency graph.
- `play/mmo/simple/living-world/systems.mjs` — dependency propagation, resource flow, continuity/failure, time advancement.
- `play/mmo/simple/living-world/actions.mjs` — ten-verb semantics and precondition checks.
- `play/mmo/simple/living-world/agents.mjs` — needs/wants/relationships/knowledge and bounded IRPO transitions.
- `play/mmo/simple/living-world/ideas.mjs` — candidate hypothesis creation, evidence linkage, falsified/supported-in-test/inconclusive status.
- `play/mmo/simple/living-world/fun.mjs` — voluntary FUN-discovery predicates and observations, never authority over player feeling.
- `play/mmo/simple/living-world/save.mjs` — portable save schema, parse/validate, replay reconstruction.
- `play/mmo/simple/living-world/scene.mjs` — pure authoritative-state -> semantic scene projection.
- `play/mmo/simple/living-world/*.test.mjs` — focused Node tests per responsibility.
- `play/mmo/simple/living-world/alpha-scenario.test.mjs` — whole vertical-slice proof and ablation.
- `play/mmo/simple/living-world/accessibility-contract.test.mjs` — static support checks for required semantic/fallback surfaces; explicitly not a conformance claim.
- `play/mmo/simple/alpha-render.js` — browser-only DHTML/Canvas/SVG rendering from `scene.mjs` projections.
- `play/mmo/simple/alpha-browser-test.mjs` — headless Chrome interaction/replay/keyboard/reduced-motion smoke.
- Modify `play/mmo/simple/index.html` — add first-person Alpha scene shell, semantic nearby/action surfaces, history/idea panels.
- Modify `play/mmo/simple/style.css` — standards-based first-person scene, responsive layout, focus, reduced-motion rules.
- Modify `play/mmo/simple/game.js` — use living-world request/snapshot API for Alpha path while preserving legacy core as explicit fallback/predecessor path during implementation.
- Modify `play/mmo/simple/ecs.mjs` — import Alpha state as ECS components only where needed; do not make renderer or browser DOM authoritative.
- Modify `.github/workflows/playground.yml` — run new Node and Chrome checks after existing predecessor checks.
- Update `play/mmo/simple/ECS.md` — document authority boundary, Alpha schema, replay contract, and predecessor compatibility.

---

### Task 1: Canonical Alpha World State and Invariants

**Files:**
- Create: `play/mmo/simple/living-world/world.mjs`
- Create: `play/mmo/simple/living-world/world.test.mjs`

**Interfaces:**
- Produces: `ALPHA_SCHEMA`, `createWorldState({seed})`, `cloneWorld(world)`, `snapshotWorld(world)`, `validateWorld(world)`.
- `validateWorld(world)` returns `{ok:boolean, errors:string[]}` and never mutates input.
- `snapshotWorld(world)` returns a deterministic JSON-safe object with maps represented as sorted plain-object/array forms.

- [ ] **Step 1: Write the failing schema/invariant test**

```js
import assert from 'node:assert/strict';
import { ALPHA_SCHEMA, createWorldState, snapshotWorld, validateWorld } from './world.mjs';

const a=createWorldState({seed:'alpha-test'});
const b=createWorldState({seed:'alpha-test'});
assert.equal(ALPHA_SCHEMA,'conscience64.mmo.living-world-alpha/v1');
assert.deepEqual(snapshotWorld(a),snapshotWorld(b));
assert.deepEqual(validateWorld(a),{ok:true,errors:[]});

const bad=structuredClone(snapshotWorld(a));
bad.eventSeq=-1;
assert.equal(validateWorld(bad).ok,false);
console.log('PASS living-world world invariants');
```

- [ ] **Step 2: Run it and verify RED**

Run: `node play/mmo/simple/living-world/world.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` or missing exports from `world.mjs`.

- [ ] **Step 3: Implement the minimal world shape**

`createWorldState({seed})` must initialize at least:

```js
{
  schema: ALPHA_SCHEMA,
  version: 1,
  seed,
  tick: 0,
  eventSeq: 0,
  entities: {},
  relations: [],
  history: [],
  observations: [],
  rejectedRequests: []
}
```

`validateWorld` must reject at least wrong schema/version, negative/non-integer tick or event sequence, duplicate relation IDs, duplicate history event IDs, relations whose declared endpoints do not exist, and resource quantities that are non-finite or below zero when the component declares `nonNegative:true`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node play/mmo/simple/living-world/world.test.mjs`

Expected: `PASS living-world world invariants`.

- [ ] **Step 5: Commit**

```bash
git add play/mmo/simple/living-world/world.mjs play/mmo/simple/living-world/world.test.mjs
git commit -m "feat: add living world alpha state invariants"
```

---

### Task 2: Deterministic Event Admission and Replay Spine

**Files:**
- Create: `play/mmo/simple/living-world/events.mjs`
- Create: `play/mmo/simple/living-world/events.test.mjs`
- Modify: `play/mmo/simple/living-world/world.mjs`

**Interfaces:**
- Consumes: `createWorldState`, `cloneWorld`, `snapshotWorld`, `validateWorld`.
- Produces: `normalizeRequest(world, request)`, `admitEvent(world, event)`, `replayEvents(initialWorld, events)`, `requestIdFor(world, request)`.
- Accepted events have `{id,seq,tick,actor,verb,target,args,source:'player-request'|'system',status:'ADMITTED'}`.
- Rejected requests are recorded separately and do not enter authoritative history.

- [ ] **Step 1: Write the failing deterministic replay test**

```js
import assert from 'node:assert/strict';
import { createWorldState, snapshotWorld } from './world.mjs';
import { admitEvent, replayEvents } from './events.mjs';

const initial=createWorldState({seed:'replay-seed'});
const one=admitEvent(initial,{actor:'player:local',verb:'WAIT',target:'world:red-wilds',args:{ticks:1}});
assert.equal(one.accepted,true);
assert.equal(one.world.history.length,1);
const replayed=replayEvents(createWorldState({seed:'replay-seed'}),one.world.history);
assert.deepEqual(snapshotWorld(replayed),snapshotWorld(one.world));
console.log('PASS living-world deterministic event spine');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/events.test.mjs`

Expected: FAIL because `events.mjs` does not exist.

- [ ] **Step 3: Implement minimal admission/replay**

Use deterministic IDs derived from declared seed + sequence + normalized request content. Do not use wall clock, `Math.random()`, UUID randomness, or object insertion order. For 0.1A, a stable in-module FNV-1a/other explicitly implemented deterministic string hash is sufficient; cryptographic uniqueness is not an Alpha requirement.

`admitEvent` must:

1. clone input world;
2. normalize request keys/args deterministically;
3. assign next sequence/ID;
4. apply only event-spine effects needed at this stage (`WAIT` increments tick by `args.ticks ?? 1`);
5. append event;
6. validate resulting world;
7. return `{accepted:false,world:original,reason}` on invalid transition without mutating original.

`replayEvents` must reject event sequence gaps, ID mismatches, schema mismatches, or divergent results.

- [ ] **Step 4: Add a rejection/non-mutation assertion**

Add to `events.test.mjs`:

```js
const before=snapshotWorld(one.world);
const rejected=admitEvent(one.world,{actor:'missing',verb:'WAIT',target:'world:red-wilds',args:{ticks:-2}});
assert.equal(rejected.accepted,false);
assert.deepEqual(snapshotWorld(one.world),before);
```

- [ ] **Step 5: Run and verify GREEN**

Run: `node play/mmo/simple/living-world/events.test.mjs`

Expected: `PASS living-world deterministic event spine`.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/world.mjs play/mmo/simple/living-world/events.mjs play/mmo/simple/living-world/events.test.mjs
git commit -m "feat: add deterministic living world event replay"
```

---

### Task 3: Seed the Red Wilds Dependency Ecology

**Files:**
- Create: `play/mmo/simple/living-world/scenario.mjs`
- Create: `play/mmo/simple/living-world/systems.mjs`
- Create: `play/mmo/simple/living-world/systems.test.mjs`

**Interfaces:**
- Produces: `createRedWildsAlpha({seed})`, `advanceSystems(world,{ticks})`, `relation(world,id)`, `entity(world,id)`.
- Scenario entity IDs are stable strings and include at least `player:local`, `market:corner`, `workshop:maker-garage`, `transport:handcart-7`, `ecology:city-park`, `resident:mara`, `resident:eli`, plus eight existing `place:*` identities.
- Required dependency relation: `dep:market-delivery` from `transport:handcart-7` to `market:corner` with `kind:'supplies'`, `resource:'bread'`, `capacityPerTick:2`.

- [ ] **Step 1: Write a failing propagation test**

```js
import assert from 'node:assert/strict';
import { createRedWildsAlpha } from './scenario.mjs';
import { advanceSystems, entity } from './systems.mjs';

let world=createRedWildsAlpha({seed:'dependency-test'});
assert.equal(entity(world,'transport:handcart-7').condition,'broken');
assert.equal(entity(world,'market:corner').resources.bread,4);
world=advanceSystems(world,{ticks:2});
assert.equal(entity(world,'market:corner').resources.bread,2);
assert.equal(entity(world,'resident:mara').needs.food,'stressed');
console.log('PASS living-world dependency propagation');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/systems.test.mjs`

Expected: FAIL because scenario/systems modules do not exist.

- [ ] **Step 3: Implement the smallest meaningful ecology**

Seed these facts:

```text
transport:handcart-7.condition = broken
market:corner.resources.bread = 4
market:corner.consumptionPerTick.bread = 1
market:corner.minimumComfort.bread = 3
workshop:maker-garage.resources.bearing = 1
ecology:city-park.water = normal
resident:mara.needs.food = stable
resident:mara.want = buy-bread
```

System order for one authoritative tick:

```text
1. delivery-flow
2. market-consumption
3. resident-needs
4. want-update
5. history-observation
```

If the handcart is broken, delivery contributes zero. If repaired, delivery contributes up to relation capacity. Market bread may reach zero but never below zero. Mara becomes `food:'stressed'` when bread is below the market comfort threshold and changes want from `buy-bread` to `restore-food-access` after observing the shortage.

- [ ] **Step 4: Add causal ablation**

Add to the test:

```js
const ablated=createRedWildsAlpha({seed:'dependency-test'});
ablated.relations=ablated.relations.filter(r=>r.id!=='dep:market-delivery');
const after=advanceSystems(ablated,{ticks:1});
assert.equal(entity(after,'market:corner').resources.bread,3);
assert.ok(!after.history.some(e=>e.kind==='delivery-blocked' && e.relationId==='dep:market-delivery'));
```

This proves the declared relation is responsible for the recorded delivery consequence within the finite Alpha model; it is not a universal causal claim.

- [ ] **Step 5: Run and verify GREEN**

Run: `node play/mmo/simple/living-world/systems.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/scenario.mjs play/mmo/simple/living-world/systems.mjs play/mmo/simple/living-world/systems.test.mjs
git commit -m "feat: add red wilds dependency ecology"
```

---

### Task 4: Implement the Ten Compositional Player Verbs

**Files:**
- Create: `play/mmo/simple/living-world/actions.mjs`
- Create: `play/mmo/simple/living-world/actions.test.mjs`
- Modify: `play/mmo/simple/living-world/events.mjs`
- Modify: `play/mmo/simple/living-world/systems.mjs`

**Interfaces:**
- Produces: `VERBS`, `requestAction(world, request)`.
- `VERBS` is exactly `['MOVE','LOOK','TALK','TAKE','GIVE','USE','MAKE','HELP','WAIT','ASK']` in that stable exported order.
- `requestAction` returns `{accepted,world,event?,observations,reason?}`.
- Observation-only verbs may append an admitted event but must not fabricate state changes.

- [ ] **Step 1: Write the failing verb-contract test**

```js
import assert from 'node:assert/strict';
import { createRedWildsAlpha } from './scenario.mjs';
import { VERBS, requestAction } from './actions.mjs';

assert.deepEqual(VERBS,['MOVE','LOOK','TALK','TAKE','GIVE','USE','MAKE','HELP','WAIT','ASK']);
let world=createRedWildsAlpha({seed:'verbs'});
const move=requestAction(world,{actor:'player:local',verb:'MOVE',target:'place:corner-market',args:{}});
assert.equal(move.accepted,true);
assert.equal(move.world.entities['player:local'].placeId,'place:corner-market');
const invalid=requestAction(move.world,{actor:'player:local',verb:'TAKE',target:'workshop:maker-garage',args:{resource:'bearing',amount:99}});
assert.equal(invalid.accepted,false);
assert.equal(invalid.world.entities['workshop:maker-garage'].resources.bearing,1);
console.log('PASS living-world ten verb contract');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/actions.test.mjs`

Expected: FAIL because `actions.mjs` does not exist.

- [ ] **Step 3: Implement verb semantics minimally**

Use these 0.1A semantics:

```text
MOVE  -> change actor place if target is reachable place
LOOK  -> return semantic observation of target visible from actor place
TALK  -> create social interaction/history event; may expose current public want
TAKE  -> transfer declared resource/object to actor inventory with availability/permission checks
GIVE  -> transfer actor-held resource/object to target
USE   -> apply held object/tool to target if a registered interaction accepts it
MAKE  -> create a bounded player creation or hypothesis object from allowed args
HELP  -> execute a target-declared help affordance; no generic success shortcut
WAIT  -> advance authoritative systems by bounded positive tick count
ASK   -> return target-known information that target is permitted to share
```

Reject unknown verbs, missing actor/target, impossible transfers, negative amounts, and attempts to mutate undeclared component paths.

- [ ] **Step 4: Add the cart-repair path test**

```js
world=createRedWildsAlpha({seed:'repair'});
world=requestAction(world,{actor:'player:local',verb:'MOVE',target:'place:maker-garage',args:{}}).world;
world=requestAction(world,{actor:'player:local',verb:'HELP',target:'transport:handcart-7',args:{kind:'repair-with-workshop-bearing'}}).world;
assert.equal(world.entities['transport:handcart-7'].condition,'working');
world=requestAction(world,{actor:'player:local',verb:'WAIT',target:'world:red-wilds',args:{ticks:1}}).world;
assert.ok(world.entities['market:corner'].resources.bread>=4);
```

- [ ] **Step 5: Run and verify GREEN**

Run: `node play/mmo/simple/living-world/actions.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/actions.mjs play/mmo/simple/living-world/actions.test.mjs play/mmo/simple/living-world/events.mjs play/mmo/simple/living-world/systems.mjs
git commit -m "feat: add compositional living world player verbs"
```

---

### Task 5: Wants, IRPO, Hypotheses, and Voluntary FUN

**Files:**
- Create: `play/mmo/simple/living-world/agents.mjs`
- Create: `play/mmo/simple/living-world/ideas.mjs`
- Create: `play/mmo/simple/living-world/fun.mjs`
- Create: `play/mmo/simple/living-world/agents-ideas-fun.test.mjs`
- Modify: `play/mmo/simple/living-world/actions.mjs`
- Modify: `play/mmo/simple/living-world/scenario.mjs`

**Interfaces:**
- Produces: `updateAgentModel(world,agentId,observation)`, `createHypothesis(world,{actor,statement,claimKey})`, `evaluateHypotheses(world,observation)`, `detectFunDiscoveries(world,event)`.
- Hypothesis statuses are exactly `CANDIDATE`, `SUPPORTED_IN_TEST`, `CONTRADICTED_IN_TEST`, `INCONCLUSIVE`; never `TRUE`/`FALSE`.
- FUN records use `kind:'fun-observation'` and may record voluntary continuation/positive report/laughter as observations, never infer universal fun.

- [ ] **Step 1: Write failing tests for changed want and falsifiable idea**

```js
import assert from 'node:assert/strict';
import { createRedWildsAlpha } from './scenario.mjs';
import { requestAction } from './actions.mjs';

let world=createRedWildsAlpha({seed:'ideas'});
world=requestAction(world,{actor:'player:local',verb:'WAIT',target:'world:red-wilds',args:{ticks:2}}).world;
assert.equal(world.entities['resident:mara'].want,'restore-food-access');

const made=requestAction(world,{actor:'player:local',verb:'MAKE',target:'world:red-wilds',args:{kind:'hypothesis',statement:'The park water shortage stopped bread delivery.',claimKey:'water-shortage'}});
world=made.world;
const looked=requestAction(world,{actor:'player:local',verb:'LOOK',target:'ecology:city-park',args:{}});
world=looked.world;
const hypothesis=Object.values(world.entities).find(e=>e.kind==='hypothesis'&&e.claimKey==='water-shortage');
assert.equal(hypothesis.status,'CONTRADICTED_IN_TEST');
console.log('PASS living-world wants and hypothesis lifecycle');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/agents-ideas-fun.test.mjs`

Expected: FAIL because modules/status behavior are absent.

- [ ] **Step 3: Implement bounded IRPO/idea transitions**

Mara's transition must be observation-driven:

```text
I: market bread observed below comfort threshold
R: food access differs from expected stable state
P: want changes to restore-food-access
O: later bread recovery can update inventory and allow another want transition
```

The water-shortage hypothesis is contradicted only because the declared test observation is `ecology:city-park.water === 'normal'` and the hypothesis claim contract says low park water is necessary for this candidate. Record the observation reference in the hypothesis; do not infer broader truth.

- [ ] **Step 4: Add a voluntary FUN discovery test**

Seed `feature:park-puddle` and one harmless board in the player's obtainable environment. Test:

```js
world=createRedWildsAlpha({seed:'fun'});
world=requestAction(world,{actor:'player:local',verb:'MOVE',target:'place:city-park',args:{}}).world;
world=requestAction(world,{actor:'player:local',verb:'MAKE',target:'place:city-park',args:{kind:'toy',name:'puddle skimmer',materials:['board']}}).world;
const used=requestAction(world,{actor:'player:local',verb:'USE',target:'feature:park-puddle',args:{objectName:'puddle skimmer',voluntary:true}});
assert.equal(used.accepted,true);
assert.ok(used.world.history.some(e=>e.kind==='fun-observation'));
assert.ok(!used.world.history.some(e=>e.kind==='fun-observation'&&e.claim==='universally-fun'));
```

No XP/retention requirement is attached to the FUN observation.

- [ ] **Step 5: Run and verify GREEN**

Run: `node play/mmo/simple/living-world/agents-ideas-fun.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/agents.mjs play/mmo/simple/living-world/ideas.mjs play/mmo/simple/living-world/fun.mjs play/mmo/simple/living-world/agents-ideas-fun.test.mjs play/mmo/simple/living-world/actions.mjs play/mmo/simple/living-world/scenario.mjs
git commit -m "feat: add living wants ideas and fun observations"
```

---

### Task 6: Portable Save, Load, and Exact Replay Reconstruction

**Files:**
- Create: `play/mmo/simple/living-world/save.mjs`
- Create: `play/mmo/simple/living-world/save.test.mjs`

**Interfaces:**
- Produces: `SAVE_SCHEMA`, `serializeSave(world)`, `parseSave(text)`, `reconstructSave(save)`.
- Save payload includes initial seed, Alpha schema/version, admitted event history, and a snapshot checksum/fingerprint used only to detect replay divergence.

- [ ] **Step 1: Write the failing round-trip/replay test**

```js
import assert from 'node:assert/strict';
import { createRedWildsAlpha } from './scenario.mjs';
import { requestAction } from './actions.mjs';
import { snapshotWorld } from './world.mjs';
import { serializeSave, parseSave, reconstructSave } from './save.mjs';

let world=createRedWildsAlpha({seed:'save'});
world=requestAction(world,{actor:'player:local',verb:'WAIT',target:'world:red-wilds',args:{ticks:2}}).world;
world=requestAction(world,{actor:'player:local',verb:'MOVE',target:'place:maker-garage',args:{}}).world;
const text=serializeSave(world);
const save=parseSave(text);
const rebuilt=reconstructSave(save);
assert.deepEqual(snapshotWorld(rebuilt),snapshotWorld(world));
console.log('PASS living-world portable deterministic save');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/save.test.mjs`

Expected: FAIL because `save.mjs` does not exist.

- [ ] **Step 3: Implement save validation and reconstruction**

Reject:

- wrong save schema;
- wrong Alpha schema/version;
- missing/non-string seed;
- non-array event history;
- sequence gaps/duplicate IDs;
- replay snapshot fingerprint mismatch;
- extra executable code/functions in parsed structures (JSON parse only).

Do not auto-load from local storage in browser code; explicit user action remains required.

- [ ] **Step 4: Add tamper rejection test**

```js
const tampered=JSON.parse(text);
tampered.events[0].id='event:tampered';
assert.throws(()=>reconstructSave(tampered),/event|replay|fingerprint/i);
```

- [ ] **Step 5: Run and verify GREEN**

Run: `node play/mmo/simple/living-world/save.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/save.mjs play/mmo/simple/living-world/save.test.mjs
git commit -m "feat: add deterministic living world save replay"
```

---

### Task 7: Pure Scene Projection and Browser-Native DHTML Renderer

**Files:**
- Create: `play/mmo/simple/living-world/scene.mjs`
- Create: `play/mmo/simple/living-world/scene.test.mjs`
- Create: `play/mmo/simple/alpha-render.js`
- Modify: `play/mmo/simple/index.html`
- Modify: `play/mmo/simple/style.css`
- Modify: `play/mmo/simple/game.js`

**Interfaces:**
- Produces: `sceneFor(world,{viewerId})` returning a deterministic JSON-safe projection with `place`, `weather`, `time`, `nearby`, `affordances`, `statusLines`, `visualSeed`.
- Browser renderer exports/attaches no authority API; it consumes scene projections and emits DOM/Canvas/SVG only.
- `game.js` owns local Alpha session and calls `requestAction`; renderer never calls world internals directly.

- [ ] **Step 1: Write the failing scene projection test**

```js
import assert from 'node:assert/strict';
import { createRedWildsAlpha } from './scenario.mjs';
import { sceneFor } from './scene.mjs';

const world=createRedWildsAlpha({seed:'scene'});
const a=sceneFor(world,{viewerId:'player:local'});
const b=sceneFor(world,{viewerId:'player:local'});
assert.deepEqual(a,b);
assert.equal(a.place.id,'place:mercer-and-red-street');
assert.ok(Array.isArray(a.nearby));
assert.ok(Array.isArray(a.affordances));
assert.equal(typeof a.visualSeed,'string');
console.log('PASS living-world deterministic scene projection');
```

- [ ] **Step 2: Run and verify RED**

Run: `node play/mmo/simple/living-world/scene.test.mjs`

Expected: FAIL because `scene.mjs` does not exist.

- [ ] **Step 3: Implement pure scene projection**

`sceneFor` must read authoritative state only and must not mutate world/history. Nearby semantic entities and affordances are sorted by stable ID. Visual seed is derived deterministically from world seed + tick + viewer place, not `Math.random()`.

- [ ] **Step 4: Add semantic first-person shell to HTML**

Add, using native HTML before ARIA:

```html
<section id="alpha-world" aria-labelledby="alpha-place-title">
  <div id="alpha-visual" aria-hidden="true">
    <canvas id="alpha-canvas"></canvas>
    <svg id="alpha-overlay" aria-hidden="true" focusable="false"></svg>
  </div>
  <h2 id="alpha-place-title"></h2>
  <p id="alpha-status" role="status" aria-live="polite"></p>
  <section aria-labelledby="nearby-title">
    <h3 id="nearby-title">Nearby</h3>
    <ul id="alpha-nearby"></ul>
  </section>
  <fieldset id="alpha-actions">
    <legend>Actions</legend>
  </fieldset>
</section>
```

Keep the visual canvas/SVG `aria-hidden`; consequential state must be represented in semantic text/control surfaces.

- [ ] **Step 5: Implement deterministic renderer**

`alpha-render.js` may use Canvas 2D, SVG, CSS custom properties, gradients, transforms, masks/clip paths that are stable/interoperable. Draw from `scene.visualSeed`, not nondeterministic random state. Required visual response examples:

- wet road reflection when scene wetness > 0;
- market light on/off from market state;
- cart silhouette/condition marker from transport state;
- simple rain particles generated deterministically from visual seed;
- first-person camera frame without image assets being required.

Animation is cosmetic. With `prefers-reduced-motion: reduce`, remove continuous camera/particle motion while preserving scene information.

- [ ] **Step 6: Refactor `game.js` onto the request/snapshot seam**

Expose only a small browser session object such as:

```js
const session={
  world:createRedWildsAlpha({seed:'red-wilds-alpha-01'}),
  act(request){
    const out=requestAction(this.world,request);
    if(out.accepted)this.world=out.world;
    renderAlpha(sceneFor(this.world,{viewerId:'player:local'}),out);
    return out;
  }
};
```

Preserve explicit save/load controls and predecessor simple-core behavior until Alpha browser tests prove parity for required existing surfaces. Do not delete predecessor exports in this task.

- [ ] **Step 7: Run Node tests**

Run:

```bash
node play/mmo/simple/living-world/scene.test.mjs
node play/mmo/simple/test.mjs
node play/mmo/simple/ecs.test.mjs
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add play/mmo/simple/living-world/scene.mjs play/mmo/simple/living-world/scene.test.mjs play/mmo/simple/alpha-render.js play/mmo/simple/index.html play/mmo/simple/style.css play/mmo/simple/game.js
git commit -m "feat: render deterministic living world alpha in browser"
```

---

### Task 8: Accessibility, Keyboard, Reduced Motion, and Browser Interaction Proof

**Files:**
- Create: `play/mmo/simple/living-world/accessibility-contract.test.mjs`
- Create: `play/mmo/simple/alpha-browser-test.mjs`
- Modify: `play/mmo/simple/index.html`
- Modify: `play/mmo/simple/style.css`
- Modify: `play/mmo/simple/game.js`

**Interfaces:**
- Browser test follows the existing direct-CDP pattern in `play/mmo/browser-test.mjs`; do not introduce Playwright/Puppeteer dependency.
- Static accessibility contract is supporting evidence only: `STATIC_ACCESSIBILITY_CHECK != WCAG_CONFORMANCE`.

- [ ] **Step 1: Write failing static accessibility support test**

Read `index.html` and `style.css` with Node `fs/promises` and assert at least:

```js
assert.match(html,/id="alpha-world"/);
assert.match(html,/id="alpha-nearby"/);
assert.match(html,/role="status"/);
assert.match(html,/fieldset id="alpha-actions"/);
assert.match(css,/:focus-visible/);
assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
```

Also assert there is no positive `tabindex` and no `onclick=` inline handler in the Alpha shell.

- [ ] **Step 2: Run and verify RED if required surfaces are incomplete**

Run: `node play/mmo/simple/living-world/accessibility-contract.test.mjs`

Expected: FAIL until all required semantic/focus/motion surfaces are present.

- [ ] **Step 3: Implement keyboard-first action controls**

All ten verbs must be reachable as native buttons/selectable controls without drag, pointer lock, hover, or canvas hit testing. `MOVE` must have a non-spatial text control that names destinations. After an action, keep focus stable or move it deliberately to a meaningful semantic result; never dump focus to `<body>`.

- [ ] **Step 4: Write browser smoke for consequence + explicit save/load**

Following the existing CDP harness, the test must:

1. open `/play/mmo/simple/?alpha=1`;
2. wait for `globalThis.Conscience64LivingWorldAlpha` and `#alpha-world`;
3. assert 320px and 1100px widths have no horizontal overflow;
4. use DOM controls to WAIT twice and observe market shortage text;
5. MOVE to Maker Garage and HELP repair the cart;
6. WAIT once and observe market recovery state;
7. create/falsify the `water-shortage` hypothesis through the exposed Alpha controls;
8. create/use the puddle-skimmer optional FUN path and observe a `fun-observation` history item without mandatory reward;
9. save explicitly, make another state change, load explicitly, and verify snapshot fingerprint restoration;
10. reload page and verify saved state does not auto-load;
11. emulate reduced motion and assert the DOM remains usable with animation disabled.

- [ ] **Step 5: Run Chrome test and verify GREEN**

Run: `node play/mmo/simple/alpha-browser-test.mjs`

Expected: a single PASS line summarizing dependency propagation, falsifiable idea, optional FUN, explicit save/load, 320px layout, keyboard/native controls, and reduced-motion behavior.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/accessibility-contract.test.mjs play/mmo/simple/alpha-browser-test.mjs play/mmo/simple/index.html play/mmo/simple/style.css play/mmo/simple/game.js
git commit -m "test: verify living world alpha browser and accessibility contracts"
```

---

### Task 9: Whole Alpha Scenario, Metamorphic Causal Check, and ECS Compatibility

**Files:**
- Create: `play/mmo/simple/living-world/alpha-scenario.test.mjs`
- Modify: `play/mmo/simple/ecs.mjs`
- Modify: `play/mmo/simple/ecs.test.mjs`
- Modify: `play/mmo/simple/ECS.md`

**Interfaces:**
- `ecs.mjs` may expose `initializeLivingWorldAlpha({seed})` returning an `ECSWorld` carrying an Alpha authoritative snapshot/reference component, but legacy `initializeECS()` behavior remains unchanged.
- No renderer component is permitted to write authoritative Alpha state.

- [ ] **Step 1: Write the failing vertical-slice proof test**

The test must execute one run that proves all seven spec conditions:

```text
1. dependency matters: broken cart -> market shortage
2. want changes: Mara -> restore-food-access
3. hypothesis falsified: water-shortage -> CONTRADICTED_IN_TEST
4. persistent failure: shortage remains until an admitted repair or other valid adaptation
5. historical consequence survives serialize/reconstruct
6. optional FUN: puddle-skimmer creates a bounded fun-observation
7. exact replay: same seed + admitted events -> identical snapshot
```

Use assertions against stable IDs/statuses, not prose-only output.

- [ ] **Step 2: Add metamorphic/ablation companion**

Run the same event sequence against a scenario clone with `dep:market-delivery` removed. Assert the specific delivery-blocked causal trace and downstream recovery path differ as expected. Label this finite causal support in test output; do not call it universal proof.

- [ ] **Step 3: Add Alpha ECS import without changing legacy import**

Add Alpha components under distinct names such as:

```text
LivingWorldAlphaSchema
LivingWorldAlphaSnapshot
LivingWorldAlphaBoundaries
```

Legacy scene video jobs remain render-only and derived from the predecessor place identities. Alpha state must not make video jobs authoritative.

- [ ] **Step 4: Update `ECS.md`**

Document:

- predecessor simple core remains available;
- Alpha authority lives in `living-world/`;
- ECS may host projections/components but renderer/video remain downstream;
- deterministic replay boundary;
- `REQUESTED_ACTION != ACCEPTED_CONSEQUENCE`;
- `RENDER != WORLD_AUTHORITY`;
- GraphQL deferred to 0.1B.

- [ ] **Step 5: Run focused suite**

```bash
node play/mmo/simple/living-world/world.test.mjs
node play/mmo/simple/living-world/events.test.mjs
node play/mmo/simple/living-world/systems.test.mjs
node play/mmo/simple/living-world/actions.test.mjs
node play/mmo/simple/living-world/agents-ideas-fun.test.mjs
node play/mmo/simple/living-world/save.test.mjs
node play/mmo/simple/living-world/scene.test.mjs
node play/mmo/simple/living-world/accessibility-contract.test.mjs
node play/mmo/simple/living-world/alpha-scenario.test.mjs
node play/mmo/simple/ecs.test.mjs
node play/mmo/simple/alpha-browser-test.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add play/mmo/simple/living-world/alpha-scenario.test.mjs play/mmo/simple/ecs.mjs play/mmo/simple/ecs.test.mjs play/mmo/simple/ECS.md
git commit -m "test: prove living world alpha vertical slice"
```

---

### Task 10: CI Admission Without Weakening Existing Playground Checks

**Files:**
- Modify: `.github/workflows/playground.yml`

**Interfaces:**
- Existing steps remain intact.
- Add one Node group for living-world unit/scenario checks and one Chrome step for Alpha browser smoke.

- [ ] **Step 1: Add the new CI commands after existing simple MMO/ECS predecessor checks**

Add explicit steps equivalent to:

```yaml
      - name: Verify Living World Alpha 0.1A contracts
        run: |
          node play/mmo/simple/living-world/world.test.mjs
          node play/mmo/simple/living-world/events.test.mjs
          node play/mmo/simple/living-world/systems.test.mjs
          node play/mmo/simple/living-world/actions.test.mjs
          node play/mmo/simple/living-world/agents-ideas-fun.test.mjs
          node play/mmo/simple/living-world/save.test.mjs
          node play/mmo/simple/living-world/scene.test.mjs
          node play/mmo/simple/living-world/accessibility-contract.test.mjs
          node play/mmo/simple/living-world/alpha-scenario.test.mjs
      - name: Exercise Living World Alpha 0.1A in Chrome
        run: node play/mmo/simple/alpha-browser-test.mjs
```

Do not remove or relax any predecessor step.

- [ ] **Step 2: Run every playground command locally/in the execution environment that is available**

Minimum required before PR:

```bash
node play/mmo/simple/test.mjs
node play/mmo/simple/ecs.test.mjs
node play/mmo/simple/visual-carrier-v2.test.mjs
node play/mmo/simple/renderer-society.test.mjs
node play/mmo/simple/renderer-society-metamorphic.test.mjs
node play/mmo/simple/renderer-society-comparison.test.mjs
node play/mmo/simple/living-world/alpha-scenario.test.mjs
node play/mmo/simple/alpha-browser-test.mjs
```

If any existing unrelated playground test fails on the branch, stop and classify whether it is pre-existing or caused by the Alpha; do not delete the check.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/playground.yml
git commit -m "ci: verify living world alpha 0.1A"
```

---

### Task 11: Two-Pass Evidence Review and Reviewable PR

**Files:**
- No production-file requirement; review may produce narrowly scoped corrections and evidence notes.

**Interfaces:**
- Final branch head is the exact SHA reviewed and tested.
- PR remains reviewable; merge uses exact expected head SHA only after verification.

- [ ] **Step 1: First review pass — specification/evidence**

Check every Alpha 0.1A spec requirement against an observed test or explicit deferred item. Record at least these boundaries in the PR body/comment:

```text
ALPHA_0_1A != PRODUCTION_MMO
LOCAL_WORLD != NETWORK_AUTHORITY
RENDER != WORLD_AUTHORITY
FUN_OBSERVATION != UNIVERSAL_FUN
FINITE_CAUSAL_ABLATION != UNIVERSAL_CAUSATION
STATIC_ACCESSIBILITY_CHECK != WCAG_CONFORMANCE
GRAPHQL != IMPLEMENTED_IN_0_1A
```

- [ ] **Step 2: Second review pass — regression/replay**

Re-run the focused suite from Task 9 and predecessor checks from Task 10 on the final exact branch head. Compare final diff against the design base and verify no unrelated project surfaces changed.

- [ ] **Step 3: Open the PR only after the branch is complete and green**

Because prior PRs auto-merged unexpectedly in this repository, do not use an early/incomplete PR as the work branch. Open the PR only after exact-head branch verification. Include the exact head SHA, test commands/results, known limits, and 0.1B GraphQL deferral.

- [ ] **Step 4: Require exact-head verification before merge**

If the PR head changes after review, rerun required checks. Merge only with `expected_head_sha` matching the verified head. Preserve any failure history; do not rewrite commits to hide RED steps or process mistakes.

---

## Plan Self-Review Result

**Spec coverage:** Alpha 0.1A covers the living kernel, typed dependencies, ABCDE-relevant continuity behavior at the local-system level, changing wants, bounded IRPO, falsifiable ideas, voluntary FUN observations, ten verbs, deterministic event history/replay, explicit save/load, browser-native DHTML graphics, accessibility-first semantic carriers, first-person browser interaction, ECS compatibility, and CI admission. GraphQL, remote MMO authority, cross-repository federation execution, full civilization scale, and production visual assets remain intentionally deferred to successor plans as specified.

**Placeholder scan:** No TBD/TODO/"implement later" placeholders are used as instructions. Deferred features are named architectural boundaries, not incomplete steps.

**Type/name consistency:** The plan consistently uses `createRedWildsAlpha`, `requestAction`, `snapshotWorld`, `sceneFor`, `serializeSave`, `parseSave`, `reconstructSave`, and stable hypothesis statuses. Later tasks consume interfaces defined by earlier tasks.
