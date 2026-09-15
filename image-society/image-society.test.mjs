import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, sha256Canonical } from './canonical.mjs';
import { validateRunManifest } from './contracts.mjs';

test('canonicalJson is insensitive to object key insertion order', () => {
  const a = { z: 2, a: { y: 4, x: 3 } };
  const b = { a: { x: 3, y: 4 }, z: 2 };
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(sha256Canonical(a), sha256Canonical(b));
});

test('run manifest rejects an unbounded call budget', () => {
  assert.throws(() => validateRunManifest({ run_id: 'r1', max_calls: 0 }), /max_calls/);
});

test('run manifest accepts a bounded 1000-call configuration', () => {
  const out = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'pilot-1000',
    max_calls: 1000,
    max_parallelism: 8,
    max_retries_per_call: 2,
    checkpoint_every_events: 25,
    summary_every_events: 10,
    max_branches: 32,
    promotion_mode: 'manual',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(out.max_calls, 1000);
  assert.equal(out.promotion_mode, 'manual');
  assert.equal(Object.isFrozen(out), true);
});

test('run manifest supports explicitly bounded long-horizon runs through one million logical calls', () => {
  const out = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'future-250k',
    max_calls: 250000,
    max_parallelism: 16,
    max_retries_per_call: 1,
    checkpoint_every_events: 100,
    summary_every_events: 50,
    max_branches: 128,
    promotion_mode: 'disabled',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(out.max_calls, 250000);
  assert.throws(() => validateRunManifest({ ...out, max_calls: 1000001 }), /max_calls/);
});

import { createLedger, appendEvent, eventsForBranch, ledgerDigest } from './ledger.mjs';

test('ledger assigns monotonic branch sequence and preserves failed events', () => {
  const ledger = createLedger({ run_id: 'r1', max_calls: 10 });
  appendEvent(ledger, {
    event_id: 'e1', branch_id: 'main', event_type: 'generate',
    status: 'succeeded', input_artifact_ids: [], output_artifact_ids: ['a1']
  });
  appendEvent(ledger, {
    event_id: 'e2', branch_id: 'main', event_type: 'critique',
    status: 'failed-provider', input_artifact_ids: ['a1'], output_artifact_ids: []
  });
  const rows = eventsForBranch(ledger, 'main');
  assert.deepEqual(rows.map(x => x.sequence_no), [1, 2]);
  assert.equal(rows[1].status, 'failed-provider');
  assert.match(ledgerDigest(ledger), /^[0-9a-f]{64}$/);
});

test('ledger rejects duplicate event IDs', () => {
  const ledger = createLedger({ run_id: 'r1', max_calls: 10 });
  const row = { event_id: 'e1', branch_id: 'main', event_type: 'plan', status: 'succeeded' };
  appendEvent(ledger, row);
  assert.throws(() => appendEvent(ledger, row), /duplicate event_id/);
});

test('turn events receive explicit non-authoritative actor and authority defaults', () => {
  const ledger = createLedger({ run_id: 'r-defaults', max_calls: 1 });
  const row = appendEvent(ledger, { event_id: 'e-defaults', branch_id: 'main', event_type: 'plan', status: 'succeeded' });
  assert.equal(row.actor.actor_type, 'system');
  assert.equal(row.authority_state.canonical, false);
  assert.equal(row.authority_state.world_checked, false);
});

import { createArtifactRegistry, registerArtifact, getArtifact } from './artifacts.mjs';
import { validateVisualDifference, validateContinuityPack } from './contracts.mjs';

test('artifact registry preserves parent lineage and rejects ID collision with different hash', () => {
  const r = createArtifactRegistry();
  registerArtifact(r, { artifact_id: 'a1', sha256: 'a'.repeat(64), parent_artifact_ids: [] });
  registerArtifact(r, { artifact_id: 'a2', sha256: 'b'.repeat(64), parent_artifact_ids: ['a1'] });
  assert.deepEqual(getArtifact(r, 'a2').parent_artifact_ids, ['a1']);
  assert.throws(() => registerArtifact(r, { artifact_id: 'a1', sha256: 'c'.repeat(64) }), /collision/);
});

