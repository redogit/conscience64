# Conscience64 Live Research Analytics

This directory contains the Research Analytics dashboard, event contract, LLVM event producer, and an optional live append-only ingestion/SSE service.

The dashboard is a **view over an event ledger**. It does not promote claims automatically. Observation, interpretation, testing, contradiction, revision, promotion, and reopening remain distinct event types.

## Static Pages versus live service

The public GitHub Pages deployment is static. It can render the dashboard and its demo fixtures, but GitHub Pages is **not** a streaming backend and is **not** the authoritative event ledger.

Run `analytics/server.py` when an actual same-origin `/events` endpoint is required.

## Run locally

From the repository root:

```bash
python3 analytics/server.py
```

Then open:

```text
http://127.0.0.1:8765/
```

The process serves:

- `/` — dashboard;
- `/events` — SSE stream (`GET`) and JSON ingestion endpoint (`POST`);
- `/healthz` — ledger-integrity health check.

The default bind is loopback-only.

The local ledger defaults to `analytics/events.jsonl`; that runtime file is ignored by Git. A malformed ledger line causes health/replay failure rather than being silently skipped.

## Event identity and replay

The ingestion service assigns every accepted event a canonical `event_id`. If a producer supplies its own `event_id`, that value is retained as `producer_event_id`; it does not replace the ledger identity.

SSE clients receive canonical event IDs. On reconnect, browser `Last-Event-ID` is honored:

- if the ID is present, every later ledger event is replayed before live fan-out begins;
- if the ID is missing, the service returns an explicit `409 resume_gap` instead of silently skipping unknown history;
- resume size is bounded by `ANALYTICS_MAX_RESUME_EVENTS` / `--max-resume-events`.

Replay snapshot creation and subscription registration occur under the same ledger lock, preventing an event from falling into the gap between replay and live subscription.

If a subscriber falls too far behind and its bounded queue overflows, that stream is closed after queued events are delivered. A reconnect can then resume from its last canonical event ID.

## Build the LLVM event producer

```bash
cmake -S analytics -B build/analytics
cmake --build build/analytics
```

Example:

```bash
build/analytics/llvm_event_bridge \
  OBSERVATION coordinate-space \
  "Runtime artifact entered analytics ledger" executed
```

The producer writes one browser-contract-compatible JSON event to standard output.

## Send an LLVM event into the live ledger

For loopback development without an ingestion token:

```bash
build/analytics/llvm_event_bridge \
  TESTED coordinate-space \
  "UTF-8 scalar sweep completed" executed \
| curl --fail-with-body \
    -H 'Content-Type: application/json' \
    --data-binary @- \
    http://127.0.0.1:8765/events
```

The event is normalized to the canonical contract, appended, returned by the request, replayable to later viewers, and fanned out to connected viewers.

## Remote/non-loopback boundary

The server deliberately has **no built-in TLS or user/session authentication for dashboard/SSE reads**.

A non-loopback bind therefore requires both:

1. an ingestion bearer token of at least 16 characters; and
2. an explicit acknowledgement that dashboard/SSE reads are public on the bound interface.

Example:

```bash
export ANALYTICS_INGEST_TOKEN='replace-with-a-long-secret'
python3 analytics/server.py --host 0.0.0.0 --allow-public-read
```

POST with:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

The bearer token protects **ingestion only**. `--allow-public-read` does not make the stream private; it merely makes the exposure intentional instead of accidental.

For any remote deployment, place the service behind an appropriate TLS/reverse-proxy/access-control layer and review the event data for privacy before exposing it. Do not put private or secret-bearing events into a publicly readable ledger.

## Recorded real-event corpus

`analytics/recorded-events/` contains selected **real repository events**, not demo fixtures. Each record keeps a tested scope, source, revision where applicable, and an explicit independence label.

Current entries include:

- `2026-09-14-consolidation.json` — the successful September 13–14 Conscience64 publication gate at revision `0e213a5d8dd685876d94600c443342d257363006`;
- `2026-09-14-arcade-forge-admission.json` — the bounded Arcade Forge contract/adversarial/Chrome/publication result at revision `c0ab6343ca0ecd91dcd84faaf66b79618112e12d`.

Both are deliberately labeled `same-source`. They establish that the named repository checks ran and passed within their declared software scopes; they are **not** independent validation of underlying scientific claims.

`test_recorded_events.py` enumerates every JSON record in this directory, checks its minimum provenance/contract shape, sends it through the real HTTP ingestion service, and verifies that provenance survives append/replay. Adding a malformed recorded event therefore breaks the analytics gate instead of silently growing an untested evidence folder.

## Evidence boundary

A dashboard event is **not evidence merely because it appears in the stream**. Evidence class, tested scope, provenance, source independence, and execution status remain separate dimensions under `EVENT_SCHEMA.md`.

Transport validity does not establish scientific validity. A valid JSON event can still contain a weak, stale, dependent, contradicted, or incorrect claim.

## Verification

Browser contract:

```bash
node analytics/test.mjs
```

Live ledger/server and recorded-event corpus:

```bash
cd analytics
python3 -m unittest -v test_server.py test_recorded_events.py
```

The ingestion suite covers canonical IDs, replay/resume semantics, malformed-ledger detection, authentication, content type, event validation, exposure boundaries, static security headers, and every current real recorded-event fixture.

Second-pass review should still check:

- observation versus interpretation separation;
- evidence scope and provenance;
- repeated sources versus independent verification;
- unresolved contradictions;
- replayed versus newly generated events;
- stale evidence / Knowledge Decay reopening;
- accidental disclosure in event content;
- whether a requested remote deployment actually has appropriate external access controls.
