# Conscience64 Public Visibility Mesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every explicitly admitted public Conscience64 research record maximally discoverable through deterministic human pages, feeds, search-engine files, machine manifests, repository navigation, and reconstruction metadata without creating a second publication authority or weakening privacy/evidence boundaries.

**Architecture:** Keep `research/projects/public-updates/admissions.json` as the sole research-publication gate. Extend the existing `build_public_updates.py` snapshot with backward-compatible optional metadata and generate all research projections from that public-only snapshot; use a separate explicit allowlist for ordinary already-public site pages that belong in sitemap/navigation but not in the research feed. Root discovery files, feeds, entry pages, and machine manifests are committed/generated artifacts verified by the same GitHub Pages gates already used by Conscience64.

**Tech Stack:** Python 3 stdlib (`json`, `hashlib`, `html`, `xml.etree.ElementTree`, `pathlib`, `datetime`, `urllib.parse`, `unittest`), static HTML/CSS/JavaScript, GitHub Actions direct-Git materialization, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-15-fitting-public-visibility-design.md`

## Global Constraints

- `PUBLIC_BY_ADMISSION != PUBLIC_BY_ACCIDENT`.
- `PUBLICATION != VALIDATION`.
- `DISCOVERABLE != CORROBORATED`.
- `RETRIEVED != INDEPENDENT_EVIDENCE`.
- Default publication classification is deny; missing/unknown classification fails closed.
- Private records are excluded before the record file is read.
- No client-side public/private filtering is permitted.
- Research feeds/projections consume only the existing admitted public snapshot; ordinary already-public pages may be linked from a site allowlist but are not silently promoted into research feeds.
- Generated outward projections preserve source identity, claim/evidence boundaries, and generation provenance.
- No restricted Knowledge Bridge packets, local Analytics ledger contents, personal/family/legal/private data, secrets, rights-restricted carriers, or unadmitted drafts are published.
- Existing scoped licenses are not widened; repository-wide license metadata remains unset unless separately authorized.
- Third-party indexing, DOI creation, and external archive ingestion are not claimed complete merely because discovery files exist.

---

## File Structure

### Create

- `research/projects/public-updates/public-site-paths.json` — explicit allowlist of ordinary public site URLs for sitemap/discovery only.
- `research/projects/public-updates/build_public_discovery.py` — deterministic generator for entry pages, feeds, sitemap, robots and machine manifests.
- `research/projects/public-updates/test_public_discovery.py` — fail-closed and projection-consistency tests.
- `research/projects/public-updates/data/reconstruction-manifest.json` — deterministic reconstruction/source-hash manifest.
- `research/projects/public-updates/entries/<record-id>/index.html` — generated indexable public page per admitted research record.
- `research/index.html` — stable public research landing page.
- `robots.txt`
- `sitemap.xml`
- `feed.atom`
- `feed.rss`
- `feed.json`
- `public-discovery.json`
- `.well-known/conscience64.json`
- `PUBLIC_VISIBILITY_ADMIN.md` — exact desired repository metadata and deliberate non-actions.

### Modify

- `research/projects/public-updates/build_public_updates.py` — validate/carry optional public metadata without changing fail-closed admission semantics.
- `research/projects/public-updates/test_public_updates.py` — optional metadata and private-read regression tests.
- `research/projects/public-updates/index.html` — canonical/feed/discovery metadata and accessible links.
- `research/projects/public-updates/app.js` — deterministic element IDs/anchors for admitted records if needed for fragment navigation; continue text construction only.
- `research/projects/index.html` — canonical/discovery links and route to the new `/research/` landing page.
- `index.html` — canonical/Open Graph/JSON-LD/feed/discovery links without changing Space Lens authority.
- `.github/workflows/public-research-updates.yml` — verify all public projections and deployed endpoints.
- `.github/workflows/pages-sync.yml` — include every new generated/public path and run discovery verification before publishing.
- `README.md` — link the stable public research/discovery surfaces and retain evidence boundaries.

---

### Task 1: Extend Public Record Metadata Without Changing Admission Semantics

**Files:**
- Modify: `research/projects/public-updates/build_public_updates.py`
- Modify: `research/projects/public-updates/test_public_updates.py`

**Interfaces:**
- Existing `build_snapshot(repo_root, admissions_path) -> dict` remains the canonical admitted-public source.
- Optional record fields admitted: `status`, `claim_ceiling`, `tags`, `updated_at`, `correction_of`.
- Snapshot output carries those fields only when they are present in the source public record.
- Existing record schema stays `conscience64/public-research-update/v1` for backward compatibility.

- [ ] **Step 1: Add failing optional-metadata tests**

Append to `test_public_updates.py`:

```python
def test_optional_public_metadata_is_validated_and_carried(self):
    temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
    (root / "research/updates/source.md").write_text("source\n", encoding="utf-8")
    record = self.record(id="meta")
    record.update({
        "status": "CANDIDATE",
        "claim_ceiling": "OPEN",
        "tags": ["hodge", "fitting"],
        "updated_at": "2026-09-15T20:00:00Z",
        "correction_of": "older-record",
    })
    write_json(pub / "records/meta.json", record)
    write_json(pub / "admissions.json", {
        "schema": builder.ADMISSIONS_SCHEMA,
        "records": [{"record": "records/meta.json", "classification": "public"}],
    })
    item = builder.build_snapshot(root, pub / "admissions.json")["records"][0]
    self.assertEqual(item["status"], "CANDIDATE")
    self.assertEqual(item["claim_ceiling"], "OPEN")
    self.assertEqual(item["tags"], ["hodge", "fitting"])
    self.assertEqual(item["correction_of"], "older-record")


