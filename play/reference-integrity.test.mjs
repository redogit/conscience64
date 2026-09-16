import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const here = import.meta.url;
const root = new URL('../', here);
const mustExist = async url => {
  try { await stat(url); return true; }
  catch { return false; }
};

const resolverUrl = new URL('assets/reference-resolver.mjs', here);
const rulesUrl = new URL('reference-rules.json', here);
const notFoundUrl = new URL('../404.html', here);

assert.equal(await mustExist(resolverUrl), true, 'missing generic reference resolver');
assert.equal(await mustExist(rulesUrl), true, 'missing reference-rules single point of contact');
assert.equal(await mustExist(notFoundUrl), true, 'missing root compatibility 404 surface');

const { REFERENCE_RESOLVER_SCHEMA, resolveOneStepReference } = await import(resolverUrl);
const rules = JSON.parse(await readFile(rulesUrl, 'utf8'));
assert.equal(REFERENCE_RESOLVER_SCHEMA, 'conscience64.reference-resolver/v1');
assert.equal(rules.schema, 'conscience64.reference-rules/v1');

const known = new Set([
  'play/musilanguage/radio.html',
  'play/mmo/forge.html',
  'example/a.html',
  'example/a.md'
]);
const exists = async path => known.has(path);

const exact = await resolveOneStepReference('play/musilanguage/radio.htm', rules, exists);
assert.deepEqual(exact, {
  status: 'HISTORICAL_ALIAS',
  reference: 'play/musilanguage/radio.htm',
  resolved: 'play/musilanguage/radio.html',
  rule: 'musilanguage-radio-legacy-htm'
});

const format = await resolveOneStepReference('play/mmo/forge.htm', rules, exists);
assert.deepEqual(format, {
  status: 'FORMAT_VARIANT',
  reference: 'play/mmo/forge.htm',
  resolved: 'play/mmo/forge.html',
  rule: 'legacy-htm-to-html'
});

const broken = await resolveOneStepReference('play/missing.htm', rules, exists);
assert.deepEqual(broken, {
  status: 'BROKEN',
  reference: 'play/missing.htm',
  resolved: null,
  rule: null
});

const ambiguousRules = {
  ...rules,
  aliases: {},
  transforms: [
    { id: 'old-to-html', fromSuffix: '.old', toSuffix: '.html', status: 'FORMAT_VARIANT' },
    { id: 'old-to-md', fromSuffix: '.old', toSuffix: '.md', status: 'FORMAT_VARIANT' }
  ]
};
const ambiguous = await resolveOneStepReference('example/a.old', ambiguousRules, exists);
assert.equal(ambiguous.status, 'AMBIGUOUS');
assert.equal(ambiguous.reference, 'example/a.old');
assert.deepEqual(ambiguous.resolutions.map(x => x.resolved).sort(), ['example/a.html', 'example/a.md']);

for (const unsafe of ['../secret.htm', '/outside.htm', 'https://example.com/x.htm', 'javascript:alert(1)']) {
  const result = await resolveOneStepReference(unsafe, rules, exists);
  assert.equal(result.status, 'OUT_OF_SCOPE', `unsafe reference must stay out of scope: ${unsafe}`);
}

const notFound = await readFile(notFoundUrl, 'utf8');
assert.match(notFound, /reference-rules\.json/);
assert.match(notFound, /reference-resolver\.mjs/);
assert.match(notFound, /location\.replace/);
assert.match(notFound, /search/);
assert.match(notFound, /hash/);

// Immediate one-hop public surface: every local href/src in Musilanguage HTML must resolve.
for (const page of ['musilanguage/index.html', 'musilanguage/radio.html', 'musilanguage/single.html', 'musilanguage/word-forge.html']) {
  const pageUrl = new URL(page, here);
  const html = await readFile(pageUrl, 'utf8');
  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (target.startsWith('#') || target.startsWith('https:') || target.startsWith('http:') || target.startsWith('data:') || target.startsWith('mailto:')) continue;
    const url = target.startsWith('/conscience64/')
      ? new URL(target.slice('/conscience64/'.length), root)
      : new URL(target, pageUrl);
    assert.equal(await mustExist(url), true, `missing Musilanguage local reference ${target} from ${page}`);
  }
}

console.log('PASS reference integrity: bounded forward/reverse reference resolution, ambiguity refusal, unsafe-scope refusal, and Musilanguage one-hop static references');
