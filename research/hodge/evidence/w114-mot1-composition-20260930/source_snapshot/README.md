# Earlier run source recovery

This run predates the same-psi reflection phase counterprobe. The new source,
test, audit and contract bytes are preserved in the adjacent `.txt` files.
Their original filenames are the names with the final `.txt` suffix removed.
The manifest's other inputs are unchanged files at base commit
`3b213dfee92c8015ca3add613357c6819f9f24c7`.

To reconstruct this run's input root, copy each manifest input from that base,
then restore these source snapshots at their original paths. Preserve the
original run's result and log paths. Verify every restored SHA-256 against the
manifest before rerunning. The historical manifest can be validated against this
reconstructed root; it will correctly report input drift against the newer source.

The original pinned input set covers the new computation, but did not pin all
dependencies of the additional legacy test suite. The final appended replay
expands the pin set and adds the phase counterprobe. The earlier run remains
historical evidence, not verification of the changed source.
