import * as core from './core.mjs';
import { languages, translate, messages } from './i18n.mjs';

const app = document.body.dataset.app;
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let locale = params.get('lang') || navigator.language?.split('-')[0] || 'en';
if (!languages[locale]) locale = 'en';
let state = app === 'home' ? null : core.initial(app);
let undone = [], removedNote = null, activeCell = 0;
let dirty = false;
let compared = false;
addEventListener('beforeunload', event => {
  const draft = app === 'orbit' && ['note-title', 'note-text', 'note-source'].some(id => $(id)?.value);
  if (dirty || draft) { event.preventDefault(); event.returnValue = ''; }
});
document.getElementById('workspace')?.addEventListener('input', event => { if (event.target.id !== 'search') dirty = true; });
const key = `conscience64.play.v1.${app}`;
const t = (key, values) => translate(locale, key, values);
const announce = (key, error = false) => {
  if (!$('status')) return;
  $('status').textContent = t(key);
  $('status').classList.toggle('error', error);
};
function fail(error) { announce(messages.en[error.message] ? error.message : 'invalid-data', true); }
function node(tag, text, className = '') {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function writing(el, value, lang = '') {
  el.textContent = value;
  el.dir = 'auto';
  // An unknown writing language must not inherit the interface language.
  el.setAttribute('lang', lang);
  return el;
}
function button(key, action, label) {
  const el = node('button', t(key), 'secondary');
  el.type = 'button';
  if (label) el.setAttribute('aria-label', label);
  el.addEventListener('click', action);
  return el;
}
function download(contents, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = node('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('downloaded');
}
function syncFields() {
  if (app === 'weave') { $('original').value = state.original; $('writing-language').value = state.language; }
  if (app === 'garden') { $('pattern-title').value = state.title; $('description').value = state.description; }
  if (app === 'steps') {
    $('goal').value = state.title; $('writing-language').value = state.language;
    for (const key of core.PLAN_FIELDS) $(`plan-${key}`).value = state.fields[key];
  }
  if (app === 'compare') {
    for (const key of ['original', 'revision', 'source', 'originalLanguage', 'revisionLanguage']) $(`compare-${key}`).value = state[key];
    compared = false;
  }
}
function translatePage() {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
  document.querySelectorAll('[data-project-link]').forEach(el => {
    const url = new URL(el.getAttribute('href'), location.href); url.searchParams.set('lang', locale); el.href = url;
  });
  $('language').value = locale;
  document.title = `${t(app === 'home' ? 'home' : app)} · Conscience64`;
  if ($('status')) $('status').textContent = '';
  render();
}
$('language').addEventListener('change', () => {
  locale = $('language').value;
  const url = new URL(location.href); url.searchParams.set('lang', locale); history.replaceState(null, '', url);
  translatePage();
});

function renderOrbit() {
  const list = $('notes'); list.replaceChildren();
  const found = core.search(state.items, $('search').value);
  $('note-count').textContent = new Intl.NumberFormat(locale).format(found.length);
  if (!found.length) list.append(node('p', t(state.items.length ? 'noMatches' : 'empty'), 'empty'));
  for (const item of found) {
    const card = node('article', undefined, 'note-card'); card.dataset.note = item.id;
    card.append(writing(node('h3'), item.title, item.language), writing(node('p', undefined, 'user-text'), item.text, item.language));
    if (item.language) card.append(writing(node('span', undefined, 'source-language'), item.language, 'en'));
    if (item.source) {
      const p = node('p'), a = node('a'); a.href = item.source; a.rel = 'noreferrer'; a.referrerPolicy = 'no-referrer';
      a.append(node('span', `${t('sourceOpen')}: `), writing(node('bdi'), item.source, ''));
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      p.append(a); card.append(p);
    }
    card.append(button('remove', () => {
      removedNote = { item, index: state.items.findIndex(r => r.id === item.id) };
      state.items = state.items.filter(r => r.id !== item.id); dirty = true; renderOrbit(); $('undo-note').focus(); announce('removed');
    }, `${t('remove')}: ${item.title}`));
    list.append(card);
  }
  $('undo-note').disabled = !removedNote;
}
if (app === 'orbit') {
  $('note-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const item = { id: crypto.randomUUID(), title: $('note-title').value, text: $('note-text').value, source: $('note-source').value, language: $('writing-language').value.trim() };
      state = core.validate(app, { items: [...state.items, item] });
      dirty = true;
      $('note-form').reset(); $('search').value = ''; renderOrbit(); $('note-title').focus(); announce('added');
    } catch (error) { fail(error); }
  });
  $('search').addEventListener('input', renderOrbit);
  $('undo-note').addEventListener('click', () => {
    if (!removedNote) return;
    try {
      const items = [...state.items]; items.splice(removedNote.index, 0, removedNote.item);
      state = core.validate(app, { items }); dirty = true; removedNote = null; renderOrbit(); $('search').focus(); announce('changed');
    } catch (error) { fail(error); }
  });
  $('example').addEventListener('click', () => {
    $('note-title').value = t('exampleTitle'); $('note-text').value = t('exampleNote'); $('writing-language').value = locale;
    $('note-source').value = ''; $('note-title').focus();
  });
}

function renderWeave(focus) {
  const source = core.lines(state.original), list = $('line-list'); list.replaceChildren();
  $('counts').textContent = t('counts', { lines: new Intl.NumberFormat(locale).format(source.length), chars: new Intl.NumberFormat(locale).format(core.characterCount(state.original, locale)) });
  for (const [position, originalIndex] of state.order.entries()) {
    const li = node('li', undefined, 'line-tile'), label = t('line', { n: position + 1 });
    li.append(writing(node('p', undefined, 'user-text'), source[originalIndex] || t('emptyLine'), source[originalIndex] ? state.language : locale));
    const actions = node('div', undefined, 'line-actions');
    for (const [direction, offset] of [['up', -1], ['down', 1]]) {
      const target = position + offset;
      const control = button(direction, () => {
        state.order = core.move(state.order, position, target);
        dirty = true;
        renderWeave({ index: target, direction }); announce('moved');
      }, `${t(direction)}: ${label}`);
      control.disabled = target < 0 || target >= state.order.length;
      control.dataset.direction = direction; control.dataset.position = position;
      actions.append(control);
    }
    li.append(actions); list.append(li);
  }
  if (!source.length) list.append(node('li', t('empty'), 'empty'));
  $('original').setAttribute('lang', state.language);
  writing($('remix'), core.remix(state), state.language);
  if (focus) {
    const desired = list.querySelector(`[data-position="${focus.index}"][data-direction="${focus.direction}"]`);
    const available = desired?.disabled ? desired.parentElement.querySelector('button:not(:disabled)') : desired;
    available?.focus();
  }
}
if (app === 'weave') {
  $('original').addEventListener('input', () => {
    try {
      const original = $('original').value;
      state = core.validate(app, { ...state, original, order: core.identity(original) }); renderWeave();
    } catch (error) { $('original').value = state.original; fail(error); }
  });
  $('writing-language').addEventListener('change', () => {
    try { state.language = core.language($('writing-language').value.trim()); renderWeave(); }
    catch (error) { fail(error); }
  });
  $('shuffle').addEventListener('click', () => { state.order = core.shuffle(state.order); dirty = true; renderWeave(); announce('shuffled'); });
  $('restore').addEventListener('click', () => { state.order = core.identity(state.original); dirty = true; renderWeave(); announce('restored'); });
  $('example').addEventListener('click', () => {
    // Append rather than replace a person's existing writing.
    const original = state.original ? `${state.original}\n${t('exampleLines')}` : t('exampleLines');
    try { state = core.validate(app, { original, language: state.original ? state.language : locale, order: core.identity(original) }); dirty = true; syncFields(); renderWeave(); announce('changed'); }
    catch (error) { fail(error); }
  });
  $('download-text').addEventListener('click', () => download(core.remix(state), 'word-weave.txt'));
}

