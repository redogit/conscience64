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

export { RUN_SCHEMA, MAX_CALLS };
