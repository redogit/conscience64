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

async function resolveOneHopDependency(source, kind, raw, requireExplicitRelative) {
  const value = String(raw ?? '').trim();
  if (!value || value.startsWith('#') || value.startsWith('//')) return null;
  if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return null;
  if (requireExplicitRelative && !value.startsWith('.') && !value.startsWith('/conscience64/')) return null;

  const pathOnly = value.split('#', 1)[0].split('?', 1)[0];
  if (!pathOnly) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    throw new Error(`invalid URL encoding in one-hop dependency: ${value} from ${source}`);
  }

  const sourcePath = resolve(repoRoot, source);
  let targetPath;
  if (decoded.startsWith('/conscience64/')) {
    targetPath = resolve(repoRoot, decoded.slice('/conscience64/'.length));
  } else {
    if (decoded.startsWith('/')) {
      throw new Error(`project-breaking root-absolute one-hop dependency ${raw} from ${source}`);
    }
    targetPath = resolve(dirname(sourcePath), decoded);
  }

  const repoRelative = toPosix(relative(repoRoot, targetPath));
  if (repoRelative === '..' || repoRelative.startsWith('../')) {
    throw new Error(`one-hop dependency escapes repository: ${raw} from ${source}`);
  }

  let info;
  try {
    info = await stat(targetPath);
  } catch {
    throw new Error(`missing one-hop dependency ${raw} from ${source} -> ${repoRelative || '/'}`);
  }
  if (info.isDirectory()) throw new Error(`one-hop dependency resolves to a directory: ${raw} from ${source}`);
  if (!info.isFile()) throw new Error(`one-hop dependency is not a regular file: ${repoRelative}`);

  return Object.freeze({
    source,
    dependency: repoRelative,
    kind,
    raw: value
  });
}

async function collectStaticDependencyReferencesFromSources(sources) {
  const records = [];
  for (const source of sources) {
    if (/\.(?:js|mjs)$/i.test(source)) {
      const text = await readFile(resolve(repoRoot, source), 'utf8');

      for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g)) {
        const record = await resolveOneHopDependency(source, 'js-import', match[1], true);
        if (record) records.push(record);
      }
      for (const match of text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        const record = await resolveOneHopDependency(source, 'js-dynamic-import', match[1], true);
        if (record) records.push(record);
      }
    } else if (/\.css$/i.test(source)) {
      const text = await readFile(resolve(repoRoot, source), 'utf8');

      for (const match of text.matchAll(/\burl\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
        const record = await resolveOneHopDependency(source, 'css-url', match[2].trim(), false);
        if (record) records.push(record);
      }
      for (const match of text.matchAll(/@import\s+["']([^"']+)["']/gi)) {
        const record = await resolveOneHopDependency(source, 'css-import', match[1], false);
        if (record) records.push(record);
      }
    }
  }

  records.sort((a, b) =>
    a.dependency.localeCompare(b.dependency) ||
    a.source.localeCompare(b.source) ||
    a.kind.localeCompare(b.kind) ||
    a.raw.localeCompare(b.raw)
  );
  return records;
}

export async function collectOneHopPublicAssetDependencyReferences() {
  return collectStaticDependencyReferencesFromSources(await collectDirectPublicAssets());
}

export async function collectOneHopPublicAssetDependencies() {
  return [...new Set((await collectOneHopPublicAssetDependencyReferences()).map(record => record.dependency))]
    .sort((a, b) => a.localeCompare(b));
}

export async function collectSecondHopPublicAssetDependencyReferences() {
  return collectStaticDependencyReferencesFromSources(await collectOneHopPublicAssetDependencies());
}

export async function collectSecondHopPublicAssetDependencies() {
  return [...new Set((await collectSecondHopPublicAssetDependencyReferences()).map(record => record.dependency))]
    .sort((a, b) => a.localeCompare(b));
}

