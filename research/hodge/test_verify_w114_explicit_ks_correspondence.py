import unittest
import verify_w114_explicit_ks_correspondence as m

class ExplicitKSCorrespondenceTests(unittest.TestCase):
    def test_all_stages_are_h_trivial_and_exceptional_free(self):
        out=m.run()
        self.assertEqual(len(out["stages"]),3)
        for s in out["stages"]:
            self.assertEqual(s["H_restriction_exponent"],0)
            self.assertNotEqual(s["merged_exponent"],0)
    def test_merge_sequence(self):
        self.assertEqual([s["merged_exponent"] for s in m.run()["stages"]],[63,28,106])
    def test_exact_quotient_degree(self):
        self.assertTrue(all(s["quotient_degree"]==114 for s in m.run()["stages"]))
    def test_inverse_has_normalization(self):
        self.assertTrue(all("(1/114)" in s["inverse_correspondence"] for s in m.run()["stages"]))

if __name__=="__main__": unittest.main()
