import assert from 'node:assert/strict';
import test from 'node:test';
import {createRuntime} from './core.mjs';

const input = () => ({o0:'test',reason:'test',authority:'owner',authorityStatus:'authorized',budget:5,unresolvedCost:2,expectedBenefit:'test',stopCondition:'done'});
const invalid = [['NaN',NaN],['Infinity',Infinity],['negative infinity',-Infinity],['negative',-1],['nonnumeric string','not-a-number'],['numeric string','1'],['null',null],['boolean',true]];
const snapshot = r => structuredClone({obligation:r.obligations.current,history:r.kd.snapshot(),decisions:r.controller.decisions});
const seeded = () => {
  const r=createRuntime();
  r.obligations.authorize(input());
  r.controller.decide({cost:1});
  const evidence=r.kd.observe('evidence');
  r.kd.createAnchor('anchor',[evidence.id]);
  r.kd.markUnknown('independent external permission remains unresolved');
  return r;
};

for(const field of ['budget','unresolvedCost']) for(const [label,value] of invalid){
  test(`reject ${label} ${field} without replacing obligation or altering history`,()=>{
    const r=seeded(), existing=r.obligations.current, before=snapshot(r);
    assert.throws(()=>r.obligations.authorize({...input(),[field]:value}));
    assert.equal(r.obligations.current,existing);
    assert.deepEqual(snapshot(r),before);
  });
}
for(const [label,value] of invalid){
  for(const method of ['decide','spend','contradiction']){
    test(`${method} rejects ${label} cost without mutation`,()=>{
      const r=seeded(), before=snapshot(r);
      const run=method==='decide' ? ()=>r.controller.decide({cost:value}) : method==='spend' ? ()=>r.obligations.spend(value) : ()=>r.controller.contradiction({beliefId:'b',observationId:'o',dimension:'d',proposedValue:'v',reason:'r',cost:value});
      assert.throws(run);
      assert.deepEqual(snapshot(r),before);
      assert.equal(r.obligations.remaining(),4);
      assert.equal(r.controller.decide({cost:5}).decision,'reject');
      assert.equal(r.obligations.remaining(),4);
    });
  }
  test(`invalid cost ${label} cannot record even when authority is unavailable`,()=>{
    const r=seeded(); r.obligations.current.authorityStatus='unavailable'; const before=snapshot(r);
    assert.throws(()=>r.controller.decide({cost:value}));
    assert.deepEqual(snapshot(r),before);
  });
}
for(const field of ['budget','spent','unresolvedCost']) for(const [label,value] of invalid){
  test(`altered ${field}=${label} fails before decision, spending, or history mutation`,()=>{
    const r=seeded(); r.obligations.current[field]=value; const before=snapshot(r);
    assert.throws(()=>r.controller.decide({cost:0}));
    assert.deepEqual(snapshot(r),before);
    assert.throws(()=>r.obligations.spend(0));
    assert.deepEqual(snapshot(r),before);
    assert.throws(()=>r.obligations.remaining());
    assert.deepEqual(snapshot(r),before);
  });
}
test('overspent altered state fails before any mutation',()=>{
  const r=seeded(); r.obligations.current.spent=6; const before=snapshot(r);
  assert.throws(()=>r.controller.decide({cost:0}));
  assert.deepEqual(snapshot(r),before);
  assert.throws(()=>r.obligations.spend(0));
  assert.throws(()=>r.obligations.remaining());
});
test('zero is valid and current authority and budget gates persist',()=>{
  const r=createRuntime(); const o=r.obligations.authorize({...input(),budget:0,unresolvedCost:0});
  assert.equal(r.controller.decide({cost:0}).decision,'allow');
  assert.equal(o.spent,0);
  assert.equal(r.obligations.remaining(),0);
  assert.equal(r.controller.decide({cost:1}).decision,'reject');
  assert.equal(r.obligations.remaining(),0);
});
test('rounded addition cannot mutate spending above a finite budget',()=>{
  const r=createRuntime();
  const budget=2.10981420576032e99, spent=2.4936240697754592e98;
  const o=r.obligations.authorize({...input(),budget});
  o.spent=spent;
  const cost=budget-spent;
  assert.ok(spent+cost>budget);
  const result=r.controller.decide({cost});
  assert.notEqual(result.decision,'allow');
  assert.equal(o.spent,spent);
  assert.equal(r.obligations.remaining(),cost);
});
test('authorization stores the same numeric values that it validates',()=>{
  const r=createRuntime(), candidate=input();
  let reads=0;
  Object.defineProperty(candidate,'budget',{get(){return ++reads<=3?5:NaN;}});
  const o=r.obligations.authorize(candidate);
  assert.equal(o.budget,5);
  assert.equal(r.obligations.remaining(),5);
});
test('positive cost too small to change spending is rejected',()=>{
  const r=createRuntime(), o=r.obligations.authorize({...input(),budget:1e16});
  o.spent=1e16-2;
  assert.equal(r.controller.decide({cost:0.25}).decision,'reject');
  assert.equal(o.spent,1e16-2);
  assert.equal(r.obligations.remaining(),2);
});
