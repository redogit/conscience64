import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import {
  LIMITS,
  PLUGIN_SCHEMA,
  REWARD_CAPS,
  PluginStoreError,
  createPluginShelf,
  exportPlugin,
  parsePluginJson,
  validatePlugin,
} from '../plugin-runtime.mjs';

await import('../timing-runtime.test.mjs');

const here = new URL('./', import.meta.url);
const pluginsUrl = new URL('../plugins/', here);
const pluginFiles = (await readdir(pluginsUrl)).filter(name => name.endsWith('.json')).sort();
const plugins = [];
for (const name of pluginFiles) plugins.push([name, JSON.parse(await readFile(new URL(name, pluginsUrl), 'utf8'))]);
const byId = new Map(plugins.map(([name, plugin]) => [plugin.id, { name, plugin: validatePlugin(plugin) }]));
const example = byId.get('duck-rescue').plugin;
const redline = byId.get('redline-classic').plugin;
const contract = JSON.parse(await readFile(new URL('../plugin-contract.json', here), 'utf8'));
const html = await readFile(new URL('index.html', here), 'utf8');
const forge = await readFile(new URL('forge.mjs', here), 'utf8');
const lineage = await readFile(new URL('../plugins/README.md', here), 'utf8');

assert.equal(pluginFiles.length, 10, 'unexpected starter recipe count');
assert.deepEqual(new Set(byId.keys()), new Set([
  'duck-rescue',
  'monster-mood-grumpy', 'monster-mood-confused', 'monster-mood-delighted', 'monster-mood-suspicious',
  'cipher-snap-doubling', 'cipher-snap-letters', 'cipher-snap-symbols',
  'make-something-duck-compass', 'redline-classic',
]));
for (const [name, plugin] of plugins) {
  const checked = validatePlugin(plugin);
  assert.equal(checked.schema, PLUGIN_SCHEMA, name);
  assert.ok(Object.isFrozen(checked), name);
  assert.ok(html.includes(`../plugins/${name}`), `Forge does not link admitted recipe: ${name}`);
}

assert.equal(redline.mechanic, 'timing');
assert.equal(redline.minDelayMs, 900);
assert.equal(redline.maxDelayMs, 2700);
assert.deepEqual(redline.reward, { xp:24, joy:7, tokens:2, discoveries:0 });
assert.deepEqual(redline.falseStartReward, { xp:3, joy:1, tokens:0, discoveries:0 });
assert.ok(Object.isFrozen(redline.falseStartReward));
assert.match(lineage, /900/);
assert.match(lineage, /2700/);
assert.match(lineage, /false start/i);
assert.match(lineage, /CORE_INTERACTION_SEMANTICS_ADAPTED/);
assert.match(lineage, /OLD_STATE_AUTHORITY_NOT_PRESERVED/);

assert.equal(example.id, 'duck-rescue');
assert.equal(example.mechanic, 'choice');
assert.equal(example.reward.xp, 16);
assert.ok(Object.isFrozen(example.reward));
assert.ok(Object.isFrozen(example.choices));

assert.equal(contract.version, '1.2.0');
assert.deepEqual(contract.mechanics, ['choice','input','creative','timing']);
assert.equal(contract.executionModel, 'data-only');
assert.equal(contract.pluginSchema, PLUGIN_SCHEMA);
assert.equal(contract.limits.fileBytes, LIMITS.fileBytes);
assert.equal(contract.limits.shelfEntries, LIMITS.shelfEntries);
assert.equal(contract.limits.shelfBytes, LIMITS.shelfBytes);
assert.equal(contract.limits.timing.minDelayMs, LIMITS.timingMinDelayMs);
assert.equal(contract.limits.timing.maxDelayMs, LIMITS.timingMaxDelayMs);
assert.equal(contract.limits.timing.maxSpanMs, LIMITS.timingMaxSpanMs);
assert.deepEqual(contract.limits.rewardCaps, REWARD_CAPS);
assert.equal(contract.security.executablePluginCode, false);
assert.equal(contract.security.networkAuthority, false);
assert.equal(contract.security.prizeAuthority, false);
assert.equal(contract.security.pluginSuppliedClockOrTimer, false);
assert.match(contract.authority.timingMeasurement, /not an accessibility gate/);

