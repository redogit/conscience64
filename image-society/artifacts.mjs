import { deepFreeze } from './contracts.mjs';

const SHA256 = /^[0-9a-f]{64}$/;

export function createArtifactRegistry() {
  return { byId: new Map(), byHash: new Map() };
}

function normalizeArtifact(artifact) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) throw new TypeError('artifact must be an object');
  const artifact_id = String(artifact.artifact_id ?? '').trim();
  const sha256 = String(artifact.sha256 ?? '').trim().toLowerCase();
  if (!artifact_id) throw new TypeError('artifact_id is required');
  if (!SHA256.test(sha256)) throw new TypeError('sha256 must be 64 lowercase hexadecimal characters');
  const parents = artifact.parent_artifact_ids ?? [];
  if (!Array.isArray(parents) || parents.some(x => typeof x !== 'string')) throw new TypeError('parent_artifact_ids must be an array of strings');
  return deepFreeze({
    ...JSON.parse(JSON.stringify(artifact)),
    artifact_id,
    sha256,
    parent_artifact_ids: [...parents]
  });
}

export function registerArtifact(registry, artifact) {
  if (!registry?.byId || !registry?.byHash) throw new TypeError('invalid artifact registry');
  const record = normalizeArtifact(artifact);
  const existing = registry.byId.get(record.artifact_id);
  if (existing) {
    if (existing.sha256 !== record.sha256) throw new Error(`artifact ID collision for ${record.artifact_id}`);
    return existing;
  }
  registry.byId.set(record.artifact_id, record);
  if (!registry.byHash.has(record.sha256)) registry.byHash.set(record.sha256, new Set());
  registry.byHash.get(record.sha256).add(record.artifact_id);
  return record;
}

export function getArtifact(registry, artifactId) {
  return registry.byId.get(artifactId) ?? null;
}

export function artifactsForHash(registry, sha256) {
  return Object.freeze([...(registry.byHash.get(sha256) ?? [])]);
}

export function allArtifacts(registry) {
  return Object.freeze([...registry.byId.values()]);
}
