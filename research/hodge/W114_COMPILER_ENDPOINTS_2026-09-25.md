# W114 correspondence compiler — explicit source and corrected target endpoints

**Date:** 2026-09-25  
**Status:** `ENDPOINTS_EXPLICIT / COMPOSITION_OPEN`

This packet recovers three older exact W114 certificates into the current corrected
MOT-1 state.

## 1. Explicit level-57 Tate source

Use

[
f=(29,11,17,28,40,46)
]

on the degree-57 Fermat fourfold and the plane

[
L:quad x_0+x_3=x_1+x_5=x_2+x_4=0.
]

The complementary pairs are

[
29+28=11+46=17+40=57.
]

Let

[
z_f=e_f[L],qquad z_{ar f}=e_{ar f}[L].
]

For the 57^3 phase orbit, the standard intersection values are

[
I_3=57^2-3cdot57+3,qquad I_2=2-57,qquad I_1=1,qquad I_0=0.
]

The Fourier coefficient is

[
I_3-3I_2+3I_1=57^2.
]

After the (57^{-3}) orbit-projector normalization,

[
(z_f,z_{ar f})=rac1{57}.
]

Hence

[
oxed{
P_f=57,(z_f	imes z_{ar f})
}
]

is the rank-one projector and

[
(X_{57}^4,P_f)simeqLambda(2).
]

This gives the correspondence compiler an explicit Tate source.

## 2. Exact 114 -> 57 duplication word

Let (G_k) denote the order-114 Gauss symbol and (H_a=G_{2a}) the
embedded order-57 symbol.

With W114 coordinate 91 omitted,

[
J_W=rac{G_1G_7G_{78}G_{79}G_{86}}{G_{23}}.
]

For the level-57 source (f), after the (H_{11}) cancellation,

[
J_f=H_{29}H_{17}H_{28}H_{40}.
]

Let the residual standard word be

[
S=
rac{H_1H_7H_{22}H_{39}H_{43}}
{H_{23}H_{29}H_{32}H_{11}H_{17}}.
]

Define

[
D2_a=[a]+[a+57]-[2a]-[57],
qquad
N_a=[a]+[-a].
]

Exact free-vector reduction gives

[
oxed{
log(J_W/J_f)-log(S)
=
D2_7+D2_{22}-D2_{23}-D2_{56}+N_1-N_2.
}
]

The four (D2) edges contribute

[
-2(7+22-23-56)=100
]

to the exponent of (chi_{114}(2)).

This is the exact duplication compiler edge.

## 3. Forward-corrected complete finite Artin target

The pre-2026-09-26 compiler packet recorded the finite twist

[
A(2,100)otimes A(3,3)otimes A(19,38)otimes A(q,57),
qquad q=7-zeta_3.
]

The level-57 sign-normalization repair remains valid: the Aoki/Yamamoto gap sign is

[
A(3q,57)=A(3(7-zeta_3),57).
]

However, the exact (114	o57) word also contains the even-level reflection quotient

[
+N_1-N_2.
]

A characteristic-zero Fermat reflection contributes the Kummer factor (A(-1,a)).
Therefore the signed quotient contributes

[
A(-1,1)otimes A(-1,2)^{ee}=A(-1,1)
]

on the quadratic quotient. This factor was invisible in the (p=229) calibration
because (chi_{114}(-1)=1) there.

The committed exact (p=571) Jacobi-sum counterprobe detects precisely this missing
factor: the old global twist is off by (-1=chi_{114}(-1)), while adding
(chi_{114}(-1)) closes the discrepancy in two independent cyclotomic reductions.

Using Kummer-motive multiplicativity for the already-corrected level-57 part,

[
A(3,60)otimes A(3q,57)
=
A(3,117)otimes A(q,57)
=
A(3,3)otimes A(q,57),
]

because (117equiv3pmod{114}).

Hence the current full finite compiler target is

[
oxed{
A_{m full}
=
A(-1,1)otimes
A(2,100)otimes
A(3,60)otimes
A(19,38)otimes
A(3(7-zeta_3),57).
}
]

The factor (A(3(7-zeta_3),57)) is the corrected level-57 gap sign.
The additional (A(-1,1)) belongs specifically to the even-level (114	o57)
reflection/descent seam.

Over a base containing a (114)-th root of (-1) (for example after adjoining
(zeta_{228})) the (A(-1,1)) factor trivializes. It must nevertheless remain
explicit in the current MOT-1 descent/Galois bookkeeping.

Thus the compiler target is now completely named subject to the remaining
composition audit.

## 4. Compiler state

The current chain is:

[
oxed{
	ext{explicit plane projector }P_f
	o
	ext{114->57 D2/reflection edges}
	o
	ext{level-57 multiplication/reflection edges}
	o
A_{m standard}
otimes
A(3(7-zeta_3),57)
	o
	ext{W114}.
}
]

Already admitted correspondence primitives now include:

- W114 Katsura-Shioda recursive graph correspondences;
- explicit twisted-curve carrier for the corrected quadratic Artin factor;
- motive-level lift of every generator family in the compact standard word;
- explicit (n=3) open finite transfer with exact degree/projector normalization.

Still missing:

> one composed projective Chow cycle carrying (z_f) through the full compiler and
> landing nontrivially in the W114 projector.

That is now the single load-bearing construction.

## Claim ceiling

```text
EXPLICIT_SOURCE_AND_TARGET != COMPOSED_CHOW_CORRESPONDENCE
EXACT_DUPLICATION_WORD != COMPILED_MOTIVE_MAP
LEVEL57_SIGN != FULL_114_DUPLICATION_SIGN
ARTIN_TARGET_EXPLICIT != MOT_1_CLOSED
MOT_1 REMAINS OPEN
```
