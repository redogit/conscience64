# Exact reconstruction — payload_catalog.json

These parts are transport shards only. Their boundaries carry no semantic meaning.

Original file:

- path: `payload_catalog.json`
- bytes: `24901`
- SHA-256: `3134cf831ecbb40fd83b823229eedd572bf96ea8457eb542b4f6435a5096ac42`
- encoding: UTF-8
- parts: `part-000`, `part-001`, `part-002`

Reconstruct:

```bash
cat part-000 part-001 part-002 > payload_catalog.json
printf '%s  %s\n' '3134cf831ecbb40fd83b823229eedd572bf96ea8457eb542b4f6435a5096ac42' payload_catalog.json | sha256sum -c -
```

The split was made at UTF-8-safe character boundaries. Concatenation restores the exact original bytes.
