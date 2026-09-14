import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LIMITS,
  PLUGIN_SCHEMA,
  REWARD_CAPS,
  PluginStoreError,
  PluginValidationError,
  createPluginShelf,
  exportPlugin,
  parsePluginJson,
  validatePlugin,
} from '../plugin-runtime.mjs';

const here = new URL('./', import.meta.url);
const example = JSON.parse(await readFile(new URL('../plugins/duck-rescue.json', here), 'utf8'));
const contract = JSON.parse(await readFile(new URL('../plugin-contract.json', here), 'utf8'));
const html = await readFile(new URL('index.html', here), 'utf8');
const forge = await readFile(new URL('forge.mjs', here), 'utf8');

const good = validatePlugin(example);
assert.equal(good.schema, PLUGIN_SCHEMA);
assert.equal(good.id, 'duck-rescue');
assert.equal(good.mechanic, 'choice');
assert.equal(good.reward.xp, 16);
assert.ok(Object.isFrozen(good));
assert.ok(Object.isFrozen(good.reward));
assert.ok(Object.isFrozen(good.choices));

assert.equal(contract.executionModel, 'data-only');
assert.equal(contract.pluginSchema, PLUGIN_SCHEMA);
assert.equal(contract.limits.fileBytes, LIMITS.fileBytes);
assert.equal(contract.limits.shelfEntries, LIMITS.shelfEntries);
assert.equal(contract.limits.shelfBytes, LIMITS.shelfBytes);
assert.deepEqual(contract.limits.rewardCaps, REWARD_CAPS);
assert.equal(contract.security.executablePluginCode, false);
assert.equal(contract.security.networkAuthority, false);
assert.equal(contract.security.prizeAuthority, false);

const clone = value => JSON.parse(JSON.stringify(value));
function rejects(mutator, pattern) {
  const candidate = clone(example);
  mutator(candidate);
  assert.throws(() => validatePlugin(candidate), pattern);
}
rejects(plugin => { plugin.url = 'https://example.com'; }, /unsupported field: url/);
rejects(plugin => { plugin.script = 'alert(1)'; }, /unsupported field: script/);
rejects(plugin => { plugin.reward.coins = 5; }, /reward contains unsupported field: coins/);
rejects(plugin => { plugin.reward.xp = REWARD_CAPS.xp + 1; }, /reward\.xp invalid/);
rejects(plugin => { plugin.choices[1] = plugin.choices[0].toUpperCase(); }, /duplicate items/);
rejects(plugin => { plugin.correctIndex = 99; }, /correctIndex invalid/);
rejects(plugin => { plugin.version = 'latest'; }, /semantic version/);
rejects(plugin => { plugin.mechanic = 'creative'; plugin.choices = ['a','b']; delete plugin.correctIndex; }, /unsupported field: choices/);

const markupAsData = clone(example);
markupAsData.prompt = '<script>globalThis.pwned=true</script>';
const markupValidated = validatePlugin(markupAsData);
assert.equal(markupValidated.prompt, '<script>globalThis.pwned=true</script>');
assert.match(exportPlugin(markupValidated), /<script>/);
assert.ok(!forge.includes('.innerHTML'));
assert.ok(!forge.includes('insertAdjacentHTML'));
assert.match(forge, /\.textContent\s*=/);

assert.throws(() => parsePluginJson(' '.repeat(LIMITS.fileBytes + 1)), /too large/);
assert.throws(() => parsePluginJson('{bad json'), /JSON is invalid/);

class FakeStorage {
  constructor(raw = null) { this.raw = raw; this.setCalls = 0; }
  getItem() { return this.raw; }
  setItem(_key, value) { this.raw = value; this.setCalls += 1; }
}
const storage = new FakeStorage();
const shelf = createPluginShelf(storage, { key: 'test' });
shelf.install(example);
assert.equal(shelf.list().length, 1);
assert.equal(shelf.list()[0].id, 'duck-rescue');
assert.equal(shelf.remove('duck-rescue'), 0);
assert.equal(shelf.list().length, 0);

const corruptStorage = new FakeStorage('{');
const corruptShelf = createPluginShelf(corruptStorage, { key: 'test' });
assert.throws(() => corruptShelf.list(), PluginStoreError);
assert.throws(() => corruptShelf.install(example), /corrupt/);
assert.equal(corruptStorage.setCalls, 0, 'corrupt shelf must not be overwritten');

const inaccessible = { getItem(){ throw new Error('blocked'); }, setItem(){} };
assert.throws(() => createPluginShelf(inaccessible).list(), /could not be read/);

const boundedStorage = new FakeStorage();
const boundedShelf = createPluginShelf(boundedStorage, { key: 'bounded' });
for (let i = 0; i < LIMITS.shelfEntries; i++) {
  boundedShelf.install({
    schema: PLUGIN_SCHEMA,
    id: `p-${String(i).padStart(2, '0')}`,
    name: `Plugin ${i}`,
    version: '1.0.0',
    mechanic: 'creative',
    prompt: 'Create a harmless local preview.',
    reward: { xp: 0, joy: 0, tokens: 0, discoveries: 0 },
  });
}
assert.equal(boundedShelf.list().length, LIMITS.shelfEntries);
assert.throws(() => boundedShelf.install({
  schema: PLUGIN_SCHEMA,
  id: 'p-overflow',
  name: 'Overflow',
  version: '1.0.0',
  mechanic: 'creative',
  prompt: 'This should not fit the bounded shelf.',
  reward: { xp: 0, joy: 0, tokens: 0, discoveries: 0 },
}), /entry limit exceeded/);

assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /<style[\s>]/i);
assert.match(html, /data-only/i);
assert.match(html, /preview metadata only/i);
assert.match(html, /plugin-contract\.json/);
assert.match(html, /plugins\/duck-rescue\.json/);

console.log('PASS Arcade Forge: strict data-only schema, bounded storage, visible corruption, no network/code/prize authority, safe text rendering.');