const clone = value => JSON.parse(JSON.stringify(value));
function rejects(candidate, mutator, pattern) {
  const copy = clone(candidate);
  mutator(copy);
  assert.throws(() => validatePlugin(copy), pattern);
}
rejects(example, plugin => { plugin.url = 'https://example.com'; }, /unsupported field: url/);
rejects(example, plugin => { plugin.script = 'alert(1)'; }, /unsupported field: script/);
rejects(example, plugin => { plugin.reward.coins = 5; }, /reward contains unsupported field: coins/);
rejects(example, plugin => { plugin.reward.xp = REWARD_CAPS.xp + 1; }, /reward\.xp invalid/);
rejects(example, plugin => { plugin.choices[1] = plugin.choices[0].toUpperCase(); }, /duplicate items/);
rejects(example, plugin => { plugin.correctIndex = 99; }, /correctIndex invalid/);
rejects(example, plugin => { plugin.version = 'latest'; }, /semantic version/);
rejects(example, plugin => { plugin.mechanic = 'creative'; plugin.choices = ['a','b']; delete plugin.correctIndex; }, /unsupported field: choices/);
rejects(redline, plugin => { plugin.minDelayMs = LIMITS.timingMinDelayMs - 1; }, /minDelayMs outside timing bounds/);
rejects(redline, plugin => { plugin.maxDelayMs = LIMITS.timingMaxDelayMs + 1; }, /maxDelayMs outside timing bounds/);
rejects(redline, plugin => { plugin.maxDelayMs = 800; }, /maxDelayMs must be greater/);
rejects(redline, plugin => { plugin.minDelayMs = 1000; plugin.maxDelayMs = 7000; }, /timing delay span too large/);
rejects(redline, plugin => { plugin.falseStartReward.xp = REWARD_CAPS.xp + 1; }, /falseStartReward\.xp invalid/);
rejects(redline, plugin => { plugin.reactionThresholdMs = 250; }, /unsupported field: reactionThresholdMs/);
rejects(redline, plugin => { plugin.clock = 'Date.now'; }, /unsupported field: clock/);

const markupAsData = clone(example);
markupAsData.prompt = '<script>globalThis.pwned=true</script>';
const markupValidated = validatePlugin(markupAsData);
assert.equal(markupValidated.prompt, '<script>globalThis.pwned=true</script>');
assert.match(exportPlugin(markupValidated), /<script>/);
assert.ok(!forge.includes('.innerHTML'));
assert.ok(!forge.includes('insertAdjacentHTML'));
assert.match(forge, /\.textContent\s*=/);
assert.match(forge, /createReactionTrial/);
assert.match(forge, /performance\.now|timing-runtime/);
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
shelf.install(redline);
assert.equal(shelf.list().length, 2);
assert.equal(shelf.remove('duck-rescue'), 1);

const corruptStorage = new FakeStorage('{');
const corruptShelf = createPluginShelf(corruptStorage, { key: 'test' });
assert.throws(() => corruptShelf.list(), PluginStoreError);
assert.throws(() => corruptShelf.install(example), /corrupt/);
assert.equal(corruptStorage.setCalls, 0);

const inaccessible = { getItem(){ throw new Error('blocked'); }, setItem(){} };
assert.throws(() => createPluginShelf(inaccessible).list(), /could not be read/);

const boundedStorage = new FakeStorage();
const boundedShelf = createPluginShelf(boundedStorage, { key: 'bounded' });
for (let i = 0; i < LIMITS.shelfEntries; i++) boundedShelf.install({
  schema: PLUGIN_SCHEMA, id:`p-${String(i).padStart(2,'0')}`, name:`Plugin ${i}`, version:'1.0.0',
  mechanic:'creative', prompt:'Create a harmless local preview.', reward:{xp:0,joy:0,tokens:0,discoveries:0}
});
assert.throws(() => boundedShelf.install({
  schema: PLUGIN_SCHEMA, id:'p-overflow', name:'Overflow', version:'1.0.0', mechanic:'creative',
  prompt:'This should not fit the bounded shelf.', reward:{xp:0,joy:0,tokens:0,discoveries:0}
}), /entry limit exceeded/);

assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /<style[\s>]/i);
assert.match(html, /data-only/i);
assert.match(html, /preview metadata only/i);
assert.match(html, /Timing practice/);
assert.match(html, /practice measurement/i);
assert.match(html, /redline-classic\.json/);

console.log('PASS Arcade Forge: 10 validated/linked data-only recipes including bounded Redline timing semantics, safe storage/text rendering, no plugin code/network/prize authority.');
