import { readdir, readFile, stat } from 'node:fs/promises';
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

function referencePath(raw) {
  const value = String(raw ?? '').trim();
  if (!value || value.startsWith('#') || value.startsWith('//')) return null;
  if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return null;
  const pathOnly = value.split('#', 1)[0].split('?', 1)[0];
  if (!pathOnly) return null;
  try {
    return decodeURIComponent(pathOnly);
  } catch {
    throw new Error(`invalid URL encoding in direct public reference: ${value}`);
  }
}

async function resolveDirectAssetReference(route, attribute, raw) {
  const decoded = referencePath(raw);
  if (!decoded) return null;

  const pagePath = resolve(repoRoot, publicRouteFile(route));
  let targetPath;
  if (decoded.startsWith('/conscience64/')) {
    targetPath = resolve(repoRoot, decoded.slice('/conscience64/'.length));
  } else {
    if (decoded.startsWith('/')) {
      throw new Error(`project-breaking root-absolute direct public reference ${raw} from ${route || '/'}`);
    }
    targetPath = resolve(dirname(pagePath), decoded);
  }

  const repoRelative = toPosix(relative(repoRoot, targetPath));
  if (repoRelative === '..' || repoRelative.startsWith('../')) {
    throw new Error(`direct public reference escapes repository: ${raw} from ${route || '/'}`);
  }

  let info;
  try {
    info = await stat(targetPath);
  } catch {
    throw new Error(`missing direct public reference ${raw} from ${route || '/'} -> ${repoRelative || '/'}`);
  }

  if (info.isDirectory() || /\.html?$/i.test(repoRelative)) return null;
  if (!info.isFile()) throw new Error(`direct public asset is not a regular file: ${repoRelative}`);

  return Object.freeze({
    asset: repoRelative,
    route,
    attribute,
    raw: String(raw)
  });
}

export async function collectDirectPublicAssetReferences() {
  const records = [];
  for (const route of await collectPublicRoutes()) {
    const html = await readFile(resolve(repoRoot, publicRouteFile(route)), 'utf8');

    for (const match of html.matchAll(/\b(href|src|poster)\s*=\s*["']([^"']+)["']/gi)) {
      const record = await resolveDirectAssetReference(route, match[1].toLowerCase(), match[2]);
      if (record) records.push(record);
    }

    for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
      for (const item of match[1].split(',')) {
        const raw = item.trim().split(/\s+/, 1)[0];
        const record = await resolveDirectAssetReference(route, 'srcset', raw);
        if (record) records.push(record);
      }
    }
  }

  records.sort((a, b) =>
    a.asset.localeCompare(b.asset) ||
    a.route.localeCompare(b.route) ||
    a.attribute.localeCompare(b.attribute) ||
    a.raw.localeCompare(b.raw)
  );
  return records;
}

export async function collectDirectPublicAssets() {
  return [...new Set((await collectDirectPublicAssetReferences()).map(record => record.asset))]
    .sort((a, b) => a.localeCompare(b));
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
