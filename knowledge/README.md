# Conscience64 Direct Knowledge Bridge

This directory adds a direct, append-only knowledge carrier beside the existing Conscience64 browser API and Research Analytics event ledger.

It does **not** turn ingestion into truth. The bridge is a retrieval/review carrier with explicit provenance and visibility boundaries.

```text
INGESTED != ACCEPTED_AS_FACT
RELATED != SUPPORTS
RETRIEVED != CORROBORATED
REPEATED != INDEPENDENT
TEST_PASS != PROOF
PUBLICATION != VALIDATION
MODEL_AGREEMENT != EVIDENCE
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
```

## Components

- `packet.py` — canonical producer packet validation and deterministic SHA-256 UOIDs.
- `ledger.py` — append-only JSONL persistence, integrity checking, idempotent exact re-ingestion, sync, and search.
- `bridge.py` — HTTP ingress/read/sync/search service.
- `teach_repo.py` — conservative teacher for tracked public UTF-8 repository source.
- `KNOWLEDGE_PACKET_SCHEMA.json` — producer-facing packet schema.

The existing `window.Conscience64API`, project registry, analytics ledger, ECS/world authority, and research promotion rules remain separate.

## Start locally

From the repository root:

```bash
export C64_KNOWLEDGE_WRITE_TOKEN='replace-with-a-long-write-token'
export C64_KNOWLEDGE_READ_TOKEN='replace-with-a-long-read-token'
python3 -m knowledge.bridge
```

Default endpoint: `http://127.0.0.1:8776`

Default runtime ledger: `knowledge/knowledge.jsonl`

The runtime ledger is ignored by Git.

### Exposure guard

Knowledge Bridge v1 is **loopback-only**. It refuses every non-loopback bind, even when credentials are supplied. Remote/private serving is a separate deployment boundary that requires explicit TLS, access-control, retention, and operations evidence before admission.

A write bearer token of at least 16 characters is required even on loopback. The read token is optional; leaving it empty disables authenticated restricted reads while public-only reads remain available. When a read token is configured, it must be at least 16 characters.

## Teach one packet

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $C64_KNOWLEDGE_WRITE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{
    "project":"operator-moonshot",
    "kind":"HYPOTHESIS",
    "content":"A bounded hypothesis to review",
    "source":"human:research-session",
    "visibility":"restricted",
    "evidence":"untested",
    "independence":"same-source",
    "claim_ceiling":"hypothesis only",
    "scope":"bounded research note"
  }' \
  http://127.0.0.1:8776/v1/knowledge
```

The server assigns deterministic `packet_uoid`, monotonic `ledger_seq`, unique transport `entry_id`, and server `ingested_at`. Exact packet re-ingestion is idempotent: it returns the original entry rather than manufacturing repeated evidence.

## Read and sync

Unauthenticated knowledge reads return **public packets only**.

```bash
curl 'http://127.0.0.1:8776/v1/knowledge/sync?after=0&limit=100'
```

A valid configured read bearer grants access to restricted packets:

```bash
curl \
  -H "Authorization: Bearer $C64_KNOWLEDGE_READ_TOKEN" \
  'http://127.0.0.1:8776/v1/knowledge/search?q=decision%20field&limit=25'
```

Supplying an invalid read token returns `401`; it is not silently downgraded to a public-only query. Fetching a restricted UOID without read authorization returns `404` so its existence is not disclosed.

## Teach the tracked public repository

Preview first:

```bash
python3 -m knowledge.teach_repo --root . --dry-run
```

Then send the tracked source corpus to the local bridge:

```bash
python3 -m knowledge.teach_repo \
  --root . \
  --endpoint http://127.0.0.1:8776 \
  --write-token "$C64_KNOWLEDGE_WRITE_TOKEN"
```

The teacher obtains paths from `git ls-files`, accepts bounded UTF-8 text, skips symlinks, skips common secret/key/environment/runtime-ledger paths, chunks source deterministically, and labels every packet:

```text
kind = REFERENCE
evidence = source-material
independence = same-source
claim_ceiling = repository-carried source; not independently validated
visibility = public
```

That means Conscience64 can retrieve and cross-reference its repository corpus without pretending the repository independently validates its own scientific claims.

Do not use this teacher for arbitrary untracked local directories. Restricted/private research should be sent explicitly as `visibility=restricted` packets through the authenticated local bridge.

## HTTP surface

```text
POST /v1/knowledge
POST /v1/knowledge/batch
GET  /v1/knowledge/<packet_uoid>
GET  /v1/knowledge/sync?after=<ledger_seq>&limit=<n>
GET  /v1/knowledge/search?q=<text>&project=<id>&kind=<kind>&limit=<n>
GET  /v1/health
```

Batch ingestion validates all producer packets before writing any of them.

## Verify

```bash
python3 -m py_compile knowledge/*.py
python3 -m unittest discover -s knowledge -p 'test_*.py' -v
```

The suite covers packet identity, claim/visibility validation, append-only integrity, exact re-ingestion idempotency, corruption detection, public/restricted filtering, authorization, batch atomicity, body bounds, required loopback write authentication, unconditional non-loopback refusal, repository filtering/chunking, and a live end-to-end repository-teacher smoke test.
