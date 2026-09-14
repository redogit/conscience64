import {createHash} from 'node:crypto';
import {canonicalJson,sha256Canonical} from './tools/visual-carrier-v2.mjs';

const REGISTRY_SCHEMA='conscience64.renderer-registry/v1';
const SNAPSHOT_SCHEMA='conscience64.renderer-registry-snapshot/v1';
const REQUEST_SCHEMA='conscience64.render-request/v1';
const ROUTE_SCHEMA='conscience64.renderer-route/v1';
const FANOUT_SCHEMA='conscience64.renderer-fanout/v1';
const EXECUTION_SCHEMA='conscience64.renderer-execution/v1';
const EXECUTION_SET_SCHEMA='conscience64.renderer-execution-set/v1';
const FAILURE_SCHEMA='conscience64.renderer-failure/v1';
const STAGE_EVIDENCE_SCHEMA='conscience64.renderer-stage-evidence/v1';
const ENTRY_KINDS=new Set(['complete-renderer','stage','pipeline']);
const DISCOVERY_TIERS=new Set(['experimental','admitted']);
const FANOUT_MODES=new Set(['single-best','comparison-set','society-sweep']);
const INPUT_CONTRACT='conscience64.visual-carrier-job/v2';

function clone(value){return structuredClone(value);}
function nonEmptyString(value,name){if(typeof value!=='string'||value.length===0)throw new TypeError(`${name} must be a non-empty string`);return value;}
function stringArray(value,name,{allowEmpty=false}={}){
  if(!Array.isArray(value)||(!allowEmpty&&value.length===0))throw new TypeError(`${name} must be an array${allowEmpty?'':' with at least one item'}`);
  for(const item of value)nonEmptyString(item,`${name} item`);
  return [...value];
}
function positiveInteger(value,name){if(!Number.isInteger(value)||value<1)throw new TypeError(`${name} must be a positive integer`);return value;}
function assertSha256(value,name){nonEmptyString(value,name);if(!/^[0-9a-f]{64}$/.test(value))throw new TypeError(`${name} must be a lowercase SHA-256 digest`);return value;}
function unique(values){return new Set(values).size===values.length;}
function entryRank(entry){return entry.discoveryTier==='admitted'?0:1;}
function orderedCandidates(entries){return [...entries].sort((a,b)=>entryRank(a)-entryRank(b)||a.id.localeCompare(b.id)||a.manifestSha256.localeCompare(b.manifestSha256));}
function hashBytes(bytes){return createHash('sha256').update(bytes).digest('hex');}
function getExecutor(executors,id){
  if(executors instanceof Map)return executors.get(id);
  if(executors&&typeof executors==='object')return executors[id];
  return undefined;
}
function assertJsonValue(value,path='output',seen=new WeakSet()){
  if(value===null)return;
  const type=typeof value;
  if(type==='string'||type==='boolean')return;
  if(type==='number'){
    if(!Number.isFinite(value))throw new TypeError(`${path} contains a non-finite number`);
    return;
  }
  if(type!=='object')throw new TypeError(`${path} contains non-JSON value ${type}`);
  if(Buffer.isBuffer(value))return;
  if(seen.has(value))throw new TypeError(`${path} contains a cycle`);
  seen.add(value);
  if(Array.isArray(value)){
    value.forEach((item,index)=>assertJsonValue(item,`${path}[${index}]`,seen));
    seen.delete(value);
    return;
  }
  if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw new TypeError(`${path} must contain only plain JSON objects, arrays, strings, finite numbers, booleans, null, or Buffer`);
  for(const [key,item] of Object.entries(value))assertJsonValue(item,`${path}.${key}`,seen);
  seen.delete(value);
}
function serializeOutput(value){
  if(Buffer.isBuffer(value))return Buffer.from(value);
  if(typeof value==='string')return Buffer.from(value,'utf8');
  assertJsonValue(value);
  const encoded=canonicalJson(value);
  if(typeof encoded!=='string')throw new TypeError('executor output is not canonically serializable');
  return Buffer.from(encoded,'utf8');
}
function verifySealedPlan(sealedPlan){
  if(!sealedPlan||typeof sealedPlan!=='object'||Array.isArray(sealedPlan))throw new TypeError('sealedPlan must be an object');
  if(sealedPlan.schema!=='conscience64.visual-carrier-plan/v2')throw new Error('sealedPlan must use visual-carrier-plan/v2');
  if(!sealedPlan.seal||sealedPlan.seal.algorithm!=='sha256')throw new Error('sealedPlan must carry a sha256 seal');
  assertSha256(sealedPlan.seal.canonicalPayloadSha256,'sealedPlan seal');
  const payload=clone(sealedPlan);delete payload.seal;
  if(sha256Canonical(payload)!==sealedPlan.seal.canonicalPayloadSha256)throw new Error('sealedPlan seal does not match canonical payload');
  return sealedPlan;
}
function verifyRouteAndSelection(snapshot,request,route,selection){
  if(!snapshot||snapshot.schema!==SNAPSHOT_SCHEMA)throw new Error('snapshot must be a renderer-registry-snapshot/v1');
  assertSha256(snapshot.snapshotSha256,'snapshotSha256');
  if(!request||request.schema!==REQUEST_SCHEMA)throw new Error('request must be a render-request/v1');
  if(!route||route.schema!==ROUTE_SCHEMA)throw new Error('route must be a renderer-route/v1');
  if(!selection||selection.schema!==FANOUT_SCHEMA)throw new Error('selection must be a renderer-fanout/v1');
  const requestSha256=sha256Canonical(request);
  if(route.registrySnapshotSha256!==snapshot.snapshotSha256)throw new Error('route registry snapshot does not match snapshot');
  if(route.requestSha256!==requestSha256)throw new Error('route request digest does not match request');
  if(selection.registrySnapshotSha256!==snapshot.snapshotSha256)throw new Error('fanout registry snapshot does not match snapshot');
  if(selection.requestSha256!==requestSha256)throw new Error('fanout request digest does not match request');
  if(selection.routingPolicySha256!==route.routingPolicySha256||selection.candidateSetSha256!==route.candidateSetSha256)throw new Error('fanout route digests do not match route');
  const selectionPayload=clone(selection);delete selectionPayload.decisionSha256;
  if(sha256Canonical(selectionPayload)!==selection.decisionSha256)throw new Error('fanout decision digest does not match payload');
  const eligibleIds=new Set(route.eligible.map(entry=>entry.id));
  for(const id of selection.selectedIds)if(!eligibleIds.has(id))throw new Error(`selected candidate ${id} is not eligible`);
}

