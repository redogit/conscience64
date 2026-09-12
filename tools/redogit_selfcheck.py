#!/usr/bin/env python3
"""Verify the compact Conscience64 REDOGIT repository surface."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "research" / "cross-carrier" / "2026-09-12" / "v2.2"
REPOSITORY_MANIFEST = SURFACE / "repository_manifest.json"
PYTHON_FILES = (
    ROOT / "tools" / "verify_research_manifest.py",
    SURFACE / "cross_carrier_float64_space_codec.py",
    SURFACE / "search_float64_space.py",
    SURFACE / "sql" / "partial_translation_stabilizer.py",
)
JSON_FILES = (
    ROOT / "redogit.json",
    SURFACE / "coordinate_schema.json",
    SURFACE / "lookup_selfcheck.json",
    SURFACE / "manifest.json",
    REPOSITORY_MANIFEST,
    SURFACE / "validation.json",
    SURFACE / "sql" / "SQL_V2_RESULTS_2026-09-12.json",
    SURFACE / "sql" / "SQL_V3_COST_RESULTS_2026-09-12.json",
    SURFACE / "sql" / "PARTIAL_TRANSLATION_STABILIZER_LEMMA_CHECK.json",
    SURFACE / "sql" / "STABILIZER_AGGREGATE_WALSH_CHECK.json",
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
