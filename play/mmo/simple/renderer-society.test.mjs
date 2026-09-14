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
const playerJob=plan.jobs.find(row=>row.perspective==='player-pov');
assert.ok(playerJob,'Mercer player-pov job must exist');

const snapshot=loadRegistry(registryPayload);
assert.equal(snapshot.schema,'conscience64.renderer-registry-snapshot/v1');
assert.equal(snapshot.entries.length,4);
assert.equal(snapshot.entries.filter(x=>x.discoveryTier==='admitted').length,1);
const admittedRenderer=snapshot.entries.find(x=>x.id==='renderer:deterministic-diagnostic');
assert.ok(admittedRenderer,'admitted deterministic diagnostic renderer must exist');
assert.deepEqual(admittedRenderer.governance.classifications,[],'bounded Mercer admission must not silently claim trusted/reference classification');
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

const executors={
  'renderer:deterministic-diagnostic':({entry,input,request:activeRequest})=>({
    schema:'conscience64.visual-diagnostic-artifact/v1',
    rendererId:entry.id,
    sourceJobId:activeRequest.sourceJobId,
    perspective:input.perspective,
    recipeSha256:activeRequest.recipeSha256,
    seeds:input.carrier.seeds,
    authority:'none',
    canon:false
  }),
  'stage:diagnostic-envelope':({entry,input,request:activeRequest})=>({
    schema:'conscience64.renderer-stage-output/v1',
    stageId:entry.id,
    sourceJobId:activeRequest.sourceJobId,
    perspective:input.perspective,
    recipeSha256:activeRequest.recipeSha256,
    envelope:{durationSec:input.durationSec,fps:input.fps,resolution:input.resolution},
    authority:'none'
  }),
  'stage:diagnostic-markers':({entry,input,request:activeRequest})=>({
    schema:'conscience64.visual-diagnostic-artifact/v1',
    stageId:entry.id,
    sourceJobId:input.sourceJobId,
    perspective:input.perspective,
    recipeSha256:activeRequest.recipeSha256,
    markers:['Mercer & Red Street','diagnostic'],
    envelope:input.envelope,
    authority:'none',
    canon:false
  })
};

const execution=executeSelection({
  snapshot,
  request:comparisonRequest,
  route:comparisonRoute,
  selection:comparison,
  executors,
  sealedInput:playerJob
});
assert.equal(execution.schema,'conscience64.renderer-execution-set/v1');
assert.equal(execution.executions.length,2);
assert.match(execution.executionSetSha256,/^[0-9a-f]{64}$/);
assert.ok(execution.executions.every(row=>row.terminalState==='succeeded'));

const completeExecution=execution.executions.find(row=>row.candidateId==='renderer:deterministic-diagnostic');
const pipelineExecution=execution.executions.find(row=>row.candidateId==='pipeline:experimental-diagnostic');
assert.ok(completeExecution&&pipelineExecution,'both selected candidates must remain represented');
assert.match(completeExecution.artifactSha256,/^[0-9a-f]{64}$/);
assert.ok(completeExecution.artifactBytes>0);
assert.deepEqual(completeExecution.stageEvidence,[]);
assert.match(completeExecution.executionSha256,/^[0-9a-f]{64}$/);

assert.equal(pipelineExecution.stageEvidence.length,2);
assert.equal(pipelineExecution.stageEvidence[0].stageId,'stage:diagnostic-envelope');
assert.equal(pipelineExecution.stageEvidence[1].stageId,'stage:diagnostic-markers');
assert.equal(
  pipelineExecution.stageEvidence[0].outputSha256,
  pipelineExecution.stageEvidence[1].inputSha256,
  'ordered pipeline output must become the next stage input'
);
assert.match(pipelineExecution.artifactSha256,/^[0-9a-f]{64}$/);
assert.ok(pipelineExecution.artifactBytes>0);
assert.match(pipelineExecution.executionSha256,/^[0-9a-f]{64}$/);

const repeatedExecution=executeSelection({
  snapshot,
  request:comparisonRequest,
  route:comparisonRoute,
  selection:comparison,
  executors,
  sealedInput:playerJob
});
assert.equal(repeatedExecution.executionSetSha256,execution.executionSetSha256,'same sealed execution inputs must produce the same execution-set identity');
assert.equal(canonicalJson(repeatedExecution),canonicalJson(execution),'deterministic diagnostic execution must be byte-for-byte stable as canonical JSON');
assert.equal(canonicalJson(videoJobs(initializeECS())),ecsBefore,'renderer execution must not mutate ECS jobs');

const missingStageExecutors={...executors};
delete missingStageExecutors['stage:diagnostic-markers'];
const failedExecution=executeSelection({
  snapshot,
  request:comparisonRequest,
  route:comparisonRoute,
  selection:comparison,
  executors:missingStageExecutors,
  sealedInput:playerJob
});
const failedPipeline=failedExecution.executions.find(row=>row.candidateId==='pipeline:experimental-diagnostic');
assert.ok(failedPipeline,'failed selected pipeline must remain visible');
assert.equal(failedPipeline.terminalState,'failed-toolchain');
assert.equal(failedPipeline.failedStageId,'stage:diagnostic-markers');
assert.equal(failedPipeline.stageEvidence.length,1,'successful upstream stage evidence must be retained');
assert.match(failedPipeline.failureRecordSha256,/^[0-9a-f]{64}$/);
assert.ok(!('artifactSha256' in failedPipeline),'failed pipeline must not claim a final artifact');
assert.match(failedPipeline.executionSha256,/^[0-9a-f]{64}$/);

console.log('PASS renderer society: deterministic Mercer routing, bounded fan-out, isolated complete/pipeline execution provenance, immutable ECS input, explicit failure evidence, no unearned trust promotion');
