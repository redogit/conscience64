# Locality, Pairity, and Scoped Parity

Status: reviewable coordination-method implementation, not a native-project merger.
Parent: [Cooperative Field - START](README.md).

This protocol implements the existing [standing Pairity and Knowledge Decay rules](STANDING_RULES.md)
and [location/authority separation](LOCATIONS.md). The [private-origin boundary](../history/PRIVATE_LANGUAGE_LEARNING_BOUNDARY.md)
continues to apply. No private archive, private narrative, registry, capture ledger,
identity mapping, or private-source content hash belongs in this public method record.

## Keep three objects distinct

**Locality:** identify the actual source, location, exact revision, privacy scope,
implementation authority, and available execution environment. An inaccessible device
or unresolved repository remains unknown; a search miss does not establish absence.

**Pairity:** retain A, B, A-to-B, B-to-A, their shared obligations, required differences,
mismatches, and Remainder. Pair the corresponding objects before asserting equality.
The relation is a third object, not permission to overwrite either endpoint.

**Parity:** report only the exact checked property, file scope, revisions, and test
conditions. Byte correspondence, behavioral checks, semantic reconstruction, execution
on another platform, and public publication are different obligations.

```text
PAIRITY != PARITY
REQUIRED_DIFFERENCE != REGRESSION
SCOPED_BYTES_MATCH != WHOLE_REPOSITORY_PARITY
BYTE_IDENTITY != SEMANTIC_TRUTH
GIT_SOURCE != LIVE_SITE
PRIVATE_SOURCE != PUBLIC_PROJECTION
```

## Executable boundary

`locality_parity.py` compares an explicit allowlist in a local directory with a
separately materialized mirror. It does not fetch, recurse over unlisted content,
upload, overwrite, grant permissions, start agents, or select working interpretations.

Run the synthetic controls:

```sh
python3 research/cooperative-field/test_locality_parity.py
```

Run a scoped comparison:

```sh
python3 research/cooperative-field/locality_parity.py scope.json --local local_projection --mirror fetched_projection
```

The manifest has exactly three top-level fields:

- `schema`: `locality-pairity-parity/v1`.
- `source_revision`: an exact 40-hex SHA-1 Git commit ID, not a moving branch name.
- `files`: a nonempty list of entries with `path`, `sha256`, and `git_blob_sha1`.

Paths are explicit relative POSIX paths. Empty scopes, duplicate entries, unpinned
revisions, unknown keys, malformed digests, unsafe paths, symlinks, missing files,
and byte mismatches fail closed. Each file is bounded to 32 MiB. The same wrong
bytes on both sides still fail against an unchanged pinned manifest.

The caller must establish the remote origin and commit-to-blob relationship separately.
A manifest and two matching directories can all be fabricated; the checker therefore
always reports `mirror_origin_authenticated: false`. Git blob hashing is a correspondence
check, not a signature. A supplied commit ID is a pin, not proof that the files belong
to that commit. Do not describe a subset mirror as a complete Git checkout.

This is a cooperative-filesystem tool, not protection against an adversary changing
files during inspection. It does not check file modes, directory metadata, Git history,
or host-platform behavioral equivalence. Unlisted files are neither read nor certified.

## Bounded synchronization procedure

Recover both endpoints and current upstream changes. Preserve the two predecessors.
Declare the allowed projection and the required differences. Test the inherited
obligations before combining features; keep fixed-count tests attached to their
original fixtures and add separate coverage for expanded state.

Make the smallest compatible change on an isolated branch or local candidate. Retain
failing controls and fixture corrections. Verify the candidate, then refetch the exact
published branch revision and compare its scoped blob IDs and bytes. Record pending
review/CI separately from passing local checks. Never force-push or replace another
workstream merely to make counts or version labels agree.

A private source may remain intentionally unpaired with a public source. Only an
independently re-grounded and authorized method/projection crosses the boundary.
No source registry is admitted, published, or semantically validated by this protocol.
The generated public-testbed publication scope is unchanged.

## Homeward and Remainder

Retain original endpoints, command logs, exact revisions, digest metadata, and a
reversible patch for the scoped change. Recheck after upstream drift. Preserve
self, neighbor, shared, ambient, and delayed consequences as separate observations.
Stop at the satisfied obligation; do not synchronize unrelated services.

Independent review, whole-repository CI, hostile-filesystem safety, cross-platform
execution, semantic reconstruction, and live-site verification are separate gates.
