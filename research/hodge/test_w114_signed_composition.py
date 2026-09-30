"""Adversarial contract tests; no finite pass admits MOT-1."""
from copy import deepcopy
from fractions import Fraction
import unittest

import w114_signed_composition as m


class SignedCompositionTests(unittest.TestCase):
    def test_source_target_projector_fixes_the_named_plane(self):
        out = m.plane_source_check()
        self.assertEqual(out["projector_action_matrix"], [["1", "0"], ["0", "0"]])
        self.assertEqual(out["historical_action_matrix"], [["0", "0"], ["0", "1"]])
        self.assertEqual(out["rank_one_projector"], "P_f = 57 * (z_bar_f x z_f)")
        with self.assertRaisesRegex(ValueError, "annihilates z_f"):
            m.check_plane_projector("z_f", "z_bar_f")

    def test_aggregate_block_claims_cannot_be_forged(self):
        block = m.signed_block()
        self.assertTrue(m.check_block(block))
        for key, value in (("target", ["W114"]), ("inverse", "identity"),
                           ("w114_endpoint", True), ("motivic_weight", 4),
                           ("cycle_dimension_in_source_x_target", 4)):
            forged = deepcopy(block)
            forged[key] = value
            with self.assertRaises(ValueError):
                m.check_block(forged)

    def test_signed_word_and_its_galois_orbit(self):
        out = m.word_check()
        self.assertEqual(out["artin_2_exponent"], 100)
        self.assertEqual(out["galois_units_checked"], 36)
        with self.assertRaisesRegex(ValueError, "word"):
            m.word_check(((7, 1), (22, 1), (23, 1), (56, -1)))

    def test_fermat_quotient_normalizations_are_load_bearing(self):
        for n, a, quotient in ((2, 7, 57), (3, 4, 361)):
            edge = m.transfer(n, a)
            self.assertEqual(m.roundtrip_scalar(edge), Fraction(1))
            forged = deepcopy(edge)
            forged["inverse_scale"] = str(Fraction(edge["inverse_scale"]) * quotient)
            self.assertEqual(m.roundtrip_scalar(forged), quotient)
            with self.assertRaisesRegex(ValueError, "normalization"):
                m.check_transfer(forged)

    def test_missing_symmetrizer_factor_is_rejected(self):
        edge = m.transfer(3, 11)
        edge["inverse_scale"] = str(Fraction(edge["inverse_scale"]) / 2)
        self.assertEqual(m.roundtrip_scalar(edge), Fraction(1, 2))
        with self.assertRaisesRegex(ValueError, "normalization"):
            m.check_transfer(edge)

    def test_boundary_exception_is_rejected(self):
        for n, a in ((2, 57), (3, 19)):
            with self.assertRaisesRegex(ValueError, "boundary"):
                m.transfer(n, a)

    def test_geometry_is_part_of_the_transfer_contract(self):
        edge = m.transfer(2, 7)
        edge["geometry"]["Q"] = "identity"
        with self.assertRaisesRegex(ValueError, "metadata"):
            m.check_transfer(edge)

    def test_signed_tensor_context_is_composable_but_bare_plane_is_not(self):
        block = m.signed_block()
        self.assertEqual(m.check_chain(block["steps"], block["source"]), block["target"])
        with self.assertRaisesRegex(ValueError, "source"):
            m.check_chain(block["steps"], ["P_f"])
        forged = deepcopy(block["steps"])
        forged[1]["source"] = ["W114"]
        with self.assertRaisesRegex(ValueError, "source"):
            m.check_chain(forged, block["source"])

    def test_finite_field_norm_has_no_characteristic_zero_lift_by_relabeling(self):
        with self.assertRaisesRegex(ValueError, "Artin-Schreier"):
            m.check_norm_category("Q(zeta_114)")

    def test_terminal_target_and_cycle_cannot_be_forged(self):
        block = m.signed_block()
        for key, value in (("target", ["W114"]), ("cycle", "identity"), ("sign", 1)):
            forged = deepcopy(block["steps"])
            forged[-1][key] = value
            with self.assertRaises(ValueError):
                m.check_chain(forged, block["source"])

    def test_galois_transports_characters_and_quadratic_radicand(self):
        orbit = m.galois_check()
        self.assertEqual(len(orbit), 36)
        self.assertEqual({x["sign_radicand"] for x in orbit},
                         {"3*(7-zeta_3)", "3*(7-zeta_3^2)"})
        self.assertTrue(all(x["sign_exponent"] == 57 for x in orbit))
        self.assertTrue(all(x["all_transfer_boundaries_pass"] for x in orbit))

    def test_realization_is_independently_computed(self):
        # Direct finite-field Jacobi sums, rather than the free-vector identity.
        for p in (229, 571):
            r = m.realization_check(p)
            self.assertTrue(all(x["exact_match"] for x in r["n2"] + r["n3"]))
            self.assertTrue(r["signed_block_match"])

    def test_same_additive_character_norm_keeps_minus_one_factor(self):
        self.assertEqual(m.reflection_phase_check(229)["norm_ratio_exponent"], 0)
        out = m.reflection_phase_check(571)
        self.assertEqual(out["norm_ratio_exponent"], 57)
        self.assertEqual(out["with_all_plus_coefficient_exponent"], 0)

    def test_failed_proposals_remain_open_and_preserved(self):
        out = m.run()
        self.assertEqual(out["mot1_status"], "OPEN")
        self.assertFalse(out["w114_plane_cycle_produced"])
        self.assertGreaterEqual(len(out["counterprobes"]), 6)
        self.assertTrue(all(x["rejected"] for x in out["counterprobes"]))
        self.assertIn("MOT-1 REMAINS OPEN", out["claim_ceiling"])


if __name__ == "__main__":
    unittest.main()
