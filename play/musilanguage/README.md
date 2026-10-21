# Musilanguage Studio

**Current public route:** https://redogit.github.io/conscience64/play/musilanguage/  
**Current source entry:** [index.html](index.html)  
**Status:** one curated public application inside the isolated Conscience64 Pages projection.

## What it is

Musilanguage Studio is a linguistic-music generator.

```text
language / symbols / emoji / exact UTF-8
-> MUSIC64
-> 64 arrangement profiles
-> instrument buses
-> listener mix / reversible variation
-> playback / MIDI / WAV / session
```

Current procedural instrument buses:

- guitar / distorted strings;
- bass / low voice;
- keys / harp / plucked voice;
- strings / sustained ensemble;
- lead / melodic voice;
- drums / percussion.

The generator also exposes tempo, meter, mode, tonic, motif treatment, style, and intensity. The 64 style profiles span eight broad families; they are creative arrangement profiles, not an exhaustive taxonomy of all music and not claims of cultural authenticity.

## One application, preserved history

The current Pages projection exposes **only** `play/musilanguage/` as the current Musilanguage application.

Predecessors remain preserved in repository and Git history:

1. **Carry the Fire** — commit `ddb5b5c9ca82bd43bdf1095e9b13cf1f65d9dccf`
2. **Musilanguage Radio** — commit `23dda081bc953280c23bbe59a8f91499a80b3a22`
3. **Word Forge / MUSIC64** — commit `f2921bd88379067c2fd2532364df3fa1104113fb`
4. **64 style profiles** — commit `21595039f8d7569e8568c722e99b76b6766cb549`
5. **Unified Musilanguage Studio** — PR #202 / merge `a3e6616ab16447c47628d04defad290521b45e35`

The old `single.html`, `radio.html`, and `word-forge.html` source files are not deleted. They are intentionally excluded from the current `gh-pages` projection so history does not masquerade as three additional current products.

```text
ONE PUBLIC APP != DELETION OF HISTORY
CURRENT != ONLY THING THAT EVER EXISTED
HISTORY != CURRENT AUTHORITY
```

## Meaning boundary

Musilanguage maps source bytes and selected musical settings into a deterministic/replayable generative music carrier.

```text
LANGUAGE-TO-MUSIC != SEMANTIC TRANSLATION
MUSIC64 ADDRESS != SOURCE TEXT
STYLE PROFILE != CULTURAL AUTHENTICITY
INSTRUMENT MIX != SOURCE MUTATION
GENERATED MUSIC != SCIENTIFIC EVIDENCE
```

The listener decides whether a result is musically useful.

## Source pieces

- [index.html](index.html) — current unified interface
- [word-forge.js](word-forge.js) — application control, instrument mix, replay/export
- [music64.js](music64.js) — source/MUSIC64 mapping
- [style-profiles.js](style-profiles.js) — 64 arrangement profiles
- [engine.js](engine.js) — procedural instruments, score generation, audio/MIDI/WAV renderer
- [listener-floats.js](listener-floats.js) — reversible local musical variation
- [utf8-space.js](utf8-space.js) — exact strict UTF-8 rank/unrank carrier
- [MUSIC64.md](MUSIC64.md) — detailed transport and replay contract

## Public projection boundary

The Pages projection uses a nine-file runtime allowlist. Documentation and predecessor pages remain repository/source history unless separately authorized.

```text
MUSILANGUAGE_PUBLIC != WHOLE_PLAY_PUBLIC
PUBLIC_PROJECTION != REPOSITORY_AUTHORITY
```


## Private vocal reference (pending singing renderer)

The Studio accepts a local private descriptor through **Private vocal reference**.
The selected profile becomes the default reference when vocals are explicitly
requested in this tab. Instrumental is the initial state; importing a session
resets that request. Forget or reload clears the private reference. No audio is
fetched, decoded, uploaded, or synthesized by this feature.

See [VOICE_REFERENCE.md](VOICE_REFERENCE.md) for the private descriptor contract,
privacy boundary, tests, and remaining renderer work.

The [v1 renderer specification](VOICE_SPEC.md) and [Ryan music-only voice profile](ryan-voice-profile.json) distinguish creative targets, reported recording measurements, and unverified properties. Singing remains unimplemented.


## Local recorded-performance path

Choose an audio file, set explicit start/end times, audition and confirm that the
segment contains only your intended performance. Enable mixing to play it once
with the procedural accompaniment. Export the selected recording separately or
use Export WAV for the mix. Original files remain unchanged; nothing is uploaded.
This is recorded-performance playback, not newly synthesized singing. See
[RECORDED_PERFORMANCE.md](RECORDED_PERFORMANCE.md) for limits and validation.
