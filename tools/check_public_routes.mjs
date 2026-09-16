import assert from 'node:assert/strict';
import { collectPublicRoutes } from './public-routes.mjs';

const baseRaw = process.env.PAGES_URL;
const githubSha = process.env.GITHUB_SHA;
assert.ok(baseRaw, 'PAGES_URL is required');
assert.match(githubSha ?? '', /^[0-9a-f]{40}$/i, 'GITHUB_SHA must be the exact tested 40-hex commit');

const base = new URL(baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`);
assert.equal(base.protocol, 'https:', 'Pages URL must use HTTPS');

const routes = await collectPublicRoutes();
assert.ok(routes.length > 0, 'public route inventory must not be empty');

const attempts = Math.max(1, Number.parseInt(process.env.PAGES_LIVE_ATTEMPTS || '30', 10));
const delayMs = Math.max(0, Number.parseInt(process.env.PAGES_LIVE_DELAY_MS || '2000', 10));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const pending = new Map(routes.map(route => [route, { status: 0, detail: 'not probed' }]));

async function probe(route) {
  const url = new URL(route, base);
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
    });
    return { route, url: url.href, status: response.status, detail: response.statusText };
  } catch (error) {
    return { route, url: url.href, status: 0, detail: String(error?.message || error) };
  }
}

for (let attempt = 1; attempt <= attempts && pending.size > 0; attempt++) {
  const observations = await Promise.all([...pending.keys()].map(probe));
  for (const result of observations) {
    if (result.status === 200) {
      pending.delete(result.route);
    } else {
      pending.set(result.route, { status: result.status, detail: result.detail, url: result.url });
    }
  }
  if (pending.size > 0 && attempt < attempts) await sleep(delayMs);
}

if (pending.size > 0) {
  for (const [route, result] of pending) {
    console.error(JSON.stringify({ route, ...result }));
  }
}
assert.equal(pending.size, 0, `${pending.size} canonical public route(s) did not resolve with HTTP 200 at ${base.href}`);

console.log(`PASS public route closure: ${routes.length} canonical routes live at ${base.href} for ${githubSha}`);
