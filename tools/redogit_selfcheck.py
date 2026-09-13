#!/usr/bin/env python3
"""Verify the compact Conscience64 REDOGIT repository surface."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "research" / "cross-carrier" / "2026-09-12" / "v2.2"
REPOSITORY_MANIFEST = SURFACE / "repository_manifest.json"
PROJECT_REGISTRY = ROOT / "research" / "projects" / "projects.json"
PROJECT_CHECK = ROOT / "tools" / "check_project_registry.py"
V5_RESULT = SURFACE / "sql" / "SYMMETRY_AWARE_CONSTRUCTION_V5_RESULTS.json"
COMPACT_MAXCUT_CERT = SURFACE / "selection" / "HIGHGIRTH20_COMPACT_MAXCUT28_CERT.min.json"
PYTHON_FILES = (
    ROOT / "tools" / "verify_research_manifest.py",
    PROJECT_CHECK,
    SURFACE / "cross_carrier_float64_space_codec.py",
    SURFACE / "search_float64_space.py",
    SURFACE / "sql" / "partial_translation_stabilizer.py",
    SURFACE / "selection" / "verify_compact_maxcut28_min.py",
)
JSON_FILES = (
    ROOT / "redogit.json",
    PROJECT_REGISTRY,
    SURFACE / "coordinate_schema.json",
    SURFACE / "lookup_selfcheck.json",
    SURFACE / "manifest.json",
    REPOSITORY_MANIFEST,
    SURFACE / "validation.json",
    SURFACE / "sql" / "SQL_V2_RESULTS_2026-09-12.json",
    SURFACE / "sql" / "SQL_V3_COST_RESULTS_2026-09-12.json",
    SURFACE / "sql" / "PARTIAL_TRANSLATION_STABILIZER_LEMMA_CHECK.json",
    SURFACE / "sql" / "STABILIZER_AGGREGATE_WALSH_CHECK.json",
    SURFACE / "sql" / "CONSTRUCTION_COST_RESULTS_2026-09-12.json",
    V5_RESULT,
    COMPACT_MAXCUT_CERT,
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    failures = 0

    for path in PYTHON_FILES:
        try:
            source = path.read_text(encoding="utf-8")
            compile(source, str(path), "exec")
            print(f"PASS python {path.relative_to(ROOT)}")
        except Exception as exc:
            failures += 1
            print(f"FAIL python {path.relative_to(ROOT)}: {exc}", file=sys.stderr)

    parsed_json: dict[Path, object] = {}
    for path in JSON_FILES:
        try:
            parsed_json[path] = json.loads(path.read_text(encoding="utf-8"))
            print(f"PASS json   {path.relative_to(ROOT)}")
        except Exception as exc:
            failures += 1
            print(f"FAIL json   {path.relative_to(ROOT)}: {exc}", file=sys.stderr)

    try:
        contract = parsed_json[ROOT / "redogit.json"]
        assert isinstance(contract, dict)
        assert contract.get("schema") == "redogit/v1"
        assert contract.get("repository") == "redogit/conscience64"
        history = contract.get("history_policy")
        assert isinstance(history, dict)
        assert history.get("preserve_predecessors") is True
        assert history.get("preserve_failures") is True
        assert history.get("rewrite_history") is False
        print("PASS contract redogit/v1 history policy")
    except Exception as exc:
        failures += 1
        print(f"FAIL contract: {exc}", file=sys.stderr)

    try:
        registry = parsed_json[PROJECT_REGISTRY]
        assert isinstance(registry, dict)
        assert registry.get("schema") == "conscience64/research-project-registry/v1"
        assert registry.get("forwardOnly") is True
        assert isinstance(registry.get("projects"), list) and registry["projects"]
        assert isinstance(registry.get("learnedInvariants"), list) and registry["learnedInvariants"]
        print("PASS current project registry surface")
    except Exception as exc:
        failures += 1
        print(f"FAIL project registry surface: {exc}", file=sys.stderr)

    try:
        result = subprocess.run(
            [sys.executable, str(PROJECT_CHECK)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError((result.stderr or result.stdout).strip())
        print(result.stdout.strip())
    except Exception as exc:
        failures += 1
        print(f"FAIL learned-project invariants: {exc}", file=sys.stderr)

    try:
        v5 = parsed_json[V5_RESULT]
        assert isinstance(v5, dict)
        assert v5.get("status") == "BOUNDED_FINITE_RESULT_WITH_STRUCTURAL_SELECTOR"
        assert v5.get("p_vs_np") == "OPEN"
        assert v5.get("oracle_functions") == 3310
        selector = v5.get("structural_selector")
        assert isinstance(selector, dict)
        assert selector.get("selected_translation_n4") == 15
        assert selector.get("requires_circuit_class_scan") is False
        planning = v5.get("planning_result")
        assert isinstance(planning, dict)
        assert planning.get("generic_word_ops") == 2912
        assert planning.get("selected_word_ops") == 2080
        assert planning.get("generic_observations") == 5
        assert planning.get("selected_observations") == 8
        print("PASS SQL v5 bounded-result invariants")
    except Exception as exc:
        failures += 1
        print(f"FAIL SQL v5 invariants: {exc}", file=sys.stderr)

    try:
        cert = parsed_json[COMPACT_MAXCUT_CERT]
        assert isinstance(cert, dict)
        assert cert.get("v") == 1
        assert cert.get("n") == 20
        edges = cert.get("e")
        deleted = cert.get("d")
        cycles = cert.get("c")
        assert isinstance(edges, list) and len(edges) == 30
        assert isinstance(deleted, list) and len(deleted) == 2
        assert isinstance(cycles, list) and [len(c) for c in cycles] == [7, 7, 9]
        assert cert.get("mc") == 28
        print("PASS compact Max-Cut successor-certificate invariants")
    except Exception as exc:
        failures += 1
        print(f"FAIL compact Max-Cut certificate: {exc}", file=sys.stderr)

    try:
        repo_manifest = parsed_json[REPOSITORY_MANIFEST]
        assert isinstance(repo_manifest, dict)
        assert repo_manifest.get("schema") == "conscience64/repository-surface-manifest/v1"
        assert repo_manifest.get("scope") == "compact repository surface"
        assert repo_manifest.get("source_package_manifest") == "manifest.json"
        files = repo_manifest.get("files")
        assert isinstance(files, list) and files
        print("PASS repository/source-package manifest separation")

        for entry in files:
            assert isinstance(entry, dict)
            relative = Path(str(entry["file"]))
            path = SURFACE / relative
            expected_bytes = int(entry["bytes"])
            expected_sha = str(entry["sha256"]).lower()
            if not path.is_file():
                raise FileNotFoundError(relative)
            actual_bytes = path.stat().st_size
            actual_sha = sha256(path)
            if actual_bytes != expected_bytes or actual_sha != expected_sha:
                raise ValueError(
                    f"{relative}: expected bytes={expected_bytes} sha256={expected_sha}; "
                    f"got bytes={actual_bytes} sha256={actual_sha}"
                )
            print(f"PASS bytes  {relative} bytes={actual_bytes} sha256={actual_sha}")
    except Exception as exc:
        failures += 1
        print(f"FAIL repository manifest: {exc}", file=sys.stderr)

    if failures:
        print(f"REDOGIT self-check failed: {failures} surface(s)", file=sys.stderr)
        return 1

    print("REDOGIT self-check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
