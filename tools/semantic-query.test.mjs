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

const corpus=await recordsFromRepository('.',{maxFiles:5000,maxFileBytes:256000,maxTextChars:4000});
const live=querySemanticRecords(corpus.records,'semantic cross reference provenance evidence routing',{limit:10,threshold:.06});
assert.ok(live.matchCount>0);
assert.ok(live.matches.some(m=>m.id.includes('semantic-')||/semantic/i.test(m.title)),JSON.stringify(live.matches,null,2));
assert.ok(live.matches.every(m=>m.project!=='__query__'));
console.log(`PASS semantic Situation query: ${corpus.records.length} repository records, ${live.matchCount} bounded helper candidates`);
