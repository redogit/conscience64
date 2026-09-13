# Browser data recovery

The transport at commit `788326bd403679f537c766bdf8ee8168e0d83535` could be copied and deployed, but could not initialize the app. Its payload shards totaled 79,999 Base64 characters; the decoded gzip stream was invalid. Even the recoverable JSON prefix contained malformed identifiers such as `:8` inside hexadecimal UOIDs. Successful JavaScript syntax and research-checkpoint checks did not detect this startup failure.

The successor transport is regenerated from the original `CONSCIENCE64_GITHUB_PAGES_READY.zip` package, whose ZIP integrity check passes:

| Source | SHA-256 |
| --- | --- |
| Original ZIP | `76e74cd203b5066cfd28d5f404e6b9ee8d99bcb48eb4a3322c895ff0037be738` |
| `conscience64/space-index.json` inside the ZIP | `1f174fc2ca64c42dd94a72ec02396b78db80158a8e14fc499692ee9c02b000fa` |

All 734 original logical IDs and UOIDs are retained: 218 research nodes, 508 research edges, six world fragments, one world, and one space manifest. Every edge resolves to the corresponding original endpoint UOID. No continuation records are invented. Earlier failed bytes remain in Git history.

This is a **browser projection**, not a byte-identical copy of the complete source index. `data-manifest.json` explicitly lists the retained search/display fields. Source packaging metadata is omitted, and the app generates microdata on demand. Original source UOIDs identify the original records; the separate `decodedSha256` identifies the exact projected browser bytes. The original package remains the full source carrier. This repair does not promote the represented research claims or merge the newer structured project registry into the historical graph.

To rebuild, obtain the original ZIP above and run:

```bash
python3 tools/rebuild_site_data.py /path/to/CONSCIENCE64_GITHUB_PAGES_READY.zip
node tools/check_site.mjs
```

The rebuild requires the exact archive and source hashes before writing anything. It writes six ordered payload shards and one empty reserved continuation shard, records their byte counts, Git blob identities and SHA-256 hashes, and records the decoded corpus hash. The ZIP is not bundled into this repository.

`check_site.mjs` verifies the complete transport and graph, then runs the actual `app.js` with local file fetches and DOM stubs, using real `Response`, `Blob`, `atob`, and `DecompressionStream` APIs. It checks readiness, search, lookup, traversal, microdata, the current project registry, and project IRPO output. It does not test visual rendering. The Pages synchronization workflow runs this gate before advancing the publishing branch, and the REDOGIT workflow runs it alongside the existing research checks.
