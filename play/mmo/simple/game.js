import {ACTIVITIES,PLACES,BOUNDARIES,freshPlayer,clampPlayer,currentActivity,activitiesAtPlace,nextActivity,answerActivity,goSomewhere,addCreation,serialize,parse,contextFor} from './core.mjs';
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
  $('scene-title').textContent=state.place;
  $('scene-copy').textContent=contextFor(state.place);
  const here=activitiesAtPlace(state.place);
  $('scene-activities').textContent=`${here.length} ${here.length===1?'activity':'activities'} here.`;
  const a=currentActivity(state);
  $('activity-title').textContent=a.title;
  $('activity-place').textContent=a.place;
  $('activity-prompt').textContent=a.prompt;
  $('choices').replaceChildren();
  a.choices.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{const out=answerActivity(state,i);state=out.player;$('status').textContent=out.ok?'Done.':'Try another way. Nothing was lost.';render();});$('choices').appendChild(b);});
  $('creation-list').textContent=state.creations.length?state.creations.slice(-3).join(' · '):'Nothing made yet.';
  $('chronicle').textContent=state.chronicle.length?state.chronicle.slice(-5).join(' · '):'A fresh run.';
}

$('go').addEventListener('click',()=>{placeIndex=(placeIndex+1)%PLACES.length;state=goSomewhere(state,placeIndex);$('status').textContent=`Now at ${state.place}.`;render();$('scene-title').scrollIntoView({behavior:'smooth',block:'center'});});
$('play').addEventListener('click',()=>{const a=currentActivity(state);$('activity').scrollIntoView({behavior:'smooth',block:'center'});$('status').textContent=`Here: ${a.title}. Pick one clear action.`;});
$('make').addEventListener('click',()=>{$('make-panel').hidden=false;$('make-name').focus();$('status').textContent='Name one small thing you made.';});
$('make-add').addEventListener('click',()=>{const input=$('make-name');const name=input.value.trim();if(!name){$('status').textContent='Give it a short name first.';return;}state=addCreation(state,name);input.value='';$('status').textContent=`Made: ${name.slice(0,120)}`;render();});
$('make-name').addEventListener('keydown',event=>{if(event.key==='Enter')$('make-add').click();});
$('save').addEventListener('click',()=>{localStorage.setItem(KEY,serialize(state));$('status').textContent=`Saved locally. ${BOUNDARIES.authority}.`;});
$('load').addEventListener('click',()=>{const raw=localStorage.getItem(KEY);if(!raw){$('status').textContent='No local save yet.';return;}try{state=parse(raw);placeIndex=Math.max(0,PLACES.indexOf(state.place));$('status').textContent='Loaded local save.';render();}catch(e){$('status').textContent=`Save rejected: ${e.message}`;}});
$('learn').addEventListener('click',()=>{$('learn-panel').hidden=!$('learn-panel').hidden;if(!$('learn-panel').hidden)$('learn-panel').scrollIntoView({behavior:'smooth',block:'center'});});
$('next').addEventListener('click',()=>{state=nextActivity(state);render();});
$('reset').addEventListener('click',()=>{state=freshPlayer();placeIndex=0;$('make-panel').hidden=true;$('learn-panel').hidden=true;$('status').textContent='Fresh run. Saved copy unchanged.';render();});
$('boundaries').textContent=`${BOUNDARIES.authority} · ${BOUNDARIES.evidence}`;
render();
