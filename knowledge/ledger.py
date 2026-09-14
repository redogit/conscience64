"""Append-only JSONL storage for Conscience64 knowledge packets."""

from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from .packet import canonical_json, normalize_packet, verify_packet_uoid


class LedgerCorruption(RuntimeError):
    """Raised when the persisted ledger violates its structural/integrity contract."""


def iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class KnowledgeLedger:
    def __init__(self, path: Path | str):
        self.path = Path(path)
        self.lock = threading.Lock()

    def _load_entries_locked(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        entries: list[dict[str, Any]] = []
        with self.path.open("r", encoding="utf-8") as fh:
            for line_number, line in enumerate(fh, 1):
                if not line.strip():
                    raise LedgerCorruption(f"blank ledger line at {line_number}")
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise LedgerCorruption(f"invalid JSON at ledger line {line_number}") from exc
                if not isinstance(entry, dict):
                    raise LedgerCorruption(f"non-object ledger entry at line {line_number}")
                if entry.get("ledger_seq") != line_number:
                    raise LedgerCorruption(f"invalid ledger_seq at line {line_number}")
                if not isinstance(entry.get("entry_id"), str) or not entry["entry_id"].strip():
                    raise LedgerCorruption(f"invalid entry_id at line {line_number}")
                if not isinstance(entry.get("ingested_at"), str) or not entry["ingested_at"].strip():
                    raise LedgerCorruption(f"invalid ingested_at at line {line_number}")
                if not verify_packet_uoid(entry):
                    raise LedgerCorruption(f"packet_uoid integrity failure at line {line_number}")
                entries.append(entry)
        return entries

    @staticmethod
    def _validate_limit(limit: int) -> None:
        if not isinstance(limit, int) or isinstance(limit, bool) or limit <= 0 or limit > 1000:
            raise ValueError("limit must be an integer between 1 and 1000")

    def append(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.append_many([payload])[0]

    def append_many(self, payloads: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
        normalized = [normalize_packet(payload) for payload in payloads]
        if not normalized:
            return []

        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.lock:
            existing = self._load_entries_locked()
            by_uoid = {entry["packet_uoid"]: entry for entry in existing}
            next_seq = len(existing) + 1
            created: list[dict[str, Any]] = []
            results: list[dict[str, Any]] = []
            for packet in normalized:
                prior = by_uoid.get(packet["packet_uoid"])
                if prior is not None:
                    results.append(prior)
                    continue
                entry = dict(packet)
                entry["ledger_seq"] = next_seq + len(created)
                entry["entry_id"] = str(uuid.uuid4())
                entry["ingested_at"] = iso_utc_now()
                created.append(entry)
                by_uoid[entry["packet_uoid"]] = entry
                results.append(entry)

            if created:
                serialized = "".join(canonical_json(entry) + "\n" for entry in created)
                with self.path.open("a", encoding="utf-8") as fh:
                    fh.write(serialized)
                    fh.flush()
                    os.fsync(fh.fileno())
            return results

    def validate(self) -> int:
        with self.lock:
            return len(self._load_entries_locked())

    def get(self, packet_uoid: str, *, include_restricted: bool = False) -> dict[str, Any] | None:
        with self.lock:
            entries = self._load_entries_locked()
        for entry in reversed(entries):
            if entry.get("packet_uoid") != packet_uoid:
                continue
            if entry.get("visibility") == "restricted" and not include_restricted:
                return None
            return entry
        return None

    def sync(self, *, after: int = 0, limit: int = 100, include_restricted: bool = False) -> list[dict[str, Any]]:
        if not isinstance(after, int) or isinstance(after, bool) or after < 0:
            raise ValueError("after must be a non-negative integer")
        self._validate_limit(limit)
        with self.lock:
            entries = self._load_entries_locked()
        result = []
        for entry in entries:
            if entry["ledger_seq"] <= after:
                continue
            if entry["visibility"] == "restricted" and not include_restricted:
                continue
            result.append(entry)
            if len(result) >= limit:
                break
        return result

    def search(
        self,
        *,
        q: str = "",
        project: str | None = None,
        kind: str | None = None,
        limit: int = 100,
        include_restricted: bool = False,
    ) -> list[dict[str, Any]]:
        self._validate_limit(limit)
        needle = q.strip().casefold() if isinstance(q, str) else None
        if needle is None:
            raise ValueError("q must be a string")
        if project is not None and (not isinstance(project, str) or not project.strip()):
            raise ValueError("project must be a non-empty string")
        if kind is not None and (not isinstance(kind, str) or not kind.strip()):
            raise ValueError("kind must be a non-empty string")

        with self.lock:
            entries = self._load_entries_locked()

        result = []
        for entry in entries:
            if entry["visibility"] == "restricted" and not include_restricted:
                continue
            if project is not None and entry["project"] != project:
                continue
            if kind is not None and entry["kind"] != kind:
                continue
            if needle:
                haystack = " ".join([
                    entry.get("project", ""),
                    entry.get("kind", ""),
                    entry.get("content", ""),
                    entry.get("source", ""),
                    " ".join(entry.get("tags", [])),
                ]).casefold()
                if needle not in haystack:
                    continue
            result.append(entry)
            if len(result) >= limit:
                break
        return result
