-- SQL v3: corrected route criterion.
SELECT * FROM structural_invariant;
SELECT * FROM v_search_cost_comparison ORDER BY decision_role;
SELECT * FROM stabilizer_discovery;

-- Success is no longer staged_output_gates < exact_direct_optimum.
-- A useful quotient must reduce discovery/planning/verification or a matched
-- restricted-search baseline after all routing costs, while preserving exactness.
