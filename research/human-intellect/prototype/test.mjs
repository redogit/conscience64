import assert from "node:assert/strict";
import {createRuntime,KDKernel} from "./core.mjs";
import {DOE_RUNS,experimentReceipt} from "./doe.mjs";
import {loadCapabilityProbe} from "./wasm-probe.mjs";

const kd=new KDKernel({activeLimit:3});
const a=kd.observe("alpha obligation authority",{consequential:true});
const b=kd.observe("beta contradiction evidence");
kd.observe("gamma unrelated noise");
kd.observe("delta authority evidence");
assert.ok(kd.activeItems().length<=3);
kd.markUnknown("meaning of beta remains unresolved");
assert.equal(kd.unknown.length,1);
const anchor=kd.createAnchor("beta seam",[a.id,b.id],{reason:"semantic divergence"});
kd.decayActivation();
assert.equal(kd.activeItems().length,1);
assert.equal(kd.retrieveAnchor(anchor.id).items.length,2);
kd.activate("beta evidence",{mode:"hybrid"});
assert.ok(kd.activeItems().some(x=>x.id===b.id));

const runtime=createRuntime({activeLimit:5});
runtime.obligations.authorize({o0:"help with a task",reason:"user request",authority:"user",authorityStatus:"authorized",budget:3,unresolvedCost:10,expectedBenefit:"task progress",stopCondition:"done"});
assert.equal(runtime.controller.decide({cost:1,consequential:true}).decision,"allow");
const x=runtime.kd.observe("belief A",{consequential:true});
const y=runtime.kd.observe("observation contradicts A",{consequential:true});
assert.equal(runtime.controller.contradiction({beliefId:x.id,observationId:y.id,dimension:"assumption",proposedValue:"vary",reason:"counterevidence",cost:1}).decision,"allow");
assert.ok(runtime.kd.lineage.some(r=>r.kind==="repair"));

const waiting=createRuntime();
waiting.obligations.authorize({o0:"ambiguous request",reason:"request",authority:"owner",authorityStatus:"unavailable",budget:5,unresolvedCost:9,expectedBenefit:"clarity",stopCondition:"answer received"});
assert.equal(waiting.controller.decide({cost:1,consequential:true}).decision,"wait");

assert.equal(DOE_RUNS.length,16);
for(const factor of ["retrievalHybrid","consequentialAnchor","deltaReport","oneDegreeRepair","temporaryNoveltyId"]){
  assert.equal(DOE_RUNS.filter(r=>r[factor]===1).length,8);
  assert.equal(DOE_RUNS.filter(r=>r[factor]===-1).length,8);
}
const receipt=experimentReceipt();
assert.equal(receipt.claimCeiling,"SYNTHETIC_SCREENING_ONLY");
assert.equal(receipt.runs.length,16);

const wasm=await loadCapabilityProbe();
assert.equal(wasm.valid,true);
assert.equal(Object.keys(wasm.instance.exports).length,0,"capability probe starts with no exports/imports");

console.log("PASS human-intellect KD/obligation/controller/DOE/Wasm vertical slice");
