import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_ROOTS = ['play', 'about', 'history', 'analytics', 'coordinate-space', 'research/projects', 'research/federation'];

const toPosix = value => value.split(sep).join('/');

async function collectHtmlFiles(root) {
  const absoluteRoot = join(repoRoot, root);
  const output = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (/\.html?$/i.test(entry.name)) {
        output.push(toPosix(relative(repoRoot, absolute)));
      }
    }
  }

  await walk(absoluteRoot);
  return output;
}

function addHtmlRoute(routes, path) {
  routes.add(path);
  if (path === 'index.html') {
    routes.add('');
  } else if (path.endsWith('/index.html')) {
    routes.add(path.slice(0, -'index.html'.length));
  }
}

export function publicRouteFile(route) {
  if (typeof route !== 'string' || route.startsWith('/') || route.includes('..') || route.includes('\\')) {
    throw new Error(`unsafe public route: ${route}`);
  }
  if (route === '') return 'index.html';
  if (route.endsWith('/')) return `${route}index.html`;
  if (/\.html?$/i.test(route)) return route;
  throw new Error(`canonical public route has no HTML source mapping: ${route}`);
}

export function publicRouteBytesEqual(expected, actual) {
  const expectedBytes = Buffer.isBuffer(expected) ? expected : Buffer.from(expected);
  const actualBytes = Buffer.isBuffer(actual) ? actual : Buffer.from(actual);
  return expectedBytes.equals(actualBytes);
}

export async function collectPublicRoutes() {
  const routes = new Set();
  addHtmlRoute(routes, 'index.html');

  for (const root of PUBLIC_ROOTS) {
    for (const path of await collectHtmlFiles(root)) addHtmlRoute(routes, path);
  }

  const catalog = JSON.parse(await readFile(join(repoRoot, 'play/projects.json'), 'utf8'));
  for (const project of catalog.projects ?? []) {
    if (typeof project.entry !== 'string' || !project.entry) {
      throw new Error(`public project is missing an entry: ${project.id ?? 'unknown'}`);
    }
    addHtmlRoute(routes, `play/${project.entry}`);
  }

  const rules = JSON.parse(await readFile(join(repoRoot, 'play/reference-rules.json'), 'utf8'));
  for (const [alias, declaration] of Object.entries(rules.aliases ?? {})) {
    const target = typeof declaration === 'string' ? declaration : declaration?.target ?? declaration?.resolved;
    if (typeof target !== 'string' || !target) throw new Error(`reference alias is missing a target: ${alias}`);
    routes.add(alias);
    routes.add(target);
  }

  const ordered = [...routes].sort((a, b) => a.localeCompare(b));
  for (const route of ordered) {
    if (route.startsWith('/') || route.includes('..') || route.includes('\\')) {
      throw new Error(`unsafe public route: ${route}`);
    }
  }
  return ordered;
}

export const publicRouteRoots = Object.freeze([...PUBLIC_ROOTS]);
