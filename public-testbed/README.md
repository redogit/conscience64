# Conscience64 Public Experimental Test Bed

This directory is the **only intended source family** for the deliberately narrow public test-bed projection defined by issue #166.

```text
CONSCIENCE64_REPOSITORY != PUBLIC_TESTBED_PROJECTION
PUBLIC_TESTBED != WHOLE_REPOSITORY
PUBLIC_EXPERIMENT != VERIFIED_TRUTH
EXPERIMENTAL != SLOPPY
PUBLIC PROJECTION != SOURCE CORPUS
PRIVATE METHOD MAY INFORM SOLVING
PRIVATE SOURCE MUST NOT PROPAGATE
```

## Source model

- `testbed.json` is the data-driven experimental/navigation state.
- `site/**` is the static human-facing surface.
- `tools/build-public-testbed.mjs` may read only this source family and emits an isolated projection plus an exact-source manifest.
- The generated projection is not publication authority. Pages switching and network-edge verification are separate gates.

The initial calibration is **Projection Isolation v0**. It changes one degree: the projection builder's admitted source root. Repository-wide publication remains held until a later, separately verified switch.


## Visible path states

The test bed keeps distinct path states rather than flattening history into one current answer:

```text
active
tested
failed
blocked
deferred
return
```

Every path carries currentness, progression position, relation class, evidence, result, provenance, claim boundary, and Remainder. Tested zero results remain explicit. Failed paths remain traversable. Blocked paths are not treated as false; they remain constrained by the current scope. Return paths preserve a way back without making the predecessor current authority.

Alias records remain separate from verified lineage:

```text
ALIAS != LINEAGE
SIMILARITY != DESCENT
CURRENT != TRUE
SUPERSEDED != FALSE
HISTORICAL != IRRELEVANT
```

The first grounded Failure Museum record is the PR #171 synthetic-merge RED result, retained as an evidence-carrier mismatch and repaired by PR #172. The first return path is the preserved pre-testbed `gh-pages` predecessor retained beneath projection commit `2068472a...`.
