#!/usr/bin/env python3
"""Teach tracked public repository text to the Conscience64 knowledge bridge."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

TEXT_EXTENSIONS = frozenset({
    ".md", ".txt", ".json", ".py", ".js", ".mjs", ".c", ".cc", ".cpp",
    ".h", ".hpp", ".yml", ".yaml", ".html", ".css", ".sh", ".toml", ".csv",
    ".ts", ".tsx", ".jsx", ".xml",
})
TEXT_FILENAMES = frozenset({"LICENSE", "NOTICE", "Makefile"})
SECRET_SUFFIXES = (".key", ".pem", ".p12", ".pfx", ".jks")
SECRET_BASENAMES = frozenset({
    ".env", ".env.local", ".env.production", ".env.development",
    "id_rsa", "id_ed25519", "credentials", "credentials.json",
})
RUNTIME_BASENAMES = frozenset({"knowledge.jsonl", "events.jsonl"})
CLAIM_CEILING = "repository-carried source; not independently validated"


def _git(root: Path, *args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(root), *args],
        text=True,
        encoding="utf-8",
    ).strip()


def _excluded_path(relative: str) -> bool:
    path = Path(relative)
    lowered_parts = [part.lower() for part in path.parts]
    name = path.name.lower()
    if name in SECRET_BASENAMES or name in RUNTIME_BASENAMES:
        return True
    if name.startswith(".env.") or name.startswith("id_rsa") or name.startswith("id_ed25519"):
        return True
    if name.endswith(SECRET_SUFFIXES):
        return True
    if any(part in {".git", "node_modules", "__pycache__"} for part in lowered_parts):
        return True
    return False


def tracked_text_files(root: Path | str) -> list[str]:
    root = Path(root).resolve()
    raw = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"])
    candidates = [item.decode("utf-8") for item in raw.split(b"\0") if item]
    result: list[str] = []
    for relative in sorted(candidates):
        if _excluded_path(relative):
            continue
        path = root / relative
        if path.is_symlink() or not path.is_file():
            continue
        if path.name not in TEXT_FILENAMES and path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        result.append(relative)
    return result


def _chunks(text: str, chunk_chars: int) -> list[str]:
    if not isinstance(chunk_chars, int) or chunk_chars <= 0:
        raise ValueError("chunk_chars must be positive")
    if not text:
        return []
    return [text[index:index + chunk_chars] for index in range(0, len(text), chunk_chars)]


def build_packets(
    root: Path | str,
    *,
    revision: str,
    project: str = "conscience64",
    chunk_chars: int = 12000,
    max_file_bytes: int = 262144,
) -> list[dict]:
    root = Path(root).resolve()
    if not revision or not isinstance(revision, str):
        raise ValueError("revision is required")
    if not project or not isinstance(project, str):
        raise ValueError("project is required")
    if not isinstance(max_file_bytes, int) or max_file_bytes <= 0:
        raise ValueError("max_file_bytes must be positive")

    packets: list[dict] = []
    for relative in tracked_text_files(root):
        path = root / relative
        data = path.read_bytes()
        if len(data) > max_file_bytes or b"\0" in data:
            continue
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        chunks = _chunks(text, chunk_chars)
        for index, chunk in enumerate(chunks, 1):
            if not chunk:
                continue
            packets.append({
                "project": project,
                "kind": "REFERENCE",
                "content": chunk,
                "source": f"repository:{relative}",
                "visibility": "public",
                "evidence": "source-material",
                "independence": "same-source",
                "claim_ceiling": CLAIM_CEILING,
                "scope": f"tracked UTF-8 repository source chunk {index}/{len(chunks)}",
                "source_revision": revision,
                "tags": ["repository-source", "tracked-text"],
                "metadata": {
                    "path": relative,
                    "chunk_index": index,
                    "chunk_count": len(chunks),
                    "byte_count": len(data),
                },
            })
    return packets


def send_batches(
    endpoint: str,
    packets: list[dict],
    *,
    write_token: str = "",
    batch_size: int = 64,
    timeout: float = 10.0,
) -> int:
    if not isinstance(batch_size, int) or batch_size <= 0:
        raise ValueError("batch_size must be positive")
    url = endpoint.rstrip("/") + "/v1/knowledge/batch"
    accepted = 0
    for start in range(0, len(packets), batch_size):
        batch = packets[start:start + batch_size]
        body = json.dumps(batch, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if write_token:
            headers["Authorization"] = f"Bearer {write_token}"
        request = Request(url, data=body, headers=headers, method="POST")
        try:
            with urlopen(request, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
                status = response.status
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"knowledge bridge rejected batch with HTTP {exc.code}: {detail}") from exc
        if status != 202 or not isinstance(payload, dict):
            raise RuntimeError("knowledge bridge returned an invalid batch response")
        accepted += len(payload.get("items", []))
    return accepted


def teach_repository(
    root: Path | str,
    *,
    endpoint: str,
    write_token: str = "",
    revision: str | None = None,
    project: str = "conscience64",
    batch_size: int = 64,
    chunk_chars: int = 12000,
    max_file_bytes: int = 262144,
) -> dict:
    root = Path(root).resolve()
    if revision is None:
        revision = _git(root, "rev-parse", "HEAD")
    packets = build_packets(
        root,
        revision=revision,
        project=project,
        chunk_chars=chunk_chars,
        max_file_bytes=max_file_bytes,
    )
    accepted = send_batches(
        endpoint,
        packets,
        write_token=write_token,
        batch_size=batch_size,
    ) if packets else 0
    return {
        "revision": revision,
        "files": len({packet["metadata"]["path"] for packet in packets}),
        "packets": len(packets),
        "accepted_responses": accepted,
        "claim_ceiling": CLAIM_CEILING,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Teach tracked public repository text to Conscience64")
    parser.add_argument("--root", default=".")
    parser.add_argument("--endpoint", default=os.getenv("C64_KNOWLEDGE_ENDPOINT", "http://127.0.0.1:8776"))
    parser.add_argument("--write-token", default=os.getenv("C64_KNOWLEDGE_WRITE_TOKEN", ""))
    parser.add_argument("--revision", default=None)
    parser.add_argument("--project", default="conscience64")
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--chunk-chars", type=int, default=12000)
    parser.add_argument("--max-file-bytes", type=int, default=262144)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    revision = args.revision or _git(root, "rev-parse", "HEAD")
    if args.dry_run:
        packets = build_packets(
            root,
            revision=revision,
            project=args.project,
            chunk_chars=args.chunk_chars,
            max_file_bytes=args.max_file_bytes,
        )
        result = {
            "revision": revision,
            "files": len({packet["metadata"]["path"] for packet in packets}),
            "packets": len(packets),
            "claim_ceiling": CLAIM_CEILING,
            "dry_run": True,
        }
    else:
        result = teach_repository(
            root,
            endpoint=args.endpoint,
            write_token=args.write_token,
            revision=revision,
            project=args.project,
            batch_size=args.batch_size,
            chunk_chars=args.chunk_chars,
            max_file_bytes=args.max_file_bytes,
        )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
