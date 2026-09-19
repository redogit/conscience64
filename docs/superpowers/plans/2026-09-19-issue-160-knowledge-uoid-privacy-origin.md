# Issue 160 — Knowledge/UOID Privacy-Origin Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Conscience64 Knowledge/UOID carrier accept only a deliberately constructed, non-identifying abstract METHOD descendant of private history while ensuring the private narrative itself is never required, stored, searchable, or promoted as project evidence.

**Architecture:** Add one optional privacy-origin classification to the existing canonical knowledge packet contract and one narrow constructor for private-history-derived methods. When that classification is present, the packet is forced into a restricted METHOD-only shape with constant non-identifying provenance fields, no parent/source-revision/timestamp/tags/metadata side channels, and the existing SHA-256 UOID computed only from the allowed abstract carrier. Existing ordinary packets remain backward-compatible.

**Tech Stack:** Python 3 standard library, JSON Schema 2020-12, existing append-only KnowledgeLedger, existing loopback HTTP bridge, unittest, SHA-256 UOID.

**Spec:** `research/history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md` and GitHub Issue #160.

## Global Constraints

- `PRIVATE_HISTORY != PUBLIC_EVIDENCE`.
- `PRIVATE_HISTORY != PROJECT_ARTIFACT`.
- `LANGUAGE_PATTERN != PERSONAL_PROFILE`.
- `LEARNED_METHOD != DISCLOSURE`.
- `DERIVED_FROM_PRIVATE_HISTORY != SAFE_TO_PUBLISH`.
- `IDENTITY != DISCLOSURE`.
- `CONTENT_ADDRESSING != PUBLICATION_PERMISSION`.
- `UOID != AUTHORITY`.
- The raw private narrative is not an input to the Knowledge/UOID constructor added by this slice.
- The allowed descendant is an abstract method only.
- A private-history-derived method packet is always `kind=METHOD`.
- A private-history-derived method packet is always `visibility=restricted`.
- Its source is the constant `private-history:method-only`, never a person, handle, URL, thread, relationship, or historical locator.
- Its evidence is the constant `private-source-not-project-evidence`.
- Its independence is the constant `not-independent`.
- Its claim ceiling is the constant `abstract method only; not project evidence`.
- Its scope is the constant `private-history-method-only`.
- A private-history-derived method packet may not contain `parents`, `tags`, `metadata`, `source_revision`, or `observed_at`.
- The packet UOID is derived only from the admitted abstract packet fields.
- Existing ordinary packet identities and existing ledger entries remain valid.
- This slice does not implement semantic-search propagation, RMADAY/JUST LOAD IT, ECS/client state, agent/tool handoffs, or export/sync propagation. Those remain later Issue #160 slices.
- No private historical text is committed as a fixture or test value.
- No new dependencies.

## Review Focus

1. **Laundering through public visibility:** a method-only packet marked public must be rejected before hashing or persistence.
2. **Laundering through provenance side channels:** names/handles/URLs must not be smuggled through source, metadata, parents, tags, source_revision, or observed_at.
3. **UOID mutation safety:** changing the privacy-origin classification, method content, or fixed boundary fields must invalidate the old UOID.
4. **Public retrieval:** unauthenticated get/sync/search must never return the restricted method-only carrier.
5. **Backward compatibility:** existing ordinary public/restricted packets without `privacy_origin` must keep their current normalization and UOID behavior.

---

### Task 1: Add the private-history METHOD packet contract

**Files:**
- Modify: `knowledge/packet.py`
- Modify: `knowledge/KNOWLEDGE_PACKET_SCHEMA.json`
- Modify: `knowledge/test_packet.py`

**Interfaces:**
- Existing: `normalize_packet(payload: dict[str, Any]) -> dict[str, Any]`
- Existing: `verify_packet_uoid(packet: dict[str, Any]) -> bool`
- New: `build_private_method_packet(project: str, method: str) -> dict[str, Any]`
- New constant: `PRIVATE_METHOD_ORIGIN = "private-history-method-only"`

- [ ] **Step 1: Write the failing constructor test**

Add to `knowledge/test_packet.py`:

