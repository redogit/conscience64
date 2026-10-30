"""Versioned record schemas. Validation concerns shape, never truth or authorization.

Extensions deliberately require an offline, separately reviewed schema migration.
HJ1 is a project canonical encoding, not a claim of RFC 8785 compatibility.
"""
import copy
import json
import math
import re
import uuid
from datetime import datetime

from .errors import ValidationError

SCHEMA_VERSION = '1.2.0'
SUPPORTED_SCHEMA_VERSIONS = ('1.0.0', '1.1.0', SCHEMA_VERSION)
MAX_JSON_DEPTH = 64
S = {'type': 'string'}
N = {'type': 'number', 'minimum': 0}
I = {'type': 'integer', 'minimum': 0}
O = {'type': 'object'}
REF = {'type': 'object', 'properties': {'uid': {'type': 'string', 'format': 'uuid'}, 'revision_uid': {'type': 'string', 'format': 'uuid'}}, 'required': ['uid', 'revision_uid'], 'additionalProperties': False}
REFS = {'type': 'array', 'items': REF}
STRINGS = {'type': 'array', 'items': S}


def _schema(name, properties, required=None, version='1.0.0'):
    return {'$schema': 'https://json-schema.org/draft/2020-12/schema', '$id': 'horizon:' + version + ':' + name, 'title': name, 'type': 'object', 'properties': properties, 'required': required or list(properties), 'additionalProperties': True}


_BASE_1_0 = {
    'entity': _schema('entity', {'name': S}),
    'observation': _schema('observation', {'source_hash': {'type': 'string', 'pattern': '^[0-9a-f]{64}$'}, 'byte_length': I, 'purpose': S, 'evidence_status': {'enum': ['observation', 'evidence', 'knowledge', 'rejected']}, 'classification_reason': S}, ['source_hash', 'byte_length', 'purpose', 'evidence_status']),
    'relation': _schema('relation', {'subject_ref': REF, 'object_ref': REF, 'relation_type': S, 'context_ref': REF}, ['subject_ref', 'object_ref', 'relation_type']),
    'claim': _schema('claim', {'statement': S, 'claim_type': S, 'verification_status': {'enum': ['unverified', 'tested', 'verified', 'rejected', 'unresolved']}, 'context_ref': REF}, ['statement', 'claim_type', 'verification_status']),
    'transformation': _schema('transformation', {'name': S, 'input_refs': REFS, 'output_refs': REFS, 'method': S}),
    'residual': _schema('residual', {'description': S, 'source_ref': REF, 'unresolved': {'type': 'boolean'}}),
    'color': _schema('color', {'name': S, 'capacity': N}),
    'candidate_assignment': _schema('candidate_assignment', {'item_ref': REF, 'color_ref': REF, 'movement_cost': N}),
    'ledger': _schema('ledger', {'name': S, 'entries': {'type': 'array', 'items': O}}),
    'operation': _schema('operation', {'name': S, 'input_refs': REFS, 'description': S}),
    'nand_construction': _schema('nand_construction', {'name': S, 'gates': {'type': 'array', 'items': O}, 'inputs': STRINGS, 'outputs': STRINGS}),
    'instruction_model': _schema('instruction_model', {'name': S, 'instructions': {'type': 'array', 'items': O}, 'semantics': S}),
    'verification_record': _schema('verification_record', {'subject_ref': REF, 'status': {'enum': ['accepted', 'rejected', 'unresolved']}, 'method': S, 'limitations': STRINGS}),
    'geometric_representation': _schema('geometric_representation', {'name': S, 'dimension': {'type': 'integer', 'minimum': 1}, 'coordinates': {'type': 'array', 'items': {'type': 'array', 'items': {'type': 'number'}}}}),
    'revision': _schema('revision', {'subject_ref': REF, 'description': S}),
    'execution_record': _schema('execution_record', {'input_refs': REFS, 'intermediate': {}, 'partial_outputs': {}, 'error': {}, 'environment': O, 'recovery_options': STRINGS, 'status': {'enum': ['failed']}}),
    'distributed_event': _schema('distributed_event', {'node_id': S, 'event_type': S, 'causal_refs': REFS}),
    'context': _schema('context', {'name': S, 'description': S}),
    'state': _schema('state', {'name': S, 'values': O}),
    'goal': _schema('goal', {'description': S, 'success_criteria': STRINGS}),
    'obligation': _schema('obligation', {'description': S, 'status': {'enum': ['open', 'satisfied', 'failed', 'waived']}}),
    'proof': _schema('proof', {'statement': S, 'method': S, 'steps': STRINGS}),
    'cost_model': _schema('cost_model', {'name': S, 'movement_cost': N}),
    'invariant': _schema('invariant', {'name': S, 'rule': S, 'protected': {'const': True}}),
    'authorization': _schema('authorization', {'subject_ref': REF, 'scope': STRINGS, 'decision': {'enum': ['allowed', 'denied']}}),
    'proposal': _schema('proposal', {'target_ref': REF, 'changes': O, 'reason': S}),
    'research_cycle': _schema('research_cycle', {'question': S, 'input_refs': REFS, 'status': {'enum': ['planned', 'running', 'completed', 'failed']}}),
    'result': _schema('result', {'summary': S, 'input_refs': REFS, 'status': {'enum': ['success', 'failure', 'partial', 'unresolved']}}),
}
_V1_0 = copy.deepcopy(_BASE_1_0)
_V1_1 = copy.deepcopy(_BASE_1_0)
for _name, _description in _V1_1.items(): _description['$id'] = 'horizon:1.1.0:' + _name
_V1_1['execution_record']['properties']['status']['enum'] = ['prepared', 'running', 'success', 'failed', 'rejected']
_V1_2 = copy.deepcopy(_V1_1)
for _name, _description in _V1_2.items(): _description['$id'] = 'horizon:1.2.0:' + _name