export function loadRegistry(registryObject){
  if(!registryObject||typeof registryObject!=='object'||Array.isArray(registryObject))throw new TypeError('registry must be an object');
  if(registryObject.schema!==REGISTRY_SCHEMA)throw new Error(`registry schema must be ${REGISTRY_SCHEMA}`);
  if(!Array.isArray(registryObject.entries)||registryObject.entries.length===0)throw new TypeError('registry.entries must be a non-empty array');

  const ids=new Set();
  const rawEntries=registryObject.entries.map((source,index)=>{
    if(!source||typeof source!=='object'||Array.isArray(source))throw new TypeError(`registry entry ${index} must be an object`);
    const entry=clone(source);
    nonEmptyString(entry.id,`entry ${index}.id`);
    nonEmptyString(entry.version,`entry ${entry.id}.version`);
    if(ids.has(entry.id))throw new Error(`duplicate registry entry: ${entry.id}`);ids.add(entry.id);
    if(!ENTRY_KINDS.has(entry.kind))throw new Error(`unknown entry kind for ${entry.id}: ${entry.kind}`);
    if(!DISCOVERY_TIERS.has(entry.discoveryTier))throw new Error(`unknown discovery tier for ${entry.id}: ${entry.discoveryTier}`);
    if(entry.authority!=='none')throw new Error(`renderer entry ${entry.id} must have authority none`);
    if(!entry.governance||typeof entry.governance!=='object'||Array.isArray(entry.governance))throw new TypeError(`entry ${entry.id}.governance must be an object`);
    stringArray(entry.governance.classifications,`entry ${entry.id}.governance.classifications`,{allowEmpty:true});
    nonEmptyString(entry.governance.evidenceScope,`entry ${entry.id}.governance.evidenceScope`);
    if(!entry.capabilities||typeof entry.capabilities!=='object'||Array.isArray(entry.capabilities))throw new TypeError(`entry ${entry.id}.capabilities must be an object`);
    stringArray(entry.capabilities.intents,`entry ${entry.id}.capabilities.intents`);
    stringArray(entry.capabilities.features,`entry ${entry.id}.capabilities.features`,{allowEmpty:true});
    nonEmptyString(entry.capabilities.determinism,`entry ${entry.id}.capabilities.determinism`);
    stringArray(entry.capabilities.inputContracts,`entry ${entry.id}.capabilities.inputContracts`);
    stringArray(entry.capabilities.outputContracts,`entry ${entry.id}.capabilities.outputContracts`);
    stringArray(entry.resourceClasses,`entry ${entry.id}.resourceClasses`);
    stringArray(entry.latencyClasses,`entry ${entry.id}.latencyClasses`);
    stringArray(entry.executionSurfaces,`entry ${entry.id}.executionSurfaces`);
    if('manifestSha256' in entry)throw new Error(`entry ${entry.id} must not embed its own manifest digest`);
    return entry;
  });

  const byId=new Map(rawEntries.map(entry=>[entry.id,entry]));
  for(const entry of rawEntries){
    if(entry.kind!=='pipeline')continue;
    const stageRefs=stringArray(entry.stageRefs,`pipeline ${entry.id}.stageRefs`);
    if(!unique(stageRefs))throw new Error(`pipeline ${entry.id} contains duplicate stage references`);
    for(const stageId of stageRefs){
      const stage=byId.get(stageId);
      if(!stage)throw new Error(`pipeline ${entry.id} references missing stage ${stageId}`);
      if(stage.kind!=='stage')throw new Error(`pipeline ${entry.id} reference ${stageId} is not a stage`);
    }
  }

  const nonPipelineDigests=new Map(rawEntries.filter(entry=>entry.kind!=='pipeline').map(entry=>[entry.id,sha256Canonical(entry)]));
  const entries=rawEntries.map(entry=>{
    if(entry.kind!=='pipeline')return {...entry,manifestSha256:nonPipelineDigests.get(entry.id)};
    const resolvedStages=entry.stageRefs.map(stageId=>{
      const stage=byId.get(stageId);
      return {id:stage.id,version:stage.version,manifestSha256:nonPipelineDigests.get(stage.id)};
    });
    return {...entry,resolvedStages,manifestSha256:sha256Canonical({...entry,resolvedStages})};
  }).sort((a,b)=>a.id.localeCompare(b.id));
  const snapshotPayload={
    schema:SNAPSHOT_SCHEMA,
    sourceSchema:REGISTRY_SCHEMA,
    entries:entries.map(entry=>({id:entry.id,version:entry.version,kind:entry.kind,manifestSha256:entry.manifestSha256}))
  };
  return {...snapshotPayload,entries,snapshotSha256:sha256Canonical(snapshotPayload)};
}

