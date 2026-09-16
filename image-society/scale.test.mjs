import test from 'node:test';
import assert from 'node:assert/strict';
import { executeRun } from './scheduler.mjs';
import { createProviderAdapter } from './provider-adapter.mjs';
import { checkpointDigest } from './checkpoint.mjs';

function scaleManifest() {
  return {
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'scale-1000',
    max_calls: 1000,
    max_parallelism: 16,
    max_retries_per_call: 1,
    checkpoint_every_events: 25,
    summary_every_events: 10,
    max_branches: 8,
    promotion_mode: 'disabled',
    authority_mode: 'strict',
    accessibility_mode: 'enabled',
    allowed_providers: ['mock']
  };
}

function deterministicThousandCallPlanner({ call_index }) {
  return {
    branch_id: `branch-${(call_index - 1) % 4}`,
    event_type: 'generate',
    request: {
      prompt: `deterministic candidate ${call_index}`,
      sequence: call_index,
      size: call_index % 3 === 0 ? 'landscape' : call_index % 3 === 1 ? 'square' : 'portrait'
    }
  };
}

function deterministicMockProvider() {
  return createProviderAdapter({
    name: 'mock',
    capabilities: { determinism_class: 'REFERENCE_RUNNER_BYTE_IDENTICAL' },
    async generate(request) {
      return {
        provider: 'mock',
        model: 'deterministic-fixture-v1',
        images: [{ url: `mock://image/${request.sequence}` }],
        usage: { token_in: 2, token_out: 1, cost: 0, storage_bytes: 64 }
      };
    }
  });
}

async function runScale() {
  return executeRun({
    manifest: scaleManifest(),
    planner: deterministicThousandCallPlanner,
    provider: deterministicMockProvider()
  });
}

test('1000-call mock run preserves accounting, bounded context, and checkpoint identity', async () => {
  const first = await runScale();
  assert.equal(first.call_count, 1000);
  assert.equal(first.terminal_events.length, 1000);
  assert.equal(first.missing_terminal_records.length, 0);
  assert.ok(first.checkpoints.length >= 40);
  assert.ok(first.active_context.source_event_ids.length < 250);
  assert.equal(first.consumption.token_in, 2000);
  assert.equal(first.consumption.token_out, 1000);

  const second = await runScale();
  assert.equal(second.call_count, 1000);
  assert.equal(checkpointDigest(first.final_checkpoint), checkpointDigest(second.final_checkpoint));
  assert.equal(first.final_checkpoint.semantic_digest, second.final_checkpoint.semantic_digest);
});
