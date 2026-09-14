// Open-scope records; hashes establish record integrity, never semantic truth.
export const storageKey = 'redogit.knowledge-history.v1';
export const schema = 'redogit/knowledge-history/1';
export const maxBytes = 2_000_000;
const maxEntries = 200;
export const fields = [
  ['title', 'Name this work', 'An idea, practice, question, object, relationship, or other subject.', true],
  ['situation', 'What situation are we working with?', 'Include the people, materials, circumstances, and boundaries that matter.', true],
  ['content', 'Current idea or proposed repair', 'Record the actual content or procedure so this revision can be recovered.', true],
  ['reason', 'Why make this change?', 'Identify the specific failure or need. Why is this change sufficient, and what should be preserved?', true],
  ['support', 'What supports it?', 'Separate observations, interpretations, reasoning, and results. Unknown is an acceptable answer.'],
  ['sources', 'Where did the material come from?', 'Record exact source identities, links, versions, dates, and which support is independent.'],
  ['checks', 'What was checked, and what happened?', 'Include contrary evidence, failures, assumptions, scope, and checks still needed.'],
  ['effects', 'Who or what could be affected?', 'Include practical consequences, obligations, relationships, and tradeoffs.'],
  ['dependencies', 'What depends on this?', 'Record related items, parts and wholes, people’s recorded models, or other dependencies and what needs rechecking.'],
  ['perspectives', 'What other perspectives could matter?', 'Free text: experience, practice, culture, disciplines, or perspectives not named yet. Examples never close the scope.'],
  ['freshness', 'What could have changed?', 'Consider evidence age, lost access, changed circumstances, and dependency drift (Knowledge Decay).'],
  ['remainder', 'What remains unresolved?', 'Keep unknowns, alternatives, contradictions, missing voices, and next contextual questions visible.']
];
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const idOK = x => typeof x === 'string' && /^[0-9a-f-]{36}$/.test(x);
const bytes = x => new TextEncoder().encode(x).length;
const assert = (x, m) => { if (!x) throw Error(m); };
function shape(value, names) {
  assert(plain(value) && Object.keys(value).sort().join('|') === [...names].sort().join('|'), 'Unexpected record fields.');
}
function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (plain(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
export async function digest(record) {
  const {sha256, ...body} = record;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(body))))]
    .map(x => x.toString(16).padStart(2, '0')).join('');
}
export function empty() { return {schema, entries: [], heads: {}}; }
function validateData(data) {
  shape(data, fields.map(f => f[0]));
  for (const [key, label, , required] of fields) {
    assert(typeof data[key] === 'string' && data[key].length <= 20000, label + ': use at most 20,000 characters.');
    if (required) assert(data[key].trim(), label + ' is required.');
  }
  assert(data.title.length <= 200, 'Use at most 200 characters for the name.');
}
export async function validate(log) {
  shape(log, ['schema', 'entries', 'heads']);
  assert(log.schema === schema && Array.isArray(log.entries) && plain(log.heads), 'Invalid knowledge history.');
  assert(log.entries.length <= maxEntries && bytes(JSON.stringify(log)) <= maxBytes, 'History capacity exceeded. Export your history; no records were pruned.');
  const known = new Map(), subjects = new Set();
  for (const r of log.entries) {
    shape(r, ['id', 'subject', 'parent', 'kind', 'restoredFrom', 'at', 'data', 'sha256']);
    assert(idOK(r.id) && idOK(r.subject) && !known.has(r.id), 'Invalid or duplicate revision identity.');
    assert(typeof r.at === 'string' && Number.isFinite(Date.parse(r.at)), 'Invalid revision date.');
    validateData(r.data);
    assert(r.parent === null ? !subjects.has(r.subject) : known.get(r.parent)?.subject === r.subject, 'Missing, reordered, or cross-subject predecessor.');
    if (r.kind === 'restore') {
      const target = known.get(r.restoredFrom);
      assert(r.parent !== null && target?.subject === r.subject && canonical(target.data) === canonical(r.data), 'Invalid restore lineage or content.');
    } else assert(r.kind === 'revision' && r.restoredFrom === null, 'Invalid revision kind.');
    assert(r.sha256 === await digest(r), 'Revision digest mismatch.');
    known.set(r.id, r); subjects.add(r.subject);
  }
  assert(Object.keys(log.heads).length === subjects.size, 'Missing subject head.');
  for (const [subject, head] of Object.entries(log.heads)) assert(idOK(subject) && known.get(head)?.subject === subject, 'Invalid current revision.');
  return log;
}
export async function read(store) {
  const raw = store.getItem(storageKey);
  if (raw === null) return empty();
  assert(bytes(raw) <= maxBytes, 'History exceeds 2 MB.');
  return validate(JSON.parse(raw));
}
function write(store, log) { store.setItem(storageKey, JSON.stringify(log)); }
// UI callers hold a shared Web Lock. expectedParent prevents stale-tab writes.
export async function append(store, {subject = null, expectedParent = null, data, restoredFrom = null}) {
  const log = await read(store);
  if (subject === null) { assert(expectedParent === null && restoredFrom === null, 'A new subject needs a new root.'); subject = crypto.randomUUID(); }
  else assert(Object.hasOwn(log.heads, subject), 'Unknown subject.');
  assert((log.heads[subject] || null) === expectedParent, 'This work changed in another tab. Export your draft, then reload this work before saving.');
  if (restoredFrom !== null) {
    const target = log.entries.find(r => r.id === restoredFrom && r.subject === subject);
    assert(target, 'Unknown restore target.'); data = target.data;
  }
  validateData(data);
  const r = {id: crypto.randomUUID(), subject, parent: expectedParent, kind: restoredFrom ? 'restore' : 'revision', restoredFrom, at: new Date().toISOString(), data: structuredClone(data)};
  r.sha256 = await digest(r);
  log.entries.push(r); log.heads[subject] = r.id;
  await validate(log);
  write(store, log); // one atomic localStorage write; quota failure leaves the previous log intact
  return r;
}
export async function importLog(store, raw) {
  assert(bytes(raw) <= maxBytes, 'Import exceeds 2 MB.');
  const incoming = await validate(JSON.parse(raw)), log = await read(store);
  const known = new Map(log.entries.map(r => [r.id, r]));
  for (const r of incoming.entries) {
    if (known.has(r.id)) assert(canonical(known.get(r.id)) === canonical(r), 'Conflicting revision identity.');
    else { log.entries.push(r); known.set(r.id, r); }
  }
  // Existing selections stay current; imported branches remain available for inspection.
  for (const [s, h] of Object.entries(incoming.heads)) if (!Object.hasOwn(log.heads, s)) log.heads[s] = h;
  await validate(log); write(store, log); return log;
}
