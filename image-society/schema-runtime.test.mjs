import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TERMINAL_STATES } from './contracts.mjs';
import { REGRESSION_RESULTS } from './regression.mjs';
import { buildCheckpoint } from './checkpoint.mjs';
import { createLedger } from './ledger.mjs';
import { createArtifactRegistry } from './artifacts.mjs';

const schema = JSON.parse(readFileSync(new URL('./schema/image-society.v1.schema.json', import.meta.url), 'utf8'));

test('machine schema terminal states match runtime terminal states exactly', () => {
  const declared = schema.$defs.turnEvent.properties.status.enum;
  assert.deepEqual([...declared].sort(), [...TERMINAL_STATES].sort());
});

test('machine schema represents explicit adapter fallback instead of silent geometry substitution', () => {
  assert.equal(schema.$defs.outputGeometry.properties.adapter_fallback.$ref, '#/$defs/adapterFallback');
  assert.ok(schema.$defs.adapterFallback.required.includes('operation'));
});

test('machine schema visual difference and continuity names match runtime canonical records', () => {
  assert.ok(schema.$defs.visualDifference.required.includes('protected_invariants'));
  assert.ok(schema.$defs.visualDifference.required.includes('observed_unintended_delta'));
  assert.ok(schema.$defs.continuityPack.required.includes('prohibited_drift'));
  assert.equal(schema.$defs.continuityPack.properties.prohibited_drifts, undefined);
});

test('machine schema checkpoint envelope matches deterministic runtime checkpoint shape', () => {
  const checkpoint = buildCheckpoint({ ledger: createLedger({ run_id: 'schema-cp', max_calls: 1 }), artifacts: createArtifactRegistry(), budget: {} });
  for (const key of schema.$defs.checkpoint.required) assert.ok(Object.hasOwn(checkpoint, key), `checkpoint missing ${key}`);
  for (const key of schema.$defs.checkpointState.required) assert.ok(Object.hasOwn(checkpoint.semantic_state, key), `checkpoint state missing ${key}`);
});

test('machine schema regression replay values match runtime corpus', () => {
  assert.deepEqual([...schema.$defs.regressionReplay.properties.result.enum].sort(), [...REGRESSION_RESULTS].sort());
});
