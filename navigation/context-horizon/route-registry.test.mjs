import assert from 'node:assert/strict';
import {DIMENSION_KEYS,ROUTE_REGISTRY,getRoute,validateRegistry,materializeGameWebLinks} from './route-registry.mjs';

assert.deepEqual(DIMENSION_KEYS,[
  'place','activity','personAgent','object','timeHistory','evidence',
  'research','creation','systemTool','worldGameState','purpose','relation'
]);
assert.equal(validateRegistry().ok,true);
assert.equal(ROUTE_REGISTRY.primaryRoute,'conscience-root');
assert.equal(getRoute('research-projects').ownerDomain,'research');
assert.equal(getRoute('mmo-simple').ownerDomain,'game');
assert.equal(getRoute('conscience-root').ownerDomain,'site');
assert.equal(getRoute('research-projects').epistemicRole,'preserved-project-index');
assert.equal(getRoute('visual-samples').epistemicRole,'reference');
assert.equal(getRoute('musilanguage').ownerDomain,'creative');
assert.equal(getRoute('history-root').ownerDomain,'history');
assert.equal(new Set(ROUTE_REGISTRY.routes.map(r=>r.id)).size,ROUTE_REGISTRY.routes.length);
assert.equal(new Set(ROUTE_REGISTRY.routes.map(r=>r.href)).size,ROUTE_REGISTRY.routes.length);
for(const r of ROUTE_REGISTRY.routes){
  assert.deepEqual(Object.keys(r.dimensions).sort(),[...DIMENSION_KEYS].sort(),r.id);
  assert.ok(!('d13' in r.dimensions),r.id);
  assert.equal(r.provenance.status,'admitted',r.id);
}
const researchToGame=ROUTE_REGISTRY.routes.flatMap(r=>r.relations.map(rel=>({from:r,to:getRoute(rel.to),type:rel.type})))
  .filter(x=>x.from.ownerDomain==='research'&&x.to?.ownerDomain==='game');
for(const edge of researchToGame) assert.ok(!['owns','absorbs','proves','contains','replaces-semantically'].includes(edge.type),JSON.stringify(edge));
const gameMap=materializeGameWebLinks();
assert.equal(gameMap.schema,'conscience64.mmo.web-links/v2');
assert.equal(gameMap.primaryRoute,'mmo-simple');
assert.ok(gameMap.routes.some(r=>r.id==='mmo-simple'));
assert.ok(gameMap.routes.some(r=>r.id==='mmo-world-beta'));
assert.ok(!gameMap.routes.some(r=>r.id==='research-projects'));
assert.ok(!gameMap.routes.some(r=>r.id==='conscience-root'));
console.log(`PASS site-level Context Horizon route graph: ${ROUTE_REGISTRY.routes.length} routes; game projection ${gameMap.routes.length}`);
