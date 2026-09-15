import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {generateInventorySnapshot,findInInventory} from './work-inventory.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const inventory=await generateInventorySnapshot(repoRoot);

const repaired=[
  ['explorer-cpp23-v0-1-1-test-harness-repair','explorer-cpp23','FIXED_BOUNDED'],
  ['carrier-field-sat-v0-2-1-integrity-repair','carrier-field-sat','FIXED_BOUNDED_WITH_OPEN_EVIDENCE_GAPS'],
  ['orbit-master-2-6-tw1-access3-r1-revalidation-repair','orbit-master-2-6-tw1-access3','FIXED_BOUNDED_ACCESSIBILITY_GATE_OPEN'],
  ['sliding-window-spacy-runtime-validation-repair','sliding-window-spacy','FIXED_BOUNDED'],
  ['observer-v6-partial-history-r1-repair','observer-v6-partial-history','REPAIRED_SUCCESSOR'],
  ['stage32-operational-codec-r1-regenerator','stage32-operational-codec','REGENERATED_WITH_OPEN_DEFINITION_GAPS'],
  ['pareidolia-guard-v4-r1-repair','pareidolia-guard','REPAIRED_WITH_EMPIRICAL_VALIDITY_OPEN']
];

for(const [id,parent,status] of repaired){
  const work=findInInventory(inventory,id);
  const predecessor=findInInventory(inventory,parent);
  assert.ok(work,`repair successor missing: ${id}`);
  assert.ok(predecessor,`repair predecessor missing: ${parent}`);
  assert.equal(work.domain,'repair-artifact',`${id} domain changed`);
  assert.equal(work.state,'successor',`${id} must be a successor`);
  assert.equal(work.publicationStatus,'unresolved',`${id} must not become public merely because Library recovery exists`);
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved');
  assert.deepEqual(work.sourceLocations,[],`${id} leaked private Library path`);
  assert.ok(work.predecessors.includes(parent),`${id} lost predecessor ${parent}`);
  assert.ok(predecessor.successors.includes(id),`${parent} lost successor ${id}`);
  assert.ok(work.notes.some(x=>x.includes(status)),`${id} lost bounded ledger status ${status}`);
}

const exactReleases=[
  ['computer-mind-lab-gate1b-v1-1-release','computer-mind-lab','EXACT_ARCHIVE_IDENTITY_RECOVERED'],
  ['operator-mind-convergence-o1-1-v1-1-release','o1-1-v1-1','RECOVERED_HISTORICAL_RELEASE'],
  ['operator-moonshot-education-handoff-2026-08-07','operator-moonshot-education','RECOVERED_COMPLETE_HANDOFF'],
  ['governed-nested-learning-prototype-release','nested-learning','RECOVERED_ADJACENT_BRANCH'],
  ['structured-solver-sandbox-v0-3-terminal-release','structured-solver-sandbox','RECOVERED_TERMINAL_SOURCE_RELEASE']
];
for(const [id,parent,status] of exactReleases){
  const work=findInInventory(inventory,id);
  const predecessor=findInInventory(inventory,parent);
  assert.ok(work,`historical release missing: ${id}`);
  assert.ok(predecessor,`historical release parent missing: ${parent}`);
  assert.equal(work.domain,'historical-release');
  assert.equal(work.state,'preserved');
  assert.equal(work.publicationStatus,'unresolved');
  assert.deepEqual(work.sourceLocations,[],`${id} must not expose private archive path`);
  assert.ok(work.predecessors.includes(parent));
  assert.ok(predecessor.successors.includes(id));
  assert.ok(work.notes.some(x=>x.includes(status)));
}

assert.equal(findInInventory(inventory,'carrier-field-sat').state,'unresolved');
assert.equal(findInInventory(inventory,'explorer-cpp23').state,'unresolved');
assert.equal(findInInventory(inventory,'computer-mind-lab').id,'computer-mind-lab','release must not replace project identity');
assert.equal(findInInventory(inventory,'deterministic-semantic-kernel-v0-5').successors.includes('deterministic-semantic-kernel-v0-6'),true,'existing historical successor chain must survive');
assert.ok(inventory.generatedFrom.some(x=>x.path==='navigation/context-horizon/repair-successor-seeds.json'));
console.log(`PASS ${repaired.length} repair successors and ${exactReleases.length} historical releases preserve predecessor lineage and bounded evidence`);
