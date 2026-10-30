import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,parseTransfer,combine,orderedWords,composition} from '../src/word-gradient.mjs';

test('public adversarial golden preserves UTF-16 offsets and hierarchy',()=>{
  const text='😀 e\u0301cho _alpha1.\n\nSecond.\fThird.\u001eFourth.';
  const doc=compile(text,[],7);
  assert.equal(doc.rule,'utf16-lossless-v2-code-identifiers');
  assert.equal(doc.composition,'ordered-cumulative-v1');
  assert.equal(doc.leaves[0].word,'e\u0301cho');
  assert.equal(doc.leaves[0].occurrence,'occ-3');
  assert.equal(doc.leaves[1].word,'_alpha1');
  assert.equal(doc.entries[0].id,'lex-8');
  assert.equal(doc.books.length,2);
  assert.equal(doc.books[0].pages.length,2);
});

test('repeated lexical identity retains distinct occurrences',()=>{
  const doc=compile('echo echo.');
  assert.equal(doc.leaves[0].id,doc.leaves[1].id);
  assert.deepEqual(doc.leaves.map(x=>x.occurrence),['occ-0','occ-5']);
});

test('orderedWords is left-to-right and cumulative',()=>{
  const doc=compile('one two three');
  const a={kind:'word',id:'a',leaf:doc.leaves[0],wordCount:1};
  const b={kind:'word',id:'b',leaf:doc.leaves[1],wordCount:1};
  const c={kind:'word',id:'c',leaf:doc.leaves[2],wordCount:1};
  assert.deepEqual(orderedWords(combine(combine(a,b,'ab'),c,'abc')).map(x=>x.word),['one','two','three']);
  assert.equal(composition,'ordered-cumulative-v1');
});

test('transfer validation rejects duplicate lexical identities and source overflow',()=>{
  assert.throws(()=>compile('x'.repeat(12001)),/12,000/);
  assert.throws(()=>parseTransfer(JSON.stringify({
    schema:'gradient-talker-v2',
    rule:'utf16-lossless-v2-code-identifiers',
    composition:'ordered-cumulative-v1',
    owner:'Mary',
    text:'alpha alpha',
    entries:[
      {id:'lex-1',word:'alpha',color:'#000000'},
      {id:'lex-2',word:'alpha',color:'#ffffff'}
    ]
  })),/Duplicate word or identity/);
});
