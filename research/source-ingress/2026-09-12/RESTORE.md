# Research Source Ingress — Restore and Verification

This directory contains source carriers imported from the ChatGPT Library into GitHub without treating transport encoding as semantic identity.

## Restore gzip carriers

For each `*.gz` carrier:

```bash
gzip -dc FILE.gz > RESTORED_FILE
sha256sum RESTORED_FILE
```

Compare the restored SHA-256 with `INGRESS_MANIFEST.json`.

The gzip carriers were produced deterministically with compression level 9 and `mtime=0`. Their transport SHA-256 is also recorded.

## Identity rule

The original source SHA-256 identifies the admitted source bytes for this ingress record. A Git blob SHA identifies the Git object, not the semantic meaning of the carrier. Compression, sharding, or later repacking must not silently replace source identity.

## Cross-Carrier Wave source

`Cross_Carrier_Field_Transform_Wave_01.md` is intentionally not represented by a single admitted blob in this commit because a connector-size path truncated an attempted single-blob transport. The failed staging object is unreferenced. Its prepared deterministic gzip and source hashes are retained in `INGRESS_MANIFEST.json`. The existing `research/cross-carrier/2026-09-12/v2.2/` package remains a related package, not a substitute for that source record.

## Privacy boundary

This ingress is limited to research/public-reference material. Personal, family, legal, medical, financial, location, contact, and account data are excluded.
