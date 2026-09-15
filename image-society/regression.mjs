import { deepFreeze } from './contracts.mjs';

export const REGRESSION_RESULTS = Object.freeze(['passed', 'failed', 'inconclusive']);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stringArray(name, value = []) {
  if (!Array.isArray(value) || value.some(x => typeof x !== 'string')) throw new TypeError(`${name} must be an array of strings`);
  return [...value];
}

export function createRegressionCorpus() {
  return { defects: new Map() };
}

export function recordDefect(corpus, defect) {
  if (!corpus?.defects) throw new TypeError('invalid regression corpus');
  const defect_id = String(defect?.defect_id ?? '').trim();
  if (!defect_id) throw new TypeError('defect_id is required');
  if (corpus.defects.has(defect_id)) throw new Error(`duplicate defect_id: ${defect_id}`);
  const record = {
    defect_id,
    category: String(defect.category ?? 'other'),
    description: defect.description == null ? '' : String(defect.description),
    source_event_ids: stringArray('source_event_ids', defect.source_event_ids),
    source_artifact_ids: stringArray('source_artifact_ids', defect.source_artifact_ids),
    protected_invariants: stringArray('protected_invariants', defect.protected_invariants),
    successful_corrections: stringArray('successful_corrections', defect.successful_corrections),
    failed_corrections: stringArray('failed_corrections', defect.failed_corrections),
    replays: [],
    replay_event_ids: new Set()
  };
  corpus.defects.set(defect_id, record);
  return publicDefect(record);
}

export function recordReplay(corpus, replay) {
  if (!corpus?.defects) throw new TypeError('invalid regression corpus');
  const defect_id = String(replay?.defect_id ?? '').trim();
  const event_id = String(replay?.event_id ?? '').trim();
  const result = String(replay?.result ?? '').trim();
  if (!defect_id || !event_id) throw new TypeError('defect_id and event_id are required');
  if (!REGRESSION_RESULTS.includes(result)) throw new TypeError(`result must be one of ${REGRESSION_RESULTS.join(', ')}`);
  const defect = corpus.defects.get(defect_id);
  if (!defect) throw new Error(`unknown defect_id: ${defect_id}`);
  if (defect.replay_event_ids.has(event_id)) throw new Error(`duplicate replay event_id ${event_id} for ${defect_id}`);
  const row = deepFreeze({ event_id, result, ...(replay.notes == null ? {} : { notes: String(replay.notes) }) });
  defect.replays.push(row);
  defect.replay_event_ids.add(event_id);
  return row;
}

function publicDefect(record) {
  return deepFreeze({
    defect_id: record.defect_id,
    category: record.category,
    description: record.description,
    source_event_ids: [...record.source_event_ids],
    source_artifact_ids: [...record.source_artifact_ids],
    protected_invariants: [...record.protected_invariants],
    successful_corrections: [...record.successful_corrections],
    failed_corrections: [...record.failed_corrections],
    replays: record.replays.map(clone)
  });
}

export function queryDefects(corpus, filter = {}) {
  let rows = [...corpus.defects.values()];
  if (filter.category != null) rows = rows.filter(row => row.category === filter.category);
  if (filter.result != null) rows = rows.filter(row => row.replays.some(replay => replay.result === filter.result));
  rows.sort((a, b) => a.defect_id.localeCompare(b.defect_id));
  return deepFreeze(rows.map(publicDefect));
}
