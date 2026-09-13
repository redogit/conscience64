# Compact Max-Cut 28 Certificate — seed 2605

**Status:** exact bounded successor certificate. **P vs NP remains OPEN.**

This is a different proof carrier for the same 20-vertex cubic graph previously certified by the `k=9` local-cover dual hierarchy.

## Exact proof

Let `beta(G)` be the minimum number of edges whose deletion makes `G` bipartite. For every unweighted graph,

`MaxCut(G) = |E| - beta(G)`.

For this 30-edge graph:

1. Delete `(0,12)` and `(8,17)`.
2. The remaining graph is bipartite under the supplied 10|10 partition. Therefore `beta(G) <= 2`.
3. The compact certificate supplies three actual odd cycles of lengths 7, 7, and 9.
4. Their edge-set intersection is empty.
5. If deleting one edge made the graph bipartite, that edge would have to lie on every odd cycle. No edge lies on all three supplied cycles. Therefore `beta(G) >= 2`.

Hence `beta(G)=2` and

`MaxCut(G)=30-2=28`.

## Compression

The minified certificate includes the full 30-edge graph, the two-edge deletion witness, one side of the bipartition, the three odd cycles, and the claimed optimum in **359 bytes including the trailing newline**.

The predecessor `HIGHGIRTH20_K9_DUAL_CERT.json` was **1,384 bytes**. The successor carrier is therefore about **74.1% smaller by byte count** while proving the same bounded optimum by a different argument.

Byte count is not proof strength. The consequential result is the change of proof carrier.

## What this corrects

The predecessor hierarchy remains valid:

- local-cover `k=7` upper bound = 29;
- local-cover `k=8` upper bound = 29;
- local-cover `k=9` upper bound = 28.

But this successor shows that `k=9` is a requirement of **that local-cover proof hierarchy**, not an intrinsic certificate depth of the graph. A global odd-cycle/bipartization carrier closes the same instance much more compactly.

This is a direct finite counterprobe against treating depth, width, or level in one proof carrier as representation-independent instance hardness.

## Verification

`verify_compact_maxcut28_min.py` checks the structural certificate and then independently enumerates every cut with vertex 0 fixed to remove complement symmetry. The exhaustive bounded check returns 28.

Claim ceiling: exact for this graph only. No universal short-certificate claim for Max-Cut, no general lower bound, and no P-vs-NP conclusion.
