#!/usr/bin/env python3
"""
W114 Research Loop — Conscience64 issue #99 method carrier.

Method only. It does not manufacture Hodge evidence.

FREEZE -> CENTER -> MOVE_ONE_DEGREE -> OBSERVE -> VERIFY
-> COUNTERPROBE -> RECORD_RESIDUAL -> RECENTER -> DISTILL
"""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from hashlib import sha256
from typing import Dict, List, Tuple
import json

W114_ALPHA = (1, 7, 78, 79, 86, 91)
W114_TARGET_EXPONENT = (0, 6, 77, 78, 85, 90)
W114_TARGET_MONOMIAL = "x1^6*x2^77*x3^78*x4^85*x5^90"

HARD_BOUNDARIES = (
    "SOFTWARE_VERIFICATION != MATHEMATICAL_PROOF",
    "METHOD_TRANSFER != EVIDENCE_TRANSFER",
    "FAILED_ANSATZ != NONALGEBRAIC_CLASS",
    "TIMEOUT != NEGATIVE_RESULT",
    "OPEN != FALSE",
    "CURRENT != PROVED",
    "RELATION != SUPPORT",
    "INTERLINGUA_TRANSLATION != PROOF",
    "LEVEL57_SIGN != FULL_114_DUPLICATION_SIGN",
)

class Currentness(str, Enum):
    CURRENT_CANONICAL = "CURRENT_CANONICAL"
    HISTORICAL_PREDECESSOR = "HISTORICAL_PREDECESSOR"
    HISTORICAL_SUPERSEDED = "HISTORICAL_SUPERSEDED"
    COEXISTING_LINEAGE = "COEXISTING_LINEAGE"
    PRESERVED_UNRESOLVED = "PRESERVED_UNRESOLVED"
    PRESERVED = "PRESERVED"

class EvidenceKind(str, Enum):
    EXACT_COMPUTATION = "EXACT_COMPUTATION"
    EXACT_IDENTITY = "EXACT_IDENTITY"
    BOUNDED_NEGATIVE = "BOUNDED_NEGATIVE"
    METHOD_ONLY = "METHOD_ONLY"
    REALIZATION_MATCH = "REALIZATION_MATCH"
    UNRESOLVED = "UNRESOLVED"

class Outcome(str, Enum):
    PROVED_LOCAL = "PROVED_LOCAL"
    REFUTED_LOCAL = "REFUTED_LOCAL"
    OPEN = "OPEN"
    TIMEOUT = "TIMEOUT"

@dataclass(frozen=True)
class Evidence:
    label: str
    kind: EvidenceKind
    statement: str
    claim_ceiling: str

@dataclass
class Obligation:
    obligation_id: str
    text: str
    route_id: str
    finite_check: str
    status: Outcome = Outcome.OPEN
    residual: str = ""
    depends_on: Tuple[str, ...] = ()

@dataclass
class Route:
    route_id: str
    label: str
    currentness: Currentness
    local_target: str
    translation_contract: str
    claim_ceiling: str
    return_path: str
    evidence: List[Evidence] = field(default_factory=list)
    obligations: List[str] = field(default_factory=list)

@dataclass(frozen=True)
class TraceStep:
    step_no: int
    operator: str
    route_id: str
    obligation_id: str
    one_degree: str
    observation: str
    verifier_result: Outcome
    residual: str
    provenance_digest: str

