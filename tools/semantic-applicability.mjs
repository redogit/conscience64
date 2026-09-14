export const APPLICABILITY_SCHEMA='conscience64.semantic-applicability/v1';
export const APPLICABILITY_BOUNDARIES=Object.freeze([
  'HELPER_CANDIDATE != APPLICABLE_HELPER',
  'APPLICABLE_FOR_BOUNDED_TEST != VERIFIED',
  'OPERATOR_PROPOSAL != ADMISSION',
  'SEMANTIC_SCORE != APPLICABILITY',
  'MISSING_CONTRACT != IMPLIED_PERMISSION',
  'RELATED != SUPPORTS'
]);

const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);
const uniq=xs=>[...new Set(xs)];
const norm=v=>String(v??'').normalize('NFKC').trim().toLowerCase().replace(/[_\s]+/g,'-');
const normList=v=>uniq(arr(v).flatMap(x=>arr(x)).map(norm).filter(Boolean)).sort();
const finite=v=>Number.isFinite(Number(v))?Number(v):null;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

function firstDefined(source,keys){
  for(const key of keys)if(hasOwn(source,key)&&source[key]!=null)return source[key];
  return undefined;
}
function valuesFrom(source,keys){
  return normList(keys.flatMap(key=>hasOwn(source,key)?arr(source[key]):[]));
}
function setDiff(required,available){
  const have=new Set(available);return required.filter(x=>!have.has(x));
}
function intersect(a,b){
  const bs=new Set(b);return a.filter(x=>bs.has(x));
}

export function situationApplicabilityContract(situation={}){
  const s=object(situation);
  const requiredCapabilities=valuesFrom(s,['requiredCapabilities','required_capabilities','capabilitiesRequired']);
  const obligations=valuesFrom(s,['obligationIds','obligation_ids','obligations']);
  const availableCarriers=valuesFrom(s,['availableCarriers','available_carriers','carriers']);
  const requiredEvidenceKinds=valuesFrom(s,['requiredEvidenceKinds','required_evidence_kinds','evidenceKinds']);
  const allowedAuthorities=valuesFrom(s,['allowedAuthorities','allowed_authorities']);
  const forbiddenAuthorities=valuesFrom(s,['forbiddenAuthorities','forbidden_authorities']);
  const allowedScopes=valuesFrom(s,['allowedScopes','allowed_scopes']);
  const forbiddenScopes=valuesFrom(s,['forbiddenScopes','forbidden_scopes']);
  const maxCostRaw=firstDefined(s,['maxCost','max_cost','costCeiling','cost_ceiling']);
  const accessibilityRequired=Boolean(firstDefined(s,['accessibilityRequired','accessibility_required']));
  const privacyRequired=Boolean(firstDefined(s,['privacyRequired','privacy_required']));
  return {
    requiredCapabilities,obligations,availableCarriers,requiredEvidenceKinds,
    allowedAuthorities,forbiddenAuthorities,allowedScopes,forbiddenScopes,
    maxCost:finite(maxCostRaw),accessibilityRequired,privacyRequired
  };
}

export function helperApplicabilityContract(helper={}){
  const h=object(helper);
  const nested=object(h.operatorContract??h.operator_contract??h.contract);
  const merged={...h,...nested};
  const capabilities=valuesFrom(merged,['capabilities','skills','methods']);
  const preserves=valuesFrom(merged,['preserves','preservedObligations','preserved_obligations','obligations']);
  const requiredCarriers=valuesFrom(merged,['requiredCarriers','required_carriers','carriers']);
  const evidenceKinds=valuesFrom(merged,['evidenceKinds','evidence_kinds','evidenceCapabilities','evidence_capabilities']);
  const authorities=valuesFrom(merged,['authorities','authority']);
  const scopes=valuesFrom(merged,['scopes','scope']);
  const costRaw=firstDefined(merged,['cost','estimatedCost','estimated_cost','lifecycleCost','lifecycle_cost']);
  const accessibilityRaw=firstDefined(merged,['accessibility','accessibilityStatus','accessibility_status']);
  const privacyRaw=firstDefined(merged,['privacy','privacyStatus','privacy_status']);
  return {
    capabilities,preserves,requiredCarriers,evidenceKinds,authorities,scopes,
    cost:finite(costRaw),
    accessibility:accessibilityRaw==null?null:norm(accessibilityRaw),
    privacy:privacyRaw==null?null:norm(privacyRaw),
    contractPresent:Object.keys(nested).length>0||[
      'capabilities','skills','methods','preserves','preservedObligations','preserved_obligations',
      'requiredCarriers','required_carriers','carriers','authorities','authority','scopes','scope',
      'cost','estimatedCost','estimated_cost','lifecycleCost','lifecycle_cost',
      'accessibility','accessibilityStatus','accessibility_status','privacy','privacyStatus','privacy_status'
    ].some(k=>hasOwn(h,k))
  };
}

