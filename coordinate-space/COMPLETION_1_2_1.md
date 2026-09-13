# Completion 1.2.1 — strict JSON imports

Predecessor: `347438c589105950593938e26394b3451080885a`.

This successor preserves the concurrently published 1.2 update, including exact
source-file intake, separate original bytes and editor preview, locale preference
ordering, same-file reselection, and the newer-manual-choice rule. The older staged
1.1-based patch was not applied over that newer work.

## Narrow repair

Envelope and language-pack files now use byte reads with strict UTF-8 decoding.
Malformed bytes are rejected instead of being silently replaced by File.text().
An optional UTF-8 BOM on the JSON transport is accepted; the payload's original BOM,
CRLF, CR and NUL bytes remain independent and unchanged. Pasted-envelope limits count
UTF-8 bytes, not UTF-16 code units. No clock enters identity or operation ordering.

## Verification boundary

Nine added browser regression checks cover invalid UTF-8, JSON transport BOM,
latest manual choices, obsolete failures, newer editor input, valid recovery after
rejection and the UTF-8 byte limit. They passed locally on the prior 1.1 interface
alongside its 144 checks (153 total). During reconciliation the latest 1.2 source
and source-file tests were preserved; delayed JSON-file fixtures were adapted from
text() to arrayBuffer(). The integrated suite is expected to contain 186 checks
and must pass the full HTTP GitHub release gate before Pages publication.

The manifest distinguishes previous-run evidence from this patch. A local DOM pass
is not an HTTP deployment pass. Native-speaker review, visual rendering of every
script and screen-reader conformance remain unverified. The 16 interface translations
are drafts. The private corpus, 69 archived payloads and historical archive capsules
remain excluded. The exact-utf8-f64/v1 codec and audited Python modules are unchanged.

## Commands

```bash
python verify_release.py
python test_public.py
python example.py
node test_codec.mjs
python browser_checks.py
```

The last command is the integrated HTTP browser check. A DOM-only mode is available
for environments that block navigation, but does not replace the publishing gate.

## Primary references

W3C File API, Blob.text(): https://www.w3.org/TR/FileAPI/#dom-blob-text

WHATWG Encoding Standard, TextDecoder fatal mode: https://encoding.spec.whatwg.org/#interface-textdecoder

These references define platform behavior, not certification of this application.
