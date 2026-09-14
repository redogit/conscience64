# Two-pair coset obstruction for the open even walls

Status: `PROVED_REDUCTION + EXECUTED_FINITE_ENUMERATION`

## Source theorem

The odd-degree companion paper proves the following two-pair closure criterion for a Hodge sextuple `beta`:

```text
beta ⊎ p1 ⊎ p2 = S ⊎ Q,
```

where `p1,p2` are vanishing pairs, `S` is an Aoki 5-standard sextuple, and `Q` is a grade-2 Hodge quadruple. Then `claim(beta)` holds.

The theorem is stated for the Fermat level `m` and requires the 5-standard family, hence `5 | m` for this genre.

## Quotient reduction

Let `[v]` denote the class of a multiplicity vector in the quotient by Aoki's lattice `S_m`.

Vanishing pairs lie in `S_m` by definition, and the standard sextuple `S` lies in `S_m`. Therefore from

```text
nu(beta) + nu(p1) + nu(p2) = nu(S) + nu(Q)
```

we obtain

```text
[nu(beta)] = [nu(Q)].
```

Thus a two-pair-closed class can lie in an open wall coset only if **some grade-2 Hodge quadruple lies in that same coset**.

This is a necessary condition independent of the choice of vanishing pairs and independent of which 5-standard sextuple is used.

## Exact enumeration

Using the independent Hermite-normal-form quotient implementation already calibrated on the known `m=168` coset-transfer witness, enumerate every sorted nonzero quadruple

```text
1 <= q1 <= q2 <= q3 <= q4 < m
```

satisfying the full Hodge grade-2 condition

```text
sum_i <t qi> = 2m
for every unit t mod m.
```

Results:

| level | open target representative | grade-2 Hodge quadruples | quadruples in target S_m coset |
|---:|---|---:|---:|
| 70 | `(1,20,24,42,61,62)` | 700 | **0** |
| 110 | `(1,24,62,71,81,91)` | 1,648 | **0** |

Positive calibration:

At `m=45`, the published two-pair example

```text
a = (1,19,20,28,30,37)
Q = (5,20,30,35)
```

satisfies

```text
[nu(a)] = [nu(Q)] = 0 in Z^(m-1)/S_45,
```

and the independent grade checker returns grade `3` for `a` and grade `2` for `Q`.

## Consequence

There is no same-level class `beta` in the `W70` or `W110` target coset whose algebraicity can be certified by the published **two-pair standard closure theorem**.

The obstruction is stronger than failure of a particular pair/standard search: the required grade-2 quotient class does not exist at all.

For `W114`, `5 ∤ 114`, so the 5-standard two-pair genre is unavailable at the base level.

Combining this with the separate exhaustive `*`-split coset search closes two major known same-level gap mechanisms for the three base walls:

```text
same-level *-split coset transfer: excluded
same-level two-pair-standard coset transfer: excluded (W70,W110); unavailable at W114
```

## What remains

This does **not** exclude:

- other independently algebraic gap-class families;
- justified lift to another level followed by transfer/descent;
- exchange through a new algebraic exchanger family;
- geometric constructions not represented by these closure genres;
- a new theorem acting directly on the order-two gap classes.

## Claim ceiling

This is a mechanism-specific obstruction, not a non-algebraicity result. It proves no counterexample to the Hodge conjecture and uses no P-versus-NP evidence.