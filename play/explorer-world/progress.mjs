import {createWorld,regionAt,portalUnlocked} from './world.mjs';

export const SAVE_VERSION=1;
export const SAVE_SCHEMA='conscience64.explorer-world/save';
export const SAVE_KEY='conscience64.explorer-world.progress.v1';

const finite=(value)=>Number.isFinite(value);
const bool=(value)=>value===true;

function validPlayer(player){
  return !!player&&finite(player.x)&&finite(player.y)&&finite(player.health)&&finite(player.energy);
}

function requireDocument(doc){
  if(!doc||doc.schema!==SAVE_SCHEMA)throw new Error('Invalid save schema.');
  if(doc.version!==SAVE_VERSION)throw new Error(`Unsupported save version: ${doc.version}.`);
  if(!Number.isInteger(doc.seed)||doc.seed<0)throw new Error('Invalid world seed.');
  if(!validPlayer(doc.player))throw new Error('Invalid player state.');
  if(!Array.isArray(doc.collectedEchoIds)||!Array.isArray(doc.monsters)||!Array.isArray(doc.regionsSeen))throw new Error('Invalid save collections.');
  if(!finite(doc.echoes)||doc.echoes<0||!finite(doc.defeated)||doc.defeated<0)throw new Error('Invalid save counters.');
  return doc;
}

export function snapshot(state){
  if(!state?.world||!validPlayer(state.player))throw new Error('Invalid runtime state.');
  return{
    schema:SAVE_SCHEMA,
    version:SAVE_VERSION,
    seed:state.world.seed>>>0,
    player:{x:state.player.x,y:state.player.y,health:state.player.health,energy:state.player.energy},
    echoes:Number(state.echoes||0),
    defeated:Number(state.defeated||0),
    collectedEchoIds:state.world.echoes.filter(e=>e.collected).map(e=>e.id).sort(),
    monsters:state.world.monsters.map(m=>({id:m.id,x:m.x,y:m.y,hp:m.hp,alive:!!m.alive})),
    fuzzballFound:!!state.fuzzballFound,
    regionsSeen:[...(state.regionsSeen||[])].map(String).sort(),
    chapterComplete:!!state.chapterComplete,
    lastStory:String(state.lastStory||''),
    time:finite(state.time)?state.time:0
  };
}

export function hydrate(input){
  const doc=requireDocument(input),world=createWorld(doc.seed),echoIds=new Set(doc.collectedEchoIds.map(String)),monsterById=new Map(doc.monsters.map(m=>[String(m.id),m]));
  for(const echo of world.echoes)echo.collected=echoIds.has(echo.id);
  for(const monster of world.monsters){
    const saved=monsterById.get(monster.id);if(!saved)continue;
    if(!finite(saved.x)||!finite(saved.y)||!finite(saved.hp)||typeof saved.alive!=='boolean')throw new Error(`Invalid monster state: ${monster.id}.`);
    monster.x=saved.x;monster.y=saved.y;monster.hp=saved.hp;monster.alive=saved.alive;
  }
  const fuzzballFound=bool(doc.fuzzballFound);world.fuzzball.found=fuzzballFound;
  world.portal.active=portalUnlocked({echoes:doc.echoes,fuzzballFound});
  const player={x:doc.player.x,y:doc.player.y,radius:14,health:doc.player.health,energy:doc.player.energy,invuln:0};
  return{
    world,
    player,
    playing:false,
    paused:false,
    gameOver:false,
    echoes:doc.echoes,
    defeated:doc.defeated,
    fuzzballFound,
    region:regionAt(player.x,player.y).id,
    regionsSeen:new Set(doc.regionsSeen.map(String)),
    pulse:0,
    pulseCooldown:0,
    chapterComplete:bool(doc.chapterComplete),
    lastStory:String(doc.lastStory||''),
    time:finite(doc.time)?doc.time:0
  };
}

export function saveLocal(state,storage=globalThis.localStorage){
  if(!storage?.setItem)throw new Error('Local storage is unavailable.');
  const doc=snapshot(state);storage.setItem(SAVE_KEY,JSON.stringify(doc));return doc;
}

export function loadLocal(storage=globalThis.localStorage){
  if(!storage?.getItem)return null;
  const raw=storage.getItem(SAVE_KEY);if(raw==null)return null;
  let doc;try{doc=JSON.parse(raw);}catch{throw new Error('Saved progress is not valid JSON.');}
  return hydrate(doc);
}

export function hasLocal(storage=globalThis.localStorage){
  return !!storage?.getItem&&storage.getItem(SAVE_KEY)!=null;
}

export function clearLocal(storage=globalThis.localStorage){
  if(storage?.removeItem)storage.removeItem(SAVE_KEY);
}

export function shouldResetOnStart(state){
  return !!state?.gameOver;
}
