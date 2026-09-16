# Conscience64 Fitting Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, provenance-preserving Fitting Lab that turns semantic rotations, confounds, repairs, closures, variants, and one-degree experiments into inspectable research records without promoting their evidence status.

**Architecture:** The Fitting Lab is a pure Python-stdlib research subsystem under `research/fitting/`. Its engine manipulates plain JSON-compatible dictionaries, validates all state transitions, and records every transformation append-only inside a fit record. Domain adapters supply vocabulary and claim ceilings but never gain authority to promote evidence; the Hodge adapter is the first integration and remains constrained by the existing `OPEN` Hodge claim ceiling.

**Tech Stack:** Python 3 stdlib (`json`, `hashlib`, `pathlib`, `copy`, `argparse`, `unittest`), JSON configuration files, GitHub Actions using the repository's direct-Git materialization pattern.

**Spec:** `docs/superpowers/specs/2026-09-15-fitting-public-visibility-design.md`

## Global Constraints

- `FIT != TRUTH`.
- `SEMANTIC_ROTATION != SEMANTIC_MUTATION`.
- A repair never upgrades evidence status by itself.
- Consequential transform outcomes use only `PRESERVED`, `TRANSFORMED`, `SPLIT`, `MERGED`, `INTRODUCED`, `LOST`, or `UNRESOLVED`.
- Fitting output statuses use only `OBSERVED`, `SOURCE_VERIFIED`, `FORMAL_CONSEQUENCE`, `COMPUTATIONALLY_VERIFIED_BOUNDED`, `HYPOTHESIS`, `CANDIDATE`, `NEGATIVE_RESULT`, `CONTRADICTION`, `UNRESOLVED`, or `REJECTED`.
- Contradictory branches remain separate and produce an explicit conflict object; they never trigger unrestricted logical explosion.
- FIT-09 may run only after a declared fixed point and may change exactly one consequential degree.
- Hodge remains `ACTIVE_OPEN_PROBLEM_RESEARCH_WITH_STRICT_CLAIM_CEILING`; `FITTING_RESULT != HODGE_PROOF`.
- This plan is additive: it must not rewrite historical browser snapshots, research evidence, the Knowledge Bridge authority boundary, Analytics authority, or world/game authority.

---

## File Structure

### Create

- `research/fitting/README.md` — human contract, examples, evidence boundary, commands.
- `research/fitting/FIT_CONTRACT.md` — normative record/state-transition contract.
- `research/fitting/fit-schema.json` — machine-readable field vocabulary and enums.
- `research/fitting/fit_engine.py` — validation, deterministic identity, rotations, confounds, repairs, closure, fixed-point and mutation gates.
- `research/fitting/test_fit_engine.py` — exhaustive unit tests for engine invariants.
- `research/fitting/variant_registry.py` — deterministic loader/validator for variant definitions.
- `research/fitting/test_variant_registry.py` — registry and all-variant contract tests.
- `research/fitting/variants/FIT-00-invariant.json`
- `research/fitting/variants/FIT-01-multi-eye.json`
- `research/fitting/variants/FIT-02-confound.json`
- `research/fitting/variants/FIT-03-recursive-confound.json`
- `research/fitting/variants/FIT-04-downward-repair.json`
- `research/fitting/variants/FIT-05-upward-repair.json`
- `research/fitting/variants/FIT-06-sideways-repair.json`
- `research/fitting/variants/FIT-07-closure.json`
- `research/fitting/variants/FIT-08-counter-fit.json`
- `research/fitting/variants/FIT-09-one-degree-escape.json`
- `research/fitting/variants/FIT-10-population.json`
- `research/fitting/variants/FIT-11-historical.json`
- `research/fitting/variants/FIT-12-executable.json`
- `research/fitting/variants/FIT-13-human.json`
- `research/fitting/variants/FIT-14-adversarial.json`
- `research/fitting/variants/FIT-15-minimal-sufficient.json`
- `research/fitting/adapters/hodge.json` — Hodge-specific observers, confounds, claim ceiling and forbidden promotions.
- `research/fitting/examples/hodge-confound-first.json` — bounded demonstration record, explicitly not proof evidence.
- `.github/workflows/fitting-check.yml` — deterministic CI for the subsystem.

