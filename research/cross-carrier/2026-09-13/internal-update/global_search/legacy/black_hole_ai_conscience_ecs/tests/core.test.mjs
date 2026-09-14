
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {ECS,coord4} from "../src/ecs.js";
import {ConscienceEngine,normalizeProposal} from "../src/conscience.js";

const world=JSON.parse(fs.readFileSync(new URL("../data/world.json",import.meta.url),"utf8"));

test("Float64 coordinate ECS preserves four coordinates",()=>{
  const e=new ECS();e.add("x","position",coord4(1,2,3,4));
  const p=e.get("x","position");
  assert.equal(p.constructor,Float64Array);assert.deepEqual([...p],[1,2,3,4]);
});

test("systems execute in declared order",()=>{
  const e=new ECS(),seen=[];e.addSystem("b",20,()=>seen.push("b"));e.addSystem("a",10,()=>seen.push("a"));e.update(.01,0);
  assert.deepEqual(seen,["a","b"]);
});

test("conscience hard-blocks private export regardless of soft score",()=>{
  const c=new ConscienceEngine(world.conscience);
  const p=normalizeProposal({action:"export",humanBenefit:1,agency:1,privacy:1,evidence:1,reversibility:1,cost:0,uncertainty:0,flags:["private_data_export"]},3);
  const r=c.review(p);assert.equal(r.decision,"block");assert.ok(r.hardHits.includes("private_data_export"));
});

test("reversible evidence-supported proposal can pass",()=>{
  const c=new ConscienceEngine(world.conscience);
  const p=normalizeProposal({action:"inspect",humanBenefit:.9,agency:1,privacy:1,evidence:.9,reversibility:1,cost:.05,uncertainty:.1,flags:[]},3);
  const r=c.review(p);assert.equal(r.decision,"allow");assert.ok(r.score>=world.conscience.thresholds.allow);
});

test("irreversible proposal asks the human even at high soft score",()=>{
  const c=new ConscienceEngine(world.conscience);
  const p=normalizeProposal({action:"commit",humanBenefit:1,agency:1,privacy:1,evidence:1,reversibility:1,cost:0,uncertainty:0,irreversible:true},3);
  assert.equal(c.review(p).decision,"ask-human");
});
