import json
import pathlib
import subprocess
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "even_wall_shioda_cubic_screen.cpp"


class EvenWallShiodaCubicScreenTest(unittest.TestCase):
    def test_exact_screen_reproduces_control_and_excludes_three_p3_families(self):
        self.assertTrue(SRC.exists(), "exact verifier source must exist")
        with tempfile.TemporaryDirectory() as td:
            exe = pathlib.Path(td) / "w114_shioda_cubic_screen"
            subprocess.run(
                ["g++", "-O3", "-std=c++17", str(SRC), "-o", str(exe)],
                check=True,
                capture_output=True,
                text=True,
            )
            run = subprocess.run([str(exe)], check=True, capture_output=True, text=True)
            payload = json.loads(run.stdout)

        self.assertEqual(payload["positive_control"]["alpha"], [19, 7, 13, 10, 28, 22])
        self.assertEqual(payload["positive_control"]["expected"], [19, 7, 13, 10, 28, 22])
        self.assertEqual(payload["target"]["wall"], "W114")
        self.assertEqual(payload["target"]["level"], 114)

        expected = {
            "phi3_3": (230230, 46220, 40734, 0),
            "phi4_3": (38760, 11025, 9409, 0),
            "phi6_3": (38760, 19848, 18808, 0),
        }
        for row in payload["families"]:
            total, invertible, integer_cover, hits = expected[row["family"]]
            self.assertEqual(row["six_monomial_supports"], total)
            self.assertEqual(row["invertible_supports"], invertible)
            self.assertEqual(row["integer_level_114_covers"], integer_cover)
            self.assertEqual(row["w114_hits"], hits)

        self.assertIn("phi1_5_lifted_screens", payload)
        lifted = {(row["wall"], row["level"]): row for row in payload["phi1_5_lifted_screens"]}
        self.assertEqual(lifted[("W70", 210)]["six_monomial_supports"], 924)
        self.assertEqual(lifted[("W70", 210)]["invertible_supports"], 374)
        self.assertEqual(lifted[("W70", 210)]["integer_covers"], 366)
        self.assertEqual(lifted[("W70", 210)]["hits"], 0)
        self.assertEqual(lifted[("W114", 570)]["six_monomial_supports"], 924)
        self.assertEqual(lifted[("W114", 570)]["invertible_supports"], 374)
        self.assertEqual(lifted[("W114", 570)]["integer_covers"], 366)
        self.assertEqual(lifted[("W114", 570)]["hits"], 0)

        self.assertIn("canonical_power_lift_screens", payload)
        canonical = {(row["family"], row["wall"], row["level"]): row
                     for row in payload["canonical_power_lift_screens"]}
        self.assertEqual(canonical[("phi1_5", "W70", 210)]["target"],
                         [3, 60, 72, 126, 183, 186])
        self.assertEqual(canonical[("phi1_5", "W110", 330)]["target"],
                         [3, 72, 186, 213, 243, 273])
        self.assertEqual(canonical[("phi1_7", "W70", 210)]["target"],
                         [3, 60, 72, 126, 183, 186])
        self.assertEqual(canonical[("phi1_11", "W110", 330)]["target"],
                         [3, 72, 186, 213, 243, 273])
        for family in ("phi3_3", "phi4_3", "phi6_3"):
            self.assertIn((family, "W70", 210), canonical)
            self.assertIn((family, "W110", 330), canonical)


if __name__ == "__main__":
    unittest.main()
