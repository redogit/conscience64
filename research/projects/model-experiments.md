# Project — Model Experiments

Status: `EXPERIMENTAL_MACHINERY + NEGATIVE_EVIDENCE`

## I — What do we have?

A broad family of model experiments including PulseNet, PulseNet GP, SPDM, streaming-memory cores, stabilized/isometric recurrent cores, Micro-Ouro, compressed-domain computation, adaptive-depth/retrieval experiments, and related numerical prototypes.

## R — What difference matters?

The important distinction is:

```text
mechanism is active
!=
mechanism is useful
!=
mechanism caused the improvement
```

Sensitivity, parameter movement, or output change is not enough. Baselines, ablations, held-out tests, and negative controls decide whether the mechanism earned a stronger interpretation.

## P — What should we do next?

1. Preserve runnable baselines beside proposed mechanisms.
2. Require ablations that can remove the alleged causal component.
3. Compare against trivial and finite-state baselines before claiming reasoning or memory gains.
4. Track numerical stability separately from predictive quality.
5. Treat regressions as project outputs, not cleanup noise.
6. Reuse mechanisms only after the obligation they actually satisfy is stated explicitly.

## O — What happened?

### Highlights

- PulseNet produced early positive bounded runs such as XOR/spiral behavior that motivated further operator and perturbation work.
- PulseNet GP introduced structural and curvature-oriented experiments with explicit deletions and trust controls.
- Streaming-memory work produced reusable compressed-state, gating, decay, and retrieval machinery.
- Micro-Ouro became useful as a deterministic quantization/export and kernel-regression fixture even though its predictive checkpoint was poor.
- Numerical experiments increasingly separated execution correctness from task usefulness.

### Lowlights / preserved corrections

- PulseNet rewrites regressed relative to earlier behavior; later code could not simply inherit earlier positive claims.
- SPDM exposed a baseline error and its reasoning core failed to earn the stronger intended interpretation.
- Micro-Ouro's deterministic checkpoint performed below chance on aggregate next-token prediction despite having functioning internal mechanisms.
- Some retrieval, branch, and summary-memory mechanisms changed outputs without demonstrating learned usefulness.
- Large architectural complexity sometimes arrived before a minimal necessity test had earned it.

## Checks

**What are we assuming?** That the chosen benchmark distinguishes the proposed mechanism from simpler alternatives.

**How do we test it?** Freeze data and baselines, ablate one mechanism, rerun across seeds, measure held-out performance and stability, and preserve counterexamples.

**What do we still not know?** Which components remain valuable after training, scale changes, native implementation, different domains, and stronger baselines.

## Claim ceiling

These projects establish bounded implementation and experiment evidence. They do not establish general intelligence, general reasoning, or universal memory architecture.
