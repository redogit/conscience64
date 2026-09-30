# W114 MOT-1: explicit characteristic-zero standard cycles

**MOT-1 REMAINS OPEN.** This continuation constructs four nonzero standard
divisor correspondences and one joined padding correspondence. It does not
construct the exceptional residual-to-quadratic-Artin arrow, nor push the
level-57 plane into the W114 sector.

Ancestry: current default main `e97a0cdf615996aa3dd792b08d4bf37547b5080f`,
reconciled with the bounded-composition checkpoint
`5f72db12dece00960103112dfe79e931d8b391f9` from PR #224. Main's intervening
changes concern the invariant atlas. Both parents are retained. Before edits,
re-read issue #99 and its correspondence, Artin-carrier, compiler-endpoint,
standard-word, sign-normalization, n=3 transfer, projective-closure and proof-graph
records. The graph's MOT-1 node remains OPEN. The later projective closure
already closes the n=3 boundary seam for a=4,11,16,17 under its cited theorems.
This packet adds actual standard cycles to the earlier transfer audit.

## Exact claim and conventions

In homological `Chow(K,Lambda)`, `K=Lambda=Q(zeta_57)=Q(zeta_114)`, let
`gamma_a=(a,a+19,a+38,-3a) mod 57`, for a=4,11,16,17. Use the all-plus
projective Fermat surface `X: sum x_i^57=0`. A graph acts by pushforward;
composition is rightmost first. Explicitly,

\[
e_\chi=|G|^{-1}\sum_{g\in G}\chi(g)^{-1}[\Gamma_g],\qquad
g_*e_\chi=\chi(g)e_\chi.
\]

Thus a cycle in homological sector gamma has its Poincare-dual residue form
in the cohomological **pullback sector -gamma**. The checker uses the coefficient
of `x^(-gamma-1)` for that homological sector. This distinction is essential:
the historical plane-projector variance correction is retained in PR #224.

`Lambda(r)` denotes the covariant Tate object, with Frobenius factor p^r.
`A(3,k)` uses the repository's covariant Kummer/Frobenius character convention.
The claim is an isomorphism, with explicitly normalized cycle maps,

\[
A(3,-3a)(1)\ \longleftrightarrow\ h^2(X)^{\gamma_a}.
\]

This is theorem-dependent mathematics, not a software certification of arbitrary
Chow equalities. The independent computation is exact polynomial arithmetic.

## The actual curve and its field

Let `E=Spec K[rho]/(rho^19+3)`. This is a cyclic degree-19 extension: at a
prime above 3 in K the valuation of 3 is 2, so 3 cannot be a nineteenth power.
K contains mu_19. Changing rho to -rho identifies the radicand -3 with 3.
Define the curve

\[
D_\rho:\quad
f_1=x_0^{19}+x_1^{19}+x_2^{19}=0,\qquad
f_2=x_3^3-\rho x_0x_1x_2=0.
\]

Put `s_i=x_i^19`, `U=x3^3`, `V=rho*x0*x1*x2`, and

\[
g_1=\sum_{i=0}^2s_i^2-\sum_{i<j}s_i s_j,\qquad
g_2=\sum_{j=0}^{18}U^{18-j}V^j.
\]

The checker expands **exactly** `F57=f1*g1+f2*g2` using rho^19=-3.
Using rho^19=+3 is a retained failed counterprobe.

The ideal (f1,f2) is a reduced complete intersection. In fact D is smooth:
when x3 is nonzero, the x3 derivative of f2 is nonzero and f1 has a nonzero
gradient. When x3=0, exactly one of x0,x1,x2 vanishes; f2 has nonzero derivative
in that coordinate, whereas f1 has nonzero derivative in another coordinate.
Two vanishing coordinates would force all coordinates to vanish. Irreducibility
also follows from the degree-three Kummer cover of the smooth degree-19 plane
curve: the product x0*x1*x2 has simple zeros, hence is not a cube in its function
field. The degree is 57.

## Nonzero realization and two pairing calculations

Compute `P_D=det Jac(f1,g1,f2,g2)` in

\[
\mathbb Q[\rho,x_0,\ldots,x_3]/
(\rho^{19}+3,x_0^{56},\ldots,x_3^{56}).
\]

The result has 108 terms, all of degree 110. No floating-point arithmetic,
numerical root recognition or presumed Gauss identity enters this calculation.
For the four generators:

| a | gamma_a | coefficient in pullback sector gamma_a | coefficient in pullback sector -gamma_a |
|---|---|---|---|
| 4 | (4,23,42,45) | -61731 rho^4 | 61731 rho^15 |
| 11 | (11,30,49,24) | -61731 rho^11 | 61731 rho^8 |
| 16 | (16,35,54,9) | -61731 rho^16 | 61731 rho^3 |
| 17 | (17,36,55,6) | -61731 rho^17 | 61731 rho^2 |

Villaflor's complete-intersection cycle-class formula makes each nonzero
coefficient a nonzero primitive de Rham class of the constructed curve. All 36
unit conjugates of each homological sector are checked; their residue grade is
2 and their rho exponent is -au modulo 19.

