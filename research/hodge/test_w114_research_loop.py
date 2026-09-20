import unittest
from w114_research_loop import (
    Currentness, Outcome, W114_ALPHA, W114_TARGET_EXPONENT,
    default_state, run_habit_cycle
)

class W114ResearchLoopTests(unittest.TestCase):
    def test_target_contract(self):
        self.assertEqual(sum(W114_ALPHA), 342)
        self.assertEqual(sum(W114_TARGET_EXPONENT), 336)
        self.assertEqual(tuple(a - 1 for a in W114_ALPHA), W114_TARGET_EXPONENT)

    def test_default_state_validates(self):
        default_state().validate()

    def test_minspan_selects_localized_motivic_hole(self):
        state = default_state()
        probe = state.choose_next_probe()
        self.assertEqual(probe.obligation_id, "MOT-1")
        self.assertEqual(
            state.routes[probe.route_id].currentness,
            Currentness.CURRENT_CANONICAL
        )

    def test_timeout_stays_unresolved(self):
        state = default_state()
        self.assertEqual(state.obligations["LIFT-1"].status, Outcome.TIMEOUT)
        self.assertIn(state.obligations["LIFT-1"], state.open_obligations())

    def test_one_degree_is_required(self):
        state = default_state()
        with self.assertRaises(ValueError):
            state.apply_observation(
                "MOT-1", operator="COUNTERPROBE", one_degree="",
                observation="none", verifier_result=Outcome.OPEN,
                residual="still open"
            )

    def test_trace_is_provenance_addressed(self):
        state = default_state()
        step = state.apply_observation(
            "MOT-1", operator="CONSTRUCT",
            one_degree="candidate correspondence shape",
            observation="candidate remains unauthenticated",
            verifier_result=Outcome.OPEN,
            residual="need exact source-target verification"
        )
        self.assertEqual(len(step.provenance_digest), 64)
        self.assertEqual(len(state.trace), 1)

    def test_habit_does_not_invent_evidence(self):
        cycle = run_habit_cycle(default_state())
        self.assertEqual(cycle["verify"], "PENDING")
        self.assertIn("No new mathematical observation", cycle["observe"])

if __name__ == "__main__":
    unittest.main()