export function buildRenderRequest({sealedPlan,jobId,intent,capabilityRequirements=[],allowExperimental=false,fanoutMode='single-best',maxCandidates=1}){
  verifySealedPlan(sealedPlan);
  nonEmptyString(jobId,'jobId');
  nonEmptyString(intent,'intent');
  if(!FANOUT_MODES.has(fanoutMode))throw new Error(`unknown fanout mode: ${fanoutMode}`);
  positiveInteger(maxCandidates,'maxCandidates');
  const requirements=stringArray(capabilityRequirements,'capabilityRequirements',{allowEmpty:true});
  if(!unique(requirements))throw new Error('capabilityRequirements must not contain duplicates');
  const job=sealedPlan.jobs?.find(row=>row.id===jobId);
  if(!job)throw new Error(`sealed carrier plan does not contain job ${jobId}`);
  assertSha256(job.sourceJobSha256,'sourceJobSha256');
  assertSha256(job.carrier?.recipeSha256,'recipeSha256');

  return {
    schema:REQUEST_SCHEMA,
    carrierPlanSha256:sealedPlan.seal.canonicalPayloadSha256,
    sourceJobId:job.id,
    sourceJobSha256:job.sourceJobSha256,
    recipeSha256:job.carrier.recipeSha256,
    inputContract:INPUT_CONTRACT,
    intent,
    capabilityRequirements:[...requirements].sort(),
    determinismRequired:intent==='reference-deterministic',
    allowExperimental:Boolean(allowExperimental),
    fanoutMode,
    maxCandidates
  };
}

