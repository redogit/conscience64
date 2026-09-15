import { createHash } from 'node:crypto';

function normalize(value, seen) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('canonical JSON requires finite numbers');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
  if (seen.has(value)) throw new TypeError('canonical JSON does not support cyclic values');
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map(item => normalize(item, seen));
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError('canonical JSON requires plain objects');
    const out = {};
    for (const key of Object.keys(value).sort()) {
      const child = value[key];
      if (child === undefined) throw new TypeError(`canonical JSON does not support undefined at key ${key}`);
      out[key] = normalize(child, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value, new Set()));
}

export function sha256Canonical(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}
