# Conscience64

Privacy-safe universal research space hosted as a static GitHub Pages application.

Visible surface: **I / R / P / O**.

## Commercial access boundary

No third-party commercial access is currently authorized for owner-controlled original material unless explicitly granted. Existing MIT-covered `play/` material and any other already-applicable licenses retain their existing terms. See [`COMMERCIAL_ACCESS_POLICY.md`](COMMERCIAL_ACCESS_POLICY.md).

## September 13–14 consolidation

[`research/updates/2026-09-13-14/INPUT_AND_STATE_LEDGER.md`](research/updates/2026-09-13-14/INPUT_AND_STATE_LEDGER.md) is the current two-day synthesis. It keeps recoverable user directions separate from implemented, verified, proposed, open, and unrecovered state. It is explicitly **not** presented as a byte-perfect transcript.

The forward-only project manifest is [`research/projects/CURRENT.json`](research/projects/CURRENT.json). Historical/browser snapshots remain preserved rather than rewritten to look current.

## External research + production federation bridge

The [redogit Research + Production Federation bridge](research/bridges/redogit-federation/) connects this repository to the public federated history/research/production/play/teaching maps. Its [active-project registry](research/bridges/redogit-federation/active-projects.json) exposes only Conscience64 work whose current role is active/current/deployed or whose public/local implementation is currently runnable. Preserved lineages remain preserved, and deliberately unlisted surfaces remain unlisted.

It is **navigation only**: it does not admit external claims into the Conscience64 research registry, world/game canon, Context Horizon authority, or evidence ledger.

`FEDERATION_POINTER != RESEARCH_ADMISSION` · `CONNECTED != MERGED` · `UNLISTED_ACTIVE != PUBLICLY_LISTED`

## MMO World Beta

