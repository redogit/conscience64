import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectDirectPublicAssetReferences, collectDirectPublicAssets, collectOneHopPublicAssetDependencies, collectOneHopPublicAssetDependencyReferences, collectPublicRoutes, collectSecondHopPublicAssetDependencies, collectSecondHopPublicAssetDependencyReferences, collectImportMetaUrlPublicAssetReferences, collectImportMetaUrlPublicAssets, collectStaticPublicAssetDependencyClosure, publicRouteBytesEqual, publicRouteFile } from './public-routes.mjs';

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

const assetReferences = await collectDirectPublicAssetReferences();
const directAssets = await collectDirectPublicAssets();
assert.ok(assetReferences.length > 0, 'expected canonical HTML to expose direct local non-HTML asset references');
assert.ok(directAssets.length > 0, 'expected a non-empty direct public asset inventory');
assert.equal(new Set(directAssets).size, directAssets.length, 'direct public asset inventory must be deduplicated');
assert.deepEqual([...directAssets].sort((a, b) => a.localeCompare(b)), directAssets, 'direct public asset inventory must be deterministic');
for (const record of assetReferences) {
  assert.ok(routeSet.has(record.route), `asset provenance route must be canonical: ${record.route || '/'}`);
  assert.equal(typeof record.raw, 'string');
  assert.match(record.attribute, /^(?:href|src|poster|srcset)$/);
  assert.ok(directAssets.includes(record.asset), `asset record must appear in direct inventory: ${record.asset}`);
}
for (const asset of directAssets) {
  assert.ok(!/\.html?$/i.test(asset), `direct asset inventory must exclude HTML navigation: ${asset}`);
  const info = await stat(resolve(repoRoot, asset));
  assert.ok(info.isFile(), `direct asset must resolve to a repository file: ${asset}`);
}

const oneHopReferences = await collectOneHopPublicAssetDependencyReferences();
const oneHopDependencies = await collectOneHopPublicAssetDependencies();
assert.ok(oneHopReferences.length > 0, 'expected direct JS/CSS assets to expose at least one static one-hop dependency');
assert.ok(oneHopDependencies.length > 0, 'expected a non-empty one-hop public asset dependency inventory');
assert.equal(new Set(oneHopDependencies).size, oneHopDependencies.length, 'one-hop dependency inventory must be deduplicated');
assert.deepEqual([...oneHopDependencies].sort((a, b) => a.localeCompare(b)), oneHopDependencies, 'one-hop dependency inventory must be deterministic');
for (const record of oneHopReferences) {
  assert.ok(directAssets.includes(record.source), `one-hop dependency source must be a direct asset: ${record.source}`);
  assert.ok(oneHopDependencies.includes(record.dependency), `one-hop dependency record must appear in inventory: ${record.dependency}`);
  assert.match(record.kind, /^(?:js-import|js-dynamic-import|css-url|css-import)$/);
  assert.equal(typeof record.raw, 'string');
}
for (const dependency of oneHopDependencies) {
  const info = await stat(resolve(repoRoot, dependency));
  assert.ok(info.isFile(), `one-hop dependency must resolve to a repository file: ${dependency}`);
}

const secondHopReferences = await collectSecondHopPublicAssetDependencyReferences();
const secondHopDependencies = await collectSecondHopPublicAssetDependencies();
assert.equal(new Set(secondHopDependencies).size, secondHopDependencies.length, 'second-hop dependency inventory must be deduplicated');
assert.deepEqual([...secondHopDependencies].sort((a, b) => a.localeCompare(b)), secondHopDependencies, 'second-hop dependency inventory must be deterministic');
for (const record of secondHopReferences) {
  assert.ok(oneHopDependencies.includes(record.source), `second-hop source must be a first-hop dependency: ${record.source}`);
  assert.ok(secondHopDependencies.includes(record.dependency), `second-hop record must appear in inventory: ${record.dependency}`);
  assert.match(record.kind, /^(?:js-import|js-dynamic-import|css-url|css-import)$/);
}
for (const dependency of secondHopDependencies) {
  const info = await stat(resolve(repoRoot, dependency));
  assert.ok(info.isFile(), `second-hop dependency must resolve to a repository file: ${dependency}`);
}

