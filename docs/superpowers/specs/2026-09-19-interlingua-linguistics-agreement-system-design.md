# Interlingua Linguistics Agreement System — Successor Design

**Date:** 2026-09-19  
**Status:** CORRECTED USER-NAMED SUCCESSOR / DESIGN ONLY / NOT YET IMPLEMENTED  
**Canonical design home:** `redogit/conscience64`  
**Predecessor:** `docs/superpowers/specs/2026-09-19-usday-interlinuia-democracy-design.md`

## 0. Correction and lineage

The merged predecessor intentionally remains unchanged.

Its working phrase was:

> **Shared Operational Interleaved Interlinuia**

After merge, the user supplied the forward correction in PR #153:

> **“Spelling Interlingistic agreement system but that is next.. :D”**

The user then corrected the intended terminology again in conversation to:

> **Interlingua Linguistics Agreement System**

This successor records that corrected direction without rewriting the predecessor.

```text
INTERLINUIA
    = historical working artifact

INTERLINGUA LINGUISTICS AGREEMENT SYSTEM
    = corrected next direction

CORRECTION
    != HISTORY ERASURE

SUCCESSOR
    != RETROACTIVE RENAME
```

No acronym is made canonical here.

## 1. Purpose

The Interlingua Linguistics Agreement System is a proposed layer for allowing separate participants, languages, dialects, jargons, representations, code-like forms, and communication surfaces to reach enough shared operational meaning to cooperate **without requiring identical wording, grammar, interpretation, or authority**.

The central problem is:

> How can different linguistic surfaces remain themselves while establishing exactly what is sufficiently agreed for the next shared action?

```text
DIFFERENT WORDS
+ DIFFERENT STRUCTURES
+ DIFFERENT CADENCE
+ DIFFERENT CONTEXT
+ PRESERVED PROVENANCE
+ EXPLICIT COMPARISON
+ EARNED AGREEMENT
=
SHARED OPERATIONAL UNDERSTANDING
```

## 2. First law

```text
AGREEMENT != SAME WORDS
AGREEMENT != SAME GRAMMAR
AGREEMENT != SAME PERSON
AGREEMENT != SAME MODEL
AGREEMENT != TRUTH
TRANSLATION != IDENTITY
INTERPRETATION != SOURCE
CONSENSUS != EVIDENCE
```

The system is allowed to conclude:

```text
AGREED
PARTIALLY_AGREED
DISAGREED
AMBIGUOUS
UNKNOWN
UNTRANSLATED
INSUFFICIENT_FOR_ACTION
```

It must not manufacture agreement merely to continue.

## 3. USDAY remains above it

The successor does not replace USDAY.

```text
USDAY
    ↓
UNDERSTAND
    ↓
PLAN
    ↓
INTERLINGUA LINGUISTICS AGREEMENT
    ↓
PAIRITY
    ↓
SHARED CHOICE WHERE REQUIRED
    ↓
DO
    ↓
CHECK
    ↓
RETAIN
```

USDAY remains the shared operating-order layer.

The Interlingua Linguistics Agreement System is one mechanism used inside that order when linguistic or semantic agreement is consequential.

```text
INTERLINGUA_LAYER != USDAY
LANGUAGE_AGREEMENT != SHARED_AUTHORITY
```

## 4. Linguistic dimensions

A communication event may carry more than words.

The system may inspect, when consequential:

```text
LEXICON
SYNTAX
SEMANTICS
PRAGMATICS
REFERENCE
DEIXIS
CONTEXT
REGISTER
DOMAIN_JARGON
IDIOM
PROSODY
CADENCE
EMPHASIS
UNCERTAINTY
NEGATION
TEMPORAL_SCOPE
MODALITY
OBLIGATION
GOAL
```

Not every dimension must be activated for every utterance.

```text
ALL_REACHABLE != ALL_ACTIVE
```

Only distinctions that can change the current obligation should enter the active agreement state.

## 5. Source-native first

Every contribution keeps its source-native form before interpretation.

```text
SOURCE_EXPRESSION
    ↓
SOURCE_LANGUAGE / DIALECT / SURFACE
    ↓
CONTEXT
    ↓
INTERPRETATION CANDIDATES
    ↓
AGREEMENT TEST
```

Required boundaries:

