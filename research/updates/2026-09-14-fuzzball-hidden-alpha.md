# Fuzzball Hidden Game — Alpha 0.1 Release Record

Date: 2026-09-14

Status: `MERGED_ALPHA_VERIFIED_WITHIN_DECLARED_MODEL_SCOPE`

## Subject

New hidden browser game: **Fuzzball Hidden Game — Alpha 0.1**.

This record concerns the newly implemented game at `play/fuzzball-hidden/`. It does **not** identify, recover, or replace the unresolved historical Fuzzball research carrier.

Invariant:

`HISTORICAL_FUZZBALL_CARRIER != NEW_FUZZBALL_HIDDEN_GAME`

## User direction implemented

The hidden game was advanced to an alpha release with humanoid creatures.

Implemented alpha state:

- deterministic floating-world seed `640064`;
- triangular explorer;
- 22 ambient Fuzzballs;
- 16 humanoid creatures;
- four humanoid families: Mosswalker, Glasskin, Emberkin, Duskseer;
- deterministic bounded wandering;
- proximity reactions to the player;
- keyboard movement and reset controls;
- no account, network multiplayer, telemetry, or server save.

## Distribution boundary

The alpha remains intentionally unlisted:

- no link from `play/index.html`;
- page declares `noindex,nofollow`;
- canonical repository location is `play/fuzzball-hidden/`;
- the automated alpha test fails if the main Play page begins linking to `fuzzball-hidden`.

`UNLISTED != SECURITY_BOUNDARY`.

The path can still be reached by someone who knows it or discovers the repository source. The release therefore makes no secrecy or access-control claim.

## Verification

PR #16, **Release Fuzzball Hidden Game alpha with humanoid creatures**, was merged to `main`.

Merge commit:

`89400df4ed1dc605ea8d54562ef2c94954c5cb96`

Before merge, the repository Play workflow completed successfully, including:

- exact commit materialization;
- public Play data/static-resource verification;
- Chrome application checks;
- Explorer World browser checks;
- dedicated Fuzzball Hidden Alpha deterministic-model verification.

The dedicated alpha test verifies the declared deterministic world shape, humanoid-family set, movement finiteness, `noindex,nofollow`, and the unlisted Play-catalog boundary.

## Evidence ceiling

The verified result is bounded to the checked software contract.

The following are **not** established by this release:

- exhaustive browser or device compatibility;
- production multiplayer readiness;
- server-authoritative world state;
- security through obscurity;
- identity with the historical Fuzzball project;
- recovery of the historical Fuzzball source;
- scientific or research claims derived from gameplay imagery or names.

## Related records

- `play/fuzzball-hidden/README.md` — alpha implementation and operator boundary;
- `play/fuzzball-hidden/test.mjs` — deterministic model and unlisted-boundary checks;
- `.github/workflows/playground.yml` — repository Play verification gate;
- `research/history/recovery-gaps/FUZZBALL_RESEARCH.md` — unresolved historical carrier and explicit non-equivalence;
- `research/projects/CURRENT.json` — forward-only current software-boundary record.

## Observation / interpretation separation

**Observed/executed:** the new game files exist in the merged repository state and the declared workflow checks passed for the release head.

**Interpretation:** the humanoid families, Fuzzballs, floating world, and other creative elements are game design constructs. Their names or structural resemblance to historical research do not establish lineage or scientific meaning.
