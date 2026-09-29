"""Add an exact, separately authorized public overlay; never copy repository roots."""
from __future__ import annotations
import argparse
import hashlib
import json
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = 'https://redogit.github.io/conscience64/'
APP_COMMIT = '667e989dcad401829bb097726b3a14cc0aa90f2c'
PROFILE_COMMIT = '8660c1c839275e7b013a08eb9a40c0fed306bcd7'
APP_HASH = '231fdadb14093df1028abe015f3c4d583b1031da5ae03048abff5244c3eac807'
ITEMS = {
    'dream-to-action/index.html': (f'https://raw.githubusercontent.com/redogit/Dream-To-Action/{APP_COMMIT}/index.html', 'sha256', APP_HASH),
    'about.html': (f'https://raw.githubusercontent.com/redogit/redogit/{PROFILE_COMMIT}/docs/about.html', 'git-blob', '664005571647b5a5a5c0c0016db16db460658d66'),
    'recent-work.html': (f'https://raw.githubusercontent.com/redogit/redogit/{PROFILE_COMMIT}/docs/recent-work.html', 'git-blob', '3858d52acc2cf8d5acce89aa513621a730044902'),
}
ALLOWED = set(ITEMS) | {'dream-publication.json'}


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def approval() -> None:
    data = json.loads((ROOT / 'PUBLIC_DREAM_ROUTES_APPROVAL.json').read_text(encoding='utf-8'))
    require(data.get('schema') == 'redogit/public-dream-routes-approval/v1', 'Wrong approval schema')
    require(data.get('approved') is True, 'Public overlay is not approved')
    require(set(data.get('authorized_paths', [])) == ALLOWED, 'Approval paths changed')
    require(data.get('scope') == 'pinned-public-dream-app-and-public-profile-pages', 'Approval scope changed')
    require(data.get('application_sha256') == APP_HASH and data.get('host') == HOST, 'Approved release or host changed')
    for key in ['commercial_license_granted', 'private_content_authorized', 'canonical_repository_migration']:
        require(data.get(key) is False, 'Publication boundary changed: ' + key)


def get(url: str) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': 'Dream-Public-Projection-Check', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=20) as response:
        require(response.status == 200 and response.url.startswith('https://'), 'Expected public HTTPS 200')
        content = response.read(2_097_153)
        require(len(content) <= 2_097_152, 'Response is unexpectedly large')
        return content


def check_payload(path: str, raw: bytes) -> None:
    require(path in ITEMS, 'Unapproved path')
    _, algorithm, expected = ITEMS[path]
    require((sha(raw) if algorithm == 'sha256' else git_blob(raw)) == expected, 'Source identity mismatch: ' + path)
    raw.decode('utf-8')
    if path == 'dream-to-action/index.html':
        require(len(raw) == 78619, 'Application size changed')
    if path == 'about.html':
        require(b'id="announcements"' in raw and b'id="dream-to-action"' in raw, 'Missing announcement/purpose sections')
    if path in ['about.html', 'recent-work.html']:
        require(b'href="dream-to-action/"' in raw, 'Missing public application link')


def payload() -> dict[str, bytes]:
    approval()
    result = {path: get(spec[0]) for path, spec in ITEMS.items()}
    for path, data in result.items():
        check_payload(path, data)
    return result


