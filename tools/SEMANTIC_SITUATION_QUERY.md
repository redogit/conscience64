# Semantic Situation Query

`semantic-query.mjs` turns a bounded Situation or plain-language goal into **candidate helpers** from an admitted record corpus.

It is a retrieval helper for the Society workflow. It is not a verifier, applicability oracle, evidence source, or authority engine.

## Use

```js
import {recordsFromRepository} from './semantic-corpus.mjs';
import {suggestSituationHelpers} from './semantic-query.mjs';

const corpus = await recordsFromRepository('.');
const result = suggestSituationHelpers(corpus.records, {
  goal: 'Import game scenes into deterministic ECS video jobs',
  obligations: [
    'preserve provenance',
    'keep local state separate from authority'
  ],
  uncertainty: 'which helper should be inspected first?'
}, {
  limit: 12,
  threshold: 0.10
});
```

The function converts the Situation into a transient query record, builds a bounded semantic neighborhood, and returns the highest-ranked candidate records.

The transient query is never retained as a corpus fact.

## Supported Situation fields

The compact text projection recognizes fields such as:

- `subject`;
- `goal`;
- `motivator`;
- `request` / `entreaty`;
- `obligation` / `obligations`;
- `constraints` / `costs`;
- `uncertainty` / `unknowns`;
- `description` / `context`;
- `outputDefinition` / `output_definition`;
- optional tags.

Plain strings are also accepted directly.

## CLI

```bash
node tools/query-semantic-corpus.mjs \
  --root . \
  --query "provenance evidence accessibility deterministic ECS game" \
  --limit 12 \
  --threshold 0.10
```

Optional `--output result.json` writes the exact query result and corpus statistics.

## Output

Each candidate includes:

- stable record ID;
- title;
- kind/project;
- source provenance;
- relation class;
- score;
- component semantic signals;
- compact reasons when enabled;
- explicit epistemic boundaries.

## Required boundaries

- `QUERY_MATCH != SUPPORT`
- `HELPER_CANDIDATE != APPLICABLE_HELPER`
- `RELATED != SUPPORTS`
- `TRANSIENT_QUERY != CORPUS_RECORD`

A high-ranked helper is permission to **inspect** that record next. It is not permission to reuse it, transfer its authority, claim that it applies, or treat its content as corroboration.

## Society placement

```text
Situation
  -> Recover & Bound
    -> semantic helper query
      -> inspect candidate helpers
        -> applicability/evidence check
          -> Build & Test only if justified
```

This keeps helper discovery cheap while leaving consequential decisions under explicit Society obligations and evidence gates.
