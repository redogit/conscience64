# Conscience64 Live Research Analytics

This directory contains the live research analytics surface and its event contract.

The dashboard is a **view over an append-only event ledger**. It does not promote claims automatically. Observations, interpretations, tests, contradictions, revisions, and promotions remain distinct event types.

## Run locally

From the repository root:

```bash
python3 analytics/server.py
```

Then open:

```text
http://127.0.0.1:8765/
```

The same process serves:

- `/` — dashboard
- `/events` — SSE stream (`GET`) and ingestion endpoint (`POST`)
- `/healthz` — health check

The default bind is loopback-only.

## Build the LLVM event producer

```bash
cmake -S analytics -B build/analytics
cmake --build build/analytics
```

Example event:

```bash
build/analytics/llvm_event_bridge \
  OBSERVATION coordinate-space \
  "Runtime artifact entered analytics ledger" executed
```

The producer writes one contract-compatible JSON event to standard output.

## Send an LLVM event into the live ledger

For local loopback development without an ingestion token:

```bash
build/analytics/llvm_event_bridge \
  TESTED coordinate-space \
  "UTF-8 scalar sweep completed" executed \
| curl --fail-with-body \
    -H 'Content-Type: application/json' \
    --data-binary @- \
    http://127.0.0.1:8765/events
```

The event is appended to `analytics/events.jsonl`, returned by the ingestion request, replayed to newly connected viewers, and pushed immediately to current SSE viewers.

## Authenticated ingestion

Set a token before exposing the service beyond loopback:

```bash
export ANALYTICS_INGEST_TOKEN='replace-with-a-secret'
python3 analytics/server.py --host 0.0.0.0
```

Then POST with:

```text
Authorization: Bearer <token>
```

The server intentionally refuses a non-loopback bind when no ingestion token is configured.

## Evidence boundary

A dashboard event is **not evidence merely because it appears in the stream**. Its evidence class, scope, provenance, independence, and execution status must be assessed according to `EVENT_SCHEMA.md`.

GitHub Pages remains a static surface. When hosted there without a same-origin `/events` service, the dashboard enters clearly labeled demo mode. For an actual live stream, run this server or deploy an equivalent ingestion/SSE service that preserves the same event contract.

## Verification

Browser-side event contract tests:

```bash
node analytics/test.mjs
```

Server/ledger tests:

```bash
python3 analytics/test_server.py
```

Second-pass review should check at minimum:

- observation vs. interpretation separation,
- evidence scope and provenance,
- repeated sources vs. independent verification,
- contradictions that remain unresolved,
- replayed vs. newly generated events,
- stale evidence / knowledge-decay reopening,
- accidental public exposure of the ingestion endpoint.