export function routeRenderRequest(snapshot,request){
  if(!snapshot||snapshot.schema!==SNAPSHOT_SCHEMA)throw new Error('snapshot must be a renderer-registry-snapshot/v1');
  assertSha256(snapshot.snapshotSha256,'snapshotSha256');
  if(!request||request.schema!==REQUEST_SCHEMA)throw new Error('request must be a render-request/v1');
  const topLevel=snapshot.entries.filter(entry=>entry.kind==='complete-renderer'||entry.kind==='pipeline');
  const eligible=orderedCandidates(topLevel.filter(entry=>{
    if(entry.discoveryTier==='experimental'&&!request.allowExperimental)return false;
    if(!entry.capabilities.inputContracts.includes(request.inputContract))return false;
    if(!entry.capabilities.intents.includes(request.intent))return false;
    if(request.determinismRequired&&entry.capabilities.determinism!=='reference-deterministic')return false;
    return request.capabilityRequirements.every(capability=>entry.capabilities.features.includes(capability));
  }));
  const requestSha256=sha256Canonical(request);
  const routingPolicy={
    schema:'conscience64.renderer-routing-policy/v1',
    admittedFirst:true,
    allowExperimental:request.allowExperimental,
    inputContract:request.inputContract,
    intent:request.intent,
    determinismRequired:request.determinismRequired,
    capabilityRequirements:request.capabilityRequirements
  };
  const routingPolicySha256=sha256Canonical(routingPolicy);
  const candidateSetSha256=sha256Canonical(eligible.map(entry=>({id:entry.id,version:entry.version,manifestSha256:entry.manifestSha256})));
  return {
    schema:ROUTE_SCHEMA,
    registrySnapshotSha256:snapshot.snapshotSha256,
    requestSha256,
    routingPolicy,
    routingPolicySha256,
    candidateSetSha256,
    eligible:clone(eligible)
  };
}

export function selectFanout(route,request){
  if(!route||route.schema!==ROUTE_SCHEMA)throw new Error('route must be a renderer-route/v1');
  if(!request||request.schema!==REQUEST_SCHEMA)throw new Error('request must be a render-request/v1');
  let selected=[];
  if(request.fanoutMode==='single-best'){
    const admitted=route.eligible.find(entry=>entry.discoveryTier==='admitted');
    if(!admitted)throw new Error('single-best requires an admitted eligible renderer');
    selected=[admitted];
  }else if(request.fanoutMode==='comparison-set'){
    selected=route.eligible.slice(0,request.maxCandidates);
    if(selected.length===0)throw new Error('comparison-set has no eligible candidates');
  }else if(request.fanoutMode==='society-sweep'){
    if(request.maxCandidates<1)throw new Error('society-sweep requires an explicit positive bound');
    selected=route.eligible.slice(0,request.maxCandidates);
    if(selected.length===0)throw new Error('society-sweep has no eligible candidates');
  }else{
    throw new Error(`unknown fanout mode: ${request.fanoutMode}`);
  }
  const selectedIds=selected.map(entry=>entry.id);
  const decisionPayload={
    schema:FANOUT_SCHEMA,
    mode:request.fanoutMode,
    registrySnapshotSha256:route.registrySnapshotSha256,
    routingPolicySha256:route.routingPolicySha256,
    candidateSetSha256:route.candidateSetSha256,
    requestSha256:route.requestSha256,
    selectedIds
  };
  return {...decisionPayload,decisionSha256:sha256Canonical(decisionPayload)};
}

function baseExecutionRecord({snapshot,request,route,selection,candidate,sealedInputSha256}){
  return {
    schema:EXECUTION_SCHEMA,
    candidateId:candidate.id,
    candidateKind:candidate.kind,
    candidateManifestSha256:candidate.manifestSha256,
    registrySnapshotSha256:snapshot.snapshotSha256,
    requestSha256:route.requestSha256,
    routingPolicySha256:route.routingPolicySha256,
    candidateSetSha256:route.candidateSetSha256,
    fanoutDecisionSha256:selection.decisionSha256,
    sourceJobId:request.sourceJobId,
    sourceJobSha256:request.sourceJobSha256,
    recipeSha256:request.recipeSha256,
    sealedInputSha256,
    authority:'none',
    worldAuthority:false,
    canon:false
  };
}
function successExecution(base,stageEvidence,artifactBytes){
  const payload={
    ...base,
    terminalState:'succeeded',
    stageEvidence,
    artifactSha256:hashBytes(artifactBytes),
    artifactBytes:artifactBytes.length
  };
  return {...payload,executionSha256:sha256Canonical(payload)};
}
function failedExecution(base,terminalState,message,stageEvidence,failedStageId){
  const failurePayload={
    schema:FAILURE_SCHEMA,
    terminalState,
    candidateId:base.candidateId,
    candidateManifestSha256:base.candidateManifestSha256,
    registrySnapshotSha256:base.registrySnapshotSha256,
    requestSha256:base.requestSha256,
    routingPolicySha256:base.routingPolicySha256,
    candidateSetSha256:base.candidateSetSha256,
    fanoutDecisionSha256:base.fanoutDecisionSha256,
    sourceJobId:base.sourceJobId,
    sourceJobSha256:base.sourceJobSha256,
    recipeSha256:base.recipeSha256,
    sealedInputSha256:base.sealedInputSha256,
    failedStageId:failedStageId??null,
    message,
    stageEvidence
  };
  const failureRecordSha256=sha256Canonical(failurePayload);
  const executionPayload={
    ...base,
    terminalState,
    ...(failedStageId?{failedStageId}:{}),
    stageEvidence,
    failureRecordSha256
  };
  return {...executionPayload,executionSha256:sha256Canonical(executionPayload)};
}
function invokeExecutor(executor,args){
  if(typeof executor!=='function')return {ok:false,terminalState:'failed-toolchain',message:'executor is not available'};
  try{
    const output=executor(args);
    const bytes=serializeOutput(output);
    return {ok:true,output,bytes};
  }catch(error){
    const terminalState=error instanceof TypeError?'failed-provenance':'failed-render';
    return {ok:false,terminalState,message:String(error?.message||error)};
  }
}

