import { deepFreeze } from './contracts.mjs';

const SECRET_KEY = /(secret|token|api[_-]?key|authorization|credential|password)/i;

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createProviderAdapter(config = {}) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new TypeError('provider adapter configuration must be an object');
  for (const key of Object.keys(config)) {
    if (SECRET_KEY.test(key)) throw new TypeError(`secret-bearing provider configuration field is forbidden: ${key}`);
  }
  const name = String(config.name ?? '').trim();
  if (!name) throw new TypeError('provider name is required');
  if (typeof config.generate !== 'function') throw new TypeError('provider generate function is required');
  const capabilities = deepFreeze(cloneJson(config.capabilities ?? {}));
  const generateImpl = config.generate;
  return Object.freeze({
    name,
    capabilities,
    async generate(request, options = {}) {
      return generateImpl(cloneJson(request), options);
    }
  });
}
