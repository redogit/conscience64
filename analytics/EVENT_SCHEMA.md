# Research Analytics Event Contract

The analytics platform treats every update as an append-only research event. Display order does not imply epistemic strength.

## Required fields

Every accepted event carries these non-empty string fields:

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

`time` must parse as an ISO-8601-compatible timestamp. Unknown event kinds and malformed required fields are rejected by the browser contract validator rather than rendered.

## Event kinds

- `OBSERVATION` — directly observed, measured, retrieved, or computed state.
- `TESTED` — a defined test was executed. A passing test is not automatically a proof.
- `VERIFIED` — a prior result was reproduced or independently checked within a stated scope.
- `CONTRADICTION` — evidence conflicts with a prior claim, model, or interpretation.
- `INTERPRETATION` — meaning assigned to observations; must remain separate from the observations themselves.
- `BOUNDARY` — scope, assumptions, applicability, or claim limits changed.
- `REVISED` — a model, interpretation, or claim was changed in response to evidence.
- `PROMOTED` — a claim moved to a stronger status after explicit review. Never generated automatically from frequency or agreement alone.
- `REOPENED` — a previously closed question/result was reopened because of new evidence, stale provenance, knowledge decay, or review.

The canonical browser list lives in `event-contract.mjs`; CI checks the documentation and LLVM emitter against it.

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
  "parent_event_ids": ["..."],
  "event_id": "stable-id"
}
```

## Transport boundary

The static GitHub Pages dashboard is a **view**, not the authoritative ledger and not a streaming backend. It attempts a same-origin Server-Sent Events connection at `./events`. If no endpoint exists, the page enters a visibly labeled demo mode. Seed/demo events are presentation fixtures and are not research evidence.

The LLVM bridge emits one JSON event to standard output. Its output must satisfy the same required-field and event-kind contract as browser-ingested events.

## Guard rules

1. Observation and interpretation are separate events when both exist.
2. Repetition does not create verification by itself.
3. A test result retains its tested scope; the dashboard must not silently generalize it.
4. Contradictions remain visible after revision.
5. Promotion requires an explicit event with rationale and provenance.
6. Negative results are first-class evidence.
7. Missing or stale provenance can trigger `REOPENED`.
8. Knowledge-decay review should search for forgotten achievements before summarizing progress.
9. A later event may supersede interpretation, but it does not erase the historical record.
10. User-visible analytics must identify whether data is live, replayed, seeded, or simulated.
11. Transport validity does not establish evidentiary validity: well-formed JSON can still carry a weak, stale, dependent, or incorrect claim.
12. The dashboard must render event fields as text, not executable markup.

## Two-pass update discipline

### Pass 1 — ingest and reconcile

Capture events, preserve raw evidence, and update derived analytics.

### Pass 2 — audit

Check for:

- missing provenance,
- observation/interpretation collapse,
- accidental claim inflation,
- duplicate evidence counted as independent,
- stale boundaries,
- unresolved contradictions,
- achievements omitted from the current summary.

The dashboard is a view over the ledger. The ledger is the authority.
