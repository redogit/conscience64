# W114 — Explicit duplication and reflection correspondence primitives

**Date:** 2026-09-25
**Status:** CORRESPONDENCE_PRIMITIVES_EXPLICIT
**Target:** compile the exact 114->57 word inside MOT-1

The exact duplication word is

[
D2_7+D2_{22}-D2_{23}-D2_{56}+N_1-N_2.
]

This packet assigns an explicit motivic correspondence primitive to every generator.

## 1. The four D2 edges are n=2 Davenport-Hasse edges

Specialize Otsubo–Yamazaki Theorem 7.2 to

[
d=114,qquad n=2.
]

For (alpha=chi_{114}^a), the right-hand side contains the unique nontrivial
order-two character (chi_{114}^{57}):

[
h(F_{114}^{(2)}langle2angle)^{(alpha,alpha)}
simeq
h(F_{114}^{(2)})^{(alpha,chi_{114}^{57})}.
]

The four W114 duplication exponents are

[
ain{7,22,23,56}.
]

All satisfy

[
2a
otequiv0pmod{114},
]

so the theorem hypothesis (alpha^2
eq1) holds.

## 2. Explicit n=2 transfer geometry

For (n=2), the Terasoma/Otsubo–Yamazaki construction simplifies:

- (C	o T) has degree 1 because
  [
  mu_{114}	omu_{114}
  ]
  is the identity product map;
- (X	o T) has degree 114 because
  [
  ker(mu_{114}^2	omu_{114})
  ]
  has order 114;
- (S_{n-1}=S_1) is trivial, so there is no symmetrizer factor.

Thus on the projected open motives one may take

[
oxed{
Phi_a=f_X^*circ f_{C,*}
}
]

and

[
oxed{
Psi_a=rac1{114}f_C^*circ f_{X,*}.
}
]

The finite-cover identities give both compositions equal to identity on the
declared character sectors.

## 3. Projective boundary checks

The projective twisted Fermat-curve boundary is killed because the diagonal
restriction has exponent (2a
eq0).

On the curve factor ((a,57)):

- the (u_0=0) boundary sees exponent (a+57
eq0);
- the (u_1=0) boundary sees exponent (a
eq0).

The order-two character (57) is trivial on the (mu_{57}) quotient kernel since

[
2cdot57=114equiv0.
]

Therefore the same projector-sandwiched graph-closure rule used for the admitted
(n=3) transfer upgrades these open maps to the projective character motives.

## 4. Coefficient-2 Artin factor

Proposition 4.7 rewrites the twisted left side as

[
h(F_{114}^{(2)})^{(a,a)}
otimes
A(2,2a).
]

Thus each (D2_a) edge has a concrete coefficient-2 Kummer/Artin factor.

Using the signed W114 word,

[
D2_7+D2_{22}-D2_{23}-D2_{56},
]

the total exponent is

[
-2(7+22-23-56)=100
]

in the historical Gauss-word orientation, reproducing the exact
(chi_{114}(2)^{100}) residual.

The direction/inverse of each edge must be respected when the final cycle compiler
is assembled; the theorem-level correspondence primitive itself is now explicit.

## 5. Reflection primitives N1 and N2

The norm/reflection relation is lifted by Otsubo–Yamazaki Proposition 4.5(i).

For nontrivial (a), let

[
E_a=e^{(psi,chi^a)},qquad
E_{-a}=e^{(arpsi,chi^{-a})}
]

be the Artin-Schreier graph projectors, viewed as 1-cycles on
(A_d	imes A_d).

Their intersection is exactly

[
(E_a,E_{-a})=-1.
]

Lemma 4.4 therefore gives an explicit rank-one projector

[
P_a=-igl(E_aoxtimes E_{-a}igr)
]

(up to the canonical factor permutation identifying the tensor-product surface),
together with mutually inverse maps between its image and (Lambda(1)):

- forward represented by (E_a);
- inverse represented by (-E_{-a}).

Apply this for (a=1,2). In the signed word (N_1-N_2), the two Tate/reflection
factors cancel at the residual exponent level.

## 6. Compiler consequence

Every generator in the exact 114->57 duplication word now has:

- an explicit source character;
- an explicit target character;
- an explicit geometric transfer;
- an inverse normalization;
- projective boundary annihilation;
- an explicit Kummer/Tate factor.

The remaining task is no longer to discover a primitive. It is to **compose the
declared primitives in the signed order** and push the explicit level-57 plane
cycle through the resulting correspondence.

## Claim ceiling

```text
PRIMITIVE_CORRESPONDENCE_RECIPES != FULL_COMPILER_COMPOSITION
THEOREM_HYPOTHESES_PASS != INDEPENDENT_REPROOF
SIGNED_WORD_REQUIRES_DIRECTIONAL_COMPOSITION_AUDIT
MOT-1 REMAINS OPEN
```
