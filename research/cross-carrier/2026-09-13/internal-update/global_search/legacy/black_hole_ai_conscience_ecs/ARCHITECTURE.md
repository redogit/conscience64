# Architecture

## Initial load

`index.html` loads only `src/app.js`, which statically imports the small ECS, conscience, loader, and LLM controller modules.

The **renderer implementation is not imported until capability routing runs**. WebGPU is attempted first, followed by WebGL2 and Canvas2D.

The in-game AI is named **Conscience**. Its optional **WebLLM runtime is not imported at startup at all**. `llm-worker.js` imports it from the CDN only after a human explicitly presses the enable button.

## ECS systems

Current order:

1. Input
2. Gravity
3. Movement / safe recovery
4. Orbit
5. UI/proximity is derived outside the ECS update

World facts stay in components/resources; render state is derived.

## Conscience

The conscience layer is deliberately not an LLM prompt. It is normal JavaScript code with explicit hard blocks and weighted factors in `world.json`.

Hard blocks dominate the soft score. Irreversible/consequential actions escalate to the human. This keeps the policy inspectable and testable.

## Accessibility / game design

The canvas is supplementary. Nearby-object distance, probe coordinates, energy, evidence, decisions, rationale, and controls all have non-canvas equivalents.