```text
SOURCE != TRANSLATION
TRANSLATION != PARAPHRASE
PARAPHRASE != INTERPRETATION
INTERPRETATION != AGREEMENT
AGREEMENT != SOURCE REPLACEMENT
```

A later shared representation never silently replaces what a participant actually said.

## 6. Agreement field

For a communication obligation `O`, define a working agreement field:

```text
AF = (S, P, I, R, A, D, E, G, U)
```

where:

- `S` = source expressions;
- `P` = participants / attributable producers;
- `I` = candidate interpretations;
- `R` = typed linguistic and semantic relations;
- `A` = earned agreements;
- `D` = preserved disagreements/distinctions;
- `E` = evidence, provenance, confidence, chronology;
- `G` = current shared operational goal;
- `U` = unresolved linguistic remainder.

This is a design object, not yet an implemented data format.

## 7. Pairity before parity

The predecessor rule remains.

```text
PAIRITY
= preserve participant A
+ preserve participant B
+ preserve direction A→B
+ preserve direction B→A
+ compare interpretations
+ preserve mismatch
```

Only then may parity be reported.

```text
PAIRITY
→ COMPARE
→ INVARIANTS
→ DIFFERENCES
→ AGREEMENT
→ PARITY ONLY IF EARNED
```

## 8. Meaning before structure; cadence carries intent

For human-facing communication:

```text
MEANING FIRST
STRUCTURE SECOND
CADENCE CARRIES INTENT THROUGH BOTH
```

Cadence is not a universal template.

```text
USER_CADENCE != REQUIRED_CADENCE
ONE_COMMUNITY_STYLE != UNIVERSAL_STYLE
PROSODY != TRUTH
```

Each person, community, modality, or system may have a different cadence while preserving meaning, accessibility, provenance, and reconstructibility.

## 9. Candidate rotations

When direct agreement fails, the system may rotate the representation without silently changing the obligation.

Possible rotations include:

```text
literal wording
plain-language paraphrase
technical formulation
formal notation
RMAL expression
example
counterexample
diagrammatic relation
spoken form
written form
accessible simplification
domain-specific terminology
alternate language
alternate register
```

Required boundary:

```text
ROTATION MAY CHANGE SURFACE
ROTATION MAY NOT SILENTLY CHANGE OBLIGATION
```

This connects to GSFL-style semantic fitting while preserving source-native evidence.

## 10. Agreement test

A minimal agreement cycle is:

```text
EXPRESS
→ ATTRIBUTE
→ PARSE CANDIDATE MEANINGS
→ IDENTIFY CONSEQUENTIAL TERMS
→ ROTATE IF USEFUL
→ PAIRITY CHECK
→ ASK / TEST AMBIGUITY
→ PRESERVE DISAGREEMENT
→ STATE AGREEMENT
→ STATE REMAINDER
→ ACT ONLY IF AGREEMENT IS SUFFICIENT
```

Agreement is sufficient only relative to a declared next action.

Two participants may disagree philosophically while agreeing operationally on a bounded step.

Two participants may use the same words while disagreeing on the action.

Therefore:

```text
LEXICAL_MATCH != OPERATIONAL_AGREEMENT
LEXICAL_DIFFERENCE != OPERATIONAL_DISAGREEMENT
```

## 11. Fighting point for language

The earlier fighting-point idea applies directly.

For interpretations `i1` and `i2` under obligation `O`:

```text
i1 ~O i2
```

only while collapsing the distinction does not change a protected consequence.

If a wording, interpretation, scope, negation, permission, privacy boundary, or action differs consequentially:

```text
FIGHTING_POINT REACHED
→ PRESERVE DISTINCTION
→ DO NOT COMPRESS AWAY
```

## 12. Agreement packet

A future implementation should be able to produce a compact reconstruction packet containing:

```text
SOURCE EXPRESSIONS
PARTICIPANTS
SOURCE SURFACES / LANGUAGES
CONTEXT
CURRENT OBLIGATION
KEY TERMS
CANDIDATE INTERPRETATIONS
AGREED INVARIANTS
AGREED ACTIONS
PRESERVED DISAGREEMENTS
UNRESOLVED TERMS
CONFIDENCE
PROVENANCE
RECOVERY HANDLES
```

This packet is an operational carrier, not a declaration of universal shared meaning.

## 13. RMAL relation

