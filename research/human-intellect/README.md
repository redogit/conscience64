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

## WebAssembly / WASI

The prototype uses a tiny core WebAssembly module as a capability probe. The WIT file defines the future component boundary. The current Component Model guide still names WASI 0.2.0 as stable; wasi.dev also documents the 0.3 milestone and its native async evolution. This slice does not pretend it has a 0.3 runtime dependency.

## Test

```bash
cd research/human-intellect/prototype
node test.mjs
tsc --noEmit
```

## DOE claim ceiling

The DOE is synthetic. It may rank implementation choices for further testing. It cannot establish architectural truth, human preference, or safety.
