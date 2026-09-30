#!/usr/bin/env python3
import hashlib, json, sys, zipfile
from pathlib import Path
ROOT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path('.').resolve()
NEON=ROOT/'play'/'neon-veil'; HUB=ROOT/'play'/'public-index.html'
APPROVAL=ROOT/'PUBLIC_NEON_VEIL_APPROVAL.json'; HUB_APPROVAL=ROOT/'PUBLIC_PLAY_HUB_APPROVAL.json'; RELEASE_APPROVAL=ROOT/'PUBLIC_RELEASE_APPROVAL.json'
def main():
    a=json.loads(APPROVAL.read_text(encoding='utf-8'))
    assert a['schema']=='redogit/public-play-route-approval/v1' and a['approved'] is True
    assert a['route']=='/play/neon-veil/' and a['public_backend_authorized'] is False
    assert a['source_checkpoint_sha256']=='8d26afb7e271398ee2f01586db034b39e8d4a9357bfc996246245eabb9335517'
    for key in ('source_isolation_required','privacy_boundary_required','accessibility_required','network_edge_verification_required','package_hash_verification_required'): assert a['review'][key] is True,key
    h=json.loads(HUB_APPROVAL.read_text(encoding='utf-8'))
    assert h['schema']=='redogit/public-play-hub-approval/v1' and h['approved'] is True and h['route']=='/play/'
    assert h['authorized_source_families']==['play/public-index.html']
    assert h['authorized_child_routes']==['/play/neon-veil/','/play/musilanguage/']
    g=json.loads(RELEASE_APPROVAL.read_text(encoding='utf-8'))
    assert g['schema']=='redogit/public-release-approval/v1' and g['approved'] is True
    assert g['approved_sha']=='56fc41d87c35e21181005e93d75b5d735f3821e7'
    assert g['authorized_routes']==['/play/','/play/neon-veil/'] and g['public_backend_authorized'] is False
    for key in ('privacy_safe','link_surface_reviewed','dependent_surfaces_reviewed','package_hashes_verified','live_edge_verified'): assert g['review'][key] is True,key
    assert g['release_identity']['source_checkpoint_sha256']==a['source_checkpoint_sha256']
    assert g['release_identity']['package_count']==5
    r=json.loads((NEON/'release.json').read_text(encoding='utf-8'))
    assert r['schema']=='neon-veil/public-release/v1' and r['release']=='2026-09-29-public-release-r11'
    assert r['channel']=='public-release' and r['public_backend'] is False and r['trusted_lan_only'] is True
    assert r['central_play_route']=='https://redogit.github.io/conscience64/play/'
    assert r['release_route']=='https://redogit.github.io/conscience64/play/neon-veil/'
    assert r['source_checkpoint_sha256']==a['source_checkpoint_sha256']
    assert [x['platform'] for x in r['packages']]==['windows','linux','macos','android','iphone-ipad']
    assert {x['platform']:x['sha256'] for x in r['packages']}==g['release_identity']['packages']
    html=(NEON/'index.html').read_text(encoding='utf-8'); hub=HUB.read_text(encoding='utf-8')
    css=(NEON/'style.css').read_text(encoding='utf-8'); js=(NEON/'app.js').read_text(encoding='utf-8')
    assert 'Public Release' in html and 'NEON//VEIL · Public Release' in hub
    assert 'GitHub Pages is the release/launcher hub, not the simulation server.' in html
    assert ':focus-visible' in css and 'prefers-reduced-motion' in css and 'forced-colors' in css
    assert 'innerHTML' not in js and 'privateHost' in js and 'fetch(' not in js
    expected={p['file'] for p in r['packages']}; downloads=NEON/'downloads'
    assert {p.name for p in downloads.iterdir() if p.is_file()}==expected
    prohibited=('tests/','evidence/','history/','docs/','0.0.0.1/')
    for pkg in r['packages']:
        p=downloads/pkg['file']; raw=p.read_bytes()
        assert len(raw)==pkg['bytes'] and hashlib.sha256(raw).hexdigest()==pkg['sha256']
        assert f'downloads/{pkg["file"]}' in html and f'neon-veil/downloads/{pkg["file"]}' in hub
        with zipfile.ZipFile(p) as z:
            assert z.testzip() is None; names=set(z.namelist())
            assert {'README_FIRST.txt','LICENSE-NEON-VEIL.txt','PUBLIC_RELEASE.json'} <= names
            assert not any(n.startswith(prohibited) for n in names)
            assert json.loads(z.read('PUBLIC_RELEASE.json'))['platform']==pkg['platform']
            if pkg['solo']: assert {'server.py','START_NEON_VEIL.py','START_LINUX.sh','START_ANDROID.sh','START_NEON_VEIL.html','START_IPHONE.html','client/index.html'} <= names
            else: assert 'START_IPHONE.html' in names and 'server.py' not in names
    print('PASS NEON//VEIL public release: central /play/ hub + 5 exact system ZIPs + explicit solo/trusted-LAN instructions; no public backend authority')
if __name__=='__main__': main()
