# W114: a Chow tensor-square bound on the exceptional line

**MOT-1 REMAINS OPEN.** The arithmetic square-word trial is now compiled into
an explicit nonzero Chow correspondence with a normalized inverse. It gives
an order-two bound on the untwisted exceptional residual line. It does not
extract or identify the corrected quadratic Artin root.

This is a separate continuation of the
[standard join construction](W114_STANDARD_JOIN_COMPOSITION_2026-09-30.md)
and [full W114 standard reduction](W114_FULL_STANDARD_REDUCTION_2026-09-30.md).
The source and inverse are explicit incidences and finite-carrier projectors.
The p=19 nonvanishing/intersection input is Aoki's standard-cycle theorem;
an independent p=19 Jacobian computation is not claimed.

## The exact positive word

Let A=h^16(F57^16)^T_A and M=A(-8). The bounded integer solver proposed
the following identity, which the native checker recomputes with integers:

\[
2T_A+\gamma_{19,2}
=\sum_{a\in Q}\gamma_{3,a}+\sum_{b\in R}R_b,
\]

where

\[
Q=(1,4,5,6,7,9,11,16,17),\quad
R=(1,2,4,7,8,14,16,19,25,28),
\]
\[
\gamma_{19,2}=(2,5,8,\ldots,56,19),\qquad R_b=(b,-b)\pmod{57}.
\]

Both sides have 56 positive labels and define sectors of F57^54. Their
coordinate permutation and its inverse are emitted, with covariance at all
36 units. The solver proposal remains in
`evidence/w114-standard-composition-20260930/square-word-solver.json`; the
runtime checker does not depend on SciPy or an unverified floating solution.

## The explicit 19-standard cycle and carrier

In P^19, set rho^3=-19 and define Y by

\[
\sum_{j=0}^{18}x_j^{3k}=0\quad(1\le k\le9),\qquad
x_{19}^{19}-\rho\prod_{j=0}^{18}x_j=0.
\]

These are Aoki's p=19,m=57,d=3 equations. With u_j=x_j^3, Newton identities
give p19=19*e19 once p1,...,p9 vanish: the elementary symmetric functions
e1,...,e9 vanish, and no product of two surviving elementary degrees is at
most 19. Therefore sum x_j^57=19*product x_j^3; the last equation gives
x19^57=-19*product x_j^3. This proves containment in F57^18. The native
integer-polynomial Newton recurrence checks this identity directly.

Aoki Theorem 2.1 supplies its dimension 9 and nonzero projected class for
gamma19,2 (gcd(2,3)=1), as well as the w-class intersection
-19^17*57^19. This is theorem-use, not independent reproof.

The carrier E3=K(rho) has degree three. The ramified valuation v_K(19)=18
alone cannot establish this. Instead, if a cube root of -19 lay in cyclotomic
K, its irreducible non-Galois cubic field over Q would be an intermediate
field of the abelian extension K/Q. Every such intermediate field is Galois,
which is impossible. This applies to every root.

The action rho -> zeta3*rho is realized by x19 -> zeta57*x19, with homological
gamma19,2 eigenvalue zeta3. Thus the source is
`A_57(-19,19)(9)`. The explicit finite-carrier change rho -> -rho identifies
it with `A_57(19,19)(9)`; -1 is a cube. The carrier source is fixed here,
including its character order, rather than guessed from a square eigenvalue.

Fixing the x0 diagonal phase, preservation of the first equation forces all
other first-block phases to be multiples of 19. There are 3^18 choices. The
last equation forces m19=sum(m_j/19) mod3 and leaves 19 choices. Thus

\[
|G_Y|=3^{18}19,\quad [G:G_Y]=3\,19^{18},\quad
c_{19}=-\frac{19^{17}57^{19}}{(3\,19^{18})^2}=-3^{17}.
\]

The family Gamma19 in E3 x F57^18 gives

\[
F_{19}:A_{57}(19,19)(9)\to h^{18}(F_{57}^{18})^{\gamma_{19,2}},
\qquad
G_{19}=\frac1{3c_{19}}e_\xi[\Gamma_{19}]^t e_\gamma.
\]

The factor three is the finite-carrier projector normalization. Both round
trips are one, with the second identity using OY Fermat invertibility and
scalar endomorphisms. Every conjugate character has Tate grade nine.

## The right cycle and the compiled square

Join the nine explicit rho3^19=-3 standard divisors from Q with the ten
[-1:1] point cycles from R. Their projected pairings are -19 and 1/57.
The standard-divisor checker verifies the dual-pullback coefficients, Kummer
characters and -19 pairing for these additional nine labels at all 36 units.
All divisors use the same root rho3.

