PRAGMA foreign_keys = ON;

CREATE TABLE candidate (
    candidate_id INTEGER PRIMARY KEY,
    coords_json TEXT NOT NULL,
    bits_json TEXT NOT NULL,
    signature_key TEXT NOT NULL UNIQUE,
    k INTEGER NOT NULL,
    formula_min INTEGER,
    small6_survivors INTEGER,
    affine_rank INTEGER,
    hamming1_edges INTEGER,
    walsh_entropy_zero_fill REAL,
    partial_translation_stabilizer_size INTEGER,
    dag_status TEXT,
    dag_min INTEGER,
    dag_states INTEGER,
    harder_than_size6_certified INTEGER NOT NULL CHECK (harder_than_size6_certified IN (0,1)),
    hardness_per_observation REAL,
    scheduler_score REAL
);

CREATE TABLE candidate_generator (
    candidate_id INTEGER NOT NULL REFERENCES candidate(candidate_id),
    generator TEXT NOT NULL,
    role TEXT,
    lineage TEXT,
    mutation_mode TEXT,
    PRIMARY KEY (candidate_id, generator, role, lineage)
);

CREATE TABLE sharing_witness (
    witness_name TEXT PRIMARY KEY,
    coords_json TEXT NOT NULL,
    bits_json TEXT NOT NULL,
    signature_key TEXT NOT NULL,
    formula_cost INTEGER NOT NULL,
    dag_size INTEGER NOT NULL,
    formula_dag_gap INTEGER NOT NULL,
    depth INTEGER,
    states_seen INTEGER,
    reused_node_count INTEGER NOT NULL,
    seconds REAL
);

CREATE TABLE sharing_reuse (
    witness_name TEXT NOT NULL REFERENCES sharing_witness(witness_name),
    node TEXT NOT NULL,
    fanout INTEGER NOT NULL,
    PRIMARY KEY (witness_name, node)
);

CREATE TABLE hard_certificate_witness (
    witness_name TEXT PRIMARY KEY,
    coords_json TEXT NOT NULL,
    bits_json TEXT NOT NULL,
    signature_key TEXT NOT NULL,
    circuit_min INTEGER,
    states INTEGER,
    seconds REAL
);

CREATE TABLE hsp_audit (
    row_id INTEGER PRIMARY KEY,
    family TEXT NOT NULL,
    clauses INTEGER,
    rank INTEGER,
    solutions INTEGER,
    H_size INTEGER,
    H_dimension INTEGER,
    quotient_cosets INTEGER,
    oracle_output_labels INTEGER,
    standard_HSP_promise INTEGER NOT NULL CHECK (standard_HSP_promise IN (0,1)),
    satisfying_cosets INTEGER,
    nonsatisfying_cosets INTEGER,
    cosets_per_boolean_label_average REAL,
    promise_defect_extra_cosets INTEGER,
    classification TEXT
);

CREATE VIEW v_candidate_features AS
SELECT
    c.*,
    CASE WHEN c.dag_status='EXACT' AND c.dag_min IS NOT NULL
         THEN c.formula_min - c.dag_min END AS formula_dag_gap,
    CASE WHEN c.partial_translation_stabilizer_size > 1 THEN 1 ELSE 0 END AS nontrivial_stabilizer,
    EXISTS (
        SELECT 1 FROM candidate_generator g
        WHERE g.candidate_id=c.candidate_id AND g.generator='geometry_rank_minority'
    ) AS geometry_family,
    EXISTS (
        SELECT 1 FROM candidate_generator g
        WHERE g.candidate_id=c.candidate_id AND g.generator='local_nor'
    ) AS local_nor_family,
    EXISTS (
        SELECT 1 FROM candidate_generator g
        WHERE g.candidate_id=c.candidate_id AND g.generator='hsp_periodic'
    ) AS hsp_periodic_family
FROM candidate c;

CREATE VIEW v_generator_summary AS
SELECT
    g.generator,
    COUNT(DISTINCT c.candidate_id) AS candidates,
    SUM(c.harder_than_size6_certified) AS certified_avoiders,
    SUM(CASE WHEN c.dag_status='EXACT' THEN 1 ELSE 0 END) AS exact_dag_verified,
    MAX(CASE WHEN c.dag_status='EXACT' THEN c.dag_min END) AS max_exact_dag_min,
    SUM(CASE WHEN c.partial_translation_stabilizer_size > 1 THEN 1 ELSE 0 END) AS nontrivial_stabilizer_candidates,
    SUM(CASE WHEN c.dag_status='EXACT' AND c.dag_min IS NOT NULL
                 AND c.formula_min > c.dag_min THEN 1 ELSE 0 END) AS observed_formula_dag_gap_candidates
FROM candidate c
JOIN candidate_generator g USING(candidate_id)
GROUP BY g.generator;

CREATE VIEW v_hsp_family_summary AS
SELECT
    family,
    COUNT(*) AS rows,
    SUM(standard_HSP_promise) AS hsp_promise_rows,
    ROUND(1.0 * SUM(standard_HSP_promise) / COUNT(*), 6) AS hsp_promise_fraction,
    SUM(CASE WHEN H_size > 1 THEN 1 ELSE 0 END) AS nontrivial_stabilizer_rows,
    ROUND(AVG(quotient_cosets), 3) AS avg_quotient_cosets,
    ROUND(AVG(promise_defect_extra_cosets), 3) AS avg_promise_defect_extra_cosets
