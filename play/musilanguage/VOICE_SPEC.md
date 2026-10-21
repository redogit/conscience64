# Own-voice rendering specification v1

Singing-renderer status: **specified, not implemented**.
[Recorded-performance playback and mixing](RECORDED_PERFORMANCE.md) is implemented
separately, with local file selection and user-confirmed segments. This specification extends the planning
contract around the existing Studio; it does not add a renderer or change
MUSIC64/v1 or musilanguage-studio-session/v2.

The versioned [Ryan musical profile](ryan-voice-profile.json) follows
[voice-profile.schema.json](voice-profile.schema.json). It is public musical
information, not a voice model, private reference descriptor or proof of identity.
It is documentation/data only: the current runtime does not load this profile.
The existing tab-local policy remains described in [VOICE_REFERENCE.md](VOICE_REFERENCE.md).

## Evidence and targets

`user-preference` identifies creative targets, not measured abilities. Ryan seeks
some resemblance to his own voice, restrained/near-monotonic pitch with complex
rhythms, clear rapid rap and comfortable singing. No range in notes, pitch bounds,
speed ceiling, timbre embedding, likeness score or celebrity target is inferred.

`reported-decoded-audio-measurement` identifies technical recording measurements
supplied by the parent inspection: duration, sample rate, peak, RMS and decoded
sample checks. The initial AAC's stereo channels were reported identical. These
measurements describe a recording, not Ryan's identity, timbre or vocal range.
The near-full-scale check's threshold was not supplied; no clipping/noise or
recording-quality guarantee follows from it. This implementation did not listen
to or independently inspect either recording.

`reported-transcript-verification` identifies the presence of the intended
four-line exercise, with unrelated conversation before it. It does not establish
singing rather than speech, speaker identity, clean boundaries, or resemblance.
Unverified properties remain explicitly listed in each recording entry.

## Private resolution and isolation

Public recording roles are opaque semantic names, never storage locators. Bind
roles to files only in private storage outside Git, public assets, exports, URLs
and logs. A local resolver must check current consent for the intended use and
return only the approved in-memory audio segment to the renderer. The public
profile is not consent and cannot authorize a provider upload or training.

Before using either role, establish speaker identity by user confirmation, inspect
speech boundaries privately, and record approved start/end offsets and isolation
review in the private manifest. Exclude other people and unrelated speech. Never
feed the whole exercise file blindly. If boundaries or speaker attribution are
uncertain, enter `source-isolation-required` and do not render. No such isolation
has yet been validated. The exercise must not automatically replace the selected
initial reference just because its transcript contains the intended text.

## Proposed renderer adapter (not an implemented API)

A local adapter takes a vocal intent (`enabled`, style rap/sung, lyric text,
syllable timing and melody/pitch plan when applicable), the public profile version,
a private consent receipt, isolated reference audio, and the immutable instrumental
score clock. Source audio handles and consent are never copied into that score.
A conversion adapter additionally requires an existing sung/rap source stem.
Seed-VC is researched only, not installed; it is not a lyrics-to-singing engine.
An actual singing synthesizer or an approved performed source is needed upstream.

Adapter output is a separate vocal stem plus a private receipt: renderer/version,
input isolation decision, sample rate, duration, alignment offset, completion and
quality-check outcome. Cancellation or reference revocation invalidates in-flight
results and clears buffered private audio. Failures return a typed reason, never
an instrumental buffer mislabeled as vocals. Do not claim similarity from mere
successful execution. Finite nonempty audio and timing validation precede a user
listening check; only user-accepted output can be marked `own-voice-ready`.

Proposed states (only the first three exist in the current policy):

| State | Meaning / gate |
| --- | --- |
| `instrumental` | Vocals disabled; skip resolver/renderer and preserve all six buses. |
| `reference-required` | Vocal request lacks a selected consented reference. |
| `pending-renderer` | Selected reference exists; no singing adapter is connected. |
| `source-isolation-required` | Adapter available, but speaker/segment validation missing. |
| `rendering` | Current consent, isolated audio and required source inputs validated. |
| `review-required` | Real vocal stem rendered and technically checked; listening pending. |
| `own-voice-ready` | Actual vocal output plus validated source isolation and user acceptance. |
| `failed` / `canceled` | No claim of completed own-voice output; discard invalid results. |

Instrumental requests always take precedence over the default-reference policy.
An imported session/v2 cannot opt a user into vocals or restore consent. Public
profile loading must never mutate MUSIC64 cells, source text, style or listener
receipts. Reference selection stays separate from exportable sessions. Future
vocal exports require an explicit action and must exclude reference audio and
private receipts; MIDI remains instrumental. WAV exports include the selected recorded performance
only when explicitly enabled; they are labeled recorded playback, not new singing.

## Acceptance matrix

| Check | Expected result | Current evidence |
| --- | --- | --- |
| Profile/schema version, evidence labels and privacy | Valid v1, no locators/audio, preferences not measurements | Automated profile test |
| Descriptor consent, default selection, opt-out, forget | Consent required; default only for explicit vocal request | Existing policy and browser tests |
| MUSIC64/session compatibility | Unchanged recipes, scores and session/v2 exports | Existing contract/browser tests |
| No reference disclosure | No reference in exports, network or web storage | Existing browser test with synthetic metadata |
| Mixed-conversation source | Explicit segment plus user review required; reject unconfirmed mix/export | Recorded selector implemented; automatic speaker isolation and singing resolver missing |
| Actual singing | Guide-only output cannot pass as vocal output | Current UI labels honest; adapter missing |
| Converter inputs | Reject lyrics-only conversion; require sung/rap source | Specified; no converter installed |
| Revocation during rendering | Cancel and discard result without leaking audio | Specified; vocal rendering missing |
| Quality/comfort | User accepts words, rapid-rap clarity, pitch comfort and similarity | Not assessed; requires listening to real output |
| Ready gate | Isolation + real stem + technical checks + user acceptance | Unimplemented; profile explicitly not ready |

No third-party training, paid service, provider transmission, merge or deployment
is included. External transmission requires separate explicit approval. Resolve
and isolate private sources, choose/license a renderer, implement the adapter and
its failure tests, then perform private listening acceptance before enabling ready.
