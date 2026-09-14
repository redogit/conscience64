#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {recordsFromRepository} from './semantic-corpus.mjs';
import {massSemanticCrossReferenceMap} from './semantic-crossref.mjs';
import {crossProjectBridgeCandidates} from './semantic-routing.mjs';

function arg(name,fallback=null){
  const i=process.argv.indexOf(name);
  return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;
}
const root=arg('--root','.');
const output=arg('--output',null);
const maxFiles=Number(arg('--max-files','5000'));
const maxFileBytes=Number(arg('--max-file-bytes','256000'));
const maxTextChars=Number(arg('--max-text-chars','12000'));
const threshold=Number(arg('--threshold','0.28'));
const maxEdgesPerNode=Number(arg('--max-edges','12'));

const corpus=await recordsFromRepository(root,{maxFiles,maxFileBytes,maxTextChars});
const graph=massSemanticCrossReferenceMap(corpus.records,{threshold,maxEdgesPerNode});
const bridges=crossProjectBridgeCandidates(graph,{limit:100,minScore:Math.max(.2,threshold)});
const result={
  schema:'conscience64.semantic-corpus-map/v1',
  generatedFrom:{root:path.basename(path.resolve(root)),corpusSchema:corpus.schema,recordCount:corpus.records.length},
  boundaries:[
    'RELATED != SUPPORTS',
    'SEMANTIC_SIMILARITY != EVIDENCE',
    'SEMANTIC_PATH != PROOF_CHAIN',
    'BRIDGE_CANDIDATE != APPLICABILITY',
    'DERIVED_EDGE != AUTHORITY_TRANSFER'
  ],
  corpusStats:corpus.stats,
  graph,
  bridgeCandidates:bridges
};

if(output){
  await writeFile(output,JSON.stringify(result,null,2));
}
console.log(JSON.stringify({
  schema:result.schema,
  records:corpus.records.length,
  edges:graph.edges.length,
  bridgeCandidates:bridges.length,
  skippedLarge:corpus.stats.skippedLarge,
  skippedDecode:corpus.stats.skippedDecode,
  output:output||null
}));
