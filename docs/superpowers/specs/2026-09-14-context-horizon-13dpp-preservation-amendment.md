# Context Horizon 13D++ Preservation Amendment

Status: user-mandated amendment to the approved Context Horizon design
Date: 2026-09-14
Applies to: `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md`

## Purpose

Context Horizon must not destroy, overwrite, collapse, or semantically cheapen work that already exists in Conscience64. The navigation system is a new relational layer over existing work, not a replacement for it.

This amendment is binding on planning and implementation.

## Hard preservation invariants

- `NEW_NAVIGATION != DELETION_OF_EXISTING_WORK`
- `SUCCESSOR != REWRITTEN_PREDECESSOR`
- `REFACTOR != LOSS_OF_CAPABILITY`
- `GAME_INTEGRATION != RESEARCH_RECLASSIFICATION`
- `ROUTE_REBUILD != CONTENT_REPLACEMENT`
- `PLAYFULNESS != RESEARCH_VALUE`
- `GAME_ROUTE != RESEARCH_AUTHORITY`
- `VISUAL_PROMINENCE != RESEARCH_IMPORTANCE`
- `ENGAGEMENT != EVIDENCE`
- `POPULARITY != CONFIDENCE`
- `RELATION != MERGE`

## Preservation requirements

1. Existing research projects remain peer domains with their own provenance, terminology, evidence standards, history, and direct navigation.
2. Game pages may reference, visualize, teach, or invite exploration of research, but they may not redefine or subsume the research project.
3. Context Horizon crossings between game and research must be labeled as relations such as `references`, `visualizes`, `inspired-by`, `teaches-about`, or `related-to`; they must not silently become `contains`, `proves`, `owns`, or `is` relations.
4. Existing pages, artifacts, research records, history paths, tests, prior game surfaces, and release records remain addressable unless a separate explicit deprecation decision is reviewed and recorded.
5. Superseded routes retain predecessor/successor lineage. A new route may become primary without erasing the old route.
6. Where practical, changes are additive and reversible. When replacement is unavoidable, the predecessor state must remain recoverable through version control and/or the existing history/restore surface.
7. Navigation ranking may not use game popularity, visual prominence, engagement, fun, click frequency, or entertainment value to raise or lower a research project's epistemic status, evidence status, authority, confidence, or scientific importance.
8. Context Horizon may rank a research route as useful for a stated navigation purpose, but the explanation must distinguish `navigation relevance` from `research importance`.
9. Research-specific metadata must not be collapsed into generic game metadata. Research routes retain independent provenance and evidence-role fields.
10. Tests must verify that adding or removing game-related signals does not alter research authority/evidence metadata and does not make a research project unreachable.

## Planning consequence

Every implementation task touching routes, registries, ranking, or UI must include a preservation check. No task is complete if it makes prior work unreachable, silently rewrites lineage, or changes the epistemic status of research because of game context.
