#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const registry=JSON.parse(await readFile(resolve(root,'research/projects/projects.json'),'utf8'));

const unicodeRecord={
  uoid:'uoid:sha256:'+'1'.repeat(64),
  logicalId:'coordinate-space:unicode-crosscheck',
  label:'Unicode Crosscheck',
  objectType:'research-node',
  description:'Checks the coordinate runtime across Unicode scalar values and UTF-8 byte encodings so the tested representation can be compared against the source bytes.',
  provenance:'coordinate-space/unicode_crosscheck.py',
  searchScore:28
};

globalThis.Conscience64API={
  projects:{list:()=>({projects:structuredClone(registry.projects)})},
  search:{simple:q=>({results:String(q).toLowerCase().includes('unicode')?[structuredClone(unicodeRecord)]:[]})},
  irpo:x=>structuredClone(x)
};
// The QA module only needs these stubs during import; the answer core is DOM-independent.
globalThis.document={querySelector:()=>null,getElementById:()=>null};
globalThis.addEventListener=()=>{};

const qa=await readFile(resolve(root,'space-lens-qa.js'));
await import(`data:text/javascript;base64,${qa.toString('base64')}`);
assert.equal(globalThis.SpaceLensQA.version,'1.0.0');

const orbit=globalThis.SpaceLensQA.answer('What is Orbit Library?');
assert.match(orbit.answer,/Orbit Library:/);
assert.match(orbit.answer,/navigation|history|source/i);
assert.match(orbit.confidence,/strong project match|bounded project match/);
assert.ok(orbit.sources.some(s=>s.id==='orbit-library'));

const recovery=globalThis.SpaceLensQA.answer('What remains unresolved in Historical Recovery?');
assert.match(recovery.answer,/Fuzzball/i);
assert.match(recovery.limit,/Recovery graph|missing carriers|unresolved/i);

const models=globalThis.SpaceLensQA.answer('What did model experiments teach us?');
assert.match(models.answer,/Model Experiments:/);
assert.match(models.answer,/negative evidence|execution correctness|predictive usefulness/i);

const moonshot=globalThis.SpaceLensQA.answer('What failed in Operator Moonshot?');
assert.match(moonshot.answer,/failed replication|failed.*robustness|promising branches failed/i);

const unicode=globalThis.SpaceLensQA.answer('What does the Unicode crosscheck do?');
assert.match(unicode.answer,/Unicode scalar values|UTF-8 byte encodings/i);
assert.equal(unicode.sources[0].id,unicodeRecord.uoid);

const unknown=globalThis.SpaceLensQA.answer('What is zzzqv-nonexistent-carrier-8472?');
assert.equal(unknown.confidence,'unresolved');
assert.match(unknown.answer,/do not have enough indexed material/i);
assert.match(unknown.limit,/not proof of absence/i);

for(const answer of [orbit,recovery,models,moonshot,unicode,unknown]){
  assert.ok(answer.answer.length<900,'answer should stay concise');
  assert.ok(answer.limit.length>0,'every answer must carry a limit');
  assert.ok(Array.isArray(answer.sources),'sources must be explicit');
}

console.log('PASS Space Lens QA: project identity, failures, unresolved remainder, record fallback, and unknown handling');
