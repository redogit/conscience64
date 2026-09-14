# Research Projects — Highlights, Lowlights, and Remainders

This directory is the compact portfolio and internal project library for Conscience64.

The purpose is not to rank projects by prestige. A **highlight** is a result, mechanism, recovery, or engineering practice worth carrying forward. A **lowlight** is a failure, regression, unsupported leap, broken assumption, missing carrier, or negative result worth preserving because it changed what should happen next.

The machine-readable lineage is deliberately forward-only:

- [`projects.json`](projects.json) is the preserved seven-project registry snapshot already carried by the browser corpus and `Conscience64API`;
- [`CURRENT.json`](CURRENT.json) is the current manifest that composes that snapshot with later human-readable successor records without pretending the compressed browser corpus was regenerated.

The Markdown project records remain the human-readable lineage surface. There are currently **nine** human-readable project records: seven in the preserved registry snapshot plus Hodge Conjecture Research Spine and Research Analytics as explicit successors.

Every project is reflowed through the same small interface:

```text
I — What do we have?
R — What difference matters?
P — What should we do next?
O — What happened?

Checks:
- What are we assuming?
- How do we test it?
- What do we still not know?
```

## Portfolio

| Project | Highlight | Lowlight / failure kept | Current role |
|---|---|---|---|
| [Cross-Carrier Wave](cross-carrier-wave.md) | Provenance-preserving transforms, loss/remainder accounting, extensible carrier overlays | Easy to over-generalize into a universal theory before evidence warrants it | Active architecture / bounded research |
| [Orbit Library](orbit-library.md) | Small active surface with recoverable history, exact-source discipline, cold recovery edges | File-level historical coverage remained sparse; later indexes omitted real predecessor identities | Knowledge/recovery infrastructure |
| [Tiny Babel / TBCL](tiny-babel-tbcl.md) | Finite exhaustive verification and carrier reduction under bounded obligations | Finite results do not establish universal language or retrieval claims | Preserved verified finite result + runtime lineage |
| [Operator Moonshot](operator-moonshot.md) | Stronger evidence discipline, causal ablation work, bounded operator experiments | Cycle 3 failed replication; Education E3 robustness failure; open-problem work must not inherit calibration claims | Research laboratory with explicit claim ceilings |
| [Hodge Conjecture Research Spine](hodge-conjecture.md) | Integrated K3/Kummer/Fermat/fourfold footing plus exact deficit, symmetry, provenance, and counterprobe machinery | Structural resemblance, finite computation, P-vs-NP methods, and 4D geometry do not constitute Hodge proof evidence without an explicit bridge | Active open-problem research with strict claim ceiling |
| [Research Analytics](research-analytics.md) | Shared event contract, safe browser rendering, LLVM event bridge, CI and publication gates | Well-formed transport can still carry weak or false evidence; static/demo state can be mistaken for live authority | Deployed bounded research infrastructure |
| [Model Experiments](model-experiments.md) | Reusable model mechanisms plus useful negative evidence | Regressions, weak reasoning cores, below-chance checkpoints, misleading baselines | Experimental machinery / negative evidence |
| [Geometry / 4D / Codecs](geometry-codecs.md) | Round-trip/integrity discipline and finite observer attacks | Representation can be mistaken for physical truth; finite confounds are not global uniqueness | Preserved technical lineage |
| [Historical Recovery](historical-recovery.md) | Recovered hidden predecessor identities and preserved `UNKNOWN != ABSENT` | Fuzzball carrier still unresolved; some old source packages remain missing/inaccessible | Active source-native archaeology |

### Current-manifest boundary

`Conscience64API.stats().projects.count` remains tied to the preserved seven-project browser registry snapshot. `CURRENT.json` records two later successor records rather than silently changing that API count. The distinction is intentional:

```text
PRESERVED_BROWSER_REGISTRY = 7
FORWARD_ONLY_SUCCESSOR_RECORDS = 2
CURRENT_HUMAN_READABLE_RECORDS = 9
```

### Hodge support surfaces

The Hodge project has explicit support files rather than silently importing other projects:

- [`../hodge/STRUCTURAL_SUPPORTS.md`](../hodge/STRUCTURAL_SUPPORTS.md) — mathematical, computational, symmetry, provenance, and proof-admission footing stack;
- [`../hodge/RESEARCH_INTEGRATION_MAP.md`](../hodge/RESEARCH_INTEGRATION_MAP.md) — role/disposition map for the broader research corpus;
- [`../hodge/CONSCIENCE64_COOPERATION.md`](../hodge/CONSCIENCE64_COOPERATION.md) — I/R/P/O cooperation contract and non-authority boundary for Conscience64.

### Research Analytics support surfaces

Research Analytics likewise keeps implementation and evidence authority separate:

- [`../../analytics/EVENT_SCHEMA.md`](../../analytics/EVENT_SCHEMA.md) — event vocabulary, provenance fields, promotion guards and two-pass audit discipline;
- [`../../analytics/event-contract.mjs`](../../analytics/event-contract.mjs) — executable browser-side validator;
- [`../../analytics/llvm_event_bridge.cpp`](../../analytics/llvm_event_bridge.cpp) — compiled JSON event emitter;
- [`../../.github/workflows/analytics-check.yml`](../../.github/workflows/analytics-check.yml) — build/contract gate for the bridge and event transport.

## Learned invariants

The preserved executable registry carries its original list; `CURRENT.json` adds later distinctions without rewriting that predecessor. Important current invariants include:

```text
UNKNOWN != ABSENT
UNASSIGNED != ABSENT
RELATED != SUPPORTS
SEMANTIC_SIMILARITY != IDENTITY
SOURCE != RECONSTRUCTION
BYTE_IDENTITY != SEMANTIC_TRUTH
CURRENT_NAVIGATION != HISTORICAL_SOURCE
MECHANISM_ACTIVE != MECHANISM_USEFUL
MECHANISM_USEFUL != MECHANISM_CAUSAL
CALIBRATION_RESULT != OPEN_PROBLEM_RESULT
FINITE_VERIFICATION != UNIVERSALITY
REPRESENTATION_CORRECTNESS != PHYSICAL_TRUTH
LOSS_ACKNOWLEDGED != LOSS_CONCEALED
OBSERVATION != INTERPRETATION
REPETITION != VERIFICATION
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
DEMO_DATA != RESEARCH_EVIDENCE
STATIC_VIEW != AUTHORITATIVE_LEDGER
```

Hodge-specific additions carried by the human-readable support stack are:

```text
SAME_HODGE_DIAMOND != SAME_ALGEBRAIC_CYCLE_STRUCTURE
SYMMETRY != USEFUL_QUOTIENT
CYCLE_COUNT != CYCLE_CLASS_RANK
COMPLEX_(p,p) != RATIONAL_HODGE_CLASS
CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE
```

## Reading rule

Do not promote a highlight without its boundary, and do not erase a lowlight after a later success.

The portfolio is forward-only:

```text
source state
→ experiment / transform
→ observation
→ consequence
→ evidence-qualified result
→ unresolved remainder
→ next bounded state
```

A project may move from unresolved to recovered, failed to repaired, or experimental to supported. The earlier state remains part of its lineage.

Historical snapshots and verified research checkpoints are not rewritten merely to make them conform to newer lessons. New knowledge is applied through successors, current manifests, API behavior, verification, and append-only lineage.
