import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("public_updates_builder", HERE / "build_public_updates.py")
builder = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(builder)


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


class PublicUpdateTests(unittest.TestCase):
    def make_root(self):
        temp = tempfile.TemporaryDirectory()
        root = Path(temp.name)
        pub = root / "research/projects/public-updates"
        (pub / "records").mkdir(parents=True)
        (root / "research/updates").mkdir(parents=True)
        return temp, root, pub

    def record(self, *, id="r1", source="research/updates/source.md", summary="Public summary"):
        return {
            "schema": builder.RECORD_SCHEMA,
            "id": id,
            "title": "Title " + id,
            "summary": summary,
            "published_at": "2026-09-14T00:00:00Z",
            "source_path": source,
            "evidence_relation": "same-source",
        }

    def test_public_record_included_with_hashes(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        source = root / "research/updates/source.md"; source.write_text("source\n", encoding="utf-8")
        write_json(pub / "records/r1.json", self.record())
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/r1.json", "classification": "public"}]})
        snapshot = builder.build_snapshot(root, pub / "admissions.json")
        self.assertEqual(snapshot["record_count"], 1)
        item = snapshot["records"][0]
        self.assertEqual(item["source_blob_sha1"], builder.git_blob_sha1(b"source\n"))
        self.assertEqual(item["source_bytes"], 7)
        self.assertEqual(len(item["record_sha256"]), 64)

    def test_private_is_excluded_before_record_read(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        (root / "research/updates/source.md").write_text("source\n", encoding="utf-8")
        write_json(pub / "records/public.json", self.record(id="public"))
        (pub / "records/private.json").write_text("TOP SECRET { not json", encoding="utf-8")
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [
            {"record": "records/private.json", "classification": "private"},
            {"record": "records/public.json", "classification": "public"},
        ]})
        snapshot = builder.build_snapshot(root, pub / "admissions.json")
        rendered = builder.canonical_json(snapshot)
        self.assertEqual(snapshot["record_count"], 1)
        self.assertNotIn("TOP SECRET", rendered)
        self.assertNotIn("private.json", rendered)

    def test_missing_classification_fails_closed(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/r1.json"}]})
        with self.assertRaises(builder.PublicationError): builder.build_snapshot(root, pub / "admissions.json")

    def test_public_admission_derived_from_private_history_fails_closed(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        source = root / "research/updates/source.md"; source.write_text("sanitized method summary\n", encoding="utf-8")
        write_json(pub / "records/r1.json", self.record(summary="Method learned from private history"))
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{
            "record": "records/r1.json",
            "classification": "public",
            "derived_from_private_history": True,
        }]})
        with self.assertRaisesRegex(builder.PublicationError, "private history"):
            builder.build_snapshot(root, pub / "admissions.json")

    def test_public_admission_with_structured_private_origin_fails_closed(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        source = root / "research/updates/source.md"; source.write_text("abstract method only\n", encoding="utf-8")
        write_json(pub / "records/r1.json", self.record(summary="Abstract method"))
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{
            "record": "records/r1.json",
            "classification": "public",
            "privacy_origin": {
                "classification": "private-history-method-only",
                "independently_regrounded": False,
            },
        }]})
        with self.assertRaisesRegex(builder.PublicationError, "private history"):
            builder.build_snapshot(root, pub / "admissions.json")

    def test_unknown_classification_fails_closed(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/r1.json", "classification": "maybe"}]})
        with self.assertRaises(builder.PublicationError): builder.build_snapshot(root, pub / "admissions.json")

    def test_record_path_traversal_rejected(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "../secret.json", "classification": "public"}]})
        with self.assertRaises(builder.PublicationError): builder.build_snapshot(root, pub / "admissions.json")

    def test_source_prefix_and_traversal_rejected(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        write_json(pub / "records/r1.json", self.record(source="../../secret.txt"))
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/r1.json", "classification": "public"}]})
        with self.assertRaises(builder.PublicationError): builder.build_snapshot(root, pub / "admissions.json")

    def test_duplicate_public_id_rejected(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        (root / "research/updates/source.md").write_text("source\n", encoding="utf-8")
        write_json(pub / "records/a.json", self.record(id="same")); write_json(pub / "records/b.json", self.record(id="same"))
        write_json(pub / "admissions.json", {"schema": builder.ADMISSIONS_SCHEMA, "records": [
            {"record": "records/a.json", "classification": "public"}, {"record": "records/b.json", "classification": "public"}]})
        with self.assertRaises(builder.PublicationError): builder.build_snapshot(root, pub / "admissions.json")

    def test_deterministic_order_independent_of_admission_order(self):
        temp, root, pub = self.make_root(); self.addCleanup(temp.cleanup)
        (root / "research/updates/source.md").write_text("source\n", encoding="utf-8")
        write_json(pub / "records/a.json", self.record(id="a")); write_json(pub / "records/b.json", self.record(id="b"))
        manifest = pub / "admissions.json"
        write_json(manifest, {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/a.json", "classification": "public"}, {"record": "records/b.json", "classification": "public"}]})
        first = builder.canonical_json(builder.build_snapshot(root, manifest))
        write_json(manifest, {"schema": builder.ADMISSIONS_SCHEMA, "records": [{"record": "records/b.json", "classification": "public"}, {"record": "records/a.json", "classification": "public"}]})
        second = builder.canonical_json(builder.build_snapshot(root, manifest))
        self.assertEqual(first, second)

    def test_operation_report_has_required_provenance(self):
        snapshot = {"record_count": 1, "records": [{"id": "x", "record_sha256": "a" * 64, "source_blob_sha1": "b" * 40}]}
        report = builder.operation_report(snapshot, source_revision="deadbeef", generated_at="2026-09-14T07:00:00Z", result="validated", endpoint="https://example.invalid/latest.json")
        self.assertEqual(report["source_revision"], "deadbeef")
        self.assertEqual(report["result"], "validated")
        self.assertEqual(report["included_records"][0]["id"], "x")
        self.assertIn("snapshot_sha256", report); self.assertIn("endpoint", report)

    def test_private_language_learning_boundary_is_explicit_in_recovery(self):
        repo_root = HERE.parents[2]
        boundary_path = repo_root / "research/history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md"
        self.assertTrue(boundary_path.is_file(), "private language-learning boundary is missing")
        boundary = boundary_path.read_text(encoding="utf-8")
        for required in (
            "PRIVATE_HISTORY != PUBLIC_EVIDENCE",
            "PRIVATE_HISTORY != PROJECT_ARTIFACT",
            "LANGUAGE_PATTERN != PERSONAL_PROFILE",
            "LEARNED_METHOD != DISCLOSURE",
            "DERIVED_FROM_PRIVATE_HISTORY != SAFE_TO_PUBLISH",
        ):
            self.assertIn(required, boundary)

        recover = (repo_root / "skills/recover-bound/SKILL.md").read_text(encoding="utf-8")
        for required in (
            "Private language-learning boundary",
            "do not quote",
            "do not correlate identities",
            "do not profile people",
            "do not promote the private history as project evidence",
        ):
            self.assertIn(required, recover)

    def test_static_surface_uses_text_construction(self):
        app = (HERE / "app.js").read_text(encoding="utf-8")
        html = (HERE / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("innerHTML", app); self.assertIn("textContent", app)
        self.assertIn("Content-Security-Policy", html)
        self.assertIn("data/latest.json", (HERE / "README.md").read_text(encoding="utf-8"))


if __name__ == "__main__": unittest.main()
