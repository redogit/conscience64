# W114: confounds, actual errors, and the next exact target

**MOT-1 REMAINS OPEN. Primary verdict: incomplete, with the unsquared
exceptional correspondence missing.** This audit reviews the raw proofs and
receipts at `0ffcdce1e3731e4fa293ac69ca294b4b8772b90d`, current default main
`0bb90fe9a655715163711c1a8df7f06a78dfb495`, PR #224 and issue #99. The subsequent
receipt repair and arithmetic probes are recorded separately from that evidence.
Review is self-review. Separate arithmetic implementations are not an independent
geometric reproof.

## Claim card and dependencies

Put K=Lambda=Q(zeta57), A=h^16(F57^16)^T_A, M=A(-8), and
N=M tensor A114(19,76). The verified standard reduction reaches M with the
standard A114(2,100),A114(3,60) factors. The verified square correspondence gives
N tensor-square isomorphic to Lambda. The still required conclusion is an
explicit nonzero Chow map N -> A114(3(7-zeta3),57), with its inverse and
realizations. No such map or exceptional cycle has been emitted.

| Implication | Evidence role | Audit status |
|---|---|---|
| Later n=3 closure -> projective primitive | OY localization and fully faithful Chow embedding; nonzero boundary characters | Passed under named external inputs |
| Primitive join -> scalar -d and normalized inverse | Internal normal-bundle/self-intersection calculation; external blow-up, Gysin, projective-bundle and Fermat-invertibility inputs | Self-reviewed; no fresh independent geometry audit |
| Explicit divisors/plane/paddings -> full W114 standard reduction | Actual incidences plus exact containment, projected class, scalars and character checks | Passed in the stated homological convention |
| 19-standard CI and joins -> N squared equals the unit | Newton containment and scalar arithmetic; Aoki standard-cycle nonvanishing/intersection theorem | Passed using the named theorem; no independent p=19 Jacobian computation |
| N squared equals the unit -> the specified quadratic Artin line | No constructed cycle or applicable identification theorem supplied | Missing implication |
| Missing exceptional map -> full W114 plane push | Requires the preceding missing arrow | Open |

The standard and square claims use externally supplied geometric inputs.
Tests do not independently prove those inputs. Their induced realized inverse
identities belong to the maps actually constructed, not to the absent MOT-1 map.

## Exactly what went wrong

| Finding | What failed and why | Correction / current limit |
|---|---|---|
| **New actual receipt error at 0ffcdce** | The full compiler equated arithmetic sign with geometric direction. It labeled +D2 forward and -D2 inverse, contradicting the declared +D2 -> inverse, -D2 -> forward convention and its own right-padding reversal. The tests checked names/order/signs but not this mapping. | Corrected D2 receipts. N directions are null with an explicit reflection-point-padding role. Two new tests fail before the fix and pass afterward. Encoded incidences, endpoints, scalars, permutation and unit orbits compare exactly unchanged. |
| **Earlier actual plane-orientation error at e237845** | 57(z_f x z_bar_f) contracts the input against z_f. Since its self-pairing is zero, it annihilates z_f and fixes the opposite line. I applied the historical formula in the wrong homological convention. | Correct wrapper 57(z_bar_f x z_f) fixes z_f. Old checker/results are preserved as historical evidence; their claimed action on z_f is superseded. |
| **Earlier primitive applicability defect** | The recorded N Artin-Schreier construction has a finite-field base. It cannot serve as that same characteristic-zero graph over K. | Characteristic-zero reflection point padding is used; individual N occurrences remain arithmetic provenance, not imported geometric leaves. |
| **Historical quadratic sign defect** | q=7-zeta3 alone loses the factor 3. At p=571, q is a square and 3q is a nonsquare at both zeta3 embeddings. | Correct carrier remains A114(3q,57). The exact local discrepancy is independently recomputed in this audit. |
| **Failed initial product-source approach** | The constructed product transfer acts on a plane tensored with four curve factors, in weight 8. A bare plane cannot be substituted for that source or the endpoint relabeled W114 of weight 4. | Explicit padding, joins, Artin/Tate cancellation and power maps now construct the standard W114 reduction. The exceptional arrow remains separate. |

Missing-degree, flipped-sign, forged-endpoint and wrong-root proposals were
deliberate counterprobes. Their rejection is not a new regression. For example,
omitting the Fermat-to-C quotient factor gives round trips 57 or 361;
omitting the inverse symmetrizer factor gives 1/2. For the 3-standard finite
family, using inverse -1/19 with fiber pairing -19 gives round trip 19;
the correct -1/361 includes the separate finite-carrier degree 19 and gives 1.

The new direction fix is at the receipt producer, not a mathematical convention
change. It restores the convention already declared in the earlier audit.
The old immutable run remains available at its exact commit. Its direction
subclaim is superseded, not silently overwritten.

## Active confounds and failed shortcuts

1. **Squaring loses the quadratic root.** Trivial and sign lines both square
   to the unit. This audit constructs their separate finite-carrier projectors
   and checks that the wrong-sign projector times the required projector is
   zero. A square isomorphism cannot emit the absent unsquared map.
2. **Arithmetic agreement is weaker than a cycle.** The checks at p=229,571
   and all 36 character embeddings are useful discriminators. They do not
   construct the missing cycle or independently audit its nonexistent realization.