function cellLabel(i) { return t('cell', { row: new Intl.NumberFormat(locale).format(Math.floor(i / core.SIZE) + 1), col: new Intl.NumberFormat(locale).format(i % core.SIZE + 1), shape: t(`shape${state.cells[i]}`) }); }
function gardenText() { return [state.title || t('garden'), state.description || t('patternDescription'), ...state.cells.map((_, i) => cellLabel(i))].join('\n'); }
function changePattern(cells) {
  undone.push([...state.cells]); if (undone.length > 30) undone.shift();
  state.cells = cells; dirty = true; renderGarden(); announce('changed');
}
function renderGarden() {
  const symbols = ['·', '●', '◆', '★'];
  $('grid').querySelectorAll('button').forEach((el, i) => {
    el.textContent = symbols[state.cells[i]]; el.dataset.value = state.cells[i]; el.tabIndex = i === activeCell ? 0 : -1;
    el.setAttribute('aria-label', cellLabel(i));
  });
  $('undo-pattern').disabled = !undone.length;
  $('pattern-words').textContent = gardenText();
}
if (app === 'garden') {
  for (let i = 0; i < core.SIZE * core.SIZE; i++) {
    const cell = node('button', '', 'cell'); cell.type = 'button';
    cell.addEventListener('focus', () => { activeCell = i; $('grid').querySelectorAll('button').forEach((b, n) => { b.tabIndex = n === i ? 0 : -1; }); });
    cell.addEventListener('click', () => { const next = [...state.cells]; next[i] = (next[i] + 1) % 4; changePattern(next); });
    cell.addEventListener('keydown', event => {
      const row = Math.floor(i / core.SIZE), col = i % core.SIZE;
      const next = { ArrowRight: row * core.SIZE + Math.min(core.SIZE - 1, col + 1), ArrowLeft: row * core.SIZE + Math.max(0, col - 1), ArrowDown: Math.min(core.SIZE - 1, row + 1) * core.SIZE + col, ArrowUp: Math.max(0, row - 1) * core.SIZE + col, Home: event.ctrlKey ? 0 : row * core.SIZE, End: event.ctrlKey ? core.SIZE * core.SIZE - 1 : row * core.SIZE + core.SIZE - 1 }[event.key];
      if (next !== undefined) { event.preventDefault(); $('grid').children[next].focus(); }
    });
    $('grid').append(cell);
  }
  for (const [id, transform] of [['grow', () => core.grow()], ['rotate', () => core.rotate(state.cells)], ['mirror', () => core.mirror(state.cells)], ['clear', () => Array(core.SIZE * core.SIZE).fill(0)]]) $(id).addEventListener('click', () => changePattern(transform()));
  $('undo-pattern').addEventListener('click', () => { if (undone.length) { state.cells = undone.pop(); dirty = true; renderGarden(); announce('changed'); } });
  $('pattern-title').addEventListener('input', () => { state.title = $('pattern-title').value; renderGarden(); });
  $('description').addEventListener('input', () => { state.description = $('description').value; renderGarden(); });
  $('download-svg').addEventListener('click', () => download(core.svg(state, t('garden'), gardenText()), 'pattern-garden.svg', 'image/svg+xml;charset=utf-8'));
  $('download-text').addEventListener('click', () => download(gardenText(), 'pattern-garden.txt'));
}

const planLabel = key => t(['I', 'R', 'P', 'O'].includes(key) ? `plan${key}` : key);
function planText(entry) { return [entry.title, ...core.PLAN_FIELDS.map(key => `${planLabel(key)}\n${entry.fields[key]}`)].join('\n\n'); }
function renderSteps() {
  const list = $('checkpoints'); list.replaceChildren();
  $('goal').setAttribute('lang', state.language);
  for (const key of core.PLAN_FIELDS) $(`plan-${key}`).setAttribute('lang', state.language);
  if (!state.checkpoints.length) list.append(node('p', t('noCheckpoints'), 'empty'));
  state.checkpoints.forEach((entry, index) => {
    const card = node('details', undefined, 'note-card'), summary = node('summary');
    summary.append(node('strong', `${t('checkpoint', { n: new Intl.NumberFormat(locale).format(index + 1) })} — `), writing(node('bdi'), entry.title, entry.language));
    const date = node('time', new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.at)));
    date.dateTime = entry.at; date.className = 'muted';
    card.append(summary, date);
    for (const key of core.PLAN_FIELDS) if (entry.fields[key]) {
      card.append(node('h3', planLabel(key)), writing(node('p', undefined, 'user-text'), entry.fields[key], entry.language));
    }
    list.append(card);
  });
}
if (app === 'steps') {
  $('goal').addEventListener('input', () => { state.title = $('goal').value; });
  for (const key of core.PLAN_FIELDS) $(`plan-${key}`).addEventListener('input', () => { state.fields[key] = $(`plan-${key}`).value; });
  $('writing-language').addEventListener('change', () => {
    try { state.language = core.language($('writing-language').value.trim()); renderSteps(); }
    catch (error) { $('writing-language').value = state.language; fail(error); }
  });
  $('plan-form').addEventListener('submit', event => {
    event.preventDefault();
    try { state = core.checkpoint(state, crypto.randomUUID(), new Date().toISOString()); dirty = true; renderSteps(); announce('recorded'); }
    catch (error) { fail(error); }
  });
  $('example').addEventListener('click', () => {
    if (state.title || state.language || Object.values(state.fields).some(Boolean)) { announce('exampleEmpty'); return; }
    state.title = t('sampleGoal'); state.language = locale;
    for (const key of ['I', 'R', 'P']) state.fields[key] = t(`sample${key}`);
    dirty = true; syncFields(); renderSteps(); $('goal').focus();
  });
  $('download-text').addEventListener('click', () => download([
    t('draft'), planText(state), ...state.checkpoints.map((entry, i) => `${t('checkpoint', { n: i + 1 })}\n${entry.at}\n${planText(entry)}`)
  ].join('\n\n---\n\n'), 'small-steps.txt'));
}

