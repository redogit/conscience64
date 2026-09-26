# W114 — Explicit open transfer for the n=3 motivic multiplication relation

**Date:** 2026-09-25  
**Status:** `EXPLICIT_OPEN_FINITE_CORRESPONDENCE / COMPACTIFICATION_OPEN`  
**Target:** the four multiplication generators in the W114 standard relation word

## 1. Otsubo–Yamazaki geometry specialized to d=57, n=3

Theorem 7.2 uses:

- the hyperplane
  [
  S={s_1+s_2+s_3=3, s_1s_2s_3
eq0};
  ]
- the degree-57 Kummer cover
  [
  T:quad t^{57}=s_1s_2s_3;
  ]
- the open twisted Fermat surface
  [
  X:quad t_1^{57}+t_2^{57}+t_3^{57}=3,quad t_1t_2t_3
eq0,
  ]
  with
  [
  s_i=t_i^{57},qquad t=t_1t_2t_3;
  ]
- the affine curve
  [
  C:quad x^{57}+y^3=1,qquad x
eq0.
  ]

For (C^2	o T), with a primitive cube root (zeta_3),

[
s_i=(1-zeta_3^i y_1)(1-zeta_3^i y_2),
qquad
t=x_1x_2.
]

## 2. Exact cover degrees

The Galois group of (C^2/S) is

[
mu_{57}^2times S_2,
]

and the map to (operatorname{Gal}(T/S)=mu_{57}) is the product of the two
(mu_{57}) coordinates.

Hence

[
deg(C^2	o T)=|ker(mu_{57}^2times S_2	omu_{57})|
=57cdot2=114.
]

For (X	o T),

[
operatorname{Gal}(X/S)=mu_{57}^3
	omu_{57}
]

is the coordinate product, hence

[
deg(X	o T)=57^2=3249.
]

## 3. Projectors

Let (alpha=chi_{57}^a), for

[
ain{4,11,16,17}.
]

The two nontrivial characters of (mu_3), pulled back to (mu_{57}), have
exponents

[
19, 38.
]

Let (e_
u) select the ordered pair of these two characters on the two
(C)-factors. Let

[
e_{m sym}=rac12(1+mathrm{swap})
]

be the trivial (S_2)-projector.

Otsubo–Yamazaki compute

[
e_
u e_{m sym}e_
u=rac12e_
u.
]

Therefore the inverse symmetrizer transfer requires the exact factor (2).

## 4. Explicit open forward and inverse transfers

Write

[
f_C:C^2	o T,qquad f_X:X	o T.
]

On the relevant character sectors, define

[
oxed{
Phi_a
=
rac1{3249},
f_X^*circ f_{C,*}circ e_{m sym}circ e_
u.
}
]

This maps the ordered (C^2) character piece into the
((alpha,alpha,alpha))-piece of (X).

Define the reverse transfer

[
oxed{
Psi_a
=
rac2{114},
e_
ucirc e_{m sym}circ f_C^*circ f_{X,*}.
}
]

Using

[
f_{X,*}f_X^*=3249,mathrm{id},
]

[
f_C^*f_{C,*}=114,mathrm{id}
]

on the pulled-back (H)-trivial projector sector, and

[
e_
u e_{m sym}e_
u=rac12e_
u,
]

the total scalar in (Psi_aPhi_a) is

[
rac1{3249}rac2{114}(3249)(114)rac12=1.
]

The reverse composition is likewise identity on the symmetric target sector.

## 5. Exact W114 standard-word cases

For all four values

[
a=4,11,16,17,
]

Theorem 7.2 requires

[
alpha^3
eq1.
]

Since (d=57), this is equivalent to (19
mid a), which holds in all four
cases.

The two curve factors are

[
h(F_{57}^{(2)})^{(a,19)}
otimes
h(F_{57}^{(2)})^{(a,38)}.
]

These are exactly the motive factors entering the (n=3) multiplication relation.

## 6. Remaining compactification seam

The formulas above are explicit finite correspondences on the **open** motives used in
the proof.

Otsubo–Yamazaki identify these character pieces with the corresponding projective
Fermat motives because the omitted boundary strata have zero projector component.

What is not yet written here is one closed projective cycle obtained by taking the graph
closures and proving directly that all boundary corrections vanish after projection.

That is the next one-degree step.

## Claim ceiling

```text
EXPLICIT_OPEN_TRANSFER != PROJECTIVE_CHOW_CYCLE
THEOREM_7_2_HYPOTHESES_PASS != INDEPENDENT_REPROOF
BOUNDARY_COMPACTIFICATION_REMAINS_TO_BE_TRACED
MOT-1 REMAINS OPEN
```
