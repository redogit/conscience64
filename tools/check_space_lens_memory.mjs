#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const store=new Map();
globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const code=await readFile(resolve(root,'space-lens-memory.js'));
await import(`data:text/javascript;base64,${code.toString('base64')}`);
const m=globalThis.SpaceLensMemory;
assert.equal(m.schema,'conscience64/space-lens-memory/v1');
assert.equal(m.stats().queries,0);

m.record('What is Orbit Library?',{answer:'Orbit is a bounded navigation layer.',confidence:'bounded project match',sources:[{id:'orbit-library'}]});
m.feedback('What is Orbit Library?','helpful');
assert.equal(m.stats().queries,1);
assert.equal(m.recall('What is Orbit Library?').kind,'helpful-history');

m.learnSelection('What is Orbit Library?','orbit-library');
m.learnSelection('What is Orbit Library?','orbit-library');
assert.equal(m.sourceBoost('orbit-library'),2);

m.teach('What is Fuzzball?','Fuzzball is a locally taught placeholder answer.');
const taught=m.recall('What is Fuzzball?');
assert.equal(taught.kind,'teaching');
assert.match(taught.answer,/locally taught placeholder/);
assert.equal(m.stats().teachings,1);

m.rememberAlias('old library','orbit-library');
assert.equal(m.aliasFor('Old Library'),'orbit-library');
assert.ok(m.expand('What is Orbit Library?').length>=0);

const exported=m.exportText();
assert.match(exported,/conscience64\/space-lens-memory\/v1/);
m.clear();
assert.equal(m.stats().queries,0);
assert.equal(m.stats().teachings,0);
m.importText(exported);
assert.equal(m.stats().queries,1);
assert.equal(m.stats().teachings,1);
assert.equal(m.sourceBoost('orbit-library'),2);

m.forgetTeaching('What is Fuzzball?');
assert.equal(m.recall('What is Fuzzball?'),null);

// Issue #160 RED: a marked private-history method-only teaching must retain
// a non-identifying boundary, propagate that boundary into recalled/history
// state, and fail closed on outward export until independently re-grounded.
m.clear();
const privateOrigin={
  classification:'private-history-method-only',
  source:'private-history:withheld',
  independentlyRegrounded:false,
  requiresIndependentRegrounding:true,
  publicationAllowed:false,
  claimCeiling:'abstract method only; no source or identity claim'
};
m.teach(
  'How should a bounded private method be carried?',
  'ABSTRACT_METHOD_CANARY',
  '',
  {privacyOrigin:privateOrigin}
);
const privateTeaching=m.recall('How should a bounded private method be carried?');
assert.deepEqual(privateTeaching.privacyOrigin,privateOrigin);
m.record('How should a bounded private method be carried?',{
  answer:'ABSTRACT_METHOD_CANARY',
  confidence:'learned locally',
  sources:[]
});
const persisted=JSON.parse(store.get('conscience64.spaceLensMemory.v1'));
const privateKey=m.normalize('How should a bounded private method be carried?');
assert.deepEqual(persisted.teachings[privateKey].privacyOrigin,privateOrigin);
assert.deepEqual(persisted.queries[privateKey].privacyOrigin,privateOrigin);
assert.throws(
  ()=>m.exportText(),
  /private-origin memory requires independent re-grounding before export/i
);

// Marker laundering must fail closed rather than weakening the fixed boundary.
assert.throws(
  ()=>m.teach(
    'Malformed private method',
    'ABSTRACT_METHOD_CANARY',
    '',
    {privacyOrigin:{...privateOrigin,publicationAllowed:true}}
  ),
  /private-method privacy origin/i
);

const malformed=structuredClone(persisted);
malformed.teachings[privateKey].privacyOrigin={...privateOrigin,source:'private-history:raw-source'};
m.clear();
assert.throws(
  ()=>m.importText(JSON.stringify(malformed)),
  /private-method privacy origin/i
);

console.log('PASS Space Lens memory: persistence, feedback, teachings, source learning, alias, export/import, clear, private-origin fail-closed boundary');
