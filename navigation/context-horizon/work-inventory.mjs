import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCHEMA = 'conscience64/context-horizon-work-inventory/v1';
const ALLOWED_STATES = new Set(['current','historical','unresolved','preserved','predecessor','successor']);
const ALLOWED_PUBLICATION = new Set(['public','private','unresolved']);

function strings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(v => String(v ?? '').trim()).filter(Boolean))];
}

export function normalizeWork(record) {
  if (!record || typeof record !== 'object') throw new TypeError('work record must be an object');
  const id = String(record.id ?? '').trim();
  const canonicalName = String(record.canonicalName ?? record.name ?? '').trim();
  const domain = String(record.domain ?? 'unresolved').trim() || 'unresolved';
  if (!id) throw new Error('work record missing stable id');
  if (!canonicalName) throw new Error(`work ${id} missing canonical name`);
  const state = ALLOWED_STATES.has(record.state) ? record.state : 'unresolved';
  const publicationStatus = ALLOWED_PUBLICATION.has(record.publicationStatus) ? record.publicationStatus : 'unresolved';
  return Object.freeze({
    id,
    canonicalName,
    aliases: strings(record.aliases),
    domain,
    sourceLocations: strings(record.sourceLocations),
    provenanceStatus: String(record.provenanceStatus ?? 'unknown'),
    publicationStatus,
    state,
    predecessors: strings(record.predecessors),
    successors: strings(record.successors),
    preservationStatus: String(record.preservationStatus ?? (record.sourceLocations?.length ? 'located' : 'must-locate-or-retain-unresolved')),
    sourceKinds: strings(record.sourceKinds),
    notes: strings(record.notes)
  });
}

function reconcileSameStableId(a, b) {
  if (a.id !== b.id) throw new Error('stable-id reconciliation requires identical ids');
  const choose = (x, y, unknown='unknown') => {
    if (x && x !== unknown && x !== 'unresolved') return x;
    if (y && y !== unknown && y !== 'unresolved') return y;
    return x || y || unknown;
  };
  if (a.domain !== 'unresolved' && b.domain !== 'unresolved' && a.domain !== b.domain) {
    throw new Error(`stable id ${a.id} has conflicting domains: ${a.domain} vs ${b.domain}`);
  }
  return normalizeWork({
    id: a.id,
    canonicalName: choose(a.canonicalName, b.canonicalName, ''),
    aliases: [...a.aliases, ...b.aliases, ...(a.canonicalName !== b.canonicalName ? [b.canonicalName] : [])],
    domain: choose(a.domain, b.domain, 'unresolved'),
    sourceLocations: [...a.sourceLocations, ...b.sourceLocations],
    provenanceStatus: choose(a.provenanceStatus, b.provenanceStatus),
    publicationStatus: choose(a.publicationStatus, b.publicationStatus, 'unresolved'),
    state: choose(a.state, b.state, 'unresolved'),
    predecessors: [...a.predecessors, ...b.predecessors],
    successors: [...a.successors, ...b.successors],
    preservationStatus: a.sourceLocations.length || b.sourceLocations.length ? 'located' : choose(a.preservationStatus, b.preservationStatus),
    sourceKinds: [...a.sourceKinds, ...b.sourceKinds],
    notes: [...a.notes, ...b.notes]
  });
}

export function buildInventory({sources = [], seeds = [], generatedFrom = []} = {}) {
  const byId = new Map();
  for (const raw of [...seeds, ...sources]) {
    const item = normalizeWork(raw);
    if (!byId.has(item.id)) byId.set(item.id, item);
    else byId.set(item.id, reconcileSameStableId(byId.get(item.id), item));
  }
  const works = [...byId.values()].sort((a,b) => a.id.localeCompare(b.id));
  return Object.freeze({
    schema: SCHEMA,
    version: '1.0.0',
    generatedFrom: structuredClone(generatedFrom),
    works
  });
}

