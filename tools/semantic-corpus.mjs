import {createHash} from 'node:crypto';
import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {hasRestrictedOriginMarker} from './private-origin-boundary.mjs';

export const CORPUS_SCHEMA='conscience64.semantic-corpus/v1';
export const CORPUS_BOUNDARIES=Object.freeze([
  'CORPUS_RECORD != EVIDENCE',
  'FILE_LINK != SUPPORT',
  'PATH_PROXIMITY != SEMANTIC_AUTHORITY',
  'PRIVATE_MATERIAL_REQUIRES_EXPLICIT_SCOPE',
  'PRIVATE_ORIGIN != SEARCHABLE_CORPUS'
]);

const DEFAULT_EXTENSIONS=new Set(['.md','.txt','.json','.jsonl','.mjs','.js','.py','.html','.css','.yml','.yaml','.toml','.sh','.ps1']);
const DEFAULT_EXCLUDED_DIRS=new Set(['.git','node_modules','.runtime','coverage','dist','build','vendor','__pycache__','.venv','venv']);
const DEFAULT_EXCLUDED_BASENAMES=new Set(['package-lock.json','npm-shrinkwrap.json','pnpm-lock.yaml','yarn.lock']);
const decoder=new TextDecoder('utf-8',{fatal:true});

const toPosix=p=>p.split(path.sep).join('/');
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const cleanTag=s=>String(s??'').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,'');


function structuredPrivateOrigin(value){
  if(!value||typeof value!=='object')return false;
  if(hasRestrictedOriginMarker(value))return true;
  if(Array.isArray(value))return value.some(structuredPrivateOrigin);
  return Object.values(value).some(structuredPrivateOrigin);
}

