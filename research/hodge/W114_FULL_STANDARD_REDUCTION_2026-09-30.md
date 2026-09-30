# W114: the full standard reduction and explicit plane padding

**MOT-1 REMAINS OPEN.** This packet constructs a nonzero Chow isomorphism from
the W114 character motive to the normalized exceptional Aoki character motive,
with the standard Kummer factors. It does not construct the remaining exceptional
map to the corrected quadratic Artin carrier. In particular it does not claim
an algebraic W114 cycle obtained by pushing the plane through that missing map.

The starting pins are current default main
`e97a0cdf615996aa3dd792b08d4bf37547b5080f`, prior bounded transfer checkpoint
`5f72db12dece00960103112dfe79e931d8b391f9`, and the standard-divisor checkpoint
`389c1b705d1af91cdc0e6d3ffd6c14d0133597c0` retaining both as parents. The later
n=3 projective-closure artifacts already close their boundary seam under OY
localization and fully faithful Chow embedding. That result remains theorem-use,
not an independent reproof; the historical open packet is not the latest status.

The primitive join self-intersection calculation in
[the standard composition packet](W114_STANDARD_JOIN_COMPOSITION_2026-09-30.md)
works for every degree d>1. Its scalar is -d, its reverse uses the unprojected
incidence transpose with the named endpoint projectors, and its inverse is
(-1/d) times that reverse. The calculation is in Chow, before realization.

## The duplication divisors

Work over K=Q(zeta_57)=Q(zeta_114), with Lambda=K. Set rho^57=2 and i^2=-1.
The finite extension E114=K(rho,i) has degree 114: v_K(2)=1 proves the
57th-root extension has degree 57, and the quadratic i-extension is independent
of that odd extension. On the all-plus F114^2 define

\[
f_1=x_0^{57}+x_1^{57}+i x_3^{57},\qquad
f_2=x_2^2-\rho x_0x_1.
\]

The companions are

\[
g_1=x_0^{57}+x_1^{57}-i x_3^{57},\qquad
g_2=\sum_{j=0}^{56}x_2^{2(56-j)}(\rho x_0x_1)^j.
\]

They give the exact identity F114=f1*g1+f2*g2. The complete intersection
is smooth: at x2!=0 the f2 derivative is independent of the nonzero f1
gradient; at x2=0 one of x0,x1 vanishes and the other and x3 are nonzero,
so the gradients remain independent. Both x0 and x1 cannot vanish on the
intersection. It is irreducible since the double cover of the smooth plane
curve f1=0 has simple ramification on x0*x1=0.

For a=7,22,23,56 put

\[
\gamma_{2,a}=(a,a+57,-2a,57)\pmod{114}.
\]

The sparse determinant det Jac(f1,g1,f2,g2) reduces to 112 terms of degree
224 modulo (x0^113,...,x3^113). For the base labels its cohomological
coefficients are -740772*rho^a*i in gamma2,a and
+740772*rho^(57-a)*i in -gamma2,a. The homological projector e_gamma selects
the **dual pullback** class. The native checker checks nonzero coefficients,
their rho/i characters, Hodge grade 2, and the projected pairing at all 36
units. The socle coefficient is 1097486311968, giving

\[
c_2=-\frac{1097486311968}{114^5}=-57.
\]

This uses Villaflor's CI class and primitive intersection formulas. Aoki
Remark 2.2 independently supplies the same normalization: diagonal stabilizer
size 57^2*2 gives index 228, and -2*114^3/228^2=-57. The coordinates here put
the quadratic equation in x2 and the i coefficient in x3, which fixes the
last two character labels explicitly.

The family Gamma2 in E114 x F114^2 gives

\[
F_a:A_{114}(2,-2a)\otimes A_{114}(-1,57)(1)
\longrightarrow h^2(F_{114}^2)^{\gamma_{2,a}}.
\]

The action rho -> zeta57*rho is realized by x2 -> zeta114*x2, with homological
eigenvalue zeta57^(-a). The action i -> -i is realized by x3 -> -x3, with
eigenvalue -1. The inverse is

