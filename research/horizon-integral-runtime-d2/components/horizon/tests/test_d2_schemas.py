import tempfile, unittest
from pathlib import Path
from horizon import Store, ValidationError
from horizon import schemas

U='00000000-0000-0000-0000-000000000001'
R='00000000-0000-0000-0000-000000000002'
REF={'uid':U,'revision_uid':R}

class D2SchemaTests(unittest.TestCase):
    def test_occurrence_and_semantic_object_have_distinct_required_identity_fields(self):
        schemas.validate_payload('source_occurrence', {'occurrence_id':'occ-4','source_path':'a.txt','start_utf16':4,'end_utf16':8,'text_hash':'0'*64})
        schemas.validate_payload('semantic_object', {'semantic_object_id':'sem-x','occurrence_refs':[REF]})
        with self.assertRaises(ValidationError): schemas.validate_payload('source_occurrence', {'semantic_object_id':'sem-x'})
        with self.assertRaises(ValidationError): schemas.validate_payload('semantic_object', {'occurrence_id':'occ-4'})

    def test_observer_requires_task_degree_blind_spots_calibration_and_independence(self):
        good={'name':'text-look','mode':'LOOK','primary_task':'ordered containment','degree_of_freedom':'source order','blind_spots':['semantic truth'],'calibration':['exact UTF-16 offsets'],'independence_group':'sha256:abc','claim_ceiling':'projection_only'}
        schemas.validate_payload('observer',good)
        for key in ('primary_task','degree_of_freedom','blind_spots','calibration','independence_group'):
            bad=dict(good); bad.pop(key)
            with self.assertRaises(ValidationError): schemas.validate_payload('observer',bad)
        bad=dict(good,mode='GUESS')
        with self.assertRaises(ValidationError): schemas.validate_payload('observer',bad)

    def test_progression_preserves_base_class_when_overlay_changes(self):
        payload={'work_item_ref':REF,'base':'ADVANCED_UNFINISHED','overlays':['ACTIVE','BLOCKED']}
        schemas.validate_payload('progression',payload)
        with self.assertRaises(ValidationError): schemas.validate_payload('progression',dict(payload,base='ACTIVE'))
        with self.assertRaises(ValidationError): schemas.validate_payload('progression',dict(payload,overlays=['DONE']))

    def test_capability_manifest_requires_goal_relative_class_and_homeward_contract(self):
        good={'capability_id':'shape.blackhole','version':'1','requirement_class':'PROJECTION_ONLY','semantic_role':'reversible geometric projection','supported_lanes':['research'],'homeward_contract':'exact source reconstruction or explicit refusal'}
        schemas.validate_payload('capability_manifest',good)
        with self.assertRaises(ValidationError): schemas.validate_payload('capability_manifest',{k:v for k,v in good.items() if k!='requirement_class'})
        with self.assertRaises(ValidationError): schemas.validate_payload('capability_manifest',dict(good,requirement_class='optional'))

    def test_homeward_requires_declared_losses_and_validation_evidence(self):
        good={'subject_ref':REF,'source_ref':REF,'carrier_ref':REF,'declared_losses':[],'validation_evidence':['exact replay'],'status':'verified'}
        schemas.validate_payload('homeward',good)
        for key in ('declared_losses','validation_evidence'):
            bad=dict(good); bad.pop(key)
            with self.assertRaises(ValidationError): schemas.validate_payload('homeward',bad)

    def test_unknown_lane_mode_and_status_are_rejected(self):
        with self.assertRaises(ValidationError): schemas.validate_payload('working_set',{'name':'w','lanes':['imaginary']})
        with self.assertRaises(ValidationError): schemas.validate_payload('homeward',{'subject_ref':REF,'source_ref':REF,'carrier_ref':REF,'declared_losses':[],'validation_evidence':[],'status':'magic'})

    def test_migrate_current_1_1_snapshot_to_1_2_without_rewriting_history(self):
        self.assertEqual(schemas.SCHEMA_VERSION,'1.2.0')
        fixture=Path(__file__).resolve().parent/'fixtures'/'phase0-snapshot.zlib'
        with tempfile.TemporaryDirectory() as td:
            s,cred=Store.migrate_snapshot(Path(td)/'one.db',fixture.read_bytes(),target_schema_version='1.1.0')
            one=s.export_snapshot(cred['admin']); before=s.checkpoint(cred['reader']); s.close()
            two,c2=Store.migrate_snapshot(Path(td)/'two.db',one)
            self.assertEqual(two.schema_version,'1.2.0')
            self.assertEqual(two.verify_integrity(c2['reader'],before)['checkpoint_verified'],True)
            two.close()

if __name__=='__main__': unittest.main()