### Modify

- `research/projects/hodge-conjecture.md` — add a small method pointer to the Fitting Lab, preserving the existing claim ceiling and non-authority statement.

---

### Task 1: Core Fit Record, Validation, and Deterministic Identity

**Files:**
- Create: `research/fitting/fit_engine.py`
- Create: `research/fitting/fit-schema.json`
- Create: `research/fitting/test_fit_engine.py`

**Interfaces:**
- Produces: `new_fit(subject, *, claim_ceiling, provenance) -> dict`
- Produces: `validate_fit(fit) -> None`
- Produces: `canonical_json(value) -> str`
- Produces: `fit_uoid(fit) -> str`
- Produces: constants `FIT_SCHEMA`, `STATUSES`, `DISPOSITIONS`, `REPAIR_DIRECTIONS`.

- [ ] **Step 1: Write failing construction and identity tests**

Add to `research/fitting/test_fit_engine.py`:

```python
import copy
import importlib.util
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("fit_engine", HERE / "fit_engine.py")
engine = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(engine)


class FitEngineTests(unittest.TestCase):
    def base_fit(self):
        return engine.new_fit(
            "candidate object",
            claim_ceiling="CANDIDATE",
            provenance={"source": "unit-test", "revision": "test"},
        )

    def test_new_fit_has_required_empty_collections(self):
        fit = self.base_fit()
        self.assertEqual(fit["schema"], engine.FIT_SCHEMA)
        self.assertEqual(fit["subject"], "candidate object")
        self.assertEqual(fit["claim_ceiling"], "CANDIDATE")
        for key in ("declarations", "observers", "rotations", "invariants", "confounds", "repairs", "closure", "conflicts", "iterations", "mutations"):
            self.assertEqual(fit[key], [])
        engine.validate_fit(fit)

    def test_uoid_is_order_independent_and_excludes_transport_identity(self):
        fit = self.base_fit()
        first = engine.fit_uoid(fit)
        reordered = {key: copy.deepcopy(fit[key]) for key in reversed(list(fit.keys()))}
        self.assertEqual(first, engine.fit_uoid(reordered))
        self.assertTrue(first.startswith("uoid:sha256:"))

    def test_unknown_status_and_disposition_are_rejected(self):
        fit = self.base_fit()
        fit["declarations"].append({"id": "d1", "text": "x", "status": "MAGIC", "provenance": {"source": "test"}})
        with self.assertRaises(engine.FitError):
            engine.validate_fit(fit)
```

- [ ] **Step 2: Run the tests and verify they fail because the engine does not exist**

Run:

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: import/file failure for `fit_engine.py`.

- [ ] **Step 3: Implement the minimal core engine and schema vocabulary**

Create `research/fitting/fit_engine.py` with these exact public constants and functions:

```python
from __future__ import annotations

import copy
import hashlib
import json
from typing import Any

FIT_SCHEMA = "conscience64/fitting-record/v1"
STATUSES = {
    "OBSERVED", "SOURCE_VERIFIED", "FORMAL_CONSEQUENCE",
    "COMPUTATIONALLY_VERIFIED_BOUNDED", "HYPOTHESIS", "CANDIDATE",
    "NEGATIVE_RESULT", "CONTRADICTION", "UNRESOLVED", "REJECTED",
}
DISPOSITIONS = {"PRESERVED", "TRANSFORMED", "SPLIT", "MERGED", "INTRODUCED", "LOST", "UNRESOLVED"}
REPAIR_DIRECTIONS = {"down", "up", "sideways", "historical"}

class FitError(ValueError):
    pass


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def new_fit(subject: str, *, claim_ceiling: str, provenance: dict) -> dict:
    if not isinstance(subject, str) or not subject.strip():
        raise FitError("subject must be non-empty text")
    if claim_ceiling not in STATUSES:
        raise FitError("claim_ceiling must be an admitted fitting status")
    fit = {
        "schema": FIT_SCHEMA,
        "subject": subject,
        "claim_ceiling": claim_ceiling,
        "provenance": copy.deepcopy(provenance),
        "declarations": [], "observers": [], "rotations": [], "invariants": [],
        "confounds": [], "repairs": [], "closure": [], "conflicts": [],
        "iterations": [], "mutations": [],
    }
    validate_fit(fit)
    return fit


def fit_uoid(fit: dict) -> str:
    validate_fit(fit)
    raw = canonical_json(fit).encode("utf-8")
    return "uoid:sha256:" + hashlib.sha256(raw).hexdigest()


def validate_fit(fit: dict) -> None:
    if not isinstance(fit, dict) or fit.get("schema") != FIT_SCHEMA:
        raise FitError("wrong fitting record schema")
    if fit.get("claim_ceiling") not in STATUSES:
        raise FitError("invalid claim ceiling")
    if not isinstance(fit.get("provenance"), dict) or not fit["provenance"]:
        raise FitError("provenance is required")
    for key in ("declarations", "observers", "rotations", "invariants", "confounds", "repairs", "closure", "conflicts", "iterations", "mutations"):
        if not isinstance(fit.get(key), list):
            raise FitError(f"{key} must be an array")
    for declaration in fit["declarations"]:
        if declaration.get("status") not in STATUSES:
            raise FitError("declaration has invalid status")
```

