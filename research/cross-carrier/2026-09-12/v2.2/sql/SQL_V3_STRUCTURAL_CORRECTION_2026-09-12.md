# SQL Mutilation v3 — Structural Correction and Search-Cost Turn

**P vs NP remains OPEN.**

## Structural correction

The v2 candidate criterion was wrong if "quotient benefit" meant fewer NAND
gates than the exact direct optimum.

For every exact staged construction implementing the same partial target,

`transform -> quotient computation -> quotient target`

is itself a valid direct NAND circuit. Therefore

`C*(P) <= C_stage(P)`.

A staged route cannot beat the exact optimum in output gate count. The
consequential comparison is discovery, planning, verification, or matched
restricted-search cost while preserving the same exact obligation.

## Exact SAT-encoding comparison

For `K10-T7-M48579-V33090`:

| decision | direct | quotient |
|---|---:|---:|
| minimality UNSAT gate bound | 7 | 6 |
| Boolean symbols | 196 | 120 |
| expression leaves | 4,523 | 2,213 |
| single-run time | 0.316046 s | 0.024222 s |
| witness SAT gate bound | 8 | 7 |
| Boolean symbols | 232 | 147 |
| expression leaves | 5,743 | 2,933 |
| single-run time | 0.882281 s | 0.024084 s |

The quotient formulation is structurally smaller for both exact decisions.
The timings are environment-specific observations, not asymptotic claims.

## Aggregate bridge

For explicit partial table `P:D->{0,1}`, let `f_b` be the indicator for
label `b` and define

`A(t) = sum_b sum_x f_b(x) f_b(x xor t)`.

For nonzero `t`:

`t stabilizes P iff A(t)=|D|`.

The same aggregate has the exact Walsh carrier

`A(t)=2^-n sum_a (-1)^(a dot t) sum_b W_b(a)^2`.

So:

`same-label pair aggregate <-> XOR autocorrelation <-> squared Walsh spectrum`.

For an explicitly listed table of `m` points, pairwise XOR counting discovers
all translation stabilizers with `O(m^2)` pair operations. Dense Walsh-Hadamard
evaluation is `O(n 2^n)` over the full cube. Neither result constructs a hard
partial table.

## Corrected next obligation

`construct hard partial table`
`+ charge construction cost`
`+ discover useful aggregate/symmetry at bounded cost`
`+ show lower matched search/verification cost after routing costs`
`+ preserve DAG reuse`
`+ scale beyond finite calibration`.

The hard-table construction bottleneck remains.
