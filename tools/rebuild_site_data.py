#!/usr/bin/env python3
"""Rebuild the compact browser transport from the verified original Pages ZIP."""

import argparse
import base64
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_SHA256 = "76e74cd203b5066cfd28d5f404e6b9ee8d99bcb48eb4a3322c895ff0037be738"
SOURCE_ENTRY = "conscience64/space-index.json"
SOURCE_SHA256 = "1f174fc2ca64c42dd94a72ec02396b78db80158a8e14fc499692ee9c02b000fa"
FIELDS = set("""uoid objectType logicalId label description kind data authority
category degree domain nonstem_tags time_layer basis relation source sourceUoid
target targetUoid provenance""".split())
SHARD_BYTES = 20_000


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    archive = args.archive.read_bytes()
    if sha256(archive) != ARCHIVE_SHA256:
        parser.error("archive SHA-256 does not match the original Pages package")
    with zipfile.ZipFile(args.archive) as package:
        source_bytes = package.read(SOURCE_ENTRY)
    if sha256(source_bytes) != SOURCE_SHA256:
        parser.error("space-index.json SHA-256 does not match the original source")
    source = json.loads(source_bytes)
    manifest_path = ROOT / "data-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if source["spaceUoid"] != manifest["corpusUoid"]:
        parser.error("source and transport corpus identities differ")
    if source["recordCount"] != 734 or len(source["records"]) != 734:
        parser.error("original source must contain all 734 records")

    # Keep search/display fields and original identifiers. Packaging metadata and
    # embedded microdata stay in the source; app.js generates microdata on demand.
    records = [{k: v for k, v in r.items() if k in FIELDS} for r in source["records"]]
    decoded = json.dumps(records, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    compressed = bytearray(gzip.compress(decoded, compresslevel=9, mtime=0))
    compressed[9] = 255  # Stable gzip OS header across supported Python versions.
    encoded = base64.b64encode(compressed)
    chunks = [encoded[i:i + SHARD_BYTES] for i in range(0, len(encoded), SHARD_BYTES)]
    shards = []
    for i, chunk in enumerate(chunks + [b""]):
        path = f"data-{i:02}.txt"
        (ROOT / path).write_bytes(chunk)
        blob_header = f"blob {len(chunk)}\0".encode("ascii")
        shards.append({
            "path": path, "bytes": len(chunk),
            "gitBlobSha": hashlib.sha1(blob_header + chunk).hexdigest(),
            "sha256": sha256(chunk),
            "state": "PAYLOAD" if chunk else "RESERVED_CONTINUATION",
        })
    manifest.update({
        "shards": shards,
        "recordCount": len(records),
        "objectTypes": dict(sorted(Counter(r["objectType"] for r in records).items())),
        "decodedBytes": len(decoded),
        "decodedSha256": sha256(decoded),
        "source": {
            "archive": "CONSCIENCE64_GITHUB_PAGES_READY.zip",
            "archiveSha256": ARCHIVE_SHA256,
            "entry": SOURCE_ENTRY,
            "entrySha256": SOURCE_SHA256,
        },
        "projection": {
            "schema": "conscience64/browser-projection/v1",
            "retainedFields": sorted(FIELDS),
            "identity": "Original source UOIDs are retained; decodedSha256 identifies the projected browser bytes separately.",
            "microdata": "Generated on demand by app.js; full source metadata remains in the original package.",
        },
        "recovery": {
            "predecessorCommit": "788326bd403679f537c766bdf8ee8168e0d83535",
            "reason": "The predecessor transport had malformed identifiers and an invalid gzip stream. Regenerated from the verified original source, not from guessed continuation bytes.",
            "recordLineage": "All 734 original logical IDs and UOIDs are retained. The newer research project registry is a separate carrier.",
        },
    })
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Rebuilt {len(records)} records in {len(chunks)} payload shards; decoded SHA-256 {sha256(decoded)}")


if __name__ == "__main__":
    main()
