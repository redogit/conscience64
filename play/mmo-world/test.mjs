import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { REGION_VARIETIES, VARIETY_AXES, describeRegion, nextRegionVariety } from './varieties.mjs';

const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('companion.mjs', import.meta.url), 'utf8');
const protocols = JSON.parse(await readFile(new URL('protocols.json', import.meta.url), 'utf8'));
assert.match(html, /MMO World Beta/);assert.match(html, /\.\.\/explorer-world\/game\.mjs/);assert.match(html, /Connect Bluetooth companion/);assert.match(html, /shared networking gated/);
assert.match(html, /World Variety Lab/);assert.match(html, /Mutate harmless variety/);assert.match(html, /variety-ui\.mjs/);
assert.match(html, /Arcade Forge/);assert.match(html, /href="forge\//);assert.match(html, /plugin-contract\.json/);assert.match(html, /Reward values are preview metadata only/);
assert.match(html, /Founding-shard checkpoint/);assert.match(html, /Save progress/);assert.match(html, /Load progress/);assert.match(html, /Clear save/);
assert.ok(!html.includes('redline-shell.css'), 'retired Redline shell CSS must not be required by the simplified public surface');
assert.ok(!html.includes('redline-shell.mjs'), 'retired Redline shell controller must not be required by the simplified public surface');

assert.match(js, /requestDevice/);assert.match(js, /acceptAllDevices:\s*true/);assert.match(js, /gamepadconnected/);assert.ok(!js.includes('requestLEScan'));
assert.deepEqual(protocols.protocols.map(p => p.id), ['DU-SD/1','DU-CAP/1','DU-WATCH/1','DU-BT/1']);
assert.equal(protocols.protocols.find(p => p.id === 'DU-BT/1').serviceUuid, 'd3a00001-7e4f-4d55-9b3e-434f4e534336');
for (const [name, profile] of Object.entries(REGION_VARIETIES)) {
  for (const axis of VARIETY_AXES) assert.ok(profile[axis].length >= 3, `${name}:${axis}`);
  const a = describeRegion(name, 7, 640064), b = describeRegion(name, 7, 640064);
  assert.deepEqual(a, b);
  assert.equal(nextRegionVariety(name, 7, 640064).generation, 8);
}
assert.throws(() => describeRegion('Unknown Place'), /Unknown region variety/);
await import('./protocol-contract-parity.test.mjs');
await import('./plugin-contract-parity.test.mjs');
await import('./forge/test.mjs');
console.log('PASS MMO World beta: simplified Explorer shard shell, explicit local checkpoint controls, bounded protocols, Bluetooth gesture, deterministic adjective varieties, and strict data-only Arcade Forge.');
