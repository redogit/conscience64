# Conscience64 Fitting Lab + Public Visibility Mesh Design

## Purpose

Add a reusable, provenance-preserving **Fitting Lab** to Conscience64 and make every safely admitted public result maximally discoverable through multiple independent public surfaces.

The design has two coupled goals:

1. turn the current confound-first / semantic-rotation / bidirectional-repair method into a reusable research subsystem; and
2. make admitted public material easier for humans, search engines, machines, researchers, and other repositories to find without weakening privacy, evidence, or authority boundaries.

The governing rule is:

```text
PUBLIC_BY_ADMISSION != PUBLIC_BY_ACCIDENT
```

A research record becomes broadly visible only after explicit public classification. Once admitted, the system should expose it through as many safe, reconstructible public channels as practical.

## Existing boundaries preserved

This design does not change the authority of the research registry, analytics ledger, Hodge claim ceiling, Knowledge Bridge, game/world authority, or recovery carrier model.

The following remain non-negotiable:

```text
FIT != TRUTH
PUBLICATION != VALIDATION
DISCOVERABLE != CORROBORATED
RETRIEVED != INDEPENDENT_EVIDENCE
RELATED != SUPPORTS
SEMANTIC_SIMILARITY != IDENTITY
OBSERVATION != INTERPRETATION
IMPLEMENTED != VERIFIED
PRIVATE != PUBLIC
UNKNOWN != ABSENT
TRANSFORM != SOURCE
```

The existing public-update system remains fail-closed: private or unclassified research records are not read merely to decide whether to expose them.

## Part I — Fitting Lab

### Core object

A fitting run is represented as:

```text
FIT = (
  Subject,
  Declarations,
  Observers,
  Rotations,
  Invariants,
  Confounds,
  Repairs,
  Closures,
  Variants,
  Tests,
  Remainder,
  ClaimCeiling,
  Provenance
)
```

Each field is explicit and serializable. No field is inferred to be evidence merely because another field exists.

### Governing loop

```text
observe all
-> rotate representations
-> enumerate primary confounds
-> confound the confounds
-> repair downward to smaller invariants
-> repair upward to supported consequences
-> repair sideways across carriers/families/representations
-> saturate justified closure
-> generate variants
-> adversarially test variants
-> preserve remainder
-> if and only if fixed point is reached, permit one-degree mutation
```

The loop is recursive. A repair may create a new confound; a confound may reveal a new invariant; a semantic rotation may expose information loss.

### Semantic rotation rule

A semantic rotation changes the view while preserving the intended underlying object.

```text
SEMANTIC_ROTATION != SEMANTIC_MUTATION
```

For any significant object, the Lab may rotate among:

- human-language description;
- operational procedure;
- structural model;
- formal/mathematical representation;
- executable representation;
- evidence representation;
- adversarial representation;
- corrective representation.

After rotation, reconstruction must identify:

```text
PRESERVED
TRANSFORMED
SPLIT
MERGED
INTRODUCED
LOST
UNRESOLVED
```

Consequential loss is carried explicitly as remainder.

### Observer model

The default observer set is not a claim about physical dimensionality. It is a research scaffold.

The first standard five observers are:

1. **Geometry / object** — what concrete object, carrier, support, or structure exists?
2. **Evidence / observation** — what was actually measured, sourced, computed, or witnessed?
3. **Structure / relation** — what invariant relations survive representation changes?
4. **Change / deformation** — what changes under time, perturbation, specialization, basis, carrier, or family change?
5. **Adversarial / confound** — what alternative explanation, hidden assumption, boundary case, or false bridge can break the current interpretation?

Domains may add observers. Added observers must state the distinction they preserve.

### Confounds

A confound is a typed object:

```text
Confound = (
  id,
  source_scope,
  target_scope,
  distinction_at_risk,
  failure_mode,
  counterexample_or_test,
  repair_down,
  repair_up,
  repair_sideways,
  status,
  provenance
)
```

Primary confounds are `C0`.

Confounds of confounds are generated only when interaction changes the normalized outcome:

```text
normalize(c_i(c_j(S))) != normalize(c_j(c_i(S)))
```

Such non-commuting interactions become explicit higher-order confound records rather than being summarized away.

### Repair directions

**Downward repair** reduces a dispute to the smallest invariant object still supported.

**Upward repair** reconstructs justified consequences from that invariant and checks whether the original views return.