First pairing path: in `G=mu_57^4/diagonal`, set the x0 phase to zero.
The stabilizer of D is defined by
`m1=m2=0 mod 3`, `3*m3=m1+m2 mod 57`.
Exact enumeration gives |G_D|=1083, |G|=57^3, and orbit index 171.
Aoki's normalization `w_gamma=[G:G_D] e_gamma[D]` and his Theorem 2.1 give

\[
\langle w_\gamma,w_{-\gamma}\rangle=-3\cdot57^3,\qquad
\langle z_\gamma,z_{-\gamma}\rangle=-19.
\]

Second pairing path: multiply the two projected Jacobian polynomials.
Their socle coefficient is `3*61731^2=11432149083` in
`(x0*x1*x2*x3)^55`. Since `det Hess(F57)=(57*56)^4 (x0*x1*x2*x3)^55`,
Villaflor's Corollary 8.1 yields

\[
\langle z_\gamma,z_{-\gamma}\rangle
=-\frac{11432149083}{57^5}=-19.
\]

The two paths use different external formulas. They are not independent
reproofs of either theorem. Software recomputes the polynomial, stabilizer and
scalar; the geometric interpretation is an authenticated external leaf.

## Galois action and the relative correspondence inverse

Set rho_j=zeta_19^j rho. Scaling x3 by zeta_57^j sends D_rho to D_rho_j.
Hence `z_j=e_gamma[D_rho_j]=xi^j z_0`, where
`xi=zeta_19^(-a)`. This agrees with A(3,-3a). It describes a Kummer action
over K and unit covariance over Q; it does not assert descent of an individual
sector to Q.

Let `Gamma` be the family D inside `E x X`, and
`v_a=(1/19) sum_j xi^(-j)[rho_j]`. Then

\[
F_a=e_\gamma[\Gamma]e_\xi:\quad v_a\longmapsto z_0.
\]

The source carries the Tate twist 1, so this one-dimensional family cycle has
the correct correspondence degree. Its unscaled reverse sends

\[
z_0\longmapsto\sum_j\langle z_0,D_j\rangle[\rho_j]
=19(-19)v_a=-361v_a.
\]

Consequently

\[
G_a=-\frac1{361}e_\xi[\Gamma]^t e_\gamma
\]

has `G_a F_a=1`. Endomorphisms of the finite Artin line are scalars. OY
Proposition 4.11 gives invertibility of the admitted Fermat sector, hence its
endomorphisms are scalars too; the nonzero forward map then gives `F_a G_a=1`.
There is no assumption that equality of arbitrary realizations implies equality
of arbitrary Chow morphisms. The scalar conclusion uses these particular
invertible objects and `End(1)=Lambda`.

Omitting the finite-carrier factor 19 gives round trip 19. Reversing the sign
gives -1. Both counterprobes are rejected and preserved by the tests.
Direct ternary Jacobi sums at p=229,571 independently agree with
`p*chi_57(3)^(-3a)` for each of the four sectors. These eight exact finite
checks are corroboration, not a proof over all primes.

## A nonzero padding cycle for the actual standard relation

Convert negative Gauss coefficients to positive projective tuples with the five
reflection pairs at b=23,29,32,11,17. This produces actual proposed carriers

`T_S=(1,7,22,39,43,34,28,25,46,40)` on F57^8, normalized by (-4), and
`T_A=H1 concatenated with -3*H1` on F57^16, normalized by (-8).

Every unit conjugate has grade 5 and 9 respectively. This only identifies
their (4,4) and (8,8) Hodge types; it does not construct an algebraic cycle in
either exceptional sector. The exact positive identity is

\[
T_S+\sum_{a=4,11,16,17}\gamma_a+R25+R28
=T_A+R22+\sum_{b=23,29,32,11,17}Rb.
\]

Both sides have the same 30 labels, checked as multisets. On the left, construct
the padding B by joining four copies of D_rho and two points (-1:1), projecting
to the character `(gamma4,gamma11,gamma16,gamma17,25,32,28,29)`.
This is a reduced complete intersection with ten equations in P^19, on F57^18.
Its cycle dimension is 9. Its Jacobian determinant is block diagonal; the
projected coefficient is `141541637366380573382787 rho^9`, which is nonzero.

The pairing formula gives one factor -57 per join, so

\[
c_B=(-57)^5(-19)^4(1/57)^2=-24134536953.
\]

Using the **same** rho in all four factors puts the family over E, of degree 19;
it does not require a degree 19^4 carrier. Its Galois character is
zeta_19^9, that is A(3,27). The family gives explicit mutually inverse maps

\[
A(3,27)(9)\ \longleftrightarrow\ h^{18}(F57^{18})^B,
\qquad G_B=\frac1{19c_B}e_\kappa[\Gamma_B]^t e_B.
\]

The inverse scale is `-1/458556202107`. Nonzero realization and all 36 Hodge
and Galois character conjugates are checked. This is a genuine algebraic padding
cycle, not a cycle in the exceptional Aoki sector.

## Executed routes and the remaining implication

