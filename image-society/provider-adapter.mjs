import { deepFreeze } from './contracts.mjs';

const SECRET_KEY = /(secret|token|api[_-]?key|authorization|credential|password)/i;

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export class ProviderCapabilityError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ProviderCapabilityError';
    this.code = 'failed-capability';
    this.details = cloneJson(details);
  }
}

function dimensionKey(width, height) {
  return `${width}x${height}`;
}

function normalizeExactDimensions(values = []) {
  const out = new Set();
  if (!Array.isArray(values)) return out;
  for (const value of values) {
    if (typeof value === 'string' && /^\d+x\d+$/.test(value)) out.add(value);
    else if (value && typeof value === 'object' && Number.isInteger(value.width) && Number.isInteger(value.height)) {
      out.add(dimensionKey(value.width, value.height));
    }
  }
  return out;
}

function positiveInteger(name, value) {
  if (!Number.isInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer`);
  return value;
}

export function negotiateImageRequest(request, capabilities = {}) {
  const prepared = cloneJson(request ?? {});
  const desired = prepared.desired_output;
  if (desired == null) {
    return deepFreeze({ request: prepared, negotiation: { requested_output: null, executed_output: null, fallback_used: false } });
  }
  if (!desired || typeof desired !== 'object' || Array.isArray(desired)) throw new TypeError('desired_output must be an object');
  const caps = capabilities?.output_geometry ?? {};
  const requestedOutput = cloneJson(desired);
  const executedOutput = cloneJson(desired);
  const negotiation = {
    requested_output: requestedOutput,
    executed_output: executedOutput,
    requested_geometry: null,
    executed_geometry: null,
    fallback_used: false,
    operation: null
  };

  const hasWidth = desired.width != null;
  const hasHeight = desired.height != null;
  if (hasWidth !== hasHeight) throw new TypeError('desired_output width and height must be provided together');
  const exactDimensions = normalizeExactDimensions(caps.exact_dimensions);

  if (hasWidth && hasHeight) {
    const width = positiveInteger('desired_output.width', desired.width);
    const height = positiveInteger('desired_output.height', desired.height);
    negotiation.requested_geometry = { width, height };
    const requestedKey = dimensionKey(width, height);
    const directlySupported = caps.arbitrary_dimensions === true || exactDimensions.has(requestedKey);
    if (directlySupported) {
      negotiation.executed_geometry = { width, height };
    } else {
      if (desired.adapter_fallback_allowed !== true) {
        throw new ProviderCapabilityError(`unsupported requested image geometry ${requestedKey}`, {
          requested_geometry: negotiation.requested_geometry,
          exact_dimensions: [...exactDimensions]
        });
      }
      const fallback = desired.adapter_fallback;
      if (!fallback || typeof fallback !== 'object' || Array.isArray(fallback)) {
        throw new ProviderCapabilityError(`unsupported requested image geometry ${requestedKey}; explicit adapter_fallback is required`, {
          requested_geometry: negotiation.requested_geometry,
          exact_dimensions: [...exactDimensions]
        });
      }
      const fallbackWidth = positiveInteger('adapter_fallback.width', fallback.width);
      const fallbackHeight = positiveInteger('adapter_fallback.height', fallback.height);
      const operation = String(fallback.operation ?? '').trim();
      if (!operation) throw new ProviderCapabilityError('adapter_fallback.operation is required for geometry substitution');
      const fallbackKey = dimensionKey(fallbackWidth, fallbackHeight);
      if (caps.arbitrary_dimensions !== true && !exactDimensions.has(fallbackKey)) {
        throw new ProviderCapabilityError(`unsupported explicit fallback image geometry ${fallbackKey}`, {
          requested_geometry: negotiation.requested_geometry,
          fallback_geometry: { width: fallbackWidth, height: fallbackHeight },
          exact_dimensions: [...exactDimensions]
        });
      }
      executedOutput.width = fallbackWidth;
      executedOutput.height = fallbackHeight;
      negotiation.executed_geometry = { width: fallbackWidth, height: fallbackHeight };
      negotiation.fallback_used = true;
      negotiation.operation = operation;
    }
  }

  const format = desired.format == null ? null : String(desired.format).toLowerCase();
  if (format && format !== 'auto') {
    const formats = Array.isArray(caps.formats) ? caps.formats.map(x => String(x).toLowerCase()) : null;
    if (!formats || !formats.includes(format)) {
      throw new ProviderCapabilityError(`unsupported requested image format ${format}`, {
        requested_format: format,
        supported_formats: formats ?? []
      });
    }
  }

  if (desired.variant_count_target != null) {
    const variantCount = positiveInteger('desired_output.variant_count_target', desired.variant_count_target);
    const maxVariants = caps.max_variants_per_call;
    if (Number.isInteger(maxVariants) && variantCount > maxVariants) {
      throw new ProviderCapabilityError(`requested variant_count_target ${variantCount} exceeds provider per-call maximum ${maxVariants}`, {
        requested_variant_count: variantCount,
        max_variants_per_call: maxVariants
      });
    }
  }

  if (desired.aspect_ratio != null && !hasWidth) {
    const ratio = String(desired.aspect_ratio).trim();
    const ratios = Array.isArray(caps.aspect_ratios) ? caps.aspect_ratios.map(String) : null;
    if (caps.arbitrary_dimensions !== true && (!ratios || !ratios.includes(ratio))) {
      throw new ProviderCapabilityError(`unsupported requested aspect ratio ${ratio}`, {
        requested_aspect_ratio: ratio,
        supported_aspect_ratios: ratios ?? []
      });
    }
  }

  negotiation.executed_output = executedOutput;
  prepared.desired_output = executedOutput;
  return deepFreeze({ request: prepared, negotiation });
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
  const prepareRequest = request => negotiateImageRequest(request, capabilities);
  return Object.freeze({
    name,
    capabilities,
    prepareRequest,
    async generatePrepared(prepared, options = {}) {
      if (!prepared?.request || !prepared?.negotiation) throw new TypeError('prepared provider request is required');
      return generateImpl(cloneJson(prepared.request), { ...options, negotiation: cloneJson(prepared.negotiation) });
    },
    async generate(request, options = {}) {
      const prepared = prepareRequest(request);
      return generateImpl(cloneJson(prepared.request), { ...options, negotiation: cloneJson(prepared.negotiation) });
    }
  });
}