const staticClosure = await collectStaticPublicAssetDependencyClosure();
assert.equal(staticClosure.closed, true, 'static public dependency traversal must reach a fixed point');
assert.deepEqual(staticClosure.roots, directAssets, 'fixed-point traversal roots must equal the admitted direct asset inventory');
assert.ok(staticClosure.layers.length >= 2, 'fixed-point traversal must preserve at least the two observed dependency depths');
assert.deepEqual(staticClosure.layers[0].dependencies, oneHopDependencies, 'depth 1 must preserve the admitted one-hop dependency view');
assert.deepEqual(staticClosure.layers[1].dependencies, secondHopDependencies, 'depth 2 must preserve the admitted second-hop dependency view');
assert.equal(staticClosure.layers.at(-1).newDependencies.length, 0, 'terminal dependency layer must introduce zero new files');
assert.equal(new Set(staticClosure.dependencies).size, staticClosure.dependencies.length, 'fixed-point dependency closure must be deduplicated');
assert.deepEqual([...staticClosure.dependencies].sort((a, b) => a.localeCompare(b)), staticClosure.dependencies, 'fixed-point dependency closure must be deterministic');
const processedSources = new Set();
const seenFiles = new Set(directAssets);
for (let index = 0; index < staticClosure.layers.length; index++) {
  const layer = staticClosure.layers[index];
  assert.equal(layer.depth, index + 1, 'dependency layer depths must be consecutive');
  for (const source of layer.sources) {
    assert.equal(processedSources.has(source), false, `source must not be reprocessed across layers: ${source}`);
    processedSources.add(source);
  }
  for (const dependency of layer.newDependencies) {
    assert.equal(seenFiles.has(dependency), false, `new dependency must truly be new at its layer: ${dependency}`);
    seenFiles.add(dependency);
  }
}
for (const dependency of staticClosure.dependencies) {
  const info = await stat(resolve(repoRoot, dependency));
  assert.ok(info.isFile(), `fixed-point dependency must resolve to a repository file: ${dependency}`);
}

const importMetaUrlReferences = await collectImportMetaUrlPublicAssetReferences();
const importMetaUrlAssets = await collectImportMetaUrlPublicAssets();
assert.equal(new Set(importMetaUrlAssets).size, importMetaUrlAssets.length, 'import.meta.url asset inventory must be deduplicated');
assert.deepEqual([...importMetaUrlAssets].sort((a, b) => a.localeCompare(b)), importMetaUrlAssets, 'import.meta.url asset inventory must be deterministic');
const admittedStaticSources = new Set([...directAssets, ...staticClosure.dependencies]);
for (const record of importMetaUrlReferences) {
  assert.ok(admittedStaticSources.has(record.source), `import.meta.url source must already be in the closed static public graph: ${record.source}`);
  assert.equal(record.kind, 'js-import-meta-url');
  assert.equal(typeof record.raw, 'string');
  assert.ok(importMetaUrlAssets.includes(record.asset), `import.meta.url record must appear in inventory: ${record.asset}`);
}
for (const asset of importMetaUrlAssets) {
  const info = await stat(resolve(repoRoot, asset));
  assert.ok(info.isFile(), `import.meta.url asset must resolve to a repository file: ${asset}`);
}

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
console.log(`PASS public route inventory: ${routes.length} canonical routes, ${localReferences} local HTML references, ${assetReferences.length} direct asset references, ${directAssets.length} unique direct assets, ${oneHopReferences.length} one-hop dependency references, ${oneHopDependencies.length} unique one-hop dependencies, ${secondHopReferences.length} second-hop dependency references, ${secondHopDependencies.length} unique second-hop dependencies, and fixed-point static closure spans ${staticClosure.layers.length} layers / ${staticClosure.dependencies.length} unique dependency files, and ${importMetaUrlReferences.length} literal import.meta.url references / ${importMetaUrlAssets.length} unique import.meta.url assets resolve in-repository; S'1 federation pointer remains navigation-only`);
