# Musilanguage Studio / MUSIC64 — linguistic music generation

**Current public application:** https://redogit.github.io/conscience64/play/musilanguage/

The current public surface is one **Musilanguage Studio**. Earlier **Carry the Fire**, **Musilanguage Radio**, and **Word Forge / MUSIC64** surfaces remain preserved in repository and Git history; they are predecessors, not deleted work and not separate current Pages applications.

## Use

Enter up to 1,024 UTF-8 bytes, choose one of **64 style profiles across eight broad families**, and press **Forge & play**. Then shape the six procedural instrument buses—guitar, bass, keys/harp, strings, lead, and drums—alongside tempo, meter, mode, tonic, motif treatment, and intensity. The compact MUSIC64 float still carries one of four core ensemble families; the richer profile and instrument mix remain higher-level recipe/rendering state so existing `m64v1:` addresses are not silently reinterpreted. Exact UTF-8 rank sampling is an alternative source. It samples syntactically valid strings, not necessarily meaningful words; it does not enumerate all strings or all float patterns.

**Make my floats stumble** flips 1–6 note/rhythm bits per cell in a private copy. **Hear original → mistake → repair** compares four bars three times. **Repair** restores the anchor bits exactly. **Keep my take** adopts the altered cells as this listener's next anchor, not as objectively better music. **Undo** retains at most 16 prior takes in this tab's memory. The shared songs, source text, UTF-8 transport, selected style profile and research are unchanged.

Optional continuous exploration runs locally while this page is open. It renders each next take, so transitions can contain a gap. Stop invalidates queued playback. Browser/device sleep can suspend playback; no autonomous server session is implied.

## 64 style profiles

`style-profiles.js` adds 64 creative arrangement profiles grouped into:

- Heavy / guitar
- Classical / acoustic
- Jazz / blues / soul
- Rock / punk / indie
- Electronic / dance
- Beat / groove
- Ambient / cinematic
- Folk / unusual pulse

Profiles can change default tempo, meter and motif treatment and then alter the rendered score through deterministic track balance, event density, swing, syncopation, register and a small number of explicit pattern additions. They are creative approximations and **not claims of cultural authenticity** or replacements for the living traditions whose genre names inspired some labels.

### Instrument buses

The current Studio exposes the renderer’s six buses directly:

- **guitar / distorted strings**
- **bass / low voice**
- **keys / harp / plucked voice**
- **strings / sustained ensemble**
- **lead / melodic voice**
- **drums / percussion**

A style profile supplies the starting balance. The listener may mute, foreground, or rebalance any bus. This changes rendering and exported audio, not the source UTF-8 text or MUSIC64 cell identities.

The current profile set is intentionally broad but finite. “All types of music” is treated as an **open generative direction**, not a claim that 64 profiles exhaust every genre, instrument tradition, tuning system, or musical culture.


The `styleProfile` is recipe metadata and is intentionally **not packed into the 52-bit MUSIC64/v1 cell**. This preserves compatibility with existing float addresses. Listener-local note/rhythm mistakes preserve the selected profile. The profile test requires 64 definitions, eight families, and at least 56 distinct early-score signatures; the current set yields 64 distinct tested signatures. Distinct event signatures are software evidence, not a guarantee that every listener will perceive every profile as categorically different.

## Exact MUSIC64/v1 layout

These are ordinary positive binary64 numbers in `[1,2)`, not a new numeric standard. Their fixed sign/exponent prefix is `0x3ff`. The 52 fraction bits are fields, ordered from least significant:

| Field | Bit offsets | Width |
| --- | --- | ---: |
| Six scale-step indices (0–7 each) | 0–17 | 18 |
| Rhythm mask | 18–25 | 8 |
| Tonic (0–11; 12–15 rejected) | 26–29 | 4 |
| Scale | 30–32 | 3 |
| Tempo offset (72–199 BPM) | 33–39 | 7 |
| Meter | 40–41 | 2 |
| Ensemble core family | 42–43 | 2 |
| Motif treatment | 44–45 | 2 |
| Intensity | 46–51 | 6 |

Exact addresses use `m64v1:` plus 16 hexadecimal binary64 bits. A full round-trip decimal is also accepted. Use the complete recipe and versioned renderer for full replay; an address alone is one cell, not source text, a stored recording, or the 64-profile choice. Distinct bit patterns are not guaranteed to sound different. The artistic map is lossy.

Listener edits use XOR masks restricted to bits 0–25. Rhythm-only edits use 18–25; note-only edits use 0–17. Tonic, scale, tempo, meter, core ensemble family, intensity, float exponent, sign and recipe-level style profile cannot change through this layer. Bit restoration is exact; perceived improvement is decided by the listener. Note-event replay is deterministic for the pinned engine; bit-identical PCM across browser implementations is not promised.

## Source and sampling lineage

`utf8-space.js` ports the strict byte-state rank/unrank index from `redogit/Other-Projects-/S1024 Compression Lab/sections1024.py`, revision `0837d5bc11c7f5806fbbc919e9721b1b182e3cb9`. BigInt suffix counts and rejection sampling avoid Number precision loss in ranks. This is a new browser port, not a claim to rerun every Python transport experiment.

`music64.js` retains exact source text, UTF-8 hex, original length, rank and six-byte big-endian zero-padded integer coordinates. At most 32 evenly spaced six-byte blocks become active musical cells. Padding and omitted blocks can create musical collisions; the full source remains in the recipe. Sampled CR/CRLF is retained separately from textarea display normalization until edited. No language normalization or inferred semantics is applied.

`engine.js` is unchanged from Git blob `abcd91234cd5e057d928ed4cd0e1f8004a6783fc`. It supplies synthesized guitar, bass, keys, strings, lead and drums. There is no recorded singer. Lyrics are written performance cues; generated syllables are invented musical sounds, not claims about any culture.

## Locality and Conscience64

There is no listener-profile persistence, microphone, analytics, account or automatic upload. Listener code has no network API. Only an explicit **Find public words & compose** action loads the same-origin Conscience64 frame and sends its separate public query via `stats` and `search.simple`. Result labels seed new local music. Replies require both the expected origin and iframe window. Private words and local mistakes are not sent. Export is explicit and includes the phrase; review before sharing. Imported receipts are not described as live companion results.

The comparison is an evaluator-created musical audition, not evidence that scientific Musilanguage categories, memories or communications have emerged. No research state is promoted by this release.

## Verification

```sh
node play/musilanguage/music64-test.mjs
node play/musilanguage/style-test.mjs
python play/musilanguage/music64-browser.py --live --output /tmp/music64-checks
```

The Node MUSIC64 suite checks all 65,536 two-byte strings, a separate scalar-length recurrence for lengths 0–1,024, rank fixtures, float field roundtrips, scores, and local mutation/repair trials. `style-test.mjs` checks all 64 profiles, all eight families, distinct score signatures, and preservation of style profile through listener-local stumble/repair. Browser checks cover separate listeners, playback controls, receipts, UTF-8 samples, cancellations, transitions, MIDI, full renders, mobile overflow and the live Conscience64 bridge.

## Credits and use

Musical direction: Ryan April. Original compositional rules, words and implementation: AI-assisted creation in this conversation. This release follows the project's free-use intent: use, perform, modify and share these original project materials. No third-party recordings or artist imitation are included. This permission does not relicense third-party text a listener imports or other Conscience64 source records.