function markdownFrontMatterPrivateOrigin(text){
  if(!/^---\r?\n/.test(text))return false;
  const end=text.search(/\r?\n---\r?\n/);
  if(end<0)return false;
  const front=text.slice(0,end);
  if(/^\s*derived_from_private_history\s*:\s*true\s*(?:#.*)?$/mi.test(front))return true;
  return /^\s*classification\s*:\s*private-history-method-only\s*(?:#.*)?$/mi.test(front)
    && /^\s*privacy_origin\s*:\s*(?:#.*)?$/mi.test(front);
}

export function hasPrivateOriginMarker(text,ext){
  if(ext==='.json'){
    try{return structuredPrivateOrigin(JSON.parse(text));}catch{return false;}
  }
  if(ext==='.jsonl'){
    for(const line of text.split(/\r?\n/)){
      if(!line.trim())continue;
      try{if(structuredPrivateOrigin(JSON.parse(line)))return true;}catch{}
    }
    return false;
  }
  if(ext==='.md')return markdownFrontMatterPrivateOrigin(text);
  return false;
}

function titleFrom(text,ext,fallback){
  if(ext==='.md'){
    const m=text.match(/^#\s+(.+)$/m);if(m)return m[1].trim();
  }
  if(ext==='.html'){
    const m=text.match(/<title[^>]*>([^<]+)<\/title>/i);if(m)return m[1].trim();
  }
  if(ext==='.json'){
    try{const v=JSON.parse(text);const t=v?.title??v?.name??v?.label;if(typeof t==='string'&&t.trim())return t.trim();}catch{}
  }
  return fallback;
}

function localLinkTargets(text,ext,relPath){
  const raw=[];
  if(ext==='.md'){
    for(const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g))raw.push(m[1]);
  }
  if(ext==='.html'){
    for(const m of text.matchAll(/href\s*=\s*["']([^"']+)["']/gi))raw.push(m[1]);
  }
  const out=[];
  for(let target of raw){
    target=String(target).trim().replace(/^<|>$/g,'');
    if(!target||/^(?:[a-z]+:|#)/i.test(target))continue;
    target=target.split('#')[0].split('?')[0].trim();
    if(!target)continue;
    try{target=decodeURIComponent(target);}catch{}
    let resolved;
    if(target.startsWith('/'))resolved=path.posix.normalize(target.slice(1));
    else resolved=path.posix.normalize(path.posix.join(path.posix.dirname(relPath),target));
    if(resolved==='..'||resolved.startsWith('../'))continue;
    out.push(resolved.replace(/^\.\//,''));
  }
  return uniq(out);
}

export async function recordsFromRepository(root='.',options={}){
  const rootAbs=path.resolve(root);
  const extensions=new Set((options.extensions??[...DEFAULT_EXTENSIONS]).map(x=>String(x).toLowerCase()));
  const excludedDirs=new Set(options.excludedDirs??[...DEFAULT_EXCLUDED_DIRS]);
  const excludedBasenames=new Set(options.excludedBasenames??[...DEFAULT_EXCLUDED_BASENAMES]);
  const maxFiles=Number.isInteger(options.maxFiles)?Math.max(1,options.maxFiles):5000;
  const maxFileBytes=Number.isInteger(options.maxFileBytes)?Math.max(128,options.maxFileBytes):256_000;
  const maxTextChars=Number.isInteger(options.maxTextChars)?Math.max(128,options.maxTextChars):12_000;
  const includeHidden=Boolean(options.includeHidden);
  const records=[];
  const pendingLinks=new Map();
  const stats={schema:CORPUS_SCHEMA,included:0,skippedLarge:0,skippedDecode:0,skippedExcluded:0,skippedUnsupported:0,skippedPrivateOrigin:0,totalBytes:0,truncated:0,maxFiles,maxFileBytes,maxTextChars};

  async function walk(absDir,relDir=''){
    if(records.length>=maxFiles)return;
    let entries=await readdir(absDir,{withFileTypes:true});
    entries=entries.sort((a,b)=>a.name.localeCompare(b.name));
    for(const entry of entries){
      if(records.length>=maxFiles)return;
      const rel=toPosix(path.join(relDir,entry.name));
      const abs=path.join(absDir,entry.name);
      if(entry.isSymbolicLink()){stats.skippedExcluded++;continue;}
      if(entry.isDirectory()){
        if(excludedDirs.has(entry.name)||(!includeHidden&&entry.name.startsWith('.')&&entry.name!=='.github')){stats.skippedExcluded++;continue;}
        await walk(abs,rel);continue;
      }
      if(!entry.isFile())continue;
      if(excludedBasenames.has(entry.name)){stats.skippedExcluded++;continue;}
      const ext=path.extname(entry.name).toLowerCase();
      if(!extensions.has(ext)){stats.skippedUnsupported++;continue;}
      const info=await stat(abs);
      if(info.size>maxFileBytes){stats.skippedLarge++;continue;}
      const bytes=await readFile(abs);
      let text;try{text=decoder.decode(bytes);}catch{stats.skippedDecode++;continue;}
      if(text.charCodeAt(0)===0xfeff)text=text.slice(1);
      if(hasPrivateOriginMarker(text,ext)){stats.skippedPrivateOrigin++;continue;}
      const digest=sha256(bytes);
      const base=path.basename(entry.name,ext);
      const project=rel.includes('/')?rel.split('/')[0]:'root';
      const title=titleFrom(text,ext,base||entry.name);
      const dirs=rel.split('/').slice(0,-1).map(cleanTag);
      const tags=uniq([project,...dirs,ext.slice(1)].map(cleanTag));
      const id=`file:${rel}`;
      const content=text.length>maxTextChars?text.slice(0,maxTextChars):text;
      if(text.length>maxTextChars)stats.truncated++;
      records.push({
        id,title,kind:'repository-file',project,
        aliases:uniq([base,entry.name]),tags,
        content,
        provenance:{kind:'repository-file',path:rel,sha256:digest,bytes:bytes.length},
        relations:[]
      });
      pendingLinks.set(id,localLinkTargets(text,ext,rel));
      stats.totalBytes+=bytes.length;
    }
  }

  await walk(rootAbs);
  const ids=new Set(records.map(r=>r.id));
  for(const record of records){
    const links=pendingLinks.get(record.id)||[];
    record.relations=links.map(target=>`file:${target}`).filter(target=>ids.has(target)).map(target=>({target,relation:'LINKS_TO',provenance:record.provenance.path}));
  }
  stats.included=records.length;
  return {schema:CORPUS_SCHEMA,root:path.basename(rootAbs),records,stats,boundaries:[...CORPUS_BOUNDARIES]};
}
