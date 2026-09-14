# REDOGIT history and restore

Restoration follows the existing REDOGIT protocol. A restore is a new successor with an explicit difference and verification, not erased history.

## Saved work

The five original playground tools and Orbit Search support saved-document checkpoints on the same browser origin. Save in the tool first; then create a labelled checkpoint in History & Restore. A restore validates the selected document and digest, retains the present saved value as a Before restore checkpoint, and changes only that facet's saved-document key. It does not replace the open app's draft. Use Load in playground tools, or reopen Orbit Search, to apply the restored value. Restore the Before restore checkpoint to undo.

Export history before clearing browser data or changing devices. Imports are facet-specific, digest-checked and non-destructive to application state until Restore is chosen. SHA-256 detects accidental changes; it does not authenticate an author. A maximum of 20 checkpoints and 2 MB per facet is retained; capacity failure requires explicit export/removal, never silent pruning. Browser storage may be unavailable, cleared or quota-limited. An exported file is readable and unencrypted.

Other facets have source history and their own native export/import features where available. This release does not checkpoint Space Lens governance, authorization, speech/audio streams, unsaved fields, runtime traces, external browser sessions, or account credentials. The exact facet map is versions.json. Source ZIPs do not include browser-local user work.

## Restore published source

1. Select a recorded commit in the history page and inspect its source or download its exact source ZIP. This is a historical copy, not automatically the deployed application.
2. Start a new branch from the repository's current main branch. Compare the selected revision with the current version for the specific paths to restore.
3. Restore those selected paths from the old commit. Include matching schemas/manifests when required; do not copy an old current pointer or old passing status as proof that the new combination works.
4. Run the repository's declared REDOGIT checks plus the affected component's checks. Preserve failures. In Conscience64, coordinate-space/verify_release.py checks its manifest, tools/check_site.mjs checks the corpus/API, and the Pages workflow runs component gates.
5. Commit the verified successor, open a reviewable pull request, merge after required checks, and confirm deployment for that exact merge revision.

Example for a reviewed page-only restore, from a clean checkout:

```sh
git switch -c restore/reviewed-page origin/main
git restore --source=02d710cd8a985d8672cc0fd83b518db9d04db8f4 -- about/index.html
# Inspect the diff and run the affected checks before committing.
```

Do not force-push, delete later commits, bypass failed gates, or use git reset --hard as the public restore procedure. A historic restore may reintroduce an old defect; source dates, dependencies, permissions and Knowledge Decay remain part of review.

## History scope

The timeline begins with confirmed source/deployment records available in this task. The per-facet and per-repository GitHub history links expose the full accessible commit history. They are not a claim that every historical version was deployed or remains compatible with today's data. Seven public repositories are linked; the eighth remains an unnamed private placeholder. REDOGIT.md and redogit.json remain unchanged.

## Ideas, methods, and practical work

The same history hub now records any subject without a closed discipline list. Start with the actual situation, intended change, and reason. Expand the context questions when useful: evidence and exact sources; observations versus interpretations; contrary results; affected people and obligations; dependencies and part–whole relationships; other perspectives; freshness and Knowledge Decay; unresolved matters. An empty optional field means not recorded, not absent. A minimal repair is a task-local proposal, not a claim of globally optimal change.

Save creates an immutable revision with a stable subject ID, predecessor ID, date, full content, and SHA-256 covering the record. Inspect shows changed fields and their previous values. Restore appends a successor referencing both the current predecessor and the recovered revision. All later evidence, failures, and warnings remain inspectable. Restored content is marked as requiring renewed review; its historical credibility is never automatically reinstated. Source assertions and author-entered checks remain assertions until separately evaluated using appropriate evidence. There is no automatic domain selection, truth promotion, or dependency repair.

The log is local to this browser origin. Explicit history export/import supports transfer. Import verifies hashes and predecessor links, rejects conflicts, and keeps existing current selections. Imported branches can be inspected and explicitly restored. Hashes detect changes, not authorship or truth. Cross-tab mutations use Web Locks and reject a stale predecessor rather than overwrite newer work. A single storage write keeps the previous log intact if a quota error occurs. This UI never deletes revisions; 200 revisions or 2 MB is a hard cap. Export at capacity; archive rotation is not implemented. Unsaved drafts can be exported separately for reference but are not accepted as history imports.

This is an extension within the existing REDOGIT history surface. It does not change REDOGIT.md or redogit.json, connect browser notes to a public account, or automatically collect material from other applications. All current facet links reach this shared hub. The six existing saved-document adapters and their restoration behavior remain available.
