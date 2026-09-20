import {makePrivateMethodRecoveryEnvelope} from '../../../tools/private-origin-boundary.mjs';
import assert from 'node:assert/strict';
import {
  ACTIVITIES,PLACES,freshPlayer,goSomewhere,addCreation,answerActivity,nextActivity
} from './core.mjs';
import {
  PERSPECTIVES,VIDEO_BOUNDARY,initializeECS,playerState,ecsGo,ecsMake,ecsNext,ecsAnswer,videoJobs,setPrivateMethodState
} from './ecs.mjs';

const world=initializeECS();
const integrity=world.get('world:rmao-world','ImportIntegrity');
assert.equal(integrity.ok,true);
assert.equal(integrity.placeCount,8);
assert.equal(integrity.activityCount,12);
assert.equal(world.query('Place').length,PLACES.length);
assert.equal(world.query('Activity').length,ACTIVITIES.length);
assert.equal(world.query('Perspective').length,3);
assert.deepEqual(PERSPECTIVES.map(p=>p.key),['player-pov','character-view','world-view']);

const jobs=videoJobs(world);
assert.equal(jobs.length,24);
assert.equal(new Set(jobs.map(job=>job.id)).size,24);
assert.ok(jobs.every(job=>job.boundary===VIDEO_BOUNDARY));
for(const placeEntity of world.query('Place')) assert.equal(jobs.filter(job=>job.sceneEntity===placeEntity).length,3);

// Core/ECS equivalence: the ECS adapter must preserve current simple-game behavior.
let core=freshPlayer();
core=goSomewhere(core,3);
const ecsAfterGo=ecsGo(world,3);
assert.deepEqual(ecsAfterGo,core);

core=nextActivity(core);
const ecsAfterNext=ecsNext(world);
assert.deepEqual(ecsAfterNext,core);

const coreAnswer=answerActivity(core,0);
const ecsResult=ecsAnswer(world,0);
core=coreAnswer.player;
assert.equal(ecsResult.ok,coreAnswer.ok);
assert.deepEqual(ecsResult.player,core);

core=addCreation(core,'Bench hook');
const ecsAfterMake=ecsMake(world,'Bench hook');
assert.deepEqual(ecsAfterMake,core);
assert.deepEqual(playerState(world),core);

// Deterministic reconstruction and job identities.
const worldA=initializeECS();
const worldB=initializeECS();
assert.equal(JSON.stringify(worldA.snapshot()),JSON.stringify(worldB.snapshot()));
assert.deepEqual(videoJobs(worldA).map(j=>j.id),videoJobs(worldB).map(j=>j.id));

const privateMethod=makePrivateMethodRecoveryEnvelope('Compare one independent counter-probe and preserve the unresolved remainder.');
const projected=setPrivateMethodState(worldA,privateMethod);
assert.equal(projected.carrier,'ecs-client');
assert.equal(projected.authority,'method-only');
assert.equal(projected.publication_allowed,false);
assert.ok(!Object.hasOwn(projected,'source'));
const privateSnapshot=JSON.stringify(worldA.snapshot());
assert.ok(privateSnapshot.includes('PrivateMethodState'));
assert.ok(privateSnapshot.includes('private-history-method-only'));
assert.ok(!privateSnapshot.includes('private-history:withheld'));
assert.ok(!privateSnapshot.includes('PRIVATE_STORY'));

console.log('PASS simple MMO ECS: 8 places, 12 activities, 3 perspectives, 24 deterministic video jobs, core/ECS behavior equivalence');
