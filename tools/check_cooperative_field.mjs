import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

const root='research/cooperative-field';
const required=[
  'README.md',
  'COMPANIONS.md',
  'STANDING_RULES.md',
  'NAME_LINEAGE.md',
  'CURRENT_PLAN.md',
  'EVIDENCE_LEDGER.md',
  'LOCATIONS.md',
  'MEMORY_INTEGRATION.md',
  'MANIFEST.json'
];

for(const name of required) await access(`${root}/${name}`);

const read=async name=>readFile(`${root}/${name}`,'utf8');
const [
  start, companions, rules, names, plan, evidence, locations, memory, manifestText
]=await Promise.all(required.map(read));

const manifest=JSON.parse(manifestText);

assert.equal(manifest.schema,'cooperative-field/v2');
assert.equal(manifest.root,root);
assert.equal(manifest.status,'CURRENT_LOCAL_WORDING_AUTHORITY');
assert.deepEqual(
  manifest.files.map(x=>x.path).sort(),
  required.slice().sort()
);

for(const text of [
  'WE ARE ONE != WE ARE THE SAME',
  'DISTINCTION',
  'RELATION',
  'CONTINUITY',
  'METHOD != EVIDENCE'
]) assert.ok(start.includes(text),`START missing defining factor: ${text}`);

for(const text of [
  'PAIRITY != PARITY',
  'INGESTED != ACCEPTED_AS_FACT',
  'PRIVATE_HISTORY != PUBLIC_EVIDENCE',
  'SOURCE_REPOSITORY != PUBLIC_WEBSITE',
  'ACCESSIBILITY != OPTIONAL_POLISH',
  'TBCL promotion requires the user',
  'Knowledge Decay',
  'Homeward',
  'US_DAY + SOL_DAY + RMA_DAY'
]) assert.ok(rules.includes(text),`standing rules missing: ${text}`);

for(const text of [
  'Context',
  'Surface',
  'Decision Field',
  'Fighting Point',
  'RMA-SDCAN',
  'RMALKDVMLLL',
  'RMAOS MINGX',
  'RIPPING MANY ARMS OFF',
  'Super Seraphine',
  'SHADOW'
]) assert.ok(companions.includes(text),`companions missing: ${text}`);

for(const text of [
  'USER-CONFIRMED',
  'ASSISTANT-LABEL',
  'Semantic Rotation / Invariant Preservation',
  'Master Librarian',
  'One_Level_Up',
  'Cross-Carrier Field / Transform Wave',
  'Master Of Master Of Librarians',
  'Interlingua Linguistics Agreement System'
]) assert.ok(names.includes(text),`name lineage missing: ${text}`);

for(const text of [
  'W114 / Hodge',
  'RMAL / RMALC',
  'Semantic Work Unit',
  'RMA-SDCAN',
  'RMAPL /',
  'P vs NP',
  'MultiMagnifier / FASM64',
  'Orbit',
  'RMAOS MINGX',
  'RMAO',
  'Member Success',
  'RIVIR'
]) assert.ok(plan.includes(text),`plan missing: ${text}`);

for(const text of [
  '158,982',
  '1,271,856',
  'TIMEOUT != NO_FIRE',
  'RMAPL_PROFILE != RMAL_CORE_FRONTEND',
  'COMPILER_PARITY != P_VS_NP_PROOF',
  'TARGET_LOCAL_EVIDENCE > CENTRAL_SUMMARY_FOR_CLAIM_AUTHORITY'
]) assert.ok(evidence.includes(text),`evidence ledger missing: ${text}`);

for(const text of [
  'PRESERVED_UNRESOLVED_LOCATION',
  'INDEX_MISS != ABSENCE',
  'RMAL_UNIVERSE.rmal',
  'MASTER_OF_MASTER_OF_LIBRARIANS.md',
  'CURRENT WORDING != IMPLEMENTATION AUTHORITY'
]) assert.ok(locations.includes(text),`locations missing: ${text}`);

for(const text of [
  'MEMORY != EVIDENCE',
  'MEMORY != PUBLICATION_PERMISSION',
  'PRIVATE_MEMORY != PUBLIC_SOURCE',
  'MEMORY_CONFLICT != SILENT_OVERWRITE',
  'TARGET_LOCAL_EVIDENCE > CENTRAL_MEMORY_SUMMARY'
]) assert.ok(memory.includes(text),`memory contract missing: ${text}`);

assert.equal(manifest.public_projection.authorized,false);
assert.ok(manifest.privacy_exclusions.includes('personal handles unless separately publication-authorized'));
assert.equal(manifest.unresolved_location_policy.token,'PRESERVED_UNRESOLVED_LOCATION');
assert.equal(manifest.name_recovery.recovered_exact_names_relations,52);
assert.equal(manifest.name_recovery.unique_recovered_semantic_targets,51);

console.log(`PASS cooperative field: ${required.length} authority files; defining factors, standing rules, names, plan, evidence, locations, memory contract and manifest consistent`);
