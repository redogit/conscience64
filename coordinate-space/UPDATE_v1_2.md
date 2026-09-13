# Original-file intake and ordered user operations — 1.2

## Scope and provenance

This is a public-software successor of `15ba591d55a9fde8a28af2833e478dcfd5718167`. The recovered 1.1 source archive matched its 21-file SHA-256 manifest and Git subtree `1879f237260fc6361ce5473cd56b654f3564ed58` before modification. The existing codec, Python runtime, Python builder and language-pack data are preserved byte-for-byte. Private research, historical archive capsules and personal records remain excluded.

## Reproduced gap and failure

The preceding public interface could import a coordinate envelope but could not read an original UTF-8 file directly. Passing file contents through a textarea value would normalize line breaks. Separately, holding a language-pack read, selecting Arabic manually, then completing the earlier English pack reset the interface to English: an older asynchronous completion overrode the newer explicit choice.

## Implemented contracts

`CoordinateSourceFile.read(file)` obtains an ArrayBuffer, enforces the 1 MiB browser limit before reading, verifies the returned byte count, and rejects malformed UTF-8 with a fatal decoder. BOM handling is explicit. `fromBytes(Uint8Array)` works on the supplied byte view, uses the unchanged v1 encoder and checks every recovered byte against the original. It is text transport, not arbitrary-binary transport, encryption, authentication or compression.

The UI retains exact imported source text separately from its editable textarea preview. A later Encode uses the retained source while the preview is untouched. Any editor input switches back to editor-source mode and invalidates prior verification. Programmatic preview changes are also checked when Encode is pressed. A new envelope import populates the source preview without inventing a source-language tag. Direct original-file import and envelope import are deliberately separate: a JSON document is not guessed to be an envelope merely because of its extension.

Source-file reads and envelope reads share an ordered generation counter. Clear, typing or a newer source operation invalidates an older pending completion. Translation imports use a separate counter; an explicit interface-language selection invalidates older translation completions without invalidating source bytes. File inputs reset their selection after capturing the file so the same local file can be chosen again. No cancellation claims are made about operating-system disk I/O; stale results are discarded before becoming application state.

Locale preference resolution tries supported script-compatible entries in order. An explicit unsupported query-language override still falls back to English, as before. Unknown source language stays unknown. There are still 16 bundled translation drafts, not representation or certification of every culture. The existing 40-key language-pack contract is unchanged. The new file input uses the localized Original text label; explanatory operational diagnostics remain marked as English.

## Fresh finite evidence

* 9 Python regression methods pass, with 516 authored/seeded text round-trips.
* The independent Python scalar sweep passes over 1,112,064 scalars in 136 batches, matching the prior transcript hash.
* 35 existing JavaScript codec assertions and 367 Unicode/locale/clock assertions pass.
* 47 added JavaScript assertions cover original byte equality, BOM/CR/LF/NUL, empty and maximum-size inputs, invalid encodings, malformed file objects, preference resolution and forbidden Date access.
* 177 browser checks pass locally: the prior 144 plus 33 original-file and ordering checks. These include 16 language switches with exact source re-encoding, explicit edits, exact downloads, stale language reads, Clear, newer typing and reverse-order completion of two files.

The local HTTP attempt returned `ERR_BLOCKED_BY_ADMINISTRATOR`; local browser evidence uses the pre-existing DOM-only path. No CSP policy was weakened. The repository's existing Pages workflow invokes the extended Node and browser suites and must pass them over HTTP before publication. The eventual workflow/deployment state belongs in the publication receipt, not in an assumed local PASS. Local runtime: Python 3.13, Node 22, Chromium 144. No native-speaker review, screen-reader run or whole-platform certification is implied.

## Time, compatibility and unresolved remainder

The exact-utf8-f64/v1 envelope format is unchanged. No filename, locale, source-language hint, wall clock, calendar, modified-file time or session duration is inserted into its coordinates or digest. Historical source bytes and Git release chronology remain intact. The new transport does not represent the full context of a historical record; that remains a separate provenance obligation. Source hashes are not signatures or proof of meaning. Knowledge Decay remains an operational dependency: a changed or unavailable dependency requires revalidation, not an inherited status.

Text typed or edited in a textarea continues to follow that browser's line-ending normalization. This is now explicitly distinguished from untouched imported-byte mode. Device fonts, translation accuracy, browser compatibility outside the tested engine and accessibility conformance remain unverified. File intake is UTF-8-only with a 1 MiB limit; this release does not silently transcode legacy encodings.

## Primary implementation references

HTML textarea API values normalize line breaks: https://html.spec.whatwg.org/multipage/form-elements.html#the-textarea-element

File API binary and text reads: https://www.w3.org/TR/FileAPI/

Fatal decoding and explicit BOM handling: https://encoding.spec.whatwg.org/#interface-textdecoder

These references define implementation behavior; they do not certify this release.
