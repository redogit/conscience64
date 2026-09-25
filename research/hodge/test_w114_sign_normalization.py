import unittest

import verify_w114_sign_normalization as v


class W114SignNormalizationTests(unittest.TestCase):
    def test_standard_difference_word(self):
        out=v.verify_relation_word()
        self.assertEqual(out["word_l1"],7)
        self.assertEqual(out["p_exponent"],-9)
        self.assertEqual(out["eta3_exponent_mod57"],30)

    def test_exact_cyclotomic_square(self):
        out=v.verify_cyclotomic_square()
        self.assertEqual(
            out["identity"],
            "w^2*(-15-2*sqrt(57))=3*(7-zeta_3)"
        )

    def test_prime571_counterprobe(self):
        out=v.verify_prime571_counterprobe()
        self.assertEqual(out["ratio_mod_p"],405)
        self.assertEqual(out["ratio_sqrt_mod_p"],216)


if __name__=="__main__":
    unittest.main()
