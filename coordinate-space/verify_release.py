"""Verify the explicit public-source allowlist. A hash is not a signature."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root/'release_manifest.json').read_text(encoding='utf-8'))
allowed = set(manifest['files']) | {'release_manifest.json'}
for name, entry in manifest['files'].items():
    path = (root/name).resolve()
    if not path.is_relative_to(root) or not path.is_file(): raise SystemExit('Invalid or missing release path: '+name)
    raw = path.read_bytes()
    if len(raw) != entry['bytes'] or hashlib.sha256(raw).hexdigest() != entry['sha256']:
        raise SystemExit('Release integrity mismatch: '+name)
for path in root.rglob('*'):
    if not path.is_file() or '__pycache__' in path.parts: continue
    relative = path.relative_to(root).as_posix()
    if relative == 'research_symbol_space_float64.npz': continue  # generated public compatibility example
    if relative not in allowed: raise SystemExit('Unlisted file in public release: '+relative)
for name, expected in manifest['unchanged_audited_modules'].items():
    if manifest['files'][name]['sha256'] != expected: raise SystemExit('Audited module identity mismatch: '+name)
print(json.dumps({'status':'PASS','verified_files':len(manifest['files']), 'boundary':'Public allowlist only; no private corpus or archived payloads are published.'},indent=2))
