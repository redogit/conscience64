import assert from 'node:assert/strict';
import {
  HYPOTHESIS_BOUNDARIES,
  createHypothesisSeed,
  xorStateDelta,
  compileDiscriminatorPlan,
  evaluateDiscriminator,
  repairHypothesis,
  toAlgorithmHarnessSupportManifest
} from './hypothesis-algorithm-builder.mjs';

const seedInput={
  intuition:'Difference, transformation, composition, and repair may share a common reversible carrier.',
  subject:'reversible distinction carrier',
  formalStatement:'For the tested binary state space, one delta can describe and replay a state transition.',
  assumptions:['finite binary states','equal-width states'],
  observables:['roundTrip','targetReached'],
  alternatives:['difference description and transformation require distinct carriers'],
  scope:'finite binary calibration',
  provenance:{kind:'user-intuition',source:'conversation'}
};

const seed=createHypothesisSeed(seedInput);
assert.equal(seed.epistemicStatus,'hypothesis-only');
assert.equal(seed.authority,'none');
assert.equal(seed.intuition,seedInput.intuition);
assert.ok(seed.boundaries.includes('INTUITION != EVIDENCE'));
assert.equal(seed.id,createHypothesisSeed(seedInput).id,'stable input must produce stable hypothesis id');

const delta=xorStateDelta('101101','011001');
assert.equal(delta.delta,'110100');
assert.equal(delta.forwardReplay,'011001');
assert.equal(delta.backwardReplay,'101101');
assert.equal(delta.exactRoundTrip,true);
assert.throws(()=>xorStateDelta('101','10'),/equal length/i);
assert.throws(()=>xorStateDelta('10x','101'),/binary/i);

const plan=compileDiscriminatorPlan(seed,{
  baselineState:{carrier:'xor',width:6,mode:'reversible'},
  interventions:[
    {id:'without-replay',factor:'mode',value:'describe-only'},
    {id:'alternate-carrier',factor:'carrier',value:'separate-delta'}
  ],
  observations:['roundTrip','targetReached'],
  expected:[
    {conditionId:'baseline',field:'roundTrip',relation:'eq',value:true},
    {conditionId:'without-replay',field:'roundTrip',relation:'eq',value:false}
  ],
  stopConditions:['invalid-state-width']
});
assert.equal(plan.conditions.length,3);
assert.equal(plan.conditions[0].id,'baseline');
assert.deepEqual(plan.conditions[1].changedFactors,['mode']);
assert.deepEqual(plan.conditions[2].changedFactors,['carrier']);
assert.equal(plan.authority,'plan-only');
assert.ok(plan.boundaries.includes('GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT'));

assert.throws(()=>compileDiscriminatorPlan(seed,{
  baselineState:{carrier:'xor',mode:'reversible'},
  interventions:[{id:'bad',changes:{carrier:'other',mode:'describe-only'}}],
  observations:['roundTrip']
}),/exactly one factor/i);

const supported=evaluateDiscriminator(plan,{
  baseline:{roundTrip:true,targetReached:true},
  'without-replay':{roundTrip:false,targetReached:true},
  'alternate-carrier':{roundTrip:true,targetReached:true}
});
assert.equal(supported.status,'SUPPORTED_IN_TEST');
assert.ok(supported.boundaries.includes('TEST_SUPPORT != UNIVERSAL_TRUTH'));

const contradicted=evaluateDiscriminator(plan,{
  baseline:{roundTrip:false,targetReached:true},
  'without-replay':{roundTrip:true,targetReached:true},
  'alternate-carrier':{roundTrip:true,targetReached:true}
});
assert.equal(contradicted.status,'CONTRADICTED_IN_TEST');
assert.ok(contradicted.boundaries.includes('TEST_CONTRADICTION != UNIVERSAL_FALSEHOOD'));

const inconclusive=evaluateDiscriminator(plan,{
  baseline:{roundTrip:true,targetReached:true}
});
assert.equal(inconclusive.status,'INCONCLUSIVE');

const invalid=evaluateDiscriminator(plan,{
  baseline:{roundTrip:true},
  unknown:{roundTrip:false}
});
assert.equal(invalid.status,'INVALID_TEST');

const repaired=repairHypothesis(seed,{
  revisionReason:'The finite calibration supports reversible XOR deltas but does not justify a universal carrier claim.',
  changes:{
    formalStatement:'For the tested equal-width binary states, XOR delta describes and replays the transition exactly.',
    scope:'equal-width finite binary calibration'
  },
  evaluationRef:'evaluation:finite-xor-1'
});
assert.notEqual(repaired.id,seed.id);
assert.equal(repaired.predecessorId,seed.id);
assert.equal(repaired.intuition,seed.intuition,'repair must preserve the original intuition');
assert.equal(repaired.epistemicStatus,'revised-hypothesis');
assert.deepEqual(repaired.changedFields,['formalStatement','scope']);
assert.throws(()=>repairHypothesis(seed,{revisionReason:'bad',changes:{intuition:'rewrite history'}}),/intuition/i);

const manifest=toAlgorithmHarnessSupportManifest(plan,{seeds:[1,2,3]});
assert.equal(manifest.authority,'support-only');
assert.equal(manifest.executionStatus,'not-executed');
assert.equal(manifest.conditions.length,3);
assert.deepEqual(manifest.seeds,[1,2,3]);
assert.ok(manifest.boundaries.includes('ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION'));

const forbiddenWords=['proved','proven','true','verified'];
const serialized=JSON.stringify({seed,plan,supported,contradicted,repaired,manifest}).toLowerCase();
for(const word of forbiddenWords){
  assert.equal(serialized.includes(`\"status\":\"${word}\"`),false,`status must not claim ${word}`);
}
assert.ok(HYPOTHESIS_BOUNDARIES.includes('HYPOTHESIS != CLAIM_ESTABLISHED'));

console.log('PASS governed hypothesis Algorithm Builder: intuition->hypothesis->one-degree plan->bounded evaluation->successor repair; INTUITION != EVIDENCE');