def test_private_optional_metadata_is_still_never_read(self):
    temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
    (pub / "records/private.json").write_text('{"tags":["SECRET-TAG"]', encoding="utf-8")
    write_json(pub / "admissions.json", {
        "schema": builder.ADMISSIONS_SCHEMA,
        "records": [{"record": "records/private.json", "classification": "private"}],
    })
    snapshot = builder.build_snapshot(root, pub / "admissions.json")
    self.assertEqual(snapshot["record_count"], 0)
    self.assertNotIn("SECRET-TAG", builder.canonical_json(snapshot))
```

- [ ] **Step 2: Run and verify the metadata test fails while the private-read test still passes**

```bash
python3 -m unittest research/projects/public-updates/test_public_updates.py -v
```

Expected: metadata propagation test FAILS; existing privacy tests PASS.

- [ ] **Step 3: Implement conservative optional-field validation**

Add to `build_public_updates.py`:

```python
OPTIONAL_TEXT_FIELDS = {"status", "claim_ceiling", "updated_at", "correction_of"}


def optional_public_metadata(record: dict, *, record_path: str) -> dict:
    out = {}
    for field in OPTIONAL_TEXT_FIELDS:
        if field in record:
            value = record[field]
            if not isinstance(value, str) or not value.strip():
                raise PublicationError(f"{record_path}: invalid optional {field}")
            out[field] = value.strip()
    if "tags" in record:
        tags = record["tags"]
        if not isinstance(tags, list) or not all(isinstance(tag, str) and tag.strip() for tag in tags):
            raise PublicationError(f"{record_path}: tags must be non-empty strings")
        out["tags"] = sorted(set(tag.strip() for tag in tags))
    for date_field in ("updated_at",):
        if date_field in out:
            try:
                datetime.fromisoformat(out[date_field].replace("Z", "+00:00"))
            except ValueError as exc:
                raise PublicationError(f"{record_path}: {date_field} is not ISO-8601-compatible") from exc
    return out
