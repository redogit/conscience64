#!/usr/bin/env python3
"""Verify the current Conscience64 research-project registry and learned invariants."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "research" / "projects" / "projects.json"
FUZZBALL_PATH = ROOT / "research" / "history" / "recovery-gaps" / "FUZZBALL_RESEARCH.md"
ORPHAN_MAP_PATH = ROOT / "research" / "history" / "ORPHAN_PROJECT_RECOVERY_MAP.md"

REQUIRED_INVARIANTS = {
    "UNKNOWN != ABSENT",
    "UNASSIGNED != ABSENT",
    "RELATED != SUPPORTS",
    "SEMANTIC_SIMILARITY != IDENTITY",
    "SOURCE != RECONSTRUCTION",
    "BYTE_IDENTITY != SEMANTIC_TRUTH",
    "CURRENT_NAVIGATION != HISTORICAL_SOURCE",
    "MECHANISM_ACTIVE != MECHANISM_USEFUL",
    "MECHANISM_USEFUL != MECHANISM_CAUSAL",
    "CALIBRATION_RESULT != OPEN_PROBLEM_RESULT",
    "FINITE_VERIFICATION != UNIVERSALITY",
    "REPRESENTATION_CORRECTNESS != PHYSICAL_TRUTH",
    "LOSS_ACKNOWLEDGED != LOSS_CONCEALED",
}

REQUIRED_TRANSFORM_STATES = {
    "PRESERVED",
    "TRANSFORMED",
    "SPLIT",
    "MERGED",
    "INTRODUCED",
    "LOST",
    "UNRESOLVED",
}

REQUIRED_PROJECTS = {
    "cross-carrier-wave",
    "orbit-library",
    "tiny-babel-tbcl",
    "operator-moonshot",
    "model-experiments",
    "geometry-codecs",
    "historical-recovery",
}


def load_registry() -> dict:
    data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    if data.get("schema") != "conscience64/research-project-registry/v1":
        raise AssertionError("wrong project registry schema")
    if data.get("forwardOnly") is not True:
        raise AssertionError("project registry must be forward-only")
    return data


def verify_registry(data: dict) -> None:
    invariants = set(data.get("learnedInvariants", []))
    missing = REQUIRED_INVARIANTS - invariants
    if missing:
        raise AssertionError(f"missing learned invariants: {sorted(missing)}")

    states = set(data.get("transformStates", []))
    if states != REQUIRED_TRANSFORM_STATES:
        raise AssertionError(
            f"transform states differ: expected={sorted(REQUIRED_TRANSFORM_STATES)} got={sorted(states)}"
        )

    policy = data.get("evidencePolicy") or {}
    for key in (
        "preserveFailures",
        "preservePredecessors",
        "preserveUnresolvedRemainder",
        "replicateBeforePromotionWhenApplicable",
        "preferExactIdentityBeforeSemanticRetrieval",
        "sourceNativeBeforeCrossProjectReuse",
        "oneDegreeExperimentWhenPractical",
    ):
        if policy.get(key) is not True:
            raise AssertionError(f"evidencePolicy.{key} must be true")

    projects = data.get("projects")
    if not isinstance(projects, list) or not projects:
        raise AssertionError("projects must be a non-empty list")

    by_id = {}
    for project in projects:
        pid = project.get("id")
        if not isinstance(pid, str) or not pid:
            raise AssertionError("project id missing")
        if pid in by_id:
            raise AssertionError(f"duplicate project id: {pid}")
        by_id[pid] = project

        for field in ("name", "status", "path", "I", "R", "P", "O", "highlight", "lowlight", "claimCeiling"):
            value = project.get(field)
            if not isinstance(value, str) or not value.strip():
                raise AssertionError(f"{pid}.{field} must be non-empty text")

        checks = project.get("checks")
        if not isinstance(checks, dict):
            raise AssertionError(f"{pid}.checks must be an object")
        for field in ("assumption", "test", "unknown"):
            if not isinstance(checks.get(field), str) or not checks[field].strip():
                raise AssertionError(f"{pid}.checks.{field} must be non-empty text")

        project_path = ROOT / project["path"]
        if not project_path.is_file():
            raise AssertionError(f"missing project document: {project['path']}")

    missing_projects = REQUIRED_PROJECTS - set(by_id)
    if missing_projects:
        raise AssertionError(f"missing required projects: {sorted(missing_projects)}")

    recovery = by_id["historical-recovery"]
    recovery_text = json.dumps(recovery, sort_keys=True).lower()
    if "fuzzball" not in recovery_text or "unresolved" not in recovery_text:
        raise AssertionError("historical-recovery must preserve Fuzzball as unresolved")


def verify_recovery_corrections() -> None:
    fuzzball = FUZZBALL_PATH.read_text(encoding="utf-8")
    if "not related to black-hole/fuzzball physics" not in fuzzball:
        raise AssertionError("Fuzzball correction boundary missing")
    if "UNKNOWN != ABSENT" not in fuzzball:
        raise AssertionError("Fuzzball unknown/absence distinction missing")

    orphan = ORPHAN_MAP_PATH.read_text(encoding="utf-8")
    if "FractalDeflectiveEngine" not in orphan:
        raise AssertionError("FractalDeflectiveEngine predecessor recovery missing")
    if "GrandUnifiedPerceptron" not in orphan:
        raise AssertionError("GrandUnifiedPerceptron predecessor recovery missing")
    if "identity_with_fuzzball: UNRESOLVED" not in orphan:
        raise AssertionError("orphan/Fuzzball non-equivalence boundary missing")


def main() -> int:
    data = load_registry()
    verify_registry(data)
    verify_recovery_corrections()
    print(
        "PASS project registry "
        f"projects={len(data['projects'])} "
        f"invariants={len(data['learnedInvariants'])} "
        f"transform_states={len(data['transformStates'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
