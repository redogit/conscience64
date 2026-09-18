import {
  ACTIVITIES, PLACES, CONTEXT, BOUNDARIES, freshPlayer,
  goSomewhere, addCreation, answerActivity, nextActivity
} from './core.mjs';

export const ECS_SCHEMA='conscience64.mmo.ecs/v1';
export const VIDEO_BOUNDARY='VIDEO_RENDER != WORLD_AUTHORITY';

export const PERSPECTIVES=Object.freeze([
  {key:'player-pov',label:'Player POV',camera:{mode:'first-person',heightM:1.68,fovDeg:72}},
  {key:'character-view',label:'Character View',camera:{mode:'third-person-social',distanceM:3,fovDeg:50}},
  {key:'world-view',label:'World View',camera:{mode:'wide-establishing',heightM:4.5,fovDeg:82}}
]);

const clone=value=>structuredClone(value);
const slug=value=>value.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export class ECSWorld {
  constructor(id='world'){
    this.id=id;
    this.entities=new Map();
    this.components=new Map();
    this.systems=[];
    this.history=[];
    this.cycle=0;
  }
  ensure(id){if(!this.entities.has(id))this.entities.set(id,{id});return id;}
  add(id,component,value){
    this.ensure(id);
    if(!this.components.has(component))this.components.set(component,new Map());
    this.components.get(component).set(id,clone(value));
    return this;
  }
  get(id,component){return this.components.get(component)?.get(id);}
  has(id,component){return this.components.get(component)?.has(id)||false;}
  query(...components){return [...this.entities.keys()].filter(id=>components.every(c=>this.has(id,c))).sort();}
  system(name,fn,order=100){this.systems.push({name,fn,order});this.systems.sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name));return this;}
  tick(context={}){
    this.cycle+=1;
    const observations=[];
    for(const system of this.systems){const out=system.fn(this,context);if(out!==undefined)observations.push({system:system.name,out:clone(out)});}
    this.history.push({cycle:this.cycle,observations});
    return observations;
  }
  snapshot(){
    const components={};
    for(const [name,store] of [...this.components.entries()].sort(([a],[b])=>a.localeCompare(b))){
      components[name]=Object.fromEntries([...store.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,value])=>[id,clone(value)]));
    }
    return {schema:ECS_SCHEMA,id:this.id,cycle:this.cycle,entities:[...this.entities.keys()].sort(),components,history:clone(this.history)};
  }
}

export function importCurrentGame(){
  const world=new ECSWorld('conscience64-rmao-world');
  world.add('world:rmao-world','Identity',{kind:'world',key:'rmao-world'});
  world.add('world:rmao-world','Boundaries',{...BOUNDARIES,video:VIDEO_BOUNDARY});
  world.add('player:local','Identity',{kind:'player',key:'local-player'});
  world.add('player:local','PlayerState',freshPlayer());

  for(const place of PLACES){
    const id=`place:${slug(place)}`;
    world.add(id,'Identity',{kind:'place',key:slug(place)});
    world.add(id,'Place',{name:place,context:CONTEXT[place]});
  }
  for(const activity of ACTIVITIES){
    const id=`activity:${activity.id}`;
    world.add(id,'Identity',{kind:'activity',key:activity.id});
    world.add(id,'Activity',activity);
    world.add(id,'LocatedAt',{placeId:`place:${slug(activity.place)}`});
  }
  for(const perspective of PERSPECTIVES){
    const id=`camera:${perspective.key}`;
    world.add(id,'Identity',{kind:'camera',key:perspective.key});
    world.add(id,'Perspective',perspective);
  }

  world.system('import-integrity',w=>{
    const places=w.query('Place');
    const activities=w.query('Activity','LocatedAt');
    const invalidLocations=activities.filter(id=>!w.has(w.get(id,'LocatedAt').placeId,'Place'));
    const emptyPlaces=places.filter(pid=>!activities.some(aid=>w.get(aid,'LocatedAt').placeId===pid));
    const result={ok:places.length===8&&activities.length===12&&invalidLocations.length===0&&emptyPlaces.length===0,placeCount:places.length,activityCount:activities.length,invalidLocations,emptyPlaces};
    w.add('world:rmao-world','ImportIntegrity',result);
    return result;
  },10);

  world.system('scene-video-jobs',w=>{
    const jobs=[];
    for(const placeId of w.query('Place')){
      const place=w.get(placeId,'Place');
      for(const cameraId of w.query('Perspective')){
        const perspective=w.get(cameraId,'Perspective');
        jobs.push({
          id:`video:${w.get(placeId,'Identity').key}:${perspective.key}`,
          sceneEntity:placeId,
          cameraEntity:cameraId,
          place:place.name,
          context:place.context,
          perspective:perspective.key,
          camera:perspective.camera,
          durationSec:3,
          fps:24,
          resolution:{width:1280,height:720},
          format:'webm',
          authority:'render-only',
          boundary:VIDEO_BOUNDARY
        });
      }
    }
    jobs.sort((a,b)=>a.id.localeCompare(b.id));
    w.add('world:rmao-world','SceneVideoJobs',{schema:'conscience64.scene-video-jobs/v1',jobs});
    return {jobCount:jobs.length};
  },20);

  return world;
}

export function initializeECS(){const world=importCurrentGame();world.tick();return world;}
export function playerState(world){return clone(world.get('player:local','PlayerState'));}
export function setPlayerState(world,state){world.add('player:local','PlayerState',state);return playerState(world);}
export function ecsGo(world,index){return setPlayerState(world,goSomewhere(playerState(world),index));}
export function ecsMake(world,name){return setPlayerState(world,addCreation(playerState(world),name));}
export function ecsNext(world){return setPlayerState(world,nextActivity(playerState(world)));}
export function ecsAnswer(world,choiceIndex){const out=answerActivity(playerState(world),choiceIndex);setPlayerState(world,out.player);return {...out,player:playerState(world)};}
export function videoJobs(world){return clone(world.get('world:rmao-world','SceneVideoJobs')?.jobs||[]);}
