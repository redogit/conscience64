import assert from 'node:assert/strict';
await import('./utf8-space.js');
await import('./style-profiles.js');
await import('./music64.js');
await import('./listener-floats.js');
const M=globalThis.Music64Styles?globalThis.Music64:null;
const Y=globalThis.Music64Styles,L=globalThis.ListenerFloatMusic;
assert.ok(M&&Y&&L);
assert.equal(Y.profiles.length,64);
assert.equal(Object.keys(Y.groups()).length,8);
const signatures=new Set(),families=new Set();
for(const p of Y.profiles){
  const r=M.fromText('Every listener gets another doorway into the same words.',{style:p.baseStyle,bpm:p.bpm,meter:p.meter,transform:p.transform});
  r.styleProfile=p.id;
  const score=Y.apply(L.compose(r),r);
  assert.equal(score.styleProfile,p.id);
  assert.equal(score.styleLabel,p.label);
  families.add(p.family);
  signatures.add(JSON.stringify(score.events.slice(0,160).map(e=>[e.track,Number(e.b.toFixed(3)),e.n,Number(e.v.toFixed(3))])));
  const repaired=L.repair(L.stumble(r,{seed:17,amount:2,kind:'mixed',phase:'trial'}));
  assert.deepEqual(repaired.cells,r.cells);
  assert.equal(repaired.styleProfile,p.id);
}
assert.equal(families.size,8);
assert.ok(signatures.size>=56,`only ${signatures.size} distinct early-score signatures`);
console.log(JSON.stringify({status:'PASS',profiles:Y.profiles.length,families:families.size,distinctEarlyScoreSignatures:signatures.size,boundary:'Distinct event signatures are software evidence, not a guarantee that every listener perceives categorical difference.'},null,2));