RMAL may provide an executable surface for the agreement state.

Conceptually:

```text
RMAL::AGREEMENT {
    source[]
    participant[]
    obligation
    interpretation[]
    invariant[]
    agreement[]
    disagreement[]
    unresolved[]
    provenance[]
    next_action?
}
```

RMAL execution must preserve:

```text
SOURCE_NATIVE
PROVENANCE
DISAGREEMENT
UNCERTAINTY
WAY_BACK
```

## 14. Master Librarian / Orbit relation

The Master Librarian may recover only the linguistic history needed to resolve the current disagreement.

```text
TERM / PHRASE / CLAIM
    ↓
Ma
    ↓
SMALLEST RELEVANT LINEAGE
    ↓
SOURCE-NATIVE DEFINITIONS / USES
    ↓
COMPARE
    ↓
RETURN TO AGREEMENT FIELD
```

Orbit provides navigation.

Neither Ma nor Orbit decides what participants must mean.

## 15. Knowledge Decay

Language itself decays across time.

Possible linguistic Knowledge Decay includes:

```text
lost terminology
changed meaning
lost register
lost pronunciation
lost context
lost idiom
lost domain convention
lost translation lineage
lost authorial distinction
lost procedural meaning
```

The agreement system should therefore preserve historical meaning states rather than forcing modern equivalence.

## 16. Accessibility

Agreement is not valid merely because one modality succeeded.

The same operational meaning may need surfaces such as:

```text
text
speech
caption
screen-reader structure
simplified wording
technical wording
translation
high-contrast visual relation
haptic / tactile representation
keyboard-accessible interaction
```

```text
ONE ACCESS SURFACE != ACCESSIBILITY FOR ALL
```

## 17. Privacy and authority

No linguistic agreement layer may infer permission from mere understanding.

```text
UNDERSTOOD != CONSENTED
AGREED_MEANING != AGREED_ACTION
TRANSLATED_PRIVATE_DATA != PERMISSION_TO_SHARE
SHARED_LANGUAGE != SHARED_AUTHORITY
```

Privacy remains independently gated.

## 18. Existing Interlingua boundary

The word **Interlingua** has existing linguistic meanings and named language traditions.

This successor records the user's corrected project terminology but does **not yet claim** conformance with, derivation from, or implementation of any particular existing Interlingua standard, language, or organization.

That relationship must be researched explicitly before any such claim is made.

```text
SHARED_NAME != ESTABLISHED_LINEAGE
SIMILAR_TERM != SOURCE_DERIVATION
```

## 19. Acceptance criteria for a future implementation

A future implementation should demonstrate that:

1. the predecessor Interlinuia record remains recoverable unchanged;
2. source expressions remain reconstructible;
3. participant identity remains attributable;
4. translations do not replace sources;
5. candidate interpretations can coexist;
6. disagreement remains first-class;
7. Pairity precedes claimed parity;
8. agreement is scoped to an explicit obligation/action;
9. lexical equality is not treated as semantic equality;
10. semantic similarity is not treated as authority transfer;
11. cadence/prosody may influence interpretation without becoming a universal norm;
12. unresolved terms remain unresolved;
13. privacy is independently gated;
14. RMAL lowering preserves provenance and dissent;
15. Ma/Orbit retrieval remains navigation rather than semantic authority;
16. an agreement packet can reconstruct why the shared action was considered sufficiently understood.

## 20. Current claim ceiling

This document is a **design successor**.

It does not establish:

```text
a universal linguistic theory
a universal translation system
a universal agreement protocol
a formal semantics proof
a production implementation
conformance with an existing Interlingua language standard
collective truth from consensus
```

## 21. Canonical short form

```text
USDAY
    ↓
SOURCE-NATIVE EXPRESSION
    ↓
INTERLINGUA LINGUISTICS AGREEMENT SYSTEM
    ↓
PAIRITY
    ↓
PRESERVE DIFFERENCE
    ↓
EARN BOUNDED AGREEMENT
    ↓
STATE UNRESOLVED REMAINDER
    ↓
ACT ONLY TO THE AGREED SCOPE
    ↓
CHECK
    ↓
RETAIN THE WAY BACK
```

And:

```text
INTERLINUIA
    = predecessor wording

INTERLINGUA LINGUISTICS AGREEMENT SYSTEM
    = corrected successor direction
```