Create `research/fitting/fit-schema.json` containing the same enum values and required top-level keys. The JSON file is documentation/validation metadata; Python remains the executable validator so no third-party JSON Schema package is introduced.

- [ ] **Step 4: Run the core tests**

Run:

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: all Task 1 tests PASS.

- [ ] **Step 5: Commit the core**

```bash
git add research/fitting/fit_engine.py research/fitting/fit-schema.json research/fitting/test_fit_engine.py
git commit -m "feat(fitting): add deterministic fit record core"
```

---

### Task 2: Semantic Rotation and Explicit Loss/Remainder

**Files:**
- Modify: `research/fitting/fit_engine.py`
- Modify: `research/fitting/test_fit_engine.py`

**Interfaces:**
- Consumes: Task 1 fit dictionaries.
- Produces: `add_rotation(fit, *, rotation_id, source_view, target_view, disposition, remainder, provenance) -> dict`.
- Produces: `add_invariant(fit, *, invariant_id, statement, supported_by, status, provenance) -> dict`.

- [ ] **Step 1: Add failing rotation tests**

```python
def test_rotation_requires_remainder_when_meaning_is_lost(self):
    fit = self.base_fit()
    with self.assertRaises(engine.FitError):
        engine.add_rotation(
            fit, rotation_id="r1", source_view="human", target_view="formal",
            disposition="LOST", remainder="", provenance={"source": "test"},
        )


def test_rotation_preserves_source_and_target_without_mutating_input(self):
    fit = self.base_fit()
    out = engine.add_rotation(
        fit, rotation_id="r1", source_view="human", target_view="formal",
        disposition="TRANSFORMED", remainder="sensory context remains external",
        provenance={"source": "test"},
    )
    self.assertEqual(fit["rotations"], [])
    self.assertEqual(out["rotations"][0]["source_view"], "human")
    self.assertEqual(out["rotations"][0]["target_view"], "formal")
```

- [ ] **Step 2: Run and verify failure**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: missing `add_rotation`.

- [ ] **Step 3: Implement rotation and invariant append operations as pure-copy transitions**

Add to `fit_engine.py`:

```python
def _copy_fit(fit: dict) -> dict:
    validate_fit(fit)
    return copy.deepcopy(fit)


def add_rotation(fit: dict, *, rotation_id: str, source_view: str, target_view: str,
                 disposition: str, remainder: str, provenance: dict) -> dict:
    if disposition not in DISPOSITIONS:
        raise FitError("invalid rotation disposition")
    if disposition in {"LOST", "UNRESOLVED"} and not str(remainder).strip():
        raise FitError("loss/unresolved rotations require explicit remainder")
    out = _copy_fit(fit)
    out["rotations"].append({
        "id": rotation_id, "source_view": source_view, "target_view": target_view,
        "disposition": disposition, "remainder": remainder,
        "provenance": copy.deepcopy(provenance),
    })
    validate_fit(out)
    return out


def add_invariant(fit: dict, *, invariant_id: str, statement: str,
                  supported_by: list[str], status: str, provenance: dict) -> dict:
    if status not in STATUSES:
        raise FitError("invalid invariant status")
    out = _copy_fit(fit)
    out["invariants"].append({
        "id": invariant_id, "statement": statement,
        "supported_by": list(supported_by), "status": status,
        "provenance": copy.deepcopy(provenance),
    })
    validate_fit(out)
    return out
```

