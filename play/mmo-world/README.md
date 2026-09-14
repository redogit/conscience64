# MMO World Beta — Conscience64

Canonical public launch surface: `play/mmo-world/`.

This page directly runs the already gated Explorer World client while exposing the larger MMO direction, slow-growth boundary, internal service protocols, and optional Bluetooth/gamepad companion layer.

## Current truth

- **Playable:** yes — the deterministic Explorer shard.
- **Live networked MMORPG:** no.
- **Accounts/shared authoritative state:** not yet.
- **Advertising surface:** yes — this is the stable URL to advertise gradually.
- **Bluetooth:** optional, user-initiated Web Bluetooth connection plus Gamepad API support for controllers already paired by the operating system.
- **Internal DNS:** deployment configuration is under `../../infra/internal-dns/`; it is not required for the static game to run.

## Protocols

`protocols.json` records DU-SD/1, DU-CAP/1, DU-WATCH/1, and DU-BT/1. These are versioned application contracts layered on standard DNS/BLE/browser facilities, not replacements for those wire protocols.

## Growth

Advertising is an intake mechanism, not permission for uncontrolled population growth. Expand cohorts only when safety, recovery, moderation/support capacity, stability, and operating cost remain within declared bounds.

## Fuzzball

The game easter egg is newly introduced. It remains separate from the unresolved historical Fuzzball project identity preserved by Conscience64 recovery records.
