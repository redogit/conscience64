import assert from 'node:assert/strict';
await import('./voice-reference.js');
const descriptor={format:'musilanguage-private-voice/v1',label:'Test own voice',reference:{kind:'private-library',libraryFileId:'libfile_test',backingFileId:'file_test'},consent:{subject:'self',scope:'private-generated-vocals',externalUpload:false,recordedAt:'2026-10-21',provenance:'Synthetic test consent'}};
const a=MusilanguageVoice.create(),b=MusilanguageVoice.create();
assert.equal(a.state().status,'instrumental');
a.setEnabled(true);assert.equal(a.state().status,'reference-required');
a.register(descriptor);assert.equal(a.state().status,'pending-renderer');
assert.equal(a.state().rendererAvailable,false);assert.equal(a.state().audioAvailable,false);
assert.equal(b.state().hasProfile,false);
assert.ok(!JSON.stringify(a.state()).includes('libfile_test'));
descriptor.label='Changed outside';assert.equal(a.state().label,'Test own voice');
a.select('none');assert.equal(a.state().status,'reference-required');
a.select('default');assert.equal(a.state().status,'pending-renderer');
a.setEnabled(false);assert.equal(a.state().status,'instrumental');
for(const field of ['subject','scope','externalUpload','recordedAt','provenance']){
 const bad=structuredClone(descriptor);delete bad.consent[field];assert.throws(()=>a.register(bad));assert.equal(a.state().label,'Test own voice');
}
assert.throws(()=>a.setEnabled('yes'));assert.throws(()=>a.select('unknown'));
a.clear();assert.equal(a.state().hasProfile,false);assert.equal(a.state().status,'instrumental');
console.log('PASS: private policy, consent validation, selection, defaults, isolation, revocation, truthful renderer state');
