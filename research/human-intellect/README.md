# Human-Level Intellect — Module 0/1 Vertical Slice

Status: experimental prototype. This is engineering scaffolding, not a claim of human-level intelligence.

## Scope

This slice implements the smallest current obligations:

- KD bounded activation and reconstruction
- explicit unknown remainder
- obligation records (`O0`, `O1`, local objective)
- authority/budget gates
- append-only lineage
- controller `allow | wait | reject` decisions
- contradiction records and one-degree repair proposals
- synthetic design-of-experiments screening
- TypeScript contracts
- a real WebAssembly capability probe
- a WIT capability contract for later WASI Component Model components

It intentionally does **not** implement the world model, universe simulator, autonomous self-modification, or cross-domain proof machinery.

## Human-centred constraints

- local-first
- no consequential action without explicit authority state
- unknown stays unknown
- silence is not confirmation
- bounded working set; durable lineage remains reconstructible
- WCAG 2.2-oriented interaction requirements
- human-centred design follows ISO 9241-210 process direction

## Authority validation boundary

`ObligationKernel.authorize()` accepts exactly the four primitive strings in
`AuthorityStatus`: `authorized`, `ambiguous`, `unavailable`, and `rejected`.
Missing, malformed, and unrecognized states throw before replacing the current
obligation or appending authorization lineage. Values are not coerced or normalized.

The controller checks the current state again on every decision, including for
altered or restored records. `ambiguous` and `unavailable` retain `wait`;
`rejected` retains `reject`; invalid states produce a recorded `reject` without
spending budget. Only `authorized` can reach the existing scope and budget gates.
Invalid states are not silently converted into a valid state. Existing obligation
identity, decision history, unknown remainder, anchors, and repair lineage are retained.

These are internal prototype classifications. The caller supplies both `authority`
and `authorityStatus`; an `allow` decision does not authenticate a user or prove
their permission. Trusted identity verification, permission evidence bound to an
operation and scope, expiry/revocation, and enforcement by an external executor
remain proposed integration contracts. The WIT description and empty WebAssembly
probe do not implement those contracts. This prototype is not an established
security boundary or autonomous-execution system.

## Numerical validation boundary

Budgets, unresolved costs, accumulated spending, and operation costs must be
primitive finite non-negative numbers; strings are not coerced. Invalid creation
inputs throw before replacing an obligation or adding authorization lineage.
The runtime rechecks mutable numerical state before remaining-budget reads,
spending, and decisions; an overspent record is invalid. Invalid values throw
before recording a decision or repair. Zero remains valid. A spend is denied
if it exceeds the remaining budget, would overflow or round above the budget,
or a positive cost is too small to change accumulated spending.

These checks use JavaScript floating-point arithmetic, not exact accounting.
Obligation records are mutable and this prototype is not tamper-proof;
a trusted executor must enforce independently authenticated external permission.

## WebAssembly / WASI

The prototype uses a tiny core WebAssembly module as a capability probe. The WIT file defines the future component boundary. The current Component Model guide still names WASI 0.2.0 as stable; wasi.dev also documents the 0.3 milestone and its native async evolution. This slice does not pretend it has a 0.3 runtime dependency.

## Test

```bash
cd research/human-intellect/prototype
node test.mjs
tsc --noEmit
```

The regression command includes deterministic negative authority and numerical tests and valid-state
controls. The current TypeScript configuration checks `types.ts` only; JavaScript
runtime validation is exercised by the regressions, not by that typecheck.

## DOE claim ceiling

The DOE is synthetic. It may rank implementation choices for further testing. It cannot establish architectural truth, human preference, or safety.
