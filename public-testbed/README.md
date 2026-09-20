# Conscience64 Public Experimental Test Bed

This directory is the **only intended source family** for the deliberately narrow public test-bed projection defined by issue #166.

```text
CONSCIENCE64_REPOSITORY != PUBLIC_TESTBED_PROJECTION
PUBLIC_TESTBED != WHOLE_REPOSITORY
PUBLIC_EXPERIMENT != VERIFIED_TRUTH
EXPERIMENTAL != SLOPPY
PUBLIC PROJECTION != SOURCE CORPUS
PRIVATE METHOD MAY INFORM SOLVING
PRIVATE SOURCE MUST NOT PROPAGATE
```

## Source model

- `testbed.json` is the data-driven experimental/navigation state.
- `site/**` is the static human-facing surface.
- `tools/build-public-testbed.mjs` may read only this source family and emits an isolated projection plus an exact-source manifest.
- The generated projection is not publication authority. Pages switching and network-edge verification are separate gates.

The initial calibration is **Projection Isolation v0**. It changes one degree: the projection builder's admitted source root. Repository-wide publication remains held until a later, separately verified switch.
