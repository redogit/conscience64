# W114: composition through the standard projective carriers

**MOT-1 REMAINS OPEN.** The standard reduction below is now an explicit nonzero
Chow correspondence with a normalized inverse. The exceptional Aoki-to-quadratic
Artin arrow remains unconstructed. This is a continuation of checkpoint
`389c1b705d1af91cdc0e6d3ffd6c14d0133597c0`, which itself retains current default
main `e97a0cdf615996aa3dd792b08d4bf37547b5080f` and prior bounded checkpoint
`5f72db12dece00960103112dfe79e931d8b391f9` as parents.

The earlier [divisor packet](W114_STANDARD_DIVISOR_CONSTRUCTION_2026-09-30.md)
left the incidence calculation open. The calculation here resolves that step
in Chow directly, without assuming algebraicity of the exceptional input classes.
Its earlier open statement is preserved as historical evidence at commit 389c1b7.

Use the previously declared homological conventions, including inverse endpoint
projectors. To avoid mixing character orders, write
`A_d(c,k)` for the order-d Kummer character. Thus

\[
A_{57}(c,k)=A_{114}(c,2k),\qquad
A_{57}(3,30)=A_{114}(3,60).
\]

The quadratic carrier is `A_114(3(7-zeta_3),57)`. An order-57 character alone
cannot encode that quadratic sign. The earlier packet's standard A(3,k) notation
always uses order 57; its exceptional target notation uses order 114.

## Primitive join self-intersection proof

Let X=F_d^n and Y=F_d^m, n,m nonnegative and even, d>1, with full projective
primitive characters alpha and beta. Every label is nonzero; each tuple sums to
zero modulo d. Put W=F_d^(n+m+2), with character eta=alpha concatenated with beta.
All three sectors are admitted invertible Fermat objects by OY Proposition 4.11.

Embed X and Y into the disjoint coordinate subspaces of W. Let
`pi: Wtilde -> W` be their blow-up. It is also the hypersurface

\[
\lambda^d F_X(x)+\mu^d F_Y(y)=0
\]

in the projective bundle of lines in
`O_{P^(n+1)}(-1) direct-sum O_{P^(m+1)}(-1)` over the product of the two
projective spaces. Its map to W is `[lambda x:mu y]`. On lambda=0 or mu=0
it has precisely the projective normal-direction fibers of the corresponding
blow-up. Off those sections the coordinate projections are inverse to this
construction. The centers are smooth and disjoint, so Wtilde is smooth.

Write `P_lines(L)` explicitly: it is `P_quot(L^dual)` in the quotient convention
used by Stacks. The positive relative hyperplane class h is the first Chern class
of the dual tautological line and equals the pullback of the ambient hyperplane.
In particular h has degree +1 on each projective-line fiber. This convention
fixes the sign of the normal calculation.

Inside Wtilde is the smooth divisor

\[
i:B=\mathbb P_{\mathrm{lines}}
(O_X(-1)\oplus O_Y(-1))\hookrightarrow\widetilde W,
\qquad q:B\to X\times Y.
\]

There is an exact sequence of normal bundles

\[
0\to N_{B/\widetilde W}\to
q^*(O_X(d)\oplus O_Y(d))
\xrightarrow{(\lambda^d,\mu^d)}O_B(d)\to0.
\]

The last map is surjective: lambda and mu cannot both vanish. Its kernel is a
line bundle. Taking determinants gives

\[
c_1(N_{B/\widetilde W})=dH_X+dH_Y-dh,
\qquad q_*c_1(N_{B/\widetilde W})=-d.
\]

Here `q_*q^*=0` and `q_*(h cap q^*)=id` are the rank-two projective-bundle
pushforward formulas. They hold after product with any smooth projective test
scheme, so the ensuing calculation is an equality of correspondences, not just
an equality on one cohomology group.

The blow-up formula decomposes h(Wtilde) into h(W) and Tate shifts of h(X),h(Y).
Every right-coordinate phase acts trivially on the X center and on its Tate
fiber classes. The nontrivial beta character therefore kills all X-center
summands. The alpha character likewise kills the Y-center summands. The sum
conditions ensure eta descends through the coordinate-block diagonal scalars.
Consequently `pi^* pi_* = id` on the eta sector of Wtilde. This vanishing is a
projector calculation using the equivariant projective-bundle splitting; it
does not require an algebraic representative of alpha or beta.