```

When appending each public snapshot item, merge `optional_public_metadata(record, record_path=...)` into the item after the required fields. Do not read or validate optional metadata before the `classification == "private"` early continue.

- [ ] **Step 4: Re-run tests**

```bash
python3 -m unittest research/projects/public-updates/test_public_updates.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add research/projects/public-updates/build_public_updates.py research/projects/public-updates/test_public_updates.py
git commit -m "feat(public): carry claim-bounded update metadata"
```

---

### Task 2: Explicit Static-Site Allowlist and Discovery Builder Core

**Files:**
- Create: `research/projects/public-updates/public-site-paths.json`
- Create: `research/projects/public-updates/build_public_discovery.py`
- Create: `research/projects/public-updates/test_public_discovery.py`

**Interfaces:**
- Produces: `load_public_snapshot(path: Path) -> dict`.
- Produces: `load_site_paths(path: Path) -> list[dict]`.
- Produces: `entry_url(record_id: str) -> str`.
- Produces: `build_discovery_model(snapshot, site_paths, *, base_url, source_revision) -> dict`.
- Static page allowlist schema: `conscience64/public-site-paths/v1`.

- [ ] **Step 1: Create a narrow explicit site-path allowlist**

Create `public-site-paths.json` with exactly these initial entries:

```json
{
  "schema": "conscience64/public-site-paths/v1",
  "paths": [
    {"path": "/", "kind": "site-home", "title": "Conscience64"},
    {"path": "/research/", "kind": "research-index", "title": "Research"},
    {"path": "/research/projects/", "kind": "research-project-index", "title": "Research project records"},
    {"path": "/research/projects/public-updates/", "kind": "public-update-index", "title": "Public research updates"},
    {"path": "/analytics/", "kind": "research-analytics", "title": "Research Analytics"},
    {"path": "/coordinate-space/", "kind": "public-tool", "title": "Coordinate Space"},
    {"path": "/play/", "kind": "public-tool-index", "title": "Play projects"}
  ]
}
```

The allowlist means only “safe to include in sitemap/navigation”; it does not confer research-evidence or public-update status.

- [ ] **Step 2: Write failing discovery-model tests**

```python
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("public_discovery", HERE / "build_public_discovery.py")
discovery = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(discovery)


class PublicDiscoveryTests(unittest.TestCase):
    def test_entry_url_rejects_unsafe_ids(self):
        with self.assertRaises(discovery.DiscoveryError):
            discovery.entry_url("../secret")

    def test_model_separates_static_site_paths_from_research_records(self):
        snapshot = {
            "schema": "conscience64/public-research-updates/v1",
            "records": [{"id": "r1", "title": "R1", "summary": "S", "published_at": "2026-09-15T00:00:00Z", "source_path": "research/updates/x.md", "record_sha256": "a" * 64, "source_blob_sha1": "b" * 40, "source_bytes": 1, "evidence_relation": "same-source"}],
            "record_count": 1,
        }
        site_paths = [{"path": "/", "kind": "site-home", "title": "Home"}]
        model = discovery.build_discovery_model(snapshot, site_paths, base_url="https://redogit.github.io/conscience64", source_revision="deadbeef")
        self.assertEqual(len(model["research_records"]), 1)
        self.assertEqual(len(model["site_surfaces"]), 1)
        self.assertNotEqual(model["research_records"][0]["kind"], model["site_surfaces"][0]["kind"])
```

- [ ] **Step 3: Run and verify failure**

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
```

Expected: missing discovery builder.

- [ ] **Step 4: Implement safe IDs and separated discovery model**

Use:

```python
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urljoin

DISCOVERY_SCHEMA = "conscience64/public-discovery/v1"
SITE_PATHS_SCHEMA = "conscience64/public-site-paths/v1"
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")

class DiscoveryError(ValueError):
    pass


def entry_url(record_id: str) -> str:
    if not isinstance(record_id, str) or not SAFE_ID.fullmatch(record_id):
        raise DiscoveryError("unsafe public record id")
    return f"/research/projects/public-updates/entries/{record_id}/"
```

`build_discovery_model` must keep `site_surfaces` and `research_records` in separate arrays. Each research record gets a canonical entry path via `entry_url`; each site surface comes only from the explicit allowlist. Include `source_revision`, `base_url`, and these boundaries:

```text
PUBLICATION != VALIDATION
SITE_SURFACE != RESEARCH_ADMISSION
```

- [ ] **Step 5: Run tests and commit**

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
git add research/projects/public-updates/public-site-paths.json research/projects/public-updates/build_public_discovery.py research/projects/public-updates/test_public_discovery.py
git commit -m "feat(public): add explicit discovery model"
```

---

### Task 3: Generate One Indexable HTML Page Per Admitted Research Record

**Files:**
- Modify: `research/projects/public-updates/build_public_discovery.py`
- Modify: `research/projects/public-updates/test_public_discovery.py`
- Generate: `research/projects/public-updates/entries/<record-id>/index.html`

**Interfaces:**
- Produces: `render_entry_html(record, *, base_url) -> str`.
- Produces: `write_entry_pages(snapshot, *, output_root, base_url, check=False) -> list[Path]`.

- [ ] **Step 1: Add HTML safety/provenance tests**

```python
def test_entry_html_escapes_content_and_preserves_boundary(self):
    record = {
        "id": "r1", "title": "<unsafe>", "summary": "A & B",
        "published_at": "2026-09-15T00:00:00Z", "source_path": "research/updates/x.md",
        "record_sha256": "a" * 64, "source_blob_sha1": "b" * 40,
        "source_bytes": 1, "evidence_relation": "same-source",
        "status": "CANDIDATE", "claim_ceiling": "OPEN",
    }
    html = discovery.render_entry_html(record, base_url="https://redogit.github.io/conscience64")
    self.assertIn("&lt;unsafe&gt;", html)
    self.assertIn("A &amp; B", html)
    self.assertIn("PUBLICATION != VALIDATION", html)
    self.assertIn(record["record_sha256"], html)
    self.assertIn('rel="canonical"', html)
    self.assertNotIn("<unsafe>", html)