```python
def test_private_method_constructor_uses_only_non_identifying_fixed_provenance(self):
    module = load_module(self)
    packet = module.build_private_method_packet(
        "conscience64",
        "Compare protected invariants before promoting a transformed result.",
    )
    self.assertEqual(packet["project"], "conscience64")
    self.assertEqual(packet["kind"], "METHOD")
    self.assertEqual(packet["content"], "Compare protected invariants before promoting a transformed result.")
    self.assertEqual(packet["source"], "private-history:method-only")
    self.assertEqual(packet["visibility"], "restricted")
    self.assertEqual(packet["privacy_origin"], "private-history-method-only")
    self.assertEqual(packet["evidence"], "private-source-not-project-evidence")
    self.assertEqual(packet["independence"], "not-independent")
    self.assertEqual(packet["claim_ceiling"], "abstract method only; not project evidence")
    self.assertEqual(packet["scope"], "private-history-method-only")
    self.assertRegex(packet["packet_uoid"], r"^uoid:sha256:[0-9a-f]{64}$")
    for forbidden in ("parents", "tags", "metadata", "source_revision", "observed_at"):
        self.assertNotIn(forbidden, packet)
```

- [ ] **Step 2: Run the test and require RED**

Run:

```bash
python3 -m unittest knowledge.test_packet.KnowledgePacketTests.test_private_method_constructor_uses_only_non_identifying_fixed_provenance -v
```

Expected: FAIL because `build_private_method_packet` does not exist.

- [ ] **Step 3: Write laundering rejection tests before implementation**

Add:

```python
def test_private_method_origin_rejects_public_or_non_method_packets(self):
    module = load_module(self)
    base = {
        "project": "conscience64",
        "kind": "METHOD",
        "content": "Compare invariants before promotion.",
        "source": "private-history:method-only",
        "visibility": "restricted",
        "privacy_origin": "private-history-method-only",
        "evidence": "private-source-not-project-evidence",
        "independence": "not-independent",
        "claim_ceiling": "abstract method only; not project evidence",
        "scope": "private-history-method-only",
    }
    with self.assertRaisesRegex(ValueError, "visibility"):
        module.normalize_packet(dict(base, visibility="public"))
    with self.assertRaisesRegex(ValueError, "kind"):
        module.normalize_packet(dict(base, kind="HYPOTHESIS"))

def test_private_method_origin_rejects_identity_bearing_side_channels(self):
    module = load_module(self)
    packet = {
        "project": "conscience64",
        "kind": "METHOD",
        "content": "Compare invariants before promotion.",
        "source": "private-history:method-only",
        "visibility": "restricted",
        "privacy_origin": "private-history-method-only",
        "evidence": "private-source-not-project-evidence",
        "independence": "not-independent",
        "claim_ceiling": "abstract method only; not project evidence",
        "scope": "private-history-method-only",
    }
    forbidden_values = {
        "parents": ["uoid:sha256:" + "a" * 64],
        "tags": ["historical-handle"],
        "metadata": {"person": "private"},
        "source_revision": "private-thread-17",
        "observed_at": "2026-09-19T09:00:00Z",
    }
    for field, value in forbidden_values.items():
        with self.subTest(field=field):
            with self.assertRaisesRegex(ValueError, field):
                module.normalize_packet(dict(packet, **{field: value}))

def test_private_method_origin_rejects_variable_provenance_fields(self):
    module = load_module(self)
    packet = module.build_private_method_packet("conscience64", "Preserve disagreement before convergence.")
    producer = {key: value for key, value in packet.items() if key != "packet_uoid"}
    for field, value in {
        "source": "forum:private-handle",
        "evidence": "private quote",
        "independence": "independent",
        "claim_ceiling": "project evidence",
        "scope": "named private event",
    }.items():
        with self.subTest(field=field):
            with self.assertRaisesRegex(ValueError, field):
                module.normalize_packet(dict(producer, **{field: value}))
```

- [ ] **Step 4: Run the new tests and require RED**

Run:

```bash
python3 -m unittest knowledge.test_packet -v
```

Expected: the new private-method tests fail because the contract does not exist.

