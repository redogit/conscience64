const names=["retrievalHybrid","consequentialAnchor","deltaReport","oneDegreeRepair","temporaryNoveltyId"];
const base=[]; for(const a of [-1,1]) for(const b of [-1,1]) for(const c of [-1,1]) for(const d of [-1,1]) base.push([a,b,c,d,a*b*c*d]);
export const DOE_RUNS=base.map((levels,i)=>({run:i+1,...Object.fromEntries(names.map((n,j)=>[n,levels[j]]))}));
const yes=v=>v===1;
export function simulateRun(run){
 const hybrid=yes(run.retrievalHybrid),anchors=yes(run.consequentialAnchor),delta=yes(run.deltaReport),one=yes(run.oneDegreeRepair),novelty=yes(run.temporaryNoveltyId);
 return {...run,responses:{
  reconstructionFidelity:Math.max(0,Math.min(1,0.62+(hybrid?0.15:-0.04)+(anchors?0.12:-0.02)+(delta?0.02:0)+(hybrid&&anchors?0.05:0))),
  lineageLoss:Math.max(0,0.22+(anchors?-0.13:0.10)+(delta?0.03:-0.02)+(novelty?-0.04:0)),
  activeWorkingSet:8+(hybrid?2:-2)+(anchors?-1:3)+(delta?-2:3),
  falsePromotionRate:Math.max(0,0.18+(one?-0.08:0.08)+(novelty?-0.06:0.05)+(delta?-0.02:0)),
  contradictionRetention:Math.max(0,Math.min(1,0.68+(one?0.16:-0.12)+(novelty?0.08:-0.05)+(anchors?0.03:0))),
  correctionBurden:Math.max(0,5+(delta?-1:2)+(novelty?-1:1)+(hybrid?0:1)),
  operationCount:30+(hybrid?8:-3)+(anchors?4:12)+(delta?-8:10)+(one?5:2)+(novelty?2:-1)
 }};
}
export function summarizeDOE(runs=DOE_RUNS.map(simulateRun)){
 const keys=Object.keys(runs[0].responses),effects={};
 for(const factor of names){effects[factor]={};for(const key of keys){const high=runs.filter(r=>r[factor]===1).reduce((s,r)=>s+r.responses[key],0)/8;const low=runs.filter(r=>r[factor]===-1).reduce((s,r)=>s+r.responses[key],0)/8;effects[factor][key]=high-low;}}
 return {factorEffects:effects,runCount:runs.length,generator:"temporaryNoveltyId = retrievalHybrid*consequentialAnchor*deltaReport*oneDegreeRepair"};
}
export function experimentReceipt(){const runs=DOE_RUNS.map(simulateRun);return {schema:"hli-doe-receipt/v0.1",generatedAt:new Date().toISOString(),claimCeiling:"SYNTHETIC_SCREENING_ONLY",runs,summary:summarizeDOE(runs)};}
