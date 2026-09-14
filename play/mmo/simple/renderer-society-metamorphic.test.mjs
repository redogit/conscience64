import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeECS,videoJobs} from './ecs.mjs';
import {
  buildCarrierPlan,canonicalJson,sealCarrierPlan,sha256Canonical
} from './tools/visual-carrier-v2.mjs';
import {
  loadRegistry,buildRenderRequest,routeRenderRequest,selectFanout,executeSelection
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
const sealedPlanBefore=canonicalJson(sealedPlan);
const snapshot=loadRegistry(registryPayload);

assert.deepEqual(plan.jobs.map(job=>job.perspective).sort(),['character-view','player-pov','world-view']);
assert.equal(plan.jobs.length,3);

const executors={
  'renderer:deterministic-diagnostic':({entry,input,request})=>({
    schema:'conscience64.visual-diagnostic-artifact/v1',
    rendererId:entry.id,
    sourceJobId:request.sourceJobId,
    sourceJobSha256:request.sourceJobSha256,
    perspective:input.perspective,
    recipeSha256:request.recipeSha256,
    seeds:input.carrier.seeds,
    authority:'none',
    canon:false
  })
};

const perspectiveEvidence=[];
for(const job of plan.jobs){
  const request=buildRenderRequest({
    sealedPlan,
    jobId:job.id,
    intent:'reference-deterministic',
    capabilityRequirements:['diagnostic'],
    allowExperimental:false,
    fanoutMode:'single-best',
    maxCandidates:1
  });
  const route=routeRenderRequest(snapshot,request);
  const selection=selectFanout(route,request);
  const first=executeSelection({snapshot,request,route,selection,executors,sealedInput:job});
  const second=executeSelection({snapshot,request,route,selection,executors,sealedInput:job});
  assert.equal(first.executionSetSha256,second.executionSetSha256,`${job.perspective} execution must be deterministic`);
  assert.equal(canonicalJson(first),canonicalJson(second),`${job.perspective} canonical execution record must be stable`);
  assert.deepEqual(selection.selectedIds,['renderer:deterministic-diagnostic']);
  assert.equal(first.executions.length,1);
  assert.equal(first.executions[0].terminalState,'succeeded');
  perspectiveEvidence.push({
    perspective:job.perspective,
    sourceJobId:job.id,
    sourceJobSha256:job.sourceJobSha256,
    requestSha256:route.requestSha256,
    artifactSha256:first.executions[0].artifactSha256,
    executionSha256:first.executions[0].executionSha256,
    executionSetSha256:first.executionSetSha256,
    registrySnapshotSha256:snapshot.snapshotSha256
  });
}

assert.equal(new Set(perspectiveEvidence.map(row=>row.sourceJobSha256)).size,3,'three Mercer perspectives must retain three source-job identities');
assert.equal(new Set(perspectiveEvidence.map(row=>row.requestSha256)).size,3,'three Mercer perspectives must retain three render-request identities');
assert.equal(new Set(perspectiveEvidence.map(row=>row.artifactSha256)).size,3,'diagnostic artifacts must not collapse distinct perspectives');
assert.equal(new Set(perspectiveEvidence.map(row=>row.executionSetSha256)).size,3,'execution-set identities must remain perspective-specific');
assert.equal(new Set(perspectiveEvidence.map(row=>row.registrySnapshotSha256)).size,1,'all three perspectives must use the same sealed registry snapshot');
assert.equal(canonicalJson(sealedPlan),sealedPlanBefore,'three-perspective execution must not mutate the sealed carrier plan');
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore,'three-perspective execution must not mutate ECS jobs');

// Metamorphic identity test: change one stage version only. The stage, pipeline,
// registry snapshot, candidate-set, and fan-out decision identities must change;
// the admitted renderer and sealed ECS/carrier identities must not.
const mutatedRegistryPayload=structuredClone(registryPayload);
const mutatedStage=mutatedRegistryPayload.entries.find(entry=>entry.id==='stage:diagnostic-envelope');
assert.ok(mutatedStage,'diagnostic envelope stage must exist');
mutatedStage.version='1.0.1-metamorphic';
const mutatedSnapshot=loadRegistry(mutatedRegistryPayload);

const baseStage=snapshot.entries.find(entry=>entry.id==='stage:diagnostic-envelope');
const nextStage=mutatedSnapshot.entries.find(entry=>entry.id==='stage:diagnostic-envelope');
const basePipeline=snapshot.entries.find(entry=>entry.id==='pipeline:experimental-diagnostic');
const nextPipeline=mutatedSnapshot.entries.find(entry=>entry.id==='pipeline:experimental-diagnostic');
const baseRenderer=snapshot.entries.find(entry=>entry.id==='renderer:deterministic-diagnostic');
const nextRenderer=mutatedSnapshot.entries.find(entry=>entry.id==='renderer:deterministic-diagnostic');
assert.notEqual(nextStage.manifestSha256,baseStage.manifestSha256,'stage manifest identity must change');
assert.notEqual(nextPipeline.manifestSha256,basePipeline.manifestSha256,'pipeline identity must bind changed stage identity');
assert.notEqual(mutatedSnapshot.snapshotSha256,snapshot.snapshotSha256,'registry snapshot identity must change');
assert.equal(nextRenderer.manifestSha256,baseRenderer.manifestSha256,'unmodified admitted renderer identity must remain stable');

const playerJob=plan.jobs.find(job=>job.perspective==='player-pov');
const comparisonRequest=buildRenderRequest({
  sealedPlan,
  jobId:playerJob.id,
  intent:'diagnostic',
  capabilityRequirements:['diagnostic'],
  allowExperimental:true,
  fanoutMode:'comparison-set',
  maxCandidates:2
});
const baseRoute=routeRenderRequest(snapshot,comparisonRequest);
const mutatedRoute=routeRenderRequest(mutatedSnapshot,comparisonRequest);
const baseSelection=selectFanout(baseRoute,comparisonRequest);
const mutatedSelection=selectFanout(mutatedRoute,comparisonRequest);
assert.equal(mutatedRoute.requestSha256,baseRoute.requestSha256,'stage mutation must not rewrite the render request');
assert.notEqual(mutatedRoute.candidateSetSha256,baseRoute.candidateSetSha256,'candidate-set identity must bind changed pipeline identity');
assert.deepEqual(mutatedSelection.selectedIds,baseSelection.selectedIds,'bounded routing membership must remain stable for version-only stage mutation');
assert.notEqual(mutatedSelection.decisionSha256,baseSelection.decisionSha256,'fan-out decision identity must bind changed candidate-set identity');
assert.equal(canonicalJson(sealedPlan),sealedPlanBefore,'stage registry mutation must not rewrite the sealed carrier plan');
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore,'stage registry mutation must not rewrite ECS jobs');

console.log('PASS renderer society metamorphic verification: Mercer three-perspective identity separation, deterministic execution, stage→pipeline→registry digest propagation, immutable carrier/ECS authority');