Extend `validate_fit` to validate every rotation disposition and every invariant status.

- [ ] **Step 4: Re-run tests**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/fit_engine.py research/fitting/test_fit_engine.py
git commit -m "feat(fitting): preserve semantic rotations and remainder"
```

---

### Task 3: Typed Confounds and Confounds-of-Confounds

**Files:**
- Modify: `research/fitting/fit_engine.py`
- Modify: `research/fitting/test_fit_engine.py`

**Interfaces:**
- Produces: `add_confound(fit, confound) -> dict`.
- Produces: `record_confound_interaction(fit, *, first_id, second_id, forward_outcome, reverse_outcome, provenance) -> dict`.
- The engine records a higher-order confound only when canonical normalized outcomes differ.

- [ ] **Step 1: Add failing confound interaction tests**

```python
def test_noncommuting_confound_interaction_creates_higher_order_confound(self):
    fit = self.base_fit()
    fit = engine.add_confound(fit, {
        "id": "c1", "source_scope": "basis", "target_scope": "operator",
        "distinction_at_risk": "representation vs object", "failure_mode": "basis dependence",
        "counterexample_or_test": "change basis", "repair_down": "minimal polynomial",
        "repair_up": "reconstruct matrices", "repair_sideways": "conjugate basis",
        "status": "CANDIDATE", "provenance": {"source": "test"},
    })
    fit = engine.add_confound(fit, {**fit["confounds"][0], "id": "c2", "source_scope": "ordering"})
    out = engine.record_confound_interaction(
        fit, first_id="c1", second_id="c2",
        forward_outcome={"rank": 2}, reverse_outcome={"rank": 3},
        provenance={"source": "test"},
    )
    self.assertEqual(len(out["confounds"]), 3)
    self.assertEqual(out["confounds"][-1]["order"], 1)


def test_commuting_confound_interaction_does_not_invent_new_confound(self):
    fit = self.base_fit()
    base = {
        "source_scope": "x", "target_scope": "y", "distinction_at_risk": "z",
        "failure_mode": "f", "counterexample_or_test": "t", "repair_down": "d",
        "repair_up": "u", "repair_sideways": "s", "status": "CANDIDATE",
        "provenance": {"source": "test"},
    }
    fit = engine.add_confound(fit, {**base, "id": "c1"})
    fit = engine.add_confound(fit, {**base, "id": "c2"})
    out = engine.record_confound_interaction(
        fit, first_id="c1", second_id="c2",
        forward_outcome={"v": [1, 2]}, reverse_outcome={"v": [1, 2]},
        provenance={"source": "test"},
    )
    self.assertEqual(len(out["confounds"]), 2)
```

- [ ] **Step 2: Run and verify failure**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: missing confound functions.

- [ ] **Step 3: Implement typed confounds and interaction recording**

`add_confound` must require exactly these semantic fields: `id`, `source_scope`, `target_scope`, `distinction_at_risk`, `failure_mode`, `counterexample_or_test`, `repair_down`, `repair_up`, `repair_sideways`, `status`, and `provenance`. Reject duplicate IDs.

`record_confound_interaction` must locate both IDs, compare `canonical_json(forward_outcome)` with `canonical_json(reverse_outcome)`, and when they differ append:

```python
{
    "id": f"confound:{first_id}:{second_id}",
    "order": max(first.get("order", 0), second.get("order", 0)) + 1,
    "parents": [first_id, second_id],
    "source_scope": "confound-interaction",
    "target_scope": "normalized-outcome",
    "distinction_at_risk": "operation-order independence",
    "failure_mode": "confounds do not commute",
    "counterexample_or_test": {
        "forward": forward_outcome,
        "reverse": reverse_outcome,
    },
    "repair_down": "identify the smallest invariant shared by both operation orders",
    "repair_up": "reconstruct both orders from the shared invariant",
    "repair_sideways": "repeat the interaction under an alternate representation",
    "status": "UNRESOLVED",
    "provenance": provenance,
}
```

- [ ] **Step 4: Run tests**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/fit_engine.py research/fitting/test_fit_engine.py
git commit -m "feat(fitting): add recursive confound records"
```