\[
G_a=-\frac1{6498}\,e_\xi[\Gamma_2]^t e_{\gamma_{2,a}},
\qquad 6498=114\cdot57.
\]

The finite-carrier factor 114 is separate from the projected pairing -57.
The round trip is 114*(-57)*(-1/6498)=1. The other Chow identity follows
from invertibility and scalar endomorphisms of the target Fermat character
(OY Prop. 4.11), not from arbitrary realization faithfulness.

## The explicit plane and the power maps

Let f=(29,11,17,28,40,46) and
L: x0+x3=x1+x5=x2+x4=0 on F57^4. Its homological projected class z_f has
pairing (z_f,z_-f)=1/57, using the corrected source-times-target convention.
The coordinate-square map q4:F114^4 -> F57^4 has degree 32. Its kernel is
mu2^6/diagonal_mu2; the character 2f is trivial on that kernel. Thus
q4^* and q4_*/32 are mutually inverse on the named character sectors.

The explicit pulled-back plane cycle is

\[
e_{2f}\,q_4^*[L],\qquad
x_0^2+x_3^2=x_1^2+x_5^2=x_2^2+x_4^2=0.
\]

Its projected pairing is 32/57, and its inverse is (57/32) times the
unprojected pulled-back cycle transpose followed by e_2f. The eight linear
components over K(i) need not be individually descended; the entire pullback
is defined over K. The checker retains degree-16 as a rejected counterprobe.

Similarly q8:F114^8 -> F57^8 has degree 512. Its projected inverse is q8_*/512
on the doubled residual tuple. These are genuine finite-cover correspondences;
the characteristic-p Artin-Schreier reflection primitive is not substituted
into characteristic zero.

## The signed word compiled through one common carrier

Write W=(1,7,78,79,86,91), R_b=(b,-b) mod114, and S114=2*T_S. The exact
28-label positive identity is

\[
W+\gamma_{2,23}+\gamma_{2,56}+2R_{22}+R_{56}+R_{50}+R_{34}+R_{14}+R_{44}
=2f+S114+\gamma_{2,7}+\gamma_{2,22}+R_1+R_{23}.
\]

The checker verifies this equality in the free integer character module and
emits the explicit coordinate permutation and its inverse. It separately
recomputes the requested ordered word
`D2_7 + D2_22 - D2_23 - D2_56 + N_1 - N_2`, with each signed direction
recorded. Here gamma2,a = D2,a + R_(2a) + R_57. Reflection and denominator
paddings convert the signed word to the displayed positive identity.
The same-psi reflection phase chi114(-1) is cancelled by the all-plus Fermat
coefficient, as in the previous exact arithmetic audit. No inverse is silently
replaced by a forward graph. Negative D2 terms are supplied on the left;
positive D2 terms are inverted when returning from the right common carrier.
This is the tensor-stabilized composition of the word, rather than an assertion
that six curve transfers act sequentially on the bare fourfold object.

Construct the left and right projected padding cycles by iterated joins of
the indicated duplication divisors, plane, and point cycles. A point cycle for
R_b is e_Rb[i:1], with pairing 1/114 and i-conjugation eigenvalue (-1)^b.

| Padding | Source | Dimension / cycle dimension | Pairing |
|---|---|---|---|
| B_left | A114(2,70)(10) | 20 / 10 | c_left=370386 |
| B_right | A114(2,56)(8) | 16 / 8 | c_right=23704704 |

All divisors in a padding share the same rho and i. The total i-character
is trivial on both sides: two divisor signs plus an even total point-label
sum. Taking (1/2) trace E114/E57 therefore descends the projected padding to
E57=K(rho), with its original geometric fiber. This is an exact Chow projector
calculation, not only a realization check. It does not double the fiber class.
The rho exponents are 35 and 28, corresponding to order-114 Kummer exponents
70 and 56. All 36 conjugate padding characters have their indicated Tate grades.

The join pairing rule gives

\[
c_{\mathrm{left}}=(-114)^8(-57)^2(1/114)^7=370386,
\]
\[
c_{\mathrm{right}}=(-114)^4(32/57)(-57)^2(1/114)^2=23704704.
\]

