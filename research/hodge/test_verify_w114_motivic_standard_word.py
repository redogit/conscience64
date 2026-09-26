import unittest
import verify_w114_motivic_standard_word as m

class MotivicStandardWordTests(unittest.TestCase):
    def test_all_gamma3_generators_meet_n3_theorem_hypothesis(self):
        for a in m.GAMMA_A:
            self.assertTrue(m.theorem_1_1_ii_hypothesis(a))
    def test_exact_gamma3_residue_patterns(self):
        out=m.run()
        got={x["a"]:x["relation"] for x in out["multiplication_generators"]}
        self.assertEqual(got,{
            4:[4,23,42,45],
            11:[11,30,49,24],
            16:[16,35,54,9],
            17:[17,36,55,6],
        })
    def test_reflection_generators_are_nonzero(self):
        out=m.run()
        self.assertTrue(all(0 not in x["relation"] for x in out["reflection_generators"]))

if __name__=="__main__": unittest.main()
