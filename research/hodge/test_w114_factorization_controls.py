import unittest

import w114_factorization_controls as w


class ControlsTest(unittest.TestCase):
    def test_positive_standard_character_has_pairing(self):
        alpha = (1, 113, 7, 107, 36, 78)
        self.assertTrue(w.has_complementary_pairing(alpha, 114))

    def test_all_w114_galois_conjugates_fail_standard_pairing(self):
        result = w.run()
        self.assertEqual(result["level"], 114)
        self.assertEqual(result["units_checked"], 36)
        self.assertEqual(len(result["walls"]), 3)
        for row in result["walls"]:
            self.assertEqual(row["galois_conjugates_checked"], 36)
            self.assertEqual(row["conjugates_with_full_complementary_pairing"], 0)
            self.assertEqual(row["conjugates_with_any_complementary_pair"], 0)

    def test_target_monomial_degree(self):
        result = w.run()
        first = result["walls"][0]
        self.assertEqual(first["monomial_exponents"], [0, 6, 77, 78, 85, 90])
        self.assertEqual(sum(first["monomial_exponents"]), 336)
        self.assertEqual(first["middle_jacobian_degree"], 336)


if __name__ == "__main__":
    unittest.main()
