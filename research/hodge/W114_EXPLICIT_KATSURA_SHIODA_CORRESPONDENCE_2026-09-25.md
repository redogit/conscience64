# W114 — Explicit Katsura-Shioda graph correspondence for recursive source decomposition

Date: 2026-09-25
Status: EXPLICIT_GRAPH_CORRESPONDENCE_CANDIDATE / THEOREM_GROUNDED
Target: source-side explicit correspondence needed by MOT-1

## One recursion stage

For source S = F_d^(n-1) x F_d^(2), Otsubo-Yamazaki use the Katsura-Shioda diagram

U = Bl_Z(S) --f--> V = U/H --beta--> T = F_d^(n),

with blow-up alpha: U -> S and H ~= mu_d, deg(f)=d.

For target character chi=(chi_1,...,chi_n), with chi_(n-1)*chi_n nontrivial,
the source character is

rho = ((chi_1,...,chi_(n-2),chi_(n-1)*chi_n),(chi_(n-1),chi_n)).

Otsubo-Yamazaki Proposition 4.9 makes the relevant blow-up-center motive terms vanish,
and Proposition 3.5 / Lemma 3.6 control the finite quotient.

## Explicit forward correspondence

In their homological Chow-motive convention, g_* is Graph(g) and g^* is transpose(Graph(g)).

Define

C_chi =
e_chi o Graph(beta) o Graph(f) o transpose(Graph(alpha)) o e_rho.

This is an algebraic correspondence from the projected source product motive to the
target Fermat eigenspace.

## Explicit inverse correspondence

For the finite generically Galois map f of degree d:

f_* f^* = d id
and
f^* f_* = sum_(h in H) h_*.

The source character rho is trivial on H, so the H-sum acts as d on the rho-projector.

Define

D_chi =
(1/d) e_rho o Graph(alpha) o transpose(Graph(f)) o transpose(Graph(beta)) o e_chi.

On the relevant eigenspaces the blow-up exceptional summands vanish. Hence the cited
identities give

D_chi C_chi = e_rho
and
C_chi D_chi = e_chi.

For W114, d=114.

## W114 stage 1

target (7,78,79,86,91)
lower  (7,78,79,63)
curve  (86,91)

because 86+91 = 63 mod 114.

## W114 stage 2

target (7,78,79,63)
lower  (7,78,28)
curve  (79,63)

because 79+63 = 28 mod 114.

## W114 stage 3

target (7,78,28)
lower  (7,106)
curve  (78,28)

because 78+28 = 106 mod 114.

At every stage:
- merged character is nontrivial;
- the last two characters are individually nontrivial;
- rho restricts trivially to H because merged-a-b = 0 mod 114.

## Full correspondence

Let C1,C2,C3 be the forward stage correspondences.

C_W114 =
C1 o (C2 tensor id_(86,91))
   o (C3 tensor id_(79,63) tensor id_(86,91)).

The inverse is

D_W114 =
(D3 tensor id_(79,63) tensor id_(86,91))
 o (D2 tensor id_(86,91))
 o D1.

This traces the admitted W114 recursive motive decomposition into graph cycles,
character projectors and the exact 1/114 quotient normalization.

## Remaining MOT-1 load

The source-side W114-to-curves map is now explicit at the correspondence-formula level.
The remaining load-bearing work is target-side:

1. trace the exact reflection and n=3 standard relation word into explicit cycles;
2. insert the admitted explicit Artin carrier A(3*(7-zeta_3));
3. compose source and target correspondences;
4. verify the induced realization is the current W114 residual gap character.

## Claim ceiling

GRAPH_FORMULA + THEOREM_HYPOTHESES != INDEPENDENT_REPROOF_OF_OTSUBO_YAMAZAKI
EXPLICIT_SOURCE_DECOMPOSITION_CORRESPONDENCE != MOT_1_CLOSED
STANDARD_SIDE_COMPOSED_CYCLE_REMAINS_OPEN
HODGE_CONJECTURE_REMAINS_OPEN
