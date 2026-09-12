# Project — Geometry, 4D Codecs, and Observer Experiments

Status: `PRESERVED_TECHNICAL_LINEAGE`

## I — What do we have?

A technical lineage spanning 3D/4D geometry, ring/topology experiments, coordinate transforms, inversion, observer/classification probes, compact binary representations, and later float64 carrier work.

Historical mechanisms include inward/outward sweeps, coupled rings/networks, inversion-style transforms, point-at-infinity handling, compact record layouts, and later finite observer/classification experiments.

## R — What difference matters?

The important distinction is:

```text
useful geometric representation
!=
physical truth
```

A coordinate transform, codec, topology, or finite classifier can be internally correct and still fail as evidence for a claim about nature.

## P — What should we do next?

1. Keep encoding correctness separate from geometric/physical interpretation.
2. Test invertibility, round-trip behavior, numerical stability, and corruption handling independently.
3. Preserve nullspace/inversion counterevidence rather than selecting only suggestive geometry.
4. Use finite observer experiments to establish only finite distinguishability claims.
5. Treat float64/raw-bit carriers as transport atoms, not as whole semantic objects.

## O — What happened?

### Highlights

- Compact binary/coordinate experiments produced reusable engineering ideas around transport, inversion, topology, and integrity checks.
- Later observer work introduced explicit finite confound families and reverse/ablation attacks rather than visual interpretation alone.
- The project learned to distinguish raw IEEE-754 bit transport from ordinary numeric float semantics.
- Geometry became useful as a representation/test domain without requiring that every pattern be promoted into physics.

### Lowlights / preserved corrections

- Early visual or geometric resemblance could invite stronger physical interpretation than the evidence supported.
- Finite discrimination against a chosen confound family does not prove unique global geometry.
- Nullspace/inversion counterevidence showed that some apparent distinctions disappear under broader transformations.
- A fixed-dimensional coordinate story was too rigid for the later cross-carrier problem and was replaced by adaptive carrier selection.

## Checks

**What are we assuming?** That the encoding/transform specification is explicit enough for independent round-trip and adversarial testing.

**How do we test it?** Exact encode/decode checks, perturbations, inverse transforms, finite confound enumeration, leave-one-observable-out attacks, and integrity verification.

**What do we still not know?** Which geometric mechanisms are merely convenient representations and which, if any, correspond to deeper physical structure.

## Claim ceiling

This lineage supports engineering and bounded mathematical experiments. It does not establish a new physical theory or observational result about spacetime.