FROM hsp_audit
GROUP BY family;

CREATE VIEW v_property_cube AS
SELECT
    candidate_id,
    harder_than_size6_certified AS hard,
    CASE WHEN dag_status='EXACT' THEN 1 ELSE 0 END AS exact_dag,
    CASE WHEN dag_status='EXACT' AND dag_min IS NOT NULL AND formula_min > dag_min THEN 1 ELSE 0 END AS sharing_gap,
    CASE WHEN partial_translation_stabilizer_size > 1 THEN 1 ELSE 0 END AS symmetry,
    geometry_family AS geometry,
    local_nor_family AS local_nor,
    hsp_periodic_family AS hsp_periodic,
    printf('%d%d%d%d%d%d%d',
        harder_than_size6_certified,
        CASE WHEN dag_status='EXACT' THEN 1 ELSE 0 END,
        CASE WHEN dag_status='EXACT' AND dag_min IS NOT NULL AND formula_min > dag_min THEN 1 ELSE 0 END,
        CASE WHEN partial_translation_stabilizer_size > 1 THEN 1 ELSE 0 END,
        geometry_family,
        local_nor_family,
        hsp_periodic_family
    ) AS feature_mask
FROM v_candidate_features;

-- Population cut.
SELECT
  COUNT(*) AS candidates,
  SUM(harder_than_size6_certified) AS certified_avoiders,
  SUM(nontrivial_stabilizer) AS nontrivial_stabilizers,
  SUM(CASE WHEN harder_than_size6_certified=1 AND nontrivial_stabilizer=1 THEN 1 ELSE 0 END) AS hard_and_symmetric,
  SUM(CASE WHEN dag_status='EXACT' THEN 1 ELSE 0 END) AS exact_dag_verified,
  SUM(CASE WHEN formula_dag_gap > 0 THEN 1 ELSE 0 END) AS exact_candidates_with_sharing_gap
FROM v_candidate_features;

-- Generator cut.
SELECT * FROM v_generator_summary ORDER BY certified_avoiders DESC, candidates DESC, generator;

-- Hard candidates.
SELECT
  c.candidate_id,
  GROUP_CONCAT(g.generator, ',') AS generators,
  c.k, c.formula_min, c.dag_min, c.formula_dag_gap,
  c.affine_rank, c.hamming1_edges,
  c.partial_translation_stabilizer_size,
  c.coords_json, c.bits_json
FROM v_candidate_features c
JOIN candidate_generator g USING(candidate_id)
WHERE c.harder_than_size6_certified=1
GROUP BY c.candidate_id
ORDER BY c.dag_min DESC, c.candidate_id;

-- Missing hard+symmetry intersection.
SELECT candidate_id, coords_json, bits_json, dag_min, partial_translation_stabilizer_size
FROM v_candidate_features
WHERE harder_than_size6_certified=1 AND nontrivial_stabilizer=1;

-- Missing geometry+hard+sharing intersection.
SELECT candidate_id, coords_json, bits_json, formula_min, dag_min, formula_dag_gap
FROM v_candidate_features
WHERE geometry_family=1 AND harder_than_size6_certified=1 AND formula_dag_gap > 0;

-- Independent sharing witnesses versus the 60-candidate ecology.
SELECT
  w.witness_name, w.formula_cost, w.dag_size, w.formula_dag_gap, w.reused_node_count,
  CASE WHEN c.candidate_id IS NULL THEN 'NOT_IN_60_CANDIDATE_ECOLOGY' ELSE 'MATCHED' END AS ecology_match
FROM sharing_witness w
LEFT JOIN candidate c ON c.signature_key=w.signature_key
ORDER BY w.formula_dag_gap DESC;

-- Symmetry-bearing ecology rows.
SELECT
  c.candidate_id,
  GROUP_CONCAT(g.generator, ',') AS generators,
  c.formula_min, c.dag_status, c.dag_min,
  c.harder_than_size6_certified,
  c.partial_translation_stabilizer_size,
  c.coords_json, c.bits_json
FROM v_candidate_features c
JOIN candidate_generator g USING(candidate_id)
WHERE c.nontrivial_stabilizer=1
GROUP BY c.candidate_id
ORDER BY c.partial_translation_stabilizer_size DESC, c.candidate_id;

-- HSP promise versus mere symmetry.
SELECT * FROM v_hsp_family_summary ORDER BY family;

-- Occupied feature cells.
SELECT feature_mask, hard, exact_dag, sharing_gap, symmetry, geometry, local_nor, hsp_periodic,
       COUNT(*) AS candidates
FROM v_property_cube
GROUP BY feature_mask, hard, exact_dag, sharing_gap, symmetry, geometry, local_nor, hsp_periodic
ORDER BY candidates DESC, feature_mask;

-- Minimum-certificate crosscheck.
SELECT
  h.witness_name,
  h.circuit_min,
  c.candidate_id AS ecology_candidate_id,
  c.formula_min AS ecology_formula_min,
  c.dag_min AS ecology_dag_min,
  c.harder_than_size6_certified
FROM hard_certificate_witness h
LEFT JOIN v_candidate_features c ON c.signature_key=h.signature_key
ORDER BY h.witness_name;