export function findInInventory(inventory, key) {
  const q = String(key ?? '').trim();
  if (!q || !inventory?.works) return null;
  const byId = inventory.works.find(w => w.id === q);
  if (byId) return byId;
  const canonical = inventory.works.filter(w => w.canonicalName === q);
  if (canonical.length === 1) return canonical[0];
  if (canonical.length > 1) return Object.freeze({ambiguous:true, key:q, matches:canonical});
  const aliases = inventory.works.filter(w => w.aliases.includes(q));
  if (aliases.length === 1) return aliases[0];
  if (aliases.length > 1) return Object.freeze({ambiguous:true, key:q, matches:aliases});
  return null;
}

function workFromResearchProject(p) {
  return {
    id:p.id, canonicalName:p.name, domain:'research', aliases:[],
    sourceLocations:p.path ? [p.path] : [], provenanceStatus:'research-project-registry',
    publicationStatus:'public', state:'current', preservationStatus:p.path ? 'located':'must-locate-or-retain-unresolved',
    sourceKinds:['research-project-record'], notes:[]
  };
}

function repoPathFromPlay(path) {
  const raw=String(path||'').trim();
  if (!raw) return null;
  if (raw.startsWith('../')) return raw.replace(/^\.\.\//,'');
  if (raw.startsWith('play/') || raw.startsWith('research/') || raw === 'API.md') return raw;
  return `play/${raw}`;
}

function workFromPlayProject(p) {
  const gameIds = new Set(['mmo','explorer-world']);
  const creativeTechnicalIds = new Set(['computational-chorus']);
  return {
    id:p.id, canonicalName:p.name, domain:gameIds.has(p.id) ? 'game' : creativeTechnicalIds.has(p.id) ? 'creative-technical' : 'tool', aliases:[],
    sourceLocations:[repoPathFromPlay(p.entry), repoPathFromPlay(p.source)].filter(Boolean),
    provenanceStatus:'play-project-registry', publicationStatus:'public', state:'current', preservationStatus:'located',
    sourceKinds:['play-project'], notes:[]
  };
}

function workFromCurrentSuccessor(p) {
  return {
    id:p.id, canonicalName:p.name, domain:'research', sourceLocations:p.path ? [p.path] : [], aliases:[],
    provenanceStatus:'research-current-manifest', publicationStatus:'public', state:'successor', preservationStatus:p.path ? 'located':'must-locate-or-retain-unresolved',
    sourceKinds:['research-successor-record'], notes:[]
  };
}

function workFromSoftwareBoundary(p) {
  return {
    id:p.id, canonicalName:p.id === 'mmo-world-beta' ? 'MMO World Beta' : p.id === 'fuzzball-hidden-alpha' ? 'Fuzzball Hidden Alpha' : p.id,
    domain:'game', sourceLocations:[p.path,p.canonicalRoot].filter(Boolean), aliases:[], provenanceStatus:'research-current-software-boundary',
    publicationStatus:p.distribution?.startsWith('UNLISTED') ? 'unresolved' : 'public', state:'current', preservationStatus:'located',
    sourceKinds:['software-boundary-record'], notes:[]
  };
}

function attachExactWebRoute(records, route) {
  const match = records.find(r => r.id === route.id);
  if (match) {
    match.sourceLocations = [...(match.sourceLocations || []), route.path].filter(Boolean);
    match.sourceKinds = [...(match.sourceKinds || []), 'web-route'];
  }
}

export function recordsFromSourceIndexes({researchProjects, researchCurrent, playProjects, webLinks}) {
  const records = [];
  for (const p of researchProjects?.projects || []) records.push(workFromResearchProject(p));
  for (const p of researchCurrent?.successorRecords || []) records.push(workFromCurrentSuccessor(p));
  for (const p of researchCurrent?.softwareBoundaryRecords || []) records.push(workFromSoftwareBoundary(p));
  for (const p of playProjects?.projects || []) records.push(workFromPlayProject(p));
  for (const route of webLinks?.routes || []) attachExactWebRoute(records, route);
  return records;
}

function unresolvedContextSeed(work, provenanceStatus, sourceKind) {
  return {
    ...work,
    sourceLocations: Array.isArray(work.sourceLocations) ? work.sourceLocations : [],
    provenanceStatus: work.provenanceStatus ?? provenanceStatus,
    publicationStatus: work.publicationStatus ?? 'unresolved',
    state: work.state ?? 'unresolved',
    preservationStatus: work.preservationStatus ?? 'must-locate-or-retain-unresolved',
    sourceKinds: Array.isArray(work.sourceKinds) ? work.sourceKinds : [sourceKind]
  };
}

export async function generateInventorySnapshot(repoRoot, {write = false} = {}) {
  const root = resolve(repoRoot);
  const base = dirname(fileURLToPath(import.meta.url));
  const seedPath = resolve(base, 'preservation-seeds.json');
  const historicalSeedPath = resolve(base, 'historical-context-seeds.json');
  const crossChatSeedPath = resolve(base, 'cross-chat-context-seeds.json');
  const externalPublicPath = resolve(base, 'external-public-sources.json');
  const sourcePaths = [
    'research/projects/CURRENT.json',
    'research/projects/projects.json',
    'play/projects.json',
    'play/mmo/web-links.json'
  ];
  const [researchCurrent, researchProjects, playProjects, webLinks, seeds, historicalSeeds, crossChatSeeds, externalPublic] = await Promise.all([
    readFile(resolve(root,sourcePaths[0]),'utf8').then(JSON.parse),
    readFile(resolve(root,sourcePaths[1]),'utf8').then(JSON.parse),
    readFile(resolve(root,sourcePaths[2]),'utf8').then(JSON.parse),
    readFile(resolve(root,sourcePaths[3]),'utf8').then(JSON.parse),
    readFile(seedPath,'utf8').then(JSON.parse),
    readFile(historicalSeedPath,'utf8').then(JSON.parse),
    readFile(crossChatSeedPath,'utf8').then(JSON.parse),
    readFile(externalPublicPath,'utf8').then(JSON.parse)
  ]);
  const generatedFrom = [
    ...sourcePaths.map(path => ({path})),
    {path:'navigation/context-horizon/preservation-seeds.json'},
    {path:'navigation/context-horizon/historical-context-seeds.json'},
    {path:'navigation/context-horizon/cross-chat-context-seeds.json'},
    {path:'navigation/context-horizon/external-public-sources.json'}
  ];
  const sources = [
    ...recordsFromSourceIndexes({researchProjects,researchCurrent,playProjects,webLinks}),
    ...(externalPublic?.works || [])
  ];
  const historical = (historicalSeeds?.works || []).map(work => unresolvedContextSeed(work,'known-from-library-history','historical-context-seed'));
  const crossChat = (crossChatSeeds?.works || []).map(work => unresolvedContextSeed(work,'known-from-chat-history','cross-chat-context-seed'));
  const inventory = buildInventory({sources,seeds:[...(seeds.works || []), ...historical, ...crossChat],generatedFrom});
  if (write) {
    const output = resolve(base,'WORK_INVENTORY.json');
    await writeFile(output, JSON.stringify(inventory,null,2)+'\n','utf8');
  }
  return inventory;
}

const invoked = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invoked) {
  const args = new Set(process.argv.slice(2));
  const rootArg = process.argv.slice(2).find(x => !x.startsWith('--')) || resolve(dirname(fileURLToPath(import.meta.url)),'../..');
  const inventory = await generateInventorySnapshot(rootArg,{write:args.has('--write')});
  if (args.has('--check')) {
    const existing = JSON.parse(await readFile(resolve(dirname(fileURLToPath(import.meta.url)),'WORK_INVENTORY.json'),'utf8'));
    assertInventoryEqual(existing,inventory);
  }
  console.log(`PASS Context Horizon work inventory: ${inventory.works.length} works preserved`);
}

export function assertInventoryEqual(a,b) {
  const left = JSON.stringify({schema:a?.schema,version:a?.version,works:a?.works});
  const right = JSON.stringify({schema:b?.schema,version:b?.version,works:b?.works});
  if (left !== right) throw new Error('WORK_INVENTORY.json work set is not synchronized with source indexes and preservation seeds');
  return true;
}
