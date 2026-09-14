import assert from 'node:assert/strict';
import {ACTIVITIES,PLACES,BOUNDARIES,freshPlayer,answerActivity,goSomewhere,addCreation,serialize,parse} from './core.mjs';

assert.equal(ACTIVITIES.length,12);
assert.equal(new Set(ACTIVITIES.map(a=>a.id)).size,12);
assert.ok(ACTIVITIES.filter(a=>a.kind==='move').length>=3);
assert.ok(ACTIVITIES.filter(a=>a.kind==='make').length>=2);
assert.ok(ACTIVITIES.some(a=>a.id==='fuzzball-question'));
assert.equal(BOUNDARIES.authority,'LOCAL != AUTHORITY');
assert.equal(BOUNDARIES.evidence,'REFERENCE != EVIDENCE');

let player=freshPlayer();
player=goSomewhere(player,3);
assert.equal(player.place,PLACES[3]);

const success=answerActivity(player,0);
assert.equal(success.ok,true);
assert.ok(success.player.xp>0);

const xpBefore=success.player.xp;
const miss=answerActivity(success.player,99);
assert.equal(miss.ok,false);
assert.equal(miss.player.xp,xpBefore);

const made=addCreation(miss.player,'Shelf hook');
assert.ok(made.creations.includes('Shelf hook'));

const restored=parse(serialize(made));
assert.equal(restored.creations.at(-1),'Shelf hook');
assert.throws(()=>parse(JSON.stringify({schema:'wrong'})),/wrong save schema/);

for(const activity of ACTIVITIES){
  assert.ok(activity.prompt.length>0);
  assert.ok(Array.isArray(activity.choices) && activity.choices.length>=2);
  assert.ok(!/countdown|milliseconds|beat the clock/i.test(activity.prompt));
}

console.log('PASS simple MMO core: 12 activities, bounded local save, non-punitive failure, no timer pressure, authority/evidence boundaries');