def manifest(blobs: dict[str, bytes]) -> bytes:
    data = {
        'schema': 'redogit/public-dream-projection/v1',
        'scope': 'pinned-public-dream-app-and-public-profile-pages',
        'host': HOST,
        'application_commit': APP_COMMIT,
        'profile_commit': PROFILE_COMMIT,
        'files': [{'path': path, 'source_url': ITEMS[path][0], 'sha256': sha(raw), 'bytes': len(raw)} for path, raw in sorted(blobs.items())],
        'boundary': 'This overlay is separately authorized. projection-manifest.json still describes only the original testbed/Musilanguage subprojection. Canonical source authority remains in the two source repositories. No participant or private-origin records are included.',
        'original_private_about_route': 'about/index.html remains excluded; this about.html is the explicitly selected public profile source.',
        'rights': 'No new license; source project policies still apply.',
        'recorded_date': '2026-09-29'
    }
    return (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def inventory(out: Path) -> dict[str, str]:
    require(out.is_dir() and not out.is_symlink(), 'Projection output must be a regular directory')
    paths = list(out.rglob('*'))
    require(not any(p.is_symlink() for p in paths), 'Symlinks are not permitted in projection output')
    return {p.relative_to(out).as_posix(): sha(p.read_bytes()) for p in paths if p.is_file()}


def add(out: Path, blobs: dict[str, bytes]) -> None:
    approval()
    require(set(blobs) == set(ITEMS), 'Incomplete or excessive public overlay')
    for path, raw in blobs.items():
        check_payload(path, raw)
    before = inventory(out)
    require('index.html' in before and 'projection-manifest.json' in before, 'Base curated projection must be built first')
    require(not (set(before) & ALLOWED), 'Refusing to overwrite an existing route')
    require(not (out / 'dream-to-action').exists(), 'Publication directory already exists')
    for path, raw in {**blobs, 'dream-publication.json': manifest(blobs)}.items():
        target = out / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    after = inventory(out)
    require(set(after) - set(before) == ALLOWED, 'Unexpected added public paths')
    require(all(after[path] == digest for path, digest in before.items()), 'Existing public projection changed')
    require(not (out / 'about/index.html').exists(), 'Private-origin about route must remain absent')
    print('PASS: exactly four authorized overlay files added; all original projection bytes unchanged.')


def self_test() -> None:
    blobs = payload()
    with tempfile.TemporaryDirectory(prefix='dream-publication-test-') as directory:
        out = Path(directory)
        (out / 'index.html').write_text('BASE-SENTINEL', encoding='utf-8')
        (out / 'projection-manifest.json').write_text('{}', encoding='utf-8')
        add(out, blobs)
        require((out / 'index.html').read_text() == 'BASE-SENTINEL', 'Existing file was replaced')
        require(set(inventory(out)) == ALLOWED | {'index.html', 'projection-manifest.json'}, 'Incorrect publication inventory')
        try:
            add(out, blobs)
        except ValueError:
            pass
        else:
            raise ValueError('Collision rejection did not fire')
    for path, raw in blobs.items():
        try:
            check_payload(path, raw + b'changed')
        except ValueError:
            pass
        else:
            raise ValueError('Changed source was not rejected: ' + path)
    print('PASS: pinned source fetches, announcement links, exact allowlist, base preservation, collision rejection and corrupted-source counterprobes.')


def live() -> None:
    approval()
    last = None
    for attempt in range(30):
        try:
            files = {}
            for path in ITEMS:
                route = 'dream-to-action/' if path.endswith('/index.html') else path
                raw = get(HOST + route + '?release=' + APP_COMMIT)
                check_payload(path, raw)
                files[path] = raw
            posted = get(HOST + 'dream-publication.json?release=' + APP_COMMIT)
            require(posted == manifest(files), 'Posted overlay provenance does not match')
            print(json.dumps({'result': 'PASS', 'anonymous_https': True, 'status': 200, 'application_url': HOST + 'dream-to-action/', 'about_url': HOST + 'about.html#announcements', 'purpose_url': HOST + 'about.html#dream-to-action', 'recent_work_url': HOST + 'recent-work.html#dream-to-action', 'application_sha256': APP_HASH, 'canonical_app_commit': APP_COMMIT, 'profile_commit': PROFILE_COMMIT, 'checked_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}, indent=2))
            return
        except (ValueError, OSError) as exc:
            last = exc
            if attempt < 29:
                time.sleep(3)
    raise ValueError('Public routes did not pass verification: ' + str(last))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--out', type=Path)
    group.add_argument('--test', action='store_true')
    group.add_argument('--live', action='store_true')
    args = parser.parse_args()
    try:
        if args.out: add(args.out, payload())
        elif args.test: self_test()
        else: live()
    except (ValueError, OSError) as exc:
        raise SystemExit('Dream publication failed: ' + str(exc))