test('visual difference preserves protected invariants and separates intended from unintended delta', () => {
  assert.throws(() => validateVisualDifference({ difference_id: 'd1', before_artifact_id: 'a1' }), /requested_delta/);
  const diff = validateVisualDifference({
    difference_id: 'd1', before_artifact_id: 'a1', after_artifact_id: 'a2', requested_delta: 'fix hands',
    protected_invariants: ['face', 'pose'],
    observed_intended_delta: ['hands improved'],
    observed_unintended_delta: ['jacket changed'],
    remaining_error: ['finger fusion'],
    comparison_evidence: ['before:a1', 'after:a2'],
    recommendation: 'iterate-targeted-edit'
  });
  assert.equal(diff.requested_delta, 'fix hands');
  assert.deepEqual(diff.protected_invariants, ['face', 'pose']);
  assert.deepEqual(diff.observed_unintended_delta, ['jacket changed']);
});

test('continuity pack distinguishes protected and variable traits and records prohibited drift', () => {
  assert.throws(() => validateContinuityPack({ pack_id: 'bad', version: '1', entities: [], environment_rules: [], style_rules: [] }), /prohibited_drift/);
  const pack = validateContinuityPack({
    pack_id: 'char-main-v1', version: '1', entities: [{
      entity_id: 'hero', protected_traits: ['identity'], variable_traits: ['jacket color'], authority_class: 'human-approved-working-rule'
    }],
    environment_rules: ['ordinary-world grounding'],
    material_rules: ['credible fabric'],
    style_rules: ['photoreal'],
    prohibited_drift: ['identity drift'],
    source_refs: ['artifact:a1']
  });
  assert.deepEqual(pack.entities[0].protected_traits, ['identity']);
  assert.deepEqual(pack.entities[0].variable_traits, ['jacket color']);
  assert.deepEqual(pack.prohibited_drift, ['identity drift']);
});

import { buildCheckpoint, checkpointDigest, buildActiveContext } from './checkpoint.mjs';

function fixtureState() {
  const ledger = createLedger({ run_id: 'cp-run', max_calls: 10 });
  appendEvent(ledger, {
    event_id: 'cp-e1', branch_id: 'main', event_type: 'generate', status: 'succeeded',
    input_artifact_ids: [], output_artifact_ids: ['cp-a1'],
    observations: [{ category: 'artifact-quality', severity: 'info', statement: 'candidate created' }]
  });
  const artifacts = createArtifactRegistry();
  registerArtifact(artifacts, { artifact_id: 'cp-a1', sha256: 'd'.repeat(64), parent_artifact_ids: [], status: 'candidate' });
  return { ledger, artifacts, budget: { call_count: 1, token_in: 10, token_out: 5, cost: 0 } };
}

function fixtureStateWithDefect(defectId) {
  const state = fixtureState();
  appendEvent(state.ledger, {
    event_id: 'cp-e2', branch_id: 'main', event_type: 'critique', status: 'succeeded',
    input_artifact_ids: ['cp-a1'], output_artifact_ids: [],
    observations: [{ defect_id: defectId, category: 'continuity', severity: 'major', statement: 'drift remains unresolved', unresolved: true }]
  });
  return state;
}

test('same preserved ledger state yields byte-identical checkpoint identity', () => {
  const a = buildCheckpoint(fixtureState());
  const b = buildCheckpoint(fixtureState());
  assert.equal(checkpointDigest(a), checkpointDigest(b));
  assert.deepEqual(a.semantic_state, b.semantic_state);
});

test('active context keeps unresolved defects and source event IDs', () => {
  const cp = buildCheckpoint(fixtureStateWithDefect('face-drift'));
  const active = buildActiveContext(cp, { maxRecentCorrections: 8, maxSourceEventIds: 100 });
  assert.ok(active.unresolved_issues.some(x => x.defect_id === 'face-drift'));
  assert.ok(active.source_event_ids.length > 0);
});

test('checkpoint separates accepted, candidate, and rejected artifact classifications', () => {
  const state = fixtureState();
  registerArtifact(state.artifacts, { artifact_id: 'cp-a2', sha256: 'e'.repeat(64), parent_artifact_ids: ['cp-a1'], status: 'accepted-noncanonical' });
  registerArtifact(state.artifacts, { artifact_id: 'cp-a3', sha256: 'f'.repeat(64), parent_artifact_ids: ['cp-a1'], status: 'rejected' });
  const cp = buildCheckpoint(state);
  assert.deepEqual(cp.semantic_state.candidate_artifact_ids, ['cp-a1']);
  assert.deepEqual(cp.semantic_state.accepted_artifact_ids, ['cp-a2']);
  assert.deepEqual(cp.semantic_state.rejected_artifact_ids, ['cp-a3']);
});

import { evaluatePromotionGate } from './gates.mjs';

