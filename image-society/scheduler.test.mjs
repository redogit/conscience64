import test from 'node:test';
import assert from 'node:assert/strict';
import { executeBatch, executeRun } from './scheduler.mjs';
import { createProviderAdapter, negotiateImageRequest } from './provider-adapter.mjs';

function boundedManifest(overrides = {}) {
  return {
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'scheduler-test',
    max_calls: 10,
    max_parallelism: 2,
    max_retries_per_call: 0,
    checkpoint_every_events: 5,
    summary_every_events: 5,
    max_branches: 4,
    promotion_mode: 'disabled',
    authority_mode: 'strict',
    accessibility_mode: 'enabled',
    ...overrides
  };
}

const generatePlanner = ({ call_index }) => ({
  branch_id: 'main',
  event_type: 'generate',
  request: { prompt: `candidate ${call_index}` }
});

test('scheduler never exceeds max_calls', async () => {
  let calls = 0;
  const provider = createProviderAdapter({
    name: 'mock',
    async generate(request) { calls += 1; return { images: [{ url: `mock://${calls}`, request }] }; }
  });
  const result = await executeRun({
    manifest: boundedManifest({ max_calls: 17, max_parallelism: 4 }),
    planner: generatePlanner,
    provider
  });
  assert.equal(calls, 17);
  assert.equal(result.call_count, 17);
  assert.equal(result.terminal_events.length, 17);
});

test('scheduler records retry exhaustion instead of dropping the call', async () => {
  const provider = createProviderAdapter({ name: 'fail', async generate() { throw new Error('provider down'); } });
  const result = await executeRun({
    manifest: boundedManifest({ max_calls: 1, max_retries_per_call: 2 }),
    planner: generatePlanner,
    provider
  });
  assert.equal(result.call_count, 1);
  assert.equal(result.terminal_events[0].status, 'retry-exhausted');
  assert.equal(result.terminal_events[0].attempt_count, 3);
  assert.equal(result.terminal_events[0].response_payload.attempt_errors.length, 3);
});

test('scheduler concurrency never exceeds max_parallelism', async () => {
  let active = 0;
  let observedMax = 0;
  const provider = createProviderAdapter({
    name: 'concurrency-mock',
    async generate() {
      active += 1;
      observedMax = Math.max(observedMax, active);
      await new Promise(resolve => setTimeout(resolve, 3));
      active -= 1;
      return { images: [{ url: 'mock://ok' }] };
    }
  });
  const result = await executeRun({
    manifest: boundedManifest({ max_calls: 23, max_parallelism: 3 }),
    planner: generatePlanner,
    provider
  });
  assert.equal(result.call_count, 23);
  assert.ok(observedMax <= 3);
  assert.ok(observedMax >= 2);
});

test('provider adapter rejects secret-bearing configuration fields', () => {
  assert.throws(() => createProviderAdapter({ name: 'bad', apiKey: 'secret', async generate() {} }), /secret/i);
});

test('scheduler resumes preserved ledger without duplicate logical call IDs', async () => {
  const provider = createProviderAdapter({
    name: 'resume-mock',
    async generate(request) { return { images: [{ url: `mock://${request.prompt}` }] }; }
  });
  const manifest = boundedManifest({ run_id: 'resume-run', max_calls: 8, max_parallelism: 2 });
  const first = await executeRun({
    manifest,
    planner: ({ call_index }) => call_index <= 5 ? { branch_id: 'main', event_type: 'generate', request: { prompt: `p${call_index}` } } : null,
    provider
  });
  assert.equal(first.call_count, 5);

  const resumed = await executeRun({ manifest, planner: generatePlanner, provider, ledger: first.ledger, checkpointState: { checkpoint: first.final_checkpoint, consumption: first.consumption } });
  assert.equal(resumed.call_count, 8);
  assert.equal(resumed.terminal_events.length, 8);
  assert.equal(resumed.missing_terminal_records.length, 0);
  assert.deepEqual(resumed.terminal_events.map(x => x.event_id), Array.from({ length: 8 }, (_, i) => `resume-run:call:${i + 1}`));
});

test('executeBatch resumes from preserved logical call count without duplicate IDs', async () => {
  const provider = createProviderAdapter({ name: 'batch-resume', async generate() { return { images: [{ url: 'mock://ok' }] }; } });
  const manifest = boundedManifest({ run_id: 'batch-resume-run', max_calls: 6, max_parallelism: 2 });
  const first = await executeBatch({
    manifest,
    plan: Array.from({ length: 4 }, (_, i) => ({ branch_id: 'main', event_type: 'generate', request: { i: i + 1 } })),
    provider
  });
  assert.equal(first.call_count, 4);
  const resumed = await executeBatch({
    manifest,
    plan: Array.from({ length: 4 }, (_, i) => ({ branch_id: 'main', event_type: 'generate', request: { i: i + 5 } })),
    provider,
    ledger: first.ledger,
    checkpointState: { checkpoint: first.final_checkpoint, consumption: first.consumption }
  });
  assert.equal(resumed.call_count, 6);
  assert.equal(resumed.missing_terminal_records.length, 0);
  assert.deepEqual(resumed.terminal_events.map(x => x.event_id), Array.from({ length: 6 }, (_, i) => `batch-resume-run:call:${i + 1}`));
});

test('geometry negotiation rejects unsupported exact dimensions instead of silently substituting', () => {
  assert.throws(() => negotiateImageRequest({
    desired_output: { width: 2048, height: 1152, format: 'png', variant_count_target: 1, adapter_fallback_allowed: false }
  }, {
    output_geometry: { exact_dimensions: ['1024x1024', '1536x1024'], formats: ['png'], max_variants_per_call: 4 }
  }), /unsupported.*2048x1152/i);
});

test('geometry negotiation records explicit fallback and executed geometry', () => {
  const result = negotiateImageRequest({
    desired_output: {
      width: 2048, height: 1152, format: 'png', variant_count_target: 1,
      adapter_fallback_allowed: true,
      adapter_fallback: { width: 1536, height: 1024, operation: 'letterbox' }
    }
  }, {
    output_geometry: { exact_dimensions: ['1024x1024', '1536x1024'], formats: ['png'], max_variants_per_call: 4 }
  });
  assert.deepEqual(result.negotiation.requested_geometry, { width: 2048, height: 1152 });
  assert.deepEqual(result.negotiation.executed_geometry, { width: 1536, height: 1024 });
  assert.equal(result.negotiation.fallback_used, true);
  assert.equal(result.negotiation.operation, 'letterbox');
  assert.equal(result.request.desired_output.width, 1536);
  assert.equal(result.request.desired_output.height, 1024);
});

test('capability failure is terminal and does not spend provider retries', async () => {
  let calls = 0;
  const provider = createProviderAdapter({
    name: 'geometry-provider',
    capabilities: { output_geometry: { exact_dimensions: ['1024x1024'], formats: ['png'], max_variants_per_call: 1 } },
    async generate() { calls += 1; return { images: [{ url: 'mock://unexpected' }] }; }
  });
  const result = await executeRun({
    manifest: boundedManifest({ run_id: 'capability-fail', max_calls: 1, max_retries_per_call: 3 }),
    planner: () => ({
      branch_id: 'main', event_type: 'generate',
      request: { desired_output: { width: 2048, height: 1152, format: 'png', variant_count_target: 1, adapter_fallback_allowed: false } }
    }),
    provider
  });
  assert.equal(calls, 0);
  assert.equal(result.terminal_events[0].status, 'failed-capability');
  assert.equal(result.terminal_events[0].attempt_count, 1);
});