MODE={'enum':['LOOK','MOVE','SCREAM','LISTEN','DUAL','RECOVER']}
BASE_PROGRESS={'enum':['COMPLETED_BOUNDED','ADVANCED_UNFINISHED','DISCUSSED_NOT_EXECUTED','UNRESOLVED_PARKED']}
OVERLAYS={'type':'array','items':{'enum':['ACTIVE','BLOCKED','STALE','CONFLICTED','SUPERSEDED']}}
REQ_CLASS={'enum':['CORE_REQUIRED','GOAL_BLOCKING','GOAL_SUPPORTING','PROJECTION_ONLY','EXPERIMENTAL','UNAVAILABLE']}
LANES={'type':'array','items':{'enum':['research','implementation','verification','history','design','play','human']}}
HASH={'type':'string','pattern':'^[0-9a-f]{64}$'}
D2 = {
 'source_occurrence': _schema('source_occurrence',{'occurrence_id':S,'source_path':S,'start_utf16':I,'end_utf16':I,'text_hash':HASH},version='1.2.0'),
 'semantic_object': _schema('semantic_object',{'semantic_object_id':S,'occurrence_refs':REFS},version='1.2.0'),
 'working_set': _schema('working_set',{'name':S,'lanes':LANES},version='1.2.0'),
 'pause_point': _schema('pause_point',{'work_item_ref':REF,'continuation':O,'status':{'enum':['open','resumed','superseded']}},version='1.2.0'),
 'progression': _schema('progression',{'work_item_ref':REF,'base':BASE_PROGRESS,'overlays':OVERLAYS},version='1.2.0'),
 'surface': _schema('surface',{'subject_ref':REF,'kind':S,'coordinates':O},version='1.2.0'),
 'carrier': _schema('carrier',{'subject_ref':REF,'kind':S,'source_ref':REF},version='1.2.0'),
 'method': _schema('method',{'name':S,'steps':STRINGS,'invariants':STRINGS},version='1.2.0'),
 'meaning': _schema('meaning',{'subject_ref':REF,'purpose':S,'obligations':STRINGS},version='1.2.0'),
 'evidence': _schema('evidence',{'subject_ref':REF,'domain':S,'evidence_type':S,'status':{'enum':['raw','interpreted','verified','refuted','unresolved']},'source_refs':REFS},version='1.2.0'),
 'observer': _schema('observer',{'name':S,'mode':MODE,'primary_task':S,'degree_of_freedom':S,'blind_spots':STRINGS,'calibration':STRINGS,'independence_group':S,'claim_ceiling':{'enum':['observation_only','projection_only','comparison_only','verification_bounded']}},version='1.2.0'),
 'observer_report': _schema('observer_report',{'observer_ref':REF,'subject_ref':REF,'expected':{},'actual':{},'invariants':STRINGS,'confounds':STRINGS,'remainder':STRINGS,'next_counterprobe':S},version='1.2.0'),
 'capability_manifest': _schema('capability_manifest',{'capability_id':S,'version':S,'requirement_class':REQ_CLASS,'semantic_role':S,'supported_lanes':LANES,'homeward_contract':S},version='1.2.0'),
 'homeward': _schema('homeward',{'subject_ref':REF,'source_ref':REF,'carrier_ref':REF,'declared_losses':STRINGS,'validation_evidence':STRINGS,'status':{'enum':['verified','refused','unresolved']}},version='1.2.0'),
 'knowledge_decay': _schema('knowledge_decay',{'source_ref':REF,'carrier_ref':REF,'required_distinctions':STRINGS,'first_loss_boundary':S,'status':{'enum':['intact','loss_detected','unresolved']}},version='1.2.0'),
 'third_plane': _schema('third_plane',{'left_ref':REF,'right_ref':REF,'relation':S,'assumptions':STRINGS,'status':{'enum':['proposed','tested','refuted','unresolved']}},version='1.2.0')
}
_V1_2.update(D2)
SCHEMAS = _V1_2
SCHEMAS_BY_VERSION={'1.0.0':_V1_0,'1.1.0':_V1_1,'1.2.0':SCHEMAS}
_VALIDATION_SCHEMAS=copy.deepcopy(SCHEMAS_BY_VERSION)


