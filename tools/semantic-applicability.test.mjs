import assert from 'node:assert/strict';
import {recordsFromRepository} from './semantic-corpus.mjs';
import {suggestSituationHelpers} from './semantic-query.mjs';
import {
  APPLICABILITY_BOUNDARIES,
  evaluateHelperApplicability,
  gateSemanticHelperCandidates,
  proposeBoundedOperators
} from './semantic-applicability.mjs';

const situation={
  goal:'build deterministic provenance-preserving game tooling',
  obligations:['preserve-provenance','preserve-accessibility'],
  requiredCapabilities:['deterministic-mapping','provenance'],
  availableCarriers:['node','local-files'],
  requiredEvidenceKinds:['local-test'],
  forbiddenAuthorities:['server-authority','prize-authority'],
  allowedScopes:['local','repository'],
  maxCost:5,
  accessibilityRequired:true,
  privacyRequired:true
};

const good={
  id:'helper:good',
  operatorContract:{
    capabilities:['deterministic-mapping','provenance','semantic-navigation'],
    preserves:['preserve-provenance','preserve-accessibility'],
    requiredCarriers:['node'],
    evidenceKinds:['local-test','repository-check'],
    authorities:['local-helper'],
    scopes:['repository'],
    cost:2,
    accessibility:'declared',
    privacy:'protected'
  }
};
const forbidden={
  id:'helper:forbidden',
  operatorContract:{
    capabilities:['deterministic-mapping','provenance'],
    preserves:['preserve-provenance','preserve-accessibility'],
    requiredCarriers:['node'],
    evidenceKinds:['local-test'],
    authorities:['server-authority'],
    scopes:['repository'],
    cost:2,
    accessibility:'declared',
    privacy:'protected'
  }
};
const missingCarrier={
  id:'helper:carrier',
  operatorContract:{
    capabilities:['deterministic-mapping','provenance'],
    preserves:['preserve-provenance','preserve-accessibility'],
    requiredCarriers:['gpu-cluster'],
    evidenceKinds:['local-test'],
    authorities:['local-helper'],
    scopes:['repository'],
    cost:2,
    accessibility:'declared',
    privacy:'protected'
  }
};
const unknown={id:'helper:unknown',title:'Semantically attractive but uncontracted helper'};

assert.equal(evaluateHelperApplicability(situation,good).status,'APPLICABLE_FOR_BOUNDED_TEST');
assert.equal(evaluateHelperApplicability(situation,forbidden).status,'BLOCKED');
assert.ok(evaluateHelperApplicability(situation,forbidden).blockers.includes('authority-denylist'));
assert.equal(evaluateHelperApplicability(situation,missingCarrier).status,'BLOCKED');
assert.ok(evaluateHelperApplicability(situation,missingCarrier).blockers.includes('carrier-availability'));
assert.equal(evaluateHelperApplicability(situation,unknown).status,'UNRESOLVED');
assert.ok(evaluateHelperApplicability(situation,unknown).unresolved.includes('operator-contract'));
assert.ok(APPLICABILITY_BOUNDARIES.includes('SEMANTIC_SCORE != APPLICABILITY'));

const semanticCandidates={
  helpers:[
    {id:'helper:unknown',score:.99,title:'highest semantic score'},
    {id:'helper:good',score:.61,title:'lower score but explicit contract'},
    {id:'helper:forbidden',score:.77,title:'authority conflict'},
    {id:'helper:carrier',score:.73,title:'carrier conflict'}
  ]
};
const registry={
  'helper:good':good,
  'helper:forbidden':forbidden,
  'helper:carrier':missingCarrier
};
const gated=gateSemanticHelperCandidates(semanticCandidates,situation,registry);
assert.deepEqual(gated.counts,{applicable:1,unresolved:1,blocked:2});
const proposals=proposeBoundedOperators(gated,situation);
assert.equal(proposals.proposalCount,1);
assert.equal(proposals.proposals[0].helperId,'helper:good');
assert.equal(proposals.proposals[0].nextGate,'Build & Test');
assert.ok(proposals.proposals[0].boundaries.includes('OPERATOR_PROPOSAL != ADMISSION'));

// The real repository corpus intentionally lacks per-file Operator contracts.
// Semantic matches must therefore stay unresolved rather than becoming executable proposals.
const corpus=await recordsFromRepository('.', {maxFiles:5000,maxFileBytes:256000,maxTextChars:3000});
const liveSituation={
  goal:'find deterministic provenance accessibility ECS game helpers',
  obligations:['preserve-provenance'],
  requiredCapabilities:['deterministic-mapping'],
  availableCarriers:['node','local-files'],
  forbiddenAuthorities:['server-authority'],
  maxCost:10,
  accessibilityRequired:true
};
const liveCandidates=suggestSituationHelpers(corpus.records,liveSituation,{limit:10,threshold:.06});
assert.ok(liveCandidates.helpers.length>0);
const liveGate=gateSemanticHelperCandidates(liveCandidates,liveSituation,{});
assert.equal(liveGate.counts.applicable,0);
assert.equal(liveGate.counts.blocked,0);
assert.equal(liveGate.counts.unresolved,liveGate.candidateCount);
assert.equal(proposeBoundedOperators(liveGate,liveSituation).proposalCount,0);

console.log(`PASS semantic applicability gate: controlled applicable=1 unresolved=1 blocked=2; live repository candidates=${liveGate.candidateCount} remain unresolved without explicit contracts`);
