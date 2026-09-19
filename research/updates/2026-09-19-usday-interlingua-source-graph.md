# September 19 continuation — USDAY, Interlingua, and public-source graph

Status: `CURRENT_BOUNDED_UPDATE / MIXED_EVIDENCE_CLASSES / PUBLICATION_HELD`

This record keeps design-state material separate from executed software evidence.

## A. Cooperative-language design lineage

### USDAY-first predecessor

Merged predecessor:

`docs/superpowers/specs/2026-09-19-usday-interlinuia-democracy-design.md`

Git anchor:

`9ec2bf599eda1c5e5e08d54d2ddc075729af61e3`

Status:

`DESIGN_ONLY / NOT_YET_IMPLEMENTED`

Core order:

```text
USDAY FIRST
-> JUST LOAD IT
-> UNDERSTAND
-> PLAN
-> PAIRITY
-> SHARED DECISION WHERE REQUIRED
-> DO
-> OBSERVE
-> COUNTERPROBE
-> CHECK
-> RETAIN
-> SOLDAY CARRY
-> RMADAY RECORD / RECONSTRUCT
-> CONTINUE
```

### Interlingua Linguistics Agreement System successor

Corrected successor:

`docs/superpowers/specs/2026-09-19-interlingua-linguistics-agreement-system-design.md`

Git anchor:

`10ca50d655a0a94f8cdc0ad1f3505349c0d0351a`

Status:

`DESIGN_ONLY / NOT_YET_IMPLEMENTED`

The predecessor is intentionally not renamed.

```text
INTERLINUIA = HISTORICAL_WORKING_ARTIFACT
INTERLINGUA_LINGUISTICS_AGREEMENT_SYSTEM = CORRECTED_SUCCESSOR_DIRECTION
CORRECTION != HISTORY_ERASURE
```

Standing design boundaries:

```text
PAIRITY != FORCED_EQUALITY
AGREEMENT != EVIDENCE
CONSENSUS != TRUTH
TRANSLATION != IDENTITY
INTERPRETATION != SOURCE
UNDERSTOOD != CONSENTED
AGREED_MEANING != AGREED_ACTION
```

## B. Executed public-source graph evidence

Publication remains held through `PUBLIC_RELEASE_APPROVAL.json`.

The source-side dependency line established:

### Direct canonical HTML assets — PR #144

```text
58 canonical HTML routes
369 local HTML references
251 direct asset references
93 unique direct assets
```

Merge:

`6b8c906fb403caa5f4f5addb9a0931e908533c2b`

### One-hop static JS/CSS dependencies — PR #146

```text
11 references
11 unique one-hop dependencies
```

Merge:

`bef30bae362ca2164440a69d92b402486ff8c3e4`

### Second-hop static dependencies — PR #148

```text
8 references
8 unique second-hop dependencies
```

Merge:

`87b32e07f17ab9c2e20bfadcdb3ab10e78a43711`

### Fixed-point closure — PR #150

```text
3 layers
16 unique dependency files
terminal layer: 0 new files
```

Merge:

`7ce19420c002e0d0e7c761fab1b786e5c61b5a42`

### Literal import.meta.url — PR #152

```text
1 quoted-literal reference
1 unique repository asset
```

Merge:

`d68f54e9f6206df8028b6cf4ac505dd1a320e80a`

### Literal Worker / SharedWorker — PR #156

```text
0 quoted-literal Worker/SharedWorker references
0 unique Worker assets
```

Merge:

`032167e1694ab00144dbdc9dc5cf62d28a0fa82e`

This is a first-class negative result:

```text
NO_MATCH_UNDER_DECLARED_LITERAL_WORKER_RELATION
!=
NO_WORKER_BEHAVIOR_ANYWHERE
```

Untested or separately scoped relations include nested `new URL(..., import.meta.url)` inside Worker construction, ServiceWorker registration, fetch/XHR, template expressions, dynamically constructed strings, bundler transforms, and runtime-generated paths.

## C. Authority and publication boundary

```text
DESIGN != IMPLEMENTATION
SOURCE_GRAPH_MEASURED != PUBLICATION_APPROVED
PUBLICLY_VISIBLE != PUBLICATION_APPROVED != COMMERCIALLY_LICENSED
SOURCE_DEPENDENCY_CLOSURE != RUNTIME_CORRECTNESS
SOURCE_DEPENDENCY_CLOSURE != ACCESSIBILITY
BYTE_IDENTITY != SEMANTIC_TRUTH
ZERO_RESULT != UNIVERSAL_ABSENCE
```

This update does not change the publication hold.


## D. Private-history language-learning boundary

Merged PR #154 adds an active local privacy rule for private historical material supplied only to learn the user's problem-solving language or method.

Git anchor:

`d03abc4d77300ae4e9fa2445805468b499602f27`

Standing distinctions:

```text
PRIVATE_HISTORY != PUBLIC_EVIDENCE
PRIVATE_HISTORY != PROJECT_ARTIFACT
LANGUAGE_PATTERN != PERSONAL_PROFILE
LEARNED_METHOD != DISCLOSURE
DERIVED_FROM_PRIVATE_HISTORY != SAFE_TO_PUBLISH
```

Allowed use is abstract internal method only after private facts and identity-bearing detail are removed.

A public-update candidate marked:

```json
{"derived_from_private_history": true}
```

must fail closed.

A rewritten or sanitized private narrative is not a public-source bypass.

```text
BOUNDARY MAY BE REMEMBERED
PRIVATE STORY MUST NOT BE EXPORTED
METHOD MAY INFORM INTERNAL REASONING
PROJECT CLAIMS REQUIRE PROJECT EVIDENCE
```

PR #154 added no private historical narrative, handles, identities, relationships or links to the repository.