export function executeSelection({snapshot,request,route,selection,executors,sealedInput}){
  verifyRouteAndSelection(snapshot,request,route,selection);
  if(!sealedInput||typeof sealedInput!=='object'||Array.isArray(sealedInput))throw new TypeError('sealedInput must be a carrier job object');
  if(sealedInput.id!==request.sourceJobId)throw new Error('sealedInput job ID does not match render request');
  if(sealedInput.sourceJobSha256!==request.sourceJobSha256)throw new Error('sealedInput source-job digest does not match render request');
  if(sealedInput.carrier?.recipeSha256!==request.recipeSha256)throw new Error('sealedInput recipe digest does not match render request');
  const sealedInputSha256=sha256Canonical(sealedInput);
  const entryById=new Map(snapshot.entries.map(entry=>[entry.id,entry]));
  const executions=[];

  for(const candidateId of selection.selectedIds){
    const candidate=entryById.get(candidateId);
    if(!candidate)throw new Error(`selected candidate ${candidateId} is absent from registry snapshot`);
    const base=baseExecutionRecord({snapshot,request,route,selection,candidate,sealedInputSha256});

    if(candidate.kind==='complete-renderer'){
      const result=invokeExecutor(getExecutor(executors,candidate.id),{
        entry:clone(candidate),input:clone(sealedInput),request:clone(request)
      });
      if(!result.ok){
        executions.push(failedExecution(base,result.terminalState,`${candidate.id}: ${result.message}`,[],undefined));
        continue;
      }
      executions.push(successExecution(base,[],result.bytes));
      continue;
    }

    if(candidate.kind==='pipeline'){
      let current=clone(sealedInput);
      let currentBytes=serializeOutput(current);
      const stageEvidence=[];
      let failure=null;
      for(const stageId of candidate.stageRefs){
        const stage=entryById.get(stageId);
        if(!stage||stage.kind!=='stage'){
          failure={terminalState:'failed-provenance',message:`pipeline stage ${stageId} is missing from registry snapshot`,failedStageId:stageId};
          break;
        }
        const executor=getExecutor(executors,stageId);
        if(typeof executor!=='function'){
          failure={terminalState:'failed-toolchain',message:`executor is not available for ${stageId}`,failedStageId:stageId};
          break;
        }
        const inputSha256=hashBytes(currentBytes);
        const result=invokeExecutor(executor,{entry:clone(stage),input:clone(current),request:clone(request)});
        if(!result.ok){
          failure={terminalState:result.terminalState,message:`${stageId}: ${result.message}`,failedStageId:stageId};
          break;
        }
        const outputSha256=hashBytes(result.bytes);
        stageEvidence.push({
          schema:STAGE_EVIDENCE_SCHEMA,
          stageId,
          stageManifestSha256:stage.manifestSha256,
          inputSha256,
          outputSha256,
          terminalState:'succeeded'
        });
        current=result.output;
        currentBytes=result.bytes;
      }
      if(failure){
        executions.push(failedExecution(base,failure.terminalState,failure.message,stageEvidence,failure.failedStageId));
        continue;
      }
      executions.push(successExecution(base,stageEvidence,currentBytes));
      continue;
    }

    executions.push(failedExecution(base,'failed-provenance',`selected candidate ${candidate.id} is not executable`,[],undefined));
  }

  const payload={
    schema:EXECUTION_SET_SCHEMA,
    registrySnapshotSha256:snapshot.snapshotSha256,
    requestSha256:route.requestSha256,
    routingPolicySha256:route.routingPolicySha256,
    candidateSetSha256:route.candidateSetSha256,
    fanoutDecisionSha256:selection.decisionSha256,
    sourceJobId:request.sourceJobId,
    sourceJobSha256:request.sourceJobSha256,
    sealedInputSha256,
    executions
  };
  return {...payload,executionSetSha256:sha256Canonical(payload)};
}

export {canonicalJson};
