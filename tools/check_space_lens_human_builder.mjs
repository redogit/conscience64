#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const store=new Map();
globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
globalThis.addEventListener=()=>{};

const taught=[];
globalThis.SpaceLensMemory={teach:(q,a,n)=>{taught.push({q,a,n});return{q,a,n};}};
globalThis.SpaceLensQA={answer:q=>({question:q,answer:`ANSWER:${q}`,confidence:'test',sources:[]})};
globalThis.SpaceLensLocalSearch={search:(q,{limit}={})=>({query:q,total:2,results:[{title:`LOCAL:${q}:1`},{title:`LOCAL:${q}:2`}].slice(0,limit||8)})};
globalThis.SpaceLensWebSearch={search:async(q,{providers}={})=>({query:q,total:1,providers:providers||['wikipedia'],results:[{provider:'Wikipedia',title:`WEB:${q}`,snippet:'public result'}],errors:[]})};
globalThis.Conscience64API={
  projects:{reflow:id=>({projectId:id,O:`PROJECT:${id}`})},
  get:id=>({logicalId:id,label:`RECORD:${id}`}),
  irpo:x=>structuredClone(x)
};

const code=await readFile(resolve(root,'space-lens-human-builder.js'),'utf8');
assert.doesNotMatch(code,/\beval\s*\(/,'Human Builder must not use eval');
assert.doesNotMatch(code,/new\s+Function\b/,'Human Builder must not compile arbitrary functions');
await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const b=globalThis.SpaceLensHumanBuilder;
assert.equal(b.schema,'conscience64/human-builder/v1');
assert.equal(b.version,'1.0.0');

for(const kind of ['research','search','compare','build']){
  const t=b.starter(kind);
  assert.ok(t.id&&t.name);
  assert.equal(t.schema,'conscience64/human-tool/v1');
  for(const k of ['subject','motivator','request','obligation','surface','outputDefinition']) assert.equal(typeof t.interface[k],'string');
  for(const k of ['question','need','limit','try','left']) assert.equal(typeof t.card[k],'string');
  assert.ok(t.steps.length>0);
}

let tool=b.starter('search');
tool.name='Human Search Tool';
tool.card.question='What can we learn about {{input}}?';
tool.card.need='Keep observations distinct from interpretation.';
tool.card.limit='Do not claim external search results are proof.';
tool.steps=[
  {type:'local-search',template:'{{input}}'},
  {type:'web-search',template:'{{input}}',providers:['wikipedia']},
  {type:'ask',template:'Question={{input}} Local={{step1}} Web={{step2}}'},
  {type:'remember',template:'{{previous}}'}
];
tool=b.save(tool);
assert.equal(b.list().length,1);
assert.equal(b.get(tool.id).name,'Human Search Tool');

const run=await b.run(tool.id,'carrier theory');
assert.equal(run.trace.length,4);
assert.equal(run.saw.length,4);
assert.ok(run.saw[0].startsWith('Local Search:'));
assert.ok(run.saw[1].startsWith('Web Search:'));
assert.ok(run.saw[2].includes('ANSWER:'));
assert.equal(run.trace[0].status,'OK');
assert.equal(run.trace[1].status,'OK');
assert.equal(run.trace[2].status,'OK');
assert.equal(run.trace[3].status,'OK');
assert.equal(taught.length,1);
assert.match(taught[0].a,/ANSWER:/);
assert.deepEqual(run.thoughts,[]);
assert.equal(run.decision,'');

const reflected=b.reflect(run.id,{thought:'The local and web observations appear complementary.',decision:'Run a narrower follow-up.',left:'Independent verification remains open.'});
assert.equal(reflected.saw.length,4,'Thought must not mutate Saw');
assert.equal(reflected.thoughts.length,1);
assert.equal(reflected.thoughts[0].epistemic,'PROPOSED');
assert.equal(reflected.decision,'Run a narrower follow-up.');
assert.equal(reflected.card.left,'Independent verification remains open.');

const projectTool=b.save({name:'Project Inspector',interface:{obligation:'Inspect one project.'},card:{question:'Inspect project',need:'Return project record.',limit:'No promotion.'},steps:[{type:'project',template:'{{input}}'}]});
const projectRun=await b.run(projectTool.id,'orbit-library');
assert.equal(projectRun.output.projectId,'orbit-library');
assert.ok(projectRun.saw[0].includes('orbit-library'));

const recordTool=b.save({name:'Record Inspector',steps:[{type:'record',template:'{{input}}'}]});
const recordRun=await b.run(recordTool.id,'project:physics');
assert.equal(recordRun.output.logicalId,'project:physics');

const exported=b.exportText();
assert.match(exported,/conscience64\/human-builder\/v1/);
b.clear();
assert.equal(b.list().length,0);
b.importText(exported);
assert.ok(b.list().length>=3);

b.remove(tool.id);
assert.equal(b.get(tool.id),null);
console.log('PASS Human Builder: bounded declarative composition, persistence, templates, runtime Saw, separate Thought/Decision, remainder, import/export');
