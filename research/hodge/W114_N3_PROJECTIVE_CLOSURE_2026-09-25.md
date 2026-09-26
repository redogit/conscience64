# W114 — Projective closure of the d=57, n=3 multiplication transfer

**Date:** 2026-09-25
**Status:** PROJECTOR_BOUNDARY_ANNIHILATION_VERIFIED
**Target:** close the compactification seam in the four gamma_3 edges of MOT-1

## Source theorem

Otsubo–Yamazaki Theorem 7.2 first builds the multiplication isomorphism on open
varieties. Their Proposition 3.5 then identifies the relevant open character motives
with the projective Fermat motive pieces when every omitted boundary component has
zero component under the declared character projector.

For the open twisted Fermat surface X inside F_57^(3)<3>, the diagonal mu_57 acts
trivially on the omitted coordinate boundary. The character (alpha,alpha,alpha)
restricts to that diagonal as alpha^3.

For the open Fermat curve used on the product side, the two boundary pieces are killed
respectively by:
- the diagonal character alpha*chi_i;
- the first-coordinate character alpha.

The quotient from the open Fermat curve to C additionally requires chi_i to be
trivial on ker(mu_57 -> mu_3)=mu_19.

## Exact W114 checks

The four standard-word exponents are:

a in {4,11,16,17}.

For each:
- 3a is nonzero mod 57, so the projective-surface boundary is projector-zero;
- a is nonzero;
- a+19 and a+38 are nonzero mod 57, so both curve boundary types are projector-zero;
- 19 and 38 are trivial on the mu_19 kernel because 3*19=57 and 3*38=114.

Thus all support conditions used by Proposition 3.5 hold exactly in all four W114
multiplication generators.

## Closed correspondence candidate

Let Phi_a and Psi_a be the already-admitted explicit open transfers.

Take their graph closures in the corresponding projective products and sandwich by
the same character projectors:

barPhi_a =
e_X o [closure(Gamma_Phi_a)] o (e_(a,19) x e_(a,38)),

barPsi_a =
(e_(a,19) x e_(a,38)) o [closure(Gamma_Psi_a)] o e_X.

Any extra cycle term introduced along the complement is supported on one of the
boundary strata above. Such a term factors through a motive whose declared
character component is zero, hence the projector sandwich kills it.

Therefore the projected closure represents the same morphism as the open transfer
under the open/projective character-motive identifications.

## What this sharpens

The four gamma_3 standard-word edges no longer have an unspecified
"compactification correction" at the character-motive level. The exact boundary
supports that could carry such corrections are projector-zero.

The remaining audit is mechanical:
- record the actual graph closures as cycle expressions;
- verify composition order and scalar normalization when all standard-word edges are
  chained.

## Claim ceiling

BOUNDARY_CHARACTER_CHECK != INDEPENDENT_PROOF_OF_OTSUBO_YAMAZAKI
PROJECTOR_SANDWICHED_CLOSURE != FULL_COMPOSED_W114_CYCLE
N3_PROJECTIVE_EDGE != MOT_1_CLOSED
HODGE_CONJECTURE_REMAINS_OPEN
