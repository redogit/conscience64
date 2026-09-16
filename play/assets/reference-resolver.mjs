export const REFERENCE_RESOLVER_SCHEMA = 'conscience64.reference-resolver/v1';

const RULES_SCHEMA = 'conscience64.reference-rules/v1';

function normalizeLocalReference(reference) {
  if (typeof reference !== 'string') return null;
  let value = reference.trim();
  if (!value) return null;
  if (value.startsWith('/') || value.includes('\\')) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  value = value.replace(/^\.\//, '');
  const parts = value.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return null;
  return value;
}

function normalizeAlias(raw, reference) {
  if (typeof raw === 'string') {
    return {
      status: 'HISTORICAL_ALIAS',
      reference,
      resolved: raw,
      rule: `alias:${reference}`
    };
  }
  if (!raw || typeof raw !== 'object') return null;
  const resolved = raw.target ?? raw.resolved;
  if (typeof resolved !== 'string' || !resolved) return null;
  return {
    status: String(raw.status || 'HISTORICAL_ALIAS'),
    reference,
    resolved,
    rule: String(raw.rule || raw.id || `alias:${reference}`)
  };
}

export function deriveOneStepResolutions(reference, rules) {
  const normalized = normalizeLocalReference(reference);
  if (!normalized) return { status: 'OUT_OF_SCOPE', reference: String(reference ?? '') };
  if (!rules || rules.schema !== RULES_SCHEMA) throw new Error('invalid reference-rules schema');

  const found = new Map();
  const add = resolution => {
    const target = normalizeLocalReference(resolution?.resolved);
    if (!target || found.has(target)) return;
    found.set(target, { ...resolution, reference: normalized, resolved: target });
  };

  const alias = normalizeAlias(rules.aliases?.[normalized], normalized);
  if (alias) add(alias);

  for (const transform of rules.transforms || []) {
    if (!transform || typeof transform !== 'object') continue;
    const fromSuffix = String(transform.fromSuffix || '');
    const toSuffix = String(transform.toSuffix || '');
    if (!fromSuffix || !normalized.endsWith(fromSuffix)) continue;
    const resolved = `${normalized.slice(0, -fromSuffix.length)}${toSuffix}`;
    add({
      status: String(transform.status || 'FORMAT_VARIANT'),
      reference: normalized,
      resolved,
      rule: String(transform.id || `${fromSuffix}->${toSuffix}`)
    });
  }

  return { status: 'RESOLUTIONS', reference: normalized, resolutions: [...found.values()] };
}

export async function resolveOneStepReference(reference, rules, exists) {
  if (typeof exists !== 'function') throw new TypeError('exists must be a function');
  const derived = deriveOneStepResolutions(reference, rules);
  if (derived.status === 'OUT_OF_SCOPE') {
    return { status: 'OUT_OF_SCOPE', reference: derived.reference, resolved: null, rule: null };
  }

  const valid = [];
  for (const resolution of derived.resolutions) {
    if (await exists(resolution.resolved)) valid.push(resolution);
  }

  if (valid.length === 0) {
    return { status: 'BROKEN', reference: derived.reference, resolved: null, rule: null };
  }
  if (valid.length === 1) return valid[0];

  valid.sort((a, b) => a.resolved.localeCompare(b.resolved) || a.rule.localeCompare(b.rule));
  return { status: 'AMBIGUOUS', reference: derived.reference, resolutions: valid };
}
