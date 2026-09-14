import {ACTIVITIES,PLACES,BOUNDARIES,freshPlayer,clampPlayer,currentActivity,answerActivity,goSomewhere,addCreation,serialize,parse} from './core.mjs';
const $=id=>document.getElementById(id);
let state=freshPlayer();
let placeIndex=0;
const KEY='conscience64.mmo.simple/v1';

function render(){
  state=clampPlayer(state);
  $('place').textContent=state.place;
  $('xp').textContent=state.xp;
  $('joy').textContent=state.joy;
  $('discoveries').textContent=state.discoveries;
  const a=currentActivity(state);
  $('activity-title').textContent=a.title;
  $('activity-place').textContent=a.place;
  $('activity-prompt').textContent=a.prompt;
  $('choices').replaceChildren();
  a.choices.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{const out=answerActivity(state,i);state=out.player;$('status').textContent=out.ok?'Done.':'Try another way. Nothing was lost.';render();});$('choices').appendChild(b);});
  $('creation-list').textContent=state.creations.length?state.creations.slice(-3).join(' · '):'Nothing made yet.';
  $('chronicle').textContent=state.chronicle.length?state.chronicle.slice(-5).join(' · '):'A fresh run.';
}

$('go').addEventListener('click',()=>{placeIndex=(placeIndex+1)%PLACES.length;state=goSomewhere(state,placeIndex);$('status').textContent=`Now at ${state.place}.`;render();});
$('play').addEventListener('click',()=>{$('activity').scrollIntoView({behavior:'smooth',block:'center'});$('status').textContent='Pick one clear action.';});
$('make').addEventListener('click',()=>{const name=prompt('Name one small thing you made:','');if(name){state=addCreation(state,name);$('status').textContent=`Made: ${name.trim().slice(0,120)}`;render();}});
$('save').addEventListener('click',()=>{localStorage.setItem(KEY,serialize(state));$('status').textContent=`Saved locally. ${BOUNDARIES.authority}.`;});
$('load').addEventListener('click',()=>{const raw=localStorage.getItem(KEY);if(!raw){$('status').textContent='No local save yet.';return;}try{state=parse(raw);placeIndex=Math.max(0,PLACES.indexOf(state.place));$('status').textContent='Loaded local save.';render();}catch(e){$('status').textContent=`Save rejected: ${e.message}`;}});
$('learn').addEventListener('click',()=>{$('learn-panel').hidden=!$('learn-panel').hidden;});
$('next').addEventListener('click',()=>{state.activityIndex=(state.activityIndex+1)%ACTIVITIES.length;render();});
$('reset').addEventListener('click',()=>{state=freshPlayer();placeIndex=0;$('status').textContent='Fresh run. Saved copy unchanged.';render();});
$('boundaries').textContent=`${BOUNDARIES.authority} · ${BOUNDARIES.evidence}`;
render();
