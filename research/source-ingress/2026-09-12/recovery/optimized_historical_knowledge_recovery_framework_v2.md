# Optimized Historical Knowledge Recovery Framework — v2

## 0. Governing Objective

Recover the smallest surviving carriers that restore the greatest amount of disconnected human knowledge **without erasing provenance, variant structure, cultural authority, uncertainty, accessibility, or future correctability**.

The system is not a quote collector, document scraper, OCR corpus, or universal ontology.

It is a **reconstruction machinery layer** over many libraries and carrier types.

---

## 1. Core Recovery Object

For every recoverable unit:

\[
K_i =
(
ID,
Carrier,
Language,
Script,
Culture,
Place,
Time,
CommunityAuthority,
Subject,
Content,
Relations,
Witnesses,
Variants,
Translations,
Transmission,
LossState,
Rights,
AccessProtocol,
Evidence,
Uncertainty,
DigitizationState,
AccessibilityState,
Compression,
ModernConnections
)
\]

The added fields in v2 are consequential:

- `CommunityAuthority`: who has standing to describe, restrict, contextualize, or correct the item.
- `Rights`: legal/reuse conditions.
- `AccessProtocol`: public, restricted, sacred/seasonal/community-defined, embargoed, etc.
- `DigitizationState`: scan/image/OCR/transcription/proofread/reconstructed status.
- `AccessibilityState`: whether content is perceivable, operable, understandable, and robust across assistive technologies.

---

## 2. Separate Identity Layers

Never collapse these into one identifier:

\[
\text{Work}
\neq
\text{Witness}
\neq
\text{Edition}
\neq
\text{Scan}
\neq
\text{Transcription}
\neq
\text{Translation}
\neq
\text{Reconstruction}.
\]

Define:

\[
ID =
(
WorkID,
WitnessID,
CarrierID,
VersionID,
TransformID
).
\]

A transformation never silently replaces its source.

---

## 3. Transmission Graph

Represent recovery as a graph:

\[
G_K = (C,R)
\]

where:

- \(C\) = carriers and transformed carriers,
- \(R\) = typed relations.

Required relation types include:

- `COPY_OF`
- `QUOTES`
- `PARALLEL_TO`
- `TRANSLATES`
- `TRANSLITERATES`
- `COMMENTARY_ON`
- `CORRECTS`
- `VARIANT_OF`
- `DERIVED_FROM`
- `RECONSTRUCTED_FROM`
- `DISPUTES`
- `CONFIRMS`
- `USES_METHOD_FROM`
- `SAME_TRADITION_AS`
- `POSSIBLE_TRANSMISSION`
- `INDEPENDENT_PARALLEL`
- `COMMUNITY_CONTEXT_FOR`
- `ACCESS_CONTROLLED_BY`

Uncertain relations carry probability/confidence and a justification record; they are not promoted to identity.

---

## 4. Evidence State

Every claim receives a state:

\[
E_i \in
\{
DIRECT,
VARIANT,
QUOTED\_FRAGMENT,
LATER\_COPY,
ORAL\_RECORD,
ARCHAEOLOGICAL,
RECONSTRUCTED,
CONJECTURAL,
DISPUTED,
UNKNOWN
\}.
\]

`UNKNOWN` is valid and must not be converted to `ABSENT`.

Absence must distinguish:

- not digitized,
- not indexed,
- not searched in the relevant language,
- inaccessible,
- rights-restricted,
- culturally restricted,
- illegible,
- undeciphered,
- destroyed,
- genuinely unattested,
- unknown.

---

## 5. Variant-Preserving Text Model

For textual carriers, preserve:

\[
(
OriginalScript,
DiplomaticTranscription,
NormalizedText,
Transliteration,
LiteralTranslation,
IdiomaticTranslation
).
\]

Do not overwrite variants.

A corrected reading becomes:

\[
\text{original reading}
\rightarrow
\text{proposed correction}
\rightarrow
\text{evidence}
\]

not:

\[
\text{original reading}
\rightarrow
\text{deleted}.
\]

---

## 6. Multilingual Retrieval Without Pivot Collapse

Search expansion should be many-to-many:

\[
q
\rightarrow
\{
q_{script},
q_{historical},
q_{transliterated},
q_{translated},
q_{alias},
q_{morphological}
\}.
\]

Avoid relying on one pivot language as the sole semantic bridge.

Store the full query lineage:

\[
QueryPath =
q_0 \rightarrow q_1 \rightarrow \cdots \rightarrow result.
\]

Every returned item should be able to answer:

- Which query found me?
- In which language/script?
- Was translation involved?
- Which translation model or lexicon?
- What variants were not searched?

---

## 7. Script Coverage Gate