---

### Task 4: Repairs, Deductive Closure, and Contradiction Isolation

**Files:**
- Modify: `research/fitting/fit_engine.py`
- Modify: `research/fitting/test_fit_engine.py`

**Interfaces:**
- Produces: `add_repair(fit, *, repair_id, direction, parents, invariant, outcome, status, provenance) -> dict`.
- Produces: `derive_closure_item(fit, *, item_id, claim_key, claim, polarity, parents, rule, assumptions, view, status, provenance) -> dict`.

- [ ] **Step 1: Add failing repair and contradiction tests**

```python
def test_repair_cannot_exceed_fit_claim_ceiling(self):
    fit = self.base_fit()
    with self.assertRaises(engine.FitError):
        engine.add_repair(
            fit, repair_id="repair-1", direction="down", parents=[],
            invariant="x", outcome="y", status="SOURCE_VERIFIED",
            provenance={"source": "test"},
        )


def test_opposite_closure_polarities_create_conflict_without_deleting_either_branch(self):
    fit = self.base_fit()
    fit = engine.derive_closure_item(
        fit, item_id="a", claim_key="P", claim="P", polarity=True,
        parents=[], rule="input", assumptions=[], view="formal",
        status="CANDIDATE", provenance={"source": "A"},
    )
    out = engine.derive_closure_item(
        fit, item_id="b", claim_key="P", claim="not P", polarity=False,
        parents=[], rule="input", assumptions=[], view="formal",
        status="CANDIDATE", provenance={"source": "B"},
    )
    self.assertEqual(len(out["closure"]), 2)
    self.assertEqual(len(out["conflicts"]), 1)
    self.assertEqual(out["conflicts"][0]["claim_key"], "P")
```

- [ ] **Step 2: Run and verify failure**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

- [ ] **Step 3: Implement repair/closure transitions and a conservative status ceiling**

Add an explicit status ordering used only to prevent self-promotion:

```python
STATUS_STRENGTH = {
    "REJECTED": 0, "UNRESOLVED": 0, "CONTRADICTION": 0,
    "HYPOTHESIS": 1, "CANDIDATE": 1, "OBSERVED": 2,
    "NEGATIVE_RESULT": 2, "COMPUTATIONALLY_VERIFIED_BOUNDED": 3,
    "FORMAL_CONSEQUENCE": 3, "SOURCE_VERIFIED": 4,
}
```

A transition status may be no stronger than `fit["claim_ceiling"]`. This is a fitting-engine admission ceiling only; it does not claim that every status has a universal epistemic ordering outside this subsystem.

`derive_closure_item` must append the new item, search existing closure entries with the same `claim_key` and opposite `polarity`, and append one conflict record containing both item IDs. It must never delete either closure branch or infer arbitrary additional claims.

- [ ] **Step 4: Run tests**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/fit_engine.py research/fitting/test_fit_engine.py
git commit -m "feat(fitting): add repairs and provenance-preserving closure"
```

---

### Task 5: Fixed-Point Detection and One-Degree Mutation Gate

**Files:**
- Modify: `research/fitting/fit_engine.py`
- Modify: `research/fitting/test_fit_engine.py`

**Interfaces:**
- Produces: `state_digest(fit) -> str` excluding `iterations` and `mutations` from the compared research state.
- Produces: `record_iteration(fit, *, iteration_id, previous_digest, new_items, provenance) -> dict`.
- Produces: `request_one_degree_mutation(fit, *, mutation_id, degree, before, after, provenance) -> dict`.

- [ ] **Step 1: Add fixed-point and mutation tests**

```python
def test_one_degree_mutation_is_blocked_before_fixed_point(self):
    fit = self.base_fit()
    with self.assertRaises(engine.FitError):
        engine.request_one_degree_mutation(
            fit, mutation_id="m1", degree="observer-count", before=5, after=6,
            provenance={"source": "test"},
        )


