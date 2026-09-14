'use strict';
(() => {
  const STORAGE_KEY = 'conscience64.mmo.plugins/v1';
  const SCHEMA = 'conscience64.mmo.plugin/v1';
  const MAX_BYTES = 65536;
  const limits = { name:80, prompt:500, item:120 };
  const rewardCaps = { xp:40, joy:20, tokens:4, discoveries:1 };
  const idPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;
  const text = (value, max, field) => {
    if (typeof value !== 'string') throw new Error(`${field} must be text`);
    const v = value.trim();
    if (!v || v.length > max) throw new Error(`${field} length invalid`);
    return v;
  };
  const boundedInt = (value, key) => {
    const n = Number(value ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > rewardCaps[key]) throw new Error(`reward.${key} invalid`);
    return n;
  };
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('plugin must be an object');
    const raw = JSON.stringify(input);
    if (new TextEncoder().encode(raw).length > MAX_BYTES) throw new Error('plugin file too large');
    if (input.schema !== SCHEMA) throw new Error('wrong plugin schema');
    const id = text(input.id, 64, 'id');
    if (!idPattern.test(id)) throw new Error('plugin id invalid');
    const name = text(input.name, limits.name, 'name');
    const version = text(input.version, 32, 'version');
    const prompt = text(input.prompt, limits.prompt, 'prompt');
    const mechanic = input.mechanic;
    if (!['choice','input','creative'].includes(mechanic)) throw new Error('unsupported mechanic');
    const reward = {
      xp: boundedInt(input.reward?.xp, 'xp'),
      joy: boundedInt(input.reward?.joy, 'joy'),
      tokens: boundedInt(input.reward?.tokens, 'tokens'),
      discoveries: boundedInt(input.reward?.discoveries, 'discoveries')
    };
    const plugin = { schema:SCHEMA, id, name, version, mechanic, prompt, reward };
    if (input.description != null) plugin.description = text(input.description, 300, 'description');
    if (mechanic === 'choice') {
      if (!Array.isArray(input.choices) || input.choices.length < 2 || input.choices.length > 8) throw new Error('choices invalid');
      plugin.choices = input.choices.map((x,i)=>text(x, limits.item, `choices[${i}]`));
      if (!Number.isInteger(input.correctIndex) || input.correctIndex < 0 || input.correctIndex >= plugin.choices.length) throw new Error('correctIndex invalid');
      plugin.correctIndex = input.correctIndex;
    }
    if (mechanic === 'input') {
      if (!Array.isArray(input.answers) || input.answers.length < 1 || input.answers.length > 16) throw new Error('answers invalid');
      plugin.answers = input.answers.map((x,i)=>text(x, limits.item, `answers[${i}]`));
    }
    return Object.freeze(plugin);
  }
  function loadRaw() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  function list() {
    const clean = [];
    for (const row of loadRaw()) { try { clean.push(validate(row)); } catch {} }
    return clean;
  }
  function persist(rows) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }
  function install(input) {
    const plugin = validate(input);
    const rows = list().filter(p => p.id !== plugin.id);
    rows.push(plugin);
    persist(rows);
    return plugin;
  }
  function remove(id) {
    const rows = list().filter(p => p.id !== id);
    persist(rows);
    return rows.length;
  }
  function exportPlugin(plugin) { return JSON.stringify(validate(plugin), null, 2); }
  globalThis.Conscience64MMOPlugins = Object.freeze({ schema:SCHEMA, validate, list, install, remove, exportPlugin, storageKey:STORAGE_KEY });
})();
