#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const html=await readFile(resolve(root,'index.html'),'utf8');
assert.match(html,/space-lens-external-gate\.js/,'external search gate is not wired into index.html');

const store=new Map();
globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let externalCalls=0;
globalThis.SpaceLensLocalSearch={search:q=>({results:[
  {title:'Accessible research interface',type:'project',authority:'PROJECT_RECORD',snippet:'human interface accessibility research goal evidence',provenance:'research/projects/interface.md'},
  {title:'Evidence recovery map',type:'record',authority:'PUBLIC_RECORD',snippet:'provenance recovery source history accessible',provenance:'research/history/map.md'},
  {title:'Fast browser tool',type:'record',authority:'PUBLIC_RECORD',snippet:'browser local practical tool performance',provenance:'tools/browser.js'}
]})};
globalThis.SpaceLensWebSearch={search:async(query,{providers}={})=>{externalCalls++;return{query,providers,total:4,searchedAt:'2026-09-13T20:00:00Z',errors:[],results:[
  {provider:'Wikipedia',title:'Accessible research software',snippet:'practical accessible research interface',url:'https://example.test/a'},
  {provider:'OpenAlex',title:'Research interface evidence',snippet:'accessible evidence practical evaluation',url:'https://example.test/b'},
  {provider:'GitHub',title:'Unrelated game engine',snippet:'game graphics entertainment',url:'https://example.test/c'},
  {provider:'Internet Archive',title:'Old inaccessible interface',snippet:'legacy inaccessible research interface',url:'https://example.test/d'}
]};}};
globalThis.SpaceLensMemory={teach:()=>{}};

const code=await readFile(resolve(root,'space-lens-external-gate.js'));
await import(`data:text/javascript;base64,${code.toString('base64')}`);
const g=globalThis.SpaceLensExternalGate;
assert.equal(g.version,'1.0.1');

assert.equal(g.assess({confidence:'strong project match',sources:[{}]}).needed,false);
assert.equal(g.assess({confidence:'unresolved',sources:[]}).needed,true);
assert.equal(g.assess({confidence:'weak record match',sources:[{}]}).needed,true);
assert.equal(g.assess({confidence:'strong project match',sources:[{}],explicit:true}).needed,true);

const near=g.nearby('research interface');
assert.equal(externalCalls,0,'nearby attribute discovery must stay local');
assert.ok(near.suggestions.length>0);
assert.ok(near.suggestions.some(x=>x.attribute==='accessibility'||x.attribute==='accessible'||x.attribute==='evidence'));

const pattern=g.putPattern('research interface',{goal:'choose a practical implementation',must:['accessible'],prefer:['evidence','practical'],avoid:['game'],providers:['wikipedia','openalex','github']});
assert.equal(externalCalls,0,'saving a goal pattern must not search externally');
assert.equal(g.getPattern('research interface').goal,'choose a practical implementation');
const composed=g.compose('research interface',pattern);
assert.match(composed,/research interface/);
assert.match(composed,/practical implementation/);
assert.match(composed,/accessible/);

const refined=g.refineResults(await globalThis.SpaceLensWebSearch.search('x').then(x=>x.results),pattern);
externalCalls=0;
assert.equal(refined.length,2,'must and avoid attributes should filter the result set');
assert.ok(refined.every(x=>/\baccessible\b/i.test(`${x.title} ${x.snippet}`)));
assert.ok(refined.every(x=>!/\bgame\b/i.test(`${x.title} ${x.snippet}`)));

const out=await g.run('research interface',pattern);
assert.equal(externalCalls,1,'external search should happen only on explicit run');
assert.match(out.externalQuery,/accessible/);
assert.equal(out.total,2);
assert.deepEqual(out.pattern.providers,['wikipedia','openalex','github']);

console.log('PASS External Search Gate: real-need assessment, local attribute suggestions, user goal pattern, no premature external query, exact goal matching, refined external results');