```

- [ ] **Step 2: Implement static entry rendering with no client-side filtering**

`render_entry_html` must use `html.escape`, semantic `<header>`, `<main>`, `<dl>`, `<footer>`, canonical link, meta description, Open Graph title/description/url/type, and JSON-LD `ScholarlyArticle` only as descriptive metadata; it must not assert peer review or validation.

Required visible boundary text:

```text
Evidence boundary: PUBLICATION != VALIDATION. This page is a projection of one explicitly admitted public research record and does not create independent evidence.
```

Source links must point to:

```text
https://github.com/redogit/conscience64/blob/main/<source_path>
```

Do not embed source file contents into the entry page; link to the identified public source instead.

- [ ] **Step 3: Implement deterministic write/check mode**

`write_entry_pages` writes each page to `entries/<id>/index.html`. In `check=True`, every expected file must exist and match exact rendered bytes; any extra generated entry directory not present in the snapshot must cause a stale-output failure so withdrawn/corrected public projections cannot linger silently.

- [ ] **Step 4: Run tests**

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
```

- [ ] **Step 5: Generate current entry pages and commit**

```bash
python3 research/projects/public-updates/build_public_discovery.py --entries-only --source-revision LOCAL
git add research/projects/public-updates/entries research/projects/public-updates/build_public_discovery.py research/projects/public-updates/test_public_discovery.py
git commit -m "feat(public): add indexable research entry pages"
```

---

### Task 4: Generate Atom, RSS, and JSON Feed From the Admitted Snapshot

**Files:**
- Modify: `research/projects/public-updates/build_public_discovery.py`
- Modify: `research/projects/public-updates/test_public_discovery.py`
- Create/generated: `feed.atom`
- Create/generated: `feed.rss`
- Create/generated: `feed.json`

**Interfaces:**
- Produces: `render_atom(snapshot, *, base_url) -> str`.
- Produces: `render_rss(snapshot, *, base_url) -> str`.
- Produces: `render_json_feed(snapshot, *, base_url) -> str`.

- [ ] **Step 1: Add feed privacy and deterministic ordering tests**

```python
def test_all_feeds_contain_only_snapshot_records_in_snapshot_order(self):
    snapshot = {
        "schema": "conscience64/public-research-updates/v1",
        "record_count": 2,
        "records": [
            {"id": "new", "title": "New", "summary": "N", "published_at": "2026-09-15T02:00:00Z", "source_path": "research/updates/n.md", "record_sha256": "a" * 64, "source_blob_sha1": "b" * 40, "source_bytes": 1, "evidence_relation": "same-source"},
            {"id": "old", "title": "Old", "summary": "O", "published_at": "2026-09-15T01:00:00Z", "source_path": "research/updates/o.md", "record_sha256": "c" * 64, "source_blob_sha1": "d" * 40, "source_bytes": 1, "evidence_relation": "same-source"},
        ],
    }
    atom = discovery.render_atom(snapshot, base_url="https://redogit.github.io/conscience64")
    rss = discovery.render_rss(snapshot, base_url="https://redogit.github.io/conscience64")
    feed = discovery.render_json_feed(snapshot, base_url="https://redogit.github.io/conscience64")
    for rendered in (atom, rss, feed):
        self.assertLess(rendered.index("new"), rendered.index("old"))
        self.assertIn("PUBLICATION != VALIDATION", rendered)
```

- [ ] **Step 2: Implement all three from one normalized feed-item function**

