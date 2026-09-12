# Exact research transports — 2026-09-12

These files exist because the connected GitHub interface accepts UTF-8 text but does not expose a direct local-binary/release-asset upload action. For compressible research text, the original UTF-8 bytes are therefore preserved as deterministic gzip (`mtime=0`) encoded with standard Base64.

The carrier is not the evidence. Decode + gunzip before comparing the original SHA-256.

| Original | Original bytes | Original SHA-256 | gzip SHA-256 | GitHub carrier |
|---|---:|---|---|---|
| `WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json` | 60,893 | `ff1a62b24e05f4e28297545d99c4334b3dea90336b499c77c56c5b40d3bc7569` | `379f400e7fa04e830e1cd36868341baba247f8dd2546fe1178c55f2a83d65931` | `WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json.gz.b64` |
| `SHOR_HSP_PROMISE_DEFECT_AUDIT.json` | 58,514 | `8afe151e3082d396ce0869a2cc70b2014f16318ae72d47ad3fe30c1f91d86de2` | `dd77509c2e1a092c239f3eeed514c13bf1084be0a664c5e7eb72c639497b5255` | `SHOR_HSP_PROMISE_DEFECT_AUDIT.json.gz.b64` |
| `SHOR_HSP_STABILIZER_FREE_VARIABLE_AUDIT.json` | 55,319 | `1d09c828098f86b9747c6f32f020db9221149b2d4cb47aca53ea305ff5427847` | `15192cbf4b5df8a8e719304f0a653217ee9a09996d660297f843056dfc7765e2` | `SHOR_HSP_STABILIZER_FREE_VARIABLE_AUDIT.json.gz.b64` |
| `FOURIER_CARRIER_VS_3SAT_SEARCH_COST.json` | 24,676 | `2460ab80a64d3455d717a90539139b266899731fdec3086670ab3e345f680cd6` | `4b85fe18272448f7a10db9b1d7b6411fffe069820601369008ce7311e4e7c03c` | `FOURIER_CARRIER_VS_3SAT_SEARCH_COST.json.gz.b64` |
| `BOOLEAN_MEMBERSHIP_HSP_BOUNDARY_AND_FOURIER_QUOTIENT.md` | 3,371 | `73153d92dd6e49ffba92e349056da83df98c1a655284dda0caf1817dafda474b` | `cab371ca2bd3781e32893fded12d6e44bcd067d052ba51e4444a7e9d800a72e9` | `BOOLEAN_MEMBERSHIP_HSP_BOUNDARY_AND_FOURIER_QUOTIENT.md.gz.b64` |

The v2.2 `payload_catalog.json` is separately preserved under:

`../../cross-carrier/2026-09-12/v2.2/transports/payload_catalog.json.parts/`

Its exact original identity is 24,901 bytes with SHA-256:

`3134cf831ecbb40fd83b823229eedd572bf96ea8457eb542b4f6435a5096ac42`

## Restore one gzip+Base64 carrier

```bash
base64 -d INPUT.gz.b64 > INPUT.gz
gzip -dc INPUT.gz > INPUT
sha256sum INPUT
```

Example:

```bash
base64 -d WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json.gz.b64 > ecology.json.gz
gzip -dc ecology.json.gz > WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json
printf '%s  %s\n' \
  'ff1a62b24e05f4e28297545d99c4334b3dea90336b499c77c56c5b40d3bc7569' \
  WHOLE_RESEARCH_PARTIAL_HARD_ECOLOGY_EXPERIMENT.json | sha256sum -c -
```

## Integrity boundary

Exact byte recovery does not turn finite experiments into asymptotic proofs. `P ?= NP` remains `OPEN` in the preserved research state.
