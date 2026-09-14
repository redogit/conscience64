import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('plugin-runtime.js', import.meta.url), 'utf8');
const store = new Map();
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};
const context = vm.createContext({ globalThis: {}, localStorage, TextEncoder, Object, Array, JSON, Number, String, RegExp, Error });
context.globalThis = context;
vm.runInContext(source, context, { filename: 'plugin-runtime.js' });
const runtime = context.Conscience64MMOPlugins;
assert.ok(runtime, 'plug-in runtime did not initialize');
assert.equal(runtime.schema, 'conscience64.mmo.plugin/v1');

const choice = {
  schema: runtime.schema,
  id: 'storm-drain-rescue',
  name: 'Storm Drain Rescue',
  version: '1.0.0',
  mechanic: 'choice',
  prompt: 'A market display washed toward a storm drain. Choose a safe response.',
  choices: ['Move it away from the drain', 'Ignore it'],
  correctIndex: 0,
  reward: { xp: 16, joy: 8, tokens: 1, discoveries: 0 },
  description: 'Grounded local activity.'
};
const installed = runtime.install(choice);
assert.equal(installed.id, choice.id);
assert.equal(runtime.list().length, 1);
assert.equal(runtime.list()[0].name, choice.name);
assert.equal(runtime.validate({...choice, url:'https://example.org'}).url, undefined, 'unknown URL field must not survive validation');
assert.throws(() => runtime.validate({...choice, reward:{...choice.reward, xp:41}}), /reward\.xp invalid/);
assert.throws(() => runtime.validate({...choice, id:'Bad ID'}), /plugin id invalid/);
assert.throws(() => runtime.validate({...choice, mechanic:'javascript'}), /unsupported mechanic/);
assert.throws(() => runtime.validate({...choice, choices:['only one'], correctIndex:0}), /choices invalid/);

const input = runtime.install({
  schema: runtime.schema,
  id:'bus-route-check', name:'Bus Route Check', version:'1.0.0', mechanic:'input',
  prompt:'Which route reaches the maker garage?', answers:['7','route 7'],
  reward:{xp:8,joy:4,tokens:0,discoveries:0}
});
assert.equal(input.mechanic, 'input');
assert.equal(runtime.list().length, 2);
runtime.remove(choice.id);
assert.equal(runtime.list().map(p=>p.id).join(','), 'bus-route-check', 'remaining plug-in id after removal');

const exported = JSON.parse(runtime.exportPlugin(input));
assert.equal(exported.id, input.id);
assert.equal(exported.schema, runtime.schema);
console.log('PASS MMO plug-ins: validation, bounded rewards, local install/list/remove/export, unknown authority fields stripped');
