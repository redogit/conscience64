# Massive Semantic Cross-Reference Map

`semantic-crossref.mjs` builds a deterministic, bounded cross-reference graph from arbitrary research/project/game records.

It is a helper under the existing Society skills, **not a fourth top-level skill**.

## Purpose

Find potentially useful relationships across large working sets while preserving the distinction between:

- an explicit recorded relation;
- an alias/name collision;
- shared tags/domains;
- lexical-semantic similarity;
- vector similarity;
- evidence that actually supports a claim.

The mapper never promotes a discovered relation to evidence or authority.

## Core function

```js
import {
  massSemanticCrossReferenceMap,
  semanticNeighbors,
  crossReferenceComponents
} from './semantic-crossref.mjs';

const graph = massSemanticCrossReferenceMap(records, {
  threshold: 0.26,
  maxEdgesPerNode: 24
});

const neighbors = semanticNeighbors(graph, 'project:hodge');
const components = crossReferenceComponents(graph, {minScore: 0.3});
```

## Inputs

Records may contain any subset of:

- stable IDs: `id`, `key`, `uid`, `stable_id`, `stableId`;
- text: title/name/label/summary/description/text/content/definition/purpose/context/notes;
- aliases;
- tags/topics/domains/categories/keywords;
- explicit `relations`, `links`, `references`, or cross-reference fields;
- optional numeric `embedding` vectors;
- project/provenance metadata.

Field sets are configurable.

## Scale strategy

The implementation does **not** begin with an all-pairs O(n²) scan.

Candidate generation uses:

1. informative-token inverted indexes;
2. exact alias buckets;
3. tag buckets;
4. deterministic locality-sensitive hashing for supplied semantic vectors.

Very common postings are skipped according to declared limits. Final derived degree is bounded by `maxEdgesPerNode`.

This keeps the resulting map sparse and useful instead of connecting everything to everything.

## Relation classes

### Explicit relations

Existing declared links are preserved as explicit edges with their declared relation label.

`EXPLICIT_RELATION != EVIDENCE_OF_TRUTH`

### `ALIAS_MATCH`

Two records share an exact normalized title/alias.

### `SEMANTIC_CANDIDATE`

Weighted lexical/tag signals pass the configured threshold.

### `SEMANTIC_VECTOR_MATCH`

Supplied semantic vectors are sufficiently aligned and are stronger than the lexical signal for that candidate.

Vector candidate discovery uses deterministic LSH buckets rather than exhaustive vector comparison.

## Edge explanations

Derived edges retain component signals:

```json
{
  "signals": {
    "lexical": 0.61,
    "embedding": null,
    "alias": 0,
    "tags": 0.5
  },
  "reasons": {
    "sharedTokens": ["decision", "field"],
    "sharedTags": ["math"],
    "aliasMatch": false
  }
}
```

Set `includeReasons:false` when even shared-token explanations would expose material that should remain private.

The mapper does not include full source text or records by default. `includeText` and `includeRecord` are opt-in.

## Hard boundaries

- `RELATED != SUPPORTS`
- `SEMANTIC_SIMILARITY != EVIDENCE`
- `RETRIEVAL != CORROBORATION`
- `DERIVED_EDGE != AUTHORITY_TRANSFER`

A useful semantic connection is a retrieval/navigation/discovery signal. It does not prove that one record supports, refutes, causes, validates, or authorizes another.

## Current executed stress test

Before the implementation branch was opened, the function was executed locally against a synthetic 3,000-record working set.

Observed result in that run:

```text
PASS semantic cross-reference map: 3000 nodes, 11550 sparse edges, 939 ms; deterministic; RELATED != SUPPORTS
```

This establishes one bounded implementation-performance observation in the current environment. It is **not** a universal throughput guarantee.

## Society/ECS placement

```text
Human Purpose
  -> Society
    -> Recover & Bound / Build & Test / Review & Admit
      -> semantic-crossref helper
        -> ECS / records / indexes
          -> explicit carriers
```

Use it to find helpers and possible bridges. Use independent evidence gates to decide what those links mean.