Create internal `feed_items(snapshot, base_url)` returning dictionaries with exactly:

```text
id
title
summary
published_at
updated_at (published_at fallback)
url
source_url
status (optional)
claim_ceiling (optional)
tags
```

Atom and RSS use `xml.etree.ElementTree`; JSON Feed uses version `https://jsonfeed.org/version/1.1`. No feed reads admissions or record files directly; they receive only the already-built public snapshot.

- [ ] **Step 3: Add deterministic root output writer/checker**

`build_public_discovery.py` must support:

```bash
python3 research/projects/public-updates/build_public_discovery.py --source-revision LOCAL
python3 research/projects/public-updates/build_public_discovery.py --check --source-revision LOCAL
```

The first writes feeds and later tasks' discovery files; `--check` compares exact expected bytes.

- [ ] **Step 4: Run tests, generate, and XML/JSON parse-check**

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 research/projects/public-updates/build_public_discovery.py --source-revision LOCAL
python3 - <<'PY'
import json, xml.etree.ElementTree as ET
ET.parse('feed.atom')
ET.parse('feed.rss')
json.load(open('feed.json', encoding='utf-8'))
PY
```

- [ ] **Step 5: Commit**

```bash
git add feed.atom feed.rss feed.json research/projects/public-updates/build_public_discovery.py research/projects/public-updates/test_public_discovery.py
git commit -m "feat(public): syndicate admitted research feeds"
```

---

### Task 5: Search-Engine and Machine Discovery Files

**Files:**
- Modify: `research/projects/public-updates/build_public_discovery.py`
- Modify: `research/projects/public-updates/test_public_discovery.py`
- Generate: `robots.txt`
- Generate: `sitemap.xml`
- Generate: `public-discovery.json`
- Generate: `.well-known/conscience64.json`
- Generate: `research/projects/public-updates/data/reconstruction-manifest.json`

**Interfaces:**
- Produces: `render_sitemap(model) -> str`.
- Produces: `render_robots(*, base_url) -> str`.
- Produces: `render_machine_manifest(model) -> str`.
- Produces: `render_reconstruction_manifest(snapshot, *, regeneration_command) -> str`.

- [ ] **Step 1: Add sitemap separation and provenance tests**

```python
def test_sitemap_contains_allowlisted_site_paths_and_admitted_entry_urls_only(self):
    model = {
        "base_url": "https://redogit.github.io/conscience64",
        "site_surfaces": [{"path": "/", "kind": "site-home", "title": "Home"}],
        "research_records": [{"id": "r1", "path": "/research/projects/public-updates/entries/r1/"}],
        "source_revision": "deadbeef",
    }
    xml = discovery.render_sitemap(model)
    self.assertIn("https://redogit.github.io/conscience64/", xml)
    self.assertIn("entries/r1/", xml)
    self.assertNotIn("private", xml)


def test_machine_manifest_states_evidence_boundary(self):
    model = {"base_url": "https://redogit.github.io/conscience64", "site_surfaces": [], "research_records": [], "source_revision": "deadbeef"}
    manifest = json.loads(discovery.render_machine_manifest(model))
    self.assertEqual(manifest["evidence_boundary"], "PUBLICATION != VALIDATION; RETRIEVAL != INDEPENDENT_EVIDENCE")
