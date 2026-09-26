import unittest
import w114_otsubo_yamazaki_factorization as m

class OtsuboYamazakiW114Tests(unittest.TestCase):
    def test_exact_recursive_factorization_arithmetic(self):
        out=m.run()
        self.assertEqual(out["curve_factors"], [[86,91],[79,63],[78,28],[7,106]])
        self.assertTrue(all(s["merged"] != 0 for s in out["steps"]))
        self.assertEqual([s["merged"] for s in out["steps"]],[63,28,106])
    def test_projective_translation_checksum(self):
        self.assertEqual(sum(m.ALPHA) % m.D,0)
        self.assertEqual(sum(m.CHI) % m.D,(-m.ALPHA[0]) % m.D)
    def test_no_curve_factor_has_trivial_product(self):
        out=m.run()
        self.assertTrue(all((a+b)%m.D != 0 for a,b in out["curve_factors"]))

if __name__=="__main__": unittest.main()
