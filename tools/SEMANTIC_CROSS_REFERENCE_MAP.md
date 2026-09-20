# Massive Semantic Cross-Reference Map

The semantic cross-reference tools build deterministic, bounded navigation graphs from arbitrary research/project/game records and from the actual public repository corpus.

They are helpers under the existing Society skills, **not a fourth top-level skill**.

## Purpose

Find potentially useful relationships across large working sets while preserving the distinction between:

- an explicit recorded relation;
- an alias/name collision;
- shared tags/domains;
- lexical-semantic similarity;
- vector similarity;
- a multi-hop navigation route;
- a cross-project bridge candidate;
- evidence that actually supports a claim.

The mapper never promotes a discovered relation, route, or bridge to evidence or authority.

## Core arbitrary-record mapper

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

Records may contain stable IDs, text, aliases, tags/topics/domains/categories, explicit relations, optional embedding vectors, and project/provenance metadata. Field sets are configurable.

## Repository corpus adapter

`semantic-corpus.mjs` converts the current repository into deterministic file records.

```js
import {recordsFromRepository} from './semantic-corpus.mjs';

const corpus = await recordsFromRepository('.', {
  maxFiles: 5000,
  maxFileBytes: 256000,
  maxTextChars: 12000
});
```

Each admitted file record carries:

- stable ID `file:<repository-relative-path>`;
- extracted title;
- project/path tags;
- bounded text content for semantic indexing;
- SHA-256 and byte count provenance;
- explicit local Markdown/HTML links when their targets are also admitted records.

Default exclusions include `.git`, `node_modules`, runtime/build/cache directories, package-manager lockfiles, unsupported binary extensions, oversized files, symlinks, and invalid UTF-8.

Private material is **not** automatically pulled into this corpus. Supplying another root or protected material requires an explicit scope decision.


### Private-origin exclusion

Structured carriers marked as private-history-derived are excluded before they become semantic records. The repository adapter recognizes the marker in JSON/JSONL objects and Markdown front matter, and the core graph mapper independently rejects marked records supplied directly by callers.

```text
derived_from_private_history = true
or
privacy_origin.classification = private-history-method-only
```

For an excluded carrier, semantic ingestion does not retain its content, path-derived record, SHA-256 provenance, explicit links, similarity reasons, graph node, graph edge, or query result. A public record that explicitly links to an excluded record does not recreate that edge.

This is a **marker-enforcement boundary**, not a classifier that can infer sensitive provenance from arbitrary unmarked prose. Correct origin marking and upstream privacy controls remain required.

```text
PRIVATE METHOD MAY INFORM SOLVING
PRIVATE SOURCE MUST NOT PROPAGATE
PRIVATE_ORIGIN != SEARCHABLE_CORPUS
PRIVATE_ORIGIN != SEARCHABLE_GRAPH
PRIVATE_ORIGIN != QUERY_RESULT
```

## Multi-hop navigation

`semantic-routing.mjs` adds bounded graph navigation without pretending that a route is a proof chain.

```js
import {
  semanticRoute,
  crossReferenceSubgraph,
  crossProjectBridgeCandidates
} from './semantic-routing.mjs';

const route = semanticRoute(graph, 'file:a.md', 'file:b.md', {
  maxHops: 6,
  minScore: 0.25
});

const neighborhood = crossReferenceSubgraph(graph, ['file:a.md'], {
  depth: 2,
  maxNodes: 100
});

const bridges = crossProjectBridgeCandidates(graph, {
  minScore: 0.30,
  limit: 50
});
```

Routes prefer explicit relations and higher-score edges deterministically within the same bounded hop search. Subgraphs cap depth and node count. Bridge candidates require nodes from different project/path domains.

## Current-repository CLI

```bash
node tools/build-semantic-corpus-map.mjs \
  --root . \
  --output /tmp/conscience64-semantic-map.json \
  --max-files 5000 \
  --threshold 0.30 \
  --max-edges 8
```

The output contains:

- corpus statistics;
- the sparse semantic graph;
- up to 100 cross-project bridge candidates;
- explicit epistemic boundaries.

The default CLI output does not make the generated map canonical evidence. It is a reproducible retrieval/navigation artifact.

## Scale strategy

The implementation does **not** begin with an all-pairs O(n²) scan.

Candidate generation uses:

1. informative-token inverted indexes;
2. exact alias buckets;
3. tag buckets;
4. deterministic locality-sensitive hashing for supplied semantic vectors.

Very common postings are skipped according to declared limits. Final derived degree is bounded by `maxEdgesPerNode`.

This keeps the resulting map sparse instead of connecting everything to everything.

## Relation classes

### Explicit relations

Existing declared links are preserved as explicit edges with their declared relation label.

`EXPLICIT_RELATION != EVIDENCE_OF_TRUTH`

### `ALIAS_MATCH`

Two records share an exact normalized title/alias.

### `SEMANTIC_CANDIDATE`

Weighted lexical/tag signals pass the configured threshold.

### `SEMANTIC_VECTOR_MATCH`

Supplied semantic vectors are sufficiently aligned and are stronger than the lexical signal for that candidate. Vector candidate discovery uses deterministic LSH buckets rather than exhaustive vector comparison.

## Edge explanations

Derived edges retain component signals and, by default, compact reasons such as shared tokens/tags. Set `includeReasons:false` when even those reasons would expose protected material.

The mapper does not include full source text or source records in graph nodes by default. `includeText` and `includeRecord` are opt-in.

## Hard boundaries

- `RELATED != SUPPORTS`
- `SEMANTIC_SIMILARITY != EVIDENCE`
- `RETRIEVAL != CORROBORATION`
- `DERIVED_EDGE != AUTHORITY_TRANSFER`
- `SEMANTIC_PATH != PROOF_CHAIN`
- `BRIDGE_CANDIDATE != APPLICABILITY`
- `CORPUS_RECORD != EVIDENCE`
- `FILE_LINK != SUPPORT`
- `PRIVATE_ORIGIN != SEARCHABLE_CORPUS`
- `PRIVATE_ORIGIN != SEARCHABLE_GRAPH`
- `PRIVATE_ORIGIN != QUERY_RESULT`

A useful semantic connection is a retrieval/navigation/discovery signal. It does not prove that one record supports, refutes, causes, validates, authorizes, or successfully transfers to another.

## Current executed stress test

The original mapper implementation was executed locally against a synthetic 3,000-record working set:

```text
PASS semantic cross-reference map: 3000 nodes, 11550 sparse edges, 939 ms; deterministic; RELATED != SUPPORTS
```

This is one bounded implementation-performance observation, **not** a universal throughput guarantee.

The current CI additionally builds a map from the repository itself and verifies that it is non-empty, bounded, and carries the required boundaries.

## Society/ECS placement

```text
Human Purpose
  -> Society
    -> Recover & Bound / Build & Test / Review & Admit
      -> semantic cross-reference helpers
        -> corpus / records / indexes / routes
          -> ECS / explicit carriers / human decisions
```

Use the map to find helpers, neighborhoods, and possible bridges. Use independent evidence and applicability gates to decide what those links actually mean.
