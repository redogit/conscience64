# Gap-coset transfer filter

Status: `PROVED_ABSTRACT_HODGE_NATIVE / SEARCH_REDUCTION`

## Setup

Let `S_m` be the standard Aoki lattice used by the current Fermat-fourfold source package, and let `nu(a)` be the multiplicity vector of a Hodge character `a`.

The companion source's coset-transfer mechanism has the form

```text
claim(beta) known,
nu(a) - nu(beta) in S_m
    =>
claim(a).
```

For each currently open wall representative the source records

```text
nu(a) not in S_m,
2 nu(a) in S_m.
```

## Filter theorem

If `nu(a) not in S_m` and `nu(a)-nu(beta) in S_m`, then necessarily

```text
nu(beta) not in S_m.
```

Equivalently, `a` and `beta` represent the same nonzero coset in the quotient by `S_m`.

### Proof

If `nu(beta)` were in `S_m`, then

```text
nu(a) = (nu(a)-nu(beta)) + nu(beta)
```

would also lie in `S_m`, contradiction. QED.

The exponent-two fact `2 nu(a) in S_m` is not needed for this implication; it says additionally that the relevant quotient class has order dividing two.

## Search consequence

A nonzero gap class cannot be closed by coset transfer to a witness generated entirely inside the ordinary standard lattice. Therefore these candidate families can be rejected **before** an expensive coset search when their multiplicity vector is certified in `S_m`:

- vanishing-pair/decomposable classes whose certificate stays in `S_m`;
- standard Aoki classes and integer combinations that remain in `S_m`;
- any previously closed class with an explicit `nu in S_m` certificate.

The useful witness pool is instead:

```text
known-algebraic Hodge classes beta
with
nu(beta) not in S_m.
```

Examples of mechanisms that can supply algebraic classes outside `S_m` include the source's `*`-split / joining-line transport and other partition/Lefschetz constructions whose algebraicity does not imply lattice membership. The source's successful `m=168` witness is exactly of this type: both `a` and its `*`-split witness `beta` are gap classes individually, while their difference lies in `S_168`.

## New bounded search contract

For one representative of each wall `W70`, `W110`, `W114`:

1. enumerate or retrieve **known-algebraic gap** candidates `beta` at the same level;
2. add justified level-raised candidates only under an explicit lift/descent contract;
3. test `nu(a)-nu(beta) in S_m` exactly;
4. verify the algebraicity certificate for `beta` independently of the lattice test;
5. if a hit occurs, apply the authenticated coset-transfer theorem;
6. if no hit occurs, record the exact candidate family and bounds — not `NO_WITNESS_EXISTS` globally.

This is a materially smaller search than comparing against every known closed class.

## Decision-field implication

The next Hodge planner coordinate should distinguish at least:

```text
known_algebraic_gap_candidate_available
same_coset_certificate
```

rather than the weaker coordinate `known_algebraic_candidate_available`.

## Claim ceiling

This filter proves only a necessary condition for the present coset-transfer mechanism. It does not prove that a suitable witness exists or does not exist for any open wall, and it does not prove the Hodge conjecture. No P-versus-NP evidence is used.