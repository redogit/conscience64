# Image Society v1 — Second-Pass Plan Corrections

This file is a normative correction to `2026-09-14-image-society-v1.md` discovered during the required second review pass. Executors MUST apply these corrections when implementing the plan.

## 1. Long-horizon call bound

The main plan's Task 1 text says `max_calls` is validated in `1..100000`.

**Superseding requirement:**

```text
max_calls ∈ [1, 1_000_000]
```

The default/pilot run remains `max_calls = 1000`.

The larger schema ceiling exists to support future explicitly bounded long-horizon runs. It does not authorize unbounded execution and does not require spending the configured maximum.

### Corrected test addition

Add to Task 1:

```js
test('run manifest supports a bounded long-horizon ceiling without changing the 1000-call pilot', () => {
  const longRun = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'bounded-300k',
    max_calls: 300_000,
    max_parallelism: 8,
    max_retries_per_call: 2,
    checkpoint_every_events: 25,
    summary_every_events: 10,
    max_branches: 32,
    promotion_mode: 'manual',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(longRun.max_calls, 300_000);
  assert.throws(() => validateRunManifest({ ...longRun, max_calls: 1_000_001 }), /max_calls/);
});
```

## 2. Output geometry is intent, provider size list is capability

The current browser `Conscience64ImageGen` transport supports a finite size set. Image Society MUST NOT turn that transport list into a global Image Society geometry limit.

The v1 schema now includes `constraints.output_geometry` with:

- `aspect_ratio`;
- `width`;
- `height`;
- `format`;
- `variant_count_target`;
- `adapter_fallback_allowed`.

### Required implementation behavior

Before a generation/edit call:

1. preserve requested output geometry in the Image Intent / role envelope;
2. query or receive provider/renderer capability metadata;
3. choose an exact-capability route when available;
4. if exact geometry is unavailable and fallback is forbidden, return `failed-capability` (or the equivalent explicit terminal result) rather than silently changing geometry;
5. if fallback is allowed, record requested geometry and executed geometry separately;
6. record resize/crop/pad/upscale/downscale as a successor derived artifact with its own provenance.

### Corrected test addition

Add a contract test such as:

```js
test('image intent preserves arbitrary desired geometry independently of provider support', () => {
  const intent = validateImageIntent({
    schema: 'conscience64/image-society/intent/v1',
    intent_id: 'wide-production-shot',
    purpose: 'world-visualization',
    description: 'Photoreal grounded city block with an anomaly in the distance.',
    constraints: {
      output_geometry: {
        aspect_ratio: '21:9',
        width: 5120,
        height: 2160,
        format: 'webp',
        variant_count_target: 250,
        adapter_fallback_allowed: false
      }
    },
    success_criteria: ['geometry preserved as intent even when provider cannot satisfy it'],
    parent_intent_ids: []
  });
  assert.equal(intent.constraints.output_geometry.width, 5120);
});
```

## 3. Production photoreal profile

For Red Wilds / MMO production image work that requests high-quality real-life presentation, apply:

`image-society/prompts/production-image-profile.v1.json`

This is a visual production profile with `authority: none`. It does not override a deliberately stylized, diagnostic, accessibility, scientific-reference, or diagram intent.

The profile requires:

- credible real-world materials and human-scale proportions;
- practical lighting, weathering, reflections, and shadows;
- ordinary-world grounding before anomaly/fantasy intrusion;
- continuity protection where applicable;
- geometry capability negotiation rather than silent fixed-size fallback;
- arbitrarily large variant identities scheduled through bounded provider calls/batches;
- explicit distinction between realism and evidentiary authority.

## 4. Example provider allowlist

`image-society/schema/run-manifest.example.json` now explicitly allows only `mock` for the qualification example.

An empty provider allowlist MUST NOT be interpreted as implicit permission to call arbitrary external providers. Real-provider qualification requires an explicit admitted provider/renderer identity.

## 5. Review result

These corrections do not modify ECS/world authority, Visual Carrier v2 history, Renderer Society history, or existing image-generation transport behavior. They widen only the future bounded orchestration contract and make provider capability negotiation explicit.
