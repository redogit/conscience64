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
OPTIONAL_FIELDS = OPTIONAL_STRING_FIELDS | frozenset({"parents", "tags", "metadata", "privacy_origin"})
ALLOWED_FIELDS = REQUIRED_FIELDS | OPTIONAL_FIELDS
FORBIDDEN_TRANSPORT_FIELDS = frozenset({"packet_uoid", "entry_id", "ledger_seq", "ingested_at"})
UOID_RE = re.compile(r"^uoid:sha256:[0-9a-f]{64}$")

PRIVATE_METHOD_CLASSIFICATION = "private-history-method-only"
PRIVATE_METHOD_SOURCE = "private-history:withheld"
PRIVATE_METHOD_EVIDENCE = "method-only; not project evidence"
PRIVATE_METHOD_INDEPENDENCE = "private-origin; requires independent re-grounding"
PRIVATE_METHOD_CLAIM_CEILING = "abstract method only; no source or identity claim"
PRIVATE_METHOD_SCOPE = "private-origin method abstraction"
PRIVATE_METHOD_FORBIDDEN_AUX_FIELDS = frozenset({
    "parents", "tags", "metadata", "source_revision", "observed_at",
})
PRIVATE_ORIGIN_FIELDS = frozenset({"classification", "independently_regrounded"})


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


def _normalize_privacy_origin(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("invalid field: privacy_origin")
    unknown = sorted(set(value) - PRIVATE_ORIGIN_FIELDS)
    if unknown:
        raise ValueError("unknown privacy_origin field(s): " + ", ".join(unknown))
    missing = sorted(PRIVATE_ORIGIN_FIELDS - value.keys())
    if missing:
        raise ValueError("missing privacy_origin field(s): " + ", ".join(missing))

    classification = _clean_string("privacy_origin.classification", value["classification"])
    if classification != PRIVATE_METHOD_CLASSIFICATION:
        raise ValueError("invalid field: privacy_origin.classification")
    independently_regrounded = value["independently_regrounded"]
    if not isinstance(independently_regrounded, bool):
        raise ValueError("invalid field: privacy_origin.independently_regrounded")

    return {
        "classification": classification,
        "independently_regrounded": independently_regrounded,
    }


def _enforce_private_method_boundary(payload: dict[str, Any], packet: dict[str, Any]) -> None:
    origin = packet.get("privacy_origin")
    if not isinstance(origin, dict):
        return
    if origin["classification"] != PRIVATE_METHOD_CLASSIFICATION:
        return

    if packet["kind"] != "METHOD":
        raise ValueError("private-history method carrier requires kind=METHOD")
    if packet["source"] != PRIVATE_METHOD_SOURCE:
        raise ValueError("private-history method carrier requires non-identifying source")
    if packet["visibility"] != "restricted":
        raise ValueError("private-history method carrier must remain restricted")
    if origin["independently_regrounded"]:
        raise ValueError("private-history method carrier is pre-regrounding only")

    forbidden = sorted(PRIVATE_METHOD_FORBIDDEN_AUX_FIELDS & payload.keys())
    if forbidden:
        raise ValueError("private-history method carrier forbids auxiliary field(s): " + ", ".join(forbidden))

    required_constants = {
        "evidence": PRIVATE_METHOD_EVIDENCE,
        "independence": PRIVATE_METHOD_INDEPENDENCE,
        "claim_ceiling": PRIVATE_METHOD_CLAIM_CEILING,
        "scope": PRIVATE_METHOD_SCOPE,
    }
    for field, expected in required_constants.items():
        if packet.get(field) != expected:
            raise ValueError(f"private-history method carrier requires fixed {field}")


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
    if "privacy_origin" in payload:
        packet["privacy_origin"] = _normalize_privacy_origin(payload["privacy_origin"])

    _enforce_private_method_boundary(payload, packet)

    digest = hashlib.sha256(canonical_json(packet).encode("utf-8")).hexdigest()
    packet["packet_uoid"] = f"uoid:sha256:{digest}"
    return packet


def make_private_method_packet(*, project: str, method: str) -> dict[str, Any]:
    """Build the bounded method-only carrier without accepting private source material."""
    return normalize_packet({
        "project": project,
        "kind": "METHOD",
        "content": method,
        "source": PRIVATE_METHOD_SOURCE,
        "visibility": "restricted",
        "evidence": PRIVATE_METHOD_EVIDENCE,
        "independence": PRIVATE_METHOD_INDEPENDENCE,
        "claim_ceiling": PRIVATE_METHOD_CLAIM_CEILING,
        "scope": PRIVATE_METHOD_SCOPE,
        "privacy_origin": {
            "classification": PRIVATE_METHOD_CLASSIFICATION,
            "independently_regrounded": False,
        },
    })


def is_private_method_origin(packet: dict[str, Any]) -> bool:
    origin = packet.get("privacy_origin") if isinstance(packet, dict) else None
    return (
        isinstance(origin, dict)
        and origin.get("classification") == PRIVATE_METHOD_CLASSIFICATION
    )


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
