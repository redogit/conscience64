#!/usr/bin/env python3
"""Offline carrier integrity; does not prove the catalog's research claims."""
import argparse, hashlib, json, gzip
from pathlib import Path

def verify_files(root, files):
    root=Path(root).resolve()
    for name,expected in files.items():
        path=(root/name).resolve()
        if not path.is_relative_to(root):raise ValueError('path escapes carrier')
        if not path.is_file():raise ValueError('missing file: '+name)
        data=path.read_bytes()
        if len(data)!=expected['bytes'] or hashlib.sha256(data).hexdigest()!=expected['sha256']:
            raise ValueError('byte integrity mismatch: '+name)

def validate(catalog, crosswalk, counts):
    for key,count in counts.items():
        if len(catalog[key])!=count:raise ValueError('count mismatch: '+key)
    records=catalog['records'];ids=[r['record_id'] for r in records]
    if len(set(ids))!=len(ids):raise ValueError('duplicate record ID')
    if [r['ordinal'] for r in records]!=list(range(1,len(records)+1)):
        raise ValueError('catalog order changed')
    for r in records:
        if r['research_rerun_this_pass'] is not False or r['integration_status']!='CROSSWALK_ONLY':
            raise ValueError('source report promoted to research rerun or integration')
    for key in ('historical_source_occurrences','fresh_native_occurrences','image_occurrences'):
        occurrences=[r['occurrence_id'] for r in catalog[key]]
        if len(set(occurrences))!=len(occurrences):raise ValueError('duplicate occurrence ID')
        # Equal content hashes deliberately impose no uniqueness requirement.
    if [r['record_id'] for r in crosswalk['records']]!=ids:
        raise ValueError('crosswalk record coverage/order mismatch')
    anchors={r['occurrence_id'] for r in crosswalk['repository_occurrences'] if r['result']=='FRESH_REPOSITORY_SOURCE'}
    for r in crosswalk['records']:
        if not set(r['current_anchor_occurrences'])<=anchors:
            raise ValueError('crosswalk references an unavailable source')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origin-ledger',type=Path,help='Optional owner-held exact extended ledger; compare source attribution/status hashes.')
    args=parser.parse_args();root=Path(__file__).resolve().parent
    manifest=json.loads((root/'manifest.json').read_text())
    verify_files(root,manifest['files'])
    raw_catalog=gzip.decompress((root/'catalog.json.gz').read_bytes())
    if len(raw_catalog)!=manifest['catalog_uncompressed']['bytes'] or hashlib.sha256(raw_catalog).hexdigest()!=manifest['catalog_uncompressed']['sha256']:
        raise ValueError('uncompressed catalog identity mismatch')
    catalog=json.loads(raw_catalog);walk=json.loads((root/'crosswalk.json').read_text())
    validate(catalog,walk,manifest['counts'])
    ledger_verified=False
    if args.origin_ledger:
        data=args.origin_ledger.read_bytes()
        if hashlib.sha256(data).hexdigest()!=manifest['source_snapshots']['extended_ledger_sha256']:
            raise ValueError('origin ledger byte identity mismatch')
        ledger=json.loads(data)
        if len(ledger['records'])!=len(catalog['records']):raise ValueError('origin record coverage mismatch')
        for original,carried in zip(ledger['records'],catalog['records']):
            raw=json.dumps(original,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
            if original['id']!=carried['record_id'] or hashlib.sha256(raw).hexdigest()!=carried['record_sha256']:
                raise ValueError('origin record content/attribution/status mismatch')
        ledger_verified=True
    print(json.dumps({'status':'PASS','records':len(catalog['records']),'occurrences_preserved':True,'owner_ledger_checked':ledger_verified,'research_claims_verified':False}))

if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,OSError) as e:raise SystemExit('FAIL: '+str(e))
