'use strict';
const byId = id => document.getElementById(id), I = CoordinateI18n;
const requestedLocale = new URLSearchParams(location.search).get('lang');
let locale = requestedLocale ? I.resolve(requestedLocale) : I.resolvePreferred(Array.from(navigator.languages || ['en']));
let verified = null, generation = 0, packGeneration = 0, state = 'idle', errorDetail = '', languageState = '';
const t = key => I.get(locale).messages[key];
// A textarea preview can normalize newlines. Keep the imported text separately
// until an editor input event (or a changed editor value at Encode) replaces it.
let importedSource = null;
function importSource(text) {
  byId('text').value = text;
  importedSource = {text, preview:byId('text').value};
}
function sourceText() {
  if (importedSource && byId('text').value === importedSource.preview) return importedSource.text;
  importedSource = null;
  return byId('text').value;
}
function sourcePresentation() {
  let value = byId('source-lang').value.trim(), valid = true;
  try { value = value ? I.tag(value) : ''; } catch { value = ''; valid = false; }
  byId('source-lang').setAttribute('aria-invalid', String(!valid));
  byId('source-status').textContent = valid ? '' : t('tagError');
  for (const id of ['text','recovered']) {
    byId(id).lang = value;
    byId(id).dir = byId('source-dir').value;
  }
}
function summary() {
  const el = byId('summary'); el.replaceChildren(); el.lang = locale;
  el.setAttribute('aria-label', t('bytes') + ' / ' + t('digest'));
  if (!verified) return;
  for (const [key,value] of [['bytes',I.number(verified.raw.length,locale)],['coordinates',I.number(verified.packet.coordinates.length,locale)],['digest',verified.sha256]]) {
    const line = document.createElement('p'), label = document.createElement('span'), content = document.createElement('bdi');
    label.textContent = t(key) + ': '; content.textContent = value;
    if (key === 'digest') { content.id = 'digest'; content.dir = 'ltr'; content.lang = 'en'; }
    line.append(label,content); el.append(line);
  }
}
function renderState() {
  const prefix = state === 'passed' ? 'PASS — ' : state === 'failed' ? 'FAIL — ' : '';
  byId('status').textContent = prefix + t(state); byId('status').dataset.state = state;
  byId('details').textContent = errorDetail; byId('details').hidden = !errorDetail;
  byId('language-status').textContent = languageState ? t(languageState) : '';
  byId('source-origin').textContent = importedSource
    ? 'Exact imported bytes are active. Editing the preview starts a new text source.'
    : 'Text editor is active. Its line endings follow the browser text field.';
  byId('source-origin').dataset.mode = importedSource ? 'imported' : 'editor';
  summary(); sourcePresentation();
}
function selectOptions() {
  const selector = byId('language'); selector.replaceChildren();
  for (const p of I.list()) {
    const option = document.createElement('option'); option.value = p.locale;
    option.textContent = p.nativeName; option.lang = p.locale; option.dir = p.direction; selector.append(option);
  }
  selector.value = locale;
}
function applyLocale() {
  document.documentElement.lang = locale; document.documentElement.dir = I.get(locale).direction;
  document.title = t('title');
  for (const el of document.querySelectorAll('[data-i18n]')) { el.textContent = t(el.dataset.i18n); el.lang = locale; el.dir = I.get(locale).direction; }
  byId('language').value = locale;
  renderState();
}
function invalidate(next = 'changed') {
  generation++; verified = null; state = next; errorDetail = '';
  byId('savePacket').disabled = byId('saveText').disabled = true;
  byId('recovered').textContent = ''; renderState();
}
function accept(packet, imported = false) {
  const result = CoordinateCodec.decode(packet);
  verified = {packet,...result}; state = 'passed';
  byId('recovered').textContent = result.text;
  byId('savePacket').disabled = byId('saveText').disabled = false;
  if (imported) { importSource(result.text); byId('source-lang').value = ''; byId('source-dir').value = 'auto'; }
  renderState();
}
function perform(action) {
  invalidate('checking');
  try { action(); } catch (error) { invalidate('failed'); errorDetail = String(error.message).slice(0,800); renderState(); }
}
byId('encode').addEventListener('click', () => perform(() => {
  const packet = CoordinateCodec.encode(sourceText()); accept(packet);
  byId('packet').value = JSON.stringify(packet,null,2);
}));
byId('decode').addEventListener('click', () => perform(() => {
  if (new TextEncoder().encode(byId('packet').value).length > 12*1024*1024) throw Error('E_ENVELOPE_LIMIT: 12 MiB');
  accept(JSON.parse(byId('packet').value),true);
}));
byId('text').addEventListener('input', () => { importedSource = null; byId('source-file').value = ''; invalidate(); });
byId('packet').addEventListener('input', () => invalidate());
byId('source-lang').addEventListener('input', sourcePresentation);
byId('source-dir').addEventListener('change', sourcePresentation);
byId('language').addEventListener('change', () => {
  packGeneration++; languageState = ''; // Newer deliberate choice wins an older asynchronous import.
  locale = byId('language').value; applyLocale();
});
byId('clear').addEventListener('click', () => {
  packGeneration++; languageState = ''; importedSource = null;
  for (const id of ['text','packet','load','source-lang','language-pack','source-file']) byId(id).value = '';
  byId('source-dir').value = 'auto'; invalidate('cleared'); byId('text').focus();
});
async function readLocalUTF8(file, maximum) {
  if (file.size > maximum) throw Error('E_FILE_LIMIT: ' + maximum + ' bytes');
  // File.text() replaces invalid UTF-8. Import contracts must reject it instead.
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > maximum) throw Error('E_FILE_LIMIT: ' + maximum + ' bytes');
  // Allow a JSON transport BOM; the exact source payload inside is untouched.
  return new TextDecoder('utf-8', {fatal:true}).decode(bytes);
}
byId('load').addEventListener('change', async () => {
  invalidate('waiting'); const ticket = generation, file = byId('load').files[0];
  byId('load').value = ''; // Selecting this same local file again must still fire change.
  if (!file) { invalidate(); return; }
  try {
    const text = await readLocalUTF8(file,12*1024*1024); if (ticket !== generation) return;
    byId('packet').value = text; perform(() => accept(JSON.parse(text),true));
  } catch (error) { if (ticket === generation) { invalidate('failed'); errorDetail = String(error.message).slice(0,800); renderState(); } }
});
byId('source-file').addEventListener('change', async () => {
  invalidate('waiting'); const ticket = generation, file = byId('source-file').files[0];
  byId('source-file').value = '';
  if (!file) { invalidate(); return; }
  try {
    const packet = await CoordinateSourceFile.read(file);
    if (ticket !== generation) return;
    accept(packet,true); byId('packet').value = JSON.stringify(packet,null,2);
  } catch (error) {
    if (ticket === generation) { invalidate('failed'); errorDetail = String(error.message).slice(0,800); renderState(); }
  }
});
byId('language-pack').addEventListener('change', async () => {
  const ticket = ++packGeneration, file = byId('language-pack').files[0];
  byId('language-pack').value = '';
  if (!file) return;
  try {
    const text = await readLocalUTF8(file,I.limit); if (ticket !== packGeneration) return;
    const pack = I.importText(text); locale = pack.locale; languageState = 'packOk'; selectOptions(); applyLocale();
  } catch { if (ticket === packGeneration) { languageState = 'packError'; renderState(); } }
});
function save(bytes,name,type) {
  const url = URL.createObjectURL(new Blob([bytes],{type})); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  // Resource cleanup only: no clock measurement, expiry or identity dependency.
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
byId('savePacket').addEventListener('click', () => { if (verified) save(JSON.stringify(verified.packet,null,2),'coordinates.json','application/json'); });
byId('saveText').addEventListener('click', () => { if (verified) save(verified.raw,'recovered.txt','application/octet-stream'); });
byId('template').addEventListener('click', () => save(I.template(locale),'coordinate-language.json','application/json'));
selectOptions(); applyLocale(); document.body.dataset.ready = 'true';
