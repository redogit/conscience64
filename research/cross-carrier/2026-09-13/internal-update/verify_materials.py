"""Verify complete recovery inventory and every directly represented member."""
import hashlib,json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
m=json.loads((root/'MATERIALS.json').read_text())
archive=root/m['bundle']
assert hashlib.sha256(archive.read_bytes()).hexdigest()==m['bundle_sha256']
with zipfile.ZipFile(archive) as z:
    assert set(z.namelist())=={f['path'] for f in m['files']}
    for f in m['files']:
        raw=z.read(f['path'])
        assert len(raw)==f['bytes'] and hashlib.sha256(raw).hexdigest()==f['sha256'],f['path']
        if f['direct']:
            direct=(root/f['direct']).read_bytes()
            if 'successor' in f: assert len(direct)==f['successor']['bytes'] and hashlib.sha256(direct).hexdigest()==f['successor']['sha256'],f['direct']
            else: assert direct==raw,f['direct']
print(f"PASS: {len(m['files'])} exact bundle members; all direct sources or declared successors match")