Since sum(Q)=76, the total rho3 character is trivial: -76=0 mod19.
The projected joined cycle therefore descends to K via (1/19) trace without
changing its geometric fiber. This is a group-action identity in Chow.
It supplies a cycle Z on F57^54, of dimension 27, with

\[
F_Z:\Lambda(27)\to h^{54}(F_{57}^{54})^Z,\qquad
c_Z=(-57)^{18}(-19)^9(1/57)^{10}=-57^8 19^9,
\]

and inverse G_Z=(1/c_Z)[Z]^t e_Z.

Apply the primitive join twice on the left, first to A,A and then to that
sector and gamma19,2. The twists and common carrier are

\[
A\otimes A\otimes A_{57}(19,19)(11)
\xrightarrow{L}h^{54}(F_{57}^{54})^{2T_A+\gamma_{19,2}}
\xrightarrow{P}h^{54}(F_{57}^{54})^Z
\xrightarrow{G_Z}\Lambda(27).
\]

This is the explicit correspondence Theta; its reverse is the reversed
sequence of normalized inverse maps. The aggregate inverse for L is
`1/(57^2*3*c19)`, so multiplying by the two join scalars and the carrier
pairing gives one. Both weights are 54. The support is F57^16 x F57^16 x E3
and the correspondence has cycle dimension 16. The endpoint permutation,
all conjugate grades, and both scalar identities are checked.

Cancelling the finite Artin and Tate factors gives

\[
M^{\otimes2}\simeq A_{57}(19,38)=A_{114}(19,76).
\]

Consequently

\[
N=M\otimes A_{114}(19,76),\qquad N^{\otimes2}\simeq\Lambda.
\]

This is an actual Chow tensor-order bound, stronger than the previously
verified Gauss-word square. It is nonzero in Betti and de Rham realization.

## The unresolved unsquared root

MOT-1 still requires a nonzero explicit map

\[
N\longrightarrow A_{114}(3(7-\zeta_3),57)
\]

with the corrected quadratic Galois sign and its inverse. Neither Theta nor
its scalar inverse emits this map. Trivial and sign representations of mu2
have the same square but no nonzero equivariant map between them; a tensor
square cannot select the root. No theorem identifying all tensor-order-two
Chow lines with an explicit finite Artin cycle is invoked here. Invoking an
Artin-Tate Picard classification before establishing membership would assume
the missing step.

There is also a verified obstruction to attempting the unsquared arrow through
the same standard-word family. The mod-two linear functional summing residues
`(17,21,26,31,36,40)` vanishes on all 56 reflection words, all 54 admitted
3-standard words (a not divisible by 19), and all 38 admitted 19-standard
words (a not divisible by 3), but takes value one on alpha_Aoki. The checker
evaluates all 148 generators. Thus no integer combination of those words
equals the unsquared Aoki word. Negative coefficients do not remove this
obstruction. This is an exact countercertificate for that free-word ansatz;
it does not exclude mixed algebraic cycles or other motivic relation families.

The quadratic field carrier and arithmetic sign corrections remain separately
verified. The outstanding task is a cycle on the product of that finite carrier
and the exceptional Fermat character support whose dual-pullback component is
nonzero and transforms with the corrected sign. Its pairing must then give the
finite-carrier inverse normalization. The current search has not produced that
cycle; it does not assert that other cycle constructions are impossible.

Native implementation: [w114_aoki_square.py](w114_aoki_square.py).
Tests: [test_w114_aoki_square.py](test_w114_aoki_square.py). The bounded result
retains forged-root, wrong-scalar and wrong-cycle-dimension counterprobes.
The exact source documents and input hashes are preserved in the linked standard
divisor provenance and the new evidence directory.

Review is self-review. Theorem-use is not independent reproof. No general Hodge
conjecture proof or independent reproof of published Fermat fourfold results is
claimed. **MOT-1 REMAINS OPEN** at this unsquared quadratic correspondence.

The final default-branch refresh is `0bb90fe9a655715163711c1a8df7f06a78dfb495`.
Its five changes are confined to Atlas statistics and coverage. They are carried
unchanged into the continuation and retained as a commit parent; no W114 source
changed between the two default pins. The earlier default pin remains historical
provenance, rather than being overwritten.

Primary mathematical source bindings, inspected versions and PDF hashes are in
[the standard-divisor source table](W114_STANDARD_DIVISOR_CONSTRUCTION_2026-09-30.md#sources-audit-and-reproducibility).
The current run records those hashes plus the exact Stacks Gysin/projective-bundle
pages used in the join proof.
