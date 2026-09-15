import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, sha256Canonical } from './canonical.mjs';
import { validateRunManifest } from './contracts.mjs';

test('canonicalJson is insensitive to object key insertion order', () => {
  const a = { z: 2, a: { y: 4, x: 3 } };
  const b = { a: { x: 3, y: 4 }, z: 2 };
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(sha256Canonical(a), sha256Canonical(b));
});

test('run manifest rejects an unbounded call budget', () => {
  assert.throws(() => validateRunManifest({ run_id: 'r1', max_calls: 0 }), /max_calls/);
});

test('run manifest accepts a bounded 1000-call configuration', () => {
  const out = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'pilot-1000',
    max_calls: 1000,
    max_parallelism: 8,
    max_retries_per_call: 2,
    checkpoint_every_events: 25,
    summary_every_events: 10,
    max_branches: 32,
    promotion_mode: 'manual',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(out.max_calls, 1000);
  assert.equal(out.promotion_mode, 'manual');
  assert.equal(Object.isFrozen(out), true);
});

test('run manifest supports explicitly bounded long-horizon runs through one million logical calls', () => {
  const out = validateRunManifest({
    schema: 'conscience64/image-society/run-manifest/v1',
    run_id: 'future-250k',
    max_calls: 250000,
    max_parallelism: 16,
    max_retries_per_call: 1,
    checkpoint_every_events: 100,
    summary_every_events: 50,
    max_branches: 128,
    promotion_mode: 'disabled',
    authority_mode: 'strict',
    accessibility_mode: 'enabled'
  });
  assert.equal(out.max_calls, 250000);
  assert.throws(() => validateRunManifest({ ...out, max_calls: 1000001 }), /max_calls/);
});
