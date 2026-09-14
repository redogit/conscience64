# Research Analytics — evidence event infrastructure

## Status

`DEPLOYED_BOUNDED_RESEARCH_INFRASTRUCTURE`

Research Analytics is infrastructure for carrying research events and their boundaries. It is not itself an independent scientific reviewer, proof system, or authoritative truth ledger.

## I — Input

A deployed browser event-stream view, a shared event contract, an LLVM/C++ emitter for compiled experiments, CI that builds and exercises the bridge, and a research practice that keeps observation, interpretation, verification, contradiction, revision, promotion, and reopened questions distinct.

## R — Difference that matters

Transport validity is not evidence validity. A well-formed event may still be weak, dependent, stale, contradicted, or wrong. Repetition is not independent verification. Demo/seed data is not research evidence. GitHub Pages is the static view, not a live authoritative backend.

## P — Plan

Keep one explicit event vocabulary; validate required fields before rendering; fail closed on unknown event kinds; preserve provenance and negative results; make live/demo state visible; compile and smoke-test the LLVM bridge in CI; and only connect real experiment streams after their source, scope, independence, and authority boundaries are explicit.

## O — Current output

The public `/analytics/` surface is deployed. Browser rendering uses validated DOM/text construction rather than inserting streamed fields as HTML. The LLVM bridge emits the documented ISO `time` field, rejects unknown event kinds, and is built and exercised in CI. Pages publication also runs the analytics contract test before advancing `gh-pages`.

During review, CI caught a real environment failure: the GitHub runner lacked LLVM development tooling. The gate was repaired by installing that dependency explicitly; the subsequent PR, `main`, full Pages-source gate, and native Pages deployment all passed.

## Claim ceiling

This establishes deployed software behavior and bounded verification of the event transport. It does **not** establish that an event's scientific content is true, that two sources are independent, that a promoted claim is proven, or that the static Pages site is a durable authoritative ledger.

## Current invariants

```text
OBSERVATION != INTERPRETATION
REPETITION != VERIFICATION
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
DEMO_DATA != RESEARCH_EVIDENCE
STATIC_VIEW != AUTHORITATIVE_LEDGER
PROMOTION_REQUIRES_EXPLICIT_REVIEW
```

## Verification anchors

- Merged implementation: `7422be4cf65063bfece190c9a6bc1ec19306242c`
- Public surface: `analytics/index.html`
- Contract: `analytics/EVENT_SCHEMA.md` and `analytics/event-contract.mjs`
- LLVM emitter: `analytics/llvm_event_bridge.cpp`
- PR/main CI: `.github/workflows/analytics-check.yml`
- Publication gate: `.github/workflows/pages-sync.yml`

The pre-rebase analytics branch state remains preserved at `backup/live-analytics-platform-v1-pre-sync-20260914`.