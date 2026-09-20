import assert from 'node:assert/strict';
import {
  analyzeOperationalWord,
  canonicalizeOperationalToken,
  deriveOperationalFamily,
  operationalLexicon,
  operationalMorphologyBoundaries
} from './operational-morphology.mjs';

assert.ok(operationalMorphologyBoundaries.includes('DERIVED_FORM != NEW_AUTHORITY'));
assert.ok(operationalMorphologyBoundaries.includes('LEXICAL_FAMILY != SEMANTIC_IDENTITY'));
assert.ok(operationalMorphologyBoundaries.includes('COINED_TERM != ESTABLISHED_STANDARD'));

const requiredFamilies = [
  'parameterize','expansify','compactify','expand','compact','seed','experience','carrier',
  'reconstruct','serialize','determinism','invariant','mutate','provenance','remainder',
  'observe','bound','transform','reverse','compare','measure','verify','admit','preserve'
];
for (const lemma of requiredFamilies) {
  assert.ok(operationalLexicon.lexemes.some(row => row.lemma === lemma), `missing operational lexeme: ${lemma}`);
}

const expectForms = {
  expansify: [
    'expansify','expansifies','expansified','expansifying','expansification',
    'expansifier','expansifiable','re-expansify','re-expansified','re-expansification'
  ],
  compactify: [
    'compactify','compactifies','compactified','compactifying','compactification',
    'compactifier','compactifiable','re-compactify','re-compactified','re-compactification'
  ],
  parameterize: [
    'parameterize','parameterized','parameterizing','parameterization',
    'parameterizable','parameterizability'
  ]
};

for (const [lemma, forms] of Object.entries(expectForms)) {
  const family = deriveOperationalFamily(lemma, { maxDepth: 2 });
  for (const form of forms) assert.ok(family.forms.includes(form), `${lemma} missing derived form ${form}`);
}

for (const [surface, lemma, path] of [
  ['expansification','expansify',['ify->ification']],
  ['re-expansification','expansify',['prefix:re','ify->ification']],
  ['compactified','compactify',['ify->ified']],
  ['re-compactified','compactify',['prefix:re','ify->ified']],
  ['parameterizability','parameterize',['ize->izable','able->ability']]
]) {
  const analysis = analyzeOperationalWord(surface);
  assert.ok(analysis, `no analysis for ${surface}`);
  assert.equal(analysis.lemma, lemma);
  for (const step of path) assert.ok(analysis.derivation.includes(step), `${surface} missing path step ${step}`);
}

assert.equal(canonicalizeOperationalToken('Expansification'), 'expansify');
assert.equal(canonicalizeOperationalToken('re-expansified'), 'expansify');
assert.equal(canonicalizeOperationalToken('COMPACTIFICATION'), 'compactify');
assert.equal(canonicalizeOperationalToken('parameterizability'), 'parameterize');
assert.equal(canonicalizeOperationalToken('unregisteredmadeupword'), 'unregisteredmadeupword');

const serialized = JSON.stringify(operationalLexicon);
assert.ok(!serialized.includes('PRIVATE_'));
assert.ok(operationalLexicon.derivation.maxDepth >= 2);

console.log('PASS operational morphology: declared roots, derived/sub-derived forms, reverse analysis, and canonical semantic tokens');
