import assert from 'node:assert/strict';
import {createWorld} from './world.mjs';
import {SAVE_KEY,SAVE_SCHEMA,SAVE_VERSION,snapshot,hydrate,saveLocal,loadLocal,clearLocal,hasLocal,shouldResetOnStart} from './progress.mjs';

const world=createWorld(640064);
for(let i=0;i<6;i++)world.echoes[i].collected=true;
world.monsters[0].hp=18;
for(let i=1;i<=4;i++){world.monsters[i].hp=0;world.monsters[i].alive=false;}
world.fuzzball.found=true;world.portal.active=true;
const state={world,player:{x:1888,y:944,radius:14,health:73,energy:41,invuln:0},echoes:6,defeated:4,fuzzballFound:true,region:'anomaly',regionsSeen:new Set(['sunmeadow','nightbog','anomaly']),chapterComplete:true,lastStory:'The gate accepts the remainder.',time:27.5};
const doc=snapshot(state);
assert.equal(doc.schema,SAVE_SCHEMA);assert.equal(doc.version,SAVE_VERSION);assert.equal(doc.seed,640064);
assert.deepEqual(doc.player,{x:1888,y:944,health:73,energy:41});assert.deepEqual(doc.collectedEchoIds,['e0','e1','e2','e3','e4','e5']);assert.deepEqual(doc.regionsSeen,['anomaly','nightbog','sunmeadow']);
assert.equal(doc.monsters.find(m=>m.id==='m0').hp,18);assert.equal(doc.monsters.find(m=>m.id==='m1').alive,false);assert.equal(doc.chapterComplete,true);assert.equal(doc.fuzzballFound,true);
const restored=hydrate(doc);
assert.equal(restored.world.seed,640064);assert.equal(restored.player.x,1888);assert.equal(restored.player.y,944);assert.equal(restored.player.health,73);assert.equal(restored.player.energy,41);
assert.equal(restored.world.echoes.find(e=>e.id==='e0').collected,true);assert.equal(restored.world.echoes.find(e=>e.id==='e3').collected,true);assert.equal(restored.world.monsters.find(m=>m.id==='m0').hp,18);assert.equal(restored.world.monsters.find(m=>m.id==='m1').alive,false);assert.equal(restored.world.fuzzball.found,true);assert.equal(restored.world.portal.active,true);assert.equal(restored.chapterComplete,true);assert.deepEqual([...restored.regionsSeen].sort(),['anomaly','nightbog','sunmeadow']);

// A save is a reconstruction delta. Canonical serialization must be idempotent across transport.
const transported=JSON.parse(JSON.stringify(doc));
assert.deepEqual(snapshot(hydrate(transported)),doc);
assert.deepEqual(snapshot(hydrate(JSON.parse(JSON.stringify(doc)))),snapshot(hydrate(JSON.parse(JSON.stringify(doc)))));

// Imported deltas may reference canonical entities, but they may not invent or alias world authority.
assert.throws(()=>hydrate({...doc,collectedEchoIds:[...doc.collectedEchoIds,'foreign-echo']}),/unknown echo id/i);
assert.throws(()=>hydrate({...doc,collectedEchoIds:['e0','e0']}),/duplicate echo id/i);
assert.throws(()=>hydrate({...doc,monsters:[...doc.monsters,{...doc.monsters[0],id:'foreign-monster'}]}),/unknown monster id/i);
assert.throws(()=>hydrate({...doc,monsters:[...doc.monsters,{...doc.monsters[0]}]}),/duplicate monster id/i);
assert.throws(()=>hydrate({...doc,regionsSeen:[...doc.regionsSeen,'server-authoritative-zone']}),/unknown region/i);
assert.throws(()=>hydrate({...doc,regionsSeen:['sunmeadow','sunmeadow']}),/duplicate region/i);

// Mutable values remain bounded by the canonical world/runtime contract.
assert.throws(()=>hydrate({...doc,player:{...doc.player,health:101}}),/invalid player/i);
assert.throws(()=>hydrate({...doc,player:{...doc.player,energy:-1}}),/invalid player/i);
assert.throws(()=>hydrate({...doc,echoes:6.5}),/invalid save counters/i);
assert.throws(()=>hydrate({...doc,echoes:world.echoes.length+1}),/invalid save counters/i);
assert.throws(()=>hydrate({...doc,defeated:world.monsters.length+1}),/invalid save counters/i);
assert.throws(()=>hydrate({...doc,seed:0x100000000}),/invalid world seed/i);

// Counters are derived facts of the reconstructed canonical entity state, not independent authority.
assert.throws(()=>hydrate({...doc,echoes:doc.echoes-1}),/echo counter.*collected/i);
assert.throws(()=>hydrate({...doc,defeated:doc.defeated-1}),/defeat counter.*monster/i);

// Known monster IDs cannot carry physically impossible runtime state.
assert.throws(()=>hydrate({...doc,monsters:doc.monsters.map((m,i)=>i===0?{...m,x:-1}:m)}),/invalid monster state/i);
assert.throws(()=>hydrate({...doc,monsters:doc.monsters.map((m,i)=>i===0?{...m,hp:999}:m)}),/invalid monster state/i);
assert.throws(()=>hydrate({...doc,monsters:doc.monsters.map((m,i)=>i===0?{...m,hp:0,alive:true}:m)}),/invalid monster state/i);
assert.throws(()=>hydrate({...doc,monsters:doc.monsters.map((m,i)=>i===1?{...m,hp:1,alive:false}:m)}),/invalid monster state/i);

// Unknown authority-bearing fields are non-authoritative input and disappear on reconstruction.
const normalized=snapshot(hydrate({...doc,authority:'server',serverAchievement:true,worldEntities:[{id:'invented'}]}));
assert.equal(normalized.authority,undefined);assert.equal(normalized.serverAchievement,undefined);assert.equal(normalized.worldEntities,undefined);
assert.equal(normalized.schema,SAVE_SCHEMA);assert.equal(normalized.seed,doc.seed);

const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.has(k)?values.get(k):null,removeItem:k=>values.delete(k)};
assert.equal(hasLocal(storage),false);saveLocal(state,storage);assert.ok(values.has(SAVE_KEY));assert.equal(hasLocal(storage),true);const loaded=loadLocal(storage);assert.equal(loaded.chapterComplete,true);assert.equal(loaded.echoes,6);assert.equal(loaded.fuzzballFound,true);clearLocal(storage);assert.equal(loadLocal(storage),null);assert.equal(hasLocal(storage),false);
assert.equal(shouldResetOnStart({gameOver:true,chapterComplete:false}),true);assert.equal(shouldResetOnStart({gameOver:false,chapterComplete:true}),false);assert.equal(shouldResetOnStart({gameOver:false,chapterComplete:false}),false);
assert.throws(()=>hydrate({schema:SAVE_SCHEMA,version:999}),/unsupported save version/i);assert.throws(()=>hydrate({schema:'wrong',version:SAVE_VERSION}),/invalid save schema/i);assert.throws(()=>hydrate({...doc,player:{x:NaN,y:0,health:100,energy:100}}),/invalid player/i);
console.log('PASS Explorer World progress: versioned local save round-trip, canonical reconstruction, hostile-delta rejection, state/counter consistency, authority stripping, explicit save presence, post-completion resume policy, validation, and clear.');
