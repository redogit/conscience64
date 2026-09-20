import assert from 'node:assert/strict';
import {
  PRIVATE_METHOD_RECOVERY_SCHEMA,
  PRIVATE_METHOD_OUTWARD_SCHEMA,
  hasRestrictedOriginMarker,
  projectPrivateMethodForInternalCarrier,
  assertPrivateOriginExportAllowed,
  makePrivateMethodRecoveryEnvelope,
  restorePrivateMethodRecoveryEnvelope,
  validatePrivateMethodRecoveryEnvelope
} from './private-origin-boundary.mjs';

const method='Compare alternatives with one independent counter-probe and preserve the unresolved remainder.';
const envelope=makePrivateMethodRecoveryEnvelope(method);
assert.equal(envelope.schema,PRIVATE_METHOD_RECOVERY_SCHEMA);
assert.equal(envelope.method,method);
assert.equal(envelope.source,'private-history:withheld');
assert.equal(envelope.visibility,'restricted');
assert.equal(envelope.publication_allowed,false);
assert.equal(envelope.requires_independent_regrounding,true);
assert.equal(hasRestrictedOriginMarker(envelope),true);

const encoded=JSON.stringify(envelope);
const restored=restorePrivateMethodRecoveryEnvelope(encoded);
assert.equal(restored.method,method);
assert.equal(restored.source,'private-history:withheld');
assert.equal(restored.publication_allowed,false);
assert.equal(restored.privacy_origin.classification,'private-history-method-only');
assert.ok(restored.boundaries.includes('RECOVERY != SOURCE RESTORATION'));

for(const [field,value,pattern] of [
  ['source','PRIVATE_SOURCE_CANARY_A1',/withheld/],
  ['visibility','public',/restricted/],
  ['publication_allowed',true,/gate changed/],
  ['requires_independent_regrounding',false,/gate changed/],
  ['claim_ceiling','verified fact',/claim ceiling/]
]){
  const changed=structuredClone(envelope);
  changed[field]=value;
  assert.throws(()=>validatePrivateMethodRecoveryEnvelope(changed),pattern);
}

const injected=structuredClone(envelope);
injected.private_story='PRIVATE_STORY_CANARY_A2';
assert.throws(()=>validatePrivateMethodRecoveryEnvelope(injected),/fields/);

const originChanged=structuredClone(envelope);
originChanged.privacy_origin.independently_regrounded=true;
assert.throws(()=>validatePrivateMethodRecoveryEnvelope(originChanged),/origin/);

const boundaryChanged=structuredClone(envelope);
boundaryChanged.boundaries=['PRIVATE METHOD MAY INFORM SOLVING'];
assert.throws(()=>validatePrivateMethodRecoveryEnvelope(boundaryChanged),/boundaries/);

assert.throws(()=>restorePrivateMethodRecoveryEnvelope(JSON.stringify(injected)),/fields/);
assert.throws(()=>makePrivateMethodRecoveryEnvelope('   '),/method/);

const ecsProjection=projectPrivateMethodForInternalCarrier(envelope,'ecs-client');
assert.equal(ecsProjection.schema,PRIVATE_METHOD_OUTWARD_SCHEMA);
assert.equal(ecsProjection.carrier,'ecs-client');
assert.equal(ecsProjection.method,method);
assert.equal(ecsProjection.authority,'method-only');
assert.equal(ecsProjection.publication_allowed,false);
assert.equal(ecsProjection.requires_independent_regrounding,true);
assert.ok(!Object.hasOwn(ecsProjection,'source'));
assert.ok(!Object.hasOwn(ecsProjection,'private_story'));

const handoffProjection=projectPrivateMethodForInternalCarrier(envelope,'agent-tool-handoff');
assert.equal(handoffProjection.carrier,'agent-tool-handoff');
assert.deepEqual(handoffProjection.privacy_origin,ecsProjection.privacy_origin);
assert.throws(()=>projectPrivateMethodForInternalCarrier(envelope,'public-export'),/unsupported/);

assert.throws(()=>assertPrivateOriginExportAllowed(ecsProjection),/blocked until independent re-grounding/);
assert.throws(()=>assertPrivateOriginExportAllowed(handoffProjection),/blocked until independent re-grounding/);
assert.throws(
  ()=>assertPrivateOriginExportAllowed({summary:'renamed safe summary',payload:{renamed_method:handoffProjection}}),
  /blocked until independent re-grounding/
);
assert.equal(assertPrivateOriginExportAllowed({kind:'public',publication_allowed:true}).kind,'public');

console.log('PASS private-method recovery: rule + abstract method round-trip; source/story injection, publication promotion, false regrounding, and boundary weakening rejected.');
