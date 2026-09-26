# W114 — Otsubo–Yamazaki recursive Fermat-motive factorization

Status: `NEW_BOUNDED_MOTIVIC_ROUTE_CANDIDATE`  
Target: conscience64 issue #99 / `MOT-1`

## Source

Noriyuki Otsubo and Takao Yamazaki, **Motivic Gauss and Jacobi sums**, Annales de la Faculté des sciences de Toulouse 35 (2026), 95–135, DOI `10.5802/afst.1842`.

Relevant pieces:

- §4.2 constructs Fermat Chow-motive eigenspaces by explicit character projectors.
- Proposition 4.10 derives an isomorphism from the Katsura–Shioda resolved rational map.
- Proposition 4.11(ii) states, when the last two characters have nontrivial product,
  [
  h(F_d^{(n)})^{(\chi_1,\ldots,\chi_n)}
  \simeq
  h(F_d^{(n-1)})^{(\chi_1,\ldots,\chi_{n-2},\chi_{n-1}\chi_n)}
  \otimes
  h(F_d^{(2)})^{(\chi_{n-1},\chi_n)}.
  ]
- The paper explicitly says the isomorphisms arising from the geometric propositions should be traceable, although its proof of Proposition 4.11 uses Krull–Schmidt instead of writing the full correspondence.

## W114 character translation

The current six-entry projective character is

[
\alpha=(1,7,78,79,86,91),\qquad \sum \alpha_i=342=3\cdot114.
]

Under the standard fixed-(u_0) convention for the (mu_{114}^5)-action, use

[
\chi=(7,78,79,86,91).
]

Consistency check:

[
7+78+79+86+91=341\equiv -1\pmod{114},
]

so the missing projective coordinate is exactly (a_0=1).

This translation still requires target-native convention authentication before promotion beyond this route packet.

## Exact recursive reduction

Choose the last-pair order as follows.

### Step 1

[
86+91=177\equiv63\pmod{114}\neq0.
]

Therefore Proposition 4.11(ii) gives

[
h(F_{114}^{(5)})^{(7,78,79,86,91)}
\simeq
h(F_{114}^{(4)})^{(7,78,79,63)}
\otimes
h(F_{114}^{(2)})^{(86,91)}.
]

### Step 2

[
79+63=142\equiv28\pmod{114}\neq0.
]

Hence

[
h(F_{114}^{(4)})^{(7,78,79,63)}
\simeq
h(F_{114}^{(3)})^{(7,78,28)}
\otimes
h(F_{114}^{(2)})^{(79,63)}.
]

### Step 3

[
78+28=106\not\equiv0\pmod{114}.
]

Hence

[
h(F_{114}^{(3)})^{(7,78,28)}
\simeq
h(F_{114}^{(2)})^{(7,106)}
\otimes
h(F_{114}^{(2)})^{(78,28)}.
]

Combining:

[
\boxed{
h(F_{114}^{(5)})^{(7,78,79,86,91)}
\simeq
h(F_{114}^{(2)})^{(7,106)}
\otimes
h(F_{114}^{(2)})^{(78,28)}
\otimes
h(F_{114}^{(2)})^{(79,63)}
\otimes
h(F_{114}^{(2)})^{(86,91)}
}
]

in the relevant Chow-motive category over a base containing (mu_{114}), subject to the target-native character-convention binding above.

Every curve pair also has nontrivial product:

[
7+106=113,quad78+28=106,quad79+63=28,quad86+91=63
]

modulo (114). Thus none of these four factors falls into the trivial-product exceptional/reflection case.

## Why this matters for MOT-1

This replaces a vague “find some lower-dimensional motivic model” step with a specific rank-one tensor target made from four Fermat-curve eigenspace motives.

The Katsura–Shioda geometry used by Otsubo–Yamazaki is explicit:

1. rational map
   [
   f_0:F_d^{(n)}\times F_d^{(2)}\dashrightarrow F_d^{(n+1)}
   ]
   with
   [
   [u],[v]\mapsto[u_0v_0:\cdots:u_{n-1}v_0:u_nv_1:u_nv_2];
   ]
2. blow-up (alpha) of the source along (Z={u_n=v_0=0});
3. finite generically Galois quotient (f) by (H\simeq\mu_d);
4. blow-up morphism (eta) to the target along (Z_1\sqcup Z_2).

For our chosen character reductions, the nuisance exceptional terms vanish on the relevant character sectors because the merged products are nontrivial.

Therefore the next **explicit-cycle** candidate is to trace the character-projected correspondence built from the graphs of

[
{}^t\Gamma_\alpha,quad \Gamma_f,quad \Gamma_\beta
]

through each of the three recursion stages, with the appropriate character idempotents on source and target.

Schematic candidate for one stage:

[
C_n
=
e_{\chi}^{\text{target}}
\circ
\Gamma_\beta
\circ
\Gamma_f
\circ
{}^t\Gamma_\alpha
\circ
e_{\chi^{(n,2)}}^{\text{source}}.
]

The exact motive-convention orientation and normalization by (|H|=114) must be checked before calling this an inverse/isomorphism correspondence.

## Join still missing

The current target-native MOT-1 is not merely “reduce W114 to curves.” It asks for the residual gap motive to match the **standard-part motive tensored with the corrected quadratic Artin sign motive**

[
A(3(7-\zeta_3)).
]

The present factorization does **not** yet identify the tensor product of four Fermat-curve motives with that standard-part×Artin object.

That is now a sharply defined comparison problem:

[
\bigotimes
{(7,106),(78,28),(79,63),(86,91)}
\stackrel{?}{\simeq}
M_{\mathrm{standard}}\otimes A(3(7-\zeta_3)).
]

The existing exact Hecke/Kummer character match can test the realizations of this proposed equality, but

[
\text{REALIZATION MATCH}\neq\text{CHOW CORRESPONDENCE}.
]

## New smallest next probes

1. **Convention check:** authenticate the six-entry W114 ↔ five-character (F_{114}^{(5)}) projector translation against the current Fermat-character convention.
2. **Character-factor check:** compute the Jacobi/Hecke character of the four curve factors and multiply them exactly.
3. **Standard×Artin comparison:** divide by the existing standard-part character and test whether the quotient is exactly the corrected sign (A(3(7-\zeta_3))).
4. **Trace one geometric stage:** write the first projected graph correspondence explicitly and verify source/target projector intertwining.
5. Only after those pass, compose the three stages.

## Claim ceiling

```text
EXACT_CHARACTER_RECURSION != EXPLICIT_CHOW_CORRESPONDENCE
PROPOSITION_4_11_ISOMORPHISM_EXISTENCE != TRACED_CYCLE
FERMAT_CURVE_TENSOR_FACTORIZATION != STANDARD_PART_X_ARTIN_MATCH
REALIZATION_MATCH != CHOW_MORPHISM
MOT-1 REMAINS OPEN
```