function checkList({name,required,available,missingMeansUnresolved=true}){
  if(!required.length)return {name,status:'NOT_REQUIRED',required,available,missing:[]};
  if(!available.length&&missingMeansUnresolved)return {name,status:'UNRESOLVED',required,available,missing:[...required]};
  const missing=setDiff(required,available);
  return {name,status:missing.length?'BLOCKED':'PASS',required,available,missing};
}

function checkAllowed({name,declared,allowed}){
  if(!allowed.length)return {name,status:'NOT_REQUIRED',declared,allowed,disallowed:[]};
  if(!declared.length)return {name,status:'UNRESOLVED',declared,allowed,disallowed:[]};
  const disallowed=declared.filter(x=>!allowed.includes(x));
  return {name,status:disallowed.length?'BLOCKED':'PASS',declared,allowed,disallowed};
}

function checkForbidden({name,declared,forbidden}){
  if(!forbidden.length)return {name,status:'NOT_REQUIRED',declared,forbidden,conflicts:[]};
  if(!declared.length)return {name,status:'UNRESOLVED',declared,forbidden,conflicts:[]};
  const conflicts=intersect(declared,forbidden);
  return {name,status:conflicts.length?'BLOCKED':'PASS',declared,forbidden,conflicts};
}

function checkBooleanRequirement(name,required,declared){
  if(!required)return {name,status:'NOT_REQUIRED',required:false,declared};
  if(declared==null)return {name,status:'UNRESOLVED',required:true,declared:null};
  const pass=['pass','passed','verified','supported','declared','yes','true','accessible','private','protected','bounded'].includes(declared);
  const fail=['fail','failed','no','false','inaccessible','public-only','unsafe'].includes(declared);
  return {name,status:pass?'PASS':(fail?'BLOCKED':'UNRESOLVED'),required:true,declared};
}

export function evaluateHelperApplicability(situation,helper,options={}){
  const s=situationApplicabilityContract(situation);
  const h=helperApplicabilityContract(helper);
  const checks=[];

  if(!h.contractPresent){
    checks.push({name:'operator-contract',status:'UNRESOLVED',reason:'no explicit applicability contract'});
  } else {
    checks.push({name:'operator-contract',status:'PASS',reason:'explicit contract fields present'});
  }

  checks.push(checkList({name:'capabilities',required:s.requiredCapabilities,available:h.capabilities}));
  checks.push(checkList({name:'obligation-preservation',required:s.obligations,available:h.preserves}));

  if(h.requiredCarriers.length){
    if(!s.availableCarriers.length){
      checks.push({name:'carrier-availability',status:'UNRESOLVED',required:h.requiredCarriers,available:[],missing:[...h.requiredCarriers]});
    } else {
      checks.push(checkList({name:'carrier-availability',required:h.requiredCarriers,available:s.availableCarriers,missingMeansUnresolved:false}));
    }
  } else checks.push({name:'carrier-availability',status:'NOT_REQUIRED',required:[],available:s.availableCarriers,missing:[]});

  checks.push(checkList({name:'evidence-kind',required:s.requiredEvidenceKinds,available:h.evidenceKinds}));
  checks.push(checkAllowed({name:'authority-allowlist',declared:h.authorities,allowed:s.allowedAuthorities}));
  checks.push(checkForbidden({name:'authority-denylist',declared:h.authorities,forbidden:s.forbiddenAuthorities}));
  checks.push(checkAllowed({name:'scope-allowlist',declared:h.scopes,allowed:s.allowedScopes}));
  checks.push(checkForbidden({name:'scope-denylist',declared:h.scopes,forbidden:s.forbiddenScopes}));

  if(s.maxCost!=null){
    checks.push(h.cost==null
      ?{name:'cost-ceiling',status:'UNRESOLVED',maxCost:s.maxCost,cost:null}
      :{name:'cost-ceiling',status:h.cost<=s.maxCost?'PASS':'BLOCKED',maxCost:s.maxCost,cost:h.cost});
  } else checks.push({name:'cost-ceiling',status:'NOT_REQUIRED',maxCost:null,cost:h.cost});

  checks.push(checkBooleanRequirement('accessibility',s.accessibilityRequired,h.accessibility));
  checks.push(checkBooleanRequirement('privacy',s.privacyRequired,h.privacy));

  const blockers=checks.filter(c=>c.status==='BLOCKED');
  const unresolved=checks.filter(c=>c.status==='UNRESOLVED');
  const requiredChecks=checks.filter(c=>c.status!=='NOT_REQUIRED');
  const passed=requiredChecks.filter(c=>c.status==='PASS').length;
  const completeness=requiredChecks.length?passed/requiredChecks.length:1;
  const status=blockers.length?'BLOCKED':(unresolved.length?'UNRESOLVED':'APPLICABLE_FOR_BOUNDED_TEST');

  return {
    schema:APPLICABILITY_SCHEMA,
    helperId:String(helper?.id??helper?.key??helper?.uid??'unknown-helper'),
    status,
    completeness:Number(completeness.toFixed(6)),
    checks,
    blockers:blockers.map(c=>c.name),
    unresolved:unresolved.map(c=>c.name),
    situationContract:s,
    helperContract:h,
    boundaries:[...APPLICABILITY_BOUNDARIES]
  };
}

