import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPublicRoutes } from './public-routes.mjs';

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
  'research/projects/'
];
for (const route of required) assert.ok(routeSet.has(route), `required public route missing: ${route || '/'}`);

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
console.log(`PASS public route inventory: ${routes.length} canonical routes and ${localReferences} local HTML references resolve in-repository`);
