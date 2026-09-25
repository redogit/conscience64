# W114 — Forward Correction: Aoki/Yamamoto Sign Normalization

**Date:** 2026-09-25  
**Status:** exact arithmetic correction; MOT-1 remains open.

## Why this note exists

The historical packet W114_RING_CLASS_ARTIN_FRONTIER_2026-09-19.md identified

\[
K_{57}L(3)=K_{57}\!\left(\sqrt{7-\zeta_3}\right)
\]

by combining the unique nonzero class in \(B_{57}/S_{57}\cong\mathbf Z/2\)
with an independently recovered Kummer factor \(7-\zeta_3\).

That inference was too strong:

\[
\text{UNIQUE GAP CLASS}\neq\text{UNIQUE QUADRATIC EXTENSION OF }K_{57}.
\]

The historical packet is preserved unchanged. This file is its forward correction.

## 1. Canonical Aoki generator versus the W114 residual

The W114 level-57 residual is

\[
\alpha_S=[1]+[7]+[22]+[39]+[43]-[23]-[29]-[32]-[11]-[17].
\]

For \(57=19\cdot3\), Aoki Proposition 4.1 uses

\[
\alpha_{\rm Aoki}=\eta+[-3]\eta_1.
\]

Here \([-3]\) is the **residue-label action**, not a negative coefficient.

The square subgroup is

\[
H_1=\{1,4,7,16,25,28,43,49,55\}.
\]

Thus \(\alpha_{\rm Aoki}\) has 18 positive labels \(H_1\cup(-3H_1)\).

The exact difference is

\[
\boxed{
\alpha_S-\alpha_{\rm Aoki}
=
R(22)-R(25)-R(28)
-\gamma_{3,4}-\gamma_{3,11}-\gamma_{3,16}-\gamma_{3,17}.
}
\]

The committed verifier checks this as an exact 56-coordinate equality.

## 2. The missing standard normalization

For odd \(m=57\),

\[
\tau(R(a))=p,
\]

and Aoki Proposition 2.8 gives

\[
\tau(\gamma_{3,a})=\eta(3)^{-3a}p^2.
\]

Therefore

\[
\boxed{
\tau(\alpha_S-\alpha_{\rm Aoki})=\eta(3)^{30}p^{-9}.
}
\]

For \(l_1=19,l_2=3\), Aoki Proposition 4.5 / Theorem 1.2 gives

\[
\tau(\alpha_{\rm Aoki})=
\varepsilon_{\rm Aoki}\eta(19)^{19}p^9.
\]

Hence

\[
\boxed{
S=\varepsilon_{\rm Aoki}\eta(3)^{30}\eta(19)^{19}.
}
\]

This is the standard normalization omitted by the historical field-identification argument.

## 3. Correct quadratic sign carrier

Write \(\eta=\chi_{114}^2\). The previously preserved exact expression for \(S\) is

\[
S=
\chi_{114}(3)^3
\chi_{114}(19)^{38}
\chi_{114}(7-\zeta_3)^{57}.
\]

But

\[
\eta(3)^{30}\eta(19)^{19}
=
\chi_{114}(3)^{60}\chi_{114}(19)^{38}.
\]

Therefore

\[
\varepsilon_{\rm Aoki}
=
\chi_{114}(3)^{-57}
\chi_{114}(7-\zeta_3)^{57}.
\]

Since \(-57\equiv57\pmod{114}\),

\[
\boxed{
\varepsilon_{\rm Aoki}
=
\chi_{114}\!\left(3(7-\zeta_3)\right)^{57}.
}
\]

Thus the Aoki/Yamamoto quadratic sign radicand is
\(3(7-\zeta_3)\), not \(7-\zeta_3\) alone.

## 4. Exact reconciliation with Aoki's ring-class field

Aoki Theorem 7.5 / Corollary 7.6 specialize at \(m=57\) to the
conductor-3 ring-class quadratic extension with square class

\[
d_A=-15-2\sqrt{57}.
\]

The exact cyclotomic verifier proves

\[
\boxed{
w^2(-15-2\sqrt{57})=3(7-\zeta_3)
}
\]

inside \(K_{57}=\mathbf Q(\zeta_{57})\), where
\(w=\sum_{k=0}^{35}w_k\zeta_{57}^k\) and the low-to-high coefficients are

    [-4, 0, 0, 2, 0, -4, 4, 0, 0, 4, -2, -4,
      2,-2, 0, 2, 0, -4, 2, 3, -4, 2, 0, -4,
      0, 4,-4, 2, 4, -2, 0, 0, -2, 2, 0, -4]

Therefore

\[
\boxed{
K_{57}L(3)
=
K_{57}\!\left(\sqrt{-15-2\sqrt{57}}\right)
=
K_{57}\!\left(\sqrt{3(7-\zeta_3)}\right).
}
\]

## 5. Independent prime-571 counterprobe

Take \(p=571\equiv1\pmod{57}\) and
\(\zeta_{57}\mapsto236\pmod{571}\). Then

\[
\zeta_3\mapsto109,\qquad q=7-\zeta_3\mapsto469.
\]

At this prime:

- \(q\) is a quadratic residue;
- \(3\) is a quadratic nonresidue;
- \(3q\equiv265\) is a nonresidue;
- with \(\sqrt{57}\mapsto253\), \(d_A\mapsto50\) is a nonresidue;
- \((3q)/d_A\equiv405=216^2\pmod{571}\).

So the finite-prime counterprobe agrees with the exact cyclotomic identity.

## 6. What survives unchanged

The correction does **not** invalidate the preserved full order-114
Hecke/Kummer expression

\[
\boxed{
\varepsilon_{\rm full}
=
\chi_{114}(2)^{100}
\chi_{114}(3)^3
\chi_{114}(19)^{38}
\chi_{114}(7-\zeta_3)^{57}.
}
\]

It only separates that expression into standard normalization and
the Aoki/Yamamoto quadratic sign:

\[
\chi(3)^3\chi(19)^{38}\chi(q)^{57}
=
\underbrace{\chi(3q)^{57}}_{\text{gap sign}}
\underbrace{\chi(3)^{60}\chi(19)^{38}}_{\text{standard normalization}}.
\]

So the old arithmetic carrier remains useful; its interpretation is corrected.

## 7. MOT-1 impact

The load-bearing residual Artin sign in the standard-normalized level-57 gap is now

\[
\boxed{
A_{\rm sign}=A\!\left(3(7-\zeta_3)\right).
}
\]

The historical \(q=7-\zeta_3\) coefficient/Kummer factor remains part of the
full order-114 twist, but is not by itself the Aoki/Yamamoto gap-sign field.

The motivic obligation becomes:

> Construct one explicit nonzero Chow correspondence from the W114 residual
> gap motive to the standard/Tate part tensored with the corrected quadratic
> Artin sign motive \(A_{\rm sign}\), while preserving the separate full
> order-114 Kummer carrier.

MOT-1 remains open.

## Evidence boundaries

    CORRECTED_SIGN_NORMALIZATION != CHOW_CORRESPONDENCE
    RING_CLASS_FIELD_IDENTIFICATION != HODGE_PROOF
    FULL_ORDER_114_KUMMER_FORMULA != QUADRATIC_GAP_SIGN_ALONE
    STANDARD_RELATION_EQUIVALENCE != EVIDENCE_TRANSFER
    HISTORICAL_PACKET_PRESERVED != HISTORICAL_CLAIM_STILL_CURRENT
