# Governed Hypothesis Algorithm Builder

This tool turns an explicit human intuition into a deterministic hypothesis packet and bounded discriminator plan without promoting intuition, generated experiments, or semantic similarity to evidence.

## Core principle

`gut instinct -> hypothesis generator`, not evidence.

Hard boundaries:

- `INTUITION != EVIDENCE`
- `HYPOTHESIS != CLAIM_ESTABLISHED`
- `GENERATED_EXPERIMENT != EXECUTED_EXPERIMENT`
- `TEST_SUPPORT != UNIVERSAL_TRUTH`
- `TEST_CONTRADICTION != UNIVERSAL_FALSEHOOD`
- `SEMANTIC_MATCH != CORROBORATION`
- `ALGORITHM_HARNESS_MANIFEST != HARNESS_EXECUTION`
- `REPAIR != HISTORY_REWRITE`

## API

`tools/hypothesis-algorithm-builder.mjs` exports:

- `createHypothesisSeed(input)` — preserves the original intuition verbatim, assigns deterministic identity, records explicit formalization fields, and leaves missing scientific semantics unresolved.
- `compileDiscriminatorPlan(seed, input)` — creates a baseline plus one-degree interventions. Each intervention may change exactly one declared baseline factor.
- `xorStateDelta(before, after)` — finite equal-width binary calibration. It returns the XOR delta and exact forward/backward replay.
- `evaluateDiscriminator(plan, observations)` — returns only `SUPPORTED_IN_TEST`, `CONTRADICTED_IN_TEST`, `INCONCLUSIVE`, or `INVALID_TEST`.
- `repairHypothesis(seed, revision)` — creates a successor hypothesis while preserving predecessor identity and the original intuition.
- `toAlgorithmHarnessSupportManifest(plan, options)` — emits a support-only, not-executed experiment manifest. It does not claim Algorithm Harness execution.

## Example

```js
import {
  createHypothesisSeed,
  compileDiscriminatorPlan,
  xorStateDelta,
  evaluateDiscriminator
} from './hypothesis-algorithm-builder.mjs';

const seed=createHypothesisSeed({
  intuition:'Difference and reversible transition may share a carrier.',
  formalStatement:'For equal-width binary states, XOR delta describes and replays the transition.',
  observables:['roundTrip'],
  scope:'finite binary calibration'
});

const delta=xorStateDelta('101101','011001');
// delta.delta === '110100'
// forward replay === '011001'
// backward replay === '101101'

const plan=compileDiscriminatorPlan(seed,{
  baselineState:{carrier:'xor',mode:'reversible'},
  interventions:[
    {id:'without-replay',factor:'mode',value:'describe-only'}
  ],
  observations:['roundTrip'],
  expected:[
    {conditionId:'baseline',field:'roundTrip',relation:'eq',value:true},
    {conditionId:'without-replay',field:'roundTrip',relation:'eq',value:false}
  ]
});

const evaluation=evaluateDiscriminator(plan,{
  baseline:{roundTrip:true},
  'without-replay':{roundTrip:false}
});
// evaluation.status === 'SUPPORTED_IN_TEST'
```

## CLI

Input file:

```json
{
  "seed": {
    "intuition": "Difference and reversible transition may share a carrier.",
    "formalStatement": "For equal-width binary states, XOR delta describes and replays the transition.",
    "observables": ["roundTrip"],
    "scope": "finite binary calibration"
  },
  "plan": {
    "baselineState": {"carrier": "xor", "mode": "reversible"},
    "interventions": [
      {"id": "without-replay", "factor": "mode", "value": "describe-only"}
    ],
    "observations": ["roundTrip"],
    "expected": [
      {"conditionId": "baseline", "field": "roundTrip", "relation": "eq", "value": true},
      {"conditionId": "without-replay", "field": "roundTrip", "relation": "eq", "value": false}
    ]
  },
  "xorCalibration": {"before": "101101", "after": "011001"},
  "manifest": {"seeds": [1, 2, 3]}
}
```

Run:

```bash
node tools/run-hypothesis-algorithm-builder.mjs \
  --input hypothesis.json \
  --output hypothesis-run.json
```

The CLI reports `builderExecution:'completed'` for the deterministic compilation step and `scientificExecution:'not-executed'` for the scientific experiment. The Algorithm Harness support manifest also remains `executionStatus:'not-executed'` until a separate Build & Test action actually executes it.

## One-degree rule

For baseline state `B`, each condition is generated as `B_i = B` with exactly one declared factor changed.

The compiler rejects zero-change, unknown-factor, duplicate-ID, and multi-factor intervention entries. This does not establish causality by itself. It only produces a cleaner finite discriminator plan.

## XOR calibration scope

For equal-width binary strings `x` and `y`:

`delta = x XOR y`

and the same delta replays both directions:

- `x XOR delta = y`
- `y XOR delta = x`

This is exact inside the finite binary calibration. It is not evidence that arbitrary physical, semantic, biological, social, or scientific state transitions are XOR-linear.

## Hypothesis repair

Repairs are successors, never rewrites: `H0 -> H1`.

`H1` records `predecessorId`, revision reason, explicit changed fields, and optional evaluation reference. `H0.intuition` remains unchanged.

## Algorithm Harness relation

The Library Algorithm Harness 0.2 remains a support-only predecessor/companion. This module emits a compatible experiment description shape but imports no Harness runtime and claims no execution. Actual transactional execution, replay, rollback, ablation, and reporting remain separate experimental evidence.

## Claim ceiling

Passing the software tests establishes that the builder preserves its finite software contract on tested inputs. It does not establish scientific truth, universal XOR structure, causal mechanism, independent corroboration, or canonical Society authority.
