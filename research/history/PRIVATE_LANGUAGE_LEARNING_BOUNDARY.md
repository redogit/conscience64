# Private Language-Learning Boundary

**Status:** ACTIVE LOCAL PRIVACY RULE  
**Scope:** historical/private material supplied or discussed for learning the user's problem-solving language and methods  
**Storage rule:** the private historical material itself is not copied into this repository by this boundary

## Purpose

Private historical material may help recover **how a problem was framed and worked**, without turning the private story, people, handles, relationships, or events into project data.

Allowed learning is limited to abstract method such as:

- how a problem was described;
- what distinctions were noticed;
- what the user was trying to protect;
- how search or comparison was approached;
- how an idea was tested, repaired, rejected, or continued;
- reusable language structure or problem-solving sequence that can be expressed without private facts.

## Hard boundaries

```text
PRIVATE_HISTORY != PUBLIC_EVIDENCE
PRIVATE_HISTORY != PROJECT_ARTIFACT
LANGUAGE_PATTERN != PERSONAL_PROFILE
LEARNED_METHOD != DISCLOSURE
DERIVED_FROM_PRIVATE_HISTORY != SAFE_TO_PUBLISH
```

When private historical material is in scope:

- do not quote it into project or public artifacts;
- do not publish it or a narrative reconstruction of it;
- do not carry names, handles, links, relationships, or private events into project outputs;
- do not correlate identities from it;
- do not profile people from tone, language, history, or associations;
- do not promote the private history as project evidence;
- do not treat emotional state in a historical event as a stable identity;
- do not infer current relationships or current beliefs from historical material;
- do not use a rewritten or sanitized summary as a way to bypass this boundary.

## Method-learning rule

The usable output is an abstract method only:

```text
PRIVATE LANGUAGE / HISTORY
        ↓
extract problem-solving structure
        ↓
remove private facts and identity-bearing detail
        ↓
retain only abstract method internally
        ↓
re-ground future project work in current authorized inputs
```

Learning from the method does not authorize disclosure of its private source.

If a candidate public/project artifact is directly derived from private history, mark the admission:

```json
{"derived_from_private_history": true}
```

and the public-update builder must fail closed.

A later artifact may use a generally learned method only when its actual claims, examples, evidence, and provenance are independently grounded in current authorized project/public sources. The private history remains neither cited nor promoted.

## Outward carrier rule

After method extraction, every outward carrier must preserve the same authority boundary.

```text
ECS / CLIENT
  -> abstract method + non-identifying privacy-origin marker only

AGENT / TOOL HANDOFF
  -> same bounded projection; no source pointer or private story

EXPORT / SYNC / PUBLICATION
  -> fail closed while the private-origin marker remains pre-regrounding
```

The shared executable contract is `tools/private-origin-boundary.mjs`. ECS uses its `ecs-client` projection directly. Agent/tool handoffs use the sibling `agent-tool-handoff` projection. Export/sync guards recurse through wrappers so relabeling or nesting a marked carrier does not make it exportable.

A later public/project artifact must be independently re-grounded through a separate current-evidence admission path. The private-origin carrier itself is never promoted by toggling its marker.

## Recovery rule

Recovery may preserve that a private boundary exists, but not the protected narrative behind it.

```text
BOUNDARY MAY BE REMEMBERED
PRIVATE STORY MUST NOT BE EXPORTED
METHOD MAY INFORM INTERNAL REASONING
PROJECT CLAIMS REQUIRE PROJECT EVIDENCE
```
