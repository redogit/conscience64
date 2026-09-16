# Conscience64 Image Society — 1000-Call Operational Runbook

## Purpose

This runbook governs a bounded Image Society run with an upper bound of 1000 logical model/provider calls. It is designed for generation, critique, repair, comparison, continuity review, accessibility review, authority review, and summarization while preserving provenance and the Conscience64 authority boundaries.

`1000` is a ceiling, not a spending target. Stop early when the declared objective is met, budget is exhausted, quality stops improving, or unresolved risk requires human review.

## 1. Preconditions

Before admitting call 1, the Director must have:

- a Run Manifest with explicit hard bounds;
- one or more approved Image Intents;
- authoritative source references, if any;
- applicable Reality Canon classification;
- continuity packs, if any;
- provider/renderer identity and admission state;
- known privacy/access-control classification;
- token/cost/storage budgets;
- stop conditions;
- promotion mode, normally `manual`;
- latest checkpoint if resuming;
- an empty or recovered append-only ledger.

Hard stop if any required source is ambiguous enough that generation would misrepresent world authority, a real person, scientific observation, or private material.

## 2. Default Manifest for a 1000-Call Run

Recommended starting envelope:

```json
{
  "schema": "conscience64/image-society/run-manifest/v1",
  "run_id": "image-society-pilot-1000",
  "max_calls": 1000,
  "max_parallelism": 8,
  "max_retries_per_call": 2,
  "checkpoint_every_events": 25,
  "summary_every_events": 10,
  "max_branches": 32,
  "promotion_mode": "manual",
  "authority_mode": "strict",
  "accessibility_mode": "enabled",
  "budgets": {
    "token_in_max": 2000000,
    "token_out_max": 1500000,
    "cost_currency": "USD",
    "cost_max": 500
  }
}
```

These values are defaults for planning only. A provider/runtime may require a lower concurrency or budget.

## 3. Call Accounting

A **logical call** is one admitted model/provider operation, such as one generation, edit, critique, or comparison request.

Retries do not increase `logical_call_count`; they increase `attempt_count` for that call.

For every logical call record:

- logical call number;
- event ID;
- role;
- provider/model;
- request digest;
- input artifact IDs;
- attempt count;
- terminal status;
- output artifact IDs;
- token/cost data where available;
- latency/resource data where available.

The run is invalid if completed logical calls cannot be reconciled with terminal event records.

## 4. Concurrency Policy

Default `max_parallelism = 8`.

Increase only after evidence shows:

- provider rate limits are respected;
- ledger ordering remains correct;
- terminal events cannot be lost;
- artifact IDs cannot collide;
- checkpoint projection remains stable;
- cost telemetry remains attributable.

For first real-provider runs, prefer 4–8 parallel calls rather than 32+.

## 5. Retry Policy

Default: two retries after the initial attempt.

Retry only for explicitly transient classes such as:

- provider transport failure;
- rate-limit response with allowed retry;
- temporary service unavailability;
- transient toolchain failure.

Do not automatically retry:

- invalid input;
- content/policy refusal;
- authority gate failure;
- malformed scene specification;
- deterministic provenance failure;
- human stop/cancel.

After exhaustion, emit `retry-exhausted` with all attempt metadata. Never drop the failed call.

## 6. Recommended Wave Allocation

The following allocation totals 1000 logical calls. It is a planning envelope, not a requirement to consume every call.

| Wave | Calls | Primary purpose |
|---|---:|---|
| 0 — Initialization / calibration | 1–30 | transport, references, scene specs, calibration |
| 1 — Wide exploration | 31–180 | diverse candidate discovery |
| 2 — Cluster refinement | 181–350 | narrow and refine promising directions |
| 3 — Targeted repair | 351–550 | repair defects while preserving stable traits |
| 4 — Continuity / authority hardening | 551–700 | world, character, science/reality boundary review |
| 5 — Accessibility / usability | 701–800 | readability, hierarchy, descriptive metadata readiness |
| 6 — Finalist comparison | 801–900 | pairwise/set comparisons and branch consolidation |
| 7 — Final repair / promotion prep | 901–960 | last bounded corrections and packaging |
| 8 — Regression / closure | 961–1000 | replay defects, final checkpoint, summaries |

Unused allocation returns to the budget; it is not automatically reassigned.

## 7. Wave 0 — Initialization and Calibration (1–30)

### Objectives

- prove provider/renderer transport works;
- prove provenance capture works;
- validate intent and source boundaries;
- establish initial continuity and Reality Canon classifications;
- build small calibration candidates before wide exploration.

### Suggested call mix

- 4 Director/Scene Builder calls;
- 8 generation calls;
- 6 semantic/composition critique calls;
- 4 continuity/authority calls;
- 4 accessibility/provenance calls;
- 4 correction/comparison calls.

### Exit criteria

- provider identity recorded;
- no secret in ledger/request persistence;
- at least one end-to-end artifact lineage reconstructs correctly;
- one checkpoint can be produced and replayed;
- no authority ambiguity blocks further work.

If these fail, stop. Do not spend calls on exploration until the control surface works.

## 8. Wave 1 — Wide Exploration (31–180)

### Objectives

Explore meaningful visual diversity without conflating diversity with correctness.

Vary intentionally:

- framing;
- focal length / perspective;
- time/weather/lighting interpretation where allowed;
- material treatment;
- ordinary-vs-anomaly emphasis;
- composition;
- renderer/provider when the run permits comparison.

### Rules

- branch materially different directions;
- preserve common intent ID;
- do not rewrite the scene intent merely because a candidate looks attractive;
- do not promote from this wave;
- critique enough candidates to learn failure structure, not just winners.

### Exit criteria

- candidate clusters identified;
- major failure categories recorded;
- redundant or dominated branches archived;
- top directions are represented by stable artifact IDs.

## 9. Wave 2 — Cluster Refinement (181–350)

### Objectives

Convert broad visual directions into bounded candidate families.

For each surviving cluster:

1. identify best current artifact;
2. identify top three defects;
3. identify protected properties;
4. construct Visual Difference Contracts;
5. run targeted generation/edit comparisons;
6. retain both successful and failed repair evidence.

### Stop conditions per cluster

Stop a cluster when:

- it is dominated on intended-use criteria;
- repeated repairs oscillate between the same defects;
- authority mismatch cannot be repaired without changing intent;
- cost exceeds declared cluster budget;
- human rejects the direction.

## 10. Wave 3 — Targeted Repair (351–550)

This is the main one-degree-experiment wave.

### Default repair cycle

```text
before artifact
  -> defect observation
  -> correction proposal
  -> protected invariants
  -> one targeted edit/regeneration
  -> after artifact
  -> intended delta observation
  -> unintended delta observation
  -> keep / revert / branch
```

### Example protected invariants

- preserve face identity while correcting hands;
- preserve camera and environment while changing signage readability;
- preserve material palette while correcting light direction;
- preserve ordinary-world grounding while adjusting anomaly prominence.

### Failure handling

If a repair fixes the target defect but breaks a more important protected invariant, classify the repair as unsuccessful for that branch even if its aesthetic score increases.

## 11. Wave 4 — Continuity and Authority Hardening (551–700)

### Continuity review

Check:

- recurring character protected traits;
- costume/equipment continuity;
- environment/material grammar;
- signs/symbols;
- recurring object proportions;
- previously approved style rules.

### Authority review

For MMO/game art, answer:

1. what ordinary place/activity anchors the scene?
2. what physical/material/light cues make it believable?
3. what is anomalous?
4. is the observed/process/reconstruction/fantasy boundary clear?

Flag:

- generated people presented as real identifiable people;
- reconstruction presented as a photograph or measurement;
- processed science imagery presented as unaided-eye appearance;
- invented world details presented as source facts;
- fictional real-world location/weather/time implication.

### Exit criteria

Every finalist has an explicit authority review record. Unsupported claims are repaired, relabeled, rejected, or left unresolved.

## 12. Wave 5 — Accessibility and Usability (701–800)

### Review dimensions

- on-image text readability;
- contrast;
- information hierarchy;
- reliance on color alone;
- clutter/cognitive load;
- important region distinguishability;
- alt-text readiness;
- long-description readiness.

### Artifact accessibility package

For accepted candidates, record:

- concise alt text;
- long/structured description;
- text transcription;
- regions of interest;
- known limitations;
- any context needed to avoid misleading interpretation.

