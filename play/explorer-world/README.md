# Explorer World — browser build

A directly playable, local-first browser vertical slice of the larger game direction developed in this project.

## Play

Open `play/explorer-world/index.html` through the Conscience64 GitHub Pages site.

Controls:

- WASD or arrow keys — move
- Space — resonance pulse
- E — interact
- P — pause
- Touch buttons are provided on small-screen devices

## Current playable scope

- Five regions: Sunmeadow, Nightbog, Emberwood, Frostfield, and The Anomaly
- Four monster families with different movement/health profiles
- Health and regenerating energy
- Resonance pulse combat
- Echo Shard collection
- Region-triggered story signals
- Hidden Fuzzball encounter after three Echo Shards
- Final anomaly gate after six Echo Shards plus Fuzzball
- Chapter One completion can continue into free exploration instead of forcing a reset
- Keyboard and touch controls
- Explicit manual browser-local save / load / clear controls
- The same local checkpoint is readable from `play/mmo-world/` on the same origin
- No account, server, remote asset, or external runtime dependency

## Progress contract

Progress is never auto-loaded. The player explicitly chooses **Save progress** and **Load progress**.

The versioned local checkpoint reconstructs the deterministic world seed first and then reapplies bounded mutable play state: player position/health/energy, collected Echo Shards, bounded monster state, visited regions, Fuzzball state, defeated count, story signal, and Chapter One completion.

`LOCAL_BROWSER_CHECKPOINT != SERVER_AUTHORITATIVE_MMO_STATE`.

The checkpoint is not an account, cloud backup, entitlement, anti-cheat authority, or multiplayer state. Clearing browser storage can remove it.

## Boundary

This is a playable **single-player browser vertical slice**, not yet the networked MMORPG/shared world. Accounts, multiplayer state, commerce, advertising, platform registration, and long-term world evolution remain future layers.

Fuzzball is a research easter egg that asks boundary-testing questions. It does not present game metaphors as results in quantum physics or any other research field. The separately released hidden Fuzzball Alpha remains provenance-distinct and unlisted.
