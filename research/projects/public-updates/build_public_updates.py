#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
from typing import Any

ADMISSIONS_SCHEMA = "conscience64/public-update-admissions/v1"
RECORD_SCHEMA = "conscience64/public-research-update/v1"
SNAPSHOT_SCHEMA = "conscience64/public-research-updates/v1"
ALLOWED_CLASSIFICATIONS = {"public", "private"}
ALLOWED_SOURCE_PREFIXES = (
    "research/updates/",
    "research/projects/",
    "coordinate-space/",
    "analytics/",
    "play/",
)


class PublicationError(ValueError):
    pass


def canonical_json(value: Any) -> str:
    return json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def sha256_hex(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def git_blob_sha1(raw: bytes) -> str:
    header = f"blob {len(raw)}\0".encode("ascii")
    return hashlib.sha1(header + raw).hexdigest()


def safe_relative(path_text: str, *, field: str) -> PurePosixPath:
    if not isinstance(path_text, str) or not path_text:
        raise PublicationError(f"{field} must be a non-empty relative path")
    path = PurePosixPath(path_text)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise PublicationError(f"{field} must stay inside the repository")
    return path


def read_json(path: Path) -> tuple[dict, bytes]:
    raw = path.read_bytes()
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise PublicationError(f"invalid JSON: {path}") from exc
    if not isinstance(value, dict):
        raise PublicationError(f"JSON object required: {path}")
    return value, raw


def validate_record(record: dict, *, record_path: str) -> None:
    required = {
        "schema", "id", "title", "summary", "published_at",
        "source_path", "evidence_relation",
    }
    missing = sorted(required - record.keys())
    if missing:
        raise PublicationError(f"{record_path}: missing fields: {', '.join(missing)}")
    if record["schema"] != RECORD_SCHEMA:
        raise PublicationError(f"{record_path}: wrong record schema")
    for field in required - {"schema"}:
        if not isinstance(record[field], str) or not record[field].strip():
            raise PublicationError(f"{record_path}: invalid {field}")
    try:
        datetime.fromisoformat(record["published_at"].replace("Z", "+00:00"))
    except ValueError as exc:
        raise PublicationError(f"{record_path}: published_at is not ISO-8601-compatible") from exc
    source = safe_relative(record["source_path"], field="source_path")
    if not source.as_posix().startswith(ALLOWED_SOURCE_PREFIXES):
        raise PublicationError(f"{record_path}: source_path is outside admitted public source prefixes")


def build_snapshot(repo_root: Path, admissions_path: Path) -> dict:
    repo_root = repo_root.resolve()
    admissions, _ = read_json(admissions_path)
    if admissions.get("schema") != ADMISSIONS_SCHEMA:
        raise PublicationError("wrong admissions schema")
    entries = admissions.get("records")
    if not isinstance(entries, list):
        raise PublicationError("admissions records must be an array")

    public_records = []
    seen_ids: set[str] = set()
    publication_root = admissions_path.parent.resolve()

    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise PublicationError(f"admission {index}: object required")
        if "classification" not in entry:
            raise PublicationError(f"admission {index}: missing classification")
        classification = entry["classification"]
        if classification not in ALLOWED_CLASSIFICATIONS:
            raise PublicationError(f"admission {index}: unknown classification {classification!r}")
        if "record" not in entry:
            raise PublicationError(f"admission {index}: missing record path")
        record_rel = safe_relative(entry["record"], field="record")
        # Privacy boundary: do not even read a private record file.
        if classification == "private":
            continue

        record_path = (admissions_path.parent / record_rel).resolve()
        if publication_root not in record_path.parents:
            raise PublicationError(f"admission {index}: record escaped publication directory")
        record, record_raw = read_json(record_path)
        validate_record(record, record_path=record_rel.as_posix())

        record_id = record["id"]
        if record_id in seen_ids:
            raise PublicationError(f"duplicate public record id: {record_id}")
        seen_ids.add(record_id)

        source_rel = safe_relative(record["source_path"], field="source_path")
        source_path = (repo_root / source_rel).resolve()
        if repo_root not in source_path.parents:
            raise PublicationError(f"{record_id}: source escaped repository")
        if not source_path.is_file():
            raise PublicationError(f"{record_id}: source not found: {source_rel.as_posix()}")
        source_raw = source_path.read_bytes()

        public_records.append({
            "id": record_id,
            "title": record["title"],
            "summary": record["summary"],
            "published_at": record["published_at"],
            "source_path": source_rel.as_posix(),
            "source_blob_sha1": git_blob_sha1(source_raw),
            "source_bytes": len(source_raw),
            "record_sha256": sha256_hex(record_raw),
            "evidence_relation": record["evidence_relation"],
        })

    public_records.sort(key=lambda item: (item["published_at"], item["id"]), reverse=True)
    return {
        "schema": SNAPSHOT_SCHEMA,
        "selection": "explicit-public-admissions-only",
        "record_count": len(public_records),
        "records": public_records,
        "privacy_boundary": "private records are excluded before record content is read; the client receives only public-admitted records",
        "evidence_boundary": "publication and retrieval do not create independent scientific evidence",
    }


def operation_report(snapshot: dict, *, source_revision: str, generated_at: str, result: str, endpoint: str | None = None) -> dict:
    if not source_revision:
        raise PublicationError("source revision is required for an operation report")
    try:
        datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise PublicationError("generated_at must be ISO-8601-compatible") from exc
    raw = canonical_json(snapshot).encode("utf-8")
    report = {
        "schema": "conscience64/public-research-publication-operation/v1",
        "source_revision": source_revision,
        "generated_at": generated_at,
        "result": result,
        "snapshot_sha256": sha256_hex(raw),
        "record_count": snapshot["record_count"],
        "included_records": [
            {"id": r["id"], "record_sha256": r["record_sha256"], "source_blob_sha1": r["source_blob_sha1"]}
            for r in snapshot["records"]
        ],
    }
    if endpoint:
        report["endpoint"] = endpoint
    return report


def default_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def main() -> int:
    parser = argparse.ArgumentParser(description="Build fail-closed public research-update snapshot.")
    parser.add_argument("--root", type=Path, default=default_repo_root())
    parser.add_argument("--admissions", type=Path, default=Path(__file__).resolve().parent / "admissions.json")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "data" / "latest.json")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--source-revision", default=os.getenv("GITHUB_SHA", "LOCAL"))
    parser.add_argument("--generated-at", default=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"))
    parser.add_argument("--result", default="validated")
    parser.add_argument("--endpoint")
    args = parser.parse_args()

    snapshot = build_snapshot(args.root, args.admissions)
    rendered = canonical_json(snapshot)
    if args.check:
        if not args.out.is_file() or args.out.read_text(encoding="utf-8") != rendered:
            raise SystemExit("public research-update snapshot is stale")
    else:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered, encoding="utf-8")

    report = operation_report(snapshot, source_revision=args.source_revision, generated_at=args.generated_at, result=args.result, endpoint=args.endpoint)
    print("PUBLIC_RESEARCH_UPDATE_REPORT " + json.dumps(report, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