Each padding family's inverse is `1/(57*c_padding)` times its reverse
unprojected incidence, sandwiched by the endpoint projectors. Joining W to
B_left and S114 to B_right produces two isomorphisms into F114^26. Put

\[
L=J_{W,B_l}(\mathrm{id}_W\otimes F_{B_l}),\qquad
R=J_{S114,B_r}(\mathrm{id}_{S114}\otimes F_{B_r}),\qquad
\Psi_{114}=R^{-1}PL.
\]

Here P is the emitted coordinate-permutation graph. Then

\[
\Psi_{114}:
h^4(F_{114}^4)^W\otimes A_{114}(2,70)(11)
\xrightarrow{\sim}
h^8(F_{114}^8)^{2T_S}\otimes A_{114}(2,56)(9).
\]

Its inverse is L^-1 P^-1 R. The aggregate left and right inverse scalars are
respectively -1/2406768228 and -1/154033166592; each multiplied by
(-114)*57*c_padding equals 1. Both weights are 26. The actual support is
F114^4 x E57 x F114^8 x E57 and the correspondence has cycle dimension 6.
Every conjugate permutation and twisted Hodge grade is checked.

Finite Artin tensor cancellation (OY Lemma 3.8), Tate cancellation, and q8
give the normalized statement

\[
h^4(F_{114}^4)^W\simeq
h^8(F_{57}^8)^{T_S}(-4)\otimes A_{114}(2,100)(2).
\]

Composing the earlier level-57 standard reduction yields

\[
h^4(F_{114}^4)^W\simeq
h^{16}(F_{57}^{16})^{T_A}(-8)
\otimes A_{114}(2,100)\otimes A_{114}(3,60)(2).
\]

This is nonzero, with both Chow inverse identities; the induced Betti and
de Rham maps are nonzero rank-one isomorphisms. No equality of Frobenius
eigenvalues is used as a replacement for these explicit Chow maps.

## The remaining MOT-1 arrow and evidence ceiling

The still missing factor is

\[
h^{16}(F_{57}^{16})^{T_A}(-8)
\longrightarrow A_{114}(19,38)\otimes A_{114}(3(7-\zeta_3),57).
\]

It needs an explicit nonzero correspondence with normalized inverse and the
quadratic descent sign. The known Aoki arithmetic eigenvalue, the corrected
quadratic field carrier, and the source-side Katsura-Shioda maps do not supply
that unsquared exceptional cycle. The plane now participates explicitly in
the verified padding; pushing it to a W114 cycle still requires this arrow.

Native code: [w114_full_standard_composition.py](w114_full_standard_composition.py).
Tests: [test_w114_full_standard_composition.py](test_w114_full_standard_composition.py).
Bounded run and input hashes are in `evidence/w114-standard-composition-20260930/`.
The previous failed curve-pair and standard-surface probes remain preserved.
New negative probes reject the wrong rho root, missing carrier degree,
wrong plane degree, and an asserted quadratic Artin target.

External inputs retain their cited scopes: Aoki standard-cycle intersection,
Villaflor CI class/intersection, OY blow-up, invertibility and finite Artin
tensor rules, and Stacks Gysin/projective-bundle formulas. The join normal
calculation and the assembled endpoints/scalars are derived here. Theorem-use
is not independent reproof. Review is self-review. This packet neither proves
the general Hodge conjecture nor independently reproves published Fermat
fourfold results; it does not declare MOT-1 closed.

The final default-branch refresh is `0bb90fe9a655715163711c1a8df7f06a78dfb495`.
Its five changes are confined to Atlas statistics and coverage. They are carried
unchanged into the continuation and retained as a commit parent; no W114 source
changed between the two default pins. The earlier default pin remains historical
provenance, rather than being overwritten.

Primary mathematical source bindings, inspected versions and PDF hashes are in
[the standard-divisor source table](W114_STANDARD_DIVISOR_CONSTRUCTION_2026-09-30.md#sources-audit-and-reproducibility).
The current run records those hashes plus the exact Stacks Gysin/projective-bundle
pages used in the join proof.