const changeLabel = kind => t({ same: 'same', removed: 'removedLine', added: 'addedLine' }[kind]);
function positions(row) {
  const number = value => value === null ? '—' : new Intl.NumberFormat(locale).format(value);
  return t('positions', { from: number(row.originalLine), to: number(row.revisionLine) });
}
function renderCompare() {
  $('compare-original').setAttribute('lang', state.originalLanguage);
  $('compare-revision').setAttribute('lang', state.revisionLanguage);
  const list = $('changes'); list.replaceChildren();
  $('download-text').disabled = !compared;
  $('comparison-detail').textContent = '';
  if (!compared) { $('comparison-counts').textContent = t('notCompared'); return; }
  const diff = core.compareText(state.original, state.revision);
  $('comparison-counts').textContent = t('diffCounts', Object.fromEntries(Object.entries(diff.counts).map(([key, value]) => [key, new Intl.NumberFormat(locale).format(value)])));
  if (diff.identical || diff.lineEndingsOnly) $('comparison-detail').textContent = t(diff.identical ? 'identical' : 'lineEndings');
  for (const row of diff.rows) {
    const li = node('li', undefined, `diff-row diff-${row.kind}`);
    li.append(node('strong', changeLabel(row.kind)), node('span', positions(row), 'muted'));
    li.append(writing(node('p', undefined, 'user-text'), row.text || t('emptyLine'), row.text ? (row.kind === 'added' ? state.revisionLanguage : state.originalLanguage) : locale));
    list.append(li);
  }
}
if (app === 'compare') {
  for (const key of ['original', 'revision']) $(`file-${key}`).addEventListener('change', async event => {
    const input = event.target, file = input.files[0]; if (!file) return;
    try {
      if (file.size > 80000) throw new Error('compare-limit');
      let decoded;
      try { decoded = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer()); }
      catch { throw new Error('invalid-utf8'); }
      state = core.validate(app, { ...state, [key]: decoded }); dirty = true; syncFields(); renderCompare(); announce('textFileLoaded');
    } catch (error) { fail(error); }
    finally { input.value = ''; }
  });
  for (const key of ['original', 'revision', 'source', 'originalLanguage', 'revisionLanguage']) {
    const el = $(`compare-${key}`), event = ['original', 'revision'].includes(key) ? 'input' : 'change';
    el.addEventListener(event, () => {
      try { state = core.validate(app, { ...state, [key]: el.value }); compared = false; renderCompare(); }
      catch (error) { el.value = state[key]; fail(error); }
    });
  }
  $('compare-now').addEventListener('click', () => { compared = true; renderCompare(); announce('compared'); });
  $('example').addEventListener('click', () => {
    if (Object.values(state).some(Boolean)) { announce('exampleEmpty'); return; }
    state = { ...state, original: t('sampleSource'), revision: t('sampleRevision'), originalLanguage: locale, revisionLanguage: locale };
    dirty = true; syncFields(); compared = true; renderCompare();
  });
  $('download-text').addEventListener('click', () => {
    if (!compared) return;
    const diff = core.compareText(state.original, state.revision);
    const header = [t('compare'), state.source, $('comparison-counts').textContent, $('comparison-detail').textContent].filter(Boolean);
    download([...header, ...diff.rows.map(row => `${changeLabel(row.kind)} | ${positions(row)}\n${row.text}`)].join('\n\n'), 'source-compare.txt');
  });
}

function render() { if (app === 'orbit') renderOrbit(); if (app === 'weave') renderWeave(); if (app === 'garden') renderGarden(); if (app === 'steps') renderSteps(); if (app === 'compare') renderCompare(); }
if (app !== 'home') {
  $('save').addEventListener('click', () => {
    try { localStorage.setItem(key, JSON.stringify(core.documentFor(app, state))); dirty = false; announce('saved'); }
    catch { announce('storageError', true); }
  });
  function replace(next) { state = next; dirty = false; undone = []; removedNote = null; if ($('search')) $('search').value = ''; syncFields(); render(); }
  $('load').addEventListener('click', () => {
    let raw;
    try { raw = localStorage.getItem(key); } catch { announce('storageError', true); return; }
    if (!raw) { announce('noSaved'); return; }
    try { replace(core.parseDocument(raw, app)); announce('loaded'); } catch (error) { fail(error); }
  });
  $('forget').addEventListener('click', () => {
    try { localStorage.removeItem(key); announce('forgotten'); } catch { announce('storageError', true); }
  });
  $('export').addEventListener('click', () => {
    try { download(JSON.stringify(core.documentFor(app, state), null, 2), `${app}-project.json`, 'application/json;charset=utf-8'); dirty = false; }
    catch (error) { fail(error); }
  });
  $('import').addEventListener('change', async () => {
    const file = $('import').files[0]; if (!file) return;
    try {
      if (file.size > core.MAX_FILE_BYTES) throw new Error('file-limit');
      const next = core.parseDocument(await file.text(), app); replace(next); announce('imported');
    } catch (error) { fail(error); }
    finally { $('import').value = ''; }
  });
}
translatePage();
document.body.dataset.ready = 'true';
