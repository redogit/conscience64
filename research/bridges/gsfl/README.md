# GSFL bridge — Generalized Semantic Fitting Language v0

**Bridge status:** reference-only while the operative implementation is under review  
**Operative implementation:** `redogit/Other-Projects-/Generalized Semantic Fitting Language/`  
**Current implementation review:** `redogit/Other-Projects-#47`  
**Bridge date:** 2026-09-16

GSFL is the bounded language/implementation for **human-optimized semantic rotation with invariant-preserving fitters**.

Its v0 pipeline is:

```text
Meaning
  -> candidate rotations
  -> invariant + reconstruction checks
  -> task-relative fit
  -> human surface
  -> reconstruction
  -> comparison with source meaning
```

The operative implementation deliberately distinguishes:

```text
VALID_ROTATION != MUTATION != SEMANTIC_DECAY
FIT != TRUTH
RECONSTRUCTION_SURROGATE != HUMAN_VALIDATION
```

## Why this is a bridge, not another implementation

`redogit/Other-Projects-` is the implementation home selected by the current project routing. Conscience64 retains research, recovery, navigation and cooperation context without silently becoming the source of truth for the new language.

Therefore this directory does **not** copy `gsfl.py`, its tests, its frozen audit, or its example program.

```text
CONSCIENCE64_REFERENCE != GSFL_IMPLEMENTATION_AUTHORITY
CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE
RELATED != AUTHORITY_TRANSFER
```

## Typed relations

| Conscience64 surface | Relation to GSFL | Boundary |
|---|---|---|
| Cross-Carrier work | `METHOD_TRANSFER` / `CONCEPTUAL_CONVERGENCE` | A carrier transform is not automatically a valid semantic rotation. |
| Tiny Babel / TBCL | `OPEN_POSSIBLE_CONNECTION` | No TBCL grammar/runtime promotion is performed by this bridge. |
| Operator Moonshot | `SUPPORTS_TEST_DESIGN` | GSFL fit never promotes scientific evidence. |
| Geometry / observer work | `APPLICATION` | The N-observer GSFL fixture is a semantic-surface test, not geometric or physical validation. |
| Research Analytics | `APPLICATION` | GSFL classifications may later become events; transport validity remains separate from evidence validity. |
| Historical Recovery | `PROVIDES_RECOVERY_PATTERN` | Reconstruction remains distinct from original source. |

## Current bounded implementation evidence

The implementation PR records a local second-pass verification of:

- 13/13 tests passing;
- deterministic frozen audit reproduction;
- byte-identical repeat execution of the N-observer fixture;
- explicit negative controls for attractive mutation, invariant decay and lossy reconstruction.

The implementation branch also contains an exact-head GitHub Actions gate. Until that review is merged, this bridge records only a **pending external implementation relation**.

## Promotion rule

After `redogit/Other-Projects-#47` is merged and verified on `main`, this bridge may update its status to point at the merged commit. That update must not silently add GSFL to Conscience64's preserved project registry, regenerate historical snapshots, or import evidence into unrelated research claims.
