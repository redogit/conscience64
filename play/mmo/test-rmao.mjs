import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = p => readFile(new URL(p, import.meta.url), 'utf8');
const [contractText, canon, current, release, links, ecs] = await Promise.all([
  read('rmao-world-contract.json'), read('RMAO_WORLD_CANON.md'), read('CURRENT.md'),
  read('RELEASE_PLAN_2026-11-15.md'), read('web-links.json'), read('simple/ecs.mjs')
]);
const c=JSON.parse(contractText);
assert.equal(c.schema,'conscience64.rmao-world/v1');
assert.equal(c.worldId,'rmao-world');
assert.equal(c.spatial.dimensions,3);
assert.equal(c.spatial.chunkStreamingRequired,true);
assert.equal(c.roguelike.historyErasureOnRunReset,false);
assert.equal(c.limbGraph.arbitraryArmCount,true);
assert.deepEqual(c.limbGraph.states,['attached','damaged','disabled','detached']);
assert.equal(c.authority.serverRequiredForLiveMMORPG,true);
assert.equal(c.authority.clientPredictionIsAuthority,false);
assert.equal(c.currentImplementation.massive3DVerified,false);
assert.match(canon,/CURRENT_2D_PROTOTYPE != MASSIVE_3D_WORLD/);
assert.match(canon,/WorldSeed → Region → Sector → Chunk → Cell → Entity/);
assert.match(current,/RIPPING MANY ARMS OFF/);
assert.match(release,/RMAO successor gate/);
assert.match(links,/rmao-world/);
assert.match(ecs,/world:rmao-world/);
assert.doesNotMatch(current,/RED WILDS/);
assert.doesNotMatch(release,/RED WILDS/);
console.log('PASS RMAO successor contract: 3D target, roguelike scopes, limb graph, authority and claim ceilings');