3. **Shared producer/checker assumptions can hide defects.** The checker uses
   equality with a freshly produced certificate to reject tampering. That catches
   altered fields, but cannot catch every defect shared by the producer. The new
   direction error passed the earlier 80-test suite for this reason and because
   its direction mapping lacked a literal convention-based regression test.
4. **Geometric theorem dependencies remain.** Aoki nonvanishing/intersection,
   OY invertibility/blow-ups and the Gysin/projective-bundle formulas retain
   their exact scopes. The code encodes the join normal bundle; the written
   geometric derivation establishes that input. No independent geometry reviewer
   or independent p=19 cycle-class calculation has been claimed.
5. **The tested standard-word family cannot resolve the unsquared gap.**
   The parity functional on residues (17,21,26,31,36,40) is zero on every
   admitted reflection, 3-standard and 19-standard word and one on alpha_Aoki.
   This audit checks 36 transported functionals against 148 generators each:
   5328 exact generator evaluations. This excludes that integer-word ansatz,
   including negative coefficients, not mixed cycles or other relation families.
6. **Other failed ansatzes have limited coverage.** All six curve-pair choices
   in the committed KS decomposition fail global complementarity (8 to 16
   mismatched embeddings per pair). All 112 admitted degree-114 2-standard
   quartets and 111 3-standard quartets fail the standard-surface-plus-point
   match. These findings do not imply nonalgebraicity or exhaust all decompositions.
7. **Historical/current statements can drift.** Older closure, sign and plane
   packets remain part of the lineage. Their old open statements or reversed
   conventions must not override later scoped corrections. Source versions and
   raw failed results remain bound to their original commits.

The general Hodge conjecture stays outside the admitted result. Published
Fermat-fourfold existence statements were inspected but do not supply the
specified equations, quadratic descent or normalized inverse here. Invoking
an Artin-Tate classification before proving this exceptional object's membership
would assume the missing implication.

## The angles being taken

| Angle | Result / present role |
|---|---|
| Projective geometry and standard composition | The boundary seam, standard cycles, padded composition and inverse normalizations have been traced. These are the constructed part of the route. |
| Tensor-square and parity discrimination | The square correspondence bounds the residual tensor order by two; parity excludes an unsquared reduction by the tested standard-word family. This narrows the search but loses the root sign. |
| Direct corrected-sign exceptional cycle | Priority next construction: one projected dimension-eight cycle over the combined cubic/quadratic Artin carrier, with the specified action. |
| Independent proof audit | Still needed for the load-bearing geometric calculation and any new exceptional cycle. The current pass is self-review with separate arithmetic implementations. |
| Matrix factorization and higher-level lifts | Preserved coexisting routes. Neither used nor refuted by this audit; no evidence transfer or status promotion. |

## The smallest precise next target

Define

\[
E_6=\operatorname{Spec}K[r,t]/
(r^3+19,\;t^2-3(7-\zeta_3)).
\]

The cubic degree-three argument is recorded in the square packet; the nontrivial
quadratic character is distinguished at the split prime 571. Their degrees are
coprime. Let sigma3(r)=zeta3*r and tau(t)=-t. The desired character has
chi(sigma3)=zeta3 and chi(tau)=-1, using the explicit cubic -19/19 dictionary.
Its finite homological projector is

\[
e_\chi=\frac16\sum_{j=0}^2\sum_{k=0}^1
\zeta_3^{-j}(-1)^k[\Gamma_{\sigma_3^j\tau^k}].
\]

The separate exact Q(zeta3)[C3 x C2] computation verifies idempotence,
rank/trace one, both eigencharacters, and orthogonality to the wrong quadratic
projector. This is a verified finite Artin target leaf; it supplies no exceptional
cycle on F57^16.

The required next arrow can equivalently be built in reverse from a family
Gamma in E6 x F57^16 of cycle dimension eight:

\[
F=e_{T_A}[\Gamma]e_\chi:
h(E_6)^\chi(8)\longrightarrow h^{16}(F_{57}^{16})^{T_A}.
\]

Both weights must be 16. Its target homological projector requires the **dual
pullback** class component. If that projected fiber has nonzero pairing c with
its dual, the finite-carrier inverse normalization is

\[
G=\frac1{6c}e_\chi[\Gamma]^t e_{T_A}.
\]

The six is separate from the intersection c. Neither Gamma nor c has been
constructed here. The cheapest decisive next check is one actual candidate's
containment, nonzero dual-pullback component and cubic/quadratic action; a failure
must retain the equations and residual. Further tensor-square arithmetic alone
cannot meet that obligation.

## Reproduction and evidence ceiling

Run `python research/hodge/evidence/w114-confounds-audit-20260930/replay.py`.
It imports no W114 producer/checker and independently recomputes the plane
contraction, local q/3q signs, transported parity functionals and six-point
projector. This is implementation separation within one self-review, not an
independent mathematical proof.

Run the repository Hodge unittest suite and the native composition checkers.
The new evidence directory preserves the red/green direction tests, the exact
old/new receipt comparison, bounded replay output and hashes. The original
80-test evidence at 0ffcdce remains historical, including its direction defect;
the correction run adds two regression tests.

Primary source locators and PDF hashes remain in the standard-divisor source
table and prior manifests. No source theorem is replaced by a dashboard label.
Issue #99 remains the target authority; the connected proof graph remains OPEN.

**SOFTWARE_VERIFICATION != MATHEMATICAL_PROOF. THEOREM_USE != INDEPENDENT_REPROOF.
MOT-1 REMAINS OPEN. HODGE_CONJECTURE_REMAINS_OPEN.**