An image may remain accepted for concept/reference use while failing production accessibility requirements. Preserve intended-use classification.

## 13. Wave 6 — Finalist Comparison (801–900)

Use pairwise or bounded-set comparison, never a universal truth score.

Compare independently on:

- intent fidelity;
- composition;
- physical/material credibility;
- continuity;
- accessibility;
- authority consistency;
- repair stability;
- cost/latency;
- intended-use fit.

### Decision rule

Do not average incomparable dimensions blindly. A candidate with a critical authority failure cannot compensate through aesthetic quality.

Output:

- ranked candidate set per intended use;
- unresolved tradeoffs;
- branches to archive;
- candidates eligible for final repair.

## 14. Wave 7 — Final Repair and Promotion Preparation (901–960)

Only repair defects whose expected value exceeds regression risk.

For each candidate considered for promotion, require:

- complete provenance;
- continuity review status;
- accessibility review status where applicable;
- authority review status;
- no unresolved critical defect;
- clear Reality Canon classification;
- intended-use statement;
- explicit human promotion decision later.

No model role may mark `promoted-canonical` on its own.

## 15. Wave 8 — Regression and Closure (961–1000)

### Objectives

- replay representative prior defect classes;
- verify fixed problems remain fixed;
- reconcile call/budget accounting;
- produce final checkpoint;
- produce restart-ready compact state;
- generate run report.

### Required closure evidence

- logical calls = terminal call records;
- retry attempts reconciled;
- final candidate/artifact IDs listed;
- rejected/archived branches retained;
- final checkpoint digest recorded;
- active context bounded;
- Regression Corpus updated;
- promotion decisions separated from recommendations;
- unresolved issues explicit.

## 16. Checkpoint Procedure

At each checkpoint interval:

1. freeze the current logical event range;
2. verify every admitted call has a terminal event;
3. project candidate/rejected/accepted states;
4. capture continuity pack versions;
5. capture unresolved defects;
6. capture authority/accessibility notes;
7. capture budget consumption;
8. build canonical semantic checkpoint payload;
9. SHA-256 the canonical payload;
10. persist timestamp as envelope metadata, not inside semantic identity when reproducibility requires a stable digest;
11. emit compact active context referencing source event IDs.

## 17. Resume Procedure

To resume:

1. load Run Manifest and verify it matches or explicitly supersedes the previous manifest;
2. load full preserved ledger through the checkpoint boundary;
3. recompute checkpoint semantic digest;
4. compare with stored digest;
5. load artifact registry and verify referenced artifact identities;
6. rebuild active context from checkpoint;
7. identify terminal calls after checkpoint, if any;
8. replay only missing admitted work;
9. never duplicate a completed logical call merely because its UI response was lost;
10. emit a `resume` planning record or equivalent plan event before new provider calls.

If digest verification fails, stop and investigate instead of silently continuing.

## 18. Branching Procedure

Branch when two interventions cannot both preserve the same intended comparison.

Examples:

- photoreal vs stylized interpretation;
- ordinary-grounding emphasis vs anomaly emphasis;
- two different character costume treatments;
- two repair strategies with incompatible protected invariants.

Each branch has:

- branch ID;
- parent event ID;
- reason;
- inherited intent ID;
- inherited continuity version;
- declared divergence.

Do not exceed `max_branches`.

## 19. Merge / Consolidation Procedure

Image branches are not source-control merges. Consolidation creates a new successor candidate that explicitly references multiple predecessors.

Record:

- parent artifact IDs;
- what was retained from each;
- what was discarded;
- whether the operation is an edit, regeneration, compositing step, or planning synthesis;
- new provenance.

Never rewrite predecessors to imply they already contained the consolidated result.

## 20. Cost and Token Controls

Before each batch, compute remaining:

- logical calls;
- retries;
- input tokens;
- output tokens;
- currency budget;
- storage budget if applicable.

Director must shorten or stop the batch before crossing a hard bound.

### Efficiency metrics

Track by role and intervention type:

- accepted candidates per call;
- major defects resolved per call;
- regressions introduced per repair;
- cost per accepted improvement;
- latency distribution;
- refusal/failure rate;
- duplicate/redundant candidate rate.

