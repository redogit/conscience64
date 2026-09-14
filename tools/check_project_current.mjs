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

const mmo = current.softwareBoundaryRecords.find(record => record.id === 'mmo-world-beta');
assert.ok(mmo, 'MMO World software boundary missing');
assert.equal(mmo.canonicalRoot, 'play/mmo-world/');
assert.equal(mmo.localExtension?.id, 'arcade-forge');
assert.equal(mmo.localExtension?.authority, 'LOCAL_PREVIEW_ONLY');
assert.ok(!mmo.localExtension?.path.startsWith('play/mmo/'), 'retired play/mmo tree must not become canonical');
const forgeContract = JSON.parse(await readFile(new URL(`../${mmo.localExtension.contract}`, import.meta.url), 'utf8'));
assert.equal(forgeContract.executionModel, 'data-only');
assert.equal(forgeContract.security.executablePluginCode, false);
assert.equal(forgeContract.security.networkAuthority, false);
assert.equal(forgeContract.security.serverAuthority, false);
assert.equal(forgeContract.security.prizeAuthority, false);
assert.equal(forgeContract.authority.localPluginReward, 'preview metadata only; not applied to canonical game state');
const forgeRuntime = await readFile(new URL(`../${mmo.localExtension.runtime}`, import.meta.url), 'utf8');
assert.ok(forgeRuntime.includes('unsupported field'), 'Forge runtime must reject unknown fields');
assert.ok(forgeRuntime.includes('stored plugin shelf is corrupt; it was not overwritten'), 'Forge runtime must fail visibly on corrupt shelf');

const analytics = current.analyticsContinuation;
assert.ok(analytics, 'analytics continuation missing');
assert.equal(analytics.status, 'LOCAL_LIVE_SERVICE_IMPLEMENTED_REMOTE_DEPLOYMENT_NOT_ESTABLISHED');
assert.equal(analytics.independence, 'same-source');
assert.match(analytics.sourceRevision, /^[0-9a-f]{40}$/);
assert.equal(typeof analytics.sourceWorkflowRun, 'number');

const liveService = await readFile(new URL(`../${analytics.liveService}`, import.meta.url), 'utf8');
assert.ok(liveService.includes('Last-Event-ID'), 'live analytics service must carry resume semantics');
assert.ok(liveService.includes('allow-public-read'), 'live analytics service must make public-read exposure explicit');

const recordedEvent = JSON.parse(await readFile(new URL(`../${analytics.recordedEvent}`, import.meta.url), 'utf8'));
assert.equal(recordedEvent.revision, analytics.sourceRevision);
assert.equal(recordedEvent.source, `github-actions:${analytics.sourceWorkflowRun}`);
assert.equal(recordedEvent.independence, 'same-source');
assert.equal(recordedEvent.kind, 'TESTED');
assert.equal(recordedEvent.status, 'passed');

for (const invariant of [
  'USER_INPUT != ASSISTANT_SYNTHESIS',
  'REQUESTED != IMPLEMENTED',
  'IMPLEMENTED != VERIFIED',
  'OBSERVATION != INTERPRETATION',
  'REPETITION != VERIFICATION',
  'TRANSPORT_VALIDITY != EVIDENCE_VALIDITY',
  'DEMO_DATA != RESEARCH_EVIDENCE',
  'STATIC_VIEW != AUTHORITATIVE_LEDGER',
  'LOCAL_LIVE_SERVICE != REMOTE_PRODUCTION_DEPLOYMENT',
  'PRODUCER_EVENT_ID != CANONICAL_LEDGER_EVENT_ID',
  'REPLAYED_EVENT != NEW_EXECUTION',
  'CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE',
  'PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO',
  'DATA_ONLY_PLUGIN != EXECUTABLE_CODE',
  'LOCAL_PLUGIN_PREVIEW != CANONICAL_GAME_STATE',
  'LOCAL_PLUGIN != SERVER_AUTHORITY'
]) assert.ok(current.addedInvariants.includes(invariant), `missing invariant: ${invariant}`);

console.log(`PASS current research manifest: ${base.projects.length} preserved base + ${successorIds.length} forward-only successors = ${current.currentHumanReadableProjectCount} current records; two-day ledger, software boundaries, Arcade Forge, and live analytics continuation verified.`);
