# Fuzzball Hidden Game — Alpha 0.1

This is the **new hidden Fuzzball game**, not the unresolved historical Fuzzball research carrier.

## Alpha 0.1

- deterministic floating-world seed (`640064`)
- triangular explorer
- 22 ambient Fuzzballs
- 16 humanoid creatures across four families: Mosswalker, Glasskin, Emberkin, Duskseer
- bounded deterministic wandering and proximity reactions
- keyboard movement and reset control
- no account, network, telemetry, or server save

## Release state

- released to `main` through PR #16
- merge commit: `89400df4ed1dc605ea8d54562ef2c94954c5cb96`
- repository Play workflow passed before merge, including the dedicated Fuzzball alpha model check
- verification scope is the deterministic model, syntax/static release contract, and the existing Play/browser gates; this is not a claim of exhaustive device compatibility

## Hidden boundary

The build is intentionally not linked from the main Play catalog and declares `noindex,nofollow`. Its canonical repository path is `play/fuzzball-hidden/`. Hidden means unlisted/easter-egg distribution; it is not a security boundary.

The test suite also asserts that `play/index.html` does not contain a `fuzzball-hidden` link, so accidental catalog exposure fails verification.

## Historical identity boundary

The historical Fuzzball recovery gap remains unresolved. The new game must not be used as evidence that the old carrier was recovered.

`HISTORICAL_FUZZBALL_CARRIER != NEW_FUZZBALL_HIDDEN_GAME`

See `research/history/recovery-gaps/FUZZBALL_RESEARCH.md` for the provenance boundary.

## Verify

```sh
node play/fuzzball-hidden/test.mjs
node --check play/fuzzball-hidden/world.mjs
node --check play/fuzzball-hidden/game.mjs
```

Alpha means the gameplay surface is intentionally incomplete. Passing these checks verifies the declared deterministic model and static release contract only; it does not establish full browser/device compatibility or production multiplayer readiness.
