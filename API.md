# Conscience64 Universal Search Space API

**API version:** `1.3.0`  
**Space UOID:** `uoid:sha256:aa3994488ddfcf5f0d828e679b598dd905d4d1fe958c97fd6303e357171d6599`  
**Search-space objects:** 734  
**Structured research projects:** 7  
**Surface:** I / R / P / O.

The HTML auto-runs and exposes:

```js
window.Conscience64API
```

The original searchable graph and the newer structured research-project registry are separate carriers. The registry lives at `research/projects/projects.json`; loading it does not rewrite the historical graph.

## Simple search

```js
Conscience64API.search.simple("black hole quantum", { limit: 20 })
```

## Advanced search

```js
Conscience64API.search.advanced({
  text: "language",
  objectTypes: ["research-node"],
  kinds: ["project", "method_project"],
  timeLayers: ["PRESENT_OR_INHERITED"],
  minDegree: 5,
  sortBy: "degree",
  sortDir: "desc",
  limit: 50
})
```

Supported advanced fields include:

`text`, `kind/kinds`, `objectType/objectTypes`, `timeLayer/timeLayers`,
`authority/authorities`, `domain/domains`, `relation/relations`,
`logicalId/logicalIds`, `uoidPrefix`, `provenance`, `minDegree`, `maxDegree`,
`hasFields`, `equals`, `from`, `to`, `sortBy`, `sortDir`, `offset`, `limit`.

## UOID lookup

```js
Conscience64API.get("project:physics")
Conscience64API.get("uoid:sha256:...")
```

## Relations / graph traversal

```js
Conscience64API.relations("project:physics", { direction: "out" })
Conscience64API.traverse("project:orbit", { depth: 2 })
```

Retrieval or graph relation is not automatically evidence. The current research policy keeps `RELATED != SUPPORTS` explicit.

## Structured project library

List all current project records:

```js
Conscience64API.projects.list()
```

Filter by text or exact status:

```js
Conscience64API.projects.list({ text: "recovery" })
Conscience64API.projects.list({ status: "ACTIVE_SOURCE_NATIVE_ARCHAEOLOGY" })
```

Fetch one machine-readable project:

```js
Conscience64API.projects.get("historical-recovery")
```

Reflow a project into I/R/P/O:

```js
Conscience64API.projects.reflow("operator-moonshot")
```

The returned shape is:

```js
{
  projectId,
  status,
  path,
  I,
  R: {
    difference,
    checks: { assumption, test, unknown }
  },
  P,
  O: {
    result,
    highlight,
    lowlight,
    claimCeiling
  }
}
```

Inspect the learned research invariants, transform states, and evidence policy:

```js
Conscience64API.projects.invariants()
```

The registry intentionally preserves rules including `UNKNOWN != ABSENT`, `SEMANTIC_SIMILARITY != IDENTITY`, `SOURCE != RECONSTRUCTION`, `BYTE_IDENTITY != SEMANTIC_TRUTH`, `MECHANISM_ACTIVE != MECHANISM_USEFUL`, and `FINITE_VERIFICATION != UNIVERSALITY`.

## Hodge research companion surface

The repository now carries an integrated Hodge-conjecture research spine and support stack:

```text
research/projects/hodge-conjecture.md
research/hodge/README.md
research/hodge/STRUCTURAL_SUPPORTS.md
research/hodge/RESEARCH_INTEGRATION_MAP.md
research/hodge/CONSCIENCE64_COOPERATION.md
research/hodge/claim_matrix.json
```

These records integrate K3/Kummer/Fermat/fourfold calibration work, 4D/compass and symmetry footings, P-vs-NP-derived research methods, Cross-Carrier transport discipline, Orbit/Knowledge-Decay provenance, TBCL/CSOL distinction control, Moonshot proof admission, and a machine-readable bridge/claim ledger.

The Hodge files are currently a **supplemental repository research surface**, not an eighth entry in `research/projects/projects.json`. Therefore:

```js
Conscience64API.projects.list()
```

still reports the seven registry projects documented by API version 1.3.0, and

```js
Conscience64API.projects.get("hodge-conjecture")
```

must not be assumed to resolve until a later registry/API version explicitly adds that project. `UNRESOLVED_PROJECT` or `null` at this layer is not evidence that the repository Hodge research is absent.

The companion contract adds the research invariant:

```text
CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE
```

and Hodge-specific guards including:

