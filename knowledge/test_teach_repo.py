import importlib
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path

from knowledge import bridge

try:
    teacher = importlib.import_module('knowledge.teach_repo')
except ModuleNotFoundError:
    teacher = None

WRITE_TOKEN = 'write-token-1234567890'
READ_TOKEN = 'read-token-12345678901'


class RepositoryTeacherTests(unittest.TestCase):
    def setUp(self):
        if teacher is None:
            self.fail('knowledge.teach_repo is not implemented yet')
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        subprocess.run(['git', '-C', str(self.root), 'config', 'user.email', 'test@example.com'], check=True)
        subprocess.run(['git', '-C', str(self.root), 'config', 'user.name', 'Test'], check=True)
        (self.root / 'research').mkdir()
        (self.root / 'knowledge').mkdir()
        (self.root / 'README.md').write_text('Conscience64 public source\n', encoding='utf-8')
        (self.root / 'research' / 'note.md').write_text('decision field\n' * 8, encoding='utf-8')
        (self.root / '.env').write_text('SECRET=value\n', encoding='utf-8')
        (self.root / 'private.key').write_text('not-for-ingest\n', encoding='utf-8')
        (self.root / 'knowledge' / 'knowledge.jsonl').write_text('{"runtime":true}\n', encoding='utf-8')
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(self.root), 'commit', '-qm', 'fixture'], check=True)
        self.revision = subprocess.check_output(['git', '-C', str(self.root), 'rev-parse', 'HEAD'], text=True).strip()

    def tearDown(self):
        self.tmp.cleanup()

    def test_tracked_text_filter_excludes_secret_like_and_runtime_paths(self):
        files = teacher.tracked_text_files(self.root)
        self.assertEqual(files, ['README.md', 'research/note.md'])

    def test_build_packets_chunks_source_and_labels_it_as_same_source_reference(self):
        packets = teacher.build_packets(
            self.root,
            revision=self.revision,
            chunk_chars=30,
            max_file_bytes=4096,
        )
        self.assertGreater(len(packets), 2)
        self.assertTrue(all(row['kind'] == 'REFERENCE' for row in packets))
        self.assertTrue(all(row['visibility'] == 'public' for row in packets))
        self.assertTrue(all(row['evidence'] == 'source-material' for row in packets))
        self.assertTrue(all(row['independence'] == 'same-source' for row in packets))
        self.assertTrue(all(row['source_revision'] == self.revision for row in packets))
        self.assertTrue(all('not independently validated' in row['claim_ceiling'] for row in packets))
        paths = {row['metadata']['path'] for row in packets}
        self.assertEqual(paths, {'README.md', 'research/note.md'})

    def test_end_to_end_teach_repository_posts_to_live_bridge_and_is_idempotent(self):
        ledger_path = Path(self.tmp.name) / 'bridge.jsonl'
        server = bridge.build_server(
            '127.0.0.1', 0, ledger_path,
            write_token=WRITE_TOKEN,
            read_token=READ_TOKEN,
            max_body_bytes=65536,
            max_batch=16,
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        host, port = server.server_address
        endpoint = f'http://{host}:{port}'
        try:
            first = teacher.teach_repository(
                self.root,
                endpoint=endpoint,
                write_token=WRITE_TOKEN,
                revision=self.revision,
                batch_size=4,
                chunk_chars=80,
                max_file_bytes=4096,
            )
            count_after_first = server.ledger.validate()
            second = teacher.teach_repository(
                self.root,
                endpoint=endpoint,
                write_token=WRITE_TOKEN,
                revision=self.revision,
                batch_size=4,
                chunk_chars=80,
                max_file_bytes=4096,
            )
            self.assertEqual(first['packets'], second['packets'])
            self.assertGreater(count_after_first, 0)
            self.assertEqual(server.ledger.validate(), count_after_first)
            rows = server.ledger.search(q='decision field', include_restricted=False)
            self.assertGreater(len(rows), 0)
            self.assertTrue(all(row['kind'] == 'REFERENCE' for row in rows))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == '__main__':
    unittest.main()
