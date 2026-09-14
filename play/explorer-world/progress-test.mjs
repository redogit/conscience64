import assert from 'node:assert/strict';
import {createWorld} from './world.mjs';
import {SAVE_KEY,SAVE_SCHEMA,SAVE_VERSION,snapshot,hydrate,saveLocal,loadLocal,clearLocal,hasLocal,shouldResetOnStart} from './progress.mjs';

const world=createWorld(640064);
world.echoes[0].collected=true;
world.echoes[3].collected=true;
world.monsters[0].hp=18;
world.monsters[1].alive=false;
world.fuzzball.found=true;
world.portal.active=true;
const state={
  world,
  player:{x:1888,y:944,radius:14,health:73,energy:41,invuln:0},
  echoes:6,
  defeated:4,
  fuzzballFound:true,
  region:'anomaly',
  regionsSeen:new Set(['sunmeadow','nightbog','anomaly']),
  chapterComplete:true,
  lastStory:'The gate accepts the remainder.',
  time:27.5
};

const doc=snapshot(state);
assert.equal(doc.schema,SAVE_SCHEMA);
assert.equal(doc.version,SAVE_VERSION);
assert.equal(doc.seed,640064);
assert.deepEqual(doc.player,{x:1888,y:944,health:73,energy:41});
assert.deepEqual(doc.collectedEchoIds,['e0','e3']);
assert.deepEqual(doc.regionsSeen,['anomaly','nightbog','sunmeadow']);
assert.equal(doc.monsters.find(m=>m.id==='m0').hp,18);
assert.equal(doc.monsters.find(m=>m.id==='m1').alive,false);
assert.equal(doc.chapterComplete,true);
assert.equal(doc.fuzzballFound,true);

const restored=hydrate(doc);
assert.equal(restored.world.seed,640064);
assert.equal(restored.player.x,1888);
assert.equal(restored.player.y,944);
assert.equal(restored.player.health,73);
assert.equal(restored.player.energy,41);
assert.equal(restored.world.echoes.find(e=>e.id==='e0').collected,true);
assert.equal(restored.world.echoes.find(e=>e.id==='e3').collected,true);
assert.equal(restored.world.monsters.find(m=>m.id==='m0').hp,18);
assert.equal(restored.world.monsters.find(m=>m.id==='m1').alive,false);
assert.equal(restored.world.fuzzball.found,true);
assert.equal(restored.world.portal.active,true);
assert.equal(restored.chapterComplete,true);
assert.deepEqual([...restored.regionsSeen].sort(),['anomaly','nightbog','sunmeadow']);

const values=new Map();
const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.has(k)?values.get(k):null,removeItem:k=>values.delete(k)};
assert.equal(hasLocal(storage),false);
saveLocal(state,storage);
assert.ok(values.has(SAVE_KEY));
assert.equal(hasLocal(storage),true);
const loaded=loadLocal(storage);
assert.equal(loaded.chapterComplete,true);
assert.equal(loaded.echoes,6);
assert.equal(loaded.fuzzballFound,true);
clearLocal(storage);
assert.equal(loadLocal(storage),null);
assert.equal(hasLocal(storage),false);

assert.equal(shouldResetOnStart({gameOver:true,chapterComplete:false}),true,'game-over start must create a fresh run');
assert.equal(shouldResetOnStart({gameOver:false,chapterComplete:true}),false,'completed chapter must be resumable for free exploration');
assert.equal(shouldResetOnStart({gameOver:false,chapterComplete:false}),false);
assert.throws(()=>hydrate({schema:SAVE_SCHEMA,version:999}),/unsupported save version/i);
assert.throws(()=>hydrate({schema:'wrong',version:SAVE_VERSION}),/invalid save schema/i);
assert.throws(()=>hydrate({...doc,player:{x:NaN,y:0,health:100,energy:100}}),/invalid player/i);
console.log('PASS Explorer World progress: versioned local save round-trip, deterministic reconstruction, explicit save presence, post-completion resume policy, validation, and clear.');
