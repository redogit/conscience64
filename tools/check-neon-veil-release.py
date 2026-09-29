#!/usr/bin/env python3
import hashlib, json, re, sys, zipfile
from pathlib import Path

ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path('.').resolve()
NEON=ROOT/'play'/'neon-veil'
APPROVAL=ROOT/'PUBLIC_NEON_VEIL_APPROVAL.json'

def fail(msg): raise AssertionError(msg)

def main():
    approval=json.loads(APPROVAL.read_text(encoding='utf-8'))
    assert approval['schema']=='redogit/public-play-route-approval/v1'
    assert approval['approved'] is True
    assert approval['route']=='/play/neon-veil/'
    assert approval['public_backend_authorized'] is False
    assert approval['commercial_license_granted'] is False
    assert approval['source_checkpoint_sha256']=='8d26afb7e271398ee2f01586db034b39e8d4a9357bfc996246245eabb9335517'
    for key in ('source_isolation_required','privacy_boundary_required','accessibility_required','network_edge_verification_required','package_hash_verification_required'):
        assert approval['review'][key] is True,key

    release=json.loads((NEON/'release.json').read_text(encoding='utf-8'))
    assert release['schema']=='neon-veil/public-release/v1'
    assert release['release']=='2026-09-29-public-preview'
    assert release['public_backend'] is False
    assert release['trusted_lan_only'] is True
    assert release['source_checkpoint_sha256']==approval['source_checkpoint_sha256']
    assert [x['platform'] for x in release['packages']]==['windows','linux','macos','android','iphone-ipad']

    html=(NEON/'index.html').read_text(encoding='utf-8')
    css=(NEON/'style.css').read_text(encoding='utf-8')
    js=(NEON/'app.js').read_text(encoding='utf-8')
    assert 'Content-Security-Policy' in html
    assert 'GitHub Pages is the release/launcher hub, not the simulation server.' in html
    assert 'no public game server' in html.lower()
    assert ':focus-visible' in css and 'prefers-reduced-motion' in css and 'forced-colors' in css
    assert 'innerHTML' not in js
    assert 'privateHost' in js
    assert 'fetch(' not in js

    prohibited_prefixes=('tests/','evidence/','history/','docs/','0.0.0.1/')
    for pkg in release['packages']:
        p=NEON/'downloads'/pkg['file']
        assert p.is_file(),pkg['file']
        raw=p.read_bytes()
        assert len(raw)==pkg['bytes'],pkg['file']
        assert hashlib.sha256(raw).hexdigest()==pkg['sha256'],pkg['file']
        assert f'downloads/{pkg["file"]}' in html,pkg['file']
        with zipfile.ZipFile(p) as z:
            assert z.testzip() is None,pkg['file']
            names=set(z.namelist())
            assert {'README_FIRST.txt','LICENSE-NEON-VEIL.txt','PUBLIC_RELEASE.json'} <= names
            assert not any(n.startswith(prohibited_prefixes) for n in names),pkg['file']
            embedded=json.loads(z.read('PUBLIC_RELEASE.json'))
            assert embedded['platform']==pkg['platform']
            if pkg['solo']:
                assert {'server.py','START_NEON_VEIL.py','START_LINUX.sh','START_ANDROID.sh','START_NEON_VEIL.html','START_IPHONE.html','client/index.html'} <= names
                assert any(n.startswith('nvserver/') for n in names)
            else:
                assert 'START_IPHONE.html' in names and 'server.py' not in names
    projected=set(approval['authorized_source_families'])
    assert all('neon-veil' in x for x in projected)
    print('PASS NEON//VEIL public release: 5 platform ZIPs, exact hashes, runtime-only contents, static launcher hub, no public backend authority')

if __name__=='__main__': main()