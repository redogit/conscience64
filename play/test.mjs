import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import * as c from './assets/core.mjs';
import { messages, languages } from './assets/i18n.mjs';
import * as world from './explorer-world/world.mjs';

const corpus = ['مرحبا بالعالم', 'שלום', '你好世界', 'สวัสดี', 'नमस्ते', 'cafe\u0301', '👩🏽‍💻'];
const items = corpus.map((value, i) => ({ id: String(i), title: value, text: value, source: 'https://example.org/source', language: '' }));
const shelf = { items };
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('orbit', shelf)), 'orbit'), shelf);
for (const value of corpus) assert.ok(c.search(items, value).some(r => r.title === value));
assert.equal(c.search(items, 'café')[0].title, 'cafe\u0301');
for (const source of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x', 'https://name:password@example.org', '/relative']) assert.throws(() => c.validate('orbit', { items: [{ ...items[0], source }] }), /invalid-url/);
assert.throws(() => c.validate('orbit', { items: [items[0], items[0]] }));
assert.throws(() => c.parseDocument(JSON.stringify(c.documentFor('orbit', shelf)), 'weave'), /wrong-project/);
assert.throws(() => c.parseDocument('null', 'orbit'));
assert.throws(() => c.validate('orbit', { items: Array(201).fill(items[0]) }));
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
assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('A &amp; B &lt; C'));
assert.throws(() => c.validate('garden', { ...garden, cells: [4] }));
for (const locale of Object.keys(languages)) {
  assert.deepEqual(Object.keys(messages[locale]).sort(), Object.keys(messages.en).sort(), `translation keys: ${locale}`);
  assert.ok(Object.values(messages[locale]).every(s => typeof s === 'string' && s.length));
}
for (const path of ['index.html', 'orbit/index.html', 'weave/index.html', 'garden/index.html', 'steps/index.html', 'compare/index.html', 'computational-chorus/index.html', 'explorer-world/index.html']) {
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
assert.deepEqual(catalog.projects.map(p => p.id), ['orbit', 'weave', 'garden', 'steps', 'compare', 'computational-chorus', 'explorer-world']);
for (const p of catalog.projects) assert.ok(await stat(new URL(p.entry, import.meta.url)));
const chorus = await readFile(new URL('computational-chorus/chorus.mjs', import.meta.url), 'utf8');
assert.match(chorus, /P \?= NP/);assert.match(chorus, /meaning preserved \/ cognitive effort/i);assert.match(chorus, /witness-verifier characterization of NP/i);assert.match(chorus, /memory aid, not evidence|memory aid/i);
const worldA=world.createWorld(640064),worldB=world.createWorld(640064);assert.deepEqual(worldA,worldB,'game world seed must be deterministic');assert.equal(world.regionAt(100,100).id,'sunmeadow');assert.equal(world.regionAt(1700,900).id,'anomaly');assert.equal(world.fuzzballUnlocked({echoes:2}),false);assert.equal(world.fuzzballUnlocked({echoes:3}),true);assert.equal(world.portalUnlocked({echoes:6,fuzzballFound:false}),false);assert.equal(world.portalUnlocked({echoes:6,fuzzballFound:true}),true);assert.equal(worldA.monsters.length,18);assert.equal(worldA.echoes.length,12);assert.ok(worldA.monsters.every(m=>world.MONSTER_TYPES[m.type]));
const plan = c.initial('steps'); plan.title = 'تعلّم 👩🏽‍💻'; plan.fields.P = 'Try one small thing';
const first = c.checkpoint(plan, 'first', '2026-09-13T12:00:00.000Z');
first.fields.P = 'Try a second thing'; first.fields.O = 'A useful observation';
const second = c.checkpoint(first, 'second', '2026-09-13T12:01:00.000Z');
assert.equal(second.checkpoints[0].fields.P, 'Try one small thing');assert.equal(second.checkpoints[0].fields.O, '');assert.equal(second.checkpoints[1].fields.O, 'A useful observation');assert.equal(plan.checkpoints.length, 0, 'recording must not mutate its input');
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('steps', second)), 'steps'), second);
assert.throws(() => c.checkpoint(c.initial('steps'), 'x', '2026-09-13T12:00:00.000Z'), /plan-required/);assert.throws(() => c.checkpoint(first, 'first', '2026-09-13T12:01:00.000Z'));assert.throws(() => c.checkpoint(first, 'next', 'not a date'));assert.throws(() => c.validate('steps', { ...first, checkpoints: Array(101).fill(first.checkpoints[0]) }), /checkpoint-limit/);
const compareProject = { ...c.initial('compare'), original: '\ufeffمرحبا\r\n\r\n👩🏽‍💻', revision: '\ufeffمرحبا\n\n👩🏽‍💻' };
assert.deepEqual(c.parseDocument(JSON.stringify(c.documentFor('compare', compareProject)), 'compare'), compareProject);assert.equal(c.compareText(compareProject.original, compareProject.revision).lineEndingsOnly, true);assert.equal(c.compareText('é', 'e\u0301').identical, false);assert.deepEqual(c.compareText('é', 'e\u0301').counts, { same: 0, removed: 1, added: 1 });assert.throws(() => c.compareText('x\n'.repeat(301), ''), /compare-limit/);
const arrays = [[]];for (let size = 1; size <= 3; size++) for (const prefix of arrays.filter(a => a.length === size - 1)) for (const value of ['a', 'b']) arrays.push([...prefix, value]);
const subsequences = a => Array.from({ length: 1 << a.length }, (_, mask) => a.filter((_, i) => mask & (1 << i)));
for (const a of arrays) for (const b of arrays) {
  const diff = c.compareText(a.join('\n'), b.join('\n'));assert.deepEqual(diff.rows.filter(r => r.kind !== 'added').map(r => r.text), a);assert.deepEqual(diff.rows.filter(r => r.kind !== 'removed').map(r => r.text), b);
  const possibilities = new Set(subsequences(b).map(s => JSON.stringify(s)));const maximum = Math.max(...subsequences(a).filter(s => possibilities.has(JSON.stringify(s))).map(s => s.length));assert.equal(diff.counts.same, maximum);
}
console.log('PASS playground: seven public projects; Unicode, provenance checkpoints, exact text differences, original recovery, geometry, voice/music resources, mnemonic claim boundaries, and deterministic Explorer World game rules.');
