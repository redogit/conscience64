from itertools import combinations
import json

ROUTES = {
    "m39_pre_transport": ({"explicit_target_cycle":0,"auxiliary_join":0,"level_lift":0,"transport_verified":0}, "TEST_EIGENSPACE_TRANSPORT"),
    "m39_post_transport": ({"explicit_target_cycle":0,"auxiliary_join":0,"level_lift":0,"transport_verified":1}, "TEST_NONZERO_PROJECTION"),
    "m45_standard": ({"explicit_target_cycle":1,"auxiliary_join":0,"level_lift":0,"transport_verified":0}, "COMPUTE_GEOMETRIC_INTERSECTION_KERNEL"),
    "m45_two_pair": ({"explicit_target_cycle":0,"auxiliary_join":1,"level_lift":0,"transport_verified":0}, "TEST_CANCELLATION"),
    "m33_level_lift": ({"explicit_target_cycle":0,"auxiliary_join":0,"level_lift":1,"transport_verified":0}, "VERIFY_LIFTED_ALGEBRAICITY_BRIDGE"),
}


def conflicts(subset):
    cells = {}
    for name, (features, action) in ROUTES.items():
        key = tuple(features[f] for f in subset)
        cells.setdefault(key, []).append((name, action))
    out = []
    for key, members in cells.items():
        for a, b in combinations(members, 2):
            if a[1] != b[1]:
                out.append({"cell": list(key), "left": a, "right": b})
    return out


def main():
    features = list(next(iter(ROUTES.values()))[0])
    sufficient = []
    for r in range(len(features) + 1):
        for subset in combinations(features, r):
            if not conflicts(subset):
                sufficient.append(subset)
    minimum = min(map(len, sufficient))
    mins = [list(s) for s in sufficient if len(s) == minimum]

    baseline = ("explicit_target_cycle", "auxiliary_join", "level_lift")
    result = {
        "experiment": "DF-HODGE-02",
        "baseline_three_coordinate_conflicts": conflicts(baseline),
        "minimum_sufficient_feature_count": minimum,
        "minimum_sufficient_feature_sets": mins,
        "new_coordinate": "transport_verified",
        "interpretation": "A state transition within the m=39 route creates two states with the same original three-coordinate address but different justified next actions. The conflict forces admission of a new decision coordinate.",
        "claim_ceiling": "Finite research-state representation result only. It neither verifies the transport theorem nor the target projection and proves no Hodge statement."
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