def test_fixed_point_requires_same_digest_and_zero_new_items(self):
    fit = self.base_fit()
    digest = engine.state_digest(fit)
    fit = engine.record_iteration(
        fit, iteration_id="i1", previous_digest=digest, new_items=0,
        provenance={"source": "test"},
    )
    self.assertEqual(fit["iterations"][-1]["fixed_point"], True)
    out = engine.request_one_degree_mutation(
        fit, mutation_id="m1", degree="observer-count", before=5, after=6,
        provenance={"source": "test"},
    )
    self.assertEqual(out["mutations"][-1]["degree"], "observer-count")
```

- [ ] **Step 2: Run and verify failure**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

- [ ] **Step 3: Implement fixed-point and mutation rules**

`state_digest` must hash a canonical copy containing `subject`, `claim_ceiling`, `declarations`, `observers`, `rotations`, `invariants`, `confounds`, `repairs`, `closure`, and `conflicts`, while excluding iteration/mutation history.

`record_iteration` computes the current digest. It sets `fixed_point = (previous_digest == current_digest and new_items == 0)`. Negative `new_items` is invalid.

`request_one_degree_mutation` requires at least one prior iteration with `fixed_point is True`, requires exactly one non-empty `degree` string, requires `canonical_json(before) != canonical_json(after)`, and appends only that named degree change.

- [ ] **Step 4: Run tests**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/fit_engine.py research/fitting/test_fit_engine.py
git commit -m "feat(fitting): gate one-degree experiments on fixed points"
```

---

### Task 6: FIT-00 Through FIT-15 Variant Registry

**Files:**
- Create: `research/fitting/variant_registry.py`
- Create: `research/fitting/test_variant_registry.py`
- Create: all 16 JSON files under `research/fitting/variants/`.

**Interfaces:**
- Produces: `load_variants(directory: Path) -> dict[str, dict]`.
- Produces: `get_variant(variant_id: str, directory: Path | None = None) -> dict`.
- Every variant JSON uses schema `conscience64/fitting-variant/v1` and fields `id`, `name`, `operators`, `success_criteria`, `claim_boundary`.

- [ ] **Step 1: Add failing registry completeness test**

```python
import importlib.util
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("variant_registry", HERE / "variant_registry.py")
registry = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(registry)


class VariantRegistryTests(unittest.TestCase):
    def test_registry_contains_exactly_fit_00_through_fit_15(self):
        items = registry.load_variants(HERE / "variants")
        self.assertEqual(set(items), {f"FIT-{i:02d}" for i in range(16)})
        for key, value in items.items():
            self.assertEqual(value["id"], key)
            self.assertEqual(value["claim_boundary"], "FIT != TRUTH")
```

- [ ] **Step 2: Run and verify failure**

```bash
python3 -m unittest research/fitting/test_variant_registry.py -v
```

- [ ] **Step 3: Implement registry loader and exact variant definitions**

Use this mapping for the 16 files:

| ID | Name | Operators | Success criterion |
|---|---|---|---|
| FIT-00 | Invariant Fit | rotate, reconstruct, compare | at least one explicitly supported invariant survives all declared rotations |
| FIT-01 | Multi-Eye Fit | observe, compare | observer agreements and disagreements are both recorded |
| FIT-02 | Confound Fit | enumerate-confounds | each consequential assumption has a test or unresolved marker |
| FIT-03 | Recursive Confound Fit | compose-confounds, normalize | noncommuting confounds become higher-order records |
| FIT-04 | Downward Repair | reduce | smallest still-supported invariant is explicit |
| FIT-05 | Upward Repair | reconstruct | consequences reconstruct without exceeding claim ceiling |
| FIT-06 | Sideways Repair | transport | preserved/transformed/lost distinctions are explicit across carrier change |
| FIT-07 | Closure Fit | derive, conflict-isolate | all admitted derived items retain parents/rule/assumptions |
| FIT-08 | Counter-Fit | near-match, falsify | at least one named alternative is actively tested |
| FIT-09 | One-Degree Escape | mutate-one-degree | exactly one consequential degree changes after fixed point |
| FIT-10 | Population Fit | branch, compare | divergent variants remain attributable without winner promotion |
| FIT-11 | Historical Fit | reconstruct-prior-state | prior state is reconstructible without retrospective rewrite |
| FIT-12 | Executable Fit | operationalize | methodology is executable without inventing undeclared parameters |
| FIT-13 | Human Fit | preserve-lived-meaning | lived/human meaning remains distinct from procedural representation |
| FIT-14 | Adversarial Fit | reverse, reorder, boundary-attack | declared invariant survives or failure is recorded |
| FIT-15 | Minimal Sufficient Fit | ablate, reconstruct | smallest tested distinction set reconstructs the supported state |

