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

## Hidden boundary

The build is intentionally not linked from the main Play catalog and declares `noindex,nofollow`. Its canonical repository path is `play/fuzzball-hidden/`. Hidden means unlisted/easter-egg distribution; it is not a security boundary.

## Verify

```sh
node play/fuzzball-hidden/test.mjs
node --check play/fuzzball-hidden/world.mjs
node --check play/fuzzball-hidden/game.mjs
```

Alpha means the gameplay surface is intentionally incomplete. Passing these checks verifies the declared deterministic model and static release contract only; it does not establish full browser/device compatibility or production multiplayer readiness.
