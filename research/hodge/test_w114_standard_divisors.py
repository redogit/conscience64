from fractions import Fraction
import unittest

import w114_standard_divisors as s


class StandardDivisorChecks(unittest.TestCase):
    def test_exact_containment_and_wrong_root_sign(self):
        self.assertTrue(s.containment())
        with self.assertRaisesRegex(ValueError, "not contained"):
            s.containment(rho_power=3)

    def test_independent_jacobian_pairing(self):
        for a in s.GENERATORS:
            self.assertEqual(s.jacobian_pairing(a)["pairing"], "-19")
            self.assertEqual(s.jacobian_coefficient(s.gamma(a)), {str(a): -61731})
            self.assertEqual(s.jacobian_coefficient(tuple(-x % 57 for x in s.gamma(a))),
                             {str(19-a): 61731})

    def test_all_galois_sectors_are_nonzero(self):
        for a in s.GENERATORS:
            row = s.divisor(a)
            self.assertEqual(row["galois_units_checked"], 36)
            self.assertTrue(all(x["homological_class_coefficient"] for x in row["galois_orbit"]))

    def test_finite_carrier_factor_in_inverse(self):
        self.assertEqual(s.inverse_check(), 1)
        with self.assertRaisesRegex(ValueError, "gives 19"):
            s.inverse_check(Fraction(-1, 19))
        with self.assertRaisesRegex(ValueError, "gives -1"):
            s.inverse_check(Fraction(1, 361))

    def test_variance_is_checked_against_the_actual_kummer_action(self):
        with self.assertRaisesRegex(ValueError, "dual pullback"):
            s.check_galois_sector(4, 1, s.gamma(4))
        self.assertEqual(len(s.rejected_inputs()), 4)

    def test_actual_joined_padding(self):
        padding = s.standard_padding()
        self.assertEqual(padding["source"], "A(3,27)(9)")
        self.assertEqual(len(padding["character"]), 20)
        self.assertEqual(sum(padding["character"]), 10*57)
        self.assertEqual(padding["projected_pairing"], "-24134536953")
        self.assertEqual(padding["roundtrip_scalar"], "1")

    def test_positive_stabilization_keeps_real_endpoints(self):
        row = s.positive_stabilization()
        self.assertEqual(len(row["residual_positive_tuple"]), 10)
        self.assertEqual(len(row["aoki_positive_tuple"]), 18)
        self.assertEqual(len(row["common_positive_tuple"]), 30)
        self.assertIn("NOT_COMPILED", row["status"])

    def test_direct_frobenius_sums(self):
        rows = s.frobenius_checks()["rows"]
        self.assertEqual(len(rows), 8)
        self.assertTrue(all(r["direct_jacobi_power_basis"] == r["predicted_power_basis"] for r in rows))

    def test_failed_shortcuts_are_retained(self):
        rows = s.pairwise_counterprobe()["rows"]
        self.assertEqual(sorted(r["mismatch_count"] for r in rows), [8, 8, 12, 12, 16, 16])
        self.assertTrue(all(not r["hits"] for r in s.direct_cycle_counterprobe()["rows"]))


if __name__ == "__main__":
    unittest.main()
