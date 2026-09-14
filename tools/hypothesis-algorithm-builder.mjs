import {createHash} from 'node:crypto';

export const HYPOTHESIS_BUILDER_SCHEMA='conscience64.hypothesis-algorithm-builder/v1';
export const HYPOTHESIS_BOUNDARIES=Object.freeze([
  'INTUITION != EVIDENCE',
  'HYPOTHESIS != CLAIM_ESTABLISHED',
  'GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT',
  'TEST_SUPPORT != UNIVERSAL_TRUTH',
  'TEST_CONTRADICTION != UNIVERSAL_FALSEHOOD',
  'SEMANTIC_MATCH != CORROBORATION',
  'ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION',
  'REPAIR != HISTORY_REWRITE'
]);

const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);
const text=v=>String(v??'').normalize('NFKC').trim();
const clone=v=>structuredClone(v);

function canonicalize(value){
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonicalize(value[k])]));
  }
  return value;
}
function stableJson(value){return JSON.stringify(canonicalize(value));}
function stableId(prefix,value){
  const digest=createHash('sha256').update(stableJson(value)).digest('hex');
  return `${prefix}:${digest}`;
}
function assertNonEmpty(value,name){
  if(!text(value))throw new Error(`${name} must be non-empty`);
}
function deepEqual(a,b){return stableJson(a)===stableJson(b);}

export function createHypothesisSeed(input={}){
  const source=object(input);
  assertNonEmpty(source.intuition,'intuition');
  const payload={
    intuition:String(source.intuition),
    subject:text(source.subject),
    formalStatement:text(source.formalStatement??source.formal_statement),
    assumptions:arr(source.assumptions).map(text).filter(Boolean),
    observables:arr(source.observables).map(text).filter(Boolean),
    alternatives:arr(source.alternatives).map(text).filter(Boolean),
    scope:text(source.scope),
    provenance:clone(object(source.provenance))
  };
  const unresolved=[];
  if(!payload.formalStatement)unresolved.push('formalStatement');
  if(!payload.observables.length)unresolved.push('observables');
  return {
    schema:'conscience64.hypothesis-seed/v1',
    id:stableId('hypothesis',payload),
    ...payload,
    unresolved,
    epistemicStatus:'hypothesis-only',
    authority:'none',
    boundaries:[...HYPOTHESIS_BOUNDARIES]
  };
}

export function xorStateDelta(before,after){
  const a=String(before??''),b=String(after??'');
  if(a.length!==b.length)throw new Error('binary states must have equal length');
  if(!/^[01]+$/.test(a)||!/^[01]+$/.test(b))throw new Error('binary states must contain only binary digits 0 or 1');
  let delta='';
  for(let i=0;i<a.length;i++)delta+=a[i]===b[i]?'0':'1';
  const apply=(state,mask)=>{
    let out='';
    for(let i=0;i<state.length;i++)out+=state[i]===mask[i]?'0':'1';
    return out;
  };
  const forwardReplay=apply(a,delta);
  const backwardReplay=apply(b,delta);
  return {
    schema:'conscience64.binary-xor-delta/v1',
    before:a,after:b,delta,
    forwardReplay,backwardReplay,
    exactRoundTrip:forwardReplay===b&&backwardReplay===a,
    authority:'calibration-only',
    boundaries:['FINITE_BINARY_CALIBRATION != UNIVERSAL_STATE_LAW','INTUITION != EVIDENCE']
  };
}

function interventionChange(intervention){
  const item=object(intervention);
  if(item.changes!=null){
    const entries=Object.entries(object(item.changes));
    if(entries.length!==1)throw new Error('one-degree intervention must change exactly one factor');
    return {factor:entries[0][0],value:entries[0][1]};
  }
  if(item.factor==null)throw new Error('one-degree intervention must change exactly one factor');
  return {factor:String(item.factor),value:item.value};
}

export function compileDiscriminatorPlan(seed,input={}){
  if(!seed?.id)throw new Error('hypothesis seed with id is required');
  const cfg=object(input);
  const baselineState=clone(object(cfg.baselineState??cfg.baseline_state));
  const baselineKeys=Object.keys(baselineState);
  if(!baselineKeys.length)throw new Error('baselineState must contain at least one factor');
  const interventions=arr(cfg.interventions);
  const ids=new Set(['baseline']);
  const conditions=[{
    id:'baseline',
    changedFactors:[],
    state:clone(baselineState),
    authority:'condition-only'
  }];
  for(const raw of interventions){
    const item=object(raw);
    const id=text(item.id);
    if(!id)throw new Error('intervention id must be non-empty');
    if(ids.has(id))throw new Error(`duplicate intervention id: ${id}`);
    ids.add(id);
    const {factor,value}=interventionChange(item);
    if(!Object.prototype.hasOwnProperty.call(baselineState,factor))throw new Error(`unknown baseline factor: ${factor}`);
    if(deepEqual(baselineState[factor],value))throw new Error(`one-degree intervention for ${factor} must change the baseline value`);
    const state=clone(baselineState);
    state[factor]=clone(value);
    conditions.push({id,changedFactors:[factor],state,authority:'condition-only'});
  }
  const payload={
    hypothesisId:String(seed.id),
    baselineState,
    interventions:conditions.slice(1).map(c=>({id:c.id,changedFactors:c.changedFactors,state:c.state})),
    observations:arr(cfg.observations).map(text).filter(Boolean),
    expected:clone(arr(cfg.expected)),
    stopConditions:arr(cfg.stopConditions??cfg.stop_conditions).map(text).filter(Boolean)
  };
  return {
    schema:'conscience64.hypothesis-discriminator/v1',
    id:stableId('discriminator',payload),
    hypothesisId:String(seed.id),
    baseline:{id:'baseline',state:clone(baselineState)},
    conditions,
    observations:payload.observations,
    expected:payload.expected,
    stopConditions:payload.stopConditions,
    executionStatus:'not-executed',
    authority:'plan-only',
    boundaries:[...HYPOTHESIS_BOUNDARIES]
  };
}

function compare(actual,relation,expected){
  switch(String(relation)){
    case 'eq':return deepEqual(actual,expected);
    case 'neq':return !deepEqual(actual,expected);
    case 'gt':return typeof actual==='number'&&typeof expected==='number'&&actual>expected;
    case 'gte':return typeof actual==='number'&&typeof expected==='number'&&actual>=expected;
    case 'lt':return typeof actual==='number'&&typeof expected==='number'&&actual<expected;
    case 'lte':return typeof actual==='number'&&typeof expected==='number'&&actual<=expected;
    default:throw new Error(`unsupported expected relation: ${relation}`);
  }
}

