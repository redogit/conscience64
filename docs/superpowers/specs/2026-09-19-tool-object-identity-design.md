# Tool Object Identity Design

**Status:** written design for review; not implemented  
**Date:** 2026-09-19  
**Scope:** intrinsic IDs for the small set of Conscience64 tools needed by the current working path  
**Issue relation:** Issue #160 remains the broader privacy/deep-carrier work item; this design defines only tool-object identity.

## Intent

Give each needed tool object a stable identity that belongs to the object itself.

The identity must **not** be derived from, strengthened by, or changed by associations such as:

- users;
- repositories or file paths;
- callers/callees;
- parent/child relations;
- semantic neighbors;
- co-occurrence;
- invocation order;
- usage history;
- provenance links;
- private-history relations;
- graph position.

The goal is to support later composition without collapsing object identity into relation identity.

## Governing distinction

```text
OBJECT_ID
= identity of the object itself

OBJECT_ID != association-derived identity
OBJECT_ID != relation graph
OBJECT_ID != usage history
OBJECT_ID != provenance graph
OBJECT_ID != semantic similarity
```

Changing, adding, or removing a relation must not change either endpoint's object ID.

## Initial tool-object set

Only the tools needed by the current path are admitted:

| object_id | canonical_name | kind |
| --- | --- | --- |
| `tool:recover-bound` | `recover-bound` | `tool` |
| `tool:semantic-cross-reference` | `semantic-cross-reference` | `tool` |
| `tool:semantic-applicability` | `semantic-applicability` | `tool` |
| `tool:hypothesis-algorithm-builder` | `hypothesis-algorithm-builder` | `tool` |
| `tool:knowledge-bridge` | `knowledge-bridge` | `tool` |

No broader tool catalog is implied by this first set.

## Identity model

Each tool object has exactly these identity-bearing fields:

```json
{
  "object_id": "tool:recover-bound",
  "canonical_name": "recover-bound",
  "kind": "tool"
}
```

### Identity rules

1. `object_id` is explicit, stable, and unique.
2. `object_id` is not computed from relations.
3. `canonical_name` names the object but does not determine relation membership.
4. `kind` is intrinsic type information only.
5. No path, repository, user, owner, parent, neighbor, source, history, or association appears in the identity object.
6. Renaming an implementation file does not automatically change `object_id`.
7. Moving a tool between directories does not automatically change `object_id`.
8. Adding or removing relations does not change `object_id`.
9. A new object ID requires an explicit identity decision, not graph inference.
10. Two tools may be related without sharing identity.

## Why explicit stable IDs

Three approaches were considered:

### A. Explicit stable IDs — selected

Example:

```text
tool:recover-bound
```

Advantages:

- human-auditable;
- stable across association changes;
- no hash/chunk/canonicalization ambiguity;
- supports continuing identity across implementation moves;
- cheapest reversible first implementation.

### B. Content-addressed IDs — not selected for continuing tool identity

A content hash is useful for exact state identity, but changing the implementation or intrinsic metadata would create a different digest. That answers **which exact state?**, not **which continuing tool?**.

```text
CONTINUING_OBJECT_ID != STATE_HASH
```

Content hashes may still be used later for exact state/version evidence.

### C. UUIDs — not selected

UUIDs would provide opaque stable identifiers but reduce inspectability without solving a problem this small set currently has.

## Relations are separate objects

A relation may refer to tool IDs:

```json
{
  "subject_id": "tool:recover-bound",
  "relation": "may-use",
  "object_id": "tool:semantic-cross-reference"
}
```

But relation records are **not part of either tool object's identity**.

```text
TOOL_OBJECT + RELATION
!=
NEW_TOOL_ID
```

A relation can be added, removed, superseded, or contradicted without changing either endpoint ID.

This design does not yet define a canonical relation schema. That is deliberately outside scope.

## Associations explicitly excluded from identity

The following must not participate in object-ID generation or matching:

- person/user identity;
- assistant/companion identity;
- repository identity;
- branch/commit identity;
- file path;
- issue/PR number;
- semantic score;
- linked records;
- aliases observed elsewhere;
- graph degree;
- graph component;
- temporal sequence;
- invocation chain;
- parent/child relation;
- provenance chain;
- evidence relation;
- private-history source;
- profile attributes.

This is especially important for privacy:

```text
OBJECT_ID != IDENTITY_CORRELATION
```

Object IDs identify declared tool objects. They are not a mechanism for discovering who or what else is associated with them.

## Proposed implementation surface

The smallest implementation should contain:

- `tools/tool-objects.json` — the canonical initial five-object registry;
- `tools/tool-object-registry.mjs` — validation and lookup by `object_id` / `canonical_name`;
- `tools/tool-object-registry.test.mjs` — TDD tests for uniqueness, stability, and association exclusion;
- a short documentation section explaining that relations are separate.

No current tool implementation files need to be renamed.

## Required API

The registry implementation should expose:

```js
loadToolObjects()
getToolObjectById(objectId)
getToolObjectByName(canonicalName)
validateToolObjects(objects)
```

The returned tool object shape is:

```js
{
  object_id: string,
  canonical_name: string,
  kind: 'tool'
}
```

No relation data is returned by these identity APIs.

## Core tests

The implementation is not complete until tests prove:

1. all five declared IDs resolve;
2. IDs are unique;
3. canonical names are unique;
4. only the three allowed fields exist;
5. unknown fields such as `parent_id`, `user_id`, `repository`, `relations`, `neighbors`, `source`, or `history` are rejected;
6. changing a separate relation fixture does not change tool-object lookup or ID;
7. file-path changes in a relation/locator fixture do not change tool ID;
8. no semantic similarity or association inference is used to resolve an object;
9. unknown object IDs remain unknown instead of being inferred from related objects;
10. the existing semantic/applicability tools continue to operate without identity changes.

## Boundaries

```text
OBJECT_ID != STATE_ID
OBJECT_ID != RELATION_ID
OBJECT_ID != LOCATOR
OBJECT_ID != PROVENANCE
OBJECT_ID != AUTHORITY
OBJECT_ID != PROFILE
OBJECT_ID != ASSOCIATION_INFERENCE
```

This design establishes only continuing identity for declared tool objects.

It does not yet establish:

- a universal identity system;
- IDs for people;
- IDs for private historical material;
- a general relation graph;
- tool authority or applicability;
- provenance semantics;
- state/content hashes;
- automatic identity discovery.

## Integration with current work

Existing systems keep their authority:

- semantic cross-reference remains navigation;
- semantic applicability remains the applicability gate;
- Recover & Bound remains the recovery boundary;
- Knowledge Bridge retains its packet/UOID semantics;
- Issue #160 retains the broader privacy/deep-carrier work.

This object-ID layer only gives those tools stable names for composition.

## Claim ceiling

If implemented and tested, this will establish a finite software convention for the five declared tool objects:

```text
stable explicit tool object IDs independent of association changes
```

It will not prove that identity is universally intrinsic, solve identity in arbitrary domains, or establish that all possible relations can never affect identity in other systems.
