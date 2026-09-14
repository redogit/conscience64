#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {recordsFromRepository} from './semantic-corpus.mjs';
import {querySemanticRecords} from './semantic-query.mjs';

function arg(name,fallback=null){
  const i=process.argv.indexOf(name);
  return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;
}
const root=arg('--root','.');
const query=arg('--query','');
const output=arg('--output',null);
const limit=Number(arg('--limit','12'));
const threshold=Number(arg('--threshold','0.10'));
if(!query.trim()){
  console.error('Usage: node tools/query-semantic-corpus.mjs --query "goal or obligation" [--root .] [--limit 12] [--threshold 0.10] [--output result.json]');
  process.exit(2);
}
const corpus=await recordsFromRepository(root,{maxFiles:5000,maxFileBytes:256000,maxTextChars:6000});
const result=querySemanticRecords(corpus.records,query,{limit,threshold});
const payload={
  schema:'conscience64.semantic-corpus-query/v1',
  corpusStats:corpus.stats,
  result,
  boundaries:[
    'QUERY_MATCH != SUPPORT',
    'HELPER_CANDIDATE != APPLICABLE_HELPER',
    'RELATED != SUPPORTS'
  ]
};
if(output)await writeFile(output,JSON.stringify(payload,null,2));
console.log(JSON.stringify(payload,null,2));
