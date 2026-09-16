import { readFileSync } from 'node:fs';
import { deepFreeze } from './contracts.mjs';

export const REQUIRED_ROLE_IDS = Object.freeze([
  'image-society/director/v1',
  'image-society/scene-builder/v1',
  'image-society/generator/v1',
  'image-society/repairer/v1',
  'image-society/semantic-critic/v1',
  'image-society/composition-critic/v1',
  'image-society/continuity-critic/v1',
  'image-society/accessibility-critic/v1',
  'image-society/authority-critic/v1',
  'image-society/provenance-keeper/v1',
  'image-society/integrator/v1',
  'image-society/summarizer/v1'
]);

const REQUIRED_GLOBAL_INVARIANT = 'GENERATED != OBSERVED != VERIFIED != ACCEPTED != WORLD_CANON';

function requireStringArray(roleId, field, value) {
  if (!Array.isArray(value) || value.length === 0 || value.some(x => typeof x !== 'string' || !x.trim())) {
    throw new TypeError(`${roleId}.${field} must be a non-empty array of strings`);
  }
  return [...value];
}

export function validateRolePromptPackage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('role prompt package must be an object');
  if (value.schema !== 'conscience64/image-society/role-prompts/v1') throw new TypeError('unsupported role prompt schema');
  const globalInvariants = requireStringArray('package', 'global_invariants', value.global_invariants);
  if (!globalInvariants.includes(REQUIRED_GLOBAL_INVARIANT)) throw new TypeError('global invariant block is missing authority separation');
  if (!Array.isArray(value.roles)) throw new TypeError('roles must be an array');

  const seen = new Set();
  const roles = value.roles.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new TypeError(`roles[${index}] must be an object`);
    const role_id = String(raw.role_id ?? '').trim();
    if (!role_id) throw new TypeError(`roles[${index}].role_id is required`);
    if (seen.has(role_id)) throw new Error(`duplicate role_id: ${role_id}`);
    seen.add(role_id);
    if (!raw.output_contract || typeof raw.output_contract !== 'object' || Array.isArray(raw.output_contract)) {
      throw new TypeError(`${role_id}.output_contract must be an object`);
    }
    return {
      ...JSON.parse(JSON.stringify(raw)),
      role_id,
      inputs: requireStringArray(role_id, 'inputs', raw.inputs),
      obligations: requireStringArray(role_id, 'obligations', raw.obligations),
      procedure: requireStringArray(role_id, 'procedure', raw.procedure),
      evidence_boundary: requireStringArray(role_id, 'evidence_boundary', raw.evidence_boundary),
      stop_conditions: requireStringArray(role_id, 'stop_conditions', raw.stop_conditions),
      output_contract: JSON.parse(JSON.stringify(raw.output_contract))
    };
  });

  const missing = REQUIRED_ROLE_IDS.filter(id => !seen.has(id));
  if (missing.length) throw new Error(`missing required role IDs: ${missing.join(', ')}`);
  return deepFreeze({
    schema: value.schema,
    version: String(value.version ?? '1.0.0'),
    global_invariants: globalInvariants,
    roles
  });
}

export function loadRolePrompts(path = new URL('./prompts/role-prompts.v1.json', import.meta.url)) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  return validateRolePromptPackage(parsed);
}
