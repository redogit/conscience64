-- v5 decisive queries
SELECT * FROM translation_action_orbit ORDER BY weight;
SELECT * FROM route ORDER BY bitset_word_ops, observations;
SELECT * FROM structural_result;

-- Pareto surface: minimize both planning work and retained observations.
SELECT route, observations, bitset_word_ops
FROM route
WHERE NOT EXISTS (
  SELECT 1 FROM route r2
  WHERE r2.observations <= route.observations
    AND r2.bitset_word_ops <= route.bitset_word_ops
    AND (r2.observations < route.observations OR r2.bitset_word_ops < route.bitset_word_ops)
)
ORDER BY observations, bitset_word_ops;
