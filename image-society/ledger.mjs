import { sha256Canonical } from './canonical.mjs';
import { deepFreeze, validateRunManifest, validateTurnEvent } from './contracts.mjs';

export function createLedger(runManifest) {
  const manifest = validateRunManifest(runManifest);
  return {
    runManifest: manifest,
    events: [],
    eventIds: new Set(),
    branchSequences: new Map()
  };
}

export function appendEvent(ledger, event) {
  if (!ledger?.eventIds || !ledger?.branchSequences || !Array.isArray(ledger.events)) throw new TypeError('invalid ledger');
  const id = String(event?.event_id ?? '').trim();
  if (ledger.eventIds.has(id)) throw new Error(`duplicate event_id: ${id}`);
  const branch = String(event?.branch_id ?? '').trim();
  const next = (ledger.branchSequences.get(branch) ?? 0) + 1;
  const row = validateTurnEvent(event, { run_id: ledger.runManifest.run_id, sequence_no: next });
  ledger.events.push(row);
  ledger.eventIds.add(row.event_id);
  ledger.branchSequences.set(row.branch_id, row.sequence_no);
  return row;
}

export function eventsForBranch(ledger, branchId) {
  return deepFreeze(ledger.events.filter(event => event.branch_id === branchId).map(event => structuredClone(event)));
}

export function replayLedger(events, runManifest = null) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  if (!events.length && !runManifest) throw new TypeError('runManifest is required when replaying an empty ledger');
  const manifest = runManifest ?? {
    run_id: events[0].run_id,
    max_calls: Math.max(1, events.filter(e => ['generate','variation','edit'].includes(e.event_type)).length || 1)
  };
  const ledger = createLedger(manifest);
  for (const event of events) appendEvent(ledger, { ...event, sequence_no: undefined });
  return ledger;
}

export function ledgerDigest(ledger) {
  return sha256Canonical({ run_manifest: ledger.runManifest, events: ledger.events });
}
