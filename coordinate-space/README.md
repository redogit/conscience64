# Coordinate Space Workbench — culture and clock-independent public edition

Open [the workbench](https://redogit.github.io/conscience64/coordinate-space/).

Encode, inspect, import and recover exact Unicode text through the existing `exact-utf8-f64/v1` carrier. Processing stays on the device: no input uploads, accounts, analytics or automatic saving.

## What changed

16 interface-language drafts and an extensible local translation-pack loader; explicit RTL/LTR support; language and direction hints for source text independent of the interface; localized counts with invariant machine numbers; and no date-stamped interface or wall-clock dependency in content identity. Original dates, ordering and provenance are preserved, not erased.

The bundled languages are English, Spanish, French, Portuguese, Arabic, Persian, Hebrew, Hindi, Bengali, Tamil, Simplified Chinese, Japanese, Korean, Swahili, Indonesian and Ukrainian. These are drafts, not native-speaker or community-certified translations. Technical documentation and diagnostic details remain English. No claim is made to represent every culture.

To add or correct a language locally, select **Save language template**, edit the text values and locale metadata, then use **Import language pack**. Packs are session-local, validated and rendered as text, never executed. No developer account or remote service is needed. See [the culture and time contract](CULTURE_TIME_CONTRACT.md) for limits, trust boundaries, source-language behavior and the precise meaning of clock independence.

## Run locally

Keep every file in `coordinate-space/` together. A compatible browser can open `index.html` locally without a backend, or use a local server:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` when running that command inside this directory. No CDN, web font or external JavaScript is required. File-navigation policies vary by browser/environment; the current local test environment blocked navigation, so local browser evidence is DOM-only. GitHub's deployment gate tests actual HTTP delivery. This is not a perpetual-availability guarantee.

Python 3.11 or newer is required. The local environment uses Python 3.13.5 and NumPy 2.3.5:

```bash
python -m pip install -r requirements.txt
python verify_release.py
python test_public.py
python example.py
python float64_coordinate_builder.py
node test_codec.mjs
```

Node 22 or newer is a JavaScript test harness only; it is not needed to use the browser or Python codec. `example.py` now also runs the independent Python Unicode sweep. The builder's executable example creates a local NPZ using the public 13-entry synthetic registry, not private research definitions. Repeated layers in the 9- and 11-layer examples are not independent evidence.

```python
from coordinate_runtime import encode_utf8_exact, decode_utf8_exact
values, meta = encode_utf8_exact('Hello / مرحبا / 你好')
text = decode_utf8_exact(values, meta['utf8_bytes'], expected_sha256=meta['sha256'])
```

The typed reader can inspect a compatible dataset with `CoordinateSpace('/path/to/data')`. No dataset is bundled: the default `data/` path is intentionally absent. Do not publish private data to satisfy that default. `allow_pickle=False` remains enforced.

## Verification

The release verifies an explicit file allowlist and retains the unchanged audited Python module hashes. The browser `codec.js` and its v1 envelope contract also remain unchanged from commit `2bb57da9b7e1ada21af89a5b0e5ee789e67a080f`.

The suite passes 9 Python regression methods, 35 original JavaScript assertions, 367 added Unicode/locale/clock checks, and an independent Python replay of all 1,112,064 Unicode scalar values in bounded batches. These are not all possible Unicode strings. The browser suite has 144 checks across all 16 locales and both mobile and desktop layouts.

```bash
python -m pip install playwright==1.57.0
# Install a compatible Chrome/Chromium or run: python -m playwright install chromium
python browser_checks.py
# Only for environments where navigation is blocked:
python browser_checks.py --dom-only
```

Set `CHROMIUM_PATH` when the browser executable cannot be discovered. DOM-only tests do not establish HTTP delivery or CSP enforcement. The existing action-free Pages workflow runs full HTTP browser checks before publication. Tests do not certify JAWS, NVDA, translation quality or accessibility conformance.

## Public boundary and provenance

This update extends the public software release, not the private research workbench. The private corpus, 69 archived source payloads, historical archive capsules and personal records remain excluded. The 13-entry symbol registry remains an authored compatibility fixture, not a recovered research registry. The culture/clock sweep includes generic code points and authored test strings, not a copied cultural corpus.

Carrier identity is not meaning, proof of truth, encryption or compression. Source text is never normalized merely to make it match another spelling. One Float64 does not store an arbitrary document; the ordered sequence and metadata carry it. Unknown source context remains unknown, and release chronology is retained in Git and the manifest. No time-based expiry is introduced.

Free use is provided under the [MIT license](LICENSE) scoped to this directory; unrelated research and third-party works are not relicensed.
