#!/usr/bin/env python3
"""Compare an explicit, revision-pinned file scope with a separately fetched mirror.

Offline and read-only. Matching bytes do not authenticate the mirror, confer
permission, establish semantic parity, or certify unlisted files.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys

MAX_BYTES = 32 * 1024 * 1024


def read_manifest(text):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate JSON key')
            result[key] = value
        return result
    def invalid_constant(_):
        raise ValueError('non-finite JSON constant')
    return json.loads(text, object_pairs_hook=unique, parse_constant=invalid_constant)


def bounded_file(root, relative):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('root must be a regular directory')
    path = root
    for part in PurePosixPath(relative).parts:
        path = path / part
        if path.is_symlink():
            raise ValueError('symlink in scoped path')
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError('missing or oversized scoped file')
    data = path.read_bytes()
    if len(data) > MAX_BYTES:
        raise ValueError('scoped file grew beyond limit')
    return data


def verify(manifest, local, mirror):
    if not isinstance(manifest, dict) or set(manifest) != {'schema', 'source_revision', 'files'}:
        raise ValueError('invalid manifest fields')
    if manifest['schema'] != 'locality-pairity-parity/v1':
        raise ValueError('unknown manifest schema')
    revision = manifest['source_revision']
    if not isinstance(revision, str) or not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('an exact SHA-1 Git commit revision is required')
    entries = manifest['files']
    if not isinstance(entries, list) or not 1 <= len(entries) <= 1000:
        raise ValueError('scope must contain 1..1000 files')
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) != {'path', 'sha256', 'git_blob_sha1'}:
            raise ValueError('invalid file entry')
        name = entry['path']
        if not isinstance(name, str) or not name or '\\' in name or '\0' in name:
            raise ValueError('invalid scoped path')
        parts = name.split('/')
        if name.startswith('/') or any(p in ('', '.', '..', '.git') or ':' in p for p in parts):
            raise ValueError('unsafe scoped path')
        if name in seen:
            raise ValueError('duplicate scoped path')
        seen.add(name)
        for key, size in (('sha256', 64), ('git_blob_sha1', 40)):
            if not isinstance(entry[key], str) or not re.fullmatch('[0-9a-f]{%d}' % size, entry[key]):
                raise ValueError('invalid content digest')
        for root in (local, mirror):
            data = bounded_file(root, name)
            blob = b'blob ' + str(len(data)).encode('ascii') + b'\0' + data
            if hashlib.sha256(data).hexdigest() != entry['sha256'] or hashlib.sha1(blob).hexdigest() != entry['git_blob_sha1']:
                raise ValueError('scoped bytes differ from the pinned manifest')
    return {'status': 'SCOPED_BYTES_MATCH', 'files_checked': len(entries),
            'source_revision': revision, 'mirror_origin_authenticated': False,
            'semantic_parity_verified': False, 'publication_authorized': False,
            'unlisted_files': 'NOT_READ_OR_VERIFIED'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--local', required=True, type=Path)
    parser.add_argument('--mirror', required=True, type=Path)
    args = parser.parse_args()
    try:
        data = bounded_file(args.manifest.parent, args.manifest.name)
        result = verify(read_manifest(data.decode('utf-8')), args.local, args.mirror)
        print(json.dumps(result, sort_keys=True, indent=2))
        return 0
    except (ValueError, OSError) as error:
        print('parity check failed: ' + str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
