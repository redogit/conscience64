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
const ecsJobs=videoJobs(initializeECS());
const ecsBefore=canonicalJson(ecsJobs);
const plan=buildCarrierPlan(ecsJobs,{
  place:'Mercer & Red Street',
  recipeId:'mercer-and-red-street.v1',
  recipeSha256:sha256Canonical(recipe),
  renderer:'blender-cycles-reference-v1'
});
const sealedPlan=sealCarrierPlan(plan);
const sealedPlanBefore=canonicalJson(sealedPlan);
const snapshot=loadRegistry(registryPayload);

const executors={
  'renderer:deterministic-diagnostic':({entry,input,request})=>({
    schema:'conscience64.visual-diagnostic-artifact/v1',
    rendererId:entry.id,
    sourceJobId:request.sourceJobId,
    sourceJobSha256:request.sourceJobSha256,
    perspective:input.perspective,
    seeds:input.carrier.seeds,
    route:'complete-renderer',
    authority:'none',
    canon:false
  }),
  'stage:diagnostic-envelope':({entry,input,request})=>({
    schema:'conscience64.renderer-stage-output/v1',
    stageId:entry.id,
    sourceJobId:request.sourceJobId,
    sourceJobSha256:request.sourceJobSha256,
    perspective:input.perspective,
    envelope:{durationSec:input.durationSec,fps:input.fps,resolution:input.resolution},
    authority:'none'
  }),
  'stage:diagnostic-markers':({entry,input,request})=>({
    schema:'conscience64.visual-diagnostic-artifact/v1',
    stageId:entry.id,
    sourceJobId:input.sourceJobId,
    sourceJobSha256:input.sourceJobSha256,
    perspective:input.perspective,
    envelope:input.envelope,
    markers:['Mercer & Red Street','comparison-set'],
    route:'experimental-pipeline',
    authority:'none',
    canon:false
  })
};

const rows=[];
for(const job of plan.jobs){
  const request=buildRenderRequest({
    sealedPlan,
    jobId:job.id,
    intent:'diagnostic',
    capabilityRequirements:['diagnostic'],
    allowExperimental:true,
    fanoutMode:'comparison-set',
    maxCandidates:2
  });
  const route=routeRenderRequest(snapshot,request);
  const selection=selectFanout(route,request);
  assert.deepEqual(selection.selectedIds,[
    'renderer:deterministic-diagnostic',
    'pipeline:experimental-diagnostic'
  ]);

  const execution=executeSelection({snapshot,request,route,selection,executors,sealedInput:job});
  assert.equal(execution.executions.length,2);
  assert.ok(execution.executions.every(item=>item.terminalState==='succeeded'));
  const complete=execution.executions.find(item=>item.candidateId==='renderer:deterministic-diagnostic');
  const pipeline=execution.executions.find(item=>item.candidateId==='pipeline:experimental-diagnostic');
  assert.ok(complete&&pipeline);
  assert.notEqual(complete.artifactSha256,pipeline.artifactSha256,'comparison candidates must preserve distinct artifacts');
  assert.equal(pipeline.stageEvidence.length,2);
  assert.equal(pipeline.stageEvidence[0].outputSha256,pipeline.stageEvidence[1].inputSha256);

  const repeated=executeSelection({snapshot,request,route,selection,executors,sealedInput:job});
  assert.equal(repeated.executionSetSha256,execution.executionSetSha256,`${job.perspective} comparison execution must be deterministic`);

  const degradedExecutors={...executors};
  delete degradedExecutors['stage:diagnostic-markers'];
  const degraded=executeSelection({snapshot,request,route,selection,executors:degradedExecutors,sealedInput:job});
  const degradedComplete=degraded.executions.find(item=>item.candidateId==='renderer:deterministic-diagnostic');
  const degradedPipeline=degraded.executions.find(item=>item.candidateId==='pipeline:experimental-diagnostic');
  assert.equal(degraded.executions.length,2,'partial candidate failure must not erase sibling evidence');
  assert.equal(degradedComplete.terminalState,'succeeded','admitted sibling must remain successful when experimental pipeline fails');
  assert.equal(degradedPipeline.terminalState,'failed-toolchain');
  assert.equal(degradedPipeline.failedStageId,'stage:diagnostic-markers');
  assert.equal(degradedPipeline.stageEvidence.length,1,'successful upstream stage evidence must survive downstream failure');
  assert.ok(!('artifactSha256' in degradedPipeline),'failed pipeline must not claim a final artifact');

  rows.push({
    perspective:job.perspective,
    sourceJobSha256:job.sourceJobSha256,
    requestSha256:route.requestSha256,
    routingPolicySha256:route.routingPolicySha256,
    candidateSetSha256:route.candidateSetSha256,
    decisionSha256:selection.decisionSha256,
    completeArtifactSha256:complete.artifactSha256,
    pipelineArtifactSha256:pipeline.artifactSha256,
    executionSetSha256:execution.executionSetSha256,
    degradedExecutionSetSha256:degraded.executionSetSha256
  });
}

assert.equal(rows.length,3);
assert.equal(new Set(rows.map(row=>row.sourceJobSha256)).size,3,'three source perspectives must remain distinct');
assert.equal(new Set(rows.map(row=>row.requestSha256)).size,3,'render requests must remain perspective-specific');
assert.equal(new Set(rows.map(row=>row.routingPolicySha256)).size,1,'same comparison policy must remain stable across perspectives');
assert.equal(new Set(rows.map(row=>row.candidateSetSha256)).size,1,'same two candidates must form one stable candidate set across perspectives');
assert.equal(new Set(rows.map(row=>row.decisionSha256)).size,3,'fan-out decisions must bind the perspective-specific request');
assert.equal(new Set(rows.flatMap(row=>[row.completeArtifactSha256,row.pipelineArtifactSha256])).size,6,'three perspectives × two candidates must preserve six artifact identities');
assert.equal(new Set(rows.map(row=>row.executionSetSha256)).size,3,'successful comparison sets must remain perspective-specific');
assert.equal(new Set(rows.map(row=>row.degradedExecutionSetSha256)).size,3,'degraded comparison sets must remain perspective-specific');
assert.equal(canonicalJson(sealedPlan),sealedPlanBefore,'comparison execution must not mutate the sealed carrier plan');
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore,'comparison execution must not mutate ECS jobs');

console.log('PASS renderer society comparison: Mercer three-perspective × two-candidate fan-out, six preserved artifact identities, deterministic comparison policy, sibling-success retention under experimental pipeline failure, immutable carrier/ECS authority');
