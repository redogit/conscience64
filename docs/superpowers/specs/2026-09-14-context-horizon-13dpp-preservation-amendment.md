# Context Horizon 13D++ Preservation Amendment

Status: user-mandated amendment to the approved Context Horizon design
Date: 2026-09-14
Applies to: `docs/superpowers/specs/2026-09-14-context-horizon-13dpp-design.md`

## Purpose

Context Horizon must not destroy, overwrite, collapse, subordinate, or semantically cheapen **any work already created or attempted as an individual work**. The navigation system is a new relational layer over the body of work, not a replacement for it and not a game-owned taxonomy.

This amendment is binding on planning and implementation.

The protected body of work includes, without limitation: research, mathematics, science, philosophy, ethics, epistemology, praxeology, mereology and related conceptual work, poetry, prose, stories, writing, language and linguistic work, accessibility work, education, software, experiments, games, worldbuilding, images, music, visual work, tools, APIs, archives, recovery work, failed experiments, partial attempts, abandoned branches, historical versions, and unresolved ideas.

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
- `DISCOVERY != RECLASSIFICATION`
- `INDEXING != OWNERSHIP`
- `POETRY != GAME_CONTENT`
- `PHILOSOPHY != GAME_CONTENT`
- `CREATIVE_WORK != DECORATION`
- `FAILED_EXPERIMENT != DISPOSABLE_WORK`
- `UNRESOLVED != UNIMPORTANT`
- `INDIVIDUAL_WORK != GENERIC_CATEGORY`
- `NAVIGATION_GROUPING != SEMANTIC_COLLAPSE`

## Whole-body preservation requirements

1. **Every individually attempted work remains an individual addressable object.** A work may participate in multiple relations and collections without losing its own identity.
2. **Genre/domain remains meaningful.** Poetry stays poetry; philosophy stays philosophy; mathematics stays mathematics; science stays science; language work stays language work; accessibility stays accessibility; education stays education; games stay games; software stays software; and cross-domain work keeps its explicit cross-domain provenance.
3. **Research projects remain peer domains** with their own provenance, terminology, evidence standards, history, negative results, interpretation corrections, and unresolved remainder.
4. **Creative works retain authorship and context.** Poetry, prose, stories, music, visual works, worldbuilding, and other expression are not downgraded to decorative game assets merely because the game can reference or present them.
5. **Game pages may reference, visualize, teach, stage, or invite exploration of other work**, but they may not redefine, own, contain semantically, or subsume that work.
6. **Crossings are typed relations.** Context Horizon connections use relations such as `references`, `visualizes`, `inspired-by`, `teaches-about`, `derived-from`, `tests`, `contrasts-with`, `depends-on`, `predecessor-of`, `successor-of`, or `related-to`. They must not silently become `is`, `proves`, `owns`, `contains`, or `replaces`.
7. **Existing pages, artifacts, research records, creative works, history paths, tests, prior game surfaces, release records, source files, experiments, and partial attempts remain addressable** unless a separate explicit deprecation decision is reviewed and recorded.
8. **Superseded routes retain lineage.** A new route may become primary without erasing its predecessor. Historical aliases remain resolvable where practical.
9. **Changes are additive and reversible where practical.** When replacement is unavoidable, predecessor state remains recoverable through version control and/or history/restore.
10. **Navigation ranking may not use game popularity, visual prominence, engagement, fun, click frequency, entertainment value, or presentation intensity to raise or lower the epistemic status, evidentiary status, authority, confidence, artistic value, philosophical importance, or historical importance of another work.**
11. **Navigation relevance is task-local.** A work may rank highly because it is useful for the current question; that ranking does not imply that the work is globally more important.
12. **Domain-specific metadata must not be collapsed into generic game metadata.** Research keeps evidence/provenance fields; poetry/creative work keeps authorship/form/context fields; philosophy keeps conceptual/argument lineage; software keeps implementation/version/test lineage; experiments keep methods/results/negative-results lineage.
13. **Failures and attempts are preserved.** Negative results, failed experiments, wrong interpretations, abandoned designs, and unresolved attempts remain part of the historical body of work rather than being silently removed by cleanup.
14. **No “miscellaneous everything” bucket may become the terminal classification.** Unknown or not-yet-classified works remain individually discoverable with `classification: unresolved` until reviewed.
15. **The canonical navigator lives above domains.** Context Horizon is site/repository-level infrastructure. The MMO, research, poetry, philosophy, tools, and other bodies of work are participants in the graph; none is the owner of the others.

## Initial protected named works and families

The following are explicit examples of works/families that must remain individually identifiable. This list is **non-exhaustive** and must not be treated as the full inventory:

- Cross-Carrier Wave
- Orbit Library
- Tiny Babel / TBCL
- Operator Moonshot
- Hodge Conjecture research
- P vs NP research
- Model Experiments
- Geometry / 4D / Codecs
- Historical Recovery
- Human–Knowledge Working-Set Lab
- Conscience64
- Orbit Shelf
- Word Weave
- Pattern Garden
- Small Steps
- Source Compare
- Computational Chorus / Musilanguage work
- Dream to Action
- MauiBrickBreak
- FirstNeuralNetwork
- Orbit Engine
- REDOGIT / redogit
- Other Projects
- ChatGPT and Conscience
- Human Expression Archive
- Python symmetry experiments
- finite-table checks
- Conscience64 API patches
- local sandbox builder
- 1,024-byte section carriers
- bounded learning-compression tools
- poetry and individual poems
- philosophy and individual philosophical lines/arguments
- stories, prose, songs, sayings, language experiments, and creative expression
- accessibility and educational experiments
- game worlds and game experiments, including Red Wilds, Explorer World, MMO World, Fuzzball, and related playable surfaces

Named-family membership does not merge members. Individual poems, experiments, files, versions, and attempts remain individually addressable when source material permits.

## Preservation inventory requirement

Before Context Horizon becomes authoritative as a navigation layer, implementation must build and verify a **non-destructive preservation inventory** from the existing repository, history surfaces, admitted project registries, and other explicitly available source indexes.

The inventory must record at minimum:

- stable or recoverable identifier;
- canonical current name when known;
- historical aliases when known;
- work/domain type;
- source location(s);
- authorship/provenance when known;
- predecessor/successor relationships;
- current/historical/unresolved status;
- whether it is directly web-addressable;
- whether it is private, public, or unresolved for publication;
- evidence/claim role where relevant;
- preservation status.

Unknown fields remain `unknown` or `unresolved`; they are never guessed merely to complete the index.

## Testing requirements

Tests must verify that:

1. adding or removing game-related signals does not alter research authority/evidence metadata;
2. adding or removing game-related signals does not alter the intrinsic domain/type of poetry, philosophy, software, research, or other works;
3. every admitted pre-existing work remains reachable by stable ID, canonical name, historical alias, or preserved unresolved record;
4. a successor cannot erase its predecessor from lineage;
5. an unresolved work cannot be silently discarded because it lacks a current web page;
6. rank/presentation changes do not mutate provenance, authorship, evidence status, domain identity, or history;
7. inventory construction is additive and does not rewrite source records.

## Planning consequence

Every implementation task touching routes, registries, ranking, UI, indexing, migration, or cleanup must include a preservation check. No task is complete if it makes prior work unreachable, silently rewrites lineage, collapses an individual work into a generic category, changes the epistemic status of research because of game context, or changes the identity/value of creative or philosophical work because of presentation context.
