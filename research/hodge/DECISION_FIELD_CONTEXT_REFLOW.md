# Decision Field — Context Reflow for Hodge Research

Status: `ACTIVE_RESEARCH_MODEL / NOT_A_THEOREM`

Purpose: consolidate the decision-field line from prior research conversations into one current object that can be tested, learned from, and applied to the Hodge program without promoting analogies into proof.

## 1. What the decision field is now

The current best formulation is not "a field that contains the answer." It is the smallest explicit state structure in which **changing a distinction can change the justified next mathematical action**.

For a declared research obligation `O`, define a decision field

```text
DF_O = (W, Phi, A, ~_O, T, E, L)
```

where:

- `W` — admissible research states/worlds;
- `Phi = {phi_i}` — observable or computable distinctions/coordinates;
- `A` — permitted next actions/experiments;
- `~_O` — decision equivalence under the current obligation: two states are equivalent only when they support the same protected decision/action set;
- `T` — state transitions produced by observations, constructions, quotients, counterprobes, source checks, or proofs;
- `E` — evidence/provenance carried with every transition;
- `L` — a learning/planning layer that may update action selection from outcomes but may not rewrite mathematical truth conditions or verifier rules.

Core invariant:

```text
LEARNED_PLANNER != MATHEMATICAL_VERIFIER
```

The decision field is therefore a **research-control object** unless and until a task-specific theorem makes some part of it mathematical evidence.

## 2. Historical progression reflowed

### A. State-space decision fields

The early direction treated a problem as a state space with explicit decision coordinates rather than one opaque object. The useful surviving idea is not a fixed number of coordinates; it is that a state can be represented by the distinctions that currently matter to the next consequence.

### B. XOR as a local discriminator

For a binary protected decision `d: W -> {0,1}`, XOR is useful as a boundary detector:

```text
delta_i(w) = d(w) XOR d(toggle_i(w)).
```

- `delta_i = 1`: coordinate `i` crosses the protected decision boundary in that context.
- `delta_i = 0`: the one-degree change does not change that binary decision in that context.

XOR is not a universal obligation operator. For multi-action decisions use partition refinement / unequal action sets rather than forcing the state into one bit.

### C. One-degree experiments

A one-degree probe changes one declared distinction while preserving the rest of the experimental contract. Prior finite meta-experiments established an important planning fact: one degree can be insufficient while sequentially preserved independent distinctions can compose into sufficient identifiability.

The decision-field consequence is:

```text
one-degree probe -> observe changed consequence -> preserve result -> add another degree only when unresolved
```

This does not justify greedy selection of the next degree.

### D. Consequential distinction beats maximum information

Prior finite counterexamples showed that the highest-entropy observation can fail to resolve the protected decision while a lower-entropy observation succeeds. Therefore the field objective is not "maximize information" in the abstract.

Use:

```text
consequential gain = reduction in decision-conflicted states/classes
```

rather than raw entropy alone.

### E. Decision partitions and conflict cells

A useful executable representation already exists in the observational-flow work:

- partition states by active distinctions;
- locate cells containing different consequences;
- count conflict pairs;
- activate a new distinction only when it separates consequentially different states.

This gives a finite field metric:

```text
Gain(phi_i | S) = ConflictPairs(S) - ConflictPairs(S union {phi_i}).
```

A distinction with zero immediate gain may still matter jointly; interaction probes remain necessary.

### F. Branch versus projection

The P-vs-NP/SAT work exposed an exact structural bifurcation:

```text
coordinate branch    -> more states
coordinate projection -> more relations
```

Neither is free. Planning cost is part of the problem.

Decision-field interpretation:

- **branch** when retaining a distinction cheaply separates consequential alternatives;
- **project/quotient** when the distinction can be removed without losing the current obligation, while charging relation growth and reconstruction cost;
- preserve enough lineage to reopen the distinction if a later obligation crosses the quotient boundary.

### G. Conditioning lesson

The SAT conditioning work showed that an eliminated/free-coordinate representation can hide a useful original branching distinction. Therefore:

```text
removed coordinate != useless decision coordinate
```

Every quotient/projection in the decision field requires a counterprobe against source-coordinate decisions.

### H. S' / transform-wave work

S' currently functions best as a **candidate transformation/operator family**, not a proved universal semantic operator.

Useful retained operator classes include:

- permutations;
- rotations;
- reversals;
- recombination;
- minimal repairs;
- one-degree transforms;
- Boolean decision-field operators;
- theorem/proof-object transforms.

The generator is enumerable/iterable at bounded depth and preserves lineage. Candidate generation is kept separate from evidence admission.

The proposed `-S'` / inverse-direction language remains a research hypothesis until a task-local inverse or repair semantics is specified and tested.

### I. 4D compass / compass rose

The compass contributes a navigation representation:

- cardinal one-degree moves;
- compound moves;
- projection-loss counterprobes;
- explicit observer dependence.

It does **not** require the Hodge decision field to have exactly four dimensions. The 4D rose is a useful local neighborhood/basis when four task-local distinctions are selected.

## 3. Learning from the field

The learnable component is the planner, not the theorem checker.

For each transition record:

```text
(state features,
 action,
 predicted distinction,
 exact observation,
 verifier result,
 residual after action,
 cost,
 provenance)
```

learn only things such as:

- which action tends to reduce a named residual under matched preconditions;
- which distinctions repeatedly split decision-conflicted cells;
- which projections repeatedly conceal useful source distinctions;
- which symmetry tests pay for themselves;
- which source/theorem checks eliminate entire candidate routes;
- which construction families repeatedly fail in a declared sector.

Never learn as a truth shortcut:

```text
frequent success != theorem
planner confidence != proof confidence
historical helper usefulness != current applicability
correlation between coordinates != mathematical implication
```

Learning updates route priority and experimental design only.

## 4. Hodge decision field

The Hodge branch gives a concrete field rather than an abstract metaphor.

For one target block/class `alpha`, use a state vector with typed statuses such as:

```text
s(alpha) = (
  hodge_class_status,
  finite_character_witness,
  explicit_geometric_carrier,
  theorem_source_validity,
  theorem_application_validity,
  transport_character_compatibility,
  nonzero_target_projection,
  cancellation_or_descent_status,
  field_of_definition_status,
  independent_check_status
)
```

Statuses are not coerced into Boolean values; use at least:

```text
VERIFIED
SUPPORTED_BOUNDED
EXTERNAL_THEOREM_VERIFIED
APPLICATION_VERIFIED
FAILED
COUNTEREXAMPLE
UNRESOLVED
NOT_APPLICABLE
```

### Current residual routes from the recovered Hodge work

#### m = 39

Finite zero-sum triple split exists. The load-bearing decision is not whether an incidence can be written; it is whether the Shioda-Katsura/Ran transport is verified on the selected eigenspace and has nonzero target projection.

#### m = 45 standard/Aoki

An explicit candidate surface and finite normalization chain exist. The active decision coordinate is the geometric intersection/Hodge-index kernel, not further arithmetic multiplication.

#### m = 45 two-pair

The route reaches an auxiliary joined block. The active decision coordinate is whether cancellation is formally justified in the correct category / eigenspace.

#### m = 33 level inflation

Finite lift/descent identities are available conditionally. The active coordinates are algebraicity of the lifted block, eigenspace compatibility, and pull/push application validity. Field-of-definition obstruction is kept separate from non-algebraicity.

These routes are ideal for a learnable decision field because they have different residual types and different useful next actions.

## 5. Hodge action set

Start with a small typed action set:

```text
A = {
  VERIFY_PRIMARY_SOURCE,
  REIMPLEMENT_FINITE_WITNESS,
  COMPUTE_EXACT_RANK_OR_INTERSECTION,
  TEST_GROUP_ACTION,
  TEST_EIGENSPACE_TRANSPORT,
  TEST_NONZERO_PROJECTION,
  CONSTRUCT_EXPLICIT_CYCLE,
  TEST_CANCELLATION,
  TEST_PULL_PUSH,
  RUN_COORDINATE_COUNTERPROBE,
  SEARCH_COUNTEREXAMPLE,
  SPLIT_ROUTE,
  HOLD_UNRESOLVED
}
```

Each action declares preconditions and the exact distinction it is expected to resolve.

## 6. Decision-field score

Do not optimize a single magic score. Keep a Pareto surface over at least:

```text
- decision-conflict reduction
- verifier strength
- planning/construction cost
- downstream branching reduction
- relation growth
- reversibility
- provenance quality
- residual uncertainty
```

For finite comparison only, a candidate diagnostic can be summarized as:

```text
DecisionGain(a,s) = conflicted_pairs_before - expected_conflicted_pairs_after
```

with cost kept separate rather than dividing blindly by cost. Prior planning counterexamples showed that greedy information-per-cost can be globally worse.

## 7. Learning protocol

1. Freeze the mathematical target and verifier.
2. Encode current residual routes as field states.
3. Enumerate lawful one-degree probes/actions.
4. Predict which decision cell each action should split.
5. Execute the cheapest discriminating exact check.
6. Record observation, cost, residual, and provenance.
7. Update planner statistics only.
8. Counterprobe any learned preference on a matched route where it should fail.
9. Preserve failures and stale helper relations.
10. Promote a learned routing rule only after repeated matched evidence; never promote it into theorem status.

## 8. Immediate experiment: DF-HODGE-01

Question:

> Can the decision-field representation select the same next load-bearing action that a manual dependency audit selects for the known m=33, m=39, and m=45 residual routes, using only typed current-state evidence and without route-name leakage?

Inputs:

- four current residual routes;
- typed status coordinates;
- allowed action set above;
- exact hand-audited next dependency for each route as evaluation labels only.

Pass condition:

- the field representation separates the routes into the correct next-action classes;
- removing a load-bearing coordinate merges at least one pair that needs different actions;
- irrelevant/stale coordinates can be removed without changing the protected next action.

Failure condition:

- route identity or prose labels are required;
- a removed distinction changes the correct action but the field fails to detect it;
- the learner uses evaluation labels or theorem conclusions as input;
- a planning score is mistaken for mathematical proof.

## 9. Current claim ceiling

Supported direction:

> A decision field can be treated as a task-local, provenance-preserving partition of research states by distinctions that change justified next actions, with a separate learning layer for planning.

Not established:

- a universal decision field for mathematics;
- a physical field;
- a unique coordinate system;
- a universal S' operator;
- a Hodge proof;
- a P-vs-NP consequence;
- that four dimensions are sufficient or optimal.

The next useful object is an executed `DF-HODGE-01` state/action matrix, not a larger theory.