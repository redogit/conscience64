import { createArtifactRegistry } from './artifacts.mjs';
import { buildActiveContext, buildCheckpoint } from './checkpoint.mjs';
import { validateRunManifest } from './contracts.mjs';
import { appendEvent, createLedger } from './ledger.mjs';

const PROVIDER_EVENT_TYPES = new Set(['generate', 'variation', 'edit', 'critique', 'compare']);

function asNonNegativeNumber(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function emptyConsumption() {
  return { token_in: 0, token_out: 0, cost: 0, storage_bytes: 0 };
}

function addUsage(target, usage = {}) {
  target.token_in += asNonNegativeNumber(usage.token_in ?? usage.input_tokens);
  target.token_out += asNonNegativeNumber(usage.token_out ?? usage.output_tokens);
  target.cost += asNonNegativeNumber(usage.cost ?? usage.cost_estimate);
  target.storage_bytes += asNonNegativeNumber(usage.storage_bytes);
}

function wouldExceedBudget(manifest, consumption, estimate = {}) {
  const budget = manifest.budgets ?? {};
  const projected = {
    token_in: consumption.token_in + asNonNegativeNumber(estimate.token_in),
    token_out: consumption.token_out + asNonNegativeNumber(estimate.token_out),
    cost: consumption.cost + asNonNegativeNumber(estimate.cost),
    storage_bytes: consumption.storage_bytes + asNonNegativeNumber(estimate.storage_bytes)
  };
  if (budget.token_in_max != null && projected.token_in > budget.token_in_max) return 'token-in-budget';
  if (budget.token_out_max != null && projected.token_out > budget.token_out_max) return 'token-out-budget';
  if (budget.cost_max != null && projected.cost > budget.cost_max) return 'cost-budget';
  if (budget.storage_bytes_max != null && projected.storage_bytes > budget.storage_bytes_max) return 'storage-budget';
  return null;
}

function normalizePlanItem(item, callIndex) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError(`planner returned invalid call ${callIndex}`);
  const branch_id = String(item.branch_id ?? 'main').trim() || 'main';
  const event_type = String(item.event_type ?? 'generate');
  if (!PROVIDER_EVENT_TYPES.has(event_type)) throw new TypeError(`planner event_type is not provider-executable: ${event_type}`);
  return {
    branch_id,
    event_type,
    request: item.request == null ? {} : JSON.parse(JSON.stringify(item.request)),
    estimate: item.estimate == null ? {} : JSON.parse(JSON.stringify(item.estimate)),
    parent_event_ids: Array.isArray(item.parent_event_ids) ? [...item.parent_event_ids] : [],
    input_artifact_ids: Array.isArray(item.input_artifact_ids) ? [...item.input_artifact_ids] : [],
    actor: item.actor ?? { actor_type: 'agent', actor_id: 'image-society-scheduler', role: item.role ?? 'generator' },
    authority_state: item.authority_state ?? {
      world_checked: false,
      accessibility_checked: false,
      continuity_checked: false,
      human_reviewed: false,
      canonical: false,
      reality_classification: 'not-applicable'
    }
  };
}

function outputArtifactIds(runId, callIndex, raw) {
  const images = Array.isArray(raw?.images) ? raw.images : Array.isArray(raw?.data) ? raw.data : [];
  return images.map((_, index) => `${runId}:call:${callIndex}:artifact:${index + 1}`);
}

