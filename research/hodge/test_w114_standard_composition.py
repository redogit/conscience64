from copy import deepcopy
from fractions import Fraction
import unittest

import w114_standard_composition as c


class StandardCompositionChecks(unittest.TestCase):
    def test_finite_artin_diagonal_normalizations(self):
        for degree in (3, 19, 57):
            r = c.finite_artin_product(degree, 1, degree-1)
            self.assertEqual(r['product_character'], 0)
            self.assertEqual(Fraction(r['unscaled_diagonal_contraction'])*degree, 1)
            self.assertEqual(r['roundtrip_scalar'], '1')
        with self.assertRaisesRegex(ValueError, 'degree'):
            c.finite_artin_product(0, 1, -1)

    def test_minimum_join_and_primitive_boundaries(self):
        j = c.join((1, 56), (2, 55))
        self.assertEqual(j['target_dimension'], 2)
        self.assertEqual(j['cycle_dimension'], 1)
        self.assertEqual(j['fiber_degree_of_normal'], -57)
        self.assertEqual(Fraction(j['inverse_scale'])*j['fiber_degree_of_normal'], 1)
        for bad in ((0, 0), (1, 1), (57, 0), (1, 2, 54)):
            with self.assertRaisesRegex(ValueError, 'primitive'):
                c.join(bad, (1, 56))

    def test_actual_endpoint_dimensions_and_twists(self):
        r = c.compose()
        self.assertEqual(r['source_weight'], r['target_weight'])
        self.assertEqual(r['cycle_dimension'], 12)
        self.assertEqual(r['left_inverse_scale'], '1/26137703520099')
        self.assertEqual(r['right_inverse_scale'], '1')
        self.assertEqual(r['roundtrip_scalar'], '1')

    def test_permutation_in_both_directions_and_all_conjugates(self):
        r = c.compose()
        p = r['permutation']
        source, target = r['left_join']['target'], r['right_join']['target']
        self.assertEqual([source[i] for i in p['target_coordinate_to_source_coordinate']], target)
        self.assertEqual([target[i] for i in p['inverse']], source)
        self.assertEqual(r['galois_units_checked'], 36)
        with self.assertRaisesRegex(ValueError, 'unequal'):
            c.coordinate_permutation((1, 56), (2, 55))

    def test_forged_joint_claims_are_denied(self):
        base = c.compose()
        self.assertTrue(c.check(base))
        for key, value in (('source', 'W114'), ('target', 'quadratic Artin carrier'),
                           ('cycle_dimension', 4), ('left_inverse_scale', '-1/57')):
            forged = deepcopy(base)
            forged[key] = value
            with self.assertRaisesRegex(ValueError, 'certificate'):
                c.check(forged)

    def test_square_relation_keeps_its_proof_boundary(self):
        r = c.run()
        self.assertEqual(r['square_word']['positive_length_each_side'], 56)
        self.assertIn('INTEGRAL_WORD_ONLY_IN_THIS_CHECKER', r['square_word']['status'])
        self.assertEqual(r['mot_1'], 'MOT-1 REMAINS OPEN')
        self.assertIn('A_114(19,38)', r['remaining'])


if __name__ == '__main__':
    unittest.main()
