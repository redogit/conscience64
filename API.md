# Conscience64 Universal Search Space API

**API version:** `1.2.0`  
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

`O` is produced by the selected action. IRPO history is append-only in browser memory:

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
