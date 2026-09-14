import {createHash} from 'node:crypto';

const PLAN_SCHEMA='conscience64.visual-carrier-plan/v2';
const SEED_NAMESPACE='conscience64.visual-carrier-v2';
const SEED_DOMAINS=Object.freeze(['layout','lighting','motion','materials','crowd']);
const BOUNDARIES=Object.freeze([
  'VISUAL_CARRIER != WORLD_AUTHORITY',
  'VISUAL_INTERPRETATION != WORLD_FACT',
  'VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON'
]);

function canonicalValue(value){
  if(Array.isArray(value)) return value.map(canonicalValue);
  if(value&&typeof value==='object'){
    return Object.fromEntries(
      Object.keys(value).sort().map(key=>[key,canonicalValue(value[key])])
    );
  }
  return value;
}

function hashText(text){
  return createHash('sha256').update(text,'utf8').digest('hex');
}

function clone(value){
  return structuredClone(value);
}

function requireNonEmptyString(value,name){
  if(typeof value!=='string'||value.length===0) throw new TypeError(`${name} must be a non-empty string`);
  return value;
}

export function canonicalJson(value){
  return JSON.stringify(canonicalValue(value));
}

export function sha256Canonical(value){
  return hashText(canonicalJson(value));
}

export function carrierSeed(jobId,domain){
  requireNonEmptyString(jobId,'jobId');
  requireNonEmptyString(domain,'domain');
  return hashText(`${SEED_NAMESPACE}\0${jobId}\0${domain}`);
}

export function buildCarrierPlan(jobs,options={}){
  if(!Array.isArray(jobs)) throw new TypeError('jobs must be an array');
  const place=requireNonEmptyString(options.place,'options.place');
  const recipeId=requireNonEmptyString(options.recipeId,'options.recipeId');
  const renderer=requireNonEmptyString(options.renderer,'options.renderer');

  const orderedSource=[...jobs].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  const selected=orderedSource.filter(job=>job.place===place);
  if(selected.length!==3) throw new Error(`expected exactly 3 jobs for ${place}; found ${selected.length}`);
  if(new Set(selected.map(job=>job.id)).size!==3) throw new Error(`duplicate job IDs for ${place}`);
  if(new Set(selected.map(job=>job.perspective)).size!==3) throw new Error(`expected 3 distinct perspectives for ${place}`);

  const rows=selected.map(job=>({
    id:job.id,
    sourceJobSha256:sha256Canonical(job),
    sceneEntity:job.sceneEntity,
    cameraEntity:job.cameraEntity,
    place:job.place,
    context:job.context,
    perspective:job.perspective,
    camera:clone(job.camera),
    durationSec:job.durationSec,
    fps:job.fps,
    resolution:clone(job.resolution),
    format:job.format,
    authority:job.authority,
    boundary:job.boundary,
    carrier:{
      renderer,
      recipeId,
      canon:false,
      worldAuthority:false,
      seeds:Object.fromEntries(SEED_DOMAINS.map(domain=>[domain,carrierSeed(job.id,domain)]))
    }
  }));

  return {
    schema:PLAN_SCHEMA,
    sourceJobCount:jobs.length,
    sourceJobsSha256:sha256Canonical(orderedSource),
    selection:{place,recipeId,renderer},
    boundaries:[...BOUNDARIES],
    jobs:rows
  };
}

export function sealCarrierPlan(plan){
  if(!plan||typeof plan!=='object'||Array.isArray(plan)) throw new TypeError('plan must be an object');
  const payload=clone(plan);
  return {
    ...payload,
    seal:{
      algorithm:'sha256',
      canonicalPayloadSha256:sha256Canonical(payload)
    }
  };
}
