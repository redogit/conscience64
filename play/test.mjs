import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import * as c from './assets/core.mjs';
import { messages, languages } from './assets/i18n.mjs';

const corpus = ['مرحبا بالعالم', 'שלום', '你好世界', 'สวัสดี', 'नमस्ते', 'cafe\u0301', '👩🏽‍💻'];
const items = corpus.map((value, i) => ({ id: String(i), title: value, text: value, source: 'https://example.org/source', language: '' }));
const shelf = { items };
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('orbit', shelf)), 'orbit'), shelf);
for (const value of corpus) assert.ok(c.search(items, value).some(r => r.title === value));
assert.equal(c.search(items, 'café')[0].title, 'cafe\u0301');
for (const source of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x', 'https://name:password@example.org', '/relative']) {
  assert.throws(() => c.validate('orbit', { items: [{ ...items[0], source }] }), /invalid-url/);
}
assert.throws(() => c.validate('orbit', { items: [items[0], items[0]] }));
assert.throws(() => c.parseDocument(JSON.stringify(c.documentFor('orbit', shelf)), 'weave'), /wrong-project/);
assert.throws(() => c.parseDocument('null', 'orbit'));
assert.throws(() => c.validate('orbit', { items: Array(201).fill(items[0]) }));
// Valid collections larger than 1 MB must survive their own export/import.
const big = { items: Array.from({ length: 80 }, (_, i) => ({ ...items[0], id: String(i), text: '界'.repeat(19000) })) };
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('orbit', big)), 'orbit'), big);
const original = 'مرحبا\r\n\r\n👩🏽‍💻\nनमस्ते';
const weave = { original, language: 'ar', order: c.identity(original) };
const reordered = { ...weave, order: c.move(weave.order, 0, 3) };
assert.equal(reordered.original, original);
assert.equal(c.remix(reordered), '\n👩🏽‍💻\nनमस्ते\nمرحبا');
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('weave', reordered)), 'weave'), reordered);
assert.equal(c.characterCount('👩🏽‍💻'), 1);
assert.equal(c.characterCount('e\u0301'), 1);
assert.throws(() => c.validate('weave', { ...weave, order: [0, 0, 2, 3] }));
assert.throws(() => c.validate('weave', { ...weave, language: 'not a language' }));
assert.deepEqual([...c.shuffle(weave.order)].sort(), weave.order);
for (let offset = 0; offset < 36; offset++) {
  const pattern = Array(36).fill(0); pattern[offset] = 3;
  assert.deepEqual(c.rotate(c.rotate(c.rotate(c.rotate(pattern)))), pattern);
  const mirrored = c.mirror(pattern);
  assert.deepEqual(c.mirror(mirrored), mirrored);
  for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) assert.equal(mirrored[row * 6 + col], mirrored[row * 6 + 5 - col]);
}
const garden = { cells: c.grow(() => .6), title: '</title><script>alert(1)</script>', description: 'A & B < C' };
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('garden', garden)), 'garden'), garden);
const svg = c.svg(garden, 'Pattern', 'Description');
assert.ok(!svg.includes('<script>'));
assert.ok(svg.includes('&lt;script&gt;'));
assert.ok(svg.includes('A &amp; B &lt; C'));
assert.throws(() => c.validate('garden', { ...garden, cells: [4] }));
for (const locale of Object.keys(languages)) {
  assert.deepEqual(Object.keys(messages[locale]).sort(), Object.keys(messages.en).sort(), `translation keys: ${locale}`);
  assert.ok(Object.values(messages[locale]).every(s => typeof s === 'string' && s.length));
}
for (const path of ['index.html', 'orbit/index.html', 'weave/index.html', 'garden/index.html']) {
  const html = await readFile(new URL(path, import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `duplicate IDs: ${path}`);
  for (const [, id] of html.matchAll(/\bfor="([^"]+)"/g)) assert.ok(ids.includes(id), `unresolved label ${id}`);
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)) assert.ok(messages.en[key], `unknown translation ${key}`);
  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (target.startsWith('#') || target.startsWith('https:')) continue;
    const url = new URL(target, new URL(path, import.meta.url));
    assert.ok(await stat(url), `missing resource ${url}`);
  }
}
const catalog = JSON.parse(await readFile(new URL('projects.json', import.meta.url), 'utf8'));
assert.deepEqual(catalog.projects.map(p => p.id), ['orbit', 'weave', 'garden']);
for (const p of catalog.projects) assert.ok(await stat(new URL(p.entry, import.meta.url)));
console.log('PASS playground: Unicode and RTL text preservation, source URL validation, export/import recovery, line permutations, symmetry, safe SVG, translations, and page resources.');
