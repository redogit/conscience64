import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EVENT_KINDS, validateEvent } from './event-contract.mjs';

const validBase = {
  time: '2026-09-14T00:30:00-04:00',
  kind: 'OBSERVATION',
  project: 'analytics',
  message: 'Contract check',
  evidence: 'executed',
  source: 'analytics/test.mjs',
  status: 'recorded',
};

for (const kind of EVENT_KINDS) {
  assert.equal(validateEvent({ ...validBase, kind }).ok, true, kind);
}
assert.equal(validateEvent({ ...validBase, kind: 'PROVED_BY_REPETITION' }).ok, false);
assert.equal(validateEvent({ ...validBase, time: 'not-a-time' }).ok, false);
assert.equal(validateEvent({ ...validBase, source: '' }).ok, false);
assert.equal(validateEvent(null).ok, false);

const index = await readFile(new URL('index.html', import.meta.url), 'utf8');
const dashboard = await readFile(new URL('dashboard.mjs', import.meta.url), 'utf8');
const schema = await readFile(new URL('EVENT_SCHEMA.md', import.meta.url), 'utf8');
const bridge = await readFile(new URL('llvm_event_bridge.cpp', import.meta.url), 'utf8');

assert.match(index, /Content-Security-Policy/);
assert.match(index, /dashboard\.mjs/);
assert.match(index, /styles\.css/);
assert.match(index, /role="log"/);
assert.match(dashboard, /validateEvent/);
assert.match(dashboard, /DEMO DATA · SSE READY/);
assert.equal(dashboard.includes('innerHTML'), false, 'stream rendering must not use innerHTML');

for (const kind of EVENT_KINDS) assert.ok(schema.includes(`\`${kind}\``), `schema missing ${kind}`);
assert.match(schema, /"time"/);
assert.match(bridge, /\{"time", isoUtcNow\(\)\}/);
assert.equal(bridge.includes('time_unix_ms'), false, 'bridge must emit the contract time field');

console.log(`PASS analytics contract: ${EVENT_KINDS.length} event kinds, validated DOM rendering, ISO time bridge.`);
