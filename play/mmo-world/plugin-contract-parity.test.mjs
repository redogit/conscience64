import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PLUGIN_POLICY, renderPluginContract } from './plugin-policy.mjs';

const contractUrl = new URL('./plugin-contract.json', import.meta.url);
const raw = await readFile(contractUrl, 'utf8');
const contract = JSON.parse(raw);

assert.equal(contract.schema, 'conscience64.mmo-world.plugin-contract/v1');
assert.equal(contract.pluginSchema, PLUGIN_POLICY.pluginSchema);
assert.equal(contract.version, PLUGIN_POLICY.version);
assert.equal(contract.executionModel, PLUGIN_POLICY.executionModel);
assert.deepEqual(contract.mechanics, PLUGIN_POLICY.mechanics);
assert.deepEqual(contract.limits, PLUGIN_POLICY.limits);
assert.deepEqual(contract.validation, PLUGIN_POLICY.validation);
assert.deepEqual(contract.security, PLUGIN_POLICY.security);
assert.deepEqual(contract.authority, PLUGIN_POLICY.authority);
assert.deepEqual(contract.lineage, PLUGIN_POLICY.lineage);
assert.equal(raw, renderPluginContract(), 'checked-in plugin-contract.json must be generated exactly from plugin-policy.mjs');

for (const [key, value] of Object.entries(PLUGIN_POLICY.security)) {
  if (key === 'importedTextIsDataOnly') continue;
  if (typeof value === 'boolean') assert.equal(value, false, `${key} must remain false`);
}
assert.equal(PLUGIN_POLICY.security.importedTextIsDataOnly, true);
assert.equal(PLUGIN_POLICY.executionModel, 'data-only');

console.log('PASS plugin contract parity: checked-in JSON exactly matches the frozen executable policy and preserves data-only/no-authority boundaries.');