async function executeLogicalCall({ manifest, provider, item, callIndex, signal }) {
  const event_id = `${manifest.run_id}:call:${callIndex}`;
  const attemptErrors = [];
  let raw = null;
  let attempts = 0;
  let status = 'succeeded';

  for (let attempt = 1; attempt <= manifest.max_retries_per_call + 1; attempt += 1) {
    attempts = attempt;
    if (signal?.aborted) {
      status = 'cancelled';
      break;
    }
    try {
      raw = await provider.generate(item.request, { signal, callIndex, attempt });
      status = 'succeeded';
      break;
    } catch (error) {
      const aborted = signal?.aborted || error?.name === 'AbortError';
      attemptErrors.push(String(error?.message ?? error));
      if (aborted) {
        status = 'cancelled';
        break;
      }
      if (attempt > manifest.max_retries_per_call) {
        status = manifest.max_retries_per_call > 0 ? 'retry-exhausted' : 'failed-provider';
        break;
      }
    }
  }

  const usage = raw?.usage ?? {};
  const providerProvenance = {
    provider: provider.name,
    token_in: asNonNegativeNumber(usage.token_in ?? usage.input_tokens),
    token_out: asNonNegativeNumber(usage.token_out ?? usage.output_tokens),
    cost_estimate: asNonNegativeNumber(usage.cost ?? usage.cost_estimate),
    determinism_class: provider.capabilities?.determinism_class ?? 'UNKNOWN'
  };
  if (raw?.model != null) providerProvenance.model = String(raw.model);
  if (raw?.model_version != null) providerProvenance.model_version = String(raw.model_version);

  return {
    event_id,
    branch_id: item.branch_id,
    event_type: item.event_type,
    status,
    attempt_count: attempts,
    parent_event_ids: item.parent_event_ids,
    input_artifact_ids: item.input_artifact_ids,
    output_artifact_ids: status === 'succeeded' ? outputArtifactIds(manifest.run_id, callIndex, raw) : [],
    actor: item.actor,
    request_payload: item.request,
    response_payload: status === 'succeeded'
      ? { result: raw ?? null, attempt_errors: attemptErrors }
      : { attempt_errors: attemptErrors },
    provenance: providerProvenance,
    authority_state: item.authority_state,
    _usage: {
      token_in: providerProvenance.token_in,
      token_out: providerProvenance.token_out,
      cost: providerProvenance.cost_estimate,
      storage_bytes: asNonNegativeNumber(usage.storage_bytes)
    }
  };
}

async function checkpointIfNeeded({ manifest, ledger, artifacts, consumption, checkpoints, onCheckpoint }) {
  if (ledger.events.length === 0 || ledger.events.length % manifest.checkpoint_every_events !== 0) return;
  const checkpoint = buildCheckpoint({ ledger, artifacts, budget: { call_count: ledger.events.length, ...consumption } });
  checkpoints.push(checkpoint);
  if (onCheckpoint) await onCheckpoint(checkpoint);
}

function terminalMissing(admittedCount, terminalEvents, runId) {
  const seen = new Set(terminalEvents.map(e => e.event_id));
  const missing = [];
  for (let i = 1; i <= admittedCount; i += 1) {
    const id = `${runId}:call:${i}`;
    if (!seen.has(id)) missing.push(id);
  }
  return missing;
}

export async function executeBatch({ manifest: manifestInput, plan, ledger: ledgerInput, provider, checkpointState = null, signal, onCheckpoint } = {}) {
  const manifest = validateRunManifest(manifestInput);
  if (!provider?.generate || !provider?.name) throw new TypeError('provider adapter is required');
  if (manifest.allowed_providers && !manifest.allowed_providers.includes(provider.name)) throw new Error(`provider not allowed by run manifest: ${provider.name}`);
  if (!Array.isArray(plan)) throw new TypeError('plan must be an array');
  const ledger = ledgerInput ?? createLedger(manifest);
  const artifacts = checkpointState?.artifacts ?? createArtifactRegistry();
  const consumption = checkpointState?.consumption ? { ...checkpointState.consumption } : emptyConsumption();
  const checkpoints = [];
  const terminal_events = [];
  const admitted = Math.min(plan.length, manifest.max_calls);

  for (let offset = 0; offset < admitted; offset += manifest.max_parallelism) {
    const slice = plan.slice(offset, Math.min(admitted, offset + manifest.max_parallelism));
    const tasks = slice.map((raw, j) => {
      const callIndex = offset + j + 1;
      const item = normalizePlanItem(raw, callIndex);
      return executeLogicalCall({ manifest, provider, item, callIndex, signal });
    });
    const completed = await Promise.all(tasks);
    for (const internal of completed) {
      const { _usage, ...event } = internal;
      addUsage(consumption, _usage);
      const appended = appendEvent(ledger, event);
      terminal_events.push(appended);
      await checkpointIfNeeded({ manifest, ledger, artifacts, consumption, checkpoints, onCheckpoint });
    }
  }

  let finalCheckpoint = checkpoints.at(-1);
  if (!finalCheckpoint || finalCheckpoint.semantic_state.through_event_count !== ledger.events.length) {
    finalCheckpoint = buildCheckpoint({ ledger, artifacts, previousCheckpoint: checkpointState?.checkpoint ?? null, budget: { call_count: admitted, ...consumption } });
    checkpoints.push(finalCheckpoint);
    if (onCheckpoint) await onCheckpoint(finalCheckpoint);
  }
  return {
    manifest,
    ledger,
    call_count: admitted,
    terminal_events,
    missing_terminal_records: terminalMissing(admitted, terminal_events, manifest.run_id),
    checkpoints,
    final_checkpoint: finalCheckpoint,
    active_context: buildActiveContext(finalCheckpoint),
    consumption
  };
}

