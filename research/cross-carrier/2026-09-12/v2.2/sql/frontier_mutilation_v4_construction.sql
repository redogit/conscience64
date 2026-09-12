-- Construction-cost continuation.
SELECT policy, observations, candidate_scores, survivor_scans, literal_reads
FROM construction_route
ORDER BY candidate_scores;

SELECT * FROM translation_orbit_class ORDER BY hamming_weight;

-- Keep the three costs separate:
-- carrier_use_cost != carrier_discovery_cost != carrier_selection_cost.
