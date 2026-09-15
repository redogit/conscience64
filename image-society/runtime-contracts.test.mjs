import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createArtifactRegistry, registerArtifact, getArtifact } from './artifacts.mjs';
import { buildCheckpoint, checkpointDigest, buildActiveContext } from './checkpoint.mjs';
import { validateVisualDifference, validateContinuityPack } from './contracts.mjs';
import { evaluatePromotionGate } from './gates.mjs';
import { createLedger, appendEvent } from './ledger.mjs';
import { createRegressionCorpus, recordDefect, recordReplay, queryDefects } from './regression.mjs';
import { loadRolePrompts, validateRolePromptPackage } from './prompts.mjs';

test('artifact registry preserves parent lineage and rejects ID collision with different hash', () => {
  const r = createArtifactRegistry();
  registerArtifact(r, { artifact_id: 'a1', sha256: 'a'.repeat(64), parent_artifact_ids: [] });
  registerArtifact(r, { artifact_id: 'a2', sha256: 'b'.repeat(64), parent_artifact_ids: ['a1'] });
  assert.deepEqual(getArtifact(r, 'a2').parent_artifact_ids, ['a1']);
  assert.throws(() => registerArtifact(r, { artifact_id: 'a1', sha256: 'c'.repeat(64) }), /collision/);
});

test('visual difference requires requested delta before successor interpretation', () => {
  assert.throws(() => validateVisualDifference({ before_artifact_id: 'a1' }), /requested_delta/);
  const diff = validateVisualDifference({
    before_artifact_id: 'a1', after_artifact_id: 'a2', requested_delta: 'fix hands',
    observed_delta: ['hands improved'], unintended_delta: ['jacket changed'], remaining_gap: ['finger fusion']
  });
  assert.equal(diff.requested_delta, 'fix hands');
});

test('continuity pack distinguishes protected and variable traits', () => {
  const pack = validateContinuityPack({
    pack_id: 'char-main-v1', version: '1', entities: [{
      entity_id: 'hero', protected_traits: ['identity'], variable_traits: ['jacket color']
    }]
  });
  assert.deepEqual(pack.entities[0].protected_traits, ['identity']);
  assert.deepEqual(pack.entities[0].variable_traits, ['jacket color']);
});

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

test('active context keeps unresolved defects and bounded source event IDs', () => {
  const cp = buildCheckpoint(fixtureStateWithDefect('face-drift'));
  const active = buildActiveContext(cp, { maxRecentCorrections: 8, maxSourceEventIds: 100 });
  assert.ok(active.unresolved_issues.some(x => x.defect_id === 'face-drift'));
  assert.ok(active.source_event_ids.length > 0 && active.source_event_ids.length <= 100);
});

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

test('regression corpus preserves successful and failed correction history', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, { defect_id: 'hand-face-drift', category: 'continuity', source_event_ids: ['e4'] });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e8', result: 'failed' });
  recordReplay(corpus, { defect_id: 'hand-face-drift', event_id: 'e9', result: 'passed' });
  assert.deepEqual(queryDefects(corpus, { category: 'continuity' })[0].replays.map(x => x.result), ['failed', 'passed']);
});

test('regression corpus rejects duplicate replay event IDs for one defect', () => {
  const corpus = createRegressionCorpus();
  recordDefect(corpus, { defect_id: 'text-legibility', category: 'accessibility', source_event_ids: ['e1'] });
  recordReplay(corpus, { defect_id: 'text-legibility', event_id: 'e2', result: 'failed' });
  assert.throws(() => recordReplay(corpus, { defect_id: 'text-legibility', event_id: 'e2', result: 'passed' }), /duplicate replay/);
});

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
