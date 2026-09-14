#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  HYPOTHESIS_BOUNDARIES,
  createHypothesisSeed,
  xorStateDelta,
  compileDiscriminatorPlan,
  toAlgorithmHarnessSupportManifest
} from './hypothesis-algorithm-builder.mjs';

function usage(){
  return 'Usage: node tools/run-hypothesis-algorithm-builder.mjs --input <input.json> [--output <output.json>]';
}

function parseArgs(argv){
  const out={input:null,output:null};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--input')out.input=argv[++i]??null;
    else if(arg==='--output')out.output=argv[++i]??null;
    else if(arg==='--help'||arg==='-h')out.help=true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return out;
}

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function writeJson(file,value){
  fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`,'utf8');
}

export function runHypothesisAlgorithmBuilder(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('input must be a JSON object');
  const seed=createHypothesisSeed(input.seed??{});
  const plan=compileDiscriminatorPlan(seed,input.plan??{});
  const result={
    schema:'conscience64.hypothesis-algorithm-builder-run/v1',
    seed,
    plan,
    xorCalibration:null,
    manifest:null,
    builderExecution:'completed',
    scientificExecution:'not-executed',
    boundaries:[...HYPOTHESIS_BOUNDARIES]
  };
  if(input.xorCalibration!=null){
    const x=input.xorCalibration;
    result.xorCalibration=xorStateDelta(x.before,x.after);
  }
  if(input.manifest!==false){
    const options=input.manifest&&typeof input.manifest==='object'?input.manifest:{};
    result.manifest=toAlgorithmHarnessSupportManifest(plan,options);
  }
  return result;
}

function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.help){console.log(usage());return;}
  if(!args.input)throw new Error(`--input is required\n${usage()}`);
  const result=runHypothesisAlgorithmBuilder(readJson(args.input));
  if(args.output)writeJson(args.output,result);
  else process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
}

if(import.meta.url===`file://${process.argv[1]}`){
  try{main();}
  catch(error){
    console.error(`hypothesis-algorithm-builder: ${error?.message??error}`);
    process.exitCode=1;
  }
}
