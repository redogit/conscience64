#!/usr/bin/env python3
import argparse, hashlib, json, os, shutil, stat, tempfile, zipfile
from pathlib import Path, PurePosixPath

SCHEMA='horizon-d2-baselines/1'

def sha256_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def _safe_members(z):
    members=[]
    for info in z.infolist():
        p=PurePosixPath(info.filename)
        mode=(info.external_attr>>16)&0xFFFF
        if p.is_absolute() or '..' in p.parts or stat.S_ISLNK(mode):
            raise ValueError('unsafe archive member: '+info.filename)
        members.append(info)
    return members

def _strip_wrapper(members):
    roots={PurePosixPath(i.filename).parts[0] for i in members if PurePosixPath(i.filename).parts}
    return next(iter(roots)) if len(roots)==1 else None

def _extract_one(zpath,dest):
    with zipfile.ZipFile(zpath) as z:
        members=_safe_members(z); wrapper=_strip_wrapper(members)
        tmp=Path(tempfile.mkdtemp(prefix='horizon-d2-',dir=str(dest.parent)))
        try:
            for info in members:
                parts=list(PurePosixPath(info.filename).parts)
                if wrapper and parts and parts[0]==wrapper: parts=parts[1:]
                if not parts: continue
                target=tmp.joinpath(*parts)
                if info.is_dir(): target.mkdir(parents=True,exist_ok=True); continue
                target.parent.mkdir(parents=True,exist_ok=True)
                with z.open(info) as src, open(target,'wb') as out: shutil.copyfileobj(src,out)
            if dest.exists(): shutil.rmtree(dest)
            tmp.replace(dest)
        except Exception:
            shutil.rmtree(tmp,ignore_errors=True); raise

def verify_manifest(manifest, source_dir, *, extract=False, output_dir=None):
    if manifest.get('schema')!=SCHEMA or not isinstance(manifest.get('artifacts'),list):
        raise ValueError('invalid baseline manifest')
    roots=[a.get('component_root') for a in manifest['artifacts']]
    if len(roots)!=len(set(roots)): raise ValueError('duplicate component_root')
    src=Path(source_dir); out=Path(output_dir) if output_dir else None
    results=[]; ok=True
    for art in manifest['artifacts']:
        name=art['name']; path=src/name
        row={'name':name,'component_root':art.get('component_root')}
        if not path.is_file(): row['status']='missing'; ok=False; results.append(row); continue
        actual_size=path.stat().st_size; actual_hash=sha256_file(path)
        if actual_size!=art['bytes'] or actual_hash!=art['sha256']:
            row.update(status='digest_mismatch',actual_bytes=actual_size,actual_sha256=actual_hash); ok=False; results.append(row); continue
        row['status']='verified'
        if extract:
            if out is None: raise ValueError('output_dir is required when extract=True')
            dest=out/art['component_root']
            marker=dest/'.horizon-baseline.json'
            wanted={'name':name,'sha256':actual_hash,'bytes':actual_size}
            if marker.is_file():
                try: current=json.loads(marker.read_text())
                except Exception: current=None
            else: current=None
            if current==wanted:
                row['extraction']='already_verified'
            else:
                out.mkdir(parents=True,exist_ok=True); _extract_one(path,dest); marker.write_text(json.dumps(wanted,sort_keys=True,indent=2)+'\n')
                row['extraction']='extracted'
        results.append(row)
    return {'schema':'horizon-d2-baseline-verification/1','ok':ok,'artifacts':results}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--root',default='.'); ap.add_argument('--source-dir',required=True); ap.add_argument('--extract',action='store_true'); ap.add_argument('--json',dest='json_path')
    ns=ap.parse_args(); root=Path(ns.root).resolve(); manifest=json.loads((root/'baselines/manifest.json').read_text())
    report=verify_manifest(manifest,Path(ns.source_dir),extract=ns.extract,output_dir=root/'components')
    if ns.json_path:
        p=root/ns.json_path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2)); raise SystemExit(0 if report['ok'] else 1)
if __name__=='__main__': main()
