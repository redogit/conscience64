import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {generateInventorySnapshot,findInInventory} from './work-inventory.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const inventory=await generateInventorySnapshot(repoRoot);

const unresolved=[
  ['you-only-think-once','model-research'],
  ['hydrovoltaic-power-water-pod','engineering'],
  ['cooperative-ecs-project','research-governance'],
  ['data-driven-ecs-world-v0-5-0','software-research'],
  ['minimal-ir-destruction-study','research'],
  ['semantic-invariance-falsification','research'],
  ['moonshot-cycle-1-harness','experiment'],
  ['moonshot-cycle-2-harness','experiment'],
  ['moonshot-cycle-3-harness','experiment'],
  ['accessible-workmate-jaws2025','accessibility-software'],
  ['excel-report-assistant','professional-automation'],
  ['member-success-jira-forge','professional-operations'],
  ['rivir-external-api-js-sdk','software-research'],
  ['algorithm-harness-v2','software-research'],
  ['grand-unified-perceptron','model-research'],
  ['orbit-master-2-6-tw1-access3','knowledge-system'],
  ['sliding-window-spacy','software-research']
];
for(const [id,domain] of unresolved){
  const work=findInInventory(inventory,id);
  assert.ok(work,`Library/prior-chat work missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved',`${id} promoted without admitted public source`);
  assert.deepEqual(work.sourceLocations,[],`${id} leaked a private Library/source path`);
}

const cli=findInInventory(inventory,'redogit-python-cli');
assert.ok(cli,'REDOGIT Python CLI missing');
assert.equal(cli.domain,'software-tool');
assert.equal(cli.preservationStatus,'located');
assert.equal(cli.publicationStatus,'public');
assert.ok(cli.sourceLocations.includes('github:redogit/redogit/tools/redogit.py'));
assert.ok(cli.notes.some(x=>/status.*check.*run.*public-status/i.test(x)));

for(let i=1;i<=9;i++){
  const id=`deterministic-semantic-kernel-v0-${i}`;
  const work=findInInventory(inventory,id);
  assert.ok(work,`semantic-kernel release missing: ${id}`);
  assert.equal(work.domain,'software-research-release');
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved');
}
assert.ok(findInInventory(inventory,'deterministic-semantic-kernel-v0-6').predecessors.includes('deterministic-semantic-kernel-v0-5'));
assert.ok(findInInventory(inventory,'deterministic-semantic-kernel-v0-5').successors.includes('deterministic-semantic-kernel-v0-6'));

assert.ok(inventory.generatedFrom.some(x=>x.path==='navigation/context-horizon/library-discovery-seeds.json'));
console.log(`PASS ${unresolved.length} Library/prior-chat works, 9 semantic-kernel releases, and the public REDOGIT CLI remain separately preserved`);
