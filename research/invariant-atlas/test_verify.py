import copy, json, tempfile, unittest, hashlib
from pathlib import Path
import importlib.util

class IntegrityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('atlas_verify',Path(__file__).with_name('verify.py'))
        if not spec or not Path(spec.origin).exists():
            cls.verifier=None
        else:
            cls.verifier=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.verifier)
    def verifier_module(self):
        self.assertIsNotNone(self.verifier,'integrity verifier is missing')
        return self.verifier
    def fixture(self):
        # Two separate attestations of equal bytes must remain separate observations.
        return {'records':[{'ordinal':1,'record_id':'R1','snapshot':'ORIGINAL_1016','research_rerun_this_pass':False,'integration_status':'CROSSWALK_ONLY','source_reported_status':'FALSIFIED','source_occurrence_count':2}],
                'historical_source_occurrences':[{'occurrence_id':'H1','body_sha256':'a'*64},{'occurrence_id':'H2','body_sha256':'a'*64}],
                'fresh_native_occurrences':[], 'image_occurrences':[], 'families':[], 'separate_derived_entries':[]}
    def crosswalk(self):
        return {'repository_occurrences':[], 'records':[{'record_id':'R1','current_anchor_occurrences':[],'status':'NO_EXACT_CURRENT_REPOSITORY_COUNTERPART_RETRIEVED'}]}
    def counts(self):
        return {'records':1,'historical_source_occurrences':2,'fresh_native_occurrences':0,'image_occurrences':0,'families':0,'separate_derived_entries':0}
    def test_equal_bytes_keep_distinct_occurrences(self):
        self.verifier_module().validate(self.fixture(),self.crosswalk(),self.counts())
    def test_deduplication_is_rejected(self):
        cat=self.fixture();cat['historical_source_occurrences'].pop()
        with self.assertRaises(ValueError):self.verifier_module().validate(cat,self.crosswalk(),self.counts())
    def test_source_report_cannot_become_rerun(self):
        cat=self.fixture();cat['records'][0]['research_rerun_this_pass']=True
        with self.assertRaises(ValueError):self.verifier_module().validate(cat,self.crosswalk(),self.counts())
    def test_missing_crosswalk_target_is_rejected(self):
        walk=self.crosswalk();walk['records'][0]['current_anchor_occurrences']=['G9']
        with self.assertRaises(ValueError):self.verifier_module().validate(self.fixture(),walk,self.counts())
    def test_ordinal_reordering_is_rejected(self):
        cat=self.fixture();cat['records'][0]['ordinal']=2
        with self.assertRaises(ValueError):self.verifier_module().validate(cat,self.crosswalk(),self.counts())
    def test_altered_file_hash_is_rejected(self):
        v=self.verifier_module()
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'catalog.json';p.write_bytes(b'changed')
            with self.assertRaises(ValueError):v.verify_files(Path(d),{'catalog.json':{'sha256':hashlib.sha256(b'original').hexdigest(),'bytes':8}})
    def test_parent_traversal_is_rejected(self):
        v=self.verifier_module()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):v.verify_files(Path(d),{'../outside':{'sha256':'a'*64,'bytes':0}})

if __name__=='__main__':unittest.main()
