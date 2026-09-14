# Conscience64 Knowledge Bridge v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working direct knowledge-ingress/read/sync bridge for Conscience64 with deterministic packet identity, append-only provenance, restricted/public separation, and a conservative repository teacher.

**Architecture:** A Python-stdlib knowledge packet layer feeds an append-only JSONL ledger. A small loopback-only HTTP service exposes authenticated writes plus visibility-filtered reads/sync/search. A separate teacher CLI converts tracked repository text into explicitly source-only `REFERENCE` packets and sends them through the same HTTP contract.

**Tech Stack:** Python 3 stdlib (`http.server`, `urllib`, `json`, `hashlib`, `hmac`, `threading`, `unittest`), JSONL, GitHub Actions without third-party actions.

**Spec:** `docs/superpowers/specs/2026-09-14-conscience64-knowledge-bridge-design.md`

## Global Constraints

- Existing Conscience64 authority surfaces remain unchanged.
- `INGESTED != ACCEPTED_AS_FACT` and `TRANSPORT_VALIDITY != EVIDENCE_VALIDITY` are hard invariants.
- Restricted knowledge is never returned without valid read authorization.
- Every bridge instance requires a write bearer token of at least 16 characters, including loopback.
- A configured read bearer token must be at least 16 characters; omitting it disables restricted reads.
- Knowledge Bridge v1 rejects every non-loopback bind; remote/private serving remains a separate future deployment boundary.
- Runtime knowledge ledger files are not committed.
- Python stdlib only; no new runtime dependencies.

---

### Task 1: Canonical knowledge packets

**Files:** `knowledge/__init__.py`, `knowledge/packet.py`, `knowledge/test_packet.py`, `knowledge/KNOWLEDGE_PACKET_SCHEMA.json`

**Produces:** `normalize_packet(payload: dict) -> dict`, `verify_packet_uoid(packet: dict) -> bool`.

- [x] Write failing tests for deterministic UOID, required fields, kind/visibility enumeration, forbidden transport fields, list normalization, and malformed metadata.
- [x] Run packet tests and observe failure before implementation.
- [x] Implement canonical validation/serialization and SHA-256 UOID assignment.
- [x] Re-run packet tests and require all pass.

### Task 2: Append-only knowledge ledger

**Files:** `knowledge/ledger.py`, `knowledge/test_ledger.py`

**Produces:** `KnowledgeLedger.append`, `append_many`, `get`, `sync`, `search`, `validate`.

- [x] Write failing tests for monotonic sequence, separate entry identity, exact re-ingestion idempotency, batch atomicity, corruption detection, visibility filtering, sync, and search.
- [x] Implement locked JSONL persistence with fsync and integrity checks.
- [x] Run packet + ledger tests and require all pass.

### Task 3: HTTP bridge and authorization

**Files:** `knowledge/bridge.py`, `knowledge/test_bridge.py`

**Produces:** documented `/v1/knowledge*` and `/v1/health` HTTP contract plus `build_server(...)` for tests.

- [x] Write failing local HTTP integration tests for POST, batch, public-only reads, authorized restricted reads, `404` concealment, sync, search, health, body limits, and startup exposure guards.
- [x] Implement the HTTP handler/server with constant-time bearer comparison and JSON-only ingestion.
- [x] Run all knowledge tests and require all pass.

### Task 4: Repository teacher

**Files:** `knowledge/teach_repo.py`, `knowledge/test_teach_repo.py`

**Produces:** tracked-file enumeration, safe text chunk packet construction, HTTP batch sender, CLI.

- [x] Write failing tests using a temporary git repository and a live bridge.
- [x] Implement tracked UTF-8 text filtering/chunking, conservative exclusions, explicit source-only epistemic labels, and HTTP batch sending.
- [x] Verify repeated teaching is idempotent at the knowledge ledger.
- [x] Run all knowledge tests and require all pass.

### Task 5: Documentation, CI, and reviewable delivery

**Files:** `knowledge/README.md`, `.github/workflows/knowledge-bridge-check.yml`, `.gitignore`

- [x] Document local launch, authentication, curl examples, teacher usage, privacy boundary, claim ceiling, and verification commands.
- [x] Add runtime ledger ignore entries.
- [x] Add CI that materializes the exact commit without third-party Actions, compiles modules, runs the full test suite, and dry-runs repository teaching.
- [x] Run `python3 -m py_compile knowledge/*.py` and the complete unit/integration suite locally: 26 tests passed.
- [x] Open the reviewable pull request and verify its GitHub checks.

### Task 6: Post-merge operational-boundary hardening

**Files:** `knowledge/bridge.py`, `knowledge/test_bridge.py`, `knowledge/README.md`, this plan, and the v1 design spec.

- [x] Add regression tests requiring strong loopback write authentication and unconditional non-loopback refusal.
- [x] Run exact GitHub CI against the unchanged implementation and observe the intended red state: run `34854220027`, 27 tests, exactly 2 boundary-test failures.
- [x] Enforce a write token of at least 16 characters on every bridge startup and make `_require_write_auth()` unconditional.
- [x] Reject every non-loopback bind in v1, regardless of supplied credentials; keep remote/private serving outside this implementation.
- [x] Re-run exact CI on production-fix commit `022b2a56b27cbb75785efe90124f7b7a20b5c5ca`: run `34854406706` completed successfully.
- [x] Update operational documentation and design provenance without changing evidence semantics, repository-teacher labels, browser API authority, analytics authority, or ECS/world authority.
