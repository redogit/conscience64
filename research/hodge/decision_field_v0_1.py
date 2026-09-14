from itertools import combinations
import json

ROUTES = {
    "m39_star_split": {
        "features": {
            "explicit_target_cycle": 0,
            "auxiliary_join": 0,
            "level_lift": 0,
            "finite_witness_verified": 1,
            "residual_character_identified": 1,
            "theorem_application_complete": 0,
        },
        "next_action": "TEST_EIGENSPACE_TRANSPORT",
    },
    "m45_standard": {
        "features": {
            "explicit_target_cycle": 1,
            "auxiliary_join": 0,
            "level_lift": 0,
            "finite_witness_verified": 1,
            "residual_character_identified": 1,
            "theorem_application_complete": 0,
        },
        "next_action": "COMPUTE_GEOMETRIC_INTERSECTION_KERNEL",
    },
    "m45_two_pair": {
        "features": {
            "explicit_target_cycle": 0,
            "auxiliary_join": 1,
            "level_lift": 0,
            "finite_witness_verified": 1,
            "residual_character_identified": 1,
            "theorem_application_complete": 0,
        },
        "next_action": "TEST_CANCELLATION",
    },
    "m33_level_lift": {
        "features": {
            "explicit_target_cycle": 0,
            "auxiliary_join": 0,
            "level_lift": 1,
            "finite_witness_verified": 1,
            "residual_character_identified": 1,
            "theorem_application_complete": 0,
        },
        "next_action": "VERIFY_LIFTED_ALGEBRAICITY_BRIDGE",
    },
}


def conflict_pairs(feature_subset):
    cells = {}
    for route_name, route in ROUTES.items():
        key = tuple(route["features"][f] for f in feature_subset)
        cells.setdefault(key, []).append((route_name, route["next_action"]))

    conflicts = []
    for key, members in cells.items():
        for (name_a, action_a), (name_b, action_b) in combinations(members, 2):
            if action_a != action_b:
                conflicts.append({
                    "field_cell": list(key),
                    "route_a": name_a,
                    "action_a": action_a,
                    "route_b": name_b,
                    "action_b": action_b,
                })
    return conflicts


def main():
    features = list(next(iter(ROUTES.values()))["features"])
    sufficient = []
    for size in range(len(features) + 1):
        for subset in combinations(features, size):
            conflicts = conflict_pairs(subset)
            if not conflicts:
                sufficient.append(subset)

    minimum_size = min(map(len, sufficient))
    minimum_subsets = [x for x in sufficient if len(x) == minimum_size]

    ablations = {}
    for subset in minimum_subsets:
        for removed in subset:
            kept = tuple(f for f in subset if f != removed)
            ablations[removed] = {
                "kept": list(kept),
                "conflicts": conflict_pairs(kept),
            }

    result = {
        "experiment": "DF-HODGE-01",
        "scope": "finite representation sufficiency over four current Hodge residual routes",
        "route_count": len(ROUTES),
        "candidate_feature_count": len(features),
        "minimum_sufficient_feature_count": minimum_size,
        "minimum_sufficient_feature_sets": [list(x) for x in minimum_subsets],
        "ablations": ablations,
        "claim_ceiling": (
            "This verifies only that the declared finite field representation separates the "
            "four hand-audited next-action labels. It does not validate those mathematical "
            "actions, prove any Hodge implication, or establish generalization to unseen routes."
        ),
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