**Sideways repair** transports the object to another carrier, implementation, basis, family, language, or representation and records what survives.

**Historical repair** reconstructs an earlier state from lineage rather than rewriting history to match the current model.

A repair never upgrades evidence status by itself.

### Closure

Closure is deductive and provenance-preserving, not merely textual expansion.

Each derived item records:

```text
claim
parents
rule
assumptions
representation/view
status
provenance
```

Contradictory branches remain separate. They do not enter an unrestricted explosion-prone global closure.

```text
P [lineage A]
NOT_P [lineage B]
-> CONFLICT(P)
```

The conflict becomes a research object.

### Fitting variants

All variants share one schema and differ only in declared operators and success criteria.

- **FIT-00 Invariant Fit** — identify what survives semantic rotations.
- **FIT-01 Multi-Eye Fit** — compare independent observer outputs.
- **FIT-02 Confound Fit** — enumerate first-order confounds before repair.
- **FIT-03 Recursive Confound Fit** — compose confounds and detect interaction effects.
- **FIT-04 Downward Repair** — reduce to the smallest supported invariant.
- **FIT-05 Upward Repair** — reconstruct supported consequences.
- **FIT-06 Sideways Repair** — transport across carriers/families/representations.
- **FIT-07 Closure Fit** — saturate justified corollaries with lineage.
- **FIT-08 Counter-Fit** — generate near-matches that should fail.
- **FIT-09 One-Degree Escape** — change exactly one consequential degree after closure stalls.
- **FIT-10 Population Fit** — run multiple variants in parallel without premature winner selection.
- **FIT-11 Historical Fit** — reconstruct prior states and detect retrospective rewriting.
- **FIT-12 Executable Fit** — test whether a methodology is sufficiently specified to implement without inventing parameters.
- **FIT-13 Human Fit** — preserve lived meaning beside procedural/mechanical representation.
- **FIT-14 Adversarial Fit** — reverse operations, reorder transforms, attack boundaries and assumptions.
- **FIT-15 Minimal Sufficient Fit** — find the smallest distinction set that reconstructs the supported state.

Variants are composable, but their outputs remain individually attributable.

### Claim status

Every fitting output uses one of these statuses:

```text
OBSERVED
SOURCE_VERIFIED
FORMAL_CONSEQUENCE
COMPUTATIONALLY_VERIFIED_BOUNDED
HYPOTHESIS
CANDIDATE
NEGATIVE_RESULT
CONTRADICTION
UNRESOLVED
REJECTED
```

A fitting engine may recommend a stronger status but may not promote it without the destination domain's normal admission process.

## Part II — Public Visibility Mesh

### Principle

Once a research object is explicitly admitted as public, publish one canonical public record and derive multiple discoverability surfaces from that record.

```text
ONE_ADMITTED_PUBLIC_RECORD
-> MANY_PUBLIC_PROJECTIONS
```

The projections are views, not new evidence and not independent sources.

Already-public non-research site content may be linked by navigation/discovery surfaces under its existing publication gate, but it is not silently converted into a research record or included in research feeds without explicit research admission.

### Admission boundary

The current `research/projects/public-updates/` admission mechanism remains the canonical research-publication gate.

Requirements:

- default deny;
- unknown classification is failure;
- private records are excluded before content read;
- no client-side public/private filtering;
- generated research projections consume only explicitly admitted public research records;
- ordinary already-public site pages may be indexed or linked only as site resources under their existing gates, not represented as admitted research unless separately admitted;
- every generated projection records source identity and generation provenance.

### Visibility surfaces

#### 1. Human public pages

Expose admitted research through readable project/update pages with:

- concise summaries;
- status/claim ceiling;
- source paths;
- correction/revision lineage;
- related public records;
- machine-readable identifiers.

Fitting Lab results should have a public human-readable view only when the underlying fit record is explicitly admitted as public.

#### 2. Search-engine discovery

Add deterministic:

- `robots.txt`;
- `sitemap.xml`;
- canonical URL metadata;
- stronger title/description metadata;
- Open Graph metadata;
- structured JSON-LD for public research/project/update pages where semantically appropriate.

Sitemap generation must enumerate only known public URLs. Site URLs and admitted research URLs remain distinguishable in generation metadata.

#### 3. Syndication feeds

Generate public-only research feeds:

- Atom feed;
- RSS feed only if it can share the same canonical builder without duplicated admission logic;
- JSON Feed;
- existing deterministic `latest.json` snapshot.

