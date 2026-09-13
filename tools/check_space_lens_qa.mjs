#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const html=await readFile(resolve(root,'index.html'),'utf8');
assert.match(html,/<script\b[^>]*src="\.\/space-lens-memory\.js"[^>]*><\/script>/,'Space Lens memory script is not wired into index.html');
assert.match(html,/<script\b[^>]*src="\.\/space-lens-qa\.js"[^>]*><\/script>/,'Space Lens QA script is not wired into index.html');
assert.match(html,/Technical I \/ R \/ P \/ O state/);
const registry=JSON.parse(await readFile(resolve(root,'research/projects/projects.json'),'utf8'));
const store=new Map();globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const mem=await readFile(resolve(root,'space-lens-memory.js'));await import(`data:text/javascript;base64,${mem.toString('base64')}`);

const unicodeRecord={uoid:'uoid:sha256:'+'1'.repeat(64),logicalId:'coordinate-space:unicode-crosscheck',label:'Unicode Crosscheck',objectType:'research-node',description:'Checks the coordinate runtime across Unicode scalar values and UTF-8 byte encodings so the tested representation can be compared against the source bytes.',provenance:'coordinate-space/unicode_crosscheck.py',searchScore:28};
globalThis.Conscience64API={projects:{list:()=>({projects:structuredClone(registry.projects)})},search:{simple:q=>({results:String(q).toLowerCase().includes('unicode')?[structuredClone(unicodeRecord)]:[]})},irpo:x=>structuredClone(x)};
globalThis.document={querySelector:()=>null,getElementById:()=>null};globalThis.addEventListener=()=>{};
const qa=await readFile(resolve(root,'space-lens-qa.js'));await import(`data:text/javascript;base64,${qa.toString('base64')}`);
assert.equal(globalThis.SpaceLensQA.version,'1.1.0');

const orbit=globalThis.SpaceLensQA.answer('What is Orbit Library?');
assert.match(orbit.answer,/Orbit Library:/);assert.match(orbit.answer,/navigation|history|source/i);assert.match(orbit.confidence,/strong project match|bounded project match/);assert.ok(orbit.sources.some(s=>s.id==='orbit-library'));
const recovery=globalThis.SpaceLensQA.answer('What remains unresolved in Historical Recovery?');assert.match(recovery.answer,/Fuzzball/i);assert.match(recovery.limit,/Recovery graph|missing carriers|unresolved/i);
const models=globalThis.SpaceLensQA.answer('What did model experiments teach us?');assert.match(models.answer,/Model Experiments:/);assert.match(models.answer,/negative evidence|execution correctness|predictive usefulness/i);
const moonshot=globalThis.SpaceLensQA.answer('What failed in Operator Moonshot?');assert.match(moonshot.answer,/failed replication|failed.*robustness|promising branches failed/i);
const unicode=globalThis.SpaceLensQA.answer('What does the Unicode crosscheck do?');assert.match(unicode.answer,/Unicode scalar values|UTF-8 byte encodings/i);assert.equal(unicode.sources[0].id,unicodeRecord.uoid);

const unknownQ='What is zzzqv-nonexistent-carrier-8472?';const unknown=globalThis.SpaceLensQA.answer(unknownQ);assert.equal(unknown.confidence,'unresolved');assert.match(unknown.answer,/do not have enough indexed material/i);assert.match(unknown.limit,/not proof of absence/i);assert.ok(unknown.searchWider.length>=4);assert.ok(unknown.searchWider.every(x=>/^https:\/\//.test(x.url)));

globalThis.SpaceLensMemory.teach(unknownQ,'This is a locally taught answer for regression testing.');const learned=globalThis.SpaceLensQA.answer(unknownQ);assert.equal(learned.confidence,'learned locally');assert.equal(learned.learned,true);assert.match(learned.answer,/locally taught answer/);assert.match(learned.limit,/not independently verified/i);
globalThis.SpaceLensMemory.forgetTeaching(unknownQ);

globalThis.SpaceLensMemory.learnSelection('What is Orbit Library?','orbit-library');assert.equal(globalThis.SpaceLensMemory.sourceBoost('orbit-library'),1);
for(const answer of [orbit,recovery,models,moonshot,unicode,unknown,learned]){assert.ok(answer.answer.length<900,'answer should stay concise');assert.ok(answer.limit.length>0,'every answer must carry a limit');assert.ok(Array.isArray(answer.sources),'sources must be explicit');}
console.log('PASS Space Lens QA: persistent learning, wider-search fallback, project identity, failures, unresolved remainder, and record fallback');