@dataclass
class ResearchState:
    routes: Dict[str, Route]
    obligations: Dict[str, Obligation]
    trace: List[TraceStep] = field(default_factory=list)

    def validate(self) -> None:
        if sum(W114_ALPHA) != 342:
            raise AssertionError("W114 alpha must sum to 3*114.")
        if sum(W114_TARGET_EXPONENT) != 336:
            raise AssertionError("Target exponent degree must be 336.")
        if tuple(a - 1 for a in W114_ALPHA) != W114_TARGET_EXPONENT:
            raise AssertionError("Target exponent must equal alpha - 1.")
        for oid, ob in self.obligations.items():
            if ob.route_id not in self.routes:
                raise AssertionError(f"{oid}: unknown route {ob.route_id}")
            for dep in ob.depends_on:
                if dep not in self.obligations:
                    raise AssertionError(f"{oid}: unknown dependency {dep}")
        for rid, route in self.routes.items():
            for oid in route.obligations:
                if oid not in self.obligations:
                    raise AssertionError(f"{rid}: unknown obligation {oid}")
                if self.obligations[oid].route_id != rid:
                    raise AssertionError(f"{rid}: obligation {oid} points elsewhere")

    def open_obligations(self):
        return [o for o in self.obligations.values()
                if o.status in {Outcome.OPEN, Outcome.TIMEOUT}]

    def choose_next_probe(self) -> Obligation:
        # Navigation priority only; never mathematical authority.
        rank = {
            Currentness.CURRENT_CANONICAL: 0,
            Currentness.COEXISTING_LINEAGE: 1,
            Currentness.PRESERVED_UNRESOLVED: 2,
            Currentness.PRESERVED: 3,
            Currentness.HISTORICAL_PREDECESSOR: 4,
            Currentness.HISTORICAL_SUPERSEDED: 5,
        }
        candidates = self.open_obligations()
        if not candidates:
            raise RuntimeError("No open finite obligations remain.")
        candidates.sort(key=lambda o: (
            rank[self.routes[o.route_id].currentness],
            0 if o.status == Outcome.OPEN else 1,
            len(o.depends_on),
            o.obligation_id,
        ))
        return candidates[0]

    def apply_observation(self, obligation_id: str, *, operator: str,
                          one_degree: str, observation: str,
                          verifier_result: Outcome, residual: str) -> TraceStep:
        if obligation_id not in self.obligations:
            raise KeyError(obligation_id)
        if not one_degree.strip():
            raise ValueError("one_degree must name the single independent change.")
        ob = self.obligations[obligation_id]
        ob.status = verifier_result
        ob.residual = residual
        payload = {
            "step_no": len(self.trace) + 1,
            "operator": operator,
            "route_id": ob.route_id,
            "obligation_id": obligation_id,
            "one_degree": one_degree,
            "observation": observation,
            "verifier_result": verifier_result.value,
            "residual": residual,
        }
        digest = sha256(json.dumps(
            payload, sort_keys=True, separators=(",", ":")
        ).encode()).hexdigest()
        step = TraceStep(
            payload["step_no"], operator, ob.route_id, obligation_id,
            one_degree, observation, verifier_result, residual, digest
        )
        self.trace.append(step)
        return step

    def recenter(self) -> Obligation:
        return self.choose_next_probe()

    def teach(self) -> str:
        p = self.choose_next_probe()
        r = self.routes[p.route_id]
        return (
            f"Center W114 alpha={W114_ALPHA}; target={W114_TARGET_MONOMIAL}. "
            f"Next finite obligation {p.obligation_id} on {r.label}. "
            f"Obligation: {p.text} Check: {p.finite_check} "
            f"Ceiling: {r.claim_ceiling}"
        )

    def distill(self) -> dict:
        nxt = self.choose_next_probe() if self.open_obligations() else None
        return {
            "schema": "conscience64/w114-research-loop/v1",
            "target": {
                "alpha": list(W114_ALPHA),
                "jacobian_exponent": list(W114_TARGET_EXPONENT),
                "monomial": W114_TARGET_MONOMIAL,
            },
            "counts": {
                "routes": len(self.routes),
                "obligations": len(self.obligations),
                "open_or_timeout": len(self.open_obligations()),
                "trace_steps": len(self.trace),
            },
            "next_probe": None if nxt is None else {
                "obligation_id": nxt.obligation_id,
                "route_id": nxt.route_id,
                "text": nxt.text,
                "finite_check": nxt.finite_check,
            },
            "hard_boundaries": list(HARD_BOUNDARIES),
        }

