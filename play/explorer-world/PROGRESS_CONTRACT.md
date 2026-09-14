# Explorer World local progress contract

Explorer World and the canonical `play/mmo-world/` beta surface share one **manual browser-local checkpoint** on the same origin.

## Contract

- save only when the player explicitly chooses **Save progress**;
- load only when the player explicitly chooses **Load progress**;
- reconstruct the deterministic world seed first, then reapply bounded mutable play state;
- preserve player position/health/energy, collected Echo Shards, bounded monster state, visited regions, Fuzzball encounter state, defeated count, story signal, and Chapter One completion;
- a completed Chapter One checkpoint can resume for free exploration rather than forcing a reset;
- restarting a chapter does not silently delete the saved checkpoint;
- clearing the save is explicit.

## Authority boundary

`LOCAL_BROWSER_CHECKPOINT != SERVER_AUTHORITATIVE_MMO_STATE`.

This is not an account, cloud backup, cross-device save, entitlement, anti-cheat authority, multiplayer synchronization, moderation authority, or durable server persistence. Browser storage can be cleared by the user or browser.

The separate hidden Fuzzball Alpha remains unlisted and provenance-distinct. The unresolved historical Fuzzball carrier remains unresolved and is not identified by this save format.