```

- [ ] **Step 2: Implement deterministic sitemap and robots**

`robots.txt` must be exactly equivalent to:

```text
User-agent: *
Allow: /
Sitemap: https://redogit.github.io/conscience64/sitemap.xml
```

plus a trailing newline.

`sitemap.xml` includes only explicit `site_surfaces` plus generated research entry paths. It must not scan the repository tree.

- [ ] **Step 3: Implement machine manifests**

`public-discovery.json` schema: `conscience64/public-discovery/v1`. Include stable endpoints for site home, research index, project index, public update index, `latest.json`, Atom/RSS/JSON feeds, Analytics static page, Fitting Lab public documentation path when present, API documentation, repository URL, source revision and evidence boundary.

`.well-known/conscience64.json` must be a small pointer document:

```json
{
  "schema": "conscience64/well-known/v1",
  "discovery": "https://redogit.github.io/conscience64/public-discovery.json",
  "repository": "https://github.com/redogit/conscience64",
  "evidence_boundary": "PUBLICATION != VALIDATION; RETRIEVAL != INDEPENDENT_EVIDENCE"
}
```

- [ ] **Step 4: Implement reconstruction manifest**

For each admitted record include only already-public snapshot metadata:

```text
id
record_sha256
source_path
source_blob_sha1
source_bytes
entry_url
```

and a top-level exact regeneration command:

```text
python3 research/projects/public-updates/build_public_updates.py && python3 research/projects/public-updates/build_public_discovery.py --source-revision LOCAL
```

Do not copy source file contents into this manifest.

- [ ] **Step 5: Generate, test, and commit**

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 research/projects/public-updates/build_public_discovery.py --source-revision LOCAL
python3 -m json.tool public-discovery.json >/dev/null
python3 -m json.tool .well-known/conscience64.json >/dev/null
python3 -m json.tool research/projects/public-updates/data/reconstruction-manifest.json >/dev/null
git add robots.txt sitemap.xml public-discovery.json .well-known/conscience64.json research/projects/public-updates/data/reconstruction-manifest.json research/projects/public-updates/build_public_discovery.py research/projects/public-updates/test_public_discovery.py
git commit -m "feat(public): add search and machine discovery manifests"
```

---

### Task 6: Public Research Landing Page and Metadata Links

**Files:**
- Create: `research/index.html`
- Modify: `research/projects/public-updates/index.html`
- Modify: `research/projects/public-updates/app.js`
- Modify: `research/projects/index.html`
- Modify: `index.html`

**Interfaces:**
- `/research/` is a navigation surface, not a research authority.
- Root/public-update pages advertise canonical, feed, sitemap and machine-discovery URLs.

- [ ] **Step 1: Create a no-JavaScript-required research landing page**

`research/index.html` must contain semantic `<nav>`, `<main>`, `<section>`, `<footer>` and visible links to:

```text
/research/projects/
/research/projects/public-updates/
/research/projects/public-updates/data/latest.json
/analytics/
/coordinate-space/
/public-discovery.json
/feed.atom
/feed.rss
/feed.json
```

Visible boundary:

```text
Navigation and publication do not establish evidence. Project claims remain in their cited source records and evidence ledgers.
```

- [ ] **Step 2: Add canonical/feed/discovery metadata to public update index**

In `<head>` add:

```html
<link rel="canonical" href="https://redogit.github.io/conscience64/research/projects/public-updates/">
<link rel="alternate" type="application/atom+xml" title="Conscience64 public research" href="../../../feed.atom">
<link rel="alternate" type="application/rss+xml" title="Conscience64 public research" href="../../../feed.rss">
<link rel="alternate" type="application/feed+json" title="Conscience64 public research" href="../../../feed.json">
<link rel="sitemap" type="application/xml" href="../../../sitemap.xml">
<meta property="og:title" content="Public research updates · Conscience64">
<meta property="og:type" content="website">
<meta property="og:url" content="https://redogit.github.io/conscience64/research/projects/public-updates/">
```

Add visible footer links to Atom/RSS/JSON Feed and `public-discovery.json`.

- [ ] **Step 3: Make public-update cards fragment-addressable without `innerHTML`**

Modify `app.js` so every rendered admitted record container gets:

```javascript
article.id = `update-${safeRecordId}`;
```

where `safeRecordId` is accepted only if `/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/` matches; otherwise omit the id. Continue using `textContent`/DOM construction only.

- [ ] **Step 4: Add root/project metadata links without changing authority text**

Add root canonical URL, feed alternates, sitemap link and machine-discovery link to `index.html`. Add canonical and `/research/` navigation to `research/projects/index.html`. Do not replace or weaken existing text that says the page is navigation and claims belong to linked records.

- [ ] **Step 5: Add static metadata tests**

Extend `test_public_discovery.py` to read these HTML files and assert canonical/feed/discovery links are present and that public-update `app.js` still contains no `innerHTML`.

Run:

```bash
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
node --check research/projects/public-updates/app.js
```

- [ ] **Step 6: Commit**

```bash
git add research/index.html research/projects/public-updates/index.html research/projects/public-updates/app.js research/projects/index.html index.html research/projects/public-updates/test_public_discovery.py
git commit -m "feat(public): expose accessible research discovery surfaces"
```

---

### Task 7: Publication Workflows and Exact Projection Verification

**Files:**
- Modify: `.github/workflows/public-research-updates.yml`
- Modify: `.github/workflows/pages-sync.yml`

