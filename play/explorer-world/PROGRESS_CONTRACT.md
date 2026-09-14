# Explorer World local progress contract

This branch adds **manual browser-local save/resume** for the shared Explorer World shard used by both `play/explorer-world/` and the canonical `play/mmo-world/` beta surface.

Boundaries:

- local browser storage only;
- no account, server sync, cloud backup, multiplayer authority, entitlement, or security claim;
- loading is explicit rather than automatic;
- deterministic world seed is reconstructed first, then bounded mutable play state is reapplied;
- hidden Fuzzball Alpha remains a separate unlisted game and is not part of this save format;
- historical Fuzzball carrier identity remains unresolved and distinct.

The first versioned save format preserves player position/health/energy, collected Echo Shards, bounded monster state, region visitation, Fuzzball encounter state, Chapter One completion, defeated count, and current story signal.
