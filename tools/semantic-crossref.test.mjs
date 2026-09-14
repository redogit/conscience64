import assert from 'node:assert/strict';
import {buildSemanticCrossReferenceMap,semanticNeighbors,crossReferenceComponents,CROSSREF_BOUNDARIES} from './semantic-crossref.mjs';

const records=[
  {id:'hodge',title:'Hodge decision field',description:'algebraic cycles cohomology decision field geometry',tags:['math','geometry'],project:'moonshot',relations:[{target:'pnp',relation:'CALIBRATION_WITH'}]},
  {id:'pnp',title:'P versus NP decision field',description:'complexity selector decision field computation',tags:['math','decision-field'],project:'other-projects'},
  {id:'compass',title:'4D compass rose',aliases:['Compassrose'],description:'four dimensional geometry orientation decision field',tags:['geometry','4d']},
  {id:'compass-old',title:'Compassrose',description:'historical compass rose geometry carrier',tags:['geometry']},
  {id:'pool',title:'Pool cleaner',description:'water circulation capture maintenance cost',tags:['water','engineering']},
  {id:'water',title:'Water necessity',description:'safe water circulation treatment maintenance human necessity',tags:['water','human']},
  {id:'vector-a',title:'Alpha obscure',description:'unrelated lexeme one',embedding:[1,0,0,0]},
  {id:'vector-b',title:'Omega hidden',description:'different vocabulary two',embedding:[0.999,0.02,0,0]}
];
const g=buildSemanticCrossReferenceMap(records,{threshold:.16,maxEdgesPerNode:6});
assert.equal(g.stats.recordCount,8);
assert.ok(g.edges.some(e=>e.source==='hodge'&&e.target==='pnp'&&e.relation==='CALIBRATION_WITH'));
assert.ok(g.edges.some(e=>new Set([e.source,e.target]).has('compass')&&new Set([e.source,e.target]).has('compass-old')&&e.relation==='ALIAS_MATCH'));
assert.ok(g.edges.some(e=>new Set([e.source,e.target]).has('pool')&&new Set([e.source,e.target]).has('water')));
assert.ok(g.edges.some(e=>new Set([e.source,e.target]).has('vector-a')&&new Set([e.source,e.target]).has('vector-b')));
assert.ok(g.edges.filter(e=>e.epistemicStatus==='derived-relation').every(e=>e.boundaries.includes('RELATED != SUPPORTS')));
assert.ok(CROSSREF_BOUNDARIES.includes('SEMANTIC_SIMILARITY != EVIDENCE'));
assert.ok(semanticNeighbors(g,'pool').some(e=>e.neighbor==='water'));
assert.ok(crossReferenceComponents(g).some(c=>c.includes('pool')&&c.includes('water')));

const deterministic=buildSemanticCrossReferenceMap(records,{threshold:.16,maxEdgesPerNode:6});
assert.equal(JSON.stringify(g),JSON.stringify(deterministic));

const many=Array.from({length:3000},(_,i)=>({id:`n${i}`,title:`Node ${i}`,description:`topic${i%100} cluster${i%50} shared semantic mapping`,tags:[`group${i%25}`]}));
const t0=performance.now();
const massive=buildSemanticCrossReferenceMap(many,{threshold:.2,maxEdgesPerNode:8,maxTokenDfRatio:.08});
const ms=performance.now()-t0;
assert.equal(massive.nodes.length,3000);
assert.ok(massive.edges.length>0);
assert.ok(massive.edges.length<=3000*8/2 + 3000*8);
console.log(`PASS semantic cross-reference map: ${massive.nodes.length} nodes, ${massive.edges.length} sparse edges, ${Math.round(ms)} ms; deterministic; RELATED != SUPPORTS`);
