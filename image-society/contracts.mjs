const RUN_SCHEMA = 'conscience64/image-society/run-manifest/v1';
const MAX_CALLS = 1_000_000;

function integer(name, value, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`${name} must be an integer in ${min}..${max}`);
  }
  return value;
}

function enumValue(name, value, allowed) {
  if (!allowed.includes(value)) throw new TypeError(`${name} must be one of ${allowed.join(', ')}`);
  return value;
}

function finiteNonNegative(name, value) {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a finite non-negative number`);
  }
  return value;
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function validateRunManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('run manifest must be an object');
  if (value.schema != null && value.schema !== RUN_SCHEMA) throw new TypeError(`schema must be ${RUN_SCHEMA}`);
  const run_id = String(value.run_id ?? '').trim();
  if (!run_id) throw new TypeError('run_id is required');

  const out = {
    schema: RUN_SCHEMA,
    run_id,
    max_calls: integer('max_calls', value.max_calls, 1, MAX_CALLS),
    max_parallelism: integer('max_parallelism', value.max_parallelism ?? 1, 1, 64),
    max_retries_per_call: integer('max_retries_per_call', value.max_retries_per_call ?? 0, 0, 10),
    checkpoint_every_events: integer('checkpoint_every_events', value.checkpoint_every_events ?? 25, 1),
    summary_every_events: integer('summary_every_events', value.summary_every_events ?? 10, 1),
    max_branches: integer('max_branches', value.max_branches ?? 1, 1, 10_000),
    promotion_mode: enumValue('promotion_mode', value.promotion_mode ?? 'manual', ['manual', 'disabled']),
    authority_mode: enumValue('authority_mode', value.authority_mode ?? 'strict', ['strict', 'review-required']),
    accessibility_mode: enumValue('accessibility_mode', value.accessibility_mode ?? 'enabled', ['enabled', 'review-required', 'not-applicable'])
  };

  for (const key of ['title', 'objective', 'privacy_classification']) if (value[key] != null) out[key] = String(value[key]);
  for (const key of ['allowed_providers', 'allowed_renderers', 'stop_conditions']) {
    if (value[key] != null) {
      if (!Array.isArray(value[key]) || value[key].some(x => typeof x !== 'string')) throw new TypeError(`${key} must be an array of strings`);
      out[key] = [...value[key]];
    }
  }
  if (value.budgets != null) {
    if (typeof value.budgets !== 'object' || Array.isArray(value.budgets)) throw new TypeError('budgets must be an object');
    out.budgets = {};
    for (const key of ['token_in_max', 'token_out_max', 'cost_max', 'storage_bytes_max']) {
      const normalized = finiteNonNegative(`budgets.${key}`, value.budgets[key]);
      if (normalized !== undefined) out.budgets[key] = normalized;
    }
    if (value.budgets.cost_currency != null) out.budgets.cost_currency = String(value.budgets.cost_currency);
  }
  return deepFreeze(cloneJson(out));
}

const EVENT_TYPES = new Set([
  'plan','generate','variation','edit','critique','compare','continuity-review',
  'accessibility-review','authority-review','provenance-review','correction-propose',
  'evaluate','integrate','checkpoint','summarize','promote','reject','archive'
]);
const TERMINAL_STATES = new Set([
  'succeeded','failed-input','failed-policy','failed-provider','failed-toolchain',
  'failed-resource','failed-capability','failed-provenance','timed-out','cancelled','retry-exhausted'
]);

function stringArray(name, value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some(x => typeof x !== 'string')) throw new TypeError(`${name} must be an array of strings`);
  return [...value];
}

export function validateTurnEvent(value, { run_id, sequence_no } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('event must be an object');
  const event_id = String(value.event_id ?? '').trim();
  const branch_id = String(value.branch_id ?? '').trim();
  if (!event_id) throw new TypeError('event_id is required');
  if (!branch_id) throw new TypeError('branch_id is required');
  if (!EVENT_TYPES.has(value.event_type)) throw new TypeError(`unknown event_type: ${value.event_type}`);
  if (!TERMINAL_STATES.has(value.status)) throw new TypeError(`unknown terminal status: ${value.status}`);
  const out = {
    schema: 'conscience64/image-society/event/v1',
    event_id,
    run_id: String(run_id ?? value.run_id ?? '').trim(),
    branch_id,
    sequence_no: integer('sequence_no', sequence_no ?? value.sequence_no ?? 1, 1),
    event_type: value.event_type,
    input_artifact_ids: stringArray('input_artifact_ids', value.input_artifact_ids),
    output_artifact_ids: stringArray('output_artifact_ids', value.output_artifact_ids),
    parent_event_ids: stringArray('parent_event_ids', value.parent_event_ids),
    status: value.status,
    attempt_count: integer('attempt_count', value.attempt_count ?? 1, 1)
  };
  for (const key of ['intent_id', 'created_at']) if (value[key] != null) out[key] = String(value[key]);
  for (const key of ['actor','request_payload','response_payload','observations','corrections','evaluation','provenance','authority_state','budget_evidence']) {
    if (value[key] != null) out[key] = cloneJson(value[key]);
  }
  return deepFreeze(out);
}

function requiredString(name, value) {
  const out = String(value ?? '').trim();
  if (!out) throw new TypeError(`${name} is required`);
  return out;
}

export function validateVisualDifference(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('visual difference must be an object');
  const out = {
    schema: 'conscience64/image-society/visual-difference/v1',
    before_artifact_id: requiredString('before_artifact_id', value.before_artifact_id),
    requested_delta: requiredString('requested_delta', value.requested_delta),
    after_artifact_id: requiredString('after_artifact_id', value.after_artifact_id),
    observed_delta: stringArray('observed_delta', value.observed_delta),
    unintended_delta: stringArray('unintended_delta', value.unintended_delta),
    remaining_gap: stringArray('remaining_gap', value.remaining_gap)
  };
  if (value.recommendation != null) out.recommendation = String(value.recommendation);
  if (value.source_event_ids != null) out.source_event_ids = stringArray('source_event_ids', value.source_event_ids);
  return deepFreeze(out);
}

export function validateContinuityPack(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('continuity pack must be an object');
  if (!Array.isArray(value.entities)) throw new TypeError('entities must be an array');
  const entities = value.entities.map((entity, index) => {
    if (!entity || typeof entity !== 'object' || Array.isArray(entity)) throw new TypeError(`entities[${index}] must be an object`);
    return {
      entity_id: requiredString(`entities[${index}].entity_id`, entity.entity_id),
      name: entity.name == null ? undefined : String(entity.name),
      protected_traits: stringArray(`entities[${index}].protected_traits`, entity.protected_traits),
      variable_traits: stringArray(`entities[${index}].variable_traits`, entity.variable_traits),
      reference_artifact_ids: stringArray(`entities[${index}].reference_artifact_ids`, entity.reference_artifact_ids),
      authority_class: entity.authority_class == null ? 'generated-working-rule' : String(entity.authority_class)
    };
  });
  const out = {
    schema: 'conscience64/image-society/continuity-pack/v1',
    pack_id: requiredString('pack_id', value.pack_id),
    version: requiredString('version', value.version),
    entities,
    environment_rules: stringArray('environment_rules', value.environment_rules),
    style_rules: stringArray('style_rules', value.style_rules),
    prohibited_drifts: stringArray('prohibited_drifts', value.prohibited_drifts)
  };
  return deepFreeze(JSON.parse(JSON.stringify(out)));
}

export { RUN_SCHEMA, MAX_CALLS, EVENT_TYPES, TERMINAL_STATES };
