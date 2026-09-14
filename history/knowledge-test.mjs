import assert from 'node:assert/strict';
import {fields, storageKey, read, append, importLog, digest} from './knowledge-state.mjs';
class Store {
  values = new Map();
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k, v) { if (this.fail) throw Error('quota'); this.values.set(k, v); }
}
const draft = text => Object.fromEntries(fields.map(([k]) => [k, k === 'title' ? 'A practical repair' : text]));
const store = new Store();
const a = await append(store, {data: draft('Initial idea')});
const b = await append(store, {subject: a.subject, expectedParent: a.id, data: {...draft('Second idea'), remainder: 'Counterexample still unresolved'}});
const restored = await append(store, {subject: a.subject, expectedParent: b.id, restoredFrom: a.id});
assert.equal(restored.kind, 'restore'); assert.equal(restored.parent, b.id); assert.deepEqual(restored.data, a.data);
assert.equal((await read(store)).entries[1].data.remainder, 'Counterexample still unresolved');
await append(store, {subject: a.subject, expectedParent: restored.id, restoredFrom: b.id});
assert.equal((await read(store)).entries.length, 4);
const before = store.getItem(storageKey);
await assert.rejects(append(store, {subject: a.subject, expectedParent: b.id, data: draft('stale')}), /another tab/);
assert.equal(store.getItem(storageKey), before);
store.fail = true;
await assert.rejects(append(store, {data: draft('quota failure')}), /quota/);
store.fail = false; assert.equal(store.getItem(storageKey), before);
const imported = new Store(); await importLog(imported, before); assert.deepEqual(await read(imported), await read(store));
const tampered = JSON.parse(before); tampered.entries[0].data.reason = 'changed';
await assert.rejects(importLog(imported, JSON.stringify(tampered)), /digest/);
const conflict = JSON.parse(before); conflict.entries[0].data.reason = 'rehashed conflicting origin'; conflict.entries[0].sha256 = await digest(conflict.entries[0]);
// Retain a self-consistent single-root import to isolate identity collision.
conflict.entries = [conflict.entries[0]]; conflict.heads[a.subject] = a.id;
await assert.rejects(importLog(imported, JSON.stringify(conflict)), /Conflicting/);
const branch = new Store(); await importLog(branch, before);
const last = (await read(branch)).heads[a.subject];
await append(branch, {subject: a.subject, expectedParent: last, data: draft('Imported branch')});
await importLog(imported, branch.getItem(storageKey));
assert.equal((await read(imported)).heads[a.subject], last);
assert.equal((await read(imported)).entries.length, 5);
const other = await append(store, {data: draft('Different subject')});
await assert.rejects(append(store, {subject: a.subject, expectedParent: last, restoredFrom: other.id}), /Unknown restore/);
const reordered = JSON.parse(before); reordered.entries.reverse();
await assert.rejects(importLog(new Store(), JSON.stringify(reordered)), /predecessor/);
const cap = new Store();
for (let i = 0; i < 200; i++) await append(cap, {data: draft('capacity ' + i)});
const capBefore = cap.getItem(storageKey);
await assert.rejects(append(cap, {data: draft('one too many')}), /capacity/);
assert.equal(cap.getItem(storageKey), capBefore);
console.log('PASS: append/restore/undo lineage, retained counterevidence, stale tabs, quota atomicity, import integrity/conflicts/branches, subject isolation, ordering, capacity.');
