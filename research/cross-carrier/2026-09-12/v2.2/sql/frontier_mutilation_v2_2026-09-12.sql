-- decisive SQL v2
SELECT MIN(CASE WHEN hard_outside_size6>0 THEN observation_count END) AS first_hard_symmetry,
       MIN(CASE WHEN nonaffine_hard>0 THEN observation_count END) AS first_nonaffine_hard_symmetry,
       MIN(CASE WHEN nonaffine_rank4>0 THEN observation_count END) AS first_fullrank_nonaffine_hard_symmetry
FROM exhaustive_symmetry_layer;

SELECT * FROM v_frontier_thresholds ORDER BY observation_count;
SELECT * FROM selected_fullrank_candidate;
SELECT * FROM selected_candidate_gate ORDER BY gate_index;
SELECT * FROM v_route_comparison;