Before claiming broad multilingual coverage, measure script support:

\[
SC =
\frac{
\text{searchable scripts represented}
}{
\text{scripts required by target scope}
}.
\]

A missing script is not a missing culture.

Unsupported or poorly digitized scripts create a **coverage blind spot**, not negative evidence.

---

## 8. OCR / Transcription Fidelity

OCR output is a hypothesis layer, not source truth.

For every machine transcription:

\[
T_m =
(SourceImage,
Engine,
EngineVersion,
LanguageModel,
Confidence,
PostCorrections,
HumanValidationState).
\]

Page/line/token alignment should be retained where possible.

Recommended states:

- `RAW_OCR`
- `OCR_CORRECTED`
- `HUMAN_PROOFREAD`
- `DOUBLE_VALIDATED`
- `UNCERTAIN`
- `ILLEGIBLE`

Search indexes may use OCR, but quotations and claims should prefer validated text when available.

---

## 9. Oral and Performative Knowledge

Do not force oral carriers into a text-only schema.

Represent:

\[
O_i =
(
Audio,
Video,
Speaker,
Community,
Language,
Dialect,
PerformanceContext,
Place,
Season,
Audience,
Gesture,
Rhythm,
Music,
Transcription,
Translation,
AccessProtocol
).
\]

The transcript is one carrier transformation, not the oral event itself.

---

## 10. Community and Cultural Authority

Access is not simply:

\[
OPEN \mid CLOSED.
\]

Use community-governed protocols where applicable:

\[
A_i =
(
Community,
Protocol,
PermittedAudience,
PermittedUses,
TemporalConditions,
Attribution,
Restrictions,
Steward
).
\]

A public metadata record may coexist with restricted media.

Discovery does not imply permission to reproduce, translate, train on, expose, or redistribute.

---

## 11. Accessibility Gate

A recovery system fails if recovered knowledge remains inaccessible to people.

Every interface and exported artifact should be tested for:

\[
A11Y =
(
Perceivable,
Operable,
Understandable,
Robust
).
\]

Additional requirements:

- semantic structure rather than visually dependent layout,
- screen-reader usable navigation,
- accessible tables,
- language declarations,
- Unicode preservation,
- alt text or textual descriptions for essential images,
- transcripts/captions for audio-video,
- keyboard operation,
- no color-only distinctions,
- accessible source-to-transcription comparison,
- low reconstruction burden.

Accessibility is part of preservation, not presentation polish.

---

## 12. Relation Recovery Priority

For a candidate carrier \(c\):

\[
\Delta K(c) =
\text{new consequential relations restored by }c.
\]

But priority must account for neglected communities and coverage bias.

Define:

\[
P(c)=
\frac{
\Delta K(c)
\cdot V(c)
\cdot F(c)
\cdot B(c)
}{
C(c)+\epsilon
}
\]

where:

- \(V(c)\) = verifiability,
- \(F(c)\) = fragility / risk of loss,
- \(B(c)\) = bias-correction / underrepresentation factor,
- \(C(c)\) = acquisition and verification cost.

Do not let popularity substitute for importance.

---

## 13. Thought Compression Layer

Sayings, formulas, diagrams, recipes, legal maxims, ritual formulae, mnemonic structures, musical patterns, algorithms, and maps can all be compression carriers.

Define:

\[
CRD(x)=
\frac{
|\text{consequential relations recoverable from }x|
}{
\text{carrier burden}(x)
}.
\]

But compression quality must include decompression cost:

\[
CQ(x)=
\frac{
\text{recoverable consequential meaning}
}{
\text{carrier burden}
+
\text{required context burden}
}.
\]

A short phrase requiring a lost cultural narrative may have high apparent compression but high reconstruction cost.

---

## 14. Cross-Cultural Similarity Gate

Similarity is a candidate relation, not evidence of transmission.

For two carriers \(a,b\):

\[
Sim(a,b)
\rightarrow
\{
IndependentParallel,
PossibleTransmission,
SharedAncestor,
Coincidence,
Unresolved
\}.
\]

Promotion requires independent historical evidence such as chronology, contact routes, citation, linguistic borrowing, manuscript lineage, archaeological connection, or other discriminating witnesses.

---

## 15. Source and Authority Separation

Keep distinct:

\[
\text{retrieval rank}
\neq
\text{historical authority}
\neq
\text{scholarly consensus}
\neq
\text{truth}.
\]

Also:

\[
\text{repetition across websites}
\neq
\text{independent corroboration}.
\]

Copies sharing a common upstream source count as one lineage unless materially independent evidence exists.

---

## 16. Rights and Availability

Record:

\[
RightsState =
(
Copyright,
License,
Territory,
Reuse,
Download,
API,
RateLimit,
Authentication,
Embargo
).
\]