function registryLookup(registry,id){
  if(registry instanceof Map)return registry.get(id)??null;
  if(Array.isArray(registry))return registry.find(r=>String(r?.id??r?.key??r?.uid)===String(id))??null;
  if(registry&&typeof registry==='object')return registry[id]??null;
  return null;
}

export function gateSemanticHelperCandidates(candidateResult,situation,registry={},options={}){
  const helpers=arr(candidateResult?.helpers??candidateResult?.matches);
  const rows=helpers.map(candidate=>{
    const declared=registryLookup(registry,candidate.id);
    const helper={...candidate,...(declared||{})};
    const assessment=evaluateHelperApplicability(situation,helper,options);
    return {
      candidate,
      contractSource:declared?'registry':'candidate-only',
      assessment
    };
  });
  const counts={
    applicable:rows.filter(r=>r.assessment.status==='APPLICABLE_FOR_BOUNDED_TEST').length,
    unresolved:rows.filter(r=>r.assessment.status==='UNRESOLVED').length,
    blocked:rows.filter(r=>r.assessment.status==='BLOCKED').length
  };
  return {
    schema:'conscience64.semantic-helper-gate/v1',
    candidateCount:rows.length,
    counts,
    rows,
    boundaries:[...APPLICABILITY_BOUNDARIES]
  };
}

export function proposeBoundedOperators(gated,situation,options={}){
  const maxProposals=Number.isInteger(options.maxProposals)?Math.max(1,options.maxProposals):8;
  const rows=arr(gated?.rows)
    .filter(row=>row?.assessment?.status==='APPLICABLE_FOR_BOUNDED_TEST')
    .sort((a,b)=>Number(b.candidate?.score||0)-Number(a.candidate?.score||0)||String(a.assessment.helperId).localeCompare(String(b.assessment.helperId)))
    .slice(0,maxProposals)
    .map((row,index)=>({
      proposalId:`operator-proposal:${index+1}:${row.assessment.helperId}`,
      helperId:row.assessment.helperId,
      semanticScore:Number(row.candidate?.score||0),
      disposition:'PROPOSE_FOR_BOUNDED_TEST',
      nextGate:'Build & Test',
      preservedChecks:row.assessment.checks.filter(c=>c.status==='PASS').map(c=>c.name),
      authority:'proposal-only',
      boundaries:['OPERATOR_PROPOSAL != ADMISSION','APPLICABLE_FOR_BOUNDED_TEST != VERIFIED','SEMANTIC_SCORE != APPLICABILITY']
    }));
  return {
    schema:'conscience64.bounded-operator-proposals/v1',
    situation:situationApplicabilityContract(situation),
    proposalCount:rows.length,
    proposals:rows,
    boundaries:[...APPLICABILITY_BOUNDARIES]
  };
}
