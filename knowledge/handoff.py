"""Structured target-local handoff responses for Conscience64."""

from __future__ import annotations

import hashlib
import json
import os
import threading
import uuid
from pathlib import Path
from typing import Any

from .ledger import LedgerCorruption, iso_utc_now
from .packet import (
    PRIVATE_METHOD_CLAIM_CEILING,
    PRIVATE_METHOD_CLASSIFICATION,
    UOID_RE,
    canonical_json,
)

HANDOFF_RESPONSE_SCHEMA = "conscience64.handoff-response/v1"
HANDOFF_STATUSES = frozenset({"ACCEPTED", "REJECTED", "NEEDS_EVIDENCE", "UNRESOLVED"})
REQUIRED_FIELDS = frozenset({
    "in_reply_to", "from", "to", "status", "decision_reason",
    "successor_refs", "evidence_refs", "unresolved", "privacy",
    "claim_ceiling", "way_back",
})
ALLOWED_FIELDS = REQUIRED_FIELDS
FORBIDDEN_TRANSPORT_FIELDS = frozenset({
    "response_id", "response_seq", "entry_id", "recorded_at",
})
RESPONSE_ID_RE = UOID_RE

PRIVATE_RESPONSE_PRIVACY = {
    "classification": "restricted",
    "privacy_origin": {
        "classification": PRIVATE_METHOD_CLASSIFICATION,
        "independently_regrounded": False,
    },
}


def _clean_string(name: str, value: Any, *, max_length: int = 4096) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"invalid field: {name}")
    text = value.strip()
    if len(text) > max_length:
        raise ValueError(f"field too long: {name}")
    return text


def _normalize_string_list(name: str, value: Any) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"invalid field: {name}")
    cleaned: list[str] = []
    for item in value:
        cleaned.append(_clean_string(name, item, max_length=4096))
    return sorted(set(cleaned))


