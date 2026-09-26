import unittest
import verify_w114_duplication_reflection_primitives as m

class DuplicationReflectionPrimitiveTests(unittest.TestCase):
    def test_all_four_n2_edges_pass(self):
        out=m.run()
        self.assertEqual([x["a"] for x in out["n2_edges"]],[7,22,23,56])
        self.assertTrue(all(x["deg_C_to_T"]==1 for x in out["n2_edges"]))
        self.assertTrue(all(x["deg_X_to_T"]==114 for x in out["n2_edges"]))
        self.assertTrue(all(x["composition_scalar"]=="1" for x in out["n2_edges"]))
    def test_n2_boundaries_are_projector_zero(self):
        for row in m.run()["n2_edges"]:
            b=row["projective_boundary"]
            self.assertNotEqual(b["X_diagonal_exponent"],0)
            self.assertNotEqual(b["curve_u0_diagonal_exponent"],0)
            self.assertNotEqual(b["curve_u1_alpha_exponent"],0)
            self.assertEqual(b["mu57_kernel_eval_exponent"],0)
    def test_signed_artin_exponent(self):
        self.assertEqual(m.run()["signed_artin_2_exponent"],100)
    def test_reflection_intersection(self):
        self.assertTrue(all(x["intersection_number"]==-1
                            for x in m.run()["reflection_edges"]))

if __name__=="__main__": unittest.main()
