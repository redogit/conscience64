import unittest
import verify_w114_n3_transfer_correspondence as m

class N3TransferTests(unittest.TestCase):
    def test_degrees(self):
        self.assertEqual(m.DEG_C2_TO_T,114)
        self.assertEqual(m.DEG_X_TO_T,3249)
    def test_all_standard_word_cases_pass(self):
        out=m.run()
        self.assertEqual([x["a"] for x in out["cases"]],[4,11,16,17])
        self.assertTrue(all(x["alpha_cubed_nontrivial"] for x in out["cases"]))
    def test_projector_composition_scalar_is_one(self):
        self.assertTrue(all(x["composition_scalar"]=="1" for x in m.run()["cases"]))
    def test_mu3_pullbacks(self):
        self.assertEqual(m.CHI3,(19,38))
        self.assertEqual(sum(m.CHI3)%57,0)

if __name__=="__main__": unittest.main()