def default_state() -> ResearchState:
    routes = {
        "mf": Route(
            "mf", "Matrix factorization / coherent sheaf",
            Currentness.COEXISTING_LINEAGE,
            "Explicit graded A,B with AB=BA=Q I and nonzero W114 coefficient.",
            "matrix factorization <-> coherent sheaf/K-class",
            "NONZERO_TARGET_COEFFICIENT != FULL_HODGE_PROOF; "
            "MATCHED_EIGENSPACE != AUTHENTICATED_SOURCE_SHEAF",
            "Recover A,B, grading, trace, coefficient computation, and source authentication.",
            [Evidence(
                "factorization controls", EvidenceKind.BOUNDED_NEGATIVE,
                "Cheap/pair-separable factorization carriers have exact negative controls.",
                "FAILED_ANSATZ != NONALGEBRAIC_CLASS"
            )],
            ["MF-1", "MF-2"],
        ),
        "shioda": Route(
            "shioda", "Direct cubic Delsarte / Shioda transport",
            Currentness.HISTORICAL_SUPERSEDED,
            "Direct degree-114 cubic Delsarte preimage of W114.",
            "Jacobian residue monomial <-> Fermat character",
            "NO_CUBIC_DELSARTE_SHIODA_PREIMAGE != "
            "NO_HIGHER_DEGREE_OR_WEIGHTED_PREIMAGE",
            "Retain exact enumeration receipts and necessary character equation.",
            [Evidence(
                "all six-monomial cubic Delsarte screen", EvidenceKind.BOUNDED_NEGATIVE,
                "Necessary character equation has no admissible cubic six-row solution.",
                "Direct cubic carrier species only."
            )],
            [],
        ),
        "lift": Route(
            "lift", "Higher level / certificate lift",
            Currentness.PRESERVED_UNRESOLVED,
            "Determine whether deeper lifted certificates fire.",
            "base Fermat character <-> canonical level lift",
            "NO_FIRE_e2_TO_e8_DEPTH2 != NO_LEVEL_LIFT_EXISTS; TIMEOUT != NO_FIRE",
            "Preserve multiplier, level, depth, predicates, runtime, and exact result.",
            [
                Evidence(
                    "e=2..8 depth<=2", EvidenceKind.BOUNDED_NEGATIVE,
                    "All three W114 wall representatives remain NO-FIRE at frozen depth <=2.",
                    "Only e=2..8 and depth<=2."
                ),
                Evidence(
                    "level342 depth3", EvidenceKind.UNRESOLVED,
                    "Depth-3 attempt exceeded bounded runtime.",
                    "UNRESOLVED_BY_RUNTIME"
                ),
            ],
            ["LIFT-1"],
        ),
        "motivic": Route(
            "motivic", "Gauss/Jacobi / Hecke -> explicit Chow correspondence",
            Currentness.CURRENT_CANONICAL,
            "Construct the localized rank-one Chow/motivic morphism.",
            "realization-level character match <-> Chow correspondence",
            "EXACT_HECKE_CHARACTER_MATCH + EXPLICIT_ARTIN_TWIST "
            "!= EXPLICIT_CHOW_ISOMORPHISM",
            "Recover source motive, target motive, Artin factor, correspondence, and verification.",
            [
                Evidence(
                    "quadratic Artin carrier", EvidenceKind.EXACT_IDENTITY,
                    "Explicit coefficient twist supplies the A_q carrier.",
                    "Carrier only; not the missing Chow isomorphism."
                ),
                Evidence(
                    "Hecke/Frobenius character match", EvidenceKind.REALIZATION_MATCH,
                    "Arithmetic realizations agree at the recorded character level.",
                    "REALIZATION_MATCH != CHOW_MORPHISM"
                ),
                Evidence(
                    "corrected level-57 quadratic sign", EvidenceKind.EXACT_IDENTITY,
                    "After exact standard normalization, the Aoki/Yamamoto sign is "
                    "chi_114(3*(7-zeta_3))^57. This level-57 sign remains current.",
                    "CORRECTED_SIGN_NORMALIZATION != CHOW_MORPHISM"
                ),
                Evidence(
                    "even-level reflection sign", EvidenceKind.EXACT_IDENTITY,
                    "Exact p=571 Jacobi counterprobe shows the full 114->57 compiler "
                    "requires the additional quadratic factor chi_114(-1), matching "
                    "the +N_1-N_2 characteristic-zero reflection quotient A(-1,1).",
                    "EVEN_REFLECTION_SIGN_CORRECTION != CHOW_MORPHISM"
                ),
            ],
            ["MOT-1"],
        ),
    }
    obligations = {
        "MOT-1": Obligation(
            "MOT-1",
            "Construct one explicit nonzero correspondence from the residual gap motive "
            "to the standard-part motive tensored with the corrected level-57 quadratic "
            "Artin sign motive A(3*(7-zeta_3)), while retaining the additional "
            "even-level duplication/reflection descent factor A(-1,1).",
            "motivic",
            "Write a concrete cycle/correspondence and independently verify source, target, "
            "Galois behavior, corrected level-57 sign normalization, even-level "
            "A(-1,1) reflection factor, and induced realization map; keep the full "
            "order-114 Kummer/descent carrier explicit.",
        ),
        "MF-1": Obligation(
            "MF-1",
            "Specify one genuinely mixed non-CI graded matrix-factorization ansatz.",
            "mf",
            "Verify grading and AB=BA=Q I exactly before evaluating Chern-character data.",
        ),
        "MF-2": Obligation(
            "MF-2",
            "Evaluate the exact W114 target coefficient for an authenticated factorization.",
            "mf",
            f"Compute coeff[{W114_TARGET_MONOMIAL}] in the Favero-Kelly trace expression exactly.",
            depends_on=("MF-1",),
        ),
        "LIFT-1": Obligation(
            "LIFT-1",
            "Resolve or sharpen the level-342 depth-3 timeout without reinterpreting it "
            "as negative evidence.",
            "lift",
            "Run one bounded resource/algorithm change and record FIRE, NO-FIRE, or TIMEOUT exactly.",
            status=Outcome.TIMEOUT,
        ),
    }
    state = ResearchState(routes, obligations)
    state.validate()
    return state

def run_habit_cycle(state: ResearchState) -> dict:
    state.validate()
    probe = state.choose_next_probe()
    return {
        "freeze": {
            "alpha": W114_ALPHA,
            "target": W114_TARGET_MONOMIAL,
            "boundaries": HARD_BOUNDARIES,
        },
        "center": probe.obligation_id,
        "route": probe.route_id,
        "one_degree_rule": "Change exactly one independently varying quantity.",
        "observe": "No new mathematical observation supplied by this control-cycle invocation.",
        "verify": "PENDING",
        "counterprobe": state.routes[probe.route_id].claim_ceiling,
        "recenter": probe.obligation_id,
        "teach": state.teach(),
        "distill": state.distill(),
    }

if __name__ == "__main__":
    print(json.dumps(run_habit_cycle(default_state()), indent=2))
