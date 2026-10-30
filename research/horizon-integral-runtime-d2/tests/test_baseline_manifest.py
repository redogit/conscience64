import hashlib, json, tempfile, unittest, zipfile
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('verify_baselines', ROOT/'tools'/'verify_baselines.py')

class BaselineManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (ROOT/'tools'/'verify_baselines.py').exists():
            cls.mod = None
        else:
            cls.mod = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(cls.mod)

    def make_zip(self, root, name, members):
        p = root/name
        with zipfile.ZipFile(p,'w') as z:
            for n,data in members.items(): z.writestr(n,data)
        return p

    def manifest(self, artifacts):
        return {'schema':'horizon-d2-baselines/1','artifacts':artifacts}

    def artifact(self,p,component_root):
        b=p.read_bytes()
        return {'name':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'component_root':component_root}

    def test_declared_archives_match_approved_sha256(self):
        self.assertIsNotNone(self.mod)
        with tempfile.TemporaryDirectory() as td:
            r=Path(td); z=self.make_zip(r,'a.zip',{'a/file.txt':'ok'})
            m=self.manifest([self.artifact(z,'a')])
            report=self.mod.verify_manifest(m,r,extract=False)
            self.assertTrue(report['ok']); self.assertEqual(report['artifacts'][0]['status'],'verified')

    def test_duplicate_component_roots_are_rejected(self):
        self.assertIsNotNone(self.mod)
        with tempfile.TemporaryDirectory() as td:
            r=Path(td); a=self.make_zip(r,'a.zip',{'a/x':'1'}); b=self.make_zip(r,'b.zip',{'a/y':'2'})
            m=self.manifest([self.artifact(a,'same'),self.artifact(b,'same')])
            with self.assertRaisesRegex(ValueError,'duplicate component_root'): self.mod.verify_manifest(m,r)

    def test_path_traversal_and_symlink_escape_are_rejected(self):
        self.assertIsNotNone(self.mod)
        with tempfile.TemporaryDirectory() as td:
            r=Path(td); z=self.make_zip(r,'bad.zip',{'../escape.txt':'no'})
            m=self.manifest([self.artifact(z,'bad')])
            with self.assertRaisesRegex(ValueError,'unsafe archive member'): self.mod.verify_manifest(m,r,extract=True,output_dir=r/'out')

    def test_clean_bootstrap_extracts_each_component_once(self):
        self.assertIsNotNone(self.mod)
        with tempfile.TemporaryDirectory() as td:
            r=Path(td); z=self.make_zip(r,'a.zip',{'wrapper/file.txt':'ok'})
            m=self.manifest([self.artifact(z,'component')])
            out=r/'out'; one=self.mod.verify_manifest(m,r,extract=True,output_dir=out); two=self.mod.verify_manifest(m,r,extract=True,output_dir=out)
            self.assertTrue(one['ok'] and two['ok']); self.assertEqual((out/'component'/'file.txt').read_text(),'ok')
            self.assertEqual(two['artifacts'][0]['extraction'],'already_verified')

    def test_modified_baseline_is_reported_without_repairing_it(self):
        self.assertIsNotNone(self.mod)
        with tempfile.TemporaryDirectory() as td:
            r=Path(td); z=self.make_zip(r,'a.zip',{'a/file.txt':'ok'}); a=self.artifact(z,'a'); original=z.read_bytes(); z.write_bytes(original+b'x')
            report=self.mod.verify_manifest(self.manifest([a]),r)
            self.assertFalse(report['ok']); self.assertEqual(report['artifacts'][0]['status'],'digest_mismatch'); self.assertEqual(z.read_bytes(),original+b'x')

if __name__=='__main__': unittest.main()
