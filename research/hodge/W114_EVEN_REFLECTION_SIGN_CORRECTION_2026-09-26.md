# W114 — forward correction: even-level reflection sign in the 114→57 compiler

**Date:** 2026-09-26  
**Status:** `EXACT_COUNTERPROBE / FORWARD_CORRECTION`

## 1. What was tested

The current compiler endpoint packet uses the exact free-vector identity

[
log(J_W/J_f)-log(S)
=
D2_7+D2_{22}-D2_{23}-D2_{56}+N_1-N_2.
]

The four (D2) terms produce the admitted (A(2,100)) factor.

The previous endpoint interpretation treated (N_1-N_2) as having no finite
residual contribution.

That interpretation is correct for the previously used (p=229) calibration,
where (chi_{114}(-1)=1), but it is not valid uniformly.

## 2. Exact finite-field counterprobe

The committed verifier computes the six-fold Jacobi sums directly by exact
additive convolution over (mathbf F_p). Cyclotomic values are evaluated by
exact ring maps

[
mathbf Z[zeta_{114}]	omathbf F_ell
]

with the image of (zeta_{114}) chosen to have exact order (114).

No floating-point root recognition is used.

### Calibration: (p=229)

The calculation reproduces the preserved exact identity:

[
J_{114,alpha}/J_{57,f}
=
chi_{114}(2)^{100}
chi_{114}(3)^3
chi_{114}(19)^{38}
chi_{114}(7-zeta_3)^{57}.
]

Here ((p-1)/114=2), so (chi_{114}(-1)=1).

### Counterprobe: (p=571)

Use the same normalization already present in the sign-correction verifier:

[
zeta_3mapsto109,qquad 7-zeta_3mapsto469.
]

Now ((571-1)/114=5) is odd, and exact reductions modulo both (229) and
(457) give

[
rac{J_{114,alpha}/J_{57,f}}
{chi_{114}(2)^{100}chi_{114}(3)^3
 chi_{114}(19)^{38}chi_{114}(7-zeta_3)^{57}}
=-1.
]

In both reductions this (-1) is exactly (chi_{114}(-1)).

Multiplying the recorded twist by (chi_{114}(-1)) makes the discrepancy
exactly (1).

Thus one exact residue-field counterexample already refutes the former global
identity, while the two independent cyclotomic reductions authenticate the
observed correction.

## 3. Geometric source of the sign

The current duplication word contains

[
+N_1-N_2.
]

For a characteristic-zero Fermat reflection, Proposition 4.11(iii) of
Otsubo–Yamazaki gives the Kummer-(-1) factor.  Therefore the signed quotient is

[
A(-1,1)otimes A(-1,2)^ee
=
A(-1,-1).
]

On the quadratic Kummer quotient only parity matters, so

[
oxed{A(-1,-1)=A(-1,1).}
]

This is exactly the factor detected by the (p=571) counterprobe.

## 4. Forward-corrected full finite twist

The full 114→57 compiler twist is therefore

[
oxed{
arepsilon_{m full}
=
chi_{114}(-1)
chi_{114}(2)^{100}
chi_{114}(3)^3
chi_{114}(19)^{38}
chi_{114}(7-zeta_3)^{57}.
}
]

After the already-admitted level-57 Aoki sign normalization, the corresponding
Artin/Kummer target is

[
oxed{
A(-1,1)otimes
A(2,100)otimes
A(3,60)otimes
A(19,38)otimes
A(3(7-zeta_3),57).
}
]

The level-57 corrected Aoki/Yamamoto sign

[
A(3(7-zeta_3),57)
]

is **unchanged**.  The new (A(-1,1)) factor belongs to the even-level
114→57 reflection/duplication seam.

## 5. Base-extension interpretation

Over a field containing a (114)-th root of (-1), for example after adjoining
(zeta_{228}), the factor (A(-1,1)) becomes trivial.

This explains why an algebraic correspondence constructed only after the usual
(2m)-th roots of unity are adjoined can miss the descent sign while remaining
valid after base change.

For the Hodge conjecture over (mathbf C), such a base extension is harmless
for existence.  For the current MOT-1 obligation, however, **Galois/descent
behavior is explicit**, so the factor must be retained.

## 6. Claim boundary

```text
P229_MATCH != GLOBAL_IDENTITY
P571_EXACT_COUNTEREXAMPLE => OLD_FULL_TWIST_REJECTED
LEVEL57_SIGN_CORRECTION REMAINS VALID
FULL_114_COMPILER_TARGET REQUIRES A(-1,1)
BASE_CHANGE_TRIVIALITY != DESCENT_TRIVIALITY
MOT-1 REMAINS OPEN
```
