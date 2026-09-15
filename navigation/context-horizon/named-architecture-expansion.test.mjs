import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {generateInventorySnapshot, findInInventory} from './work-inventory.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const inventory=await generateInventorySnapshot(repoRoot);

const unresolved=[
  ['operator-mind','research'],
  ['open-mind-ontology-of-mind','philosophy-research'],
  ['shared-well-common-substrate','research'],
  ['operator-library','knowledge-system'],
  ['operator-theory','research'],
  ['primitive-operator-experiments','experiment'],
  ['nested-learning','model-research'],
  ['validated-operator-reuse-nested-timescales','model-research'],
  ['capability-wasm-v3','software-research'],
  ['cuedoor-clean-room-lineage','software-research'],
  ['subject-conditioned-token-mass-proposal','research'],
  ['rule-trigger-gate-task','experiment'],
  ['v0-3-rule-gate-branch','experiment'],
  ['unfinished-long-run','experiment'],
  ['society-orchestration-architecture','research-governance'],
  ['recover-bound-build-test-review-admit','methodology'],
  ['semantic-cross-reference-map','knowledge-system'],
  ['governed-applicability-gate','methodology'],
  ['remote-research-update-boundary','system-design']
];
for(const [id,domain] of unresolved){
  const work=findInInventory(inventory,id);
  assert.ok(work,`named architecture missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved',`${id} was promoted without admitted public source`);
  assert.deepEqual(work.sourceLocations,[],`${id} invented a public source path`);
}

const located=[
  ['renderer-society','software-research','play/mmo/simple/renderer-society/README.md'],
  ['visual-carrier-v2','visual-system','play/mmo/simple/visual-carrier-v2/'],
  ['ecs-video-carrier','media-system','play/mmo/simple/ECS.md'],
  ['knowledge-bridge','knowledge-system','knowledge/README.md'],
  ['reality-canon','game-contract','play/mmo/REALITY_CANON.md'],
  ['arcade-forge','game-tool','play/mmo/forge.html'],
  ['redline-character-cooperation','game-contract','play/mmo-world/redline/'],
  ['context-horizon-13dpp','site-navigation','navigation/context-horizon/'],
  ['space-lens','site-navigation','index.html'],
  ['compass4d-navigation','navigation-system','space-lens-master.js'],
  ['local-live-ingestion','software-research','analytics/server.py'],
  ['public-research-updates','publication-system','research/projects/public-updates/'],
  ['source-ingress','research-system','research/source-ingress/']
];
for(const [id,domain,path] of located){
  const work=findInInventory(inventory,id);
  assert.ok(work,`located subsystem missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.preservationStatus,'located',`${id} lost located status`);
  assert.equal(work.publicationStatus,'public',`${id} public source status lost`);
  assert.ok(work.sourceLocations.includes(path),`${id} missing exact public source ${path}`);
}

assert.notEqual(findInInventory(inventory,'operator-mind').id,findInInventory(inventory,'operator-moonshot').id);
assert.notEqual(findInInventory(inventory,'operator-library').id,findInInventory(inventory,'orbit-library').id);
assert.notEqual(findInInventory(inventory,'renderer-society').id,findInInventory(inventory,'visual-carrier-v2').id);
assert.notEqual(findInInventory(inventory,'knowledge-bridge').id,findInInventory(inventory,'semantic-cross-reference-map').id);
console.log(`PASS ${unresolved.length} unresolved architectures and ${located.length} located subsystems remain individually preserved`);