All research feed formats derive from the same admitted public record set.

#### 4. Machine discovery manifest

Add a public manifest such as:

```text
/.well-known/conscience64.json
```

or an equivalent stable root path if GitHub Pages handling makes `.well-known` impractical.

It describes only public endpoints and schemas, including:

- project index;
- public-update JSON;
- public research feeds;
- research analytics static surface;
- Fitting Lab public schema/documentation;
- API documentation;
- repository URL;
- source revision where available.

It explicitly states that retrieval/publication is not independent evidence.

#### 5. Public research index

Use the existing `research/projects/index.html` as the stable current human landing page rather than creating a competing research index.

Enhance it to navigate:

```text
PRESERVED_BROWSER_REGISTRY
CURRENT_FORWARD_ONLY_RECORDS
PUBLIC_UPDATE_FEED
PUBLIC_FITTING_RECORDS
```

Historical browser registries are linked, not rewritten.

#### 6. Federation

Extend the existing federation bridge so explicitly admitted Fitting Lab and public-update surfaces may be navigated from the current redogit federation without becoming research authority.

```text
FEDERATED != MERGED
FEDERATION_POINTER != RESEARCH_ADMISSION
```

#### 7. Repository discoverability

Where repository administration supports it, configure:

- repository homepage to the stable public site;
- descriptive repository summary aligned with actual current purpose;
- GitHub topics such as research, provenance, knowledge-graph, accessibility, hodge-conjecture, experimental-research, static-site as appropriate;
- Discussions only if moderation and purpose are explicitly established;
- license metadata only where a repository-wide license is actually intended; existing scoped licenses must not be silently widened.

Some repository settings require GitHub UI/admin actions rather than code changes. They are recorded as administrative actions, not silently assumed complete.

The current repository metadata has no homepage, no topics, no repository-wide license metadata, and Discussions disabled; implementation must treat those as observed configuration, not as permission to change licensing or moderation policy automatically.

#### 8. Research identifiers and citation surface

Add a public citation/reuse surface only after scope is explicit. Candidate mechanisms include:

- `CITATION.cff` for repository citation;
- release/tag snapshots for durable checkpoints;
- archive/DOI integration such as Zenodo only if the user explicitly connects/authorizes it;
- per-record stable UOIDs already used by Conscience64.

A DOI or release does not upgrade scientific validity.

#### 9. Accessibility as visibility

Visibility includes discoverability by assistive technology.

Public surfaces must preserve:

- semantic headings and landmarks;
- keyboard operation;
- screen-reader labels;
- non-color-only status distinctions;
- reduced-motion behavior;
- Unicode preservation;
- text alternatives for meaningful visuals;
- low reconstruction burden.

#### 10. Public source bundles

For substantial admitted results, generate deterministic source bundles/manifests that expose the minimum public files required to reconstruct the result, including hashes and regeneration commands where applicable.

These are reconstruction aids, not evidence multipliers.

## Public-safety exclusions

The visibility mesh must never automatically publish:

- restricted Knowledge Bridge packets;
- local analytics append-only ledger contents;
- secrets, credentials, tokens, local configuration, or environment data;
- private/family/legal/personal records;
- culturally or rights-restricted recovery carriers;
- files merely because they exist locally or in a connector;
- unadmitted generated drafts;
- material whose publication rights are unclear.

If research classification is absent or ambiguous, the research object remains non-public.

## Data flow

```text
source/research object
-> domain validation
-> explicit public admission
-> canonical public record
-> deterministic projection builder
   -> HTML index/page
   -> JSON snapshot
   -> Atom/JSON Feed
   -> sitemap research entries
   -> structured metadata
   -> federation pointer
   -> public discovery manifest
-> verification
-> Pages publication
-> deployed endpoint observation
```

Ordinary site pages follow their existing public gates and may contribute site-only sitemap/navigation entries without being converted into research records.

No outward research projection reads the private side of a mixed payload.

## Proposed repository structure

```text
research/fitting/
  README.md
  FIT_CONTRACT.md
  fit-schema.json
  fit_engine.py
  variants/
    FIT-00-invariant.json
    ...
    FIT-15-minimal-sufficient.json
  adapters/
    hodge.json
  examples/
  tests/

research/projects/public-updates/
  README.md
  admissions.json
  records/
  data/
  discovery-schema.json
  build_public_discovery.py
  tests/

robots.txt
sitemap.xml
feed.atom
feed.json
public-discovery.json
```

