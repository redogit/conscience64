import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPublicRoutes, publicRouteBytesEqual, publicRouteFile } from './public-routes.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseRaw = process.env.PAGES_URL;
const githubSha = process.env.GITHUB_SHA;
assert.ok(baseRaw, 'PAGES_URL is required');
assert.match(githubSha ?? '', /^[0-9a-f]{40}$/i, 'GITHUB_SHA must be the exact tested 40-hex commit');

const base = new URL(baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`);
assert.equal(base.protocol, 'https:', 'Pages URL must use HTTPS');

const routes = await collectPublicRoutes();
assert.ok(routes.length > 0, 'public route inventory must not be empty');

const expectedByRoute = new Map();
for (const route of routes) {
  expectedByRoute.set(route, await readFile(resolve(repoRoot, publicRouteFile(route))));
}

const attempts = Math.max(1, Number.parseInt(process.env.PAGES_LIVE_ATTEMPTS || '30', 10));
const delayMs = Math.max(0, Number.parseInt(process.env.PAGES_LIVE_DELAY_MS || '2000', 10));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const pending = new Map(routes.map(route => [route, { status: 0, detail: 'not probed' }]));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function probe(route) {
  const url = new URL(route, base);
  const expected = expectedByRoute.get(route);
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
    });
    const actual = Buffer.from(await response.arrayBuffer());
    if (response.status !== 200) {
      return { route, url: url.href, status: response.status, detail: response.statusText };
    }
    if (!publicRouteBytesEqual(expected, actual)) {
      return {
        route,
        url: url.href,
        status: response.status,
        detail: 'HTTP 200 but response bytes are stale or otherwise differ from the exact source file',
        expectedBytes: expected.length,
        actualBytes: actual.length,
        expectedSha256: sha256(expected),
        actualSha256: sha256(actual)
      };
    }
    return { route, url: url.href, status: response.status, detail: 'exact-source-bytes' };
  } catch (error) {
    return { route, url: url.href, status: 0, detail: String(error?.message || error) };
  }
}

for (let attempt = 1; attempt <= attempts && pending.size > 0; attempt++) {
  const observations = await Promise.all([...pending.keys()].map(probe));
  for (const result of observations) {
    if (result.status === 200 && result.detail === 'exact-source-bytes') {
      pending.delete(result.route);
    } else {
      pending.set(result.route, result);
    }
  }
  if (pending.size > 0 && attempt < attempts) await sleep(delayMs);
}

if (pending.size > 0) {
  for (const [route, result] of pending) console.error(JSON.stringify({ route, ...result }));
}
assert.equal(
  pending.size,
  0,
  `${pending.size} canonical public route(s) did not resolve with HTTP 200 and exact source bytes at ${base.href}`
);

console.log(`PASS public route byte closure: ${routes.length} canonical routes live with exact source bytes at ${base.href} for ${githubSha}`);