export async function executeRun({ manifest: manifestInput, planner, ledger: ledgerInput, provider, onCheckpoint, signal, checkpointState = null } = {}) {
  const manifest = validateRunManifest(manifestInput);
  if (typeof planner !== 'function' && typeof planner?.next !== 'function') throw new TypeError('planner function or planner.next is required');
  if (!provider?.generate || !provider?.name) throw new TypeError('provider adapter is required');
  if (manifest.allowed_providers && !manifest.allowed_providers.includes(provider.name)) throw new Error(`provider not allowed by run manifest: ${provider.name}`);

  const ledger = ledgerInput ?? createLedger(manifest);
  const artifacts = checkpointState?.artifacts ?? createArtifactRegistry();
  const consumption = checkpointState?.consumption ? { ...checkpointState.consumption } : emptyConsumption();
  const existingTerminalEvents = ledger.events.filter(event =>
    event.provenance?.provider && event.event_id.startsWith(`${manifest.run_id}:call:`)
  );
  const checkpoints = checkpointState?.checkpoint ? [checkpointState.checkpoint] : [];
  const terminal_events = [...existingTerminalEvents];
  const branches = new Set(ledger.events.map(e => e.branch_id));
  let admittedCount = existingTerminalEvents.length;
  let stop_reason = null;

  const callPlanner = typeof planner === 'function' ? planner : args => planner.next(args);

  while (admittedCount < manifest.max_calls && !stop_reason) {
    if (signal?.aborted) {
      stop_reason = 'cancelled';
      break;
    }
    const wave = [];
    const projected = { ...consumption };

    while (wave.length < manifest.max_parallelism && admittedCount + wave.length < manifest.max_calls) {
      const callIndex = admittedCount + wave.length + 1;
      const raw = await callPlanner({
        call_index: callIndex,
        call_count: admittedCount,
        manifest,
        checkpoint: checkpoints.at(-1) ?? checkpointState?.checkpoint ?? null,
        active_context: checkpoints.length ? buildActiveContext(checkpoints.at(-1)) : null
      });
      if (raw == null) {
        stop_reason = 'planner-complete';
        break;
      }
      const item = normalizePlanItem(raw, callIndex);
      const newBranch = !branches.has(item.branch_id) && !wave.some(x => x.item.branch_id === item.branch_id);
      if (newBranch && branches.size + new Set(wave.map(x => x.item.branch_id).filter(id => !branches.has(id))).size >= manifest.max_branches) {
        stop_reason = 'max-branches';
        break;
      }
      const budgetBlock = wouldExceedBudget(manifest, projected, item.estimate);
      if (budgetBlock) {
        stop_reason = budgetBlock;
        break;
      }
      addUsage(projected, item.estimate);
      wave.push({ item, callIndex });
    }

    if (!wave.length) break;
    for (const entry of wave) branches.add(entry.item.branch_id);

    const completed = await Promise.all(wave.map(({ item, callIndex }) =>
      executeLogicalCall({ manifest, provider, item, callIndex, signal })
    ));

    for (const internal of completed) {
      const { _usage, ...event } = internal;
      addUsage(consumption, _usage);
      const appended = appendEvent(ledger, event);
      terminal_events.push(appended);
      admittedCount += 1;
      await checkpointIfNeeded({ manifest, ledger, artifacts, consumption, checkpoints, onCheckpoint });
    }

    const actualBudgetBlock = wouldExceedBudget(manifest, consumption, {});
    if (actualBudgetBlock) stop_reason = actualBudgetBlock;
  }

  if (admittedCount >= manifest.max_calls && !stop_reason) stop_reason = 'max-calls';

  let finalCheckpoint = checkpoints.at(-1);
  if (!finalCheckpoint || finalCheckpoint.semantic_state.through_event_count !== ledger.events.length) {
    finalCheckpoint = buildCheckpoint({
      ledger,
      artifacts,
      previousCheckpoint: checkpointState?.checkpoint ?? null,
      budget: { call_count: admittedCount, ...consumption }
    });
    checkpoints.push(finalCheckpoint);
    if (onCheckpoint) await onCheckpoint(finalCheckpoint);
  }

  return {
    manifest,
    ledger,
    call_count: admittedCount,
    terminal_events,
    missing_terminal_records: terminalMissing(admittedCount, terminal_events, manifest.run_id),
    checkpoints,
    final_checkpoint: finalCheckpoint,
    active_context: buildActiveContext(finalCheckpoint),
    consumption,
    stop_reason
  };
}