The public-update directory remains the canonical admitted-research source. The discovery builder extends that source rather than creating a parallel publication authority.

Root discovery files require explicit addition to the existing Pages synchronization path set before they are considered deployable.

## Hodge adapter boundary

Hodge is the first Fitting Lab adapter because it already has explicit confounds, claim ceilings, exact checks, and negative-result preservation.

The adapter may encode:

- observer roles;
- semantic rotations;
- confounds;
- repairs;
- closure rules;
- candidate status;
- one-degree experiment metadata.

It must not encode `Hodge conjecture proved` unless a separate admitted proof audit establishes that claim.

```text
FITTING_RESULT != HODGE_PROOF
```

## Verification

### Fitting Lab tests

Tests must cover:

- schema validation;
- deterministic serialization;
- semantic rotation lineage;
- distinction-loss recording;
- recursive confound generation;
- noncommuting confound detection;
- downward/upward/sideways repair lineage;
- contradiction isolation;
- closure provenance;
- fixed-point detection;
- enforcement that FIT-09 one-degree mutation cannot run before a declared closure/fixed-point condition;
- evidence/status non-promotion;
- Hodge adapter claim-ceiling preservation.

### Public visibility tests

Tests must cover:

- fail-closed public admission;
- no private file read on private admission;
- deterministic projections;
- all research feed/update formats contain only admitted public research records;
- already-public non-research pages cannot enter research feeds solely because they are public;
- source hash/provenance consistency across projections;
- sitemap contains only known public URLs and distinguishes site navigation from admitted research provenance;
- feed ordering is deterministic;
- generated links resolve inside the published source tree;
- structured metadata validates syntactically;
- robots/sitemap/feed links are present in the public site where appropriate;
- accessibility smoke checks;
- Pages workflow includes all new published root paths;
- deployed snapshots match checked-in/generated expectations where the existing publication model requires exact identity.

### Adversarial tests

Inject:

- an unclassified record;
- a private record referencing a public source;
- a public record referencing a missing source;
- an already-public site file that lacks research admission;
- conflicting revisions;
- duplicate semantic content with different provenance;
- a malformed external URL;
- a path traversal attempt;
- a private filename that resembles a public record;
- a fitting result whose candidate status attempts to self-promote.

Every case must fail closed or retain the correct weaker status.

## Compatibility and migration

This design is additive.

It does not rewrite historical browser snapshots, `projects.json`, old generated packages, or prior public-update records. New public indexes may point to them while preserving their historical/current roles.

The existing `CURRENT.json` forward-only approach remains the model for successor state.

## Success criteria

The design is successfully implemented when:

1. a Fitting Lab record can be reconstructed deterministically from its source and lineage;
2. confounds, confounds-of-confounds, and repairs remain typed and independently inspectable;
3. no fitting result can promote its own scientific/evidentiary status;
4. an explicitly admitted public research record appears consistently across all enabled public research projections;
5. a private or unclassified research record appears in none of them and is not read by the public builder;
6. the public site has explicit search-engine discovery files and machine-readable public endpoints;
7. public research can be navigated from the existing current project index without rewriting historical registries;
8. generated visibility surfaces preserve provenance and claim ceilings;
9. publication remains reproducible and compatible with Conscience64's existing verification gates;
10. already-public site material cannot be mistaken for an admitted research record merely because discovery surfaces link to it.

## Non-goals

This design does not:

- make private research remotely readable;
- turn Conscience64 into an evidence authority;
- claim that more visibility means more truth;
- expose every local or connected file;
- enable arbitrary remote execution;
- silently broaden scoped licenses;
- guarantee indexing by third-party search engines;
- guarantee DOI/repository archival integration without an explicitly connected external service.

## Implementation boundary

Implementation should proceed in independent, reviewable slices:

1. Fitting Lab core and tests;
2. Hodge adapter and bounded examples;
3. extension of the existing public-update canonical discovery model;
4. sitemap/robots/feeds/structured metadata plus required Pages-sync path updates;
5. existing public research project-index integration;
6. federation pointers;
7. repository-administration checklist for metadata/topics/homepage/discussions/license/citation/archive options;
8. end-to-end public/private and Pages verification.

No slice may bypass existing publication, evidence, privacy, licensing, or claim-ceiling checks simply to increase visibility.