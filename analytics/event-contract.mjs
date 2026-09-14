export const EVENT_KINDS = Object.freeze([
  'OBSERVATION',
  'TESTED',
  'VERIFIED',
  'CONTRADICTION',
  'INTERPRETATION',
  'BOUNDARY',
  'REVISED',
  'PROMOTED',
  'REOPENED',
]);

export const REQUIRED_FIELDS = Object.freeze([
  'time',
  'kind',
  'project',
  'message',
  'evidence',
  'source',
  'status',
]);

const EVENT_KIND_SET = new Set(EVENT_KINDS);

export function validateEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'event must be an object' };
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      return { ok: false, error: `missing or invalid ${field}` };
    }
  }

  if (!EVENT_KIND_SET.has(input.kind)) {
    return { ok: false, error: `unknown event kind: ${input.kind}` };
  }

  if (Number.isNaN(Date.parse(input.time))) {
    return { ok: false, error: 'time must be an ISO-8601-compatible timestamp' };
  }

  return { ok: true, event: input };
}
