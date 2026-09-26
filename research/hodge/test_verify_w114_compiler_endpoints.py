import unittest
import verify_w114_compiler_endpoints as m

class CompilerEndpointTests(unittest.TestCase):
    def test_plane_source(self):
        x=m.plane_check()
        self.assertEqual(x["projected_pairing"],"1/57")
        self.assertEqual(x["fourier_coefficient"],57**2)
    def test_duplication_word(self):
        x=m.duplication_check()
        self.assertEqual(x["chi_114_2_exponent"],100)
        self.assertEqual(x["word"],"D2_7 + D2_22 - D2_23 - D2_56 + N_1 - N_2")
    def test_corrected_artin_target(self):
        x=m.artin_target_check()
        self.assertEqual(x["corrected_factorization"]["3"],60)
        self.assertEqual(x["corrected_factorization"]["3q"],57)
        self.assertEqual((60+57)%114,3)

if __name__=="__main__": unittest.main()
