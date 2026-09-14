import {fields, read, append, importLog, maxBytes} from './knowledge-state.mjs';
const $ = id => document.getElementById(id), area = $('knowledge');
if (location.hash === '#knowledge') area.open = true;
const node = (tag, text) => { const n = document.createElement(tag); n.textContent = text; return n; };
let subject = null, base = null, busy = false, dirty = false;
const inputs = new Map();
for (const [key, label, hint, required] of fields) {
  const group = node('div', ''), lab = node('label', label + (required ? ' (required)' : ''));
  const input = document.createElement(key === 'title' ? 'input' : 'textarea');
  input.id = 'knowledge-' + key; input.maxLength = key === 'title' ? 200 : 20000;
  input.required = Boolean(required); if (key !== 'title') input.rows = 3;
  lab.htmlFor = input.id; const help = node('small', hint); help.id = input.id + '-help';
  input.setAttribute('aria-describedby', help.id); input.oninput = () => { dirty = true; };
  group.append(lab, help, input); inputs.set(key, input);
  $(required ? 'knowledge-core' : 'knowledge-context').append(group);
}
const data = () => Object.fromEntries([...inputs].map(([k, n]) => [k, n.value]));
function fill(record) {
  subject = record?.subject || null; base = record?.id || null;
  for (const [key, input] of inputs) input.value = record?.data[key] || '';
  dirty = false; $('knowledge-ready').checked = false;
  $('knowledge-current').textContent = record ? (record.kind === 'restore' ? 'Restored content — renewed review required. Later evidence and warnings remain in the history below.' : 'Recorded revision — assess the supporting material and its limits.') + ' Saved ' + record.at : 'New work — nothing saved yet.';
}
function discardOK() { return !dirty || confirm('This form has unsaved changes. Export the draft to keep them. Discard these changes?'); }
function download(name, raw) {
  const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'})), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function render() {
  const log = await read(localStorage), select = $('knowledge-subject');
  select.replaceChildren(); const first = node('option', 'New work'); first.value = ''; select.append(first);
  for (const [s, h] of Object.entries(log.heads)) {
    const head = log.entries.find(r => r.id === h), opt = node('option', head.data.title + ' · ' + s.slice(0, 8)); opt.value = s; select.append(opt);
  }
  select.value = subject || '';
  $('knowledge-records').replaceChildren();
  const records = log.entries.filter(r => r.subject === subject);
  for (const [i, r] of records.entries()) {
    const li = node('li', ''), detail = node('details', ''), summary = node('summary', 'Revision ' + (i + 1) + ' · ' + r.at + (log.heads[r.subject] === r.id ? ' · Current' : '') + (r.kind === 'restore' ? ' · Restored; review required' : ''));
    detail.append(summary, node('p', 'ID: ' + r.id + '\nPredecessor: ' + (r.parent || 'Original record') + (r.restoredFrom ? '\nRecovered from: ' + r.restoredFrom : '')));
    const previous = log.entries.find(x => x.id === r.parent);
    const changed = fields.filter(([k]) => !previous || previous.data[k] !== r.data[k]);
    detail.append(node('p', 'Changed fields: ' + (changed.map(f => f[1]).join('; ') || 'Content unchanged; restoration event recorded.')));
    for (const [key, label] of fields) {
      detail.append(node('h3', label), node('p', r.data[key] || 'Not recorded — remains unknown.'));
      if (previous && previous.data[key] !== r.data[key]) detail.append(node('small', 'Previously: ' + (previous.data[key] || 'Not recorded')));
    }
    detail.append(node('small', 'SHA-256: ' + r.sha256));
    const restore = node('button', 'Restore revision ' + (i + 1)); restore.type = 'button';
    restore.onclick = () => act(async () => {
      if (!$('knowledge-ready').checked) throw Error('Save or export your current draft, then acknowledge the restore.');
      const saved = await append(localStorage, {subject, expectedParent: base, restoredFrom: r.id});
      fill(saved); $('knowledge-status').textContent = 'Restored as a new revision. Earlier and later records are retained. Review current evidence and affected dependencies before using this content.';
    });
    detail.append(restore); li.append(detail); $('knowledge-records').append(li);
  }
  $('knowledge-count').textContent = records.length + ' revisions for this work; ' + log.entries.length + ' of 200 total retained in this browser. Nothing is silently pruned.';
}
async function act(fn, lock = true) {
  if (busy) return; busy = true;
  area.querySelectorAll('input,textarea,select,button').forEach(n => n.disabled = true);
  try {
    if (lock) { if (!navigator.locks) throw Error('This browser needs Web Locks for safe saves and imports. You can still export your draft or history.'); await navigator.locks.request('redogit-knowledge-history', fn); }
    else await fn();
    await render();
  } catch (e) { $('knowledge-status').textContent = e.message; }
  finally { busy = false; area.querySelectorAll('input,textarea,select,button').forEach(n => n.disabled = false); }
}
$('knowledge-form').onsubmit = e => { e.preventDefault(); act(async () => {
  const saved = await append(localStorage, {subject, expectedParent: base, data: data()});
  fill(saved); $('knowledge-status').textContent = 'Revision saved locally. Recorded support is not automatically verified.';
}); };
$('knowledge-subject').onchange = e => {
  const next = e.target.value;
  if (!discardOK()) { e.target.value = subject || ''; return; }
  act(async () => { const log = await read(localStorage); fill(next ? log.entries.find(r => r.id === log.heads[next]) : null); }, false);
};
$('knowledge-reload').onclick = () => { if (discardOK()) act(async () => { const log = await read(localStorage); fill(subject ? log.entries.find(r => r.id === log.heads[subject]) : null); }, false); };
$('knowledge-export').onclick = () => act(async () => { download('redogit-knowledge-history.json', JSON.stringify(await read(localStorage), null, 2)); $('knowledge-status').textContent = 'History exported, including all saved revisions.'; }, false);
$('knowledge-draft').onclick = () => { download('redogit-knowledge-draft.json', JSON.stringify({schema: 'redogit/knowledge-draft/1', subject, base, data: data()}, null, 2)); $('knowledge-status').textContent = 'Draft exported for reference. A draft is not an importable revision history.'; };
$('knowledge-import').onchange = () => act(async () => {
  const file = $('knowledge-import').files[0]; if (!file) return;
  if (file.size > maxBytes) throw Error('Import exceeds 2 MB.');
  await importLog(localStorage, await file.text()); $('knowledge-import').value = '';
  $('knowledge-status').textContent = 'History merged. Existing current revisions and this draft are unchanged. Select newly imported work to inspect it.';
});
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
await act(async () => { fill(null); }, false);
