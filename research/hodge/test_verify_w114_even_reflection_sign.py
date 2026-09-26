import unittest
import verify_w114_even_reflection_sign as m

class EvenReflectionSignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out=m.run()

    def test_p229_preserved_calibration(self):
        x=self.out["calibration_p229"]
        self.assertEqual(x["ratio_over_recorded_twist"],1)
        self.assertEqual(x["chi_minus_one_mod_ell"],1)

    def test_p571_refutes_old_full_twist(self):
        for x in self.out["counterprobe_p571"]:
            self.assertEqual(x["ratio_over_recorded_twist"],x["ell"]-1)
            self.assertEqual(x["ratio_over_recorded_twist"],x["chi_minus_one_mod_ell"])

    def test_p571_corrected_twist_closes(self):
        for x in self.out["counterprobe_p571"]:
            self.assertEqual(x["ratio_over_corrected_twist"],1)

    def test_reflection_word_predicts_quadratic_factor(self):
        r=self.out["reflection_word_factor"]
        self.assertEqual(r["raw_exponent_mod114"],113)
        self.assertEqual(r["quadratic_parity"],1)
        self.assertEqual(r["factor"],"A(-1,1)")

if __name__=="__main__":unittest.main()
