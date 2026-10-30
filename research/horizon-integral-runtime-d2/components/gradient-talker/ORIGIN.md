# Gradient Talker pure-kernel origin

Task 4 extracts only the deterministic `WordGradient` kernel. The standalone runtime does **not** load the fitted corpus or the HTML viewer.

## Planned historical carrier

The approved D2 planning baseline named an earlier fitted `Gradient_Talker_Open.html` carrier:

- size: `147718604` bytes
- SHA-256: `e594639a116dd5bd109bfee9904ef1b9685c2de13fde8868281a1aa294202a02`

That historical carrier was not byte-materializable in the current execution environment, so Task 4 does not claim byte identity to it.

## Materialized parity carrier

The currently accessible lightweight viewer was materialized from the user's Library solely to recover and parity-check the pure kernel:

- file: `Gradient_Talker_Open.html`
- size: `442239` bytes
- SHA-256: `386498201bd6dc518b0b01d7c7d2d1b55c84302f49781a6f16020c19b7372d53`
- kernel line range in that carrier: `2698–2746` (1-based, inclusive)
- exact UTF-8 bytes of that line range: `7210`
- SHA-256 of that line range: `c05130ee967381960586e69e06fac38305eef882465c54e8d92e2cbf43f22d75`

The recovered block defines `COMPOSITION`, `combine`, `orderedWords`, `compile`, `displayWords`, `transfer`, `gradient`, and `parseTransfer`. `src/word-gradient.mjs` preserves those algorithms; module exports are the only packaging change.

`fixtures/parity-adversarial.json` was generated directly from this materialized carrier before removing the HTML from the executable workspace. The fixture includes combining marks, emoji before a token (to exercise UTF-16 offsets), a code identifier, paragraphs, form-feed pages, and record-separator books.

## Claim boundary

Parity with the materialized carrier establishes finite executable equivalence for the tested kernel cases. It does not establish semantic meaning for colors, theorem validity, or byte identity with the earlier 147 MB fitted carrier. RGB values remain owner-controlled display metadata.
