# Musilanguage Radio — Keep the Fire Moving

Version 2.0.0. A creative music branch of Conscience64, not a scientific validation of historical Musilanguage.

## Play

Open `radio.html` (the directory's `index.html` redirects there) and press **Play radio**. Browser audio begins only after a user gesture. Keep the page open to continue. Closing the page, sleeping the device, or browser restrictions can stop playback; there is no server-side autonomous session.

The original **Carry the Fire** single and six-part mixer remain byte-for-byte preserved in `single.html`. The original README documents that first release; this document covers the radio addition.

## The four-track set

| Track | Length, approximately | Character |
| --- | --- | --- |
| Carry the Fire | 2:01 | Original D-harmonic-minor metal/classical/funk suite; 7/8 breakdown |
| Cathedral of Sparks | 1:55 | E-minor baroque keys, symphonic metal, seven-eighth-note procession |
| Gravity Wears Dancing Shoes | 2:33 | D-Dorian-inspired funk, offbeat keys, chunky guitars, 5/4 detour |
| No Small Thunder | 2:14 | C-minor string invocation, metal anthem, half-time breakdown |

About 8 minutes 43 seconds per set before transition overlap. These are original instrumental synthesizer performances with guide melodies and synchronized written lyrics, not recorded singers. Each score has seven movements and six instrument parts. Musical mode labels describe the starting palette, not a claim that every passing tone belongs to that scale.

**Album radio** cycles through all four tracks. **Mutation radio** produces repeatable seeded variations of the three new compositions, changing transposition, motif rotation and selected drum fills. The original single stays unchanged. Seeds need not produce globally unique music. **One track** stops at the end. One stereo track is prepared ahead, with a short crossfade between tracks. Pause freezes the audio clock and queued transition; Stop cancels both current and queued sources. Master volume is live. Mix presets apply to upcoming arrangements and WAV export, not the already-rendered current track.

WAV exports stereo PCM using the current export mix. MIDI exports separate instrumental tracks, tempo, time signatures, section markers and lyric cues. The lyric text is in `engine.js` and displayed in the player; `LYRICS.md` provides the collected text.

## Real Conscience64 connection

Press **Connect & use inspiration**. The client loads the companion's public root page in an iframe and calls its documented `stats` and `search.simple` methods through the `conscience64.api` postMessage interface. When hosted under Conscience64, it uses the same site root. The standalone offline player uses the public Conscience64 URL for this optional connection.

Up to eight returned public object identities and labels feed a non-cryptographic 32-bit variation seed. The local music engine—not a remote music model—then arranges upcoming variations. This is an explicit artistic mapping, not semantic understanding, model agreement, research proof, or an independently learned musical interpretation. Changing an inspiration query only changes the seed when the selected source material changes. Source text is never executed or inserted as HTML.

The interface reports whether a real reply arrived. A downloadable source receipt records the query, endpoint, methods, selected objects, retrieval time, seed and mapping. Failure or no results retain local playback; they do not produce a fabricated companion answer. No credentials, microphone, private history or paid generation service is used. The existing Conscience64 corpus and API remain unchanged.

The client validates **both** reply origin and source window, uses an exact target origin, bounds response selection and request timeouts, and rejects unsolicited IDs. This does not turn the preexisting public Conscience64 bridge into an authenticated channel for private data.

An expandable companion panel keeps Conscience64 available in the page while the station plays.

## Cost and boundaries

No runtime dependencies, soundfonts, third-party samples or server music calls. Scores and synthesis run in the browser. The retained track cache is bounded to two entries; render/export scratch buffers require additional transient memory. CPU/memory use depends on the browser and device. This is not a constant-memory claim for all browser internals or a guarantee of uninterrupted playback on sleeping devices.

## Verification

`radio-test.py` uses Chromium through Playwright. In a complete checkout:

```sh
python play/musilanguage/radio-test.py
```

The default test uses the actual repository's public data and API. It checks scores, seed repeatability and variation, real source-end transitions, pause/resume, stop, one-track termination, Conscience64 stats/search, source receipt, reply-origin/source rejection, MIDI downloads, keyboard focus, narrow layout, cache limits and browser errors. A deployment step runs it before advancing the Pages branch.

`--fixture` is a legacy name for **inline local-player-only checks** when navigation is blocked. It does not simulate Conscience64 and explicitly records the API check as NOT_TESTED. `--render-dir DIR` additionally renders all four full tracks and checks finite stereo samples, nonzero output and no PCM clipping. Browser tests and signal checks are not a subjective listening review or cross-browser certification.

## Credits and free use

Concept, musical direction and the request to share: Ryan April. Composition, lyrics, arrangement, synthesis and code: AI-assisted creation in this conversation. The original single is retained with its prior credit and free-use notes. The new chant syllables are invented musical sounds, not represented as a living or reconstructed historical language.

For the newly created original material in this radio release, permission is granted to use, copy, perform, modify, distribute and share the music, lyrics and code, including commercially, to the extent applicable rights can be granted. Attribution is appreciated but not required. This grant does not claim ownership over third-party Conscience64 source materials or alter their rights. Provided without warranty. No third-party recorded music or artist imitation is included.
