import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const base = JSON.parse(await readFile(new URL('../research/projects/projects.json', import.meta.url), 'utf8'));
const current = JSON.parse(await readFile(new URL('../research/projects/CURRENT.json', import.meta.url), 'utf8'));

assert.equal(current.schema, 'conscience64/research-project-current/v1');
assert.equal(current.forwardOnly, true);
assert.equal(base.version, current.baseRegistry.version);
assert.equal(base.projects.length, current.baseRegistry.projectCount);
assert.equal(current.browserApiProjection.projectCount, base.projects.length);
assert.equal(current.browserApiProjection.status, 'LEGACY_SNAPSHOT_UNCHANGED');

const baseIds = new Set(base.projects.map(project => project.id));
assert.equal(baseIds.size, base.projects.length);
const successorIds = current.successorRecords.map(project => project.id);
assert.equal(new Set(successorIds).size, successorIds.length);
for (const id of successorIds) assert.ok(!baseIds.has(id));
assert.equal(current.currentHumanReadableProjectCount, base.projects.length + successorIds.length);
for (const project of current.successorRecords) {
  const text = await readFile(new URL(`../${project.path}`, import.meta.url), 'utf8');
  assert.match(text, /^# /);
  assert.equal(project.authorityTransfer, false);
}

assert.equal(current.twoDayInputStateLedger.verbatimTranscript, false);
const ledger = await readFile(new URL(`../${current.twoDayInputStateLedger.path}`, import.meta.url), 'utf8');
for (const required of ['USER_INPUT != ASSISTANT_SYNTHESIS','REQUESTED != IMPLEMENTED','IMPLEMENTED != VERIFIED','PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO','Neither `P = NP` nor `P != NP`','Hodge conjecture remains open']) assert.ok(ledger.includes(required));

for (const record of current.softwareBoundaryRecords || []) {
  assert.equal(record.researchGraphAdmission, false);
  const text = await readFile(new URL(`../${record.path}`, import.meta.url), 'utf8');
  assert.match(text, /^# /);
}

const mmo = current.softwareBoundaryRecords.find(record => record.id === 'mmo-world-beta');
assert.ok(mmo);
assert.equal(mmo.canonicalRoot, 'play/mmo-world/');
assert.equal(mmo.localExtension?.id, 'arcade-forge');
assert.equal(mmo.localExtension?.authority, 'LOCAL_PREVIEW_ONLY');
assert.ok(!mmo.localExtension?.path.startsWith('play/mmo/'));

const forgeContract = JSON.parse(await readFile(new URL(`../${mmo.localExtension.contract}`, import.meta.url), 'utf8'));
assert.equal(forgeContract.version, '1.2.0');
assert.deepEqual(forgeContract.mechanics, ['choice','input','creative','timing']);
assert.equal(forgeContract.executionModel, 'data-only');
assert.equal(forgeContract.security.executablePluginCode, false);
assert.equal(forgeContract.security.networkAuthority, false);
assert.equal(forgeContract.security.serverAuthority, false);
assert.equal(forgeContract.security.prizeAuthority, false);
assert.equal(forgeContract.security.pluginSuppliedClockOrTimer, false);
assert.match(forgeContract.authority.timingMeasurement, /not an accessibility gate/);

const forgeRuntime = await readFile(new URL(`../${mmo.localExtension.runtime}`, import.meta.url), 'utf8');
assert.ok(forgeRuntime.includes("timing: new Set(['minDelayMs','maxDelayMs','falseStartReward'])"));
assert.ok(forgeRuntime.includes('unsupported field'));
assert.ok(forgeRuntime.includes('stored plugin shelf is corrupt; it was not overwritten'));
const timingRuntime = await readFile(new URL(`../${mmo.localExtension.timingRuntime}`, import.meta.url), 'utf8');
assert.ok(timingRuntime.includes('performance.now()'));
assert.ok(timingRuntime.includes('false-start'));
assert.ok(timingRuntime.includes('practiceNow'));

const starter = mmo.localExtension?.starterPack;
assert.ok(starter);
assert.equal(starter.validatedRecipeCount, 10);
assert.equal(starter.retiredRuntimeAdaptations, 9);
assert.equal(starter.ordinaryLifeExamples, 1);
assert.equal(starter.redline, 'CORE_INTERACTION_SEMANTICS_ADAPTED_OLD_STATE_AUTHORITY_NOT_PRESERVED');
assert.deepEqual(starter.redlineTiming, { minDelayMs:900, maxDelayMs:2700, falseStart:true, clock:'TRUSTED_RUNTIME_MONOTONIC', reactionThreshold:null, accessibilityGate:false });
const pluginDir = new URL(`../${starter.path}`, import.meta.url);
const pluginFiles = (await readdir(pluginDir)).filter(name => name.endsWith('.json')).sort();
assert.equal(pluginFiles.length, starter.validatedRecipeCount);
assert.ok(pluginFiles.includes('redline-classic.json'));
const redline = JSON.parse(await readFile(new URL('redline-classic.json', pluginDir), 'utf8'));
assert.equal(redline.mechanic, 'timing');
assert.equal(redline.minDelayMs, 900);
assert.equal(redline.maxDelayMs, 2700);
assert.equal(redline.falseStartReward.xp, 3);
const pluginLineage = await readFile(new URL('README.md', pluginDir), 'utf8');
assert.match(pluginLineage, /CORE_INTERACTION_SEMANTICS_ADAPTED/);
assert.match(pluginLineage, /OLD_STATE_AUTHORITY_NOT_PRESERVED/);
assert.match(pluginLineage, /no reaction-time pass\/fail threshold/i);

const analytics = current.analyticsContinuation;
assert.ok(analytics);
assert.equal(analytics.status, 'LOCAL_LIVE_SERVICE_IMPLEMENTED_REMOTE_DEPLOYMENT_NOT_ESTABLISHED');
assert.equal(analytics.independence, 'same-source');
assert.match(analytics.sourceRevision, /^[0-9a-f]{40}$/);
assert.equal(typeof analytics.sourceWorkflowRun, 'number');
const liveService = await readFile(new URL(`../${analytics.liveService}`, import.meta.url), 'utf8');
assert.ok(liveService.includes('Last-Event-ID'));
assert.ok(liveService.includes('allow-public-read'));
const recordedEvent = JSON.parse(await readFile(new URL(`../${analytics.recordedEvent}`, import.meta.url), 'utf8'));
assert.equal(recordedEvent.revision, analytics.sourceRevision);
assert.equal(recordedEvent.independence, 'same-source');

for (const invariant of [
  'USER_INPUT != ASSISTANT_SYNTHESIS','REQUESTED != IMPLEMENTED','IMPLEMENTED != VERIFIED','OBSERVATION != INTERPRETATION','REPETITION != VERIFICATION','TRANSPORT_VALIDITY != EVIDENCE_VALIDITY','DEMO_DATA != RESEARCH_EVIDENCE','STATIC_VIEW != AUTHORITATIVE_LEDGER','LOCAL_LIVE_SERVICE != REMOTE_PRODUCTION_DEPLOYMENT','PRODUCER_EVENT_ID != CANONICAL_LEDGER_EVENT_ID','REPLAYED_EVENT != NEW_EXECUTION','CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE','PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO','DATA_ONLY_PLUGIN != EXECUTABLE_CODE','PLUGIN_DATA != TRUSTED_RUNTIME_CODE','LOCAL_PLUGIN_PREVIEW != CANONICAL_GAME_STATE','LOCAL_PLUGIN != SERVER_AUTHORITY','SOURCE_STATE_ADAPTATION != BEHAVIORAL_IDENTITY','REACTION_TIME_PREVIEW != ACCESSIBILITY_GATE','REACTION_TIME != PLAYER_WORTH','UNREPRESENTABLE != SILENTLY_OMITTED'
]) assert.ok(current.addedInvariants.includes(invariant), `missing invariant: ${invariant}`);

console.log(`PASS current research manifest: ${base.projects.length} preserved base + ${successorIds.length} forward-only successors = ${current.currentHumanReadableProjectCount} current records; ${starter.validatedRecipeCount} Arcade recipes including bounded Redline timing admission; live analytics and evidence boundaries verified.`);
