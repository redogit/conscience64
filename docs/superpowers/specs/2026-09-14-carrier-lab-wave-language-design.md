# Carrier Lab, Tiny Language, and Wave Route — Game Design

**Date:** 2026-09-14
**Status:** approved direction, implementation pending

## Purpose

Build one coherent game subsystem that turns the existing language and cross-carrier research ideas into play without turning the game into a research dashboard.

The player should be able to move a message, pattern, instruction, or object-description through several representations, see what each transformation preserves or changes, and use a deliberately tiny game language to solve puzzles, build machines, communicate with game entities, and create routes across carriers.

The game never needs to pretend it knows more than it does.

## Narrative invariant

The emotional center is simple:

> After a very long quiet, something finally happens: we meet, we care, and something changes for the better.

This is story, not scientific claim.

The game does not end in conquest, universal certainty, or ownership of the unknown. Its long-horizon closing idea is recognition and care: “Honored to meet you.”

## World boundary

Earth remains grounded.

On Earth, carrier play appears through ordinary things such as:

- radios;
- signs;
- maps;
- music;
- computers;
- workshop tools;
- code panels;
- observatory instruments;
- printed symbols;
- spoken instructions;
- accessible alternate representations.

Impossible carrier behavior, impossible geometry, anomalous physics, or overtly fictional wave phenomena occur only:

1. after the player deliberately leaves Earth;
2. inside a clearly labeled fictional simulation; or
3. inside a clearly labeled game abstraction that is not presented as physical reality.

`EARTH_BASELINE != FICTIONAL_OFFWORLD_RULES`

## Epistemic boundary

The player can encounter:

- observations;
- experiments;
- bounded results;
- hypotheses;
- open questions;
- analogies;
- fiction.

These are not interchangeable.

Hard rules:

```text
INTERESTING != TRUE
TESTED_HERE != UNIVERSAL
UNKNOWN != FALSE
UNRESOLVED != WRONG
GAME_RECONSTRUCTION != OBSERVATION
RETRIEVED_CONTEXT != INDEPENDENT_EVIDENCE
```

The subsystem must never silently upgrade one category into another.

## Core game model

The game-facing transform is:

```text
T(X) = (X', delta, loss, unresolved)
```

where:

- `X` is the current game payload;
- `X'` is the transformed payload;
- `delta` records consequential changes;
- `loss` records known information that can no longer be reconstructed;
- `unresolved` records distinctions the game cannot currently classify as preserved or lost.

A transform is successful when it preserves the current task obligation, not when every carrier becomes identical.

## Carrier Lab

Carrier Lab is the reusable game engine for representation-changing puzzles.

### Payload

A payload is a bounded game object with:

```text
id
subject
obligation
content
provenance
carrier
history[]
```

The `subject` and `obligation` are preserved separately from the carrier.

### Carrier

Initial carrier types:

- plain text;
- symbol sequence;
- color/shape sequence;
- tone/rhythm sequence;
- compact token sequence;
- coordinate sequence;
- game-object state.

These are game carriers only. None is declared a universal semantic representation.

### Transform record

Every carrier hop appends a record:

```text
from
to
preserved[]
changed[]
lost[]
unresolved[]
reversible
```

No transform may discard consequential information silently.

## Tiny Language

The Tiny Language is intentionally small, deterministic, and game-scoped.

It is used for:

- doors;
- machines;
- puzzles;
- maps;
- creature signals;
- player-built devices;
- route descriptions;
- transformations between representations.

### Initial semantic forms

The first implementation should support only:

```text
LIT(value)
SEQ(a, b, ...)
IF(test, then, else)
EQ(a, b)
GET(name)
SET(name, value)
SEND(channel, value)
```

These forms are sufficient for bounded game puzzles without claiming a general language theory.

### Equality

Equality is strict and type-sensitive.

```text
"1" != 1
true != 1
symbol(A) != text("A")
```

### Unknown

Evaluation may produce an explicit `unknown` value.

Unknown is not treated as false.

`IF(unknown, A, B)` must not silently select `B`.

The first implementation should return an unresolved evaluation result instead.

## Wave Route

A Wave Route is a playable ordered chain of carrier transforms.

```text
payload
  -> text
  -> symbols
  -> tones
  -> coordinates
  -> object state
```

The term “wave” is game architecture language. It does not assert a physical wave mechanism.

A Wave Route stores:

```text
route_id
payload_id
steps[]
current_step
obligation_status
reconstruction_status
```

The player can:

