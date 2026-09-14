export const PLUGIN_SCHEMA = 'conscience64.mmo.plugin/v1';
export const STORAGE_KEY = 'conscience64.mmo-world.plugins/v1';
export const LIMITS = Object.freeze({
  fileBytes: 65536,
  shelfEntries: 64,
  shelfBytes: 262144,
  nameChars: 80,
  versionChars: 32,
  descriptionChars: 300,
  promptChars: 500,
  itemChars: 120,
  choices: 8,
  answers: 16,
});
export const REWARD_CAPS = Object.freeze({ xp: 40, joy: 20, tokens: 4, discoveries: 1 });
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const COMMON_FIELDS = new Set(['schema','id','name','version','mechanic','prompt','reward','description']);
const REWARD_FIELDS = new Set(Object.keys(REWARD_CAPS));
const MECHANIC_FIELDS = Object.freeze({
  choice: new Set(['choices','correctIndex']),
  input: new Set(['answers']),
  creative: new Set(),
});

export class PluginValidationError extends Error {}
export class PluginStoreError extends Error {}

const byteLength = value => new TextEncoder().encode(value).length;
const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const canonicalItem = value => value.normalize('NFC').trim().toLocaleLowerCase('en-US');

function onlyKeys(object, allowed, label) {
  for (const key of Object.keys(object)) if (!allowed.has(key)) throw new PluginValidationError(`${label} contains unsupported field: ${key}`);
}
function boundedText(value, max, field) {
  if (typeof value !== 'string') throw new PluginValidationError(`${field} must be text`);
  const text = value.normalize('NFC').trim();
  if (!text || text.length > max) throw new PluginValidationError(`${field} length invalid`);
  return text;
}
function boundedInt(value, key) {
  if (!Number.isInteger(value) || value < 0 || value > REWARD_CAPS[key]) throw new PluginValidationError(`reward.${key} invalid`);
  return value;
}
function uniqueTextList(value, maxItems, field) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) throw new PluginValidationError(`${field} invalid`);
  const out = value.map((item, index) => boundedText(item, LIMITS.itemChars, `${field}[${index}]`));
  const seen = new Set();
  for (const item of out) {
    const key = canonicalItem(item);
    if (seen.has(key)) throw new PluginValidationError(`${field} contains duplicate items`);
    seen.add(key);
  }
  return Object.freeze(out);
}
function deepFreezePlugin(plugin) {
  Object.freeze(plugin.reward);
  if (plugin.choices) Object.freeze(plugin.choices);
  if (plugin.answers) Object.freeze(plugin.answers);
  return Object.freeze(plugin);
}
function serializedBytes(value) {
  let raw;
  try { raw = JSON.stringify(value); }
  catch { throw new PluginValidationError('plugin must be serializable JSON data'); }
  if (typeof raw !== 'string') throw new PluginValidationError('plugin must be serializable JSON data');
  return byteLength(raw);
}

export function validatePlugin(input) {
  if (!isPlainObject(input)) throw new PluginValidationError('plugin must be a plain JSON object');
  if (serializedBytes(input) > LIMITS.fileBytes) throw new PluginValidationError('plugin file too large');
  if (input.schema !== PLUGIN_SCHEMA) throw new PluginValidationError('wrong plugin schema');
  const mechanic = input.mechanic;
  if (!Object.hasOwn(MECHANIC_FIELDS, mechanic)) throw new PluginValidationError('unsupported mechanic');
  const allowed = new Set([...COMMON_FIELDS, ...MECHANIC_FIELDS[mechanic]]);
  onlyKeys(input, allowed, 'plugin');

  const id = boundedText(input.id, 64, 'id');
  if (!ID_PATTERN.test(id)) throw new PluginValidationError('plugin id invalid');
  const name = boundedText(input.name, LIMITS.nameChars, 'name');
  const version = boundedText(input.version, LIMITS.versionChars, 'version');
  if (!VERSION_PATTERN.test(version)) throw new PluginValidationError('version must be semantic version text');
  const prompt = boundedText(input.prompt, LIMITS.promptChars, 'prompt');

  if (!isPlainObject(input.reward)) throw new PluginValidationError('reward must be an object');
  onlyKeys(input.reward, REWARD_FIELDS, 'reward');
  const reward = {};
  for (const key of REWARD_FIELDS) reward[key] = boundedInt(input.reward[key] ?? 0, key);

  const plugin = { schema: PLUGIN_SCHEMA, id, name, version, mechanic, prompt, reward };
  if (input.description != null) plugin.description = boundedText(input.description, LIMITS.descriptionChars, 'description');

  if (mechanic === 'choice') {
    const choices = uniqueTextList(input.choices, LIMITS.choices, 'choices');
    if (choices.length < 2) throw new PluginValidationError('choices must contain at least two items');
    if (!Number.isInteger(input.correctIndex) || input.correctIndex < 0 || input.correctIndex >= choices.length) throw new PluginValidationError('correctIndex invalid');
    plugin.choices = choices;
    plugin.correctIndex = input.correctIndex;
  } else if (mechanic === 'input') {
    plugin.answers = uniqueTextList(input.answers, LIMITS.answers, 'answers');
  }

  return deepFreezePlugin(plugin);
}

export function parsePluginJson(text) {
  if (typeof text !== 'string') throw new PluginValidationError('plugin JSON must be text');
  if (byteLength(text) > LIMITS.fileBytes) throw new PluginValidationError('plugin file too large');
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new PluginValidationError('plugin JSON is invalid'); }
  return validatePlugin(parsed);
}

export function exportPlugin(plugin) {
  return JSON.stringify(validatePlugin(plugin), null, 2);
}

export function createPluginShelf(storage, options = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw new PluginStoreError('browser storage unavailable');
  const key = options.key || STORAGE_KEY;

  function read() {
    const raw = storage.getItem(key);
    if (raw == null || raw === '') return [];
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { throw new PluginStoreError('stored plugin shelf is corrupt; it was not overwritten'); }
    if (!Array.isArray(parsed)) throw new PluginStoreError('stored plugin shelf is corrupt; it was not overwritten');
    return parsed.map((row, index) => {
      try { return validatePlugin(row); }
      catch (error) { throw new PluginStoreError(`stored plugin ${index + 1} is invalid; shelf was not overwritten: ${error.message}`); }
    });
  }

  function persist(rows) {
    const raw = JSON.stringify(rows);
    if (byteLength(raw) > LIMITS.shelfBytes) throw new PluginStoreError('plugin shelf storage limit exceeded');
    try { storage.setItem(key, raw); }
    catch { throw new PluginStoreError('plugin shelf could not be saved'); }
  }

  function list() { return read(); }
  function install(input) {
    const plugin = validatePlugin(input);
    const rows = read().filter(row => row.id !== plugin.id);
    rows.push(plugin);
    if (rows.length > LIMITS.shelfEntries) throw new PluginStoreError('plugin shelf entry limit exceeded');
    persist(rows);
    return plugin;
  }
  function remove(id) {
    const cleanId = boundedText(id, 64, 'id');
    const rows = read().filter(row => row.id !== cleanId);
    persist(rows);
    return rows.length;
  }

  return Object.freeze({ key, list, install, remove });
}
