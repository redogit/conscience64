# Conscience64 Recovery Carrier Model

## Purpose

Conscience64 treats recovered human knowledge as a provenance-preserving carrier graph, not as a flat quote/document corpus and not as a claim that every recovered item is true, complete, or freely reusable.

The recovery objective is to reconnect consequential distinctions while preserving source identity, variants, uncertainty, access boundaries, cultural authority, accessibility, and future correction.

## Recovery unit

Each recoverable unit is modeled as:

```text
K = (
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
```

Identity layers remain separate:

```text
Work != Witness != Edition != Scan != Transcription != Translation != Reconstruction
```

A transform never silently replaces its source.

## Lost distinctions

Recovery is not limited to lost physical objects. The searchable loss family includes:

```text
lost objects
lost texts
lost passages
lost languages
lost meanings
lost relations
lost procedures
lost explanations
lost classifications
lost contexts
lost transmission paths
```

The carrier family includes, without collapsing them into text:

```text
sayings
oral and performative knowledge
speech
audio
video
inscriptions
artifacts
images
diagrams
formulas
recipes
legal maxims
ritual formulae
mnemonic structures
musical patterns
algorithms
maps
calendars
tables
tools
```

## Evidence and absence

Evidence state is explicit:

```text
DIRECT
VARIANT
QUOTED_FRAGMENT
LATER_COPY
ORAL_RECORD
ARCHAEOLOGICAL
RECONSTRUCTED
CONJECTURAL
DISPUTED
UNKNOWN
```

`UNKNOWN` is not `ABSENT`.

Absence must distinguish at least:

```text
not digitized
not indexed
not searched in the relevant language
inaccessible
rights-restricted
culturally restricted
illegible
undeciphered
destroyed
genuinely unattested
unknown
```

## Relation graph

Recovery is a typed graph:

```text
G = (Carriers, Relations)
```

Core relations include:

```text
COPY_OF
QUOTES
PARALLEL_TO
TRANSLATES
TRANSLITERATES
COMMENTARY_ON
CORRECTS
VARIANT_OF
DERIVED_FROM
RECONSTRUCTED_FROM
DISPUTES
CONFIRMS
USES_METHOD_FROM
SAME_TRADITION_AS
POSSIBLE_TRANSMISSION
INDEPENDENT_PARALLEL
COMMUNITY_CONTEXT_FOR
ACCESS_CONTROLLED_BY
```

Similarity alone is never promoted to historical transmission or identity. Uncertain relations retain confidence and justification.

## Cross-carrier coordinate overlay

A semantic location may require an adaptive number of binary64 carrier coordinates rather than a fixed dimensionality.

```text
X(p) = { f_i(p) | i in I'(p) }
```

`I'(p)` is the bounded set of consequential distinctions required at point `p`. Multiple carriers may therefore occupy the same semantic location as an overlay.

The initial base overlay can include:

```text
origin / provenance
chronology / state
boundary / context
distinction / selection
relations
transform / carrier
observation / evidence
consequence / ethics / cost
integrity / uncertainty / remainder
```

Additional coordinates are introduced only when needed to preserve consequential distinctions.

A cross-carrier transform records each source carrier as one of:

```text
PRESERVED
TRANSFORMED
SPLIT
MERGED
INTRODUCED
LOST
UNRESOLVED
```

Known loss must be carried forward as loss or remainder. Concealed consequential loss is semantic mutilation.

## Float64 boundary

A binary64 value is a coordinate carrier, not the knowledge object itself. Arbitrary 64-bit identifiers must not be treated as exactly representable numeric JavaScript doubles; raw IEEE-754 binary64 bit patterns and their interpretation must remain distinct.

The UTF-8/raw source carrier, content identity, provenance, and graph lineage remain external and reconstructible.

## Sharding rule

`data-NN.txt` files are transport shards only. A shard number has no semantic meaning and must not become an identity boundary.

Rules:

1. Never infer absence from a missing future shard.
2. Never invent recovered content to fill a shard.
3. Preserve the ordered byte stream of the encoded corpus.
4. Keep corpus identity separate from transport chunking.
5. Future corpus growth may add shards without changing prior object identities.
6. Repacking shards must preserve the decoded corpus identity or explicitly mint a new corpus identity/version.
7. Recovery records retain their own lineage regardless of which transport shard contains them.

## Accessibility and authority

Recovered knowledge remains subject to accessibility, rights, and community-authority boundaries. Discovery does not imply permission to reproduce, translate, expose, train on, or redistribute a carrier.

Accessibility is part of preservation: semantic structure, keyboard access, screen-reader usability, Unicode preservation, non-color-only distinctions, transcripts/captions where applicable, and low reconstruction burden are first-class requirements.

## Governing invariant

```text
Recover first -> preserve lineage -> distinguish evidence -> connect relations -> transform explicitly -> carry loss/remainder -> synthesize only within the evidence boundary.
```