- advance one transform at a time;
- inspect what changed;
- try to reconstruct an earlier state;
- branch at a carrier choice;
- compare two routes;
- finish a task even when some nonessential distinctions remain unresolved.

## Game loop

The basic Carrier Lab loop is:

```text
Receive task
-> inspect payload and obligation
-> choose next carrier
-> transform
-> inspect preserved / changed / lost / unresolved
-> test reconstruction or continue
-> satisfy obligation
-> record what actually happened
```

The player is rewarded for:

- preserving the task obligation;
- noticing loss;
- correctly leaving uncertainty unresolved;
- finding a shorter faithful route;
- discovering multiple valid representations;
- reconstructing prior state when possible.

The player is not rewarded for pretending certainty.

## Example puzzle

A workshop door needs the instruction:

```text
OPEN RED DOOR AFTER TWO TONES
```

The player receives it as text, converts it to symbols, then to tones, then to a machine instruction.

If a transform drops the word `RED`, the game records a consequential loss because two doors exist.

If only one door exists in the local bounded puzzle, the route may still satisfy the current obligation while recording that color information was lost.

This distinction is the gameplay.

## Accessibility

Every core puzzle must have at least two usable representations where practical.

Examples:

- tone sequence also has visible timing marks;
- color information also has shape/text labels;
- symbol-only instructions have readable text alternatives;
- timed sequence has an untimed route;
- drag interactions have button/keyboard alternatives.

Accessibility carriers are first-class game carriers, not secondary annotations.

## Child-safety and non-interference

This subsystem is local-first and single-player in the first implementation.

It must not introduce:

- player targeting;
- griefing;
- non-consensual damage;
- gambling-like purchases;
- paid random rewards;
- age profiling;
- camera/microphone-based supervision detection;
- adult content on child-facing surfaces.

Future multiplayer must pass separate consent, privacy, moderation, security, and non-interference gates.

## Save compatibility

Existing MMO saves remain valid.

The Carrier Lab state is additive and optional.

Old saves that lack Carrier Lab data initialize with an empty Carrier Lab state.

No existing XP, joy, discovery, token, role, or level field is reinterpreted.

## Implementation shape

Create focused files rather than expanding the existing `game.js` indefinitely:

- `play/mmo/carrier-core.mjs` — payload, transform, loss/remainder accounting, reconstruction helpers;
- `play/mmo/tiny-language.mjs` — deterministic evaluator with explicit unknown;
- `play/mmo/carrier-lab.mjs` — puzzle definitions and Wave Route game state;
- `play/mmo/carrier-lab.test.mjs` — direct Node tests;
- `play/mmo/carrier-language.test.mjs` — evaluator tests;
- `play/mmo/game.js` — only integration hooks and UI entry point;
- `play/mmo/index.html` — one Carrier Lab game card/panel;
- `play/test.mjs` — registration/integration assertions only.

No new dependency is required.

## First playable slice

The first completed slice contains:

1. one Carrier Lab puzzle;
2. at least four carrier types;
3. explicit preserved/changed/lost/unresolved display;
4. one reversible transform;
5. one lossy transform;
6. one `unknown` evaluation path;
7. one Tiny Language instruction controlling a game object;
8. one successful reconstruction path;
9. one route where obligation succeeds despite nonessential loss;
10. one route that fails because consequential information was lost.

## Tests

The implementation is not complete until tests establish at least:

- deterministic transform output;
- transform history is append-only;
- lost information is never labeled preserved;
- unresolved information is not coerced to false;
- strict typed equality;
- route reconstruction succeeds when declared reversible;
- route reconstruction fails visibly when required information is lost;
- current task obligation can survive a nonessential loss;
- consequential loss prevents task completion;
- old save without Carrier Lab state still loads;
- Carrier Lab state does not mutate existing MMO progression fields;
- Earth-facing puzzle content contains no impossible-world claim;
- research/game evidence labels remain distinct.

## Non-goals for this slice

Not included yet:

- arbitrary user code execution;
- networked Carrier Lab;
- server-authoritative multiplayer;
- natural-language understanding;
- universal translation;
- universal semantic compression;
- proof of a physical cross-carrier wave;
- claims about human cognition;
- age inference;
- procedural generation of unbounded language grammars.

## Success condition

The slice is successful if a player can learn by play that:

1. the same task can survive several representations;
2. representation changes can preserve some things and lose others;
3. unknown is allowed to remain unknown;
4. careful reconstruction matters;
5. different carriers can cooperate without becoming identical;
6. none of that requires pretending the game has discovered a universal truth.

And underneath the mechanics, the world keeps the simpler story:

> We found each other, we cared, and something became a little better.
