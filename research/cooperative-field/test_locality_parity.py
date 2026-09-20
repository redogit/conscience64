"""Synthetic, offline controls. No private data or repository mutation."""
import hashlib, importlib.util, json, tempfile, unittest
from pathlib import Path
HERE=Path(__file__).resolve().parent
class ParityTests(unittest.TestCase):
    def setUp(self):
        p=HERE/'locality_parity.py'
        self.assertTrue(p.is_file(),'missing scoped parity verifier')
        spec=importlib.util.spec_from_file_location('locality_parity',p)
        self.m=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.m)
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.a=Path(self.tmp.name)/'local';self.b=Path(self.tmp.name)/'mirror'
        self.a.mkdir();self.b.mkdir();data=b'synthetic control\n'
        (self.a/'method.txt').write_bytes(data);(self.b/'method.txt').write_bytes(data)
        self.manifest={'schema':'locality-pairity-parity/v1','source_revision':'1'*40,
            'files':[{'path':'method.txt','sha256':hashlib.sha256(data).hexdigest(),
                      'git_blob_sha1':hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()}]}
    def check(self):return self.m.verify(self.manifest,self.a,self.b)
    def test_exact_scoped_match(self):self.assertEqual(self.check()['status'],'SCOPED_BYTES_MATCH')
    def test_private_extra_files_are_not_read_or_compared(self):
        (self.a/'private').write_text('synthetic excluded');self.assertEqual(self.check()['files_checked'],1)
    def test_local_drift_rejected(self):
        (self.a/'method.txt').write_bytes(b'changed')
        with self.assertRaises(ValueError):self.check()
    def test_mirror_drift_rejected(self):
        (self.b/'method.txt').write_bytes(b'changed')
        with self.assertRaises(ValueError):self.check()
    def test_empty_scope_rejected(self):
        self.manifest['files']=[]
        with self.assertRaises(ValueError):self.check()
    def test_duplicate_paths_rejected(self):
        self.manifest['files']*=2
        with self.assertRaises(ValueError):self.check()
    def test_traversal_rejected(self):
        self.manifest['files'][0]['path']='../method.txt'
        with self.assertRaises(ValueError):self.check()
    def test_absolute_path_rejected(self):
        self.manifest['files'][0]['path']='/method.txt'
        with self.assertRaises(ValueError):self.check()
    def test_symlink_rejected(self):
        p=self.b/'method.txt';p.unlink();p.symlink_to(self.a/'method.txt')
        with self.assertRaises(ValueError):self.check()
    def test_ancestor_symlink_rejected(self):
        (self.b/'link').symlink_to(self.a,target_is_directory=True)
        self.manifest['files'][0]['path']='link/method.txt'
        (self.a/'link').symlink_to(self.a,target_is_directory=True)
        with self.assertRaises(ValueError):self.check()
    def test_unpinned_revision_rejected(self):
        self.manifest['source_revision']='main'
        with self.assertRaises(ValueError):self.check()
    def test_blob_mismatch_rejected(self):
        self.manifest['files'][0]['git_blob_sha1']='0'*40
        with self.assertRaises(ValueError):self.check()
    def test_unknown_keys_rejected(self):
        self.manifest['files'][0]['authorization']='public'
        with self.assertRaises(ValueError):self.check()
    def test_same_corruption_on_both_sides_rejected(self):
        (self.a/'method.txt').write_bytes(b'corrupted');(self.b/'method.txt').write_bytes(b'corrupted')
        with self.assertRaises(ValueError):self.check()
    def test_missing_file_rejected(self):
        (self.b/'method.txt').unlink()
        with self.assertRaises(ValueError):self.check()
    def test_backslash_path_rejected(self):
        self.manifest['files'][0]['path']='folder\\method.txt'
        with self.assertRaises(ValueError):self.check()
    def test_check_is_read_only(self):
        before=((self.a/'method.txt').read_bytes(),(self.b/'method.txt').read_bytes())
        self.check()
        self.assertEqual(before,((self.a/'method.txt').read_bytes(),(self.b/'method.txt').read_bytes()))
    def test_json_duplicate_keys_rejected(self):
        with self.assertRaises(ValueError):self.m.read_manifest('{"schema":"a","schema":"b"}')
if __name__=='__main__':unittest.main(verbosity=2)
