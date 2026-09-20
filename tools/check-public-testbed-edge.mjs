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
  ['app.js','index.html','style.css','testbed.json']
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

const html=await get('');
assert.match(html,/Public Experimental Test Bed/);
assert.match(html,/31173/);
assert.match(html,/PUBLIC EXPERIMENT ≠ VERIFIED TRUTH/);
assert.match(html,/PRIVATE SOURCE MUST NOT PROPAGATE/);

for(const rel of ['app.js','style.css'])await get(rel);

for(const forbidden of [
  'README.md',
  'data-manifest.json',
  'research/projects/README.md',
  'play/index.html',
  'about/index.html'
]){
  await get(forbidden,{expect:404});
}

console.log(`PASS public testbed edge: source=${expected} projection=${manifest.projection_sha256} files=${manifest.files.length}; repository routes absent`);