test('model consensus cannot promote without explicit human approval', () => {
  const result = evaluatePromotionGate(
    { artifact_id: 'a1', status: 'authority-reviewed-candidate', critical_unresolved: [] },
    { provenance: 'pass', continuity: 'pass', accessibility: 'pass', authority: 'pass', model_votes: 100, reality_classification: 'game-reconstruction' },
    { target: 'mmo-production-canon', human_approval: null }
  );
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('human-approval-required'));
});

test('critical unresolved defects block promotion', () => {
  const result = evaluatePromotionGate(
    { artifact_id: 'a1', status: 'authority-reviewed-candidate', critical_unresolved: ['unsupported-science-claim'] },
    { provenance: 'pass', continuity: 'pass', accessibility: 'pass', authority: 'pass', reality_classification: 'game-reconstruction' },
    { target: 'mmo-production-canon', human_approval: { actor_id: 'human', approved_at: '2026-09-14T00:00:00Z' } }
  );
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('critical-unresolved-defects'));
});

test('noncanonical acceptance does not require human canon approval', () => {
  const result = evaluatePromotionGate(
    { artifact_id: 'a1', status: 'candidate', critical_unresolved: [] },
    { provenance: 'pass' },
    { target: 'accepted-noncanonical', human_approval: null }
  );
  assert.equal(result.allowed, true);
});

import { createRegressionCorpus, recordDefect, recordReplay, queryDefects } from './regression.mjs';

test('regression corpus preserves successful and failed correction history', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, {
    defect_id: 'hand-face-drift', category: 'continuity', source_event_ids: ['e4'], source_artifact_ids: ['a4'],
    protected_invariants: ['face identity'], successful_corrections: ['c9'], failed_corrections: ['c8']
  });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e8', result: 'failed' });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e9', result: 'passed' });
  const record = queryDefects(corpus, { category: 'continuity' })[0];
  assert.deepEqual(record.replays.map(x => x.result), ['failed', 'passed']);
  assert.deepEqual(record.protected_invariants, ['face identity']);
  assert.deepEqual(record.successful_corrections, ['c9']);
  assert.deepEqual(record.failed_corrections, ['c8']);
});

test('regression corpus rejects replay results outside the declared contract', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, { defect_id: 'd-contract', category: 'other', source_event_ids: [] });
  assert.throws(() => recordReplay(corpus, { defect_id: 'd-contract', event_id: 'e-contract', result: 'skipped' }), /result/);
});

test('regression corpus rejects duplicate replay event IDs for one defect', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, { defect_id: 'text-legibility', category: 'accessibility', source_event_ids: ['e1'] });
  recordReplay(corpus, { defect_id: 'text-legibility', event_id: 'e2', result: 'failed' });
  assert.throws(() => recordReplay(corpus, { defect_id: 'text-legibility', event_id: 'e2', result: 'passed' }), /duplicate replay/);
});

import { readFileSync } from 'node:fs';
import { loadRolePrompts, validateRolePromptPackage } from './prompts.mjs';

test('role prompt package contains every required stable role contract', () => {
  const pkg = loadRolePrompts();
  const validated = validateRolePromptPackage(pkg);
  const required = [
    'director','scene-builder','generator','repairer','semantic-critic','composition-critic',
    'continuity-critic','accessibility-critic','authority-critic','provenance-keeper','integrator','summarizer'
  ].map(x => `image-society/${x}/v1`);
  assert.deepEqual(validated.roles.map(x => x.role_id).sort(), required.sort());
  for (const role of validated.roles) {
    assert.ok(role.inputs.length > 0);
    assert.ok(role.output_contract && typeof role.output_contract === 'object');
    assert.ok(role.evidence_boundary.length > 0);
    assert.ok(role.stop_conditions.length > 0);
  }
  assert.ok(validated.global_invariants.includes('GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON'));
});

test('role prompt package rejects duplicate stable IDs', () => {
  const pkg = loadRolePrompts();
  assert.throws(() => validateRolePromptPackage({ ...pkg, roles: [...pkg.roles, pkg.roles[0]] }), /duplicate role_id/);
});

test('machine-readable schema retains run, event, and checkpoint definitions', () => {
  const schema = JSON.parse(readFileSync(new URL('./schema/image-society.v1.schema.json', import.meta.url), 'utf8'));
  assert.ok(schema.$defs.runManifest);
  assert.ok(schema.$defs.turnEvent);
  assert.ok(schema.$defs.checkpoint);
});