A carrier may be discoverable but not accessible.

A carrier may be readable but not redistributable.

A carrier may be accessible in one jurisdiction but unavailable in another.

These are access properties, not evidence properties.

---

## 17. Library Quality Vector

Evaluate every source library with:

\[
LQ =
(
Coverage,
Language,
Script,
Metadata,
Identity,
Variants,
Provenance,
Relations,
Search,
OCR,
Media,
CommunityAuthority,
Rights,
Accessibility,
API,
Interoperability,
Versioning,
Preservation,
Correction,
Uncertainty
).
\]

No library is expected to maximize all dimensions.

The system should route each task to the library whose strengths fit the obligation.

---

## 18. Anti-Patterns to Reject

Reject or quarantine:

1. `ONE_TEXT_IS_THE_TEXT`
2. `TRANSLATION_AS_ORIGINAL`
3. `OCR_AS_SOURCE_TRUTH`
4. `SEARCH_RANK_AS_AUTHORITY`
5. `POPULARITY_AS_IMPORTANCE`
6. `MISSING_FROM_INDEX_AS_NONEXISTENT`
7. `PIVOT_LANGUAGE_AS_UNIVERSAL_MEANING`
8. `SIMILARITY_AS_TRANSMISSION`
9. `MULTIPLE_COPIES_AS_INDEPENDENT_EVIDENCE`
10. `PUBLICLY_VISIBLE_AS_FREE_TO_REUSE`
11. `DIGITIZED_AS_PRESERVED_FOREVER`
12. `TEXT_AS_COMPLETE_ORAL_KNOWLEDGE`
13. `ARCHIVE_CONTROL_AS_COMMUNITY_AUTHORITY`
14. `ACCESSIBILITY_AS_OPTIONAL`
15. `COMPRESSION_WITHOUT_RECOVERY_PATH`
16. `RECONSTRUCTION_WITHOUT_UNCERTAINTY`
17. `GLOBAL_ONTOLOGY_OVER_SOURCE_NATIVE_IDENTITY`

---

## 19. Global Recovery Loop v2

\[
\boxed{
LIBRARIES
\rightarrow
SOURCE\ REGISTRY
\rightarrow
LANGUAGE/SCRIPT\ EXPANSION
\rightarrow
CARRIER\ INGEST
\rightarrow
IDENTITY\ LAYERS
\rightarrow
VARIANT\ GRAPH
\rightarrow
CHRONOLOGY
\rightarrow
LOSS/ACCESS\ STATE
\rightarrow
RELATION\ RECOVERY
\rightarrow
COMMUNITY/RIGHTS\ GATE
\rightarrow
VERIFICATION
\rightarrow
ACCESSIBILITY\ GATE
\rightarrow
CONNECT
\rightarrow
RETAIN
}
\]

Then:

\[
\boxed{
new\ relation
\rightarrow
new\ search\ frontier
}
\]

with no destructive overwrite of prior states.

---

## 20. Human-Facing Invariants

For any consequential recovered item, a person should be able to answer cheaply:

1. What is this?
2. Where did it come from?
3. What language/script was the source?
4. Am I reading the source, a transcription, a translation, or a reconstruction?
5. Which variants exist?
6. What is uncertain?
7. Who has cultural authority or access restrictions?
8. What evidence supports the relation being claimed?
9. Which other sources are genuinely independent?
10. What could overturn this reconstruction?
11. Can I access it with assistive technology?
12. Can the original source be recovered from this representation?

---

## 21. Optimization Objective v2

Optimize:

\[
\boxed{
\max
\left(
RecoveredRelations,
EvidenceStrength,
CulturalCoverage,
LanguageCoverage,
Correctability,
Accessibility,
Preservation,
HumanBenefit
\right)
}
\]

while minimizing:

\[
\boxed{
\left(
Cost,
ContextLoss,
ProvenanceLoss,
TranslationLoss,
AccessViolation,
Bias,
FalseMerge,
FalseCertainty,
ReconstructionBurden
\right).
}
\]

Subject to the invariant:

\[
\boxed{
\text{No optimization may improve the score by erasing a consequential distinction.}
}
\]

---

## 22. Final System Principle

The strongest qualities found in existing digital libraries should be composed rather than imitated in isolation:

- scan-linked textual verification,
- explicit variants and corrections,
- machine-readable APIs,
- typed intertextual links,
- cross-language parallels,
- community-governed access,
- proofread/validation states,
- interoperable media delivery,
- explicit rights and access conditions,
- universal accessibility.

The target is not one perfect global library.

The target is:

\[
\boxed{
\text{a faithful routing and reconstruction layer across many imperfect but valuable libraries.}
}
\]