These metrics optimize future runs but do not establish image truth or world authority.

## 21. Provider Drift

If model/provider version changes during a run:

1. record new provider/model identity;
2. close the current comparison stratum;
3. start a new stratum or branch;
4. do not compare byte identity across the change unless evidence supports it;
5. flag checkpoint summaries with the boundary.

A silent provider change invalidates unsupported reproducibility claims.

## 22. Policy / Refusal Events

A provider refusal is evidence about the attempted request/provider combination.

Do not:

- hide the refusal;
- repeatedly paraphrase until policy is bypassed;
- classify refusal as provider outage;
- silently change user intent.

When a safe/compliant alternative exists, create a new explicitly reasoned branch with preserved predecessor/refusal evidence.

## 23. Human Review Gates

Human review is required before canonical visual promotion.

Human reviewer sees:

- intended use;
- candidate image/artifact;
- lineage;
- latest Visual Difference Contract;
- continuity status;
- accessibility status;
- authority status;
- unresolved issues;
- provider/renderer identity;
- cost summary;
- recommendation.

Human decision is one of:

- promote;
- accept noncanonical;
- revise;
- reject;
- leave unresolved.

## 24. Incident Classes

### A. Lost terminal event

Stop new calls, reconcile provider-call log against ledger, reconstruct only from trustworthy evidence, and record the incident.

### B. Artifact/hash mismatch

Quarantine the artifact reference; do not promote; verify storage/transport integrity.

### C. Checkpoint digest mismatch

Stop resume; reconstruct from prior valid checkpoint and ledger.

### D. Cost runaway

Stop admitting new logical calls before hard budget breach. Preserve current events/checkpoint.

### E. Concurrency ordering bug

Reduce parallelism to 1, reproduce with mock provider, repair ledger sequencing before resuming real calls.

### F. Authority leakage

Quarantine affected candidates, identify the first event that introduced unsupported authority, repair or reject descendants, and re-run authority review.

### G. Accessibility regression

Do not discard aesthetically useful artifact evidence. Downgrade intended-use suitability and run a targeted accessibility repair branch if warranted.

## 25. Mock 1000-Call Qualification Run

Before spending real provider calls, run:

```bash
node tools/run-image-society.mjs --mock --calls 1000 --parallelism 16
```

Qualification requires:

- exactly 1000 logical calls or an explicitly triggered early stop;
- zero missing terminal records;
- bounded parallelism;
- stable deterministic mock checkpoint digest across two runs;
- failures injected by the mock remain visible;
- active context remains bounded;
- no promotion without human gate evidence.

This proves orchestration structure only. It is not evidence that a real image provider will behave identically.

## 26. First Real-Provider Qualification

Do **not** jump directly from mock 1000 to real 1000.

Recommended progression:

```text
8 calls -> 32 calls -> 100 calls -> 250 calls -> 1000-call ceiling
```

At each step review:

- failure/refusal rate;
- latency;
- rate limits;
- cost accuracy;
- provenance completeness;
- artifact storage behavior;
- checkpoint/resume;
- provider drift;
- meaningful quality yield.

Promotion to the next scale is evidence-based.

## 27. Completion Report

A final run report must separate:

### Executed evidence

What actually ran, with counts and hashes.

### Negative results

Failures, regressions, rejected branches, unproductive strategies.

### Learned distinctions

New continuity rules, recurring defect classes, useful correction strategies.

### Interpretation errors

Cases where a model or reviewer inferred more than the image/evidence supported.

### Boundary changes

Any explicit change in provider, model, manifest, continuity pack, budget, or intended use.

### Unresolved questions

Anything not established by the run.

### Hypotheses / next experiments

Future work clearly labeled as not yet executed.

## 28. Stop Conditions

Stop the run immediately when any hard condition occurs:

- `logical_call_count == max_calls`;
- token/cost/storage hard budget would be exceeded by next admitted call;
- human cancel;
- authority or privacy boundary cannot be preserved;
- checkpoint/ledger integrity cannot be verified;
- provider identity becomes unknown;
- repeated failure exceeds declared threshold.

Stop a branch when marginal value becomes lower than regression/cost risk.

Stopping early is successful control behavior, not failure to use the allocation.
