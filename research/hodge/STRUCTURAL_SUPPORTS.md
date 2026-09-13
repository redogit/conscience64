# Hodge Conjecture — Structural Supports

This file is the support map for the integrated Hodge branch. It is intentionally broader than a proof attempt and narrower than a universal theory.

## 1. Target contract

For smooth projective complex `X` and codimension `p`:

```text
H_Hodge(X,p) = H^(2p)(X,Q) ∩ H^(p,p)(X)
A_alg(X,p)   = image(CH^p(X)_Q -> H^(2p)(X,Q))
```

Research target:

```text
A_alg(X,p) = H_Hodge(X,p).
```

A finite computation may verify a bounded instance, rank, lattice calculation, or cycle span. It does not prove this equality uniformly.

## 2. Footing ladder

### F0 — Linear algebra / exact arithmetic

- rank;
- nullspace;
- bilinear/intersection forms;
- rational versus real/complex span;
- basis changes;
- invariant subspaces;
- exact integer/rational certificates when available.

### F1 — Topology

- Betti numbers;
- Euler characteristic;
- Poincare duality;
- integral/rational cohomology;
- cup/intersection pairing.

### F2 — Complex/Kahler geometry

- Hodge decomposition;
- Hodge diamond;
- primitive decomposition;
- Hodge star where the metric/orientation contract applies;
- periods and variation in families.

### F3 — Algebraic geometry

- divisors/codimension-p cycles;
- Chow groups;
- cycle-class map;
- pullback/pushforward;
- exceptional divisors;
- correspondences;
- algebraic families.

### F4 — Symmetry / representation theory

- automorphism/group actions;
- induced cohomology representations;
- irreducible/isotypic decomposition;
- invariant and anti-invariant sectors;
- D4 / quaternion / binary tetrahedral / E6 calibration structures;
- quotient validity checked before use.

### F5 — Arithmetic / lattice structure

- rational Hodge classes versus complex Hodge pieces;
- Neron-Severi / Picard rank where applicable;
- integral lattices and discriminants;
- finite-index/gluing issues;
- reduction or arithmetic tests only when their hypotheses are explicit.

### F6 — Computational research support

- exact construction manifests;
- deterministic ordering and basis conventions;
- source hashes;
- independent rank/invariant implementations;
- counterexample panels;
- resource caps and `UNKNOWN` on timeout/incompleteness.

### F7 — Research governance

- source != evidence;
- calibration != open target;
- resemblance != implication;
- finite verification != universality;
- failure retained as evidence;
- one-degree perturbation before widening;
- proof audit before promotion.

## 3. Calibration objects

| Object | Why it is useful | Primary warning |
|---|---|---|
| `P^2` | trivial divisor/cohomology calibration | too simple to stress the machinery |
| `P^1 x P^1` | two independent divisor directions | product structure can make decomposition unusually easy |
| abelian surface `E x E` | real dimension four; nontrivial Hodge diamond | same real dimension does not imply K3 structure |
| Kummer K3 | quotient-resolution bridge; 16 exceptional curves | rational bookkeeping is not the full integral lattice |
| Fermat quartic K3 | explicit algebraic lines and high Picard rank | highly special; do not generalize to very general quartics |
| smooth cubic fourfold | codimension-two / period / Hodge-locus calibration | ordinary cubic-fourfold H^4 is not an unresolved Hodge-conjecture instance |

## 4. P-vs-NP methods imported carefully

### Range avoidance

P-vs-NP form:

```text
find output outside current realizable range.
```

Hodge research form:

```text
find rational Hodge class outside span of currently known cycle classes.
```

Interpretation:

```text
outside known span -> current generator incomplete
outside algebraic-cycle image -> would be a Hodge counterexample, requiring proof, not inference.
```

### Sharing / DAG discipline

```text
48 constructed cycles != 48 independent classes.
```

Always reduce through actual linear/algebraic relations.

### Symmetry-promise discipline

A group action is useful only after the action, quotient, invariant sector, and target relation are certified. Symmetry alone does not provide an algorithmic reduction.

### Conditioning / eliminated-coordinate discipline

A coordinate removed by one representation can still define a useful distinction in the original geometry. Preserve source coordinates and maps.

### Proof admission

```text
proposal -> counterprobe -> exact verifier -> barrier/hypothesis check -> uniform theorem -> proof audit.
```

## 5. Cross-Carrier supports

Every bridge must be typed:

```text
source object
-> transformation
-> target object
-> preserved structure
-> changed/lost structure
-> verifier
-> remainder.
```

Examples:

```text
4D point configuration -> group/representation model
Hodge diamond -> Betti numbers
cycles -> cohomology classes
integral lattice -> rational vector space
family -> special fiber
complex class -> rational Hodge class
```

None is reversible unless an explicit inverse theorem or reconstruction is supplied.

## 6. Knowledge Decay / provenance supports

For every load-bearing result preserve:

1. exact source identity;
2. theorem/version used;
3. hypotheses;
4. notation translation;
5. local computation/code revision;
6. command and bounds;
7. output hashes/certificates;
8. interpretation;
9. what remains unresolved.

A recovered historical association is not current mathematical authority.

## 7. Representation-sector deficit framework

Given a certified finite group `G` acting on `X`, decompose:

```text
H_Hodge = direct_sum_rho H_rho
A_known = direct_sum_rho A_rho
```

Define:

```text
D_rho = dim(H_rho) - dim(A_rho).
```

Statuses:

```text
D_rho = 0      -> covered relative to current exact model
D_rho > 0      -> targeted discovery sector
D_rho unknown  -> unresolved, never silently zero
D_rho < 0      -> implementation/definition inconsistency requiring repair
```

This is a search instrument, not the Hodge theorem.

## 8. Counterprobe bank

Use paired cases designed to break false bridges:

- same Hodge diamond, different Picard rank;
- same real dimension, different Hodge diamond;
- same Euler characteristic, different cohomology structure;
- same symmetry order, different representation decomposition;
- same raw cycle count, different span rank;
- same projected coordinates, distinct source points;
- same finite evidence, different family-level behavior;
- same semantic description, different theorem hypotheses.

## 9. Claim-status vocabulary

Use only explicit statuses:

```text
DEFINITION
KNOWN_THEOREM
CALIBRATION
VERIFIED_FINITE_COMPUTATION
SUPPORTED_BOUNDED
COUNTEREXAMPLE_TO_ROUTE
BRIDGE_CANDIDATE
OPEN_LEMMA
UNRESOLVED
REJECTED_OVERCLAIM
```

No `SOLVED` status is permitted without a complete argument and proof audit.

## 10. Active next sequence

```text
K3/Fermat exact reconstruction
-> Kummer integral/rational separation
-> symmetry-sector decomposition
-> fourfold codimension-two calibration
-> select open family with explicit hypotheses
-> compute/derive current cycle span
-> locate verified deficit sector
-> target an algebraic construction there
-> adversarially test every bridge
```
