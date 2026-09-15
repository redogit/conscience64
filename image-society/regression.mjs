import { deepFreeze } from './contracts.mjs';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createRegressionCorpus() {
  return { defects: new Map() };
}

export function recordDefect(corpus, defect) {
  if (!corpus?.defects) throw new TypeError('invalid regression corpus');
  const defect_id = String(defect?.defect_id ?? '').trim();
  if (!defect_id) throw new TypeError('defect_id is required');
  if (corpus.defects.has(defect_id)) throw new Error(`duplicate defect_id: ${defect_id}`);
  const source_event_ids = defect.source_event_ids ?? [];
  if (!Array.isArray(source_event_ids) || source_event_ids.some(x => typeof x !== 'string')) {
    throw new TypeError('source_event_ids must be an array of strings');
  }
  const record = {
    defect_id,
    category: String(defect.category ?? 'other'),
    description: defect.description == null ? '' : String(defect.description),
    source_event_ids: [...source_event_ids],
    severity: defect.severity == null ? 'unknown' : String(defect.severity),
    replays: [],
    replay_event_ids: new Set()
  };
  corpus.defects.set(defect_id, record);
  return deepFreeze({ ...clone(record), replay_event_ids: undefined });
}

export function recordReplay(corpus, replay) {
  if (!corpus?.defects) throw new TypeError('invalid regression corpus');
  const defect_id = String(replay?.defect_id ?? '').trim();
  const event_id = String(replay?.event_id ?? '').trim();
  const result = String(replay?.result ?? '').trim();
  if (!defect_id || !event_id) throw new TypeError('defect_id and event_id are required');
  if (!['passed', 'failed', 'unresolved', 'skipped'].includes(result)) throw new TypeError('result must be passed, failed, unresolved, or skipped');
  const defect = corpus.defects.get(defect_id);
  if (!defect) throw new Error(`unknown defect_id: ${defect_id}`);
  if (defect.replay_event_ids.has(event_id)) throw new Error(`duplicate replay event_id ${event_id} for ${defect_id}`);
  const row = deepFreeze({ defect_id, event_id, result, notes: replay.notes == null ? undefined : String(replay.notes) });
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
    severity: record.severity,
    replays: record.replays.map(clone)
  });
}

export function queryDefects(corpus, filter = {}) {
  let rows = [...corpus.defects.values()];
  if (filter.category != null) rows = rows.filter(row => row.category === filter.category);
  if (filter.severity != null) rows = rows.filter(row => row.severity === filter.severity);
  if (filter.result != null) rows = rows.filter(row => row.replays.some(replay => replay.result === filter.result));
  rows.sort((a, b) => a.defect_id.localeCompare(b.defect_id));
  return deepFreeze(rows.map(publicDefect));
}