def _normalize_privacy(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("private-method handoff response must remain restricted")
    if set(value) != {"classification", "privacy_origin"}:
        raise ValueError("private-method handoff response must remain restricted")
    if value.get("classification") != "restricted":
        raise ValueError("private-method handoff response must remain restricted")

    origin = value.get("privacy_origin")
    if not isinstance(origin, dict) or set(origin) != {"classification", "independently_regrounded"}:
        raise ValueError("invalid private-method response privacy origin")
    if origin.get("classification") != PRIVATE_METHOD_CLASSIFICATION:
        raise ValueError("invalid private-method response privacy origin")
    if origin.get("independently_regrounded") is not False:
        raise ValueError("private-method handoff response is pre-regrounding only")

    return {
        "classification": "restricted",
        "privacy_origin": {
            "classification": PRIVATE_METHOD_CLASSIFICATION,
            "independently_regrounded": False,
        },
    }


def normalize_handoff_response(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("handoff response must be a JSON object")

    for field in FORBIDDEN_TRANSPORT_FIELDS:
        if field in payload:
            raise ValueError(f"producer may not supply {field}")

    unknown = sorted(set(payload) - ALLOWED_FIELDS)
    if unknown:
        raise ValueError("unknown field(s): " + ", ".join(unknown))

    missing = sorted(REQUIRED_FIELDS - payload.keys())
    if missing:
        raise ValueError("missing required fields: " + ", ".join(missing))

    response: dict[str, Any] = {}
    response["in_reply_to"] = _clean_string("in_reply_to", payload["in_reply_to"], max_length=128)
    if not UOID_RE.fullmatch(response["in_reply_to"]):
        raise ValueError("invalid field: in_reply_to")

    response["from"] = _clean_string("from", payload["from"], max_length=256)
    response["to"] = _clean_string("to", payload["to"], max_length=256)
    response["status"] = _clean_string("status", payload["status"], max_length=64)
    if response["status"] not in HANDOFF_STATUSES:
        raise ValueError("invalid field: status")

    response["decision_reason"] = _clean_string(
        "decision_reason", payload["decision_reason"], max_length=4000
    )
    for field in ("successor_refs", "evidence_refs", "unresolved", "way_back"):
        response[field] = _normalize_string_list(field, payload[field])

    if response["in_reply_to"] not in response["way_back"]:
        raise ValueError("way_back must preserve in_reply_to")

    response["privacy"] = _normalize_privacy(payload["privacy"])
    response["claim_ceiling"] = _clean_string(
        "claim_ceiling", payload["claim_ceiling"], max_length=512
    )
    if response["claim_ceiling"] != PRIVATE_METHOD_CLAIM_CEILING:
        raise ValueError("private-method handoff response claim ceiling changed")

    # Before independent re-grounding, this response may decide how to proceed,
    # but it cannot manufacture target-local evidence or successor authority.
    if response["successor_refs"] or response["evidence_refs"]:
        raise ValueError("pre-regrounding private-method response cannot claim successor or evidence refs")

    digest = hashlib.sha256(canonical_json(response).encode("utf-8")).hexdigest()
    response["response_id"] = f"uoid:sha256:{digest}"
    return response


def make_private_method_response(
    *,
    in_reply_to: str,
    from_party: str,
    to_party: str,
    status: str,
    decision_reason: str,
    unresolved: list[str] | None = None,
) -> dict[str, Any]:
    return normalize_handoff_response({
        "in_reply_to": in_reply_to,
        "from": from_party,
        "to": to_party,
        "status": status,
        "decision_reason": decision_reason,
        "successor_refs": [],
        "evidence_refs": [],
        "unresolved": [] if unresolved is None else unresolved,
        "privacy": {
            "classification": "restricted",
            "privacy_origin": {
                "classification": PRIVATE_METHOD_CLASSIFICATION,
                "independently_regrounded": False,
            },
        },
        "claim_ceiling": PRIVATE_METHOD_CLAIM_CEILING,
        "way_back": [in_reply_to],
    })


def verify_handoff_response_id(response: dict[str, Any]) -> bool:
    if not isinstance(response, dict):
        return False
    expected = response.get("response_id")
    if not isinstance(expected, str) or not RESPONSE_ID_RE.fullmatch(expected):
        return False
    producer = {key: value for key, value in response.items() if key in ALLOWED_FIELDS}
    try:
        normalized = normalize_handoff_response(producer)
    except (TypeError, ValueError):
        return False
    return normalized["response_id"] == expected


class HandoffResponseLedger:
    """Append-only JSONL ledger for structured target-local handoff responses."""

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
                    raise LedgerCorruption(f"blank handoff response ledger line at {line_number}")
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise LedgerCorruption(
                        f"invalid JSON at handoff response ledger line {line_number}"
                    ) from exc
                if not isinstance(entry, dict):
                    raise LedgerCorruption(
                        f"non-object handoff response ledger entry at line {line_number}"
                    )
                if entry.get("response_seq") != line_number:
                    raise LedgerCorruption(
                        f"invalid response_seq at handoff response ledger line {line_number}"
                    )
                if not isinstance(entry.get("entry_id"), str) or not entry["entry_id"].strip():
                    raise LedgerCorruption(
                        f"invalid entry_id at handoff response ledger line {line_number}"
                    )
                if not isinstance(entry.get("recorded_at"), str) or not entry["recorded_at"].strip():
                    raise LedgerCorruption(
                        f"invalid recorded_at at handoff response ledger line {line_number}"
                    )
                if not verify_handoff_response_id(entry):
                    raise LedgerCorruption(
                        f"response_id integrity failure at handoff response ledger line {line_number}"
                    )
                entries.append(entry)
        return entries

    def append(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = normalize_handoff_response(payload)
        self.path.parent.mkdir(parents=True, exist_ok=True)

        with self.lock:
            existing = self._load_entries_locked()
            for prior in existing:
                if prior["response_id"] == response["response_id"]:
                    return prior

            entry = dict(response)
            entry["response_seq"] = len(existing) + 1
            entry["entry_id"] = str(uuid.uuid4())
            entry["recorded_at"] = iso_utc_now()
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(canonical_json(entry) + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            return entry

    def validate(self) -> int:
        with self.lock:
            return len(self._load_entries_locked())

    def get(self, response_id: str, *, include_restricted: bool = False) -> dict[str, Any] | None:
        with self.lock:
            entries = self._load_entries_locked()
        for entry in reversed(entries):
            if entry.get("response_id") != response_id:
                continue
            if entry.get("privacy", {}).get("classification") == "restricted" and not include_restricted:
                return None
            return entry
        return None
