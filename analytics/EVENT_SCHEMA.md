# Research Analytics Event Contract

The analytics platform treats every update as an append-only research event. Display order does not imply epistemic strength.

## Required fields

Every event accepted into the canonical ledger carries these non-empty string fields:

```json
{
  "time": "2026-09-13T23:17:04-04:00",
  "kind": "OBSERVATION",
  "project": "coordinate-space",
  "message": "Observed result",
  "evidence": "executed",
  "source": "artifact-or-system-id",
  "status": "recorded"
}
```

`time` must parse as an ISO-8601-compatible timestamp. Unknown event kinds and malformed required fields are rejected rather than rendered or appended.

The live ingestion endpoint permits producers to omit `time`, `source`, and `status`; the service supplies explicit defaults before append. If a producer supplies any of those fields, the supplied value must satisfy the canonical browser contract.

## Event kinds

- `OBSERVATION` — directly observed, measured, retrieved, or computed state.
- `TESTED` — a defined test was executed. A passing test is not automatically a proof.
- `VERIFIED` — a prior result was reproduced or independently checked within a stated scope.
- `CONTRADICTION` — evidence conflicts with a prior claim, model, or interpretation.
- `INTERPRETATION` — meaning assigned to observations; must remain separate from the observations themselves.
- `BOUNDARY` — scope, assumptions, applicability, or claim limits changed.
- `REVISED` — a model, interpretation, or claim was changed in response to evidence.
- `PROMOTED` — a claim moved to a stronger status after explicit review. Never generated automatically from frequency or agreement alone.
- `REOPENED` — a previously closed question/result was reopened because of new evidence, stale provenance, Knowledge Decay, or review.

The canonical browser list lives in `event-contract.mjs`. CI checks the Python ingestion service against that same vocabulary.

## Canonical identity and ingestion metadata

The live service assigns the canonical `event_id` when an event is admitted to its ledger. A producer-provided `event_id` is preserved as `producer_event_id`; it cannot replace the ledger identity.

The service also records:

- `ingested_at` — server-side ISO-8601 admission time;
- `time_unix_ms` — server-side admission clock in Unix milliseconds.

These transport fields establish chronology inside the ledger. They do not establish the truth, independence, or scientific weight of the event.

## Provenance requirements

For evidence-bearing events, prefer these optional fields:

```json
{
  "artifact_sha256": "...",
  "repository": "redogit/conscience64",
  "revision": "full-commit-sha",
  "command": "exact command if applicable",
  "environment": "compiler/runtime/platform details",
  "scope": "what was and was not tested",
  "independence": "same-source | independent-source | independent-execution",
  "parent_event_ids": ["..."]
}
```

`independence` is descriptive metadata, not an automatic promotion mechanism.

## Transport boundary

The static GitHub Pages dashboard is a **view**, not the authoritative ledger and not a streaming backend. It attempts a same-origin Server-Sent Events connection at `./events`. If no endpoint exists, the page enters visibly labeled demo mode. Seed/demo events are presentation fixtures and are not research evidence.

`analytics/server.py` provides an optional live append-only JSONL ledger plus same-origin POST/SSE transport. Its default bind is loopback only. Remote/non-loopback use is a separate deployment decision and requires explicit public-read acknowledgement because the built-in dashboard/SSE read path has no user/session authentication.

The LLVM bridge emits one JSON event to standard output. Its output must satisfy the same required-field and event-kind contract as browser-ingested events after normalization.

## Replay and continuity semantics

SSE responses carry the canonical ledger `event_id` as the SSE ID. Reconnecting clients may send `Last-Event-ID`.

The live service must:

1. atomically establish the replay snapshot and live subscription so no event can fall between those phases;
2. replay every event after a known `Last-Event-ID` within the configured resume bound;
3. return an explicit `resume_gap` when the supplied ID is not present or the required resume window exceeds its configured maximum;
4. fail visibly on malformed ledger lines rather than silently dropping them;
5. close a subscriber that overruns its bounded delivery queue so it can reconnect and resume from its last delivered canonical ID.

A replayed event is historical transport, not a newly executed experiment.

## Guard rules

1. Observation and interpretation are separate events when both exist.
2. Repetition does not create verification by itself.
3. A test result retains its tested scope; the dashboard must not silently generalize it.
4. Contradictions remain visible after revision.
5. Promotion requires an explicit event with rationale and provenance.
6. Negative results are first-class evidence.
7. Missing or stale provenance can trigger `REOPENED`.
8. Knowledge-Decay review should search for forgotten achievements before summarizing progress.
9. A later event may supersede interpretation, but it does not erase the historical record.
10. User-visible analytics must identify whether data is live, replayed, seeded, or simulated.
11. Transport validity does not establish evidentiary validity: well-formed JSON can still carry a weak, stale, dependent, or incorrect claim.
12. The dashboard must render event fields as text, not executable markup.
13. Producer identity does not override canonical ledger identity.
14. A successful CI/deployment event establishes only its declared software scope; it does not promote underlying research claims.

## Two-pass update discipline

### Pass 1 — ingest and reconcile

Capture events, preserve raw evidence, and update derived analytics.

### Pass 2 — audit

Check for:

- missing provenance;
- observation/interpretation collapse;
- accidental claim inflation;
- duplicate evidence counted as independent;
- stale boundaries;
- unresolved contradictions;
- achievements omitted from the current summary;
- replay/resume gaps or silent ledger corruption;
- accidental disclosure in events intended for remotely readable streams.

The dashboard is a view over the ledger. The ledger is the transport authority for the events it contains; it is not an authority over their scientific truth.
