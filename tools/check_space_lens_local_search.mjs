#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const records=[
  {uoid:'uoid:sha256:'+'1'.repeat(64),logicalId:'coordinate-space:unicode-crosscheck',label:'Unicode Crosscheck',objectType:'research-node',description:'Checks Unicode scalar values against UTF-8 byte encodings and source bytes.',provenance:'coordinate-space/unicode_crosscheck.py',domain:'encoding'},
  {uoid:'uoid:sha256:'+'2'.repeat(64),logicalId:'orbit:history-index',label:'Orbit History Index',objectType:'research-node',description:'Exact historical navigation record for Orbit Library recovery and source lineage.',provenance:'orbit-history.json',domain:'knowledge'},
  {uoid:'uoid:sha256:'+'3'.repeat(64),logicalId:'model:negative-evidence',label:'Model Negative Evidence',objectType:'research-node',description:'Preserves regressions, failed baselines, and negative evidence from model experiments.',provenance:'model-ledger.json',domain:'models'}
];
const projects=[
  {id:'orbit-library',name:'Orbit Library',status:'ACTIVE',path:'research/projects/orbit-library.md',I:'Compact navigation surface.',R:'Navigation is not exhaustive history.',P:'Preserve source identity.',O:'Orbit keeps recoverable history.',highlight:'Exact-source boundaries became explicit.',lowlight:'Some predecessor identities were omitted.',claimCeiling:'Navigation infrastructure only.',checks:{assumption:'Bounded active context helps.',test:'Root-edge recovery tests.',unknown:'Broader indexing threshold remains unresolved.'}},
  {id:'historical-recovery',name:'Historical Recovery',status:'ACTIVE',path:'research/projects/historical-recovery.md',I:'Old code and archives.',R:'Index miss is not absence.',P:'Follow exact provenance.',O:'Several predecessor identities recovered.',highlight:'Source-native archaeology works.',lowlight:'Fuzzball remains unresolved.',claimCeiling:'Recovery graph only.',checks:{assumption:'Attested projects are valid targets.',test:'Exact source and hashes.',unknown:'Some carriers remain missing.'}}
];
let taught={'what is moonfish':{question:'What is MoonFish?',answer:'MoonFish is a locally taught example kept only in browser memory.',note:'test teaching'}};
const sourceVotes={'orbit-library':3};
globalThis.SpaceLensMemory={
  exportText:()=>JSON.stringify({schema:'conscience64/space-lens-memory/v1',queries:{},teachings:taught,aliases:{},sourceVotes,selections:[]}),
  sourceBoost:id=>sourceVotes[id]||0,
  record:()=>{},
  learnSelection:(q,id)=>{sourceVotes[id]=(sourceVotes[id]||0)+1;}
};
let lastIrpo=null;
globalThis.Conscience64API={
  all:()=>structuredClone(records),
  get:id=>structuredClone(records.find(r=>r.uoid===id||r.logicalId===id)||null),
  projects:{list:()=>({projects:structuredClone(projects)}),reflow:id=>({projectId:id})},
  irpo:x=>{lastIrpo=structuredClone(x);return lastIrpo;}
};

const code=await readFile(resolve(root,'space-lens-local-search.js'));
await import(`data:text/javascript;base64,${code.toString('base64')}`);
const s=globalThis.SpaceLensLocalSearch;
assert.equal(s.version,'1.0.1');

let stats=s.stats();
assert.equal(stats.counts.record,3);
assert.equal(stats.counts.project,2);
assert.equal(stats.counts.learned,1);
assert.equal(stats.total,6);

const orbit=s.search('orbit library');
assert.ok(orbit.total>=2);
assert.equal(orbit.results[0].type,'project');
assert.equal(orbit.results[0].refId,'orbit-library');
assert.match(orbit.results[0].snippet,/Orbit|history|navigation/i);

const unicode=s.search('unicode utf8');
assert.ok(unicode.results.some(r=>r.refId===records[0].uoid));
assert.match(unicode.results.find(r=>r.refId===records[0].uoid).snippet,/Unicode scalar values|UTF-8 byte encodings/i);

const learned=s.search('moonfish',{type:'learned'});
assert.equal(learned.total,1);
assert.equal(learned.results[0].authority,'LOCAL_USER_TAUGHT');
assert.match(learned.results[0].snippet,/locally taught example/i);

const onlyProjects=s.search('history',{type:'project'});
assert.ok(onlyProjects.results.every(r=>r.type==='project'));
const page=s.search('evidence history source',{limit:1});
assert.equal(page.results.length,1);
if(page.total>1)assert.equal(page.hasNext,true);

s.inspect(orbit.results[0],'orbit library');
assert.equal(lastIrpo.P.action,'projects.reflow');
assert.equal(lastIrpo.I,'orbit-library');
assert.ok(sourceVotes['orbit-library']>=4);

// New teaching becomes searchable after refresh without replacing public records.
taught={...taught,'new local idea':{question:'New local idea',answer:'A newly learned local-only concept.',note:''}};
s.refresh();
stats=s.stats();
assert.equal(stats.counts.learned,2);
assert.match(s.search('new local idea',{type:'learned'}).results[0].snippet,/newly learned local-only concept/i);

// Learned preference never manufactures a lexical match.
assert.equal(s.search('zzzz-no-local-match-999').total,0);
console.log('PASS Space Lens local search: ranking, filters, snippets, pagination, learned memory, refresh, inspect, and no fabricated matches');
