#!/usr/bin/env node
// Check shipped bytes and run the actual browser API with local fetch and DOM stubs.
// This covers startup/data/API behavior; it does not claim visual browser coverage.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

try {
  const root = resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)));
  const read = path => readFile(resolve(root, path));
  const json = async path => JSON.parse(await read(path));
  const hash = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
  const manifest = await json('data-manifest.json');
  assert.equal(manifest.schema, 'conscience64.transport-manifest/v1');
  assert.equal(manifest.transportEncoding, 'base64(gzip(utf8(json)))');
  assert.ok(manifest.shards.length > 0, 'transport must declare shards');
  assert.equal(new Set(manifest.shards.map(s => s.path)).size, manifest.shards.length, 'duplicate shard paths');
  const chunks = [];
  for (const shard of manifest.shards) {
    assert.match(shard.path, /^data-\d{2,}\.txt$/);
    assert.ok(['PAYLOAD', 'RESERVED_CONTINUATION'].includes(shard.state), `unknown state: ${shard.path}`);
    const bytes = await read(shard.path);
    assert.equal(bytes.length, shard.bytes, `byte count: ${shard.path}`);
    assert.equal(hash('sha1', Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])), shard.gitBlobSha, `Git blob: ${shard.path}`);
    if (shard.sha256) assert.equal(hash('sha256', bytes), shard.sha256, `SHA-256: ${shard.path}`);
    if (shard.state === 'PAYLOAD') {
      assert.ok(bytes.length > 0, `empty payload: ${shard.path}`);
      chunks.push(bytes);
    } else assert.equal(bytes.length, 0, `reserved shard contains payload: ${shard.path}`);
  }
  const encoded = Buffer.concat(chunks).toString('ascii');
  const compressed = Buffer.from(encoded, 'base64');
  assert.ok(compressed.toString('base64').replace(/=+$/, '') === encoded.replace(/=+$/, ''), 'invalid base64');
  const decoded = gunzipSync(compressed); // Validates the entire gzip stream, including its trailer.
  assert.equal(decoded.length, manifest.decodedBytes, 'decoded byte count');
  assert.equal(hash('sha256', decoded), manifest.decodedSha256, 'decoded SHA-256');
  const records = JSON.parse(decoded);
  assert.ok(Array.isArray(records));
  assert.equal(records.length, manifest.recordCount, 'record count');
  const byId = new Map(records.map(r => [r.logicalId, r]));
  assert.equal(byId.size, records.length, 'duplicate logical IDs');
  assert.equal(new Set(records.map(r => r.uoid)).size, records.length, 'duplicate UOIDs');
  const counts = {};
  for (const record of records) {
    assert.match(record.uoid, /^uoid:sha256:[0-9a-f]{64}$/, `invalid UOID: ${record.logicalId}`);
    assert.ok(typeof record.logicalId === 'string' && record.logicalId.length > 0);
    counts[record.objectType] = (counts[record.objectType] || 0) + 1;
    if (record.objectType === 'research-edge') {
      for (const endpoint of ['source', 'target']) {
        const node = byId.get(record[endpoint]);
        assert.ok(node, `missing ${endpoint} of ${record.logicalId}`);
        assert.equal(node.uoid, record[`${endpoint}Uoid`], `endpoint UOID: ${record.logicalId}`);
      }
    }
  }
  assert.deepEqual(counts, manifest.objectTypes);
  assert.equal(byId.get('space:manifest')?.uoid, manifest.corpusUoid);
  const audit = await json('BUILD_AUDIT.json');
  assert.equal(audit.recordCount, records.length);
  assert.equal(audit.payloadShards, chunks.length);
  assert.equal(audit.spaceUoid, manifest.corpusUoid);

  // Use Node's real Response, Blob, atob and DecompressionStream in app.js.
  // No network access or substituted search/graph implementation is involved.
  const html = (await read('index.html')).toString('utf8');
  assert.match(html, /<script\b[^>]*type="module"[^>]*src="\.\/app\.js"/);
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1], { textContent: '' }]));
  for (const id of ['space', 'irpo-i', 'irpo-r', 'irpo-p', 'irpo-o']) assert.ok(elements.has(id), `missing DOM element: ${id}`);
  elements.get('space').getContext = () => null; // Canvas drawing is outside this API smoke check.
  globalThis.document = { getElementById: id => elements.get(id) || null };
  const events = new EventTarget();
  globalThis.addEventListener = events.addEventListener.bind(events);
  globalThis.dispatchEvent = events.dispatchEvent.bind(events);
  let ready;
  events.addEventListener('conscience64-ready', event => { ready = event.detail; });
  globalThis.fetch = async input => {
    const url = new URL(input, 'https://conscience64.test/');
    assert.equal(url.origin, 'https://conscience64.test', 'unexpected external request');
    const path = decodeURIComponent(url.pathname).slice(1);
    assert.ok(!path.split('/').includes('..'), 'fetch path escapes repository');
    try { return new Response(await read(path)); }
    catch (error) { if (error.code === 'ENOENT') return new Response('', { status: 404 }); throw error; }
  };
  const code = await read('app.js');
  await import(`data:text/javascript;base64,${code.toString('base64')}`);
  assert.ok(ready, 'app never emitted conscience64-ready');
  const api = globalThis.Conscience64API;
  assert.equal(api.stats().total, records.length);
  assert.deepEqual(api.stats().byType, counts);
  assert.equal(api.get('project:physics').uoid, byId.get('project:physics').uoid);
  assert.ok(api.search.simple('physics').results.some(r => r.logicalId === 'project:physics'));
  assert.ok(api.relations('project:physics').total > 0);
  assert.ok(api.traverse('project:orbit', { depth: 2 }).nodes.length > 1);
  assert.equal(api.microdata('project:physics').itemId, byId.get('project:physics').uoid);
  const registry = await json('research/projects/projects.json');
  assert.equal(api.projects.list().total, registry.projects.length);
  assert.equal(api.stats().projects.count, registry.projects.length);
  assert.equal(api.irpo({ I: 'historical-recovery', P: { action: 'projects.reflow' } }).O.projectId, 'historical-recovery');
  assert.ok(elements.get('irpo-o').textContent.includes('historical-recovery'));
  console.log(`PASS site: ${records.length} records, ${counts['research-node']} nodes, ${counts['research-edge']} edges, ${registry.projects.length} projects; app startup and API smoke checks`);
} catch (error) {
  console.error(`FAIL site: ${error.message}`);
  process.exitCode = 1;
}