**Featured launch surface:** [MMO World Beta](https://redogit.github.io/conscience64/play/mmo-world/)

The MMO World page directly runs the already smoke-tested Explorer World shard while the shared-world layer remains gated. It is intentionally honest about the current boundary: playable browser world now; server-authoritative accounts, shared multiplayer state, moderation services, commerce, and admission enforcement are not yet claimed complete. The beta also exposes optional user-initiated Bluetooth/gamepad support, deterministic descriptive world varieties, a local data-only [Arcade Forge](https://redogit.github.io/conscience64/play/mmo-world/forge/), and the DU-SD/1, DU-CAP/1, DU-WATCH/1, and DU-BT/1 protocol contracts.

Arcade Forge admits the useful data-only mini-game recipe idea from the retired parallel MMO branch without reviving that architecture. Imported plug-ins cannot execute code or HTML, add URL/network/server/account/prize authority, or modify canonical Explorer progression. Their reward values are preview metadata only.

Advertising should point to this stable Conscience64 URL and grow interest gradually rather than bypassing safety, recovery, stability, moderation/support-capacity, or operating-cost gates.

## Research analytics

[Research Analytics](https://redogit.github.io/conscience64/analytics/) is an evidence-bounded event-stream view for observations, tests, verification, contradictions, interpretations, boundary changes, revisions, promotions, and reopened questions. The browser validates every event before rendering it and labels fallback/demo data explicitly. GitHub Pages is only the static view; it is not represented as the authoritative ledger or a live event backend.

The companion LLVM bridge emits the same JSON contract from compiled experiments. CI builds the bridge, validates its emitted event, rejects unknown event kinds, and runs the browser contract checks before analytics changes are published.

## Try the free projects

The [public playground](https://redogit.github.io/conscience64/play/) turns ongoing ideas into a growing set of usable browser projects:

| Tool | What you can do |
| --- | --- |
| [MMO World Beta](https://redogit.github.io/conscience64/play/mmo-world/) | Enter the playable Explorer shard, explore deterministic descriptive varieties, open the local data-only Arcade Forge, and optionally connect a Bluetooth companion or OS-paired gamepad |
| [Explorer World](https://redogit.github.io/conscience64/play/explorer-world/) | Play the current single-player browser shard directly |
| [Computational Chorus](https://redogit.github.io/conscience64/play/computational-chorus/) | Explore exact, speakable, mnemonic, and procedural musical projections |
| [Orbit Shelf](https://redogit.github.io/conscience64/play/orbit/) | Collect and search notes with source links |
| [Word Weave](https://redogit.github.io/conscience64/play/weave/) | Rearrange writing while keeping the original |
| [Pattern Garden](https://redogit.github.io/conscience64/play/garden/) | Make geometric art and export SVG or text |
| [Small Steps](https://redogit.github.io/conscience64/play/steps/) | Plan a next step and preserve dated checkpoints |
| [Source Compare](https://redogit.github.io/conscience64/play/compare/) | Compare exact text changes and preserve both inputs |

English, Spanish, French, and Arabic interfaces are available across the original utility set; Unicode writing, keyboard controls, optional local saving, and no-account operation remain core accessibility/privacy goals. The new tools have an MIT license scoped to `play/`. See [the usage and provenance notes](play/README.md). Their [public-tool catalog](play/projects.json) is separate from the research registry below.

## Internal workspace update

[Orbit Search and Conscience space](research/cross-carrier/2026-09-13/internal-update/global_search/index.html) adds 65 enabled search services, 248 country/territory routes excluding Russia, and a geometric 4D-to-3D black-hole view. Run locally for metadata retrieval and a separate headless XY interaction workspace. [Materials, validation and complete recovery bundle](research/cross-carrier/2026-09-13/internal-update/README.md) preserve prior transport results and open failures. Public browsing still depends on network/certificate access; external-page activation is not enabled.

## Agents, skills, and coordination

The [Society skills guide](skills/README.md) explains how agents use skills and connectors, how a society organizes their responsibilities, and how swarm coordination differs from parallel execution. The [architecture and proposed development workflow](skills/SOCIETY.md#agents-skills-connectors-societies-and-swarms) preserve the existing human-purpose and evidence boundaries; they do not claim a connected Visual Studio editor, an executed swarm, or canonical Society activation.

## Research projects

The research portfolio has a compact project map that preserves both accomplishments and failures instead of presenting only successes.

See [`research/projects/README.md`](research/projects/README.md) for the current nine human-readable records and their claim ceilings: Cross-Carrier Wave, Orbit Library, Tiny Babel/TBCL, Operator Moonshot, Hodge Conjecture Research Spine, Research Analytics, Model Experiments, Geometry/4D/Codecs, and Historical Recovery.

The registry lineage is intentionally split rather than silently rewritten:

- [`research/projects/projects.json`](research/projects/projects.json) is the preserved seven-project browser/API registry snapshot;
- [`research/projects/CURRENT.json`](research/projects/CURRENT.json) is the forward-only current manifest that adds Hodge and Research Analytics as successor records.

`Conscience64API.stats().projects.count` therefore remains seven until the compressed browser corpus is deliberately regenerated. The current human-readable portfolio count is nine. `tools/check_project_current.mjs` verifies that distinction.

Browser API: `window.Conscience64API`.

Examples:
```js
Conscience64API.search.simple("black hole quantum")
Conscience64API.search.advanced({ text: "language", minDegree: 5 })
Conscience64API.get("project:physics")
Conscience64API.traverse("project:orbit", { depth: 2 })
Conscience64API.irpo({ I: "black hole", R: {}, P: { action: "search.simple" } })
```

Every searchable object in the preserved browser corpus has a deterministic `uoid:sha256:...` identifier and microdata.

## Evidence boundaries carried forward

```text
USER_INPUT != ASSISTANT_SYNTHESIS
REQUESTED != IMPLEMENTED
IMPLEMENTED != VERIFIED
BYTE_IDENTITY != SEMANTIC_TRUTH
OBSERVATION != INTERPRETATION
REPETITION != VERIFICATION
TRANSPORT_VALIDITY != EVIDENCE_VALIDITY
DEMO_DATA != RESEARCH_EVIDENCE
STATIC_VIEW != AUTHORITATIVE_LEDGER
CONSCIENCE64_RETRIEVAL != INDEPENDENT_EVIDENCE
PLAYABLE_SHARD != SERVER_AUTHORITATIVE_MMO
DATA_ONLY_PLUGIN != EXECUTABLE_CODE
LOCAL_PLUGIN_PREVIEW != CANONICAL_GAME_STATE
LOCAL_PLUGIN != SERVER_AUTHORITY
```

## REDOGIT

This repository follows an explicit regenerate-and-verify successor rule: keep provenance, keep failed carriers in history, prefer inspectable source and manifests, and regenerate derived artifacts instead of treating archive dumps as the source of truth.

The current contract is **verified**. `.github/workflows/redogit-local.yml` materializes the exact public `$GITHUB_SHA` with Git, runs the compact REDOGIT self-check, and verifies byte counts and SHA-256 identities for the directly committed research surface. This action-free transport is deliberate: external Action/reusable-workflow paths reproduced pre-job `startup_failure` in this repository, while the direct scheduler probe and direct-Git verification path both schedule normally.

See [`REDOGIT.md`](REDOGIT.md) and [`redogit.json`](redogit.json).

## Recovery carriers

Historical/recovery material is modeled as a provenance-preserving carrier graph rather than a flat quote or document corpus. Work, witness, edition, scan, transcription, translation, and reconstruction identities remain distinct; `UNKNOWN` is not treated as `ABSENT`.

See [`RECOVERY_CARRIER_MODEL.md`](RECOVERY_CARRIER_MODEL.md) for the loss/evidence/lineage model and adaptive cross-carrier coordinate overlay.

## Generated research checkpoints

Generated Cross-Carrier / Float64 research material is preserved under [`research/cross-carrier/`](research/cross-carrier/). The 2026-09-12 package index records exact SHA-256 identities for the original, v2.1, v2.2, and SAT64/MCR checkpoints.

The v2.2 checkpoint deliberately keeps two manifest meanings separate:

- `manifest.json` — the original **full generated-package inventory** and its expected artifacts;
- `repository_manifest.json` — the **compact surface actually committed directly** in the repository and verified byte-for-byte in CI.

Transport shards under `v2.2/transports/` remain provenance/recovery evidence; they are not silently promoted to directly materialized package files.

See [`research/cross-carrier/2026-09-12/PACKAGE_INDEX.md`](research/cross-carrier/2026-09-12/PACKAGE_INDEX.md).

The integrity rule is unchanged: a byte hash establishes identity, not semantic truth, proof weight, or independent corroboration. In particular, the preserved v2.2 state explicitly keeps `P ?= NP` as `OPEN`.

To verify the current committed v2.2 surface:

```bash
python3 tools/redogit_selfcheck.py
python3 tools/verify_research_manifest.py \
  research/cross-carrier/2026-09-12/v2.2/repository_manifest.json \
  research/cross-carrier/2026-09-12/v2.2
node tools/check_project_current.mjs
```

## Corpus transport

The browser corpus is transported through ordered `data-NN.txt` shards. Shard boundaries have no semantic meaning and do not define object identity.

See [`data-manifest.json`](data-manifest.json) for the current browser-transport state. This transport is separate from generated research checkpoints; incomplete research archive shards are not treated as complete current artifacts.

Run `node tools/check_site.mjs` with Node.js 22 or newer to verify all shard identities, decompress the complete corpus, check graph endpoints, and exercise the actual app startup and search/project APIs. Both repository verification and Pages source synchronization run this check. It covers data and API behavior, not visual rendering.

The repaired transport is a documented browser projection of the verified original Pages package. See [`SITE_DATA_RECOVERY.md`](SITE_DATA_RECOVERY.md) for source hashes, retained fields, and the rebuild command.

## GitHub Pages

GitHub Pages publishes the **`gh-pages` branch / repository root**. The `pages-sync.yml` workflow checks the site and synchronizes the exact `main` commit to that publishing branch; GitHub's native Pages build and deployment then publishes it. Changes to the browser files or structured project library trigger synchronization.

The published corpus is privacy-safe; personal/family/private information is outside the site.