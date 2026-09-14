# m=39 Shioda–Katsura dependency note

Status: `SOURCE_AUTHENTICATED / TARGET_APPLICATION_UNRESOLVED`

## Primary source checked

Tetsuji Shioda and Toshiyuki Katsura, **On Fermat varieties**, Tohoku Mathematical Journal 31 (1979), 97–115, DOI `10.2748/tmj/1178229881`.

The paper's stated purpose is to establish the inductive structure of Fermat varieties of common degree and varying dimension. Its Theorem I describes the higher-dimensional Fermat variety as obtained from a product of lower-dimensional Fermat varieties through a blow-up, quotient by a cyclic group of order `m`, and blow-down; the introduction states that the cohomology of the higher-dimensional Fermat variety is then described in terms of lower-dimensional cohomology.

## What this closes

For the m=39 route, the generic existence of an inductive geometric correspondence between relevant Fermat varieties is not merely an analogy. It is supported by the primary Shioda–Katsura source.

Decision-field update:

```text
theorem_source_validity = VERIFIED_PRIMARY
inductive_correspondence_exists = VERIFIED_AT_GENERAL_THEOREM_LEVEL
```

## What remains open

The current target is much narrower than the generic inductive theorem. We still require a target-specific application showing that the selected m=39 character/eigenspace is transported through the actual correspondence with the required character bookkeeping and with **nonzero projection into the target Fermat-fourfold eigenspace**.

Therefore keep:

```text
theorem_application_validity = UNRESOLVED
transport_character_compatibility = UNRESOLVED
nonzero_target_projection = UNRESOLVED
```

Do not replace those three obligations with the statement that the Shioda–Katsura incidence/correspondence exists.

## Next exact task

Write the selected m=39 character on the two lower-dimensional factors, propagate it through the cyclic quotient/action appearing in the Shioda–Katsura construction, and calculate the target character. Then prove or compute that the induced map on the selected one-dimensional eigenspace is nonzero.

A nonzero map can be certified by one of:

1. an explicit pull/push calculation on a nonzero eigenclass;
2. a nonzero period/intersection pairing with a dual target eigenclass;
3. a source theorem whose hypotheses and character normalization are matched exactly to this block.

Until one of those is completed, the m=39 route remains conditional.

Claim ceiling: this note authenticates a general source dependency and narrows the missing application. It proves no new Hodge class algebraic.