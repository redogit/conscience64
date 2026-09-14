"""Canonical Conscience64 knowledge packet validation and identity."""

from __future__ import annotations

import hashlib
import json
import math
import re
from datetime import datetime
from typing import Any

KNOWLEDGE_KINDS = frozenset({
    "OBSERVATION", "TESTED", "VERIFIED", "NEGATIVE_RESULT", "HYPOTHESIS",
    "INTERPRETATION", "CONTRADICTION", "BOUNDARY", "REVISION", "PROMOTION",
    "REOPENED", "REFERENCE", "METHOD", "DEFINITION", "DESIGN",
})
VISIBILITIES = frozenset({"public", "restricted"})
REQUIRED_FIELDS = frozenset({"project", "kind", "content", "source", "visibility"})
OPTIONAL_STRING_FIELDS = frozenset({
    "evidence", "independence", "claim_ceiling", "scope", "source_revision", "observed_at",
})
OPTIONAL_FIELDS = OPTIONAL_STRING_FIELDS | frozenset({"parents", "tags", "metadata"})
ALLOWED_FIELDS = REQUIRED_FIELDS | OPTIONAL_FIELDS
FORBIDDEN_TRANSPORT_FIELDS = frozenset({"packet_uoid", "entry_id", "ledger_seq", "ingested_at"})
UOID_RE = re.compile(r"^uoid:sha256:[0-9a-f]{64}$")


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def _clean_string(name: str, value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"invalid field: {name}")
    return value.strip()


def _validate_iso_time(value: str) -> None:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("invalid field: observed_at") from exc


def _normalize_string_list(name: str, value: Any, *, require_uoid: bool = False) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"invalid field: {name}")
    cleaned: list[str] = []
    for item in value:
        text = _clean_string(name, item)
        if require_uoid and not UOID_RE.fullmatch(text):
            raise ValueError(f"invalid field: {name}")
        cleaned.append(text)
    return sorted(set(cleaned))


def _validate_json_value(value: Any, path: str = "metadata") -> None:
    if value is None or isinstance(value, (str, bool, int)):
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError(f"invalid field: {path}")
        return
    if isinstance(value, list):
        for index, item in enumerate(value):
            _validate_json_value(item, f"{path}[{index}]")
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str):
                raise ValueError(f"invalid field: {path}")
            _validate_json_value(item, f"{path}.{key}")
        return
    raise ValueError(f"invalid field: {path}")


def normalize_packet(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("knowledge packet must be a JSON object")

    for field in FORBIDDEN_TRANSPORT_FIELDS:
        if field in payload:
            raise ValueError(f"producer may not supply {field}")

    unknown = sorted(set(payload) - ALLOWED_FIELDS)
    if unknown:
        raise ValueError("unknown field(s): " + ", ".join(unknown))

    missing = sorted(REQUIRED_FIELDS - payload.keys())
    if missing:
        raise ValueError("missing required fields: " + ", ".join(missing))

    packet: dict[str, Any] = {}
    for field in ("project", "kind", "content", "source", "visibility"):
        packet[field] = _clean_string(field, payload[field])

    if packet["kind"] not in KNOWLEDGE_KINDS:
        raise ValueError("invalid field: kind")
    if packet["visibility"] not in VISIBILITIES:
        raise ValueError("invalid field: visibility")

    for field in sorted(OPTIONAL_STRING_FIELDS):
        if field in payload:
            packet[field] = _clean_string(field, payload[field])
    if "observed_at" in packet:
        _validate_iso_time(packet["observed_at"])

    if "tags" in payload:
        packet["tags"] = _normalize_string_list("tags", payload["tags"])
    if "parents" in payload:
        packet["parents"] = _normalize_string_list("parents", payload["parents"], require_uoid=True)
    if "metadata" in payload:
        if not isinstance(payload["metadata"], dict):
            raise ValueError("invalid field: metadata")
        _validate_json_value(payload["metadata"])
        packet["metadata"] = payload["metadata"]

    digest = hashlib.sha256(canonical_json(packet).encode("utf-8")).hexdigest()
    packet["packet_uoid"] = f"uoid:sha256:{digest}"
    return packet


def verify_packet_uoid(packet: dict[str, Any]) -> bool:
    if not isinstance(packet, dict):
        return False
    expected = packet.get("packet_uoid")
    if not isinstance(expected, str) or not UOID_RE.fullmatch(expected):
        return False
    producer = {key: value for key, value in packet.items() if key in ALLOWED_FIELDS}
    try:
        normalized = normalize_packet(producer)
    except (TypeError, ValueError):
        return False
    return normalized["packet_uoid"] == expected
