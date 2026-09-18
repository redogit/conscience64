# RIPPING MANY ARMS OFF — Massive 3D Roguelike MMORPG Canon

**Status:** active successor target for the Conscience64 MMO lineage.  
**World ID:** `rmao-world`  
**Release line:** `RIPPING MANY ARMS OFF 1.0`  
**Scope:** world architecture, roguelike lifecycle, limb-system semantics, multiplayer authority, persistence and 3D streaming.

Historical predecessor records remain provenance. They do not retain current authority.

## Core identity

Ripping Many Arms Off is a large persistent 3D world containing roguelike expeditions inside an MMO-scale shared setting.

The title describes a fictional combat mechanic: creatures may have arbitrary numbers and arrangements of arms represented by a limb graph. Arms are gameplay nodes, not real-anatomy instructions.

The player can remove, disable, damage, repair, replace, mutate or regrow arm nodes when the entity definition permits it. Losing an arm changes capability through data: weapon slots, reach, attacks, carrying, defense, traversal or special abilities.

A non-graphic presentation mode must preserve the same state transitions and gameplay information while representing detachment as disarm/disable/break effects.

## 3D world hierarchy

Canonical deterministic hierarchy:

`WorldSeed → Region → Sector → Chunk → Cell → Entity`

- World coordinates are 3D.
- Stable IDs are independent of render order.
- Procedural generation is a pure function of versioned generator + world seed + stable spatial ID.
- Active rendering/physics streams only a bounded neighborhood; persistent world identity is larger than the loaded neighborhood.
- Large-distance precision must use floating origin, hierarchical coordinates, or an equivalent tested method.
- Chunk unload must not silently erase authoritative persistent state.
- A generation hash identifies the exact generator inputs used to reconstruct a chunk.

## Roguelike lifecycle

Every expedition has a distinct `runId` and `runSeed`.

State is explicitly scoped:
- **run-scoped:** temporary map revelation, run inventory, temporary mutations, encounter state;
- **player-persistent:** account/pseudonym, accessibility choices, explicitly admitted unlocks and history;
- **world-persistent:** server-authoritative durable world changes;
- **ephemeral:** render caches, prediction buffers, particles and presentation-only state.

Defeat ends or transforms run-scoped state according to the run rules. It does not rewrite prior history.

`RUN_RESET != HISTORY_ERASURE`

## Limb graph

A body is a graph, not a fixed humanoid slot table.

Minimum limb-node fields:
- `limbId`
- `kind`
- `parentLimbId`
- `state`: `attached | damaged | disabled | detached`
- `capabilities[]`
- `equipmentSlots[]`
- `hitVolume`
- `detachRule`
- `regrowthRule`
- `presentationClass`

Arm count is data-driven and may be zero, two, dozens, procedurally generated, boss-authored or transformed during play.

A detach event references entity ID + limb ID + authoritative event ID. Detaching a limb removes exactly the capabilities granted by that node/its dependent subtree unless another component supplies them.

## Combat contract

Combat is event-driven:
`AttackIntent → ServerValidation → HitResolution → DamageEvent → Limb/Body Transition → Loot/Capability Consequence → Replication`

Client prediction may improve responsiveness but cannot mint authoritative damage, detachment, loot, inventory, XP, progression or persistent mutation.

`CLIENT_PREDICTION != COMBAT_AUTHORITY`

## MMO authority

A live-MMORPG claim requires an authoritative service for:
- authenticated/pseudonymous player identity;
- shard/instance membership;
- movement reconciliation;
- combat and limb-state resolution;
- inventory and loot;
- world/persistent progression;
- moderation/report/block/mute state;
- recovery and audit logs.

The current static/local clients are predecessors and test carriers.

`LOCAL_MULTIPLAYER != SERVER_AUTHORITY`  
`CURRENT_2D_PROTOTYPE != MASSIVE_3D_WORLD`

## Content and accessibility

Violence is fictional game content. Essential combat information cannot depend on gore, color, rapid reaction, audio, or animation alone.

Required alternatives:
- non-graphic limb presentation;
- textual/state cues for attached/damaged/disabled/detached;
- reduced-motion support;
- untimed alternatives where a mechanic does not intrinsically require timing;
- remappable controls where feasible.

## Grounded-reality relation

`REALITY_CANON.md` still controls visual grounding and scientific/provenance boundaries. RMAO can contain impossible monsters and extreme limb configurations while keeping ordinary materials, light, scale and external evidence boundaries explicit.

## Promotion gates

Do not call a build “massive 3D MMORPG” unless evidence exists for the corresponding claims.

1. **3D gate:** camera, transforms, collision and streamed 3D chunks execute in the target runtime.
2. **scale gate:** measured stream/load tests exercise declared world/chunk budgets.
3. **roguelike gate:** deterministic run lifecycle and persistence-scope tests pass.
4. **limb gate:** graph mutation/property tests verify capability consequences and reconstruction.
5. **authority gate:** shared combat/persistence is server-authoritative.
6. **recovery gate:** restart/reconnect/rollback tests preserve admitted durable state.
7. **accessibility gate:** non-graphic and non-visual state representations are exercised.

Until a gate passes, its claim remains a target.
