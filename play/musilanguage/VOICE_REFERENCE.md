# Private vocal references

This reference-selection policy is not a singing engine. The separate
[recorded-performance path](RECORDED_PERFORMANCE.md) can play and mix a locally
selected recording; it does not synthesize new singing. The existing six
procedural buses, guide melodies and written lyric cues remain instrumental.
Neither selecting a reference nor requesting vocals changes those buses or
claims they sound like the reference speaker.

## Private setup

Keep the descriptor outside the repository. Load it with the Studio's private
voice descriptor file control. The JSON contract is:

- `format`: `musilanguage-private-voice/v1`
- `label`: a short user-selected profile name
- `reference.kind`: `private-library`
- `reference.libraryFileId` and `reference.backingFileId`: private storage handles
- `consent.subject`: `self`
- `consent.scope`: `private-generated-vocals`
- `consent.externalUpload`: `false`
- `consent.recordedAt`: ISO date of the consent receipt
- `consent.provenance`: private explanation of how authorization was obtained

These fields record user-provided provenance, not independent identity proof.
Invalid descriptors leave the previous selection intact. A valid descriptor
selects its reference as the default; requesting vocals remains a separate opt-in.
The selection is tab-local and applies to subsequent takes until changed.
Selecting No reference suspends the reference policy; Forget clears it and the
vocal request. Reload clears all voice state. An imported session cannot grant
voice consent and resets vocal requests to instrumental.

Private identifiers and provenance remain in a closure, outside recipes, scores,
companion RPC, console messages, storage, URLs and exports. The controller exposes
only a display label and policy flags. MUSIC64/v1 and session/v2 schemas and
replay behavior are unchanged. Exports intentionally omit voice state, so a
session cannot restore a private voice request. The browser is a trusted local
execution boundary, not protection from malicious scripts/extensions.

## Versioned specification and profile

See [VOICE_SPEC.md](VOICE_SPEC.md), [Ryan’s music-only profile](ryan-voice-profile.json),
and [the v1 schema](voice-profile.schema.json). These are public specifications,
not a connected renderer or private audio binding. Validate with
`python voice-profile-test.py` (requires `jsonschema`).

## Musical direction

The requested creative direction is a voice somewhat similar to the user's own,
restrained pitch movement, rhythmic complexity, and intelligible rapid rap or
sung delivery. These are target preferences, not measured acoustic properties,
verified performance abilities or guarantees. No listening assessment or voice
analysis was performed in this integration. No audio or model weights are shipped.

## Remaining integration

1. Privately load the descriptor in the Studio; keep audio and storage handles
   outside Git. The Library handle is metadata only and this app cannot resolve it.
2. Choose a locally runnable singing/conversion renderer and inspect its licensing,
   resource needs and actual conditioning contract. A voice converter needs an
   existing sung/rap stem; it cannot turn the current instrumental guide into
   intelligible lyrics. No renderer is selected here.
3. Add an explicit private audio resolver/attachment and consent check at render
   time. Do not send reference material to a provider without separate permission.
   The current controller deliberately offers no private-reference export API.
4. Implement lyrics/timing and vocal rendering as a separate vocal stem. Apply
   the reference only to explicitly vocal-enabled takes; never replace or relabel
   instrumental buses. Carry the intended pitch/rhythm preferences to that renderer.
5. Validate pronunciation, timing, resemblance and quality by listening with the
   user; test cancellation, reference removal, rendering failures, and privacy.
   Only a successfully rendered singing stem may leave `pending-renderer`.
6. Keep future session serialization privacy-preserving and make any schema
   extension explicit. Review/merge/deploy through the established project flow.

## Verification

From this directory:

```sh
node voice-reference-test.mjs
node music64-test.mjs
node style-test.mjs
python voice-browser-test.py
```

The browser test uses installed Playwright and Chromium, synthetic consent and
reference handles, and an ephemeral loopback server. It exercises the actual
Studio, unchanged score/session, private file import, default selection, opt-out,
import reset, instrumental playback, MIDI/WAV exports, no new requests or web
storage, forget/reload and browser errors. No private recording is needed.
