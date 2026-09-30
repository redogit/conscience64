from copy import deepcopy
from fractions import Fraction
import unittest

import w114_full_standard_composition as c


class FullStandardChecks(unittest.TestCase):
    def test_signed_receipt_uses_declared_d2_inverse_directions(self):
        r = c.compose()
        self.assertEqual([(x['primitive'], x['direction']) for x in r['signed_word'][:4]],
                         [('D2_7', 'inverse'), ('D2_22', 'inverse'),
                          ('D2_23', 'forward'), ('D2_56', 'forward')])
        forged = deepcopy(r)
        forged['signed_word'][0]['direction'] = 'forward'
        with self.assertRaisesRegex(ValueError, 'certificate'):
            c.check(forged)

    def test_reflection_receipt_does_not_assert_individual_char_zero_n_leaf(self):
        r = c.compose()
        self.assertEqual([(x['primitive'], x['sign'], x['direction']) for x in r['signed_word'][4:]],
                         [('N_1', 1, None), ('N_2', -1, None)])
        for x in r['signed_word'][4:]:
            self.assertEqual(x['geometric_role'], 'reflection_point_padding')

    def test_divisor_containment_and_nonzero_class(self):
        self.assertTrue(c.containment())
        self.assertEqual(len(c.determinant()), 112)
        for a in c.GENERATORS:
            r = c.divisor(a)
            self.assertEqual(r['galois_units_checked'], 36)
            self.assertEqual(r['projected_pairing'], '-57')
            self.assertEqual(r['inverse_scale'], '-1/6498')
            self.assertEqual(r['roundtrip_scalar'], '1')
        with self.assertRaisesRegex(ValueError, 'containment'):
            c.containment(-2)

    def test_plane_actual_degree_and_variance(self):
        p = c.plane_pullback()
        self.assertEqual(p['power_transfer']['degree'], 32)
        self.assertEqual(Fraction(p['projected_pairing'])*Fraction(p['inverse_scale']), 1)
        self.assertEqual(p['character'], [58, 22, 34, 56, 80, 92])
        self.assertEqual(c.compose()['level57_descent']['degree'], 512)

    def test_ordered_word_and_padding_descent(self):
        e = c.stabilized_endpoints()
        self.assertEqual([(x['primitive'], x['sign']) for x in e['ordered_signed_word']],
                         [('D2_7', 1), ('D2_22', 1), ('D2_23', -1), ('D2_56', -1), ('N_1', 1), ('N_2', -1)])
        self.assertEqual(e['positive_length'], 28)
        for side, pairing in (('left', '370386'), ('right', '23704704')):
            p = c.padding(side)
            self.assertEqual(p['i_parity'], 0)
            self.assertEqual(p['carrier_degree'], 57)
            self.assertEqual(p['projected_pairing'], pairing)
            self.assertEqual(57*Fraction(pairing)*Fraction(p['inverse_scale']), 1)

    def test_full_weight_and_inverse_normalizations(self):
        r = c.compose()
        self.assertEqual(r['source_weight'], r['target_weight'])
        self.assertEqual(r['source_weight'], 26)
        self.assertEqual(r['cycle_dimension'], 6)
        self.assertEqual(r['left_inverse_scale'], '-1/2406768228')
        self.assertEqual(r['right_inverse_scale'], '-1/154033166592')
        self.assertEqual(r['galois_units_checked'], 36)
        self.assertEqual(r['roundtrip_scalar'], '1')

    def test_fail_closed_with_retained_probes(self):
        r = c.compose()
        self.assertTrue(c.check(r))
        for key, value in (('target', 'quadratic Artin'), ('cycle_dimension', 4), ('left_inverse_scale', '-1/114')):
            bad = deepcopy(r)
            bad[key] = value
            with self.assertRaisesRegex(ValueError, 'certificate'):
                c.check(bad)
        run = c.run()
        self.assertEqual(len(run['counterprobes']), 4)
        self.assertEqual(run['mot_1'], 'MOT-1 REMAINS OPEN')
        self.assertIn('EXPLICIT_PLANE_IN_PADDING != ALGEBRAIC_W114_CYCLE', run['claim_ceilings'])


if __name__ == '__main__':
    unittest.main()
