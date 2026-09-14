import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeECS,videoJobs} from './ecs.mjs';
import {
  buildCarrierPlan,canonicalJson,sealCarrierPlan,sha256Canonical
} from './tools/visual-carrier-v2.mjs';
import {
  loadRegistry,buildRenderRequest,routeRenderRequest,selectFanout
} from './renderer-society.mjs';

const recipe=JSON.parse(readFileSync(new URL('./visual-carrier-v2/recipes/mercer-and-red-street.v1.json',import.meta.url),'utf8'));
const registryPayload=JSON.parse(readFileSync(new URL('./renderer-society/registry.v1.json',import.meta.url),'utf8'));
const recipeSha256=sha256Canonical(recipe);
const ecsJobs=videoJobs(initializeECS());
const ecsBefore=canonicalJson(ecsJobs);
const plan=buildCarrierPlan(ecsJobs,{
  place:'Mercer & Red Street',
  recipeId:'mercer-and-red-street.v1',
  recipeSha256,
  renderer:'blender-cycles-reference-v1'
});
const sealedPlan=sealCarrierPlan(plan);
const playerJob=plan.jobs.find(row=>row.perspective==='player-pov');
assert.ok(playerJob,'Mercer player-pov job must exist');

const snapshot=loadRegistry(registryPayload);
assert.equal(snapshot.schema,'conscience64.renderer-registry-snapshot/v1');
assert.equal(snapshot.entries.length,4);
assert.equal(snapshot.entries.filter(x=>x.discoveryTier==='admitted').length,1);
assert.match(snapshot.snapshotSha256,/^[0-9a-f]{64}$/);

const request=buildRenderRequest({
  sealedPlan,
  jobId:playerJob.id,
  intent:'reference-deterministic',
  capabilityRequirements:['diagnostic'],
  allowExperimental:false,
  fanoutMode:'single-best',
  maxCandidates:1
});
assert.equal(request.intent,'reference-deterministic');
assert.equal(request.sourceJobId,playerJob.id);
assert.equal(request.sourceJobSha256,playerJob.sourceJobSha256);
assert.equal(request.carrierPlanSha256,sealedPlan.seal.canonicalPayloadSha256);

const route=routeRenderRequest(snapshot,request);
assert.deepEqual(route.eligible.map(x=>x.id),['renderer:deterministic-diagnostic']);
assert.match(route.candidateSetSha256,/^[0-9a-f]{64}$/);
assert.match(route.routingPolicySha256,/^[0-9a-f]{64}$/);
assert.match(route.requestSha256,/^[0-9a-f]{64}$/);

const single=selectFanout(route,request);
assert.deepEqual(single.selectedIds,['renderer:deterministic-diagnostic']);
assert.match(single.decisionSha256,/^[0-9a-f]{64}$/);

const comparisonRequest=buildRenderRequest({
  sealedPlan,
  jobId:playerJob.id,
  intent:'diagnostic',
  capabilityRequirements:['diagnostic'],
  allowExperimental:true,
  fanoutMode:'comparison-set',
  maxCandidates:2
});
const comparisonRoute=routeRenderRequest(snapshot,comparisonRequest);
const comparison=selectFanout(comparisonRoute,comparisonRequest);
assert.deepEqual(comparison.selectedIds,[
  'renderer:deterministic-diagnostic',
  'pipeline:experimental-diagnostic'
]);

assert.equal(
  canonicalJson(routeRenderRequest(snapshot,request)),
  canonicalJson(route),
  'same registry snapshot and request must route identically'
);
assert.equal(
  canonicalJson(selectFanout(route,request)),
  canonicalJson(single),
  'same route and request must fan out identically'
);
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore,'renderer society planning must not mutate ECS jobs');
assert.equal(playerJob.sourceJobSha256,sha256Canonical(ecsJobs.find(job=>job.id===playerJob.id)),'renderer routing must retain source ECS-job identity');

console.log('PASS renderer society routing contract: Mercer registry snapshot, admitted-vs-experimental routing, bounded fan-out, stable provenance, immutable ECS input');