def finite_json(value, depth=0, *, max_depth=MAX_JSON_DEPTH):
    if depth > max_depth:
        raise ValidationError('JSON nesting exceeds ' + str(max_depth))
    if value is None or isinstance(value, bool) or type(value) is int:
        return
    if type(value) is float:
        if not math.isfinite(value):
            raise ValidationError('JSON numbers must be finite')
        return
    if isinstance(value, str):
        if any(0xD800 <= ord(c) <= 0xDFFF for c in value):
            raise ValidationError('Unpaired Unicode surrogate')
        return
    if isinstance(value, list):
        for child in value:
            finite_json(child, depth + 1, max_depth=max_depth)
        return
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str):
                raise ValidationError('JSON object keys must be strings')
            finite_json(key, depth + 1, max_depth=max_depth)
            finite_json(child, depth + 1, max_depth=max_depth)
        return
    raise ValidationError('Value is not finite JSON')


def canonical(value, *, max_depth=MAX_JSON_DEPTH):
    finite_json(value, max_depth=max_depth)
    try:
        return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf-8')
    except (ValueError, OverflowError, RecursionError) as exc:
        raise ValidationError('Invalid JSON') from exc


def _validate(schema, value, path='payload'):
    types = {'object': lambda x: type(x) is dict, 'array': lambda x: type(x) is list, 'string': lambda x: type(x) is str, 'boolean': lambda x: type(x) is bool, 'integer': lambda x: type(x) is int, 'number': lambda x: type(x) in (int, float)}
    if 'type' in schema and not types[schema['type']](value):
        raise ValidationError(path + ': expected ' + schema['type'])
    if 'const' in schema and (type(value) is not type(schema['const']) or value != schema['const']):
        raise ValidationError(path + ': invalid constant')
    if 'enum' in schema and value not in schema['enum']:
        raise ValidationError(path + ': invalid enumeration')
    if 'minimum' in schema and value < schema['minimum']:
        raise ValidationError(path + ': below minimum')
    if 'pattern' in schema and re.fullmatch(schema['pattern'], value) is None:
        raise ValidationError(path + ': invalid pattern')
    if schema.get('format') == 'uuid':
        try:
            if str(uuid.UUID(value)) != value:
                raise ValueError()
        except (ValueError, AttributeError) as exc:
            raise ValidationError(path + ': invalid UUID') from exc
    if isinstance(value, dict):
        props = schema.get('properties', {})
        for key in schema.get('required', []):
            if key not in value:
                raise ValidationError(path + ': missing ' + key)
        if schema.get('additionalProperties') is False and set(value) - set(props):
            raise ValidationError(path + ': unknown properties')
        for key, child in value.items():
            if key in props:
                _validate(props[key], child, path + '.' + key)
    if isinstance(value, list) and 'items' in schema:
        for index, child in enumerate(value):
            _validate(schema['items'], child, path + '[' + str(index) + ']')


def validate_ref(value):
    finite_json(value)
    _validate(REF, value, 'ref')


def payload_refs(value):
    """Every exact Ref-shaped nested object is a causal dependency."""
    result = []
    def walk(node):
        if isinstance(node, dict):
            if set(node) == {'uid', 'revision_uid'}:
                validate_ref(node)
                result.append(node)
            else:
                for child in node.values():
                    walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)
    finite_json(value)
    walk(value)
    return result


def validate_payload(entity_type, payload, schema_version=SCHEMA_VERSION):
    if type(schema_version) is not str or schema_version not in _VALIDATION_SCHEMAS:
        raise ValidationError('Unsupported schema version')
    schemas = _VALIDATION_SCHEMAS[schema_version]
    if type(entity_type) is not str or entity_type not in schemas:
        raise ValidationError('Unsupported entity type: ' + str(entity_type))
    finite_json(payload)
    _validate(schemas[entity_type], payload)
    payload_refs(payload)


def validate_record(record):
    finite_json(record)
    required = {'uid', 'revision_uid', 'version', 'entity_type', 'schema_version', 'created_at', 'supersedes_revision_uid', 'payload', 'refs', 'actor_uid'}
    if type(record) is not dict or set(record) != required:
        raise ValidationError('Invalid record envelope')
    for key in ('uid', 'revision_uid', 'actor_uid'):
        _validate({'type': 'string', 'format': 'uuid'}, record[key], key)
    _validate({'type': 'integer', 'minimum': 1}, record['version'], 'version')
    if type(record['schema_version']) is not str or record['schema_version'] not in SUPPORTED_SCHEMA_VERSIONS:
        raise ValidationError('Unsupported schema version')
    if type(record['created_at']) is not str or re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z', record['created_at']) is None:
        raise ValidationError('Invalid UTC timestamp')
    try:
        datetime.strptime(record['created_at'], '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError as exc:
        raise ValidationError('Invalid UTC calendar timestamp') from exc
    if record['supersedes_revision_uid'] is not None:
        _validate({'type': 'string', 'format': 'uuid'}, record['supersedes_revision_uid'])
    _validate(REFS, record['refs'], 'refs')
    validate_payload(record['entity_type'], record['payload'], record['schema_version'])
