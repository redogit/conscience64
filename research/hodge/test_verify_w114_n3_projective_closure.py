import unittest
import verify_w114_n3_projective_closure as m

class N3ProjectiveClosureTests(unittest.TestCase):
    def test_x_boundaries_are_projector_zero(self):
        for case in m.run()["cases"]:
            self.assertNotEqual(case["X_boundary_diagonal_exponent"],0)
            self.assertEqual(case["X_boundary"],"PROJECTOR_ZERO")
    def test_curve_boundaries_are_projector_zero(self):
        for case in m.run()["cases"]:
            for c in case["curve_factors"]:
                self.assertNotEqual(c["u0_boundary_diagonal_exponent"],0)
                self.assertNotEqual(c["u1_boundary_alpha_exponent"],0)
                self.assertEqual(c["u0_boundary"],"PROJECTOR_ZERO")
                self.assertEqual(c["u1_boundary"],"PROJECTOR_ZERO")
    def test_curve_characters_descend_through_mu19_quotient(self):
        for case in m.run()["cases"]:
            self.assertTrue(all(c["mu19_kernel_character_exponent"]==0
                                for c in case["curve_factors"]))

if __name__=="__main__": unittest.main()
