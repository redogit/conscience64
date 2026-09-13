# Carry the Fire — Musilanguage Music

An original metal × classical × funk-inspired composition and a self-contained browser instrument.

[Open the music player](https://redogit.github.io/conscience64/play/musilanguage/)

Press **Play track**. Audio does not autoplay. Start at low volume.

## What is in the first release?

A 72-bar, approximately 2:01 synth arrangement at 144 BPM, centered on D minor with harmonic-minor and chromatic colors. Six parts: distorted low-register guitar, syncopated bass, harpsichord, string pads, lead/guide melody and drums. Seven movements, including an eight-bar 7/8 breakdown grouped 2+2+3.

**This recording is instrumental.** The lyrics are synchronized on screen and embedded in the MIDI. The synth lead is a melodic guide, not a sung rendition of the words. The guitar, harpsichord, strings and percussion are procedural synth voices, not recordings of physical instruments.

| Time | Movement | Arrangement |
| --- | --- | --- |
| 0:00 | I. Spark | Baroque-inspired prelude |
| 0:13 | II. The question | Syncopated verse |
| 0:40 | III. Carry the fire | Metal / strings chorus |
| 0:53 | IV. Mirror fugue | Imitative counterpoint |
| 1:06 | V. Seven steps | 7/8 breakdown |
| 1:18 | VI. Open hands | Extended final chorus |
| 1:45 | VII. Ember | Return and resolution |

## Controls and exports

Play, pause, stop, seek, and jump directly to a movement. Six independent level sliders and four mix presets work during playback. These presets remix the same score rather than creating four different songs.

**Export WAV** renders the current instrument mix locally to stereo 44.1 kHz, 16-bit PCM. Procedural stems are synthesized at 22.05 kHz and resampled by Web Audio for output; a 44.1 kHz export is not a claim of additional original high-frequency detail. The playback volume control affects listening, not the exported master level.

**Export MIDI** writes a format-1, seven-track file: six instrumental tracks plus a conductor track containing tempo, time signatures, movement markers and 36 lyric cues. Instrument sounds and some expressive details will differ in a MIDI player or DAW. Import it into a DAW to replace synth voices, record guitars or vocals, and develop the arrangement.

The complete runtime is `index.html`. It has no package manager, build step, external musical samples, remote scripts, microphone access, account, or API key. Save the HTML and open it in a modern browser; restrictive local-file policies may require serving it from a local web server. GitHub Pages itself is a hosting provider with its own request logging; the music app does not add analytics.

The page uses native controls, explicit labels, visible keyboard focus, a skip link, readable full lyrics, and reduced-motion support. It was smoke-tested in Chromium, including a 390-pixel viewport. This is not a complete accessibility certification or a claim of testing every browser or assistive technology.

## Lyrics

### I. Spark

Before the word, a rhythm.  
Before the rhythm, a reply.  
One hand against the silence.  
One spark against the sky.

### II. The question

I heard a question knocking in the floor,  
Four feet of thunder looking for a door.  
A silver thread ran through a wall of sound;  
I dropped the crown and kept the pulse I found.

Not every scar belongs beneath a light;  
Not every silence asks us to ignite.  
We learn the weight by changing what we hold;  
We leave a place for stories still untold.

### III. Carry the fire

Carry the fire—do not carry the throne.  
No spark is small when it lights the way home.  
Bend with the rhythm; let broken things mend.  
What we can spare is where others begin.

### IV. Mirror fugue — instrumental / spoken interlude option

The strings ask. The keys answer.  
The bass turns the question around.  
Different voices; room for the difference.  
A meeting—not a march—in the sound.

### V. Seven steps

DA-ka / DIM-da / TA-ra-DUM!  
One for the question; one for the ground.  
DA-ka / DIM-da / TA-ra-DUM!  
Leave room for the voice that has not made a sound.

### VI. Open hands

Carry the fire—do not carry the throne.  
No spark is small when it lights the way home.  
Bend with the rhythm; let broken things mend.  
What we can spare is where others begin.

Hold up the small; let the mighty make room.  
Turn down the fear; let the low strings bloom.  
Keep what can teach us. Change what can break.  
Carry the fire for another dawn’s sake.

### VII. Ember

No final word. No finished sky.  
A hand held open. A new reply.  
Do what we must. Give what we can.  
The smallest thunder: begin again.

### Vocal arrangement

Verses: rhythmic spoken-growl. Choruses: clean and sustained. Breakdown: a seven-syllable group chant, 2+2+3. The guide melody is a starting point for a vocalist, not syllable-aligned vocal synthesis.

## Artistic scope and attribution

Concept and musical direction: Ryan April. Composition, lyrics, sound synthesis and implementation: AI-assisted creation in this conversation.

The four-note idea is passed among instruments and transformed through rhythm and counterpoint. This is an artistic use of the project's ideas about distinctions, relations and carrying something forward. It does **not** establish any scientific claim about the canonical organism, communication necessity, language evolution, or the observer experiments. No research records or canonical mechanisms were modified.

The chant syllables are invented musical sounds, not a reconstruction of a historical language. No existing artist's voice, recording or composition was used as a template.

## Free use

The newly generated code, score, lyrics and procedural audio in this music release may be used, copied, performed, modified, redistributed and incorporated into other work, including commercial work, without an attribution requirement. Attribution and sharing improvements are welcome. This permission concerns this newly generated music release only; it does not relicense other repository content or third-party material. No warranty is provided, and no claim is made that AI-generated material carries exclusive copyright protection.

## Verification scope

Local Chromium checks passed for finite scheduled notes, seven movements, six parts, start/pause/resume/stop, seek, preset changes, keyboard focus, MIDI export, stereo WAV rendering and mobile layout without horizontal overflow. Rendered PCM had nonzero output, no nonfinite samples, and no clipped samples under the default mix. A separate MIDI parser confirmed seven tracks and the 4/4 → 7/8 → 4/4 changes. Browser execution was tested with the exact HTML loaded into an in-memory document because the managed test browser blocked local-file and localhost navigation. Live hosting must be checked independently.

Implementation note: mixing thousands of simultaneous scheduled graph nodes made the initial offline render exceed the local time budget. The release instead precomputes six reusable stems and plays those through six level controls; the tested full render then completed. This is an implementation repair, not a universal complexity result.
