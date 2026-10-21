"""Validate the public v1 profile, evidence invariants and negative privacy cases.
Requires Python jsonschema (Draft 2020-12). No network or audio access.
"""
import copy, json, re
from pathlib import Path
from jsonschema import Draft202012Validator, ValidationError
root=Path(__file__).resolve().parent
schema=json.loads((root/'voice-profile.schema.json').read_text())
profile=json.loads((root/'ryan-voice-profile.json').read_text())
Draft202012Validator.check_schema(schema)
validator=Draft202012Validator(schema)

def validate(value):
    validator.validate(value)
    assert {t['dimension'] for t in value['targets']}=={'similarity','pitch','rhythm','rap','singing'}
    roles={r['role']:r for r in value['recordings']}
    assert len(value['recordings'])==len(roles)==2
    initial=roles['initial-own-voice-reference'];exercise=roles['exercise-with-mixed-conversation']
    assert initial['evidence']=='reported-decoded-audio-measurement'
    assert set(initial['metrics'])=={'duration','sampleRate','peak','rms','nearFullScaleSamples'}
    assert exercise['metrics']=={} and exercise['evidence']=='reported-transcript-verification'
    raw=json.dumps(value)
    assert not re.search(r'libfile_|file_[0-9a-f]{12}|https?://|/workspace/|/tmp/|\.m4a|Sentinel_|data:audio|base64',raw,re.I)

validate(profile)
mutations=[lambda p:p.update(format='musilanguage-musical-voice-profile/v2'),lambda p:p['renderer'].update(ready=True),lambda p:p['policy'].update(externalTransmission='allowed'),lambda p:p['targets'][0].update(measuredAbility=True),lambda p:p['recordings'][1].update(isolationStatus='validated'),lambda p:p['recordings'][1].update(metrics=p['recordings'][0]['metrics']),lambda p:p['recordings'][0].update(privateFile='secret'),lambda p:p['recordings'][0]['facts'].append('libfile_SYNTHETIC'),lambda p:p['targets'].pop()]
for mutate in mutations:
    bad=copy.deepcopy(profile);mutate(bad)
    try:validate(bad)
    except (ValidationError,AssertionError):pass
    else:raise AssertionError('Invalid profile accepted')
print('PASS: Draft 2020-12 schema, v1 profile, evidence/role/privacy invariants; 9 negative cases rejected')
