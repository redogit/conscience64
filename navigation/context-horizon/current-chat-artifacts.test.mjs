import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {generateInventorySnapshot, findInInventory} from './work-inventory.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const inventory=await generateInventorySnapshot(repoRoot);
const targets=[
  ['red-wilds-alpha-0-1','game-artifact'],
  ['red-wilds-generated-image-bundle','visual-artifact'],
  ['red-wilds-ecs-media-corpus','media-artifact'],
  ['red-wilds-pil-variants','visual-artifact'],
  ['red-wilds-wild-renderer-batch','visual-artifact'],
  ['red-wilds-music-driven-1000','media-artifact'],
  ['red-wilds-three-perspective-videos','media-artifact'],
  ['red-wilds-companion-visual-v2','visual-artifact'],
  ['red-wilds-companion-visual-v3','visual-artifact'],
  ['red-wilds-image-mutation-lab','visual-artifact'],
  ['red-wilds-video-ingest-v4','media-artifact'],
  ['red-wilds-companion-v4','media-artifact'],
  ['red-wilds-three-perspective-contract','game-contract'],
  ['private-media-ingest-2026-09-14','private-media-artifact'],
  ['private-music-source-2026-09-14','private-media-artifact'],
  ['companion-style-profile-v3','game-profile'],
  ['companion-style-profile-v4','game-profile']
];
for(const [id,domain] of targets){
  const work=findInInventory(inventory,id);
  assert.ok(work,`current-chat artifact missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.provenanceStatus,'known-from-current-chat');
  assert.equal(work.publicationStatus,'unresolved');
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved');
  assert.deepEqual(work.sourceLocations,[],`${id} must not expose private/local artifact paths`);
}
for(const work of inventory.works.filter(w=>w.provenanceStatus==='known-from-current-chat')){
  assert.doesNotMatch(work.canonicalName,/100000\d+|ultrasound|\.jpe?g$|\.png$|\.mp4$|\.webm$/i,`unsafe source-derived public label: ${work.id}`);
  assert.deepEqual(work.sourceLocations,[],`current-chat artifact path leaked: ${work.id}`);
}
assert.ok(inventory.generatedFrom.some(x=>x.path==='navigation/context-horizon/current-chat-artifact-seeds.json'));
console.log(`PASS ${targets.length} current-chat artifacts preserved without publishing private source filenames or local paths`);
