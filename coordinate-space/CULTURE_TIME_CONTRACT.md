# Culture and clock independence — contract 1.1

## Aim and boundary

Make the public coordinate workbench usable across languages without treating any language, country, calendar or present moment as the definition of a person or of knowledge. Preserve exact sources, consequential distinctions, recoverability and evidence boundaries. The actual person, their recorded model, the assisting system, the interface and the source are not merged.

This is a functional software update, not a universal cultural representation claim. A list of languages cannot stand in for every culture. Text transport is not translation, language understanding, oral/performance preservation, sign-language interpretation or a guarantee that a device has every font.

## Interface contract

There are 16 bundled interface drafts, with 40 messages each: English, Spanish, French, Portuguese, Arabic, Persian, Hebrew, Hindi, Bengali, Tamil, Simplified Chinese, Japanese, Korean, Swahili, Indonesian and Ukrainian. These are assistant-authored translations; no independent speaker review or community approval is claimed. Technical reference, license, detailed diagnostics and these repository documents remain English and are explicitly language-tagged.

Selection uses language names, not country flags. A browser language preference can select a compatible bundle; unsupported preferences use English. Script-specific requests are not silently mapped to a different script: for example, zh-TW does not silently receive the Simplified Chinese bundle. The selected language is always visible and can be changed. The browser's own file-picker text follows its operating-system settings.

Document language and direction are explicit. Arabic, Persian and Hebrew use RTL page layout. Source direction is independently selectable as auto, ltr or rtl; auto is a browser direction heuristic, not language detection. An optional source-language tag is validated separately. Empty means unknown, not English. When a new envelope is imported, no language is invented for it. These hints affect display only and are not added to the v1 envelope.

Source text never passes through translation, Unicode normalization, case conversion, transliteration, sorting or trimming. Machine JSON numbers and hexadecimal digests retain their machine spelling. Byte/coordinate counts use Intl.NumberFormat for presentation, so locale-specific digits and grouping do not change coordinates or identity. Browser locale data can evolve without changing the stored source.

## Community extension

Use **Save language template**, edit the message values, locale, nativeName and direction, then **Import language pack**. An imported pack is not a trust credential. It remains unreviewed session-local wording; inspect it and use only wording you trust.

The schema is `coordinate-language/v1`. It requires exactly schema, locale, nativeName, direction and messages, with all 40 message keys. The locale must be accepted as a BCP 47-style tag by Intl.getCanonicalLocales; direction must be ltr or rtl. Import caps are 128 KiB UTF-8, 1,000 UTF-16 code units per message, 80 code units for the displayed name, and 64 distinct locale packs per session. These are resource bounds, not a ranking of cultures. Reloading restores the bundled drafts.

All wording is inserted with textContent, never HTML or executable code. Malformed or incomplete packs are rejected before replacing the active pack. Plain-text validity does not authenticate a translation's meaning. The fixed English warning about unreviewed packs is outside their control. Clear invalidates pending asynchronous imports. No server or translation service receives the input. A template's initial locale is the currently selected language; change it when making a different language.

## What “time meaningless” means here

For valid source bytes B, the carrier and digest are functions of B and the fixed codec contract, not wall time:

    payload = Encode_v1(B)
    digest  = SHA256(B)
    Decode_v1(payload) = B

UI language, timezone, calendar, date of use, elapsed session time and recency are not arguments to these operations. The existing `exact-utf8-f64/v1` schema is unchanged. Existing envelopes still decode. There is no clock-based document expiry, countdown, recency weighting or forced regeneration with a new date. Download filenames do not gain timestamps. The sole UI timer releases temporary download resources; it does not expire content.

Sequence remains meaningful. We do not erase source dates, reorder events, invent missing chronology, or remove release dates from provenance. Two identical texts with different historical contexts can have the same byte digest and still be distinct historical records. A source hash must never replace those contextual records. The v1 text envelope is not itself a full provenance model.

Clock independence is not indefinite availability or a scientific statement about physical time. Browser, NumPy and hardware support can change. Keep source, schema, reproducible tests and offline copies; missing or changed dependencies remain unresolved under the Knowledge Decay guard. Old PASS labels are not automatic freshness.

## Reproducible evidence

* Existing Python gate: 9 regression methods with 516 text round-trips.
* Existing JavaScript codec checks: 35 assertions, including invalid payloads and the 1 MiB browser bound.
* Added JavaScript suite: 367 checks, including every one of 1,112,064 Unicode scalar values in 136 ordered batches, each at most 8,192 scalars. Encoded transcript: 4,382,592 UTF-8 bytes. Not all possible strings are enumerated.
* Independent Python/NumPy replay covers the same entire scalar range and produces the same transcript SHA-256: `e0a7693f7362e88827c15e772e55b3490bd983f90711df7f3ef36c2b1ef6847e`.
* Local JavaScript reruns in UTC, America/New_York, Pacific/Kiritimati and Asia/Kolkata agree. Date construction and Date.now are replaced by throwing functions in explicit clock-access controls. Calendar locale extensions do not change the carrier.
* Browser suite: 144 checks, including all 16 languages at 320 px and 1,100 px, source/envelope invariance, separate source language and direction, exact file downloads, translation-pack import/export and rejection, mixed scripts, and pending-import cancellation.

The local HTTP attempt was blocked by environment policy. The local browser pass uses DOM injection without weakening the application's CSP. GitHub's existing Pages gate runs the same suite over actual HTTP before publishing. Neither is screen-reader testing or accessibility-conformance certification. Full Unicode byte transport is not proof of visual rendering or native-speaker correctness.

## Repairs observed during this pass

The previous offscreen skip-link technique extended the scrollable area in RTL layouts at 320 px. It was replaced with a clipped, focus-revealed link and logical layout properties. The browser suite also avoided a CSP-sensitive string-evaluation wait by using locator assertions; the CSP was not weakened. These failures were fixed before the final local rerun.

## Standards used

W3C, Declaring language in HTML: https://www.w3.org/International/questions/qa-html-language-declarations

W3C, Structural markup and right-to-left text in HTML: https://www.w3.org/International/questions/qa-html-dir

Unicode Standard Annex #15, Unicode Normalization Forms: https://www.unicode.org/reports/tr15/

ECMA-402, Intl.Locale, Intl.getCanonicalLocales and Intl.NumberFormat: https://tc39.es/ecma402/

These sources inform implementation conventions; they do not certify this application or its translations.
