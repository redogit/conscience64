#!/usr/bin/env python3
"""Verify byte size and SHA-256 entries in a Conscience64 research manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("root", type=Path, nargs="?", default=Path("."))
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    failures = 0

    for entry in manifest.get("files", []):
        relative = Path(entry["file"])
        path = args.root / relative

        if not path.is_file():
            print(f"MISSING {relative}")
            failures += 1
            continue

        actual_bytes = path.stat().st_size
        actual_sha = sha256(path)
        expected_bytes = int(entry["bytes"])
        expected_sha = str(entry["sha256"]).lower()

        bytes_ok = actual_bytes == expected_bytes
        hash_ok = actual_sha == expected_sha
        status = "PASS" if bytes_ok and hash_ok else "FAIL"
        print(f"{status} {relative} bytes={actual_bytes} sha256={actual_sha}")

        if not bytes_ok or not hash_ok:
            failures += 1

    if failures:
        print(f"verification failed: {failures} file(s)", file=sys.stderr)
        return 1

    print("verification passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