`variant_registry.py` must reject duplicate IDs, unknown schema, missing operators, empty success criteria, and any claim boundary other than `FIT != TRUTH`.

- [ ] **Step 4: Run tests**

```bash
python3 -m unittest research/fitting/test_variant_registry.py -v
```

Expected: PASS with exactly 16 variants.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/variant_registry.py research/fitting/test_variant_registry.py research/fitting/variants
git commit -m "feat(fitting): add FIT-00 through FIT-15 variants"
```

---

### Task 7: Hodge Adapter With Non-Promotion Boundary

**Files:**
- Create: `research/fitting/adapters/hodge.json`
- Create: `research/fitting/examples/hodge-confound-first.json`
- Modify: `research/fitting/test_fit_engine.py`
- Modify: `research/projects/hodge-conjecture.md`

**Interfaces:**
- Adapter schema: `conscience64/fitting-adapter/v1`.
- Required adapter fields: `domain`, `project_status`, `claim_ceiling`, `self_promotion_allowed`, `observers`, `confounds`, `forbidden_claims`.

- [ ] **Step 1: Add failing adapter-boundary test**

```python
def test_hodge_adapter_cannot_self_promote_to_proof(self):
    from pathlib import Path
    import json
    adapter = json.loads((HERE / "adapters/hodge.json").read_text(encoding="utf-8"))
    self.assertEqual(adapter["project_status"], "ACTIVE_OPEN_PROBLEM_RESEARCH_WITH_STRICT_CLAIM_CEILING")
    self.assertEqual(adapter["claim_ceiling"], "CANDIDATE")
    self.assertFalse(adapter["self_promotion_allowed"])
    self.assertIn("Hodge conjecture proved", adapter["forbidden_claims"])
```

- [ ] **Step 2: Run and verify failure because the adapter is absent**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
```

- [ ] **Step 3: Create the adapter and bounded example**

`hodge.json` must declare these five observers:

```text
geometry/object
evidence/observation
structure/relation
change/deformation
adversarial/confound
```

It must include at least these confounds already explicit in the Hodge project record:

```text
same Hodge diamond != same rational Hodge classes
symmetry != useful quotient
cycle count != cycle-class rank
finite computation != universal proof
projection loss != equality in source space
```

Set `claim_ceiling` to `CANDIDATE`, not `SOURCE_VERIFIED`, so the adapter itself can never manufacture a stronger Hodge claim.

Create `examples/hodge-confound-first.json` as a fitting record whose subject is `Hodge candidate research method demonstration`, whose provenance points to `research/projects/hodge-conjecture.md`, and whose declarations explicitly include `FITTING_RESULT != HODGE_PROOF` and `CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE`. The example may contain a confound and a repair but must not contain `proved`, `solved`, or a promoted Hodge theorem claim.

Append to `research/projects/hodge-conjecture.md` a short section:

```markdown
### Fitting Lab method adapter

`research/fitting/adapters/hodge.json` encodes a reusable confound/repair method for Hodge research. It is generator and research-control machinery only.

`FITTING_RESULT != HODGE_PROOF`

The adapter cannot promote the project above its existing `OPEN` claim ceiling; any mathematical promotion still requires the project's source, computation, family-level and proof-admission gates.
```