- [ ] **Step 5: Implement the minimal packet contract**

In `knowledge/packet.py`:

```python
PRIVATE_METHOD_ORIGIN = "private-history-method-only"
PRIVATE_METHOD_SOURCE = "private-history:method-only"
PRIVATE_METHOD_EVIDENCE = "private-source-not-project-evidence"
PRIVATE_METHOD_INDEPENDENCE = "not-independent"
PRIVATE_METHOD_CLAIM_CEILING = "abstract method only; not project evidence"
PRIVATE_METHOD_SCOPE = "private-history-method-only"
PRIVACY_ORIGINS = frozenset({PRIVATE_METHOD_ORIGIN})
```

Add `privacy_origin` to the optional producer fields.

After ordinary string normalization and before UOID calculation, enforce:

```python
if packet.get("privacy_origin") == PRIVATE_METHOD_ORIGIN:
    required_exact = {
        "kind": "METHOD",
        "source": PRIVATE_METHOD_SOURCE,
        "visibility": "restricted",
        "evidence": PRIVATE_METHOD_EVIDENCE,
        "independence": PRIVATE_METHOD_INDEPENDENCE,
        "claim_ceiling": PRIVATE_METHOD_CLAIM_CEILING,
        "scope": PRIVATE_METHOD_SCOPE,
    }
    for field, expected in required_exact.items():
        if packet.get(field) != expected:
            raise ValueError(f"invalid private method field: {field}")
    for forbidden in ("parents", "tags", "metadata", "source_revision", "observed_at"):
        if forbidden in packet:
            raise ValueError(f"private method packet forbids field: {forbidden}")
```

Reject any unknown `privacy_origin`.

Implement:

```python
def build_private_method_packet(project: str, method: str) -> dict[str, Any]:
    return normalize_packet({
        "project": project,
        "kind": "METHOD",
        "content": method,
        "source": PRIVATE_METHOD_SOURCE,
        "visibility": "restricted",
        "privacy_origin": PRIVATE_METHOD_ORIGIN,
        "evidence": PRIVATE_METHOD_EVIDENCE,
        "independence": PRIVATE_METHOD_INDEPENDENCE,
        "claim_ceiling": PRIVATE_METHOD_CLAIM_CEILING,
        "scope": PRIVATE_METHOD_SCOPE,
    })
```

The function takes no private-source argument.

- [ ] **Step 6: Update the producer JSON Schema**

Add:

```json
"privacy_origin": {
  "type": "string",
  "enum": ["private-history-method-only"]
}
```

Add an `allOf` conditional requiring the exact fixed values and forbidding the side-channel fields when `privacy_origin` is `private-history-method-only`.

Use JSON Schema `if/then` with:

```json
{
  "if": {
    "properties": {
      "privacy_origin": {"const": "private-history-method-only"}
    },
    "required": ["privacy_origin"]
  },
  "then": {
    "properties": {
      "kind": {"const": "METHOD"},
      "source": {"const": "private-history:method-only"},
      "visibility": {"const": "restricted"},
      "evidence": {"const": "private-source-not-project-evidence"},
      "independence": {"const": "not-independent"},
      "claim_ceiling": {"const": "abstract method only; not project evidence"},
      "scope": {"const": "private-history-method-only"}
    },
    "required": [
      "evidence", "independence", "claim_ceiling", "scope"
    ],
    "not": {
      "anyOf": [
        {"required": ["parents"]},
        {"required": ["tags"]},
        {"required": ["metadata"]},
        {"required": ["source_revision"]},
        {"required": ["observed_at"]}
      ]
    }
  }
}
```

- [ ] **Step 7: Add UOID-specific regression tests**

Add:

```python
def test_private_method_uoid_depends_on_abstract_method_and_boundary_marker(self):
    module = load_module(self)
    a = module.build_private_method_packet("conscience64", "Compare invariants before promotion.")
    b = module.build_private_method_packet("conscience64", "Compare invariants before promotion.")
    c = module.build_private_method_packet("conscience64", "Preserve disagreement before promotion.")
    self.assertEqual(a["packet_uoid"], b["packet_uoid"])
    self.assertNotEqual(a["packet_uoid"], c["packet_uoid"])

    mutated = dict(a)
    mutated["privacy_origin"] = "other"
    self.assertFalse(module.verify_packet_uoid(mutated))

def test_private_method_constructor_has_no_raw_private_source_parameter(self):
    module = load_module(self)
    with self.assertRaises(TypeError):
        module.build_private_method_packet(
            "conscience64",
            "Compare invariants before promotion.",
            raw_private_source="must never be accepted",
        )
```

