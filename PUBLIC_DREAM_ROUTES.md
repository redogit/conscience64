# Dream to Action — selected public hosting routes

The September 28, 2026 request authorizes publishing Dream-To-Action and announcing it with a brief purpose section on the public About Me page. This repository supplies an already-enabled GitHub Pages host, not canonical development authority for either project.

## Exact scope

The new `PUBLIC_DREAM_ROUTES_APPROVAL.json` authorizes three pinned public source files and one separately generated provenance manifest:

- `/dream-to-action/`: exact tested Operations 0.2 single-file app from `redogit/Dream-To-Action@667e989dcad401829bb097726b3a14cc0aa90f2c`.
- `/about.html`: explicitly selected public profile source `redogit/redogit@d9e6851196fbbf8cbcb7d43c19fa4737b7fa3d2d:docs/about.html`, including the added Announcements and Dream to Action purpose sections.
- `/recent-work.html`: public Current Surfaces announcement page from the same profile revision.
- `/dream-publication.json`: independent file inventory, source revisions, SHA-256 identities, and publication boundaries.

All routes are below `https://redogit.github.io/conscience64/`. Existing root/testbed, Musilanguage, private-origin exclusions, source manifests, and historical approval issue #166 remain unchanged. The original `projection-manifest.json` describes its original subprojection; the new manifest describes only the separately authorized addition. The full output is compared byte-for-byte before live checks.

**`about.html` is not `about/index.html`.** The latter is a historically restricted source route and remains a required 404. No Conscience64 private About page, repository root, participant journal, browser backup, or private library content is copied. Both projects retain their original source repositories, histories, and commercial-access policies. Publication is not a new license, a project merger, proof of benefit, or a backend deployment.

## Why this host

The intended dedicated Dream-To-Action Pages site is not enabled. The profile repository's existing workflow also returned Pages site Not Found during actual deployment (run 36457772017). Source/UI changes and profile CI had passed; those facts did not establish a live site. This host is independently confirmed Pages-enabled. Earlier `/redogit/` launch links are superseded for this publication; the source files remain there.

## Checks and update protocol

`python3 tools/add-dream-pages.py --test` fetches only immutable, pinned public files and verifies source hashes, content markers, collision rejection, corrupted-source rejection, and preservation of all existing output files. `--out <directory>` adds the narrow overlay only after the base build. It refuses collisions or symlinks and cannot expose a repository root. The original projection and workflow contract checks remain in place.

The source sync and live reconstruction both apply this same addition. Live checks still probe the original forbidden routes and then anonymously request each new URL, verify exact source bytes and the new provenance manifest, and record status/time. A source commit alone does not establish successful live delivery.

To update a release, explicitly review and advance the source commit/hash pins and source approval together. Do not silently mirror a moving branch or collect visitor records. A later change to an About Me source file does not automatically change the pinned public copy.
