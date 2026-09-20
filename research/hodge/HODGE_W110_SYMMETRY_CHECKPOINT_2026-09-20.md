# W110 symmetry / exact Jacobi checkpoint — 2026-09-20

Status: `BOUNDED_EXACT_ARITHMETIC / CHARACTER_SYMMETRY_PROVED / ALGEBRAICITY_UNRESOLVED`

This checkpoint follows the standing rule:

`FOUND != KNOWN`.

External literature is used only to propose mechanisms.  The statements promoted below are
elementary character arguments or are reproduced by the independent scripts on this branch.

## 1. Target

Use the second representative of wall `W110`:

```
a = (1,31,55,71,81,91)
```

The other listed W110 representative remains part of the same wall but has a much larger
Galois orbit and less restrictive finite-phase behavior.

## 2. Exact character stabilizer

Direct enumeration of `(Z/110Z)^*` gives

```
H = {1,31,71,81,91}.
```

Each element of H permutes the six entries of `a`; 55 is fixed and the other five entries
form one H-orbit.

The same subgroup has the arithmetic description

```
t == 1 mod 5
and
LegendreSymbol(t,11) = +1.
```

Indeed the non-self entries reduce mod 11 to the five quadratic residues

```
{1,3,4,5,9}.
```

Therefore the rational Galois orbit has size

```
phi(110) / |H| = 40 / 5 = 8.
```

This is reproduced by `w110_stabilizer_phase.py`.

## 3. Fixed cyclotomic field

By CRT,

```
Gal(Q(zeta_110)/Q) ~= (Z/5Z)^* x (Z/11Z)^*.
```

H is trivial on the 5-part and is the quadratic-residue subgroup on the 11-part.  Hence its
fixed field is

```
K_H = Q(zeta_5, sqrt(-11)),
[K_H:Q] = 8.
```

This field identification is a derived Galois-theoretic consequence of the displayed H,
not an algebraicity assertion.

## 4. Root-of-unity consequence

If a Jacobi phase is exactly `zeta_110^r`, invariance under H forces

```
(t-1) r == 0 mod 110
for every t in H.
```

The solutions are exactly

```
r in {0,11,22,33,44,55,66,77,88,99}.
```

Thus every H-fixed root of unity in `Q(zeta_110)` has order in

```
{1,2,5,10}.
```

Equivalently, the roots of unity in `K_H` are `mu_10`.

This explains the finite phase pattern below without using a statistical inference.

## 5. Exact Jacobi calculations

`exact_jacobi_phase.py` computes each selected Jacobi sum by integer discrete-log counting,
the recursive Jacobi identity, and exact polynomial reduction modulo `Phi_m`.

No floating tolerance is used in the final identities.

For the first six split primes of W110 the second representative gave phase orders

```
5, 1, 5, 5, 5, 1.
```

The temporary hypothesis "global order divides 5" is false.  The exact counterexample is

```
p = 2531
j_p(a) = p^2 * zeta_110^11,
order(zeta_110^11) = 10.
```

Across the first 25 split primes tested, every exact exponent is nevertheless divisible by 11,
as forced by the stabilizer whenever the normalized value is a root of unity.

This is finite evidence plus an exact symmetry explanation; it is not a proof that every split
prime has a root-of-unity normalized value.  Any global finite-order assertion still needs its
classical Jacobi-sum theorem dependency audited separately.

## 6. Comparison with the other walls

The exact finite phase checker also records:

- W70, first six split primes: orders `7,35,35,7,70,35`;
- W110 first representative: `10,55,11,110,1,110`;
- W114 representatives: orders include `114,57,19` (and one order-6 value).

So W110's second representative is genuinely exceptional under character stabilizer:
the other displayed representatives have trivial multiset stabilizer.

## 7. Recursive curve-factor route: false lead preserved

A broader curve-factor screen allowed a Galois offset `t -> s t` when pairing two recursive
Fermat-curve factors.  Raw offset pairings occur for W110's first representative.

They are **not** sufficient.

For an offset to be geometrically transportable by the tested Aoki endomorphism mechanism,
the required shift must lie in the factor's self-symmetry group

```
W_alpha = {s : grade(t alpha) = grade(s t alpha) for every unit t}.
```

`curve_factor_transport_screen.py` exhausts all 720 recursive orderings for every W70/W110/W114
representative and finds:

```
transportable_offset_pairings = 0
```

for every case.

It also confirms there is no recursive ordering in which all four curve factors descend to
proper levels.

So the raw offset hit remains a recorded negative/interpretation correction, not a closure.

## 8. Field-of-definition consequence (conditional form)

Suppose a certifying algebraic cycle has nonzero projection to this eigenline, has good reduction
at a selected split prime p, and is fixed by a residue-degree-f Frobenius after the codimension-2
Tate normalization.  Then necessarily

```
u(a,p)^f = 1.
```

Therefore an exact local phase of order r forces `r | f` for that cycle at that prime.

This is a **field-of-definition obstruction**, not an obstruction to algebraicity.

The p=2531 calculation supplies an order-10 instance.

## 9. Live mathematical lack

The known pair/standard lattice, one-step induced joins, first/new-prime lift families,
proper-divisor inflation routes, obvious recursive divisor pairings, and Aoki-W transportable
offset pairings do not reach the current walls under their declared finite contracts.

For W110^(2), the next mechanism should exploit the actual symmetry

```
quadratic residues mod 11
        +
5-cyclotomic coordinate
        ->
K_H = Q(zeta_5, sqrt(-11))
```

rather than another larger enumeration.

Candidate mechanism classes are:
- an explicit Gaussian-period / quadratic-residue algebraic correspondence;
- a target-specific CM/Jacobian factor construction;
- a motivic Jacobi-sum correspondence with an independently checked source-to-target character map.

None is promoted yet.

## Claim ceiling

Known:
- exact stabilizer H and orbit size 8;
- exact fixed-root exponent restriction `11 | r`;
- exact finite Jacobi identities in `exact_jacobi_phase.py`;
- exact order-5 counterexample at p=2531;
- exact zero transportable recursive-pair hits under the declared Aoki-W screen.

Not known:
- algebraicity or non-algebraicity of W110;
- a global order statement for its normalized Jacobi Hecke character without theorem audit;
- a cycle realizing the quadratic-residue symmetry;
- the general Hodge conjecture.
