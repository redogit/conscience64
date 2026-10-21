# Local recorded-performance playback

This working path uses native browser Web Audio. It needs no provider, credits,
model weights, training, external compute or additional runtime dependency.
Serve the existing Studio locally and use **Your recorded performance**.
The original selected file is read only; no file is rewritten or uploaded.

1. Choose a local audio file supported by the browser (including M4A where its
   AAC decoder is available). Limit: 32 MiB, mono/stereo, up to 10 minutes decoded.
2. Enter explicit start and end seconds, then Set segment. Nothing defaults to
   the entire file. Segments are limited to 120 seconds.
3. Audition the segment locally. Exclude unrelated conversation and other
   speakers. Confirm the displayed selection is your intended performance and
   authorize local use. This is user-reviewed isolation, not automated diarization.
4. Enable recorded-performance mixing. Choose an offset within the accompaniment
   and a voice level. The segment must fit; otherwise playback/export is rejected.
5. Play or Export WAV uses the mixed buffer. Export selected recording WAV saves
   only the confirmed segment. MIDI contains no recorded voice. These explicit
   audio exports contain private audio and should be kept private.

Changing segment fields clears the committed selection and confirmation. Setting
new boundaries requires confirmation again. Changing the file, forgetting or
reloading clears private audio. Importing a session disables mixing. Reference
profiles, recording samples, segment boundaries and confirmation are absent from
session/v2 and MUSIC64/v1. Audition is allowed before confirmation for boundary
review; mixing and recording export require confirmation. Stop audition or the
main Stop button ends audition. Editing cancels current playback/rendering.

The module resamples only to the accompaniment sample rate using linear
interpolation, sums a separate recorded signal, and peak-limits the final mix
through the existing Studio limiter. It plays the segment once, preserving its
speed and pitch. It never repeats speech to fill a song, changes lyrics, or
relocates syllables onto the generated melody. Segment export uses the decoded
source rate; the original file remains unchanged. Gain changes affect the mix,
not the separately exported segment. Placement is manual; no automatic alignment,
source separation, noise removal, stretching or singing synthesis is implemented.

`recorded-performance.js` exposes the small local buffer operations (load,
select, confirm, enable, placement, segment, mix, clear); `word-forge.js` owns UI,
playback cancellation, limiter and downloads. Stale decodes are ignored after
forget or replacement. Private buffers are not persisted, though garbage
collection timing is controlled by the browser. Do not treat this as secure
memory erasure. No recording is fetched from a public profile or Library handle.

## Verification

```sh
node recorded-performance-test.mjs
python recorded-browser-test.py
```

Node tests exercise exact sample placement, single-pass resampling, no looping,
original-buffer preservation, disabled identity behavior, invalid selections,
confirmation invalidation, fit checks and stale decode cancellation. The browser
test uses a synthetic WAV to verify actual file decode, segment audition,
one-second segment export, playback and mixed WAV export, no new network/storage,
session compatibility, and clear/import behavior. It tests plumbing, not singing
quality or speaker identity. Existing MUSIC64, style and reference tests remain
applicable. Browser tests use preinstalled Playwright/Chromium.

## True singing remains a separate task

No full new-lyrics singer is provided. No generic TTS or guide instrument is
presented as the user's sung voice. The self-hosted singer specification remains
in VOICE_SPEC.md. Conversion requires an existing sung/rap stem; a speech timbre
reference alone cannot supply an entire song's lyrics and melody.

Before requesting any dependency installation, choose a specific local singer or
converter and inspect its pinned source, license, exact checkpoints, sizes and
CPU feasibility. A minimum approval request must name those artifacts and permit
local download/install/run; a converter also needs an approved sung/rap input.
There is currently no approved engine or checkpoint, so no exact sufficient
singer dependency can honestly be named. PyTorch/torchaudio alone are not a singer.
No paid compute, provider transmission or third-party training is required or
included in this recorded-performance path.
