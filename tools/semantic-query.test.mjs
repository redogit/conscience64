import assert from 'node:assert/strict';
import {recordsFromRepository} from './semantic-corpus.mjs';
import {querySemanticRecords,suggestSituationHelpers,situationToQueryText,SEMANTIC_QUERY_BOUNDARIES} from './semantic-query.mjs';

const records=[
  {id:'a11y',title:'Accessible game participation',description:'screen reader keyboard untimed route motor accessibility human burden',tags:['accessibility','game'],project:'game'},
  {id:'ecs',title:'ECS world execution',description:'entity component systems deterministic world state carrier routing',tags:['ecs','game'],project:'engine'},
  {id:'evidence',title:'Evidence boundary',description:'provenance evidence claim ceiling independent corroboration related does not support',tags:['evidence','research'],project:'society'},
  {id:'finance',title:'Finance unrelated',description:'quarterly portfolio accounting balance sheet',tags:['finance'],project:'other'}
];
const q=querySemanticRecords(records,'screen reader untimed accessible participation',{limit:3,threshold:.05});
assert.equal(q.matches[0].id,'a11y');
assert.ok(q.boundaries.includes('QUERY_MATCH != SUPPORT'));
assert.ok(q.matches.every(m=>m.boundaries.includes('HELPER_CANDIDATE != APPLICABLE_HELPER')));
const q2=querySemanticRecords(records,'screen reader untimed accessible participation',{limit:3,threshold:.05});
assert.equal(JSON.stringify(q),JSON.stringify(q2));

const situation={
  goal:'Import game scenes into deterministic ECS video jobs',
  obligations:['preserve provenance','keep local state separate from authority'],
  uncertainty:'which helper should be inspected first?'
};
assert.match(situationToQueryText(situation),/deterministic ECS/);
const helpers=suggestSituationHelpers(records,situation,{limit:4,threshold:.03});
assert.ok(helpers.helperCount>0);
assert.ok(SEMANTIC_QUERY_BOUNDARIES.includes('TRANSIENT_QUERY != CORPUS_RECORD'));
assert.ok(SEMANTIC_QUERY_BOUNDARIES.includes('PRIVATE_ORIGIN != QUERY_RESULT'));
const privacyQuery=querySemanticRecords([
  {id:'public-query-safe',title:'Public query safe',description:'ordinary public routing phrase',project:'public'},
  {id:'private-query-blocked',title:'PRIVATE_QUERY_CANARY_9C1',description:'violet lantern privacy-only vector',project:'restricted',derived_from_private_history:true},
  {id:'private-method-blocked',title:'PRIVATE_QUERY_CANARY_9C2',description:'violet lantern privacy-only vector',project:'restricted',privacy_origin:{classification:'private-history-method-only',independently_regrounded:false}}
],'violet lantern privacy-only vector',{limit:5,threshold:.01});
assert.ok(!privacyQuery.matches.some(m=>m.id==='private-query-blocked'||m.id==='private-method-blocked'));
assert.ok(!privacyQuery.matches.some(m=>String(m.title).includes('PRIVATE_QUERY_CANARY')));
const privateCollision=querySemanticRecords([
  {id:'query:__transient__',title:'PRIVATE_QUERY_ID_CANARY',description:'blocked record',derived_from_private_history:true}
],'ordinary public lookup',{limit:5,threshold:.01,includeGraph:true});
assert.ok(privateCollision.graph.nodes.some(n=>n.id==='query:__transient__'));
assert.ok(!privateCollision.graph.nodes.some(n=>n.title==='PRIVATE_QUERY_ID_CANARY'));
assert.equal(privateCollision.graph.stats.skippedPrivateOrigin,1);

const corpus=await recordsFromRepository('.',{maxFiles:5000,maxFileBytes:256000,maxTextChars:4000});
const live=querySemanticRecords(corpus.records,'semantic cross reference provenance evidence routing',{limit:10,threshold:.06});
assert.ok(live.matchCount>0);
assert.ok(live.matches.some(m=>m.id.includes('semantic-')||/semantic/i.test(m.title)),JSON.stringify(live.matches,null,2));
assert.ok(live.matches.every(m=>m.project!=='__query__'));
console.log(`PASS semantic Situation query: ${corpus.records.length} repository records, ${live.matchCount} bounded helper candidates`);