Let the unprojected incidence be `J=(q,pi i)_*[B]` and define

\[
F=e_\eta J(e_\alpha\otimes e_\beta),\qquad
H=(e_\alpha\otimes e_\beta)J^t e_\eta.
\]

The source of F is `(h(X)^alpha tensor h(Y)^beta)(1)`. Its incidence cycle has
dimension n+m+1. The reverse uses the transpose of **unprojected J**, followed
by the same named source and target projectors. It is not the literal transpose
of F, which would exchange both sectors with their duals.

The divisor self-intersection and projection formulas now give

\[
HF=q_*i^*\pi^*\pi_*i_*q^*
=q_*\bigl(c_1(N_{B/\widetilde W})\cap q^*(-)\bigr)
=-d\,\mathrm{id}.
\]

Thus the inverse is `(-1/d)H`. Both the source and target are invertible, with
scalar endomorphism rings, so the other composition is also identity. This
argument computes the Chow scalar before applying any realization functor.
It avoids the unverified inference from equal Gauss sums to equal motives.

External general inputs are the equivariant blow-up formula (OY Prop. 3.4),
Fermat invertibility (Prop. 4.11), Cartier-divisor Gysin self-intersection
([Stacks 42.29](https://stacks.math.columbia.edu/tag/02T7), Definition 42.29.1),
and the rank-two pushforward formula
([Stacks 42.36](https://stacks.math.columbia.edu/tag/02TV), Lemma 42.36.1).
The normal bundle, character vanishing and assembled scalar calculation are
derived here. No independent reproof of those external theorems is claimed.

## The typed standard reduction and its inverse

Let S denote h^8(F57^8)^T_S and A denote h^16(F57^16)^T_A, with the positive
tuples from the divisor packet. Its explicit padding B satisfies
`A_57(3,27)(9) <-> h^18(F57^18)^B`, pairing c_B=-24134536953 and finite
carrier degree 19. Let

`C=(22,35,23,34,29,28,32,25,11,46,17,40)`

be the right linear padding on F57^10. The plane
`L_C: x0+x1=x2+x3=...=x10+x11=0` has projected pairing `c_C=-1/57`,
and gives `F_C: Lambda(5)->h^10(F57^10)^C` with inverse
`G_C=-57[L_C]^t e_C`. This is also obtained by the block-diagonal determinant
of the six point equations, using Villaflor's CI intersection formula.

The join maps, with the padding inserted, have endpoints

\[
L:S\otimes A_{57}(3,27)(10)\longrightarrow h^{28}(F57^{28})^{T_S*B},
\]
\[
R:A(6)\longrightarrow h^{28}(F57^{28})^{T_A*C}.
\]

Both weights are 28. The exact positive tuple identity supplies the actual
coordinate permutation P between these two sectors. The checker records all
30 coordinate indices, its inverse, and covariance at all 36 units; P is a
graph defined over Q, with its inverse graph. There is no presumed root-of-unity
factor or lost coordinate permutation in the composition.

The left inverse's scalar is

\[
(-1/57)\,(19c_B)^{-1}=1/26137703520099,
\]

while the right inverse's scalar is `(-1/57)*(-57)=1`. The checker independently
multiplies these by the join self-intersection and padding pairing factors to
obtain 1. Hence the concrete cycle composition

\[
\Psi=R^{-1}\circ P\circ L,
\qquad \Psi^{-1}=L^{-1}\circ P^{-1}\circ R
\]

has both identities. Its cycle dimension is 12 in
`F57^8 x E x F57^16`, as required by the source twist 10 and target twist 6.
Equivalently, cancelling the invertible Tate and Artin factors,

\[
S(-4)\simeq A(-8)\otimes A_{57}(3,30).
\]

The realized maps are nonzero rank-one maps with the displayed realized
inverses. All unit conjugates retain the same rational scalars, transported
Kummer character and matching Hodge grades. This statement follows by realizing
the already computed Chow identities; finite Frobenius agreement is not used
as a replacement for this construction.

## Square-word discriminator and the remaining quadratic root

An additional integer-lattice trial found and exactly recomputed

\[
2\alpha_{\rm Aoki}+\gamma_{19,2}
=\sum_{a\in Q}\gamma_{3,a}+\sum_{b\in R}R(b),
\]

where `Q=(1,4,5,6,7,9,11,16,17)`,
`R=(1,2,4,7,8,14,16,19,25,28)`, and
`gamma19,2=(2,5,8,...,56,19)`. Both sides are positive tuples of length 56.
SciPy/HiGHS proposed the word; the committed checker verifies it with integer
arithmetic and has no SciPy dependency. The solver proposal is retained as
provenance. This checker admits the integer identity only. Its separate Chow
compilation has now been executed in
[the Aoki tensor-square packet](W114_AOKI_TENSOR_SQUARE_2026-09-30.md), using
Aoki's p=19,m=57,d=3 complete intersection and its finite degree-three carrier.
That construction gives an explicit tensor-square isomorphism and an order-two
bound on the untwisted residual line. It retains the unresolved quadratic-root
obligation.

The missing arrow is still

\[
h^{16}(F_{57}^{16})^{T_A}(-8)
\longrightarrow A_{114}(19,38)\otimes A_{114}(3(7-\zeta_3),57).
\]

The constructed Chow tensor-square does not identify this particular quadratic
root or produce a nonzero map to it. In representations of mu_2 the trivial and
sign lines have equal squares and no nonzero equivariant map between them.
Restricting an already-Artin Picard classification to an unproved exceptional
input would assume the required membership. The current promotion stops at
verified standard and tensor-square correspondences.

The full level-114 standard reduction, including the explicit plane pullback,
is compiled in [the full standard packet](W114_FULL_STANDARD_REDUCTION_2026-09-30.md).
An explicit mixed cycle with the corrected quadratic Galois action remains
necessary for the unsquared exceptional arrow. Routes not tested here remain
open, not refuted or declared globally exhausted.

## Audit boundary

Self-review verdict for the standard-reduction claim: **proved using the named
external inputs**, with an internal primitive-join calculation. Self-review
verdict for MOT-1: **incomplete, with the exceptional arrow missing**.

| Obligation | Evidence | Status |
|---|---|---|
| Actual projective incidence and degrees | Blow-up/projective-bundle construction above; character-specific cycle types | Passed, theorem-dependent |
| Nonzero standard padding | CI determinant, two pairing calculations, explicit family over E | Passed |
| Boundary terms | Nontrivial opposite-block characters kill every center Tate summand | Passed by projector calculation |
| Inverse normalizations | -57 normal degree, carrier factor 19, c_B and c_C contractions | Passed |
| Galois covariance and realized inverse | Geometry over K; exact unit orbit, matching weights and grades; realized Chow identities | Passed in the stated convention |
| Exceptional Aoki-to-quadratic arrow and signed plane push | No emitted cycle or authenticated candidate | Not addressed by the standard reduction; OPEN |

Software verifies the encoded arithmetic and rejects forged endpoint, degree and
scalar certificates. It does not prove the geometry automatically. No fresh-agent
independent audit or general Hodge-conjecture proof is claimed.

Run `python research/hodge/w114_standard_composition.py` and the repository's
Hodge unittest suite. New evidence is recorded separately from the initial
standard-divisor run; all earlier failures, source bindings and claim ceilings
remain available.

The final default-branch refresh is `0bb90fe9a655715163711c1a8df7f06a78dfb495`.
Its five changes are confined to Atlas statistics and coverage. They are carried
unchanged into the continuation and retained as a commit parent; no W114 source
changed between the two default pins. The earlier default pin remains historical
provenance, rather than being overwritten.

Primary mathematical source bindings, inspected versions and PDF hashes are in
[the standard-divisor source table](W114_STANDARD_DIVISOR_CONSTRUCTION_2026-09-30.md#sources-audit-and-reproducibility).
The current run records those hashes plus the exact Stacks Gysin/projective-bundle
pages used in the join proof.

Finite Artin cancellations use OY Lemma 3.8 (3.6) explicitly. On a common
Galois carrier of degree r, multiplication is
`r*e_(chi*eta) Delta^t (e_chi tensor e_eta)` and its inverse is
`(e_chi tensor e_eta) Delta e_(chi*eta)`. The unscaled diagonal contraction is
1/r. The trivial-character map to the unit is p_* with inverse p^*/r.
The compiler records these factors for r=19 (standard reduction), r=57
(level-114 reduction), and r=3 (square reduction). Tensor cancellation thus
has explicit finite-correspondence normalizations as well as its abstract
invertibility justification.
