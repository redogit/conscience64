# Project — Cross-Carrier Wave

Status: `ACTIVE_BOUNDED_RESEARCH`

## I — What do we have?

A family of experiments and design records for preserving consequential meaning while moving information across representations, domains, carriers, and coordinate systems.

Core retained distinctions include:

- source/provenance;
- chronology/state;
- boundary/context;
- selection/distinction;
- relation;
- transform/carrier;
- observation/evidence;
- consequence/ethics/cost;
- integrity/uncertainty/remainder.

The carrier count is adaptive rather than globally fixed:

```text
X(p) = { f_i(p) | i in I'(p) }
```

where `I'(p)` is the bounded set of consequential distinctions needed at the current semantic location.

## R — What difference matters?

The important distinction is:

```text
compression / translation / abstraction
!=
semantic mutilation
```

Loss becomes mutilation when consequential information is erased or conflated without being carried as an explicit loss or unresolved remainder.

A transform should therefore expose:

```text
T(X) = (X', Δ, L, U)
```

- `X'` — transformed state;
- `Δ` — consequential changes;
- `L` — known losses;
- `U` — unresolved remainder.

## P — What should we do next?

1. Keep carrier schemas typed and sparse.
2. Keep raw binary64 transport distinct from numeric interpretation.
3. Record per-carrier mappings as preserved / transformed / split / merged / introduced / lost / unresolved.
4. Test one independent transform degree at a time where possible.
5. Reject cross-domain equivalence unless independently supported.
6. Keep philosophy and human-facing interpretation outside the evidentiary payload unless a task specifically requires them.

## O — What happened?

### Highlights

- A usable distinction emerged between faithful transform and concealed consequential loss.
- The fixed nine-overlay sketch generalized into an adaptive `I'` overlay rather than pretending every problem requires the same dimensionality.
- Provenance, uncertainty, ethics/cost, and remainder became part of the transform contract rather than after-the-fact annotations.
- The repository now carries an extensible recovery/transport model instead of treating transport shards as semantic identity.

### Lowlights / preserved corrections

- Early formulations risked treating the overlay as a universal coordinate theory rather than a research architecture.
- A float64 atom cannot literally contain a whole semantic object; it is a carrier/coordinate handle whose interpretation and provenance must remain external.
- Arbitrary 64-bit identifiers must not be treated as exactly representable JavaScript numeric doubles.
- Similarity across domains is not evidence of shared mechanism or historical transmission.

## Checks

**What are we assuming?** That consequential distinctions can be identified locally enough to test preservation.

**How do we test it?** Ablate or alter one carrier/transform relation, reconstruct the result, and observe whether a consequential distinction becomes unrecoverable.

**What do we still not know?** Whether the architecture provides measurable benefit across broad real-world domains beyond the bounded experiments already performed.

## Claim ceiling

This project does **not** claim a completed theory of knowledge, universal semantic geometry, or globally minimal representation.

## September 13, 2026 — explicit 1,024-byte branch registry

See the [Human Expression / S1024 integration checkpoint](../updates/2026-09-13-human-expression-s1024.md).

The archive's `SP1024-1` raw-byte carrier uses 133 finite float64 values per full 1,024-byte section: 1,064 binary payload bytes before framing. The separately preserved `S1024V1` branch ranks UTF-8 conditional on section boundary states; its retained report gives 117 values / 936 payload bytes for a complete section and 1,030 standalone framed bytes. The formats and contracts are not interchangeable, and the latter branch's experiments were not rerun during this integration.

Fresh local integration checks recovered the 156,714-byte archive record stream through both raw sections and the inherited SP1024-1 float frame. Exact record references preserve logical records even where byte cuts cross characters or records. Storage cuts do not become semantic boundaries. No corpus-wide truth test, historical equivalence, new training result, or universal S′/idea detector is claimed.
