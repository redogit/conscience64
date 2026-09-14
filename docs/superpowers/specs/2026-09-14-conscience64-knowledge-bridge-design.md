# Conscience64 Knowledge Bridge v1 Design

## Purpose

Add a direct, provenance-preserving knowledge channel to Conscience64 without changing the authority of the existing browser search graph, structured project registry, analytics event ledger, ECS/world state, or research claim gates.

The bridge accepts typed knowledge packets, persists them append-only, supports authenticated access to restricted packets, supports public-only unauthenticated reads, exposes replay/sync and bounded search, and can ingest tracked public repository text through a conservative teacher CLI.

## Authority boundaries

```text
INGESTED != ACCEPTED_AS_FACT
RELATED != SUPPORTS
RETRIEVED != CORROBORATED
REPEATED != INDEPENDENT
TEST_PASS != PROOF
PUBLICATION != VALIDATION
MODEL_AGREEMENT != EVIDENCE
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
RESTRICTED != PUBLIC
PACKET_UOID != LEDGER_ENTRY_ID
```

Existing Conscience64 research/project authority remains unchanged. Knowledge packets are carriers available for retrieval and review; promotion into stronger project/evidence surfaces remains a separate explicit action.

## Components

### `knowledge/packet.py`

Defines packet validation, canonical serialization, and deterministic content UOIDs. Required producer fields are `project`, `kind`, `content`, `source`, and `visibility`. Supported kinds are `OBSERVATION`, `TESTED`, `VERIFIED`, `NEGATIVE_RESULT`, `HYPOTHESIS`, `INTERPRETATION`, `CONTRADICTION`, `BOUNDARY`, `REVISION`, `PROMOTION`, `REOPENED`, `REFERENCE`, `METHOD`, `DEFINITION`, and `DESIGN`. Visibility is `public` or `restricted`.

Optional epistemic/provenance fields include `evidence`, `independence`, `claim_ceiling`, `scope`, `source_revision`, `observed_at`, `parents`, `tags`, and `metadata`. Producer-supplied `packet_uoid`, `entry_id`, `ledger_seq`, and `ingested_at` are rejected. The packet UOID is SHA-256 over canonical normalized producer content before transport metadata is added.

### `knowledge/ledger.py`

Provides an append-only JSONL ledger. Each admitted unique packet receives a monotonically increasing `ledger_seq`, UUID `entry_id`, and server `ingested_at`. Existing packet UOIDs are not replaced by transport identity. Exact UOID re-ingestion is idempotent and returns the original entry rather than manufacturing repeated evidence.

Reads validate ledger structure and packet UOID integrity; malformed lines or non-monotonic sequence numbers fail visibly. Visibility filtering occurs inside ledger query methods so handlers cannot accidentally return restricted records on an unauthenticated path.

### `knowledge/bridge.py`

Stdlib HTTP service with:

- `POST /v1/knowledge`
- `POST /v1/knowledge/batch`
- `GET /v1/knowledge/<packet_uoid>`
- `GET /v1/knowledge/sync?after=<seq>&limit=<n>`
- `GET /v1/knowledge/search?q=<text>&project=<id>&kind=<kind>&limit=<n>`
- `GET /v1/health`

POST uses a bearer write token when configured. A valid read bearer token grants access to restricted packets. Without read authorization, all GET knowledge operations are public-only; attempts to fetch a restricted UOID return `404` rather than disclosing its existence. Supplying a wrong read bearer returns `401` rather than silently downgrading access.

Loopback is the default. Non-loopback bind requires both read and write tokens of at least 16 characters. The service has no built-in TLS; remote deployment must be placed behind TLS/reverse-proxy controls.

Request bodies are bounded. Batch ingestion validates every packet before any write and appends all new entries under one ledger lock, preventing application-level partial batch admission.

### `knowledge/teach_repo.py`

Conservative repository teacher for tracked public text. It obtains files from `git ls-files`, accepts bounded UTF-8 text extensions, excludes symlinks and common secret-like/runtime paths, chunks text deterministically, labels every packet `REFERENCE`, sets `evidence=source-material`, `independence=same-source`, and sets an explicit claim ceiling. It POSTs batches to the bridge. Repository source material is not promoted to independent evidence.

## Privacy

Restricted packets are persisted in the runtime ledger and are never committed by the bridge. The default ledger path is ignored by Git. Public source scanning does not imply that arbitrary local files are safe to ingest; the repository teacher only considers tracked files and applies explicit exclusions.

## Determinism and provenance

Packet identity is deterministic for identical normalized producer content. Transport chronology is separate. Search is retrieval only. Sync is ordered by `ledger_seq`. Corrections and contradictions are new packets with parent references; historical packets are not silently rewritten.

## Compatibility

This is additive. It does not modify `window.Conscience64API`, `analytics/server.py`, the structured project registry, semantic-crossref semantics, or ECS/world authority in v1.

## Verification

Python stdlib only. Tests cover canonical identity, invalid packet rejection, append-only transport identity, exact re-ingestion idempotency, batch atomicity, ledger corruption detection, public/restricted read boundaries, authentication, sync ordering, bounded search, non-loopback token guards, tracked-source filtering/chunking, and an end-to-end repository-teacher smoke test against a live local bridge.