```text
CALIBRATION_RESULT != OPEN_PROBLEM_RESULT
SAME_HODGE_DIAMOND != SAME_ALGEBRAIC_CYCLE_STRUCTURE
SYMMETRY != USEFUL_QUOTIENT
CYCLE_COUNT != CYCLE_CLASS_RANK
COMPLEX_(p,p) != RATIONAL_HODGE_CLASS
```

A later registry promotion should preserve the current seven-project registry as predecessor state rather than silently pretending Hodge was always present.

## Microdata

```js
Conscience64API.microdata("project:orbit")
Conscience64API.microdataHTML("project:orbit")
```

## I/R/P/O

Graph/search action:

```js
Conscience64API.irpo({
  I: "black hole quantum",
  R: { scope: "privacy-safe connected research space" },
  P: { action: "search.simple", options: { limit: 10 } }
})
```

Project reflow action:

```js
Conscience64API.irpo({
  I: "historical-recovery",
  R: {},
  P: { action: "projects.reflow" }
})
```

Project actions accepted by IRPO are:

```text
projects.list
projects.get
projects.reflow
projects.invariants
```

`O` is produced by the selected action unless the caller explicitly supplies `O`; supplied outputs are not independent companion findings. IRPO retains only the latest 512 records in browser memory, not a durable archive:

```js
Conscience64API.history()
```

## Statistics

```js
Conscience64API.stats()
```

The result includes search-space counts, transport state, project-registry version, project count, and learned-invariant count.

## postMessage bridge

Request:

```js
otherWindow.postMessage({
  type: "conscience64.api",
  id: "req-1",
  method: "projects.reflow",
  args: ["historical-recovery"]
}, "*")
```

Response:

```js
{
  type: "conscience64.api.result",
  id: "req-1",
  ok: true,
  result: ...
}
```

Supported bridge methods include the search, lookup, relation, traversal, microdata, IRPO, stats, and `projects.*` methods exposed above.

## Identity and history rules

Every searchable graph object is assigned a deterministic content-addressed identifier:

```text
uoid:sha256:<64 hex digits>
```

A byte hash establishes identity of bytes; it does not establish semantic truth or proof weight. Research nodes, relations, world fragments, manifests, structured project records, failed experiments, and unresolved recovery states retain distinct roles.

Current policy is forward-only: new lessons update current registries, APIs, and verification without silently rewriting verified historical checkpoints.

## Selected daily lessons (1.3.0)

```js
Conscience64API.projects.lessons({date: "2026-09-13"})
Conscience64API.projects.lessons({projectId: "geometry-codecs", text: "de Bruijn"})
Conscience64API.irpo({I: {date: "2026-09-13"}, P: {action: "projects.lessons"}})
```

The `projects.lessons` postMessage route accepts the same filter object. Supported filters are `date`, `projectId`, `evidenceClass` and `text`; all supplied values must be nonempty strings and unknown fields are rejected. Unknown project IDs raise `UNRESOLVED_PROJECT`. An unmatched date or search returns an empty result within this registry, not a statement about all research.

Results include the registry version, source policy, assumptions, evidence class, claim ceiling and source digest references. These are curated records, not independent companion agreement. The 14 lessons in registry 1.1.0 form an interim September 13 selection. Source reports remain source-reported, and private source archives are not bundled. See [the update note](research/updates/2026-09-13.md).

The seven prior project records and 734-object graph are unchanged. `search.simple` and `search.advanced` still search that graph, not the lesson registry. Use `projects.lessons` for the new records. `stats().projects.lessonCount` reports this separate count.

## Endpoint filter repair (1.3.0)

A supplied `from` or `to` must be a nonempty string resolving to a graph object. Malformed values raise `INVALID_REFERENCE`; unresolved values raise `UNRESOLVED_REFERENCE`. Omitted fields leave that endpoint unconstrained. In the postMessage bridge an error is returned as `ok:false`, `result:null`, with the error string. This replaces the 1.2.0 behavior in which an unresolved endpoint silently selected all graph relations. No caller may treat a rejected query as a measured zero.

This remains a read-only browser corpus/registry API, apart from local IRPO history. There is no server-side chat, remote write endpoint or background autonomous session. Durable public updates use versioned repository source and normal deployment; do not put private data in the public registry. The wildcard postMessage bridge is for the public data surface, not an authenticated channel for secrets or privileged writes.
