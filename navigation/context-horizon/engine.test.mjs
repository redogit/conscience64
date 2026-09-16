import assert from 'node:assert/strict';
import {ROUTE_REGISTRY} from './route-registry.mjs';
import {rankRoutes,deriveEmergentRelation,normalizeSnapshot,WEIGHTS} from './engine.mjs';

assert.equal(WEIGHTS.version,'1.0.0');
const base={currentRoute:'conscience-root',explicitIntentTokens:['hodge','evidence'],recentActions:[]};
const a=rankRoutes(base);
const b=rankRoutes(base);
assert.deepEqual(a.map(x=>[x.route.id,x.score]),b.map(x=>[x.route.id,x.score]));
assert.equal(a[0].route.id,'research-projects');
assert.ok(a.findIndex(x=>x.route.id==='research-projects') < a.findIndex(x=>x.route.id==='mmo-simple'));
for(const row of a){assert.equal(row.authorityDelta,0);assert.equal(row.evidenceDelta,0);}

const withGameFun={...base,recentActions:['played-red-wilds','liked-visual','fun-session']};
const funRank=rankRoutes(withGameFun);
const ra=a.find(x=>x.route.id==='research-projects');
const rb=funRank.find(x=>x.route.id==='research-projects');
assert.equal(ra.route.epistemicRole,rb.route.epistemicRole);
assert.equal(ra.route.ownerDomain,'research');
assert.equal(rb.route.ownerDomain,'research');
assert.equal(ra.authorityDelta,0);
assert.equal(rb.authorityDelta,0);
assert.equal(funRank[0].route.id,'research-projects');

const reversed={...ROUTE_REGISTRY,routes:Object.freeze([...ROUTE_REGISTRY.routes].reverse())};
const c=rankRoutes(base,reversed);
assert.deepEqual(a.map(x=>[x.route.id,x.score]),c.map(x=>[x.route.id,x.score]));

const history=rankRoutes({currentRoute:'mmo-simple',explicitIntentTokens:['what','changed','restore','predecessor'],recentActions:[]});
assert.ok(history.findIndex(x=>x.route.id==='history-mmo') < history.findIndex(x=>x.route.id==='visual-samples'));

const presentationNoise=rankRoutes({...base,visualMode:'huge-glow',viewpoint:'world-view',popularity:999,engagement:999});
assert.deepEqual(a.map(x=>[x.route.id,x.score]),presentationNoise.map(x=>[x.route.id,x.score]));

const normalized=normalizeSnapshot({currentRoute:'missing',explicitIntentTokens:['  HODGE  ','Evidence'],recentActions:Array(30).fill('noise'),identity:'secret-user'});
assert.equal(normalized.currentRoute,'conscience-root');
assert.deepEqual(normalized.explicitIntentTokens,['hodge','evidence']);
assert.equal(normalized.recentActions.length,12);
assert.ok(!('identity' in normalized));

const emergent=deriveEmergentRelation({currentRoute:'conscience-root'},rankRoutes({currentRoute:'conscience-root',explicitIntentTokens:['music','language'],recentActions:[]}));
if(emergent){
  assert.equal(emergent.kind,'emergentRelation');
  assert.ok(emergent.dimensions.length>=2);
  assert.ok(!('d13' in emergent));
  assert.match(emergent.interpretation,/derived/i);
}
console.log('PASS deterministic Context Horizon ranking without epistemic/value leakage');
