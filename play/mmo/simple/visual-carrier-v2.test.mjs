import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeECS,videoJobs} from './ecs.mjs';
import {
  buildCarrierPlan,canonicalJson,carrierSeed,sealCarrierPlan,sha256Canonical
} from './tools/visual-carrier-v2.mjs';

const world=initializeECS();
const jobs=videoJobs(world);
const before=canonicalJson(jobs);

const plan=buildCarrierPlan(jobs,{
  place:'Mercer & Red Street',
  recipeId:'mercer-and-red-street.v1',
  renderer:'blender-cycles-reference-v1'
});

assert.equal(plan.schema,'conscience64.visual-carrier-plan/v2');
assert.equal(plan.sourceJobCount,24);
assert.equal(plan.jobs.length,3);
assert.deepEqual(plan.jobs.map(row=>row.perspective),[
  'character-view','player-pov','world-view'
]);
assert.ok(plan.jobs.every(row=>row.place==='Mercer & Red Street'));
assert.ok(plan.jobs.every(row=>row.authority==='render-only'));
assert.ok(plan.jobs.every(row=>row.boundary==='VIDEO_RENDER != WORLD_AUTHORITY'));
assert.ok(plan.jobs.every(row=>row.carrier.canon===false));
assert.ok(plan.jobs.every(row=>row.carrier.worldAuthority===false));

for(const row of plan.jobs){
  const source=jobs.find(job=>job.id===row.id);
  assert.ok(source,`missing source job ${row.id}`);
  assert.equal(row.durationSec,source.durationSec);
  assert.equal(row.fps,source.fps);
  assert.deepEqual(row.resolution,source.resolution);
  assert.deepEqual(row.camera,source.camera);
  assert.equal(row.sourceJobSha256,sha256Canonical(source));

  const domains=['layout','lighting','motion','materials','crowd'];
  const seeds=domains.map(domain=>row.carrier.seeds[domain]);
  assert.equal(new Set(seeds).size,domains.length);
  for(const [index,domain] of domains.entries()){
    assert.equal(seeds[index],carrierSeed(row.id,domain));
    assert.match(seeds[index],/^[0-9a-f]{64}$/);
  }
}

assert.equal(canonicalJson(jobs),before,'carrier planning must not mutate ECS jobs');
assert.equal(canonicalJson(buildCarrierPlan(jobs,{
  place:'Mercer & Red Street',recipeId:'mercer-and-red-street.v1',renderer:'blender-cycles-reference-v1'
})),canonicalJson(plan),'same inputs must produce the same carrier plan');

const sealed=sealCarrierPlan(plan);
assert.equal(sealed.seal.algorithm,'sha256');
assert.equal(sealed.seal.canonicalPayloadSha256,sha256Canonical(plan));
assert.match(sealed.seal.canonicalPayloadSha256,/^[0-9a-f]{64}$/);

const recipe=JSON.parse(readFileSync(new URL('./visual-carrier-v2/recipes/mercer-and-red-street.v1.json',import.meta.url),'utf8'));
assert.equal(recipe.schema,'conscience64.visual-recipe/v1');
assert.equal(recipe.placeEntity,'place:mercer-and-red-street');
assert.equal(recipe.authority,'none');
assert.equal(recipe.interpretationOnly,true);
assert.equal(recipe.canon,false);
assert.deepEqual(recipe.boundaries,[
  'VISUAL_CARRIER != WORLD_AUTHORITY',
  'VISUAL_INTERPRETATION != WORLD_FACT',
  'VISUAL_CANDIDATE != PRODUCTION_VISUAL_CANON'
]);

console.log('PASS visual carrier v2: Mercer 3-perspective deterministic plan, domain-separated seeds, immutable ECS input, sealed provenance boundary');