**Interfaces:**
- `public-research-updates.yml` validates snapshot + all projections.
- `pages-sync.yml` must watch and verify all new paths before advancing `gh-pages`.

- [ ] **Step 1: Extend the public research workflow path triggers**

Add these paths to both `pull_request` and `push` triggers in `.github/workflows/public-research-updates.yml`:

```yaml
      - 'research/index.html'
      - 'research/fitting/**'
      - 'robots.txt'
      - 'sitemap.xml'
      - 'feed.atom'
      - 'feed.rss'
      - 'feed.json'
      - 'public-discovery.json'
      - '.well-known/conscience64.json'
      - 'index.html'
```

- [ ] **Step 2: Extend verification commands**

After the existing snapshot check add:

```bash
python3 research/projects/public-updates/build_public_discovery.py --check --source-revision "$GITHUB_SHA"
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 -m json.tool public-discovery.json >/dev/null
python3 -m json.tool .well-known/conscience64.json >/dev/null
python3 -m json.tool feed.json >/dev/null
python3 - <<'PY'
import xml.etree.ElementTree as ET
ET.parse('sitemap.xml')
ET.parse('feed.atom')
ET.parse('feed.rss')
PY
```

- [ ] **Step 3: Extend scheduled deployed-endpoint observation**

Keep the existing exact `latest.json` comparison. Add `curl --fail --silent --show-error --location` checks for:

```text
https://redogit.github.io/conscience64/public-discovery.json
https://redogit.github.io/conscience64/sitemap.xml
https://redogit.github.io/conscience64/feed.atom
https://redogit.github.io/conscience64/feed.rss
https://redogit.github.io/conscience64/feed.json
```

For each, compare downloaded bytes against the committed generated file and emit SHA-256 in the workflow log.

- [ ] **Step 4: Extend Pages path filters and pre-publication checks**

Add to `.github/workflows/pages-sync.yml` paths:

```yaml
      - 'research/index.html'
      - 'research/fitting/**'
      - 'robots.txt'
      - 'sitemap.xml'
      - 'feed.atom'
      - 'feed.rss'
      - 'feed.json'
      - 'public-discovery.json'
      - '.well-known/**'
```

Add before the `Advance gh-pages` step:

```bash
python3 -m unittest research/projects/public-updates/test_public_updates.py -v
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 research/projects/public-updates/build_public_updates.py --check --source-revision "$GITHUB_SHA"
python3 research/projects/public-updates/build_public_discovery.py --check --source-revision "$GITHUB_SHA"
```

- [ ] **Step 5: Syntax-check workflows and commit**

Use the repository's existing YAML review convention; at minimum inspect the diff and run any available YAML parser in the execution environment. Then:

```bash
git add .github/workflows/public-research-updates.yml .github/workflows/pages-sync.yml
git commit -m "ci(public): gate all discovery projections before publish"
```

---

### Task 8: Administrative Visibility State Without Silent License/Moderation Expansion

**Files:**
- Create: `PUBLIC_VISIBILITY_ADMIN.md`
- Modify: `README.md`

**Interfaces:**
- This task records exact desired external metadata. Code completion does not falsely claim settings changed if the executor lacks an administrative mutation tool.

- [ ] **Step 1: Create the exact target-state document**

`PUBLIC_VISIBILITY_ADMIN.md` must state:

```text
Repository homepage target:
https://redogit.github.io/conscience64/

Repository description target:
Provenance-preserving public research, tools, and experiments with explicit evidence boundaries.

Repository topics target:
research
provenance
knowledge-graph
accessibility
hodge-conjecture
experimental-research
static-site

Discussions:
Remain disabled until a moderation/purpose policy is explicitly adopted.

Repository-wide license:
Remain unset. Existing scoped licenses remain scoped; do not silently widen them.
```

Also record the verification endpoint:

```text
https://api.github.com/repos/redogit/conscience64
```

and state that repository metadata is discoverability metadata, not evidence.

- [ ] **Step 2: Add public discovery links to README**

Add a concise section linking the public research landing page, public updates, feeds, sitemap, and machine manifest, while retaining existing evidence-boundary text.

- [ ] **Step 3: Apply homepage/description/topics only if the execution environment has an authorized GitHub repository-settings action**

