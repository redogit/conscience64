from collections import Counter
from copy import deepcopy
from fractions import Fraction
import unittest

import w114_aoki_square as c


class AokiSquareChecks(unittest.TestCase):
    def test_unsquared_standard_word_parity_countercertificate(self):
        r = c.standard_parity_obstruction()
        self.assertEqual(r['generators_checked'], 148)
        self.assertEqual(r['aoki_value'], 1)
        self.assertEqual(r['functional_support'], [17, 21, 26, 31, 36, 40])

    def test_p19_containment_and_inverse(self):
        g = c.standard19()
        self.assertEqual(g['newton_containment']['p19'], [[[19], 19]])
        self.assertEqual(g['newton_containment']['fermat_remainder_coefficient'], 0)
        self.assertEqual(g['projected_pairing'], str(-3**17))
        self.assertEqual(3*Fraction(g['projected_pairing'])*Fraction(g['inverse_scale']), 1)
        self.assertEqual(g['galois_units_checked'], 36)

    def test_right_standard_cycle_and_exact_descent(self):
        r = c.standard_right()
        self.assertEqual(r['carrier_degree'], 1)
        self.assertEqual(r['projected_pairing'], str(-57**8*19**9))
        self.assertEqual(r['cycle_dimension'], 27)
        self.assertEqual(Fraction(r['projected_pairing'])*Fraction(r['inverse_scale']), 1)

    def test_positive_endpoint_permutation(self):
        r = c.compose()
        self.assertEqual(Counter(r['joins'][-1]['target']), Counter(r['standard_right']['character']))
        self.assertEqual(len(r['joins'][-1]['target']), 56)
        self.assertEqual(r['galois_units_checked'], 36)
        self.assertEqual(r['source_weight'], r['target_weight'])
        self.assertEqual(r['cycle_dimension'], 16)

    def test_no_unsquared_root_claim(self):
        r = c.run()
        self.assertTrue(c.check(r['composition']))
        forged = deepcopy(r['composition'])
        forged['target'] = 'quadratic Artin root'
        with self.assertRaisesRegex(ValueError, 'certificate'):
            c.check(forged)
        self.assertEqual(len(r['counterprobes']), 3)
        self.assertEqual(r['mot_1'], 'MOT-1 REMAINS OPEN')
        self.assertIn('TENSOR_SQUARE_ISOMORPHISM != QUADRATIC_ROOT_CORRESPONDENCE', r['claim_ceilings'])


if __name__ == '__main__':
    unittest.main()