- [ ] **Step 8: Run packet tests and require GREEN**

Run:

```bash
python3 -m unittest knowledge.test_packet -v
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add knowledge/packet.py knowledge/KNOWLEDGE_PACKET_SCHEMA.json knowledge/test_packet.py
git commit -m "feat: add private method UOID carrier"
```

---

### Task 2: Preserve privacy-origin behavior through ledger and local bridge

**Files:**
- Modify: `knowledge/test_ledger.py`
- Modify: `knowledge/test_bridge.py`
- Production files: no changes unless a failing test proves current ledger/bridge behavior is insufficient.

**Interfaces:**
- Existing `KnowledgeLedger.append`, `get`, `sync`, `search`.
- Existing HTTP POST/GET Knowledge Bridge routes.

- [ ] **Step 1: Write the ledger privacy tests**

Add to `knowledge/test_ledger.py`:

```python
def test_private_method_packet_is_restricted_and_idempotent(self):
    from knowledge.packet import build_private_method_packet
    payload = build_private_method_packet(
        "conscience64",
        "Preserve distinctions before combining results.",
    )
    producer = {key: value for key, value in payload.items() if key != "packet_uoid"}
    first = self.ledger.append(producer)
    second = self.ledger.append(producer)
    self.assertEqual(first["entry_id"], second["entry_id"])
    self.assertEqual(first["packet_uoid"], second["packet_uoid"])
    self.assertIsNone(self.ledger.get(first["packet_uoid"]))
    authorized = self.ledger.get(first["packet_uoid"], include_restricted=True)
    self.assertEqual(authorized["content"], "Preserve distinctions before combining results.")
    self.assertEqual(authorized["source"], "private-history:method-only")
    self.assertNotIn("metadata", authorized)

def test_public_search_cannot_discover_private_method_carrier(self):
    from knowledge.packet import build_private_method_packet
    payload = build_private_method_packet(
        "conscience64",
        "Test the cheapest counterexample before promotion.",
    )
    producer = {key: value for key, value in payload.items() if key != "packet_uoid"}
    self.ledger.append(producer)
    self.assertEqual(self.ledger.search(q="counterexample"), [])
    self.assertEqual(
        len(self.ledger.search(q="counterexample", include_restricted=True)),
        1,
    )
```

- [ ] **Step 2: Run ledger tests**

Run:

```bash
python3 -m unittest knowledge.test_ledger -v
```

Expected: PASS if existing visibility behavior is already sufficient. If it fails, change only the minimum ledger code required by the failing assertion.

- [ ] **Step 3: Write HTTP rejection and concealment tests**

Add to `knowledge/test_bridge.py`:

```python
def test_private_method_packet_is_concealed_without_read_auth(self):
    from knowledge.packet import build_private_method_packet
    built = build_private_method_packet(
        "conscience64",
        "Preserve disagreement before convergence.",
    )
    producer = {key: value for key, value in built.items() if key != "packet_uoid"}
    status, saved = self.request("POST", "/v1/knowledge", producer, WRITE_TOKEN)
    self.assertEqual(status, 202)
    uoid = saved["packet_uoid"]

    status, body = self.request("GET", "/v1/knowledge/" + uoid)
    self.assertEqual(status, 404)
    self.assertEqual(body["error"], "not_found")

    status, found = self.request("GET", "/v1/knowledge/" + uoid, token=READ_TOKEN)
    self.assertEqual(status, 200)
    self.assertEqual(found["privacy_origin"], "private-history-method-only")
    self.assertEqual(found["source"], "private-history:method-only")

def test_bridge_rejects_private_origin_laundering_as_public(self):
    bad = packet("Abstract-looking rewrite", visibility="public", kind="METHOD")
    bad.update({
        "privacy_origin": "private-history-method-only",
        "source": "private-history:method-only",
        "evidence": "private-source-not-project-evidence",
        "independence": "not-independent",
        "claim_ceiling": "abstract method only; not project evidence",
        "scope": "private-history-method-only",
    })
    status, body = self.request("POST", "/v1/knowledge", bad, WRITE_TOKEN)
    self.assertEqual(status, 400)
    self.assertEqual(body["error"], "invalid_request")
    self.assertIn("visibility", body["detail"])
```

- [ ] **Step 4: Run bridge tests**

Run:

```bash
python3 -m unittest knowledge.test_bridge -v
```

Expected: PASS if packet-level validation naturally propagates through the existing bridge.

- [ ] **Step 5: Run the full knowledge suite**

Run:

```bash
python3 -m unittest discover -s knowledge -p 'test_*.py' -v
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

If only tests changed:

```bash
git add knowledge/test_ledger.py knowledge/test_bridge.py
git commit -m "test: verify private method carrier confinement"
```

If production code also had to change, include only the exact files required by the observed RED failure.

---

### Task 3: Document the carrier boundary and verify the adjacent publication gate

**Files:**
- Modify: `knowledge/README.md`
- Verify: `research/projects/public-updates/test_public_updates.py`
- Verify: `research/history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md`
- Update: GitHub Issue #160 after successful execution.

**Interfaces:**
- Documentation must describe the exact runtime contract from Tasks 1–2.
- No private history is added to docs or examples.

- [ ] **Step 1: Add the Knowledge README contract**

Add a section:

```markdown
## Private-history method-only carrier

Private historical material itself is not a Knowledge packet source.

When an abstract problem-solving method is intentionally retained from private history, construct it with `build_private_method_packet(project, method)`. The resulting packet is restricted and carries only the constant non-identifying origin marker `private-history-method-only`.

The constructor does not accept the raw private source, names, handles, links, relationships, timestamps, parent UOIDs, metadata, or arbitrary provenance.

`PRIVATE_HISTORY != KNOWLEDGE_PACKET`
`ABSTRACT_METHOD != PROJECT_EVIDENCE`
`UOID != PUBLICATION_PERMISSION`
`AUTHORIZED_RESTRICTED_READ != AUTHORITY_TRANSFER`
```

Include a safe generic example:

```python
from knowledge.packet import build_private_method_packet

packet = build_private_method_packet(
    "conscience64",
    "Compare protected invariants before promoting a transformed result.",
)
```

- [ ] **Step 2: Verify the public-update guard remains green**

Run:

```bash
python3 -m unittest discover -s research/projects/public-updates -p 'test_*.py' -v
```

Expected: PASS, including the existing `derived_from_private_history` fail-closed test.

- [ ] **Step 3: Verify the complete Knowledge suite again**

Run:

```bash
python3 -m py_compile knowledge/*.py
python3 -m unittest discover -s knowledge -p 'test_*.py' -v
```

Expected: PASS.

- [ ] **Step 4: Run repository-neighbor checks**

Run:

```bash
node tools/check_project_current.mjs
python3 tools/redogit_selfcheck.py
```

Expected: PASS.

- [ ] **Step 5: Commit documentation**

```bash
git add knowledge/README.md
git commit -m "docs: document private method knowledge carrier"
```

- [ ] **Step 6: Update Issue #160 only after all tests pass**

Mark only these gates complete:

```text
[x] knowledge packet path carries a non-identifying private-origin/method-only classification
[x] UOID tests prove private narrative is not required to derive the allowed abstract method carrier
[x] no private material is committed as part of this work
```

Leave semantic search, provenance-wide propagation, RMADAY/JUST LOAD IT, ECS, handoffs, and export/sync gates unchecked.

Add exact commit IDs and test commands to the issue comment/update.

## Execution Boundary

This plan closes only the first deep-carrier slice of Issue #160.

```text
KNOWLEDGE/UOID SLICE PASS
!=
ISSUE 160 COMPLETE
```

The next plan should begin only after this slice is reviewed and admitted.
