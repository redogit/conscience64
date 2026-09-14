# Research Analytics — evidence event infrastructure

## Status

`DEPLOYED_STATIC_VIEW / IMPLEMENTED_LOCAL_LIVE_LEDGER / REMOTE_DEPLOYMENT_NOT_ESTABLISHED`

Research Analytics is infrastructure for carrying research events and their boundaries. It is not itself an independent scientific reviewer, proof system, or authoritative truth oracle.

## I — Input

A deployed browser event-stream view, a shared event contract, an LLVM/C++ emitter for compiled experiments, CI that builds and exercises the bridge, an optional append-only local JSONL/SSE ingestion service, and a research practice that keeps observation, interpretation, verification, contradiction, revision, promotion, and reopened questions distinct.

## R — Difference that matters

Transport validity is not evidence validity. A well-formed event may still be weak, dependent, stale, contradicted, or wrong. Repetition is not independent verification. Demo/seed data is not research evidence. GitHub Pages is the static view, not a live authoritative backend. Implementing a live local server is also different from deploying a production network service.

## P — Plan

Keep one explicit event vocabulary; validate required fields before render/append; fail closed on unknown event kinds and malformed ledger lines; preserve provenance and negative results; make live/demo/replay state visible; compile and smoke-test the LLVM bridge in CI; give the live ledger gap-free replay/resume semantics; and only expose remote streams after their access-control, privacy, source, scope, independence, and authority boundaries are explicit.

## O — Current output

The public `/analytics/` surface is deployed. Browser rendering uses validated DOM/text construction rather than inserting streamed fields as HTML. The LLVM bridge emits the documented ISO `time` field, rejects unknown event kinds, and is built and exercised in CI. Pages publication runs analytics checks before advancing `gh-pages`.

A local live-service continuation now supplies append-only JSONL persistence, POST ingestion, SSE replay/fan-out, health checking, canonical server-assigned event IDs, `Last-Event-ID` resume, explicit resume-gap failure, bounded slow-subscriber handling, and visible ledger-corruption failure. Replay snapshot and subscription registration are atomic with respect to append, removing the replay/subscription race found during review.

The built-in service remains loopback-only by default. Non-loopback startup requires a strong ingestion token and explicit `--allow-public-read` acknowledgement because dashboard/SSE reads are not user-authenticated by this server. This is an exposure guard, **not** a production access-control system.

`analytics/recorded-events/2026-09-14-consolidation.json` is the first real provenance-bearing event carried through the live ingestion tests. It records the actual successful September 13–14 publication gate at revision `0e213a5d8dd685876d94600c443342d257363006`, labels its independence `same-source`, and explicitly limits its scope to the named software checks.

During the earlier analytics review, CI caught a real environment failure: the GitHub runner lacked LLVM development tooling. That gate was repaired by installing the dependency explicitly; subsequent PR, `main`, Pages-source, and native Pages deployment checks passed.

## Claim ceiling

This establishes deployed static software behavior and, once this continuation is merged, bounded implementation/verification of a local live event transport. It does **not** establish that an event's scientific content is true, that two sources are independent, that a promoted claim is proven, that the local JSONL ledger is a production durability system, or that any remote live analytics service has been deployed or secured.

## Current invariants

```text
OBSERVATION != INTERPRETATION
REPETITION != VERIFICATION
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
DEMO_DATA != RESEARCH_EVIDENCE
STATIC_VIEW != AUTHORITATIVE_LEDGER
LOCAL_LIVE_SERVICE != REMOTE_PRODUCTION_DEPLOYMENT
PRODUCER_EVENT_ID != CANONICAL_LEDGER_EVENT_ID
REPLAYED_EVENT != NEW_EXECUTION
PROMOTION_REQUIRES_EXPLICIT_REVIEW
```

## Verification anchors

- Deployed static implementation: `7422be4cf65063bfece190c9a6bc1ec19306242c`
- September 13–14 consolidation: `0e213a5d8dd685876d94600c443342d257363006`
- Public surface: `analytics/index.html`
- Contract: `analytics/EVENT_SCHEMA.md` and `analytics/event-contract.mjs`
- LLVM emitter: `analytics/llvm_event_bridge.cpp`
- Local live service: `analytics/server.py`
- Real recorded event fixture: `analytics/recorded-events/2026-09-14-consolidation.json`
- Static/LLVM CI: `.github/workflows/analytics-check.yml`
- Live ingestion CI: `.github/workflows/analytics-ingestion-check.yml`
- Publication gate: `.github/workflows/pages-sync.yml`

Historical branch states remain preserved at:

- `backup/live-analytics-platform-v1-pre-sync-20260914`
- `backup/live-analytics-ingestion-v1-pre-sync-20260914`
