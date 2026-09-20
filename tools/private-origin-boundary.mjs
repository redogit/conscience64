export const PRIVATE_ORIGIN_BOUNDARIES=Object.freeze([
  'PRIVATE METHOD MAY INFORM SOLVING',
  'PRIVATE SOURCE MUST NOT PROPAGATE',
  'PRIVATE_ORIGIN != SEARCHABLE_CORPUS',
  'PRIVATE_ORIGIN != SEARCHABLE_GRAPH'
]);

export function hasRestrictedOriginMarker(value){
  if(!value||typeof value!=='object')return false;
  if(value.derived_from_private_history===true)return true;
  const origin=value.privacy_origin??value.privacyOrigin;
  return Boolean(
    origin
    && typeof origin==='object'
    && !Array.isArray(origin)
    && origin.classification==='private-history-method-only'
  );
}


export const PRIVATE_METHOD_RECOVERY_SCHEMA='conscience64.private-method-recovery/v1';
const PRIVATE_METHOD_RECOVERY_KEYS=Object.freeze([
  'schema','kind','method','source','visibility','privacy_origin',
  'claim_ceiling','requires_independent_regrounding','publication_allowed','boundaries'
]);
const PRIVATE_METHOD_RECOVERY_BOUNDARIES=Object.freeze([
  'PRIVATE METHOD MAY INFORM SOLVING',
  'PRIVATE SOURCE MUST NOT PROPAGATE',
  'RECOVERY != SOURCE RESTORATION',
  'METHOD CARRIER != PROJECT EVIDENCE'
]);

const exactKeys=(value,keys)=>{
  const actual=Object.keys(value).sort().join('|');
  const expected=[...keys].sort().join('|');
  if(actual!==expected)throw new Error('invalid private-method recovery fields');
};

export function validatePrivateMethodRecoveryEnvelope(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('invalid private-method recovery envelope');
  exactKeys(value,PRIVATE_METHOD_RECOVERY_KEYS);
  if(value.schema!==PRIVATE_METHOD_RECOVERY_SCHEMA)throw new Error('invalid private-method recovery schema');
  if(value.kind!=='METHOD')throw new Error('private-method recovery requires METHOD');
  if(typeof value.method!=='string'||!value.method.trim()||value.method.length>20000)throw new Error('invalid private-method recovery method');
  if(value.source!=='private-history:withheld')throw new Error('private-method recovery source must remain withheld');
  if(value.visibility!=='restricted')throw new Error('private-method recovery must remain restricted');
  if(!value.privacy_origin||typeof value.privacy_origin!=='object'||Array.isArray(value.privacy_origin))throw new Error('invalid private-method recovery origin');
  exactKeys(value.privacy_origin,['classification','independently_regrounded']);
  if(value.privacy_origin.classification!=='private-history-method-only'||value.privacy_origin.independently_regrounded!==false)throw new Error('invalid private-method recovery origin');
  if(value.claim_ceiling!=='abstract method only; no source or identity claim')throw new Error('invalid private-method recovery claim ceiling');
  if(value.requires_independent_regrounding!==true||value.publication_allowed!==false)throw new Error('private-method recovery gate changed');
  if(!Array.isArray(value.boundaries)||JSON.stringify(value.boundaries)!==JSON.stringify(PRIVATE_METHOD_RECOVERY_BOUNDARIES))throw new Error('private-method recovery boundaries changed');
  return value;
}

export function makePrivateMethodRecoveryEnvelope(method){
  return validatePrivateMethodRecoveryEnvelope({
    schema:PRIVATE_METHOD_RECOVERY_SCHEMA,
    kind:'METHOD',
    method:String(method??'').trim(),
    source:'private-history:withheld',
    visibility:'restricted',
    privacy_origin:{classification:'private-history-method-only',independently_regrounded:false},
    claim_ceiling:'abstract method only; no source or identity claim',
    requires_independent_regrounding:true,
    publication_allowed:false,
    boundaries:[...PRIVATE_METHOD_RECOVERY_BOUNDARIES]
  });
}

export function restorePrivateMethodRecoveryEnvelope(raw){
  const value=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);
  validatePrivateMethodRecoveryEnvelope(value);
  return {
    method:value.method,
    privacy_origin:structuredClone(value.privacy_origin),
    source:value.source,
    visibility:value.visibility,
    claim_ceiling:value.claim_ceiling,
    requires_independent_regrounding:value.requires_independent_regrounding,
    publication_allowed:value.publication_allowed,
    boundaries:[...value.boundaries]
  };
}


export const PRIVATE_METHOD_OUTWARD_SCHEMA='conscience64.private-method-outward/v1';
const INTERNAL_PRIVATE_METHOD_CARRIERS=new Set(['ecs-client','agent-tool-handoff']);

export function projectPrivateMethodForInternalCarrier(envelope,carrier){
  validatePrivateMethodRecoveryEnvelope(envelope);
  if(!INTERNAL_PRIVATE_METHOD_CARRIERS.has(carrier))throw new Error('unsupported private-method internal carrier');
  return {
    schema:PRIVATE_METHOD_OUTWARD_SCHEMA,
    carrier,
    kind:'METHOD',
    method:envelope.method,
    privacy_origin:{classification:'private-history-method-only',independently_regrounded:false},
    claim_ceiling:envelope.claim_ceiling,
    requires_independent_regrounding:true,
    authority:'method-only',
    publication_allowed:false
  };
}

export function assertPrivateOriginExportAllowed(value){
  if(hasRestrictedOriginMarker(value))throw new Error('private-origin export blocked until independent re-grounding');
  if(value&&typeof value==='object'&&value.publication_allowed===false&&value.requires_independent_regrounding===true)throw new Error('private-origin export blocked until independent re-grounding');
  return value;
}
