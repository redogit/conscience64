import assert from "node:assert/strict";
import test from "node:test";
import {createRuntime} from "./core.mjs";

const input = authorityStatus => ({
  o0:"bounded authority regression", reason:"test fixture", authority:"fixture-owner",
  authorityStatus, budget:3, unresolvedCost:1, expectedBenefit:"validation",
  stopCondition:"one decision"
});
const missing = Symbol("missing field");
const invalidStates = [
  ["pending", "pending"], ["missing", missing], ["undefined", undefined],
  ["null", null], ["empty", ""], ["whitespace", " "],
  ["wrong case", "Authorized"], ["padded", "authorized "],
  ["true", true], ["false", false], ["zero", 0], ["one", 1],
  ["NaN", NaN], ["object", {}], ["array", ["authorized"]],
  ["boxed string", new String("authorized")],
  ["coercible object", {toString:()=>"authorized"}],
  ["symbol", Symbol("authorized")], ["function", ()=>"authorized"]
];
const setState = (record, value) => {
  if(value===missing) delete record.authorityStatus;
  else record.authorityStatus=value;
};

// Catch acceptance of malformed values at creation, including truthy impostors.
for(const [label,value] of invalidStates){
  test(`creation rejects ${label} without creating an obligation or lineage`,()=>{
    const runtime=createRuntime(), candidate=input(value);
    setState(candidate,value);
    assert.throws(()=>runtime.obligations.authorize(candidate),/authorityStatus/);
    assert.equal(runtime.obligations.current,null);
    assert.deepEqual(runtime.kd.lineage,[]);
    assert.equal(runtime.controller.decide({cost:1,consequential:true}).decision,"reject");
    assert.equal(runtime.obligations.remaining(),0);
  });
  // Catch controller fall-through independently of creation-time validation.
  test(`controller rejects ${label} on an altered obligation without spending`,()=>{
    const runtime=createRuntime(), obligation=runtime.obligations.authorize(input("authorized"));
    const prior=runtime.controller.decide({cost:1,consequential:true});
    const lineage=structuredClone(runtime.kd.lineage);
    setState(obligation,value);
    for(const consequential of [true,false]){
      const result=runtime.controller.decide({cost:1,consequential});
      assert.equal(result.decision,"reject");
      assert.match(result.reason,/authority/i);
      assert.equal(result.remainingBudget,2);
      assert.equal(runtime.controller.decisions.at(-1),result);
    }
    assert.equal(runtime.obligations.current,obligation);
    assert.equal(obligation.budget,3);
    assert.equal(obligation.spent,1);
    assert.equal(runtime.controller.decisions[0],prior);
    assert.equal(runtime.controller.decisions.length,3);
    assert.deepEqual(runtime.kd.lineage,lineage);
    if(value===missing) assert.equal(Object.hasOwn(obligation,"authorityStatus"),false);
    else assert.equal(obligation.authorityStatus,value);
  });
}

for(const [status,expected,remaining] of [
  ["authorized","allow",2], ["ambiguous","wait",3],
  ["unavailable","wait",3], ["rejected","reject",3]
]){
  test(`${status} retains its decision, budget, identity and authority state`,()=>{
    const runtime=createRuntime(), obligation=runtime.obligations.authorize(input(status));
    const result=runtime.controller.decide({cost:1,consequential:true});
    assert.equal(result.decision,expected);
    assert.equal(result.remainingBudget,remaining);
    assert.equal(runtime.obligations.current,obligation);
    assert.equal(obligation.authorityStatus,status);
    assert.equal(runtime.kd.lineage[0].subject,obligation.id);
    assert.equal(runtime.controller.decisions[0],result);
  });
}

test("invalid replacement preserves the existing obligation, budget and recoverable history",()=>{
  const runtime=createRuntime(), obligation=runtime.obligations.authorize(input("authorized"));
  runtime.controller.decide({cost:1,consequential:true});
  const observed=runtime.kd.observe("retained evidence",{consequential:true});
  const anchor=runtime.kd.createAnchor("recovery",[observed.id]);
  runtime.kd.markUnknown("permission evidence remains unresolved");
  const before=structuredClone({obligation,history:runtime.kd.snapshot(),decisions:runtime.controller.decisions});
  for(const [,value] of invalidStates){
    const candidate=input(value); setState(candidate,value);
    assert.throws(()=>runtime.obligations.authorize(candidate),/authorityStatus/);
    assert.equal(runtime.obligations.current,obligation);
    assert.deepEqual({obligation,history:runtime.kd.snapshot(),decisions:runtime.controller.decisions},before);
  }
  assert.equal(runtime.kd.retrieveAnchor(anchor.id).items[0].id,observed.id);
});

test("authorized status still obeys authority scope and budget gates",()=>{
  const runtime=createRuntime();
  runtime.obligations.authorize(input("authorized"));
  assert.equal(runtime.controller.decide({cost:1,consequential:true,requestedAuthority:"other-owner"}).decision,"wait");
  assert.equal(runtime.controller.decide({cost:4,consequential:true}).decision,"reject");
  assert.equal(runtime.obligations.remaining(),3);
  assert.equal(runtime.controller.decide({cost:3,consequential:true,requestedAuthority:"fixture-owner"}).decision,"allow");
  assert.equal(runtime.obligations.remaining(),0);
});

test("invalid authority retains a denied repair proposal and its evidence",()=>{
  const runtime=createRuntime(), obligation=runtime.obligations.authorize(input("authorized"));
  const belief=runtime.kd.observe("belief"), observation=runtime.kd.observe("counterevidence");
  obligation.authorityStatus="pending";
  const prior=structuredClone(runtime.kd.lineage);
  const residual=runtime.controller.contradiction({beliefId:belief.id,observationId:observation.id,dimension:"assumption",proposedValue:"vary",reason:"counterevidence",cost:1});
  assert.equal(residual.decision,"reject");
  assert.equal(runtime.obligations.remaining(),3);
  assert.deepEqual(runtime.kd.lineage.slice(0,-1),prior);
  const repair=runtime.kd.lineage.at(-1);
  assert.equal(repair.subject,residual.id);
  assert.deepEqual(repair.evidence,[belief.id,observation.id]);
  assert.deepEqual(repair.unresolved,[runtime.controller.decisions.at(-1).reason]);
});
