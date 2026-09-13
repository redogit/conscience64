// New public tools inspired by the project lineage documented in ../README.md.
export const SIZE = 6;
export const MAX_FILE_BYTES = 32_000_000;
export const SCHEMA = 'conscience64.play/v1';
export const lines = text => text === '' ? [] : text.split(/\r\n|\r|\n/u);
export const identity = text => lines(text).map((_, i) => i);
export const initial = app => app === 'orbit' ? { items: [] } : app === 'weave'
  ? { original: '', language: '', order: [] }
  : { cells: Array(SIZE * SIZE).fill(0), title: '', description: '' };

function text(value, max) {
  if (typeof value !== 'string' || value.length > max) throw new Error('invalid-data');
  return value;
}
export function language(value) {
  text(value, 80);
  if (!value) return '';
  try { return Intl.getCanonicalLocales(value)[0]; } catch { throw new Error('invalid-language'); }
}
export function sourceURL(value) {
  text(value, 2000);
  if (!value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new Error('invalid-url'); }
}
export function validate(app, data) {
  if (!data || typeof data !== 'object') throw new Error('invalid-data');
  if (app === 'orbit') {
    if (!Array.isArray(data.items) || data.items.length > 200) throw new Error('item-limit');
    const items = data.items.map(item => {
      const id = text(item.id, 100), title = text(item.title, 160);
      if (!id || !title.trim()) throw new Error('invalid-data');
      return { id, title, text: text(item.text, 20000), source: sourceURL(item.source), language: language(item.language) };
    });
    if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('invalid-data');
    return { items };
  }
  if (app === 'weave') {
    const original = text(data.original, 20000), count = lines(original).length;
    if (count > 100 || !Array.isArray(data.order) || data.order.length !== count ||
      new Set(data.order).size !== count || data.order.some(i => !Number.isInteger(i) || i < 0 || i >= count)) throw new Error('line-limit');
    return { original, language: language(data.language), order: [...data.order] };
  }
  if (app === 'garden') {
    if (!Array.isArray(data.cells) || data.cells.length !== SIZE * SIZE || data.cells.some(x => !Number.isInteger(x) || x < 0 || x > 3)) throw new Error('invalid-data');
    return { cells: [...data.cells], title: text(data.title, 120), description: text(data.description, 500) };
  }
  throw new Error('invalid-data');
}
export const documentFor = (app, data) => ({ schema: SCHEMA, app, data: validate(app, data) });
export function parseDocument(raw, app) {
  if (typeof raw !== 'string' || raw.length > MAX_FILE_BYTES) throw new Error('file-limit');
  let doc;
  try { doc = JSON.parse(raw); } catch { throw new Error('invalid-data'); }
  if (doc.schema !== SCHEMA || doc.app !== app) throw new Error('wrong-project');
  return validate(app, doc.data);
}
export function search(items, query) {
  const fold = s => s.normalize('NFC').toLocaleLowerCase();
  const q = fold(query.trim());
  return items.filter(item => fold([item.title, item.text, item.source, item.language].join('\n')).includes(q));
}
export function move(order, from, to) {
  const result = [...order];
  if (to < 0 || to >= result.length || from < 0 || from >= result.length) return result;
  result.splice(to, 0, result.splice(from, 1)[0]);
  return result;
}
export function shuffle(order, random = Math.random) {
  const result = [...order];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const remix = data => { const source = lines(data.original); return data.order.map(i => source[i]).join('\n'); };
export function characterCount(text, locale = 'en') {
  return typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(text)].length : [...text].length;
}
export const rotate = cells => cells.map((_, i) => cells[(SIZE - 1 - i % SIZE) * SIZE + Math.floor(i / SIZE)]);
export const mirror = cells => cells.map((_, i) => cells[Math.floor(i / SIZE) * SIZE + Math.min(i % SIZE, SIZE - 1 - i % SIZE)]);
export const grow = (random = Math.random) => mirror(Array.from({ length: SIZE * SIZE }, () => Math.floor(random() * 4)));
export const escapeXML = value => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/gu, '\ufffd').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export function svg(data, fallbackTitle, fallbackDescription) {
  const safe = validate('garden', data);
  const shapes = ['', '<circle cx="24" cy="24" r="15" fill="#006d64"/>', '<path d="M24 6L42 24L24 42L6 24Z" fill="#923c23"/>', '<path d="M24 5L29 17L42 17L32 26L36 41L24 32L12 41L16 26L6 17L19 17Z" fill="#514588"/>'];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 288 288" role="img" aria-labelledby="title description"><title id="title">${escapeXML(safe.title || fallbackTitle)}</title><desc id="description">${escapeXML(safe.description || fallbackDescription)}</desc><rect width="288" height="288" fill="#faf7ef"/>${safe.cells.map((v, i) => `<g transform="translate(${i % SIZE * 48} ${Math.floor(i / SIZE) * 48})"><rect x="1" y="1" width="46" height="46" rx="6" fill="#ede9dc"/>${shapes[v]}</g>`).join('')}</svg>`;
}