If such an action is available, set exactly the homepage, description, and seven topics above and verify via the repository metadata endpoint. If no authorized settings action exists, leave repository settings unchanged and report `PUBLIC_VISIBILITY_ADMIN.md` as the explicit administrative handoff; do not substitute Discussions or license changes.

- [ ] **Step 4: Commit documentation**

```bash
git add PUBLIC_VISIBILITY_ADMIN.md README.md
git commit -m "docs(public): record repository discovery target state"
```

---

### Task 9: End-to-End Adversarial Publication Tests

**Files:**
- Modify: `research/projects/public-updates/test_public_updates.py`
- Modify: `research/projects/public-updates/test_public_discovery.py`

**Interfaces:**
- All malicious/ambiguous cases fail before outward projection or preserve a weaker status.

- [ ] **Step 1: Add an unclassified/private/path-traversal projection matrix**

Create tests that construct temporary admissions with:

```text
unclassified record
private malformed record
public record with missing source
public record with ../ source path
public record with malformed ID
public record with duplicate ID
public record with correction_of referencing a missing public record
```

Expected outcomes:

- unclassified/private/path traversal/malformed ID/duplicate ID/missing source: hard `PublicationError` or `DiscoveryError` as appropriate;
- private malformed record: excluded before read and does not fail projection;
- missing `correction_of` target: record remains public but the discovery model marks the correction relation `unresolved` rather than inventing a target.

- [ ] **Step 2: Add cross-format identity test**

For one public record, parse `feed.json`, entry HTML, reconstruction manifest and `public-discovery.json`; assert they all expose the same record ID, canonical URL and `record_sha256`. This proves multiple public projections are the same source lineage, not independent evidence.

- [ ] **Step 3: Add stale-entry removal check**

Generate two admitted entries, then rebuild/check from a snapshot containing only one. `--check` must fail while the stale directory exists; normal generation must remove only generated stale entry directories under the controlled `entries/` root and must never delete arbitrary sibling files.

- [ ] **Step 4: Run all public tests**

```bash
python3 -m unittest research/projects/public-updates/test_public_updates.py -v
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 research/projects/public-updates/build_public_updates.py --check --source-revision LOCAL
python3 research/projects/public-updates/build_public_discovery.py --check --source-revision LOCAL
node --check research/projects/public-updates/app.js
```

Expected: all PASS.

- [ ] **Step 5: Commit adversarial coverage**

```bash
git add research/projects/public-updates/test_public_updates.py research/projects/public-updates/test_public_discovery.py
git commit -m "test(public): harden fail-closed visibility mesh"
```

---

## Final Verification

Run the complete public publication suite:

```bash
python3 -m unittest research/projects/public-updates/test_public_updates.py -v
python3 -m unittest research/projects/public-updates/test_public_discovery.py -v
python3 research/projects/public-updates/build_public_updates.py --check --source-revision LOCAL
python3 research/projects/public-updates/build_public_discovery.py --check --source-revision LOCAL
python3 -m json.tool research/projects/public-updates/data/latest.json >/dev/null
python3 -m json.tool research/projects/public-updates/data/reconstruction-manifest.json >/dev/null
python3 -m json.tool public-discovery.json >/dev/null
python3 -m json.tool .well-known/conscience64.json >/dev/null
python3 -m json.tool feed.json >/dev/null
python3 - <<'PY'
import xml.etree.ElementTree as ET
for path in ('sitemap.xml', 'feed.atom', 'feed.rss'):
    ET.parse(path)
PY
node --check research/projects/public-updates/app.js
node tools/check_site.mjs
node tools/check_project_current.mjs
git diff --check
```

Inspect generated artifacts for these invariants:

```text
PUBLICATION != VALIDATION
SITE_SURFACE != RESEARCH_ADMISSION
private/unclassified records absent
all research projections share admitted record IDs and hashes
all static sitemap paths come from the explicit allowlist
```

**Completion criterion:** every explicitly admitted public research record is deterministically visible through the public update snapshot, an indexable entry page, Atom/RSS/JSON feeds, sitemap, machine discovery and reconstruction manifests; ordinary site pages are discoverable only through an explicit site allowlist; private/unclassified records are not read by outward builders; Pages refuses stale projections; accessibility/navigation metadata is present; and repository metadata targets are either applied through an authorized settings action or recorded exactly without falsely claiming completion.