export function evaluateDiscriminator(plan,observations={}){
  const conditions=new Set(arr(plan?.conditions).map(c=>String(c?.id)));
  const observed=object(observations);
  const unknown=Object.keys(observed).filter(id=>!conditions.has(id));
  if(unknown.length){
    return {
      schema:'conscience64.hypothesis-evaluation/v1',
      planId:String(plan?.id??''),
      status:'INVALID_TEST',
      unknownConditionIds:unknown.sort(),
      checks:[],
      boundaries:[...HYPOTHESIS_BOUNDARIES]
    };
  }
  const expected=arr(plan?.expected);
  if(!expected.length){
    return {
      schema:'conscience64.hypothesis-evaluation/v1',
      planId:String(plan?.id??''),
      status:'INCONCLUSIVE',
      reason:'no explicit expected observations',
      checks:[],
      boundaries:[...HYPOTHESIS_BOUNDARIES]
    };
  }
  const checks=[];
  let missing=false,failed=false;
  for(const raw of expected){
    const e=object(raw);
    const conditionId=String(e.conditionId??e.condition_id??'');
    const field=String(e.field??'');
    if(!conditions.has(conditionId)){
      return {
        schema:'conscience64.hypothesis-evaluation/v1',
        planId:String(plan?.id??''),
        status:'INVALID_TEST',
        reason:`expectation references unknown condition ${conditionId}`,
        checks,
        boundaries:[...HYPOTHESIS_BOUNDARIES]
      };
    }
    if(!Object.prototype.hasOwnProperty.call(observed,conditionId)||!Object.prototype.hasOwnProperty.call(object(observed[conditionId]),field)){
      missing=true;
      checks.push({conditionId,field,status:'MISSING'});
      continue;
    }
    const actual=object(observed[conditionId])[field];
    const pass=compare(actual,e.relation,e.value);
    if(!pass)failed=true;
    checks.push({conditionId,field,relation:String(e.relation),expected:clone(e.value),actual:clone(actual),status:pass?'PASS':'FAIL'});
  }
  const status=failed?'CONTRADICTED_IN_TEST':(missing?'INCONCLUSIVE':'SUPPORTED_IN_TEST');
  return {
    schema:'conscience64.hypothesis-evaluation/v1',
    planId:String(plan?.id??''),
    hypothesisId:String(plan?.hypothesisId??''),
    status,
    checks,
    boundaries:[...HYPOTHESIS_BOUNDARIES]
  };
}

export function repairHypothesis(seed,revision={}){
  if(!seed?.id)throw new Error('predecessor hypothesis seed with id is required');
  const cfg=object(revision);
  const changes=object(cfg.changes);
  if(Object.prototype.hasOwnProperty.call(changes,'intuition'))throw new Error('repair cannot rewrite the original intuition');
  const protectedFields=new Set(['id','schema','predecessorId','epistemicStatus','authority','boundaries','provenance']);
  for(const key of Object.keys(changes))if(protectedFields.has(key))throw new Error(`repair cannot directly change protected field ${key}`);
  assertNonEmpty(cfg.revisionReason??cfg.revision_reason,'revisionReason');
  const successor={...clone(seed)};
  for(const [key,value] of Object.entries(changes))successor[key]=clone(value);
  const changedFields=Object.keys(changes).sort();
  const identityPayload={
    predecessorId:String(seed.id),
    revisionReason:String(cfg.revisionReason??cfg.revision_reason),
    changes:canonicalize(changes),
    evaluationRef:cfg.evaluationRef??cfg.evaluation_ref??null
  };
  successor.schema='conscience64.hypothesis-seed/v1';
  successor.id=stableId('hypothesis',identityPayload);
  successor.predecessorId=String(seed.id);
  successor.revisionReason=identityPayload.revisionReason;
  successor.evaluationRef=identityPayload.evaluationRef;
  successor.changedFields=changedFields;
  successor.epistemicStatus='revised-hypothesis';
  successor.authority='none';
  successor.boundaries=[...HYPOTHESIS_BOUNDARIES];
  successor.intuition=seed.intuition;
  return successor;
}

export function toAlgorithmHarnessSupportManifest(plan,options={}){
  if(!plan?.id)throw new Error('discriminator plan with id is required');
  const cfg=object(options);
  const seeds=arr(cfg.seeds).map(Number);
  if(seeds.some(v=>!Number.isInteger(v)))throw new Error('seeds must be integers');
  return {
    schema:'conscience64.algorithm-harness-support-manifest/v1',
    sourcePlanId:String(plan.id),
    hypothesisId:String(plan.hypothesisId??''),
    authority:'support-only',
    executionStatus:'not-executed',
    conditions:arr(plan.conditions).map(c=>({
      id:String(c.id),
      changedFactors:arr(c.changedFactors).map(String),
      state:clone(object(c.state))
    })),
    observations:arr(plan.observations).map(String),
    expected:clone(arr(plan.expected)),
    stopConditions:arr(plan.stopConditions).map(String),
    seeds,
    boundaries:[...HYPOTHESIS_BOUNDARIES]
  };
}
