# Black Hole AI: Conscience — Data-Driven Browser ECS

A local-first, accessible JavaScript game/research prototype.

## What it is

- **Data-driven ECS:** world content and governance thresholds live in `data/world.json`.
- **Float64 coordinate state:** world positions are `[x,y,z,t]` Float64 components.
- **Date-driven presentation:** the UTC date deterministically offsets orbit phase; it does not change evidence or conscience rules.
- **Human-centered game loop:** scan → choose what enters context → ask for proposal → inspect the Human Boundary Gate → human accepts/rejects.
- **Black-hole metaphor:** evidence fragments orbit a context core. Crossing the event horizon triggers a safe reset; evidence is not destroyed.
- **Human Boundary Gate:** rule-based governance over benefit, agency, privacy, evidence, reversibility, cost, uncertainty, and hard stops.
- **No consciousness claim:** the gate is a transparent decision contract, not a moral person or sentient mind.

## Progressive fallback

1. Core HTML + ECS + accessible text UI.
2. Lazy renderer: **WebGPU → WebGL2 → Canvas 2D**.
3. Proposal engine: deterministic local fallback immediately.
4. Optional WebLLM: only imported and its model only downloaded after the human presses **Enable optional local WebLLM**.
5. WebLLM runs in a module worker to keep model work off the UI thread.

## Run

Requires a modern browser and localhost/HTTPS for the newest APIs.

```bash
npm test
npm run serve
```

Then open:

```text
http://127.0.0.1:8080
```

No npm packages are required for the core app.

## Human-centered design decisions

- no hidden model/network load;
- no destructive fail state;
- pause and safe reset;
- visual and text state;
- keyboard + pointer controls;
- reduced-motion handling;
- forced-colors-compatible borders;
- no color-only conscience verdict;
- scanned evidence is separate from admitted context;
- proposals are separate from evidence;
- proposal generation is separate from governance;
- governance is separate from human authorization;
- accepted actions are game-world decisions only;
- local JSON ledger export for inspectability.

## LLM boundary

The optional LLM is a **proposal carrier**. It cannot directly mutate the ECS or authorize an action. Its output is normalized and independently reviewed by the Human Boundary Gate.

```text
human question
→ admitted evidence
→ proposer
→ structured proposal
→ conscience review
→ visible decision
→ human accept/reject
→ game-world event
```

## Important limitation

The simulation is not a scientifically faithful black-hole model and does not claim to implement physical general relativity. The black hole is a game mechanic and information/context metaphor.
