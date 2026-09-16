import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPublicRoutes } from './public-routes.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = await collectPublicRoutes();
const routeSet = new Set(routes);

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

for (const route of routes) {
  if (!route || route.endsWith('/')) continue;
  if (/\.html?$/i.test(route)) await access(resolve(repoRoot, route));
}

console.log(`PASS public route inventory: ${routes.length} canonical file/directory/alias routes, including MMO World, Explorer, Forge, Simple MMO, Musilanguage, analytics, and Coordinate Space`);
