# MMO World Beta — Conscience64

Canonical public launch surface: `play/mmo-world/`.

This page directly runs the already gated Explorer World client while exposing the larger MMO direction, slow-growth boundary, internal service protocols, optional Bluetooth/gamepad companion layer, and a bounded world-variety system.

## Current truth

- **Playable:** yes — the deterministic Explorer shard.
- **Live networked MMORPG:** no.
- **Accounts/shared authoritative state:** not yet.
- **Local progress:** yes — explicit manual browser-local save/load/clear shared with `play/explorer-world/` on the same origin.
- **Server/cloud save:** no.
- **Advertising surface:** yes — this is the stable URL to advertise gradually.
- **World Variety Lab:** yes — each region has curated adjective pools across light, sound, flora, fauna, motion, mood, mystery, and danger. A player can advance a deterministic local variety generation without changing map/combat/progression/reward semantics.
- **Bluetooth:** optional, user-initiated Web Bluetooth connection plus Gamepad API support for controllers already paired by the operating system.
- **Internal DNS:** deployment configuration is under `../../infra/internal-dns/`; it is not required for the static game to run.

## Founding-shard progress

The MMO beta page and Explorer World use the same versioned browser-local checkpoint. Loading is explicit rather than automatic. The deterministic world seed is recreated first; then bounded mutable state is restored.

The checkpoint can preserve player position/health/energy, Echo Shards, bounded monster state, region visitation, Fuzzball encounter state, defeated count, current story signal, and Chapter One completion. A completed chapter can be resumed for free exploration instead of forcing a new run.

`LOCAL_BROWSER_CHECKPOINT != SERVER_AUTHORITATIVE_MMO_STATE`.

This does not provide identity, account sync, cloud backup, anti-cheat authority, multiplayer synchronization, entitlement, moderation authority, or persistence across browsers/devices.

## World varieties

`varieties.mjs` defines curated per-region adjective pools. `describeRegion(region, generation, seed)` is deterministic and replayable; the same seed and generation produce the same descriptor set. `variety-ui.mjs` stores only the local descriptive generation in browser storage. Resetting the variety returns generation zero.

The current variety mechanism is intentionally descriptive. It does not mutate combat rules, map geometry, progression, rewards, scientific claims, or the canonical Explorer shard. That boundary lets the world become more expressive without turning flavor experiments into hidden gameplay changes.

Major world/canon releases remain slow and deliberate. Local adjective mutations are player-side presentation variations, not major releases or changes to the two-year major-update cadence.

## Protocols

`protocols.json` records DU-SD/1, DU-CAP/1, DU-WATCH/1, and DU-BT/1. These are versioned application contracts layered on standard DNS/BLE/browser facilities, not replacements for those wire protocols.

## Growth

Advertising is an intake mechanism, not permission for uncontrolled population growth. Expand cohorts only when safety, recovery, moderation/support capacity, stability, and operating cost remain within declared bounds.

## Fuzzball

The game easter egg is newly introduced. It remains separate from the unresolved historical Fuzzball project identity preserved by Conscience64 recovery records. The separate hidden Fuzzball Alpha remains unlisted and provenance-distinct from both the historical carrier and the Explorer/MMO checkpoint format.
