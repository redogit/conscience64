#!/usr/bin/env python3
"""Check the compact Conscience64 REDOGIT source surface without CI."""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "research" / "cross-carrier" / "2026-09-12" / "v2.2"
PYTHON_FILES = (
    ROOT / "tools" / "verify_research_manifest.py",
    SURFACE / "cross_carrier_float64_space_codec.py",
    SURFACE / "search_float64_space.py",
)
JSON_FILES = (
    SURFACE / "coordinate_schema.json",
    SURFACE / "lookup_selfcheck.json",
    SURFACE / "manifest.json",
    SURFACE / "validation.json",
)


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

    for path in JSON_FILES:
        try:
            json.loads(path.read_text(encoding="utf-8"))
            print(f"PASS json   {path.relative_to(ROOT)}")
        except Exception as exc:
            failures += 1
            print(f"FAIL json   {path.relative_to(ROOT)}: {exc}", file=sys.stderr)

    if failures:
        print(f"REDOGIT self-check failed: {failures} surface(s)", file=sys.stderr)
        return 1

    print("REDOGIT self-check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
