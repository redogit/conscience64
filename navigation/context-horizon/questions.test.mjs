import assert from 'node:assert/strict';
import {rankRoutes} from './engine.mjs';
import {chooseQuestion,applyAnswer,QUESTION_TEMPLATES} from './questions.mjs';

assert.ok(QUESTION_TEMPLATES.some(q=>q.id==='research-or-game-use'));

const mixedSnapshot={currentRoute:'conscience-root',explicitIntentTokens:['research','game'],recentActions:[]};
const mixedRank=rankRoutes(mixedSnapshot);
const q=chooseQuestion(mixedRank,mixedSnapshot);
assert.equal(q.id,'research-or-game-use');
assert.match(q.prompt,/original research work/i);
assert.match(q.prompt,/game surface/i);
assert.ok(q.candidates.some(id=>mixedRank.find(x=>x.route.id===id)?.route.ownerDomain==='research'));
assert.ok(q.candidates.some(id=>mixedRank.find(x=>x.route.id===id)?.route.ownerDomain==='game'));

const researchAnswer=applyAnswer(mixedSnapshot,q,'research');
assert.ok(researchAnswer.explicitIntentTokens.includes('research'));
assert.ok(researchAnswer.explicitIntentTokens.includes('evidence'));
assert.equal(researchAnswer.selectedFacet,'research');
assert.ok(!researchAnswer.unresolvedQuestions?.includes(q.id));
assert.equal(rankRoutes(researchAnswer)[0].route.ownerDomain,'research');

const gameAnswer=applyAnswer(mixedSnapshot,q,'game');
assert.ok(gameAnswer.explicitIntentTokens.includes('game'));
assert.ok(gameAnswer.explicitIntentTokens.includes('reference'));
assert.equal(gameAnswer.selectedFacet,'game');

const invalid=applyAnswer(mixedSnapshot,q,'not-an-option');
assert.deepEqual(invalid.explicitIntentTokens,['research','game']);
assert.ok(invalid.unresolvedQuestions.includes('research-or-game-use'));
assert.notEqual(invalid.selectedFacet,'research');
assert.notEqual(invalid.selectedFacet,'game');

const clear={currentRoute:'conscience-root',explicitIntentTokens:['hodge','evidence'],recentActions:[]};
assert.equal(chooseQuestion(rankRoutes(clear),clear),null);
const clearGame={currentRoute:'conscience-root',explicitIntentTokens:['play','red','wilds'],recentActions:[]};
assert.equal(chooseQuestion(rankRoutes(clearGame),clearGame),null);
const video={currentRoute:'conscience-root',explicitIntentTokens:['video'],recentActions:[]};
assert.equal(chooseQuestion(rankRoutes(video),video),null,'must not fabricate a renderer/control route that is not admitted');

const creative={currentRoute:'conscience-root',explicitIntentTokens:['music','language'],recentActions:[]};
const cq=chooseQuestion(rankRoutes(creative),creative);
assert.equal(cq.id,'computational-chorus-or-musilanguage');
assert.deepEqual(cq.candidates,['computational-chorus','musilanguage']);
const mus=applyAnswer(creative,cq,'musilanguage');
assert.ok(mus.explicitIntentTokens.includes('musilanguage'));
assert.equal(mus.selectedFacet,'creative:musilanguage');

const repeat=chooseQuestion(rankRoutes(mixedSnapshot),mixedSnapshot);
assert.deepEqual(q,repeat,'question selection must be deterministic');
console.log('PASS one-question discriminator preserves domain distinctions and never fabricates routes');
