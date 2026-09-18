import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPublicRoutes, publicRouteBytesEqual, publicRouteFile } from './public-routes.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = await collectPublicRoutes();
const routeSet = new Set(routes);
const toPosix = value => value.split(sep).join('/');

assert.equal(routeSet.size, routes.length, 'public route inventory must be deduplicated');
assert.ok(routes.length >= 30, `expected a broad public route inventory, got ${routes.length}`);

const required = [
  '',
  'play/',
  'play/mmo-world/',
  'play/mmo-world/forge/',
  'play/mmo/',
  'play/mmo/simple/',
  'play/explorer-world/',
  'play/fuzzball-hidden/',
  'play/musilanguage/',
  'play/musilanguage/radio.html',
  'play/musilanguage/radio.htm',
  'analytics/',
  'coordinate-space/',
  'research/projects/',
  'research/federation/s1-models/'
];
for (const route of required) assert.ok(routeSet.has(route), `required public route missing: ${route || '/'}`);

for (const route of routes) {
  const mapped = publicRouteFile(route);
  assert.equal(typeof mapped, 'string', `canonical route must map to a repository file: ${route || '/'}`);
  const mappedPath = resolve(repoRoot, mapped);
  const info = await stat(mappedPath);
  assert.ok(info.isFile(), `canonical route mapping must resolve to a file: ${route || '/'} -> ${mapped}`);
}
assert.equal(publicRouteBytesEqual(Buffer.from('exact'), Buffer.from('exact')), true, 'equal route bytes must close');
assert.equal(publicRouteBytesEqual(Buffer.from('exact'), Buffer.from('stale')), false, 'stale 200 bytes must remain unresolved');

const federationPointerPath = resolve(repoRoot, 'research/federation/s1-models.json');
const federationPagePath = resolve(repoRoot, 'research/federation/s1-models/index.html');
const pointer = JSON.parse(await readFile(federationPointerPath, 'utf8'));
const federationPage = await readFile(federationPagePath, 'utf8');
const researchRegistry = JSON.parse(await readFile(resolve(repoRoot, 'research/projects/projects.json'), 'utf8'));
const playRegistry = JSON.parse(await readFile(resolve(repoRoot, 'play/projects.json'), 'utf8'));

assert.equal(pointer.schema, 'conscience64/federation-pointer/v1');
assert.equal(pointer.id, 's1-models-experiment-0');
assert.equal(pointer.relation, 'OBSERVE_VERIFIED_EXTERNAL_BASELINE');
assert.equal(pointer.owner.repository, 'redogit/Other-Projects-');
assert.equal(pointer.owner.pr, 46);
assert.equal(pointer.owner.verifiedRevision, 'ab0b7c4724989f5d79a0bbfcd009582b40509140');
assert.equal(pointer.owner.implementationRevision, '4c5b3d0e599c029cc05478eaa5119b00d096e3c4');
assert.equal(pointer.owner.mergeCommit, '052b5989da596c2cd99313d4a29b0a386352467b');
assert.equal(pointer.owner.evidence.path, 'S1 Models Lab/evidence/EXPERIMENT_0_SUMMARY.json');
assert.equal(pointer.owner.evidence.blobSha, '51e1ccfddbddc50644df8f858b76cc9d89c3798e');
assert.equal(pointer.owner.evidence.implementationCi.runId, 35125214829);
assert.equal(pointer.owner.evidence.implementationTests.passed, 46);
assert.equal(pointer.owner.evidence.implementationTests.failed, 0);
assert.equal(pointer.owner.evidence.auditChecks, 18);
assert.equal(pointer.authorityTransfer, false);
assert.equal(pointer.ingestAutomatically, false);
assert.deepEqual(pointer.boundaries, [
  'FEDERATION_POINTER != RESEARCH_ADMISSION',
  'CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE',
  'SAME_EVENT != SAME_OBSERVATION',
  'SOFTWARE_VERIFICATION != SCIENTIFIC_VALIDATION',
  'FUNCTIONAL_BROWSER_SMOKE != RENDERED_USABILITY_OR_AT_VALIDATION'
]);
assert.deepEqual(pointer.prohibitedAutomaticMutations, [
  'research-project-registry',
  'hodge-authority',
  'world-game-canon',
  'geometry-lineage',
  'knowledge-ledger'
]);

assert.match(federationPage, /S'1 Models Experiment 0/);
assert.match(federationPage, /FEDERATION_POINTER != RESEARCH_ADMISSION/);
assert.match(federationPage, /CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE/);
assert.match(federationPage, /SAME_EVENT != SAME_OBSERVATION/);
assert.match(federationPage, /ab0b7c4724989f5d79a0bbfcd009582b40509140/);
assert.match(federationPage, /4c5b3d0e599c029cc05478eaa5119b00d096e3c4/);
assert.match(federationPage, /35125214829/);
assert.match(federationPage, /46\/46/);
assert.match(federationPage, /18\/18/);
assert.doesNotMatch(federationPage, /<script\b/i, 'federation page must remain passive navigation/observation only');

assert.equal((researchRegistry.projects ?? []).some(project => /s1[-']?models/i.test(String(project.id ?? '')) || /S'1 Models/i.test(String(project.name ?? ''))), false, 'federation pointer must not mutate research authority registry');
assert.equal((playRegistry.projects ?? []).some(project => /s1[-']?models/i.test(String(project.id ?? '')) || /S'1 Models/i.test(String(project.name ?? ''))), false, 'federation pointer must not mutate play/world authority registry');

let localReferences = 0;
for (const route of routes) {
  if (!route || route.endsWith('/') || !/\.html?$/i.test(route)) continue;
  const pagePath = resolve(repoRoot, route);
  await access(pagePath);
  const html = await readFile(pagePath, 'utf8');

  for (const match of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const rawTarget = match[1].trim();
    if (!rawTarget || rawTarget.startsWith('#') || rawTarget.startsWith('//')) continue;
    if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:)/i.test(rawTarget)) continue;

    const pathOnly = rawTarget.split('#', 1)[0].split('?', 1)[0];
    if (!pathOnly) continue;

    let decoded;
    try { decoded = decodeURIComponent(pathOnly); }
    catch { throw new Error(`invalid URL encoding in ${rawTarget} from ${route}`); }

    let targetPath;
    if (decoded.startsWith('/conscience64/')) {
      targetPath = resolve(repoRoot, decoded.slice('/conscience64/'.length));
    } else {
      assert.ok(!decoded.startsWith('/'), `project-breaking root-absolute local reference ${rawTarget} from ${route}`);
      targetPath = resolve(dirname(pagePath), decoded);
    }

    const repoRelative = toPosix(relative(repoRoot, targetPath));
    assert.ok(repoRelative !== '..' && !repoRelative.startsWith('../'), `local reference escapes repository: ${rawTarget} from ${route}`);

    let info;
    try { info = await stat(targetPath); }
    catch { throw new Error(`missing local reference ${rawTarget} from ${route} -> ${repoRelative || '/'}`); }
    if (info.isDirectory()) {
      try { await access(resolve(targetPath, 'index.html')); }
      catch { throw new Error(`local directory reference has no index.html: ${rawTarget} from ${route}`); }
    }
    localReferences += 1;
  }
}

assert.ok(localReferences > 0, 'expected public HTML to contain local href/src references');
console.log(`PASS public route inventory: ${routes.length} canonical routes and ${localReferences} local HTML references resolve in-repository; S'1 federation pointer remains navigation-only`);
