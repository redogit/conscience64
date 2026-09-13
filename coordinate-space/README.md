# Coordinate Space Workbench — Public Edition

A separate Float64 / UTF-8 tool hosted alongside Conscience64. The browser interface encodes text into ordered, exact 48-bit integer payloads represented as Float64 numbers, then checks length, canonical padding, UTF-8 validity and SHA-256 while decoding. It does not upload inputs or persist them automatically.

Open [the public workbench](https://redogit.github.io/conscience64/coordinate-space/).

## Release boundary

This directory publishes reusable software and newly authored examples. It intentionally excludes the private research corpus, the 69 archived source payloads, historical archive capsules, original ZIP bundles and personal records. The public examples are not recovered research evidence. The full local workbench remains separate.

`coordinate_runtime.py` and `float64_coordinate_builder.py` are byte-for-byte copies of the audited September 13 local successor. Their hashes are recorded in `release_manifest.json`. The public browser adapter, interface and release-specific tests are new in this release; they do not inherit the original package's test counts.

The 13-entry `utf8_symbol_registry.json` is a synthetic compatibility fixture for the builder's executable example. Its names match that example; its definitions are explicitly synthetic, not substitutes for the research registry.

## Run the Python machinery

Python 3.11 or newer is needed; the local release tests used Python 3.13.5 with NumPy 2.3.5.

```bash
python -m pip install -r requirements.txt
python verify_release.py
python test_public.py
python example.py
python float64_coordinate_builder.py
```

The last command produces a local example NPZ, using only the public synthetic registry. `example.py` verifies Unicode recovery and 9- and 11-layer stacks. Repeated layers are not independent corroboration.

The exact-text codec works without a research dataset. To inspect your own compatible private dataset, use `CoordinateSpace('/absolute/path/to/data')`. No corpus is bundled in this public directory, so the reader's default `data/` path is intentionally absent. Do not commit private datasets merely to satisfy that default. The reader uses `allow_pickle=False`.

```python
from coordinate_runtime import encode_utf8_exact, decode_utf8_exact
values, meta = encode_utf8_exact('Hello / مرحبا / 你好 / 🌍')
recovered = decode_utf8_exact(values, meta['utf8_bytes'], expected_sha256=meta['sha256'])
```

The browser codec caps payloads at 1 MiB; the Python codec caps them at 64 MiB. Browser inputs must be valid Unicode; lone surrogates are rejected rather than silently replaced. A text field may normalize entered newlines. Importing an envelope and saving the recovered bytes preserves its UTF-8 payload, including BOM, NUL and CRLF.

## Verification

`node test_codec.mjs` runs 35 JavaScript assertions. Node is a test harness, not a browser or Python runtime dependency. `python test_public.py` runs 9 regression methods including 516 text round-trips, typed-reader fixtures, malformed payloads, identifier validation, state saving/reloading, empty registries and variable-count layers.

For full browser checks, install `playwright==1.57.0` and a compatible Chromium/Chrome installation, then run `python browser_checks.py`. Set `CHROMIUM_PATH` when needed. The GitHub Pages source workflow runs these HTTP-served checks before publication. The local environment blocked navigation; the local run used `python browser_checks.py --dom-only` and passed 16 checks, including import/export, source-as-text handling, mobile layout and Clear winning a pending file import. DOM-only does not validate HTTP delivery or CSP enforcement. No screen-reader or accessibility-conformance certification is claimed.

## Integrity, interpretation and license

Coordinates are typed carriers, not semantic embeddings. A SHA-256 hash checks byte identity against a supplied expectation; it is not a digital signature or proof of truth. Encoding is not compression, encryption or knowledge discovery. One number does not contain an arbitrary document. Missing or changed source dependencies remain unresolved rather than inheriting earlier PASS statuses.

Free use is provided under the MIT license in this directory. This scope does not relicense unrelated research, third-party works or the rest of the repository.
