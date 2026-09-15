#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkpointDigest } from '../image-society/checkpoint.mjs';
import { replayLedger } from '../image-society/ledger.mjs';
import { createProviderAdapter } from '../image-society/provider-adapter.mjs';
import { executeRun } from '../image-society/scheduler.mjs';
import { validateRunManifest } from '../image-society/contracts.mjs';

function usage() {
  return `Usage: node tools/run-image-society.mjs --mock [--calls N] [--parallelism N] [--resume-checkpoint FILE]\n\n` +
    `The checked-in run manifest is the hard ceiling. CLI flags may narrow but never widen it.\n`;
}

function positiveInt(flag, raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new TypeError(`${flag} requires a positive integer`);
  return n;
}

export function parseArgs(argv) {
  const out = { mock: false, calls: null, parallelism: null, resumeCheckpoint: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mock') out.mock = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--calls') out.calls = positiveInt('--calls', argv[++i]);
    else if (arg === '--parallelism') out.parallelism = positiveInt('--parallelism', argv[++i]);
    else if (arg === '--resume-checkpoint') out.resumeCheckpoint = argv[++i] ?? (() => { throw new TypeError('--resume-checkpoint requires a file'); })();
    else throw new TypeError(`unknown argument: ${arg}`);
  }
  return out;
}

function loadBaseManifest() {
  const path = new URL('../image-society/schema/run-manifest.example.json', import.meta.url);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function boundedManifest(base, args) {
  const next = {
    ...base,
    max_calls: args.calls == null ? base.max_calls : Math.min(base.max_calls, args.calls),
    max_parallelism: args.parallelism == null ? base.max_parallelism : Math.min(base.max_parallelism, args.parallelism)
  };
  return validateRunManifest(next);
}

function deterministicMockProvider() {
  return createProviderAdapter({
    name: 'mock',
    capabilities: { determinism_class: 'REFERENCE_RUNNER_BYTE_IDENTICAL' },
    async generate(request) {
      return {
        provider: 'mock',
        model: 'image-society-cli-mock-v1',
        images: [{ url: `mock://image/${request.logical_call_index}` }],
        usage: { token_in: 1, token_out: 1, cost: 0, storage_bytes: 32 }
      };
    }
  });
}

function loadResumeBundle(path, manifest) {
  const bundle = JSON.parse(readFileSync(resolve(path), 'utf8'));
  if (!Array.isArray(bundle.events)) throw new TypeError('resume checkpoint bundle must contain an events array');
  const ledger = replayLedger(bundle.events, manifest);
  return {
    ledger,
    checkpointState: {
      checkpoint: bundle.checkpoint ?? null,
      consumption: bundle.consumption ?? null
    }
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(usage());
    return 0;
  }
  if (!args.mock) throw new Error('This entrypoint currently executes only the explicit --mock provider. Real providers must be injected by an authorized runtime.');

  const manifest = boundedManifest(loadBaseManifest(), args);
  const resume = args.resumeCheckpoint ? loadResumeBundle(args.resumeCheckpoint, manifest) : { ledger: undefined, checkpointState: null };
  const result = await executeRun({
    manifest,
    planner: ({ call_index }) => ({
      branch_id: `mock-branch-${(call_index - 1) % Math.min(4, manifest.max_branches)}`,
      event_type: 'generate',
      request: {
        logical_call_index: call_index,
        prompt: `Conscience64 deterministic mock image candidate ${call_index}`,
        desired_output: { format: 'auto', variant_count: 1 }
      }
    }),
    provider: deterministicMockProvider(),
    ledger: resume.ledger,
    checkpointState: resume.checkpointState
  });

  const summary = {
    schema: 'conscience64/image-society/cli-result/v1',
    run_id: manifest.run_id,
    requested_call_ceiling: args.calls ?? manifest.max_calls,
    effective_call_ceiling: manifest.max_calls,
    effective_parallelism: manifest.max_parallelism,
    call_count: result.call_count,
    terminal_event_count: result.terminal_events.length,
    missing_terminal_records: result.missing_terminal_records,
    checkpoint_count: result.checkpoints.length,
    final_checkpoint_digest: checkpointDigest(result.final_checkpoint),
    active_context_source_event_count: result.active_context.source_event_ids.length,
    stop_reason: result.stop_reason,
    evidence_class: 'MOCK_STRUCTURAL_ORCHESTRATION_ONLY'
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => {
    process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
    process.exitCode = 1;
  });
}