- [ ] **Step 4: Run tests and grep the example for prohibited promotion**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
! grep -Eqi 'hodge conjecture (is )?(proved|solved)' research/fitting/examples/hodge-confound-first.json
```

Expected: tests PASS; grep command exits success because the prohibited phrase is absent.

- [ ] **Step 5: Commit**

```bash
git add research/fitting/adapters/hodge.json research/fitting/examples/hodge-confound-first.json research/fitting/test_fit_engine.py research/projects/hodge-conjecture.md
git commit -m "feat(fitting): add claim-bounded Hodge adapter"
```

---

### Task 8: Documentation and CI Gate

**Files:**
- Create: `research/fitting/README.md`
- Create: `research/fitting/FIT_CONTRACT.md`
- Create: `.github/workflows/fitting-check.yml`

**Interfaces:**
- CI must materialize exact `GITHUB_SHA` directly with Git, matching the repository's action-free verification pattern.
- CI command contract: both unittest files plus JSON parse checks plus example claim-boundary grep.

- [ ] **Step 1: Write the documentation contract before CI**

`README.md` must include:

```text
FIT != TRUTH
SEMANTIC_ROTATION != SEMANTIC_MUTATION
one-degree mutation requires a recorded fixed point
repairs preserve lineage and cannot promote evidence
```

and these commands:

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
python3 -m unittest research/fitting/test_variant_registry.py -v
python3 -m json.tool research/fitting/fit-schema.json >/dev/null
python3 -m json.tool research/fitting/adapters/hodge.json >/dev/null
```

`FIT_CONTRACT.md` must document every public engine function introduced in Tasks 1-5, its input fields, failure conditions, and whether it mutates input (none do).

- [ ] **Step 2: Create a fitting-specific workflow with exact-commit materialization**

Create `.github/workflows/fitting-check.yml`:

```yaml
name: Fitting Lab check

on:
  pull_request:
    paths:
      - 'research/fitting/**'
      - 'research/projects/hodge-conjecture.md'
      - '.github/workflows/fitting-check.yml'
  push:
    branches: [main]
    paths:
      - 'research/fitting/**'
      - 'research/projects/hodge-conjecture.md'
      - '.github/workflows/fitting-check.yml'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Materialize exact commit
        shell: bash
        run: |
          set -euo pipefail
          git init "$GITHUB_WORKSPACE"
          cd "$GITHUB_WORKSPACE"
          git remote add origin "https://github.com/${GITHUB_REPOSITORY}.git"
          git fetch --depth=1 origin "$GITHUB_SHA"
          git checkout --detach FETCH_HEAD
          test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
      - name: Verify Fitting Lab contracts
        shell: bash
        run: |
          set -euo pipefail
          python3 -m unittest research/fitting/test_fit_engine.py -v
          python3 -m unittest research/fitting/test_variant_registry.py -v
          python3 -m json.tool research/fitting/fit-schema.json >/dev/null
          python3 -m json.tool research/fitting/adapters/hodge.json >/dev/null
          ! grep -Eqi 'hodge conjecture (is )?(proved|solved)' research/fitting/examples/hodge-confound-first.json
```

- [ ] **Step 3: Run the complete local verification suite**

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
python3 -m unittest research/fitting/test_variant_registry.py -v
python3 -m json.tool research/fitting/fit-schema.json >/dev/null
python3 -m json.tool research/fitting/adapters/hodge.json >/dev/null
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit documentation and CI**

```bash
git add research/fitting/README.md research/fitting/FIT_CONTRACT.md .github/workflows/fitting-check.yml
git commit -m "ci(fitting): verify fit contracts and claim ceilings"
```

---

## Final Verification

Run:

```bash
python3 -m unittest research/fitting/test_fit_engine.py -v
python3 -m unittest research/fitting/test_variant_registry.py -v
python3 -m json.tool research/fitting/fit-schema.json >/dev/null
python3 -m json.tool research/fitting/adapters/hodge.json >/dev/null
! grep -R -Eqi 'FITTING_RESULT *= *HODGE_PROOF|hodge conjecture (is )?(proved|solved)' research/fitting
```

Then inspect `git diff --check` and confirm that the only modification outside `research/fitting/` is the bounded Hodge method pointer and the dedicated workflow.

**Completion criterion:** Fitting Lab records are deterministic and reconstructible; semantic loss is explicit; confounds and higher-order confounds remain typed; repairs and closure preserve provenance; contradictions remain isolated; FIT-09 cannot execute before a fixed point; all 16 variants load deterministically; and the Hodge adapter cannot self-promote a mathematical claim.
