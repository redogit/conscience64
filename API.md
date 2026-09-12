# Conscience64 Universal Search Space API

**Space UOID:** `uoid:sha256:aa3994488ddfcf5f0d828e679b598dd905d4d1fe958c97fd6303e357171d6599`  
**Objects:** 734  
**Surface:** I / R / P / O only.

The HTML auto-runs and exposes:

```js
window.Conscience64API
```

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

## Microdata

```js
Conscience64API.microdata("project:orbit")
Conscience64API.microdataHTML("project:orbit")
```

## I/R/P/O

```js
Conscience64API.irpo({
  I: "black hole quantum",
  R: { scope: "privacy-safe connected research space" },
  P: { action: "search.simple", options: { limit: 10 } }
})
```

`O` is produced by the selected action. IRPO history is append-only in memory:

```js
Conscience64API.history()
```

## postMessage bridge

Request:

```js
otherWindow.postMessage({
  type: "conscience64.api",
  id: "req-1",
  method: "search.advanced",
  args: [{ text: "accessibility", limit: 10 }]
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

## Identity rule

Every searchable thing is assigned a deterministic content-addressed identifier:

```text
uoid:sha256:<64 hex digits>
```

Research nodes, relations, world fragments, and the space manifest are all first-class objects.
