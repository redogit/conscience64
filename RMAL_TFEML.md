# RMAL-TFEML — Trace-First Execution Memory Layer

**Status:** accepted local RMAL/RMALKDVMLLL authority note  
**Date:** 2026-09-20  
**Claim ceiling:** architecture and method specification only; not empirical validation, not proof, and not automatic promotion of any produced artifact.

RMAL-TFEML is the **RMAL Trace-First Execution Memory Layer**. It defines how RMAL records programs, transformations, carriers, semantic rotations, solver moves, VM transitions, and obligation-resolution attempts as execution spaces whose traces are first-class memory/provenance objects.

## Core rule

```text
Make execution remember.
Make outputs point back.
Make explanations render.
Make counterfactuals compare.
Make residuals drive repair.
```

The central inversion is:

```text
Do not make the artifact carry primary memory.
Make execution carry recoverable provenance.
Let the artifact point back to the trace that produced it.
```

## Object hierarchy

```text
RMAL ExecutionSpace
→ RMAL ChainRun
→ RMAL ExecutionTrace
→ RMAL TraceStep
→ RMAL Outcome
→ RMAL TraceQuery / TraceExplainer
→ RMAL ProvenanceGraph
→ RMAL CounterfactualQuery
→ RMAL Residual / Remainder
```

### RMAL ExecutionSpace

Declares the possible operators, routes, constraints, transformations, obligations, surfaces, and admissible moves for a chosen problem.

### RMAL ChainRun

Materializes one explored execution set for a chosen problem, context, and surface.

### RMAL ExecutionTrace

Stores the ordered first-class memory/provenance for one explored path. The trace is the primary knowledge object.

### RMAL TraceStep

Records one local operator application, carrier transport, semantic rotation, constraint move, link traversal, solver step, or VM transition.

A useful minimum step shape is:

```text
TraceStep:
  address
  parent_address
  operator_or_move
  input_surface
  output_surface
  local_context
  accumulated_context
  local_metadata
  accumulated_metadata
  constraints
  weights_or_probabilities_when_applicable
  declared_invariants
  invariant_check_result
  residual
```

### RMAL Outcome

Stores the terminal artifact/evidence plus identity plus trace pointer.

An outcome is not the source of truth. It is the produced artifact with a recoverable path back to the execution that produced it.

### RMAL TraceQuery / TraceExplainer

Projects trace memory into human-readable descriptions, machine-checkable summaries, accessibility surfaces, debugging views, or audit views.

Descriptions are renderings only. They are not the source of truth.

### RMAL ProvenanceGraph

Relates traces side-to-side:

```text
shared prefixes
divergent branches
equivalent rotations
failed mutations
semantic decay
rejected paths
derivation relations
```

### RMAL CounterfactualQuery

Compares neighboring traces, altered constraints, changed weights, rejected branches, alternate operators, changed activation conditions, and carrier variants.

### RMAL Residual / Remainder

Captures unresolved ambiguity, failed invariants, missing metadata, counterexamples, loss, semantic decay, and next one-degree probes.

## Execution lifecycle

```text
Input / Surface / Obligation
→ ExecutionSpace
→ operator / carrier / rotation choices
→ TraceSteps
→ ExecutionTrace
→ Outcome
→ invariant check
→ ProvenanceGraph update
→ Counterfactual comparison
→ Residual / Remainder
→ one-degree repair probe
→ rerun
```

## Invariant lock

```text
Object identity is invariant.
Coordinates are negotiable.
```

A valid RMAL carrier or semantic rotation must perform:

```text
Resolve identity
→ encode for target Surface
→ transport
→ decode / reconstruct
→ compare declared invariants
→ record provenance and residual
```

If reconstruction fails declared invariants, classify the event as mutation or semantic decay, not as a valid rotation. Preserve the failure trace.

## Operational restrictions

```text
No artifact without trace.
No trace without steps.
No step without local metadata.
No explanation without provenance.
No rotation without invariant comparison.
No failure without residual.
No improvement without a one-degree counterprobe.
```

## Knowledge boundary

RMAL-TFEML supports knowledge-decay resistance, but it does not itself validate claims.

```text
TRACE_EXISTS != CLAIM_PROVEN
EXPLANATION_EXISTS != VALIDATION
COUNTERFACTUAL_EXISTS != INDEPENDENT_EVIDENCE
RESIDUAL_RECORDED != RESIDUAL_RESOLVED
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
```

A trace can make an artifact inspectable, reconstructible, comparable, and repairable. Independent validation remains a separate gate.

## Local authority summary

```text
Execution first.
Trace as memory.
Outcome as evidence.
Explanation as projection.
Counterfactual as comparison.
Residual as repair fuel.
```

RMAL remembers by tracing what became.
