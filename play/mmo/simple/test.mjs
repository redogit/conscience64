import assert from 'node:assert/strict';
import {ACTIVITIES,PLACES,CONTEXT,BOUNDARIES,freshPlayer,currentActivity,activitiesAtPlace,nextActivity,answerActivity,goSomewhere,addCreation,serialize,parse,contextFor} from './core.mjs';

assert.equal(ACTIVITIES.length,12);
assert.equal(new Set(ACTIVITIES.map(a=>a.id)).size,12);
assert.ok(ACTIVITIES.filter(a=>a.kind==='move').length>=3);
assert.ok(ACTIVITIES.filter(a=>a.kind==='make').length>=2);
assert.ok(ACTIVITIES.some(a=>a.id==='fuzzball-question'));
assert.equal(BOUNDARIES.authority,'LOCAL != AUTHORITY');
assert.equal(BOUNDARIES.evidence,'REFERENCE != EVIDENCE');
assert.deepEqual(Object.keys(CONTEXT).sort(), [...PLACES].sort());
for(const place of PLACES){assert.ok(contextFor(place).length>20);assert.ok(activitiesAtPlace(place).length>=1,`no activity at ${place}`);}
for(const activity of ACTIVITIES){assert.ok(PLACES.includes(activity.place));assert.ok(activity.prompt.length>0);assert.ok(Array.isArray(activity.choices)&&activity.choices.length>=2);assert.ok(!/countdown|milliseconds|beat the clock/i.test(activity.prompt));}

let player=freshPlayer();
assert.equal(currentActivity(player).place,player.place);
player=goSomewhere(player,2);
assert.equal(player.place,'Maker Garage');
assert.equal(currentActivity(player).id,'parcel-relay');
player=nextActivity(player);assert.equal(currentActivity(player).id,'workshop-sort');
player=nextActivity(player);assert.equal(currentActivity(player).id,'repair-bench');
player=nextActivity(player);assert.equal(currentActivity(player).id,'parcel-relay');

const success=answerActivity(player,0);assert.equal(success.ok,true);assert.ok(success.player.xp>0);assert.equal(success.activity.place,'Maker Garage');
const xpBefore=success.player.xp;const miss=answerActivity(success.player,99);assert.equal(miss.ok,false);assert.equal(miss.player.xp,xpBefore);
const made=addCreation(miss.player,'Shelf hook');assert.ok(made.creations.includes('Shelf hook'));
const restored=parse(serialize(made));assert.equal(restored.creations.at(-1),'Shelf hook');assert.throws(()=>parse(JSON.stringify({schema:'wrong'})),/wrong save schema/);
console.log('PASS simple MMO world loop: 8 places each have context + activities; 12 activities; place-aware play; bounded save; non-punitive failure');
