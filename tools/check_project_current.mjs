import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = JSON.parse(await readFile(new URL('../research/projects/projects.json', import.meta.url), 'utf8'));
const current = JSON.parse(await readFile(new URL('../research/projects/CURRENT.json', import.meta.url), 'utf8'));

assert.equal(current.schema, 'conscience64/research-project-current/v1');
assert.equal(current.forwardOnly, true);
assert.equal(base.version, current.baseRegistry.version);
assert.equal(base.projects.length, current.baseRegistry.projectCount);
assert.equal(current.browserApiProjection.projectCount, base.projects.length);
assert.equal(current.browserApiProjection.status, 'LEGACY_SNAPSHOT_UNCHANGED');

const baseIds = new Set(base.projects.map(project => project.id));
assert.equal(baseIds.size, base.projects.length, 'base project IDs must be unique');
const successorIds = current.successorRecords.map(project => project.id);
assert.equal(new Set(successorIds).size, successorIds.length, 'successor project IDs must be unique');
for (const id of successorIds) assert.ok(!baseIds.has(id), `successor ${id} already exists in base registry`);
assert.equal(current.currentHumanReadableProjectCount, base.projects.length + successorIds.length);

for (const project of current.successorRecords) {
  const text = await readFile(new URL(`../${project.path}`, import.meta.url), 'utf8');
  assert.match(text, /^# /, `${project.path} must be a human-readable record`);
  assert.equal(project.authorityTransfer, false);
}

assert.equal(current.twoDayInputStateLedger.verbatimTranscript, false);
const ledger = await readFile(new URL(`../${current.twoDayInputStateLedger.path}`, import.meta.url), 'utf8');
for (const required of [
  'USER_INPUT != ASSISTANT_SYNTHESIS',
  'REQUESTED != IMPLEMENTED',
  'IMPLEMENTED != VERIFIED',
  'PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO',
  'Neither `P = NP` nor `P != NP`',
  'Hodge conjecture remains open'
]) assert.ok(ledger.includes(required), `two-day ledger missing boundary: ${required}`);

for (const record of current.softwareBoundaryRecords || []) {
  assert.equal(record.researchGraphAdmission, false);
  const text = await readFile(new URL(`../${record.path}`, import.meta.url), 'utf8');
  assert.match(text, /^# /, `${record.path} must be a human-readable software boundary record`);
}

for (const invariant of [
  'USER_INPUT != ASSISTANT_SYNTHESIS',
  'REQUESTED != IMPLEMENTED',
  'IMPLEMENTED != VERIFIED',
  'OBSERVATION != INTERPRETATION',
  'REPETITION != VERIFICATION',
  'TRANSPORT_VALIDITY != EVIDENCE_VALIDITY',
  'DEMO_DATA != RESEARCH_EVIDENCE',
  'STATIC_VIEW != AUTHORITATIVE_LEDGER',
  'CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE',
  'PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO'
]) assert.ok(current.addedInvariants.includes(invariant), `missing invariant: ${invariant}`);

console.log(`PASS current research manifest: ${base.projects.length} preserved base + ${successorIds.length} forward-only successors = ${current.currentHumanReadableProjectCount} current records; two-day ledger and software boundary records verified.`);
