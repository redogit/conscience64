# W114 — Motivic lift of the exact level-57 standard relation word

**Date:** 2026-09-25  
**Status:** `NEW_BOUNDED_MOTIVIC_STANDARD_PART_ROUTE`  
**Target:** `MOT-1`

## 1. Exact input already established

The current exact sign-normalization verifier proves

[
alpha_S-alpha_{m Aoki}
=
R(22)-R(25)-R(28)
-gamma_{3,4}-gamma_{3,11}-gamma_{3,16}-gamma_{3,17}.
]

It also proves

[
	au(alpha_S-alpha_{m Aoki})
=
eta(3)^{30}p^{-9}
]

and hence

[
S=
arepsilon_{m Aoki}eta(3)^{30}eta(19)^{19},
]

with corrected quadratic sign

[
arepsilon_{m Aoki}
=
chi_{114}(3(7-zeta_3))^{57}.
]

Thus the remaining MOT-1 target is explicitly

[
M_{m gap}
longrightarrow
M_{m standard}otimes A(3(7-zeta_3)).
]

## 2. New observation

The exact relation word uses only two generator families:

1. reflections (R(a));
2. (n=3) multiplication relations (gamma_{3,a}).

Otsubo–Yamazaki, *Motivic Gauss and Jacobi sums* (AFST 35 (2026), DOI 10.5802/afst.1842), lift both relation families to relations among Chow motives.

### Reflection

Their Proposition 4.11 gives the invertibility/reflection isomorphism

[
h(F_d^{(2)})^chiotimes h(F_d^{(2)})^{archi}
simeq
Lambda(1).
]

This is the motivic relation underlying the reflection formula.

### Multiplication

Their Theorem 1.1(ii) gives, for (nmid d) and (alpha^n
eq1),

[
h(F_d^{(n)}langle nangle)^{(alpha,ldots,alpha)}
simeq
igotimes_{chi^n=1,chi
eq1}
h(F_d^{(2)})^{(alpha,chi)}.
]

For (d=57,n=3), the normalized character relation is

[
widetilde	heta(3a)
=
widetilde	heta(a)
+
widetilde	heta(a+19)
+
widetilde	heta(a+38).
]

Using reflection,

[
widetilde	heta(-3a)=-widetilde	heta(3a),
]

so

[
oxed{
widetilde	heta(a)+
widetilde	heta(a+19)+
widetilde	heta(a+38)+
widetilde	heta(-3a)=0
}
]

which is exactly the Aoki (gamma_{3,a}) pattern used by the current W114 verifier.

## 3. Exact theorem-hypothesis check

The four multiplication generators are

[
ain{4,11,16,17}.
]

For (d=57,n=3), the theorem requires ((chi_{57}^a)^3
eq1), equivalently (19
mid a).

All four pass.

Their explicit residue patterns are:

[
gamma_{3,4}=[4,23,42,45],
]

[
gamma_{3,11}=[11,30,49,24],
]

[
gamma_{3,16}=[16,35,54,9],
]

[
gamma_{3,17}=[17,36,55,6].
]

The reflection generators (R(22),R(25),R(28)) are likewise nontrivial.

The committed verifier checks all of these exactly.

## 4. Consequence

The arithmetic relation word

[
alpha_S-alpha_{m Aoki}
]

is not merely a relation among Hecke/Jacobi characters anymore.

Every generator in that exact word belongs to a relation family with a Chow-motive lift in Otsubo–Yamazaki.

Therefore there is now a **specific motive-level route** for the W114 standard normalization.

This sharpens MOT-1 from

> somehow realize the standard part motivically

to

> explicitly compose the reflection correspondences and the four (n=3) multiplication correspondences corresponding to the already-verified exact relation word.

The remaining nonstandard factor is exactly the corrected quadratic Artin sign

[
A(3(7-zeta_3)).
]

## 5. What is still missing

Otsubo–Yamazaki establish motive isomorphisms, but several of the relevant proofs use decomposition/Krull–Schmidt arguments rather than spelling out one final composed cycle.

So the current state is

[
oxed{
	ext{EXACT STANDARD RELATION WORD}
+
	ext{MOTIVIC LIFT FOR EACH GENERATOR FAMILY}
}
]

but not yet

[
oxed{
	ext{ONE EXPLICIT COMPOSED CHOW CORRESPONDENCE}.
}
]

The next task is now concrete:

1. write a cycle representative for each (R(a)) reflection correspondence;
2. trace one (n=3) multiplication correspondence through the explicit geometry used in Otsubo–Yamazaki Theorem 7.2;
3. compose those cycles according to the exact signed word;
4. tensor with the explicit quadratic Artin sign motive (A(3(7-zeta_3)));
5. verify that the induced realization equals the current W114 residual character.

## 6. Strongest current bridge

Together with the newly admitted W114 recursive factorization,

[
h(F_{114}^{(5)})^{(7,78,79,86,91)}
simeq
igotimes
left{
h(F_{114}^{(2)})^{(7,106)},
h(F_{114}^{(2)})^{(78,28)},
h(F_{114}^{(2)})^{(79,63)},
h(F_{114}^{(2)})^{(86,91)}
ight},
]

we now have both sides expressed in the language of invertible Fermat motives.

That creates a common category in which the W114 source and the standard/Aoki target can be compared without passing through analogy.

## 7. Claim ceiling

```text
EXACT_STANDARD_RELATION_WORD != EXPLICIT_CHOW_CYCLE
MOTIVIC_LIFT_OF_GENERATOR_FAMILIES != COMPOSED_CORRESPONDENCE
FERMAT_MOTIVE_ISOMORPHISM != HODGE_PROOF
CORRECTED_ARTIN_SIGN != MOT_1_CLOSED
MOT-1 REMAINS OPEN
```