export async function collectStaticPublicAssetDependencyClosure({ maxDepth = 64 } = {}) {
  if (!Number.isInteger(maxDepth) || maxDepth < 1) {
    throw new Error('maxDepth must be a positive integer');
  }

  const roots = await collectDirectPublicAssets();
  const rootSet = new Set(roots);
  const seenFiles = new Set(roots);
  const processedSources = new Set();
  const layers = [];
  let frontier = [...roots];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const sources = frontier
      .filter(source => !processedSources.has(source))
      .sort((a, b) => a.localeCompare(b));

    for (const source of sources) processedSources.add(source);

    const references = await collectStaticDependencyReferencesFromSources(sources);
    const dependencies = [...new Set(references.map(record => record.dependency))]
      .sort((a, b) => a.localeCompare(b));
    const newDependencies = dependencies
      .filter(dependency => !seenFiles.has(dependency))
      .sort((a, b) => a.localeCompare(b));

    for (const dependency of newDependencies) seenFiles.add(dependency);

    layers.push(Object.freeze({
      depth,
      sources: Object.freeze([...sources]),
      references: Object.freeze([...references]),
      dependencies: Object.freeze([...dependencies]),
      newDependencies: Object.freeze([...newDependencies])
    }));

    if (newDependencies.length === 0) {
      const closureDependencies = [...seenFiles]
        .filter(file => !rootSet.has(file))
        .sort((a, b) => a.localeCompare(b));

      return Object.freeze({
        closed: true,
        roots: Object.freeze([...roots]),
        layers: Object.freeze([...layers]),
        dependencies: Object.freeze(closureDependencies)
      });
    }

    frontier = newDependencies;
  }

  throw new Error(`static public asset dependency traversal did not converge within ${maxDepth} layers`);
}


async function resolveImportMetaUrlAsset(source, raw) {
  const value = String(raw ?? '').trim();
  if (!value || value.startsWith('#') || value.startsWith('//')) return null;
  if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return null;

  const pathOnly = value.split('#', 1)[0].split('?', 1)[0];
  if (!pathOnly) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    throw new Error(`invalid URL encoding in import.meta.url asset: ${value} from ${source}`);
  }

  const sourcePath = resolve(repoRoot, source);
  let targetPath;
  if (decoded.startsWith('/conscience64/')) {
    targetPath = resolve(repoRoot, decoded.slice('/conscience64/'.length));
  } else {
    if (decoded.startsWith('/')) {
      throw new Error(`project-breaking root-absolute import.meta.url asset ${value} from ${source}`);
    }
    targetPath = resolve(dirname(sourcePath), decoded);
  }

  const repoRelative = toPosix(relative(repoRoot, targetPath));
  if (repoRelative === '..' || repoRelative.startsWith('../')) {
    throw new Error(`import.meta.url asset escapes repository: ${value} from ${source}`);
  }

  let info;
  try {
    info = await stat(targetPath);
  } catch {
    throw new Error(`missing import.meta.url asset ${value} from ${source} -> ${repoRelative || '/'}`);
  }

  if (info.isDirectory()) throw new Error(`import.meta.url asset resolves to a directory: ${value} from ${source}`);
  if (!info.isFile()) throw new Error(`import.meta.url asset is not a regular file: ${repoRelative}`);

  return Object.freeze({
    source,
    asset: repoRelative,
    kind: 'js-import-meta-url',
    raw: value
  });
}

export async function collectImportMetaUrlPublicAssetReferences() {
  const closure = await collectStaticPublicAssetDependencyClosure();
  const sources = [...new Set([...closure.roots, ...closure.dependencies])]
    .filter(source => /\.(?:js|mjs)$/i.test(source))
    .sort((a, b) => a.localeCompare(b));

  const records = [];
  for (const source of sources) {
    const text = await readFile(resolve(repoRoot, source), 'utf8');
    for (const match of text.matchAll(/\bnew\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g)) {
      const record = await resolveImportMetaUrlAsset(source, match[1]);
      if (record) records.push(record);
    }
  }

  records.sort((a, b) =>
    a.asset.localeCompare(b.asset) ||
    a.source.localeCompare(b.source) ||
    a.raw.localeCompare(b.raw)
  );
  return records;
}

export async function collectImportMetaUrlPublicAssets() {
  return [...new Set((await collectImportMetaUrlPublicAssetReferences()).map(record => record.asset))]
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
