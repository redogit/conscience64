import { sha256Canonical } from './canonical.mjs';
import { allArtifacts } from './artifacts.mjs';
import { deepFreeze } from './contracts.mjs';
import { ledgerDigest } from './ledger.mjs';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function collectUnresolved(events) {
  const out = [];
  const seen = new Set();
  for (const event of events) {
    for (const observation of event.observations ?? []) {
      const unresolved = observation.unresolved === true || observation.status === 'unresolved';
      if (!unresolved) continue;
      const defect_id = String(observation.defect_id ?? observation.observation_id ?? `${event.event_id}:${out.length + 1}`);
      if (seen.has(defect_id)) continue;
      seen.add(defect_id);
      out.push({
        defect_id,
        category: observation.category ?? 'other',
        severity: observation.severity ?? 'info',
        statement: observation.statement ?? '',
        source_event_id: event.event_id
      });
    }
  }
  return out;
}

function collectCorrectionPatterns(events, succeeded) {
  const rows = [];
  for (const event of events) {
    if ((event.status === 'succeeded') !== succeeded) continue;
    for (const correction of event.corrections ?? []) {
      rows.push({
        correction_id: correction.correction_id ?? null,
        category: correction.category ?? null,
        intended_delta: correction.intended_delta ?? null,
        source_event_id: event.event_id
      });
    }
  }
  return rows;
}

export function buildCheckpoint({ ledger, artifacts, previousCheckpoint = null, budget = {} } = {}) {
  if (!ledger?.runManifest || !Array.isArray(ledger.events)) throw new TypeError('checkpoint requires a ledger');
  const artifactRows = artifacts ? allArtifacts(artifacts) : [];
  const candidateStates = new Set(['experimental', 'candidate', 'authority-reviewed-candidate']);
  const acceptedStates = new Set(['accepted-noncanonical', 'human-approved-asset', 'promoted-canonical']);
  const candidates = artifactRows.filter(a => candidateStates.has(a.status)).map(a => a.artifact_id).sort();
  const accepted = artifactRows.filter(a => acceptedStates.has(a.status)).map(a => a.artifact_id).sort();
  const rejected = artifactRows.filter(a => a.status === 'rejected').map(a => a.artifact_id).sort();
  const source_event_ids = ledger.events.map(e => e.event_id);
  const semantic_state = {
    schema: 'conscience64/image-society/checkpoint-state/v1',
    run_id: ledger.runManifest.run_id,
    ledger_digest: ledgerDigest(ledger),
    through_event_count: ledger.events.length,
    accepted_artifact_ids: accepted,
    candidate_artifact_ids: candidates,
    rejected_artifact_ids: rejected,
    active_constraints: previousCheckpoint?.semantic_state?.active_constraints ?? [],
    unresolved_issues: collectUnresolved(ledger.events),
    successful_correction_patterns: collectCorrectionPatterns(ledger.events, true),
    failed_correction_patterns: collectCorrectionPatterns(ledger.events, false),
    authority_notes: previousCheckpoint?.semantic_state?.authority_notes ?? [],
    accessibility_notes: previousCheckpoint?.semantic_state?.accessibility_notes ?? [],
    continuity_versions: previousCheckpoint?.semantic_state?.continuity_versions ?? [],
    budget: clone(budget),
    source_event_ids
  };
  const semantic_digest = sha256Canonical(semantic_state);
  return deepFreeze({
    schema: 'conscience64/image-society/checkpoint/v1',
    checkpoint_id: `checkpoint:${semantic_digest}`,
    semantic_digest,
    semantic_state
  });
}

export function checkpointDigest(checkpoint) {
  if (!checkpoint?.semantic_state) throw new TypeError('invalid checkpoint');
  return sha256Canonical(checkpoint.semantic_state);
}

export function buildActiveContext(checkpoint, options = {}) {
  if (!checkpoint?.semantic_state) throw new TypeError('invalid checkpoint');
  const maxRecentCorrections = Math.max(0, Number(options.maxRecentCorrections ?? 8) || 0);
  const maxSourceEventIds = Math.max(1, Number(options.maxSourceEventIds ?? 200) || 200);
  const state = checkpoint.semantic_state;
  return deepFreeze({
    schema: 'conscience64/image-society/active-context/v1',
    checkpoint_id: checkpoint.checkpoint_id,
    checkpoint_digest: checkpointDigest(checkpoint),
    run_id: state.run_id,
    accepted_artifact_ids: [...state.accepted_artifact_ids],
    candidate_artifact_ids: [...state.candidate_artifact_ids],
    active_constraints: clone(state.active_constraints),
    unresolved_issues: clone(state.unresolved_issues),
    recent_successful_corrections: clone(state.successful_correction_patterns.slice(-maxRecentCorrections)),
    recent_failed_corrections: clone(state.failed_correction_patterns.slice(-maxRecentCorrections)),
    authority_notes: clone(state.authority_notes),
    accessibility_notes: clone(state.accessibility_notes),
    continuity_versions: clone(state.continuity_versions),
    budget: clone(state.budget),
    source_event_ids: state.source_event_ids.slice(-maxSourceEventIds)
  });
}