| Route | Executed discriminator and result | Boundary / continuation |
|---|---|---|
| Curve duality shortcut | All six pairs of the four committed W114 KS factors tested at all 36 units; mismatch counts 8,8,12,12,16,16 | No pair contracts by an ordinary divisor throughout the orbit; other decompositions remain possible |
| Explicit standard cycles | Four D_rho projections, pairing by two methods, Kummer maps and joined padding constructed | Complete for these leaves; not the exceptional arrow |
| Direct standard surface plus point | Every admitted degree-114 2-standard and 3-standard quartet tested with a complementary pair, up to permutation; 112 and 111 parameters, zero hits | Closes this ansatz only; does not exclude mixed or higher cycles |
| Exact theorem transfer | OY characteristic-zero multiplication and its final Picard discussion, Aoki standard-cycle theorem, Kang Cor. 3.2 and current length-reduction preprint read | Existence and relation-family results do not emit the required exceptional equations or normalized W114 correspondence |

Kang Corollary 3.2 states a Hodge-conjecture existence result for Fermat
fourfolds of arbitrary degree **over C**. We do not mislabel that special family
as an open Hodge-conjecture instance. It supplies no specified cycle for this
eigenspace, finite Kummer descent, or correspondence inverse. This continuation
does not independently reprove Kang's theorem. The 2026 length-reduction
preprint also cites it; that citation is not an explicit cycle construction.
OY's final discussion treats exceptional integral Gauss relations as further
motivic work. Its standard multiplication theorem does not provide the Aoki
arrow automatically. General Picard results for Artin-Tate subcategories would
also require proving that this exceptional object belongs to that subcategory.

The next composition is now concrete: form join incidence maps into the common
F57^28 sector, using B on the left and the linear padding
`C=(R22,R23,R29,R32,R11,R17)` on the right, then the checked coordinate
permutation. Geometrically each join incidence is the image of the projective
bundle of `O(-1) direct-sum O(-1)` over the product. Its inputs contain the
still exceptional T_S and T_A sectors. This packet does **not** declare those
two join incidence maps and inverse scalars verified: applying a formula stated
for two algebraic input cycles while assuming either exceptional class algebraic
would be circular. The all-input primitive correspondence calculation must be
proved or traced through Shioda's exceptional-centre maps before promotion.

Even a successful standard reduction would still need the explicit nonzero map
from the normalized T_A sector to `A(19,38) A(3(7-zeta_3),57)`. Preserve the
corrected factor 3 in the quadratic radicand. Tensor-square or realization
relations do not themselves construct that map. This remains the load-bearing
MOT-1 gap; no route is declared impossible or globally exhausted.

## Sources, audit, and reproducibility

Primary sources inspected locally; full copyrighted PDFs are not bundled:

| Source | Exact use | PDF SHA-256 |
|---|---|---|
| [Aoki 1987](https://doi.org/10.2969/jmsj/03930385), introduction and Thm. 2.1, Prop. 3.1 | Projector/orbit normalization and standard cycle intersection | b11299f26a52695a0871c25697769cf6146b7a2141b5ac07d3b8661e86209083 |
| [Villaflor 2022](https://doi.org/10.1007/s00229-021-01290-x), arXiv 1812.03964v5, Thm. 1.1, Cor. 8.1 | CI primitive class and cup product | 2991527af2d2ef9667624bc210aa1327fd652bcb0bff6a71d56822be5e383cab |
| [OY 2026](https://doi.org/10.5802/afst.1842), Prop. 4.11, final discussion | Invertibility; exceptional-relation applicability boundary | ea6b50a6238c119858c7ff8cb25a1008ecd78e5f72bbbedf300f73390f0f1093 |
| [Kang 2016](https://doi.org/10.1017/S0004972715001379), Cor. 3.2 | Existence statement over C, not an explicit MOT-1 leaf | 118e597e3dcb3c57dbe4faf93006713308375294b8e8099deef77fcba7d668cf |
| [Lengths of Hodge cycles](https://arxiv.org/abs/2609.27301), PDF v2 dated 26 Sep 2026 | Length reduction and its cited fourfold existence result | f59119cf4be93cb217c9b2acb8a8444b6d96332decd3e0e31dd90f16a563c2f9 |

The join-period preprint arXiv 2312.17222v4, Theorem 1.2, was also inspected
to audit the proposed continuation's algebraic-input hypothesis. It is not used
to certify the uncompiled exceptional-input incidence maps.

Self-review verdict for the original MOT-1 claim: **incomplete, with the explicit
exceptional arrow missing**. Bounded standard-cycle claim: externally proved
geometric formulas in the required range, with exact independently recomputed
coefficients, stabilizers, Kummer actions and inverse scalars. No fresh-agent
independent review is claimed. Nonzero coefficient, finite realization matching,
theorem use and independent reproof remain distinct.

Run `python research/hodge/w114_standard_divisors.py` and
`python -m unittest discover -s research/hodge -p 'test*.py'`.
The linked evidence directory preserves input hashes, the exact result and the
failed counterprobes. No Hodge-conjecture proof is claimed by this project.
