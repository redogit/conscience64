import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderAliasPage } from './generate-reference-aliases.mjs';

const baseRaw = process.env.PAGES_URL;
assert.ok(baseRaw, 'PAGES_URL is required');
const base = new URL(baseRaw.endsWith('/') ? baseRaw : `${baseRaw}/`);
assert.equal(base.protocol, 'https:', 'Pages URL must use HTTPS');

const rules = JSON.parse(await readFile(new URL('../play/reference-rules.json', import.meta.url), 'utf8'));
assert.equal(rules.schema, 'conscience64.reference-rules/v1');
const aliases = Object.entries(rules.aliases || {});
assert.ok(aliases.length > 0, 'at least one declared historical alias is required for live verification');

const attempts = Math.max(1, Number.parseInt(process.env.PAGES_LIVE_ATTEMPTS || '30', 10));
const delayMs = Math.max(0, Number.parseInt(process.env.PAGES_LIVE_DELAY_MS || '2000', 10));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

for (const [alias, declaration] of aliases) {
  const target = typeof declaration === 'string' ? declaration : declaration?.target ?? declaration?.resolved;
  assert.equal(typeof target, 'string', `missing target for ${alias}`);
  const expected = renderAliasPage(alias, target);
  const url = new URL(alias, base);
  let last = { status: 0, body: '' };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
      });
      const body = await response.text();
      last = { status: response.status, body };
      if (response.status === 200 && body === expected) break;
    } catch (error) {
      last = { status: 0, body: String(error?.message || error) };
    }
    if (attempt < attempts) await sleep(delayMs);
  }

  assert.equal(last.status, 200, `live alias did not resolve with HTTP 200: ${url}`);
  assert.equal(last.body, expected, `live alias bytes differ from generated source: ${url}`);
  console.log(`PASS live alias: ${alias} -> ${target}`);
}

console.log(`PASS public reference aliases: ${aliases.length} declared alias${aliases.length === 1 ? '' : 'es'} live at ${base.href}`);
