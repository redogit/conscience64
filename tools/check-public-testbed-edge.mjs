import assert from 'node:assert/strict';
import {containsRestrictedOrigin} from './private-origin-boundary.mjs';

const base=(process.env.PAGES_URL||'').replace(/\/+$/,'')+'/';
const expected=process.env.EXPECTED_SOURCE_SHA||'';
assert.ok(/^https:\/\//.test(base),'PAGES_URL must be https');
assert.match(expected,/^[0-9a-f]{40}$/);

async function get(rel,{json=false,expect=200}={}){
  const sep=rel.includes('?')?'&':'?';
  const url=base+rel+sep+'source='+expected.slice(0,12);
  const response=await fetch(url,{redirect:'follow',headers:{'cache-control':'no-cache'}});
  assert.equal(response.status,expect,`${rel} returned ${response.status}, expected ${expect}`);
  if(json)return response.json();
  return response.text();
}

const manifest=await get('projection-manifest.json',{json:true});
assert.equal(manifest.schema,'conscience64.public-testbed-projection/v0');
assert.equal(manifest.source_revision,expected);
assert.equal(manifest.source_root,'public-testbed/');
assert.equal(manifest.publication_scope,'public-testbed-only');
assert.equal(manifest.authority,'experimental-non-authoritative');
assert.match(manifest.projection_sha256,/^[0-9a-f]{64}$/);
assert.deepEqual(
  manifest.files.map(f=>f.path).sort(),
  ['app.js','carrier-surface/index.html','index.html','s1-models/index.html','style.css','testbed.json']
);
assert.ok(manifest.files.every(f=>String(f.source).startsWith('public-testbed/')));
assert.ok(!containsRestrictedOrigin(manifest));

const data=await get('testbed.json',{json:true});
assert.equal(data.schema,'conscience64.public-testbed-source/v0');
assert.equal(data.marker,'31173');
assert.equal(data.publication_scope,'public-testbed-only');
assert.equal(data.authority,'experimental-non-authoritative');
assert.ok(!containsRestrictedOrigin(data));
assert.equal(data.rooms.length,6);
assert.ok(data.experiments?.[0]?.remainder?.length>0);
assert.ok(data.experiments?.[0]?.claim_boundary);
assert.deepEqual([...new Set(data.paths.map(p=>p.status))].sort(),['active','blocked','deferred','failed','return','tested']);
assert.ok(data.paths.every(p=>p.currentness&&p.provenance&&p.claim_boundary&&p.remainder));
assert.ok(data.paths.some(p=>p.status==='tested'&&String(p.zero_result).includes('0 declared forbidden repository routes')));
assert.ok(data.paths.some(p=>p.status==='failed'&&p.currentness==='HISTORICAL_SUPERSEDED'));
assert.ok(data.paths.some(p=>p.status==='return'&&String(p.provenance).includes('gh-pages:3dcb37a5')));
assert.ok(data.aliases.every(a=>a.relation==='ALIAS_ONLY'));
assert.ok(data.verified_lineage.some(e=>e.relation==='VERIFIER_REPAIR'));
assert.ok(data.unresolved_relations.some(e=>e.relation==='PRESERVED_UNRESOLVED'));
assert.deepEqual(
  data.principles.map(p=>p.name).sort(),
  ['Interlingua','One-degree experiment','Pairity','USDAY','Visible paths','Wonderment']
);
assert.ok(data.principles.every(p=>String(p.boundary).includes('!=')));

const html=await get('');
assert.match(html,/Public Experimental Test Bed/);
assert.match(html,/31173/);
assert.match(html,/PUBLIC EXPERIMENT ≠ VERIFIED TRUTH/);
assert.match(html,/PRIVATE SOURCE MUST NOT PROPAGATE/);
assert.match(html,/Path Constellation — visible states/);
assert.match(html,/Language Garden — aliases without forced identity/);
assert.match(html,/Working principles/);

for(const rel of ['app.js','style.css'])await get(rel);

const carrierPage=await get('carrier-surface/');
assert.match(carrierPage,/Object identity is invariant; coordinates are negotiable\./);
assert.match(carrierPage,/17ce340776455735a1af814031b88b887a5cf421/);
assert.match(carrierPage,/MULTI_KEY_RELATION != MATHEMATICAL_MANIFOLD/);
assert.match(carrierPage,/cca44e23ca663600cc3466f45d7dc509c466b796/);
assert.match(carrierPage,/186\/186/);

const s1Page=await get('s1-models/');
assert.match(s1Page,/S Prime candidate-state model/);
assert.match(s1Page,/Survivor/);
assert.match(s1Page,/SemanticWorkUnit/);
assert.match(s1Page,/Grand Unified Perceptron \/ multi-timescale cell/);
assert.match(s1Page,/29effa0cfb52a019d51d81fae47aa8e056ab71cf/);
assert.match(s1Page,/CURRENT WORKING MODEL ≠ PINNED IMPLEMENTATION/);
assert.match(s1Page,/Executable Carrier–Surface bridge/);
assert.match(s1Page,/cca44e23ca663600cc3466f45d7dc509c466b796/);
assert.match(s1Page,/35523193624/);
assert.match(s1Page,/186\/186/);
assert.match(s1Page,/PROJECTION_SUCCESS != RECONSTRUCTION_SUCCESS/);


for(const forbidden of [
  'README.md',
  'data-manifest.json',
  'research/projects/README.md',
  'play/index.html',
  'about/index.html'
]){
  await get(forbidden,{expect:404});
}

console.log(`PASS public testbed edge: source=${expected} projection=${manifest.projection_sha256} files=${manifest.files.length}; Carrier–Surface + current S′ executable bridge routes present; repository routes absent; six path states + named principles + lineage + aliases + unresolved relation visible`);
