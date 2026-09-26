import unittest
import verify_w114_explicit_artin_carrier as m

class ExplicitArtinCarrierTests(unittest.TestCase):
    def test_curve_factor_product_exponents(self):
        self.assertEqual(m.product_exponent(m.P),113)
        self.assertEqual(m.product_exponent(m.Q),28)
    def test_quadratic_combination(self):
        out=m.run()
        self.assertEqual(out["resulting_character_exponent"],57)
        self.assertEqual(out["resulting_character_order"],2)
    def test_uses_admitted_w114_curve_factors(self):
        admitted={(7,106),(78,28),(79,63),(86,91)}
        self.assertIn(m.P,admitted)
        self.assertIn(m.Q,admitted)

if __name__=="__main__": unittest.main()
