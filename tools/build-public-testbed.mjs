import {createHash} from 'node:crypto';
import {cp,mkdir,readdir,readFile,rm,stat,writeFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {containsRestrictedOrigin} from './private-origin-boundary.mjs';

export const PUBLIC_TESTBED_SCHEMA='conscience64.public-testbed-projection/v0';
const ALLOWED_EXTENSIONS=new Set(['.html','.css','.js','.json','.txt','.svg']);
const MUSILANGUAGE_FILES=[
  'index.html',
  'engine.js',
  'utf8-space.js',
  'style-profiles.js',
  'music64.js',
  'listener-floats.js',
  'word-forge.js'
];

const sha256=raw=>createHash('sha256').update(raw).digest('hex');
const toPosix=p=>p.split(path.sep).join('/');
const canonical=value=>JSON.stringify(value,Object.keys(value).sort());

async function walkFiles(root,rel=''){
  const dir=path.join(root,rel);
  const entries=(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  const out=[];
  for(const entry of entries){
    const childRel=rel?path.join(rel,entry.name):entry.name;
    const abs=path.join(root,childRel);
    const info=await lstat(abs);
    if(info.isSymbolicLink())throw new Error(`public-testbed source may not contain symlink: ${toPosix(childRel)}`);
    if(info.isDirectory()){out.push(...await walkFiles(root,childRel));continue;}
    if(!info.isFile())throw new Error(`unsupported public-testbed source entry: ${toPosix(childRel)}`);
    const ext=path.extname(entry.name).toLowerCase();
    if(!ALLOWED_EXTENSIONS.has(ext))throw new Error(`unsupported public-testbed extension: ${toPosix(childRel)}`);
    out.push(toPosix(childRel));
  }
  return out;
}

function assertRevision(revision){
  if(typeof revision!=='string'||!/^[0-9a-f]{40}$/.test(revision))throw new Error('source revision must be an exact 40-character lowercase SHA');
}

function assertStructuredPublicSafe(value,label){
  if(containsRestrictedOrigin(value))throw new Error(`private-origin carrier rejected from public testbed: ${label}`);
}

async function checkFileSafety(abs,rel){
  const ext=path.extname(rel).toLowerCase();
  if(ext==='.json'){
    const raw=await readFile(abs,'utf8');
    let value;
    try{value=JSON.parse(raw);}catch{throw new Error(`invalid JSON in public-testbed source: ${rel}`);}
    assertStructuredPublicSafe(value,rel);
  }
}

export async function buildPublicTestbed({root='.',out,sourceRevision}){
  assertRevision(sourceRevision);
  if(!out)throw new Error('output directory is required');
  const rootAbs=path.resolve(root);
  const sourceRoot=path.join(rootAbs,'public-testbed');
  const siteRoot=path.join(sourceRoot,'site');
  if(!(await stat(siteRoot)).isDirectory())throw new Error('public-testbed/site is required');

  const descriptorPath=path.join(sourceRoot,'testbed.json');
  const descriptorRaw=await readFile(descriptorPath);
  const descriptor=JSON.parse(descriptorRaw.toString('utf8'));
  assertStructuredPublicSafe(descriptor,'testbed.json');
  if(descriptor.schema!=='conscience64.public-testbed-source/v0')throw new Error('wrong public-testbed source schema');
  if(descriptor.publication_scope!=='public-testbed-only')throw new Error('public-testbed source widened publication scope');
  if(descriptor.authority!=='experimental-non-authoritative')throw new Error('public-testbed source authority inflated');
  if(descriptor.marker!=='31173')throw new Error('31173 marker changed');

  const files=await walkFiles(siteRoot);
  if(!files.includes('index.html'))throw new Error('public-testbed/site/index.html is required');

  await rm(out,{recursive:true,force:true});
  await mkdir(out,{recursive:true});

  const projected=[];
  for(const rel of files){
    const src=path.join(siteRoot,...rel.split('/'));
    await checkFileSafety(src,rel);
    const dst=path.join(out,...rel.split('/'));
    await mkdir(path.dirname(dst),{recursive:true});
    await cp(src,dst,{force:false,errorOnExist:true});
    const raw=await readFile(src);
    projected.push({path:rel,bytes:raw.length,sha256:sha256(raw),source:`public-testbed/site/${rel}`});
  }

  const testbedOut=path.join(out,'testbed.json');
  await writeFile(testbedOut,descriptorRaw);
  projected.push({path:'testbed.json',bytes:descriptorRaw.length,sha256:sha256(descriptorRaw),source:'public-testbed/testbed.json'});

  const musicRoot=path.join(rootAbs,'play','musilanguage');
  for(const rel of MUSILANGUAGE_FILES){
    const src=path.join(musicRoot,rel);
    const info=await lstat(src);
    if(info.isSymbolicLink()||!info.isFile())throw new Error(`invalid curated Musilanguage source: ${rel}`);
    const dstRel=toPosix(path.join('play','musilanguage',rel));
    const dst=path.join(out,...dstRel.split('/'));
    await mkdir(path.dirname(dst),{recursive:true});
    await cp(src,dst,{force:false,errorOnExist:true});
    const raw=await readFile(src);
    projected.push({path:dstRel,bytes:raw.length,sha256:sha256(raw),source:`play/musilanguage/${rel}`});
  }

  projected.sort((a,b)=>a.path.localeCompare(b.path));

  const identityInput=JSON.stringify({sourceRevision,files:projected.map(({path,bytes,sha256})=>({path,bytes,sha256}))});
  const manifest={
    schema:PUBLIC_TESTBED_SCHEMA,
    source_revision:sourceRevision,
    source_root:'public-testbed/ + curated play/musilanguage/',
    publication_scope:'public-testbed-plus-musilanguage',
    authority:'experimental-non-authoritative',
    projection_sha256:sha256(Buffer.from(identityInput)),
    files:projected,
    boundaries:[
      'CONSCIENCE64_REPOSITORY != PUBLIC_TESTBED_PROJECTION',
      'PUBLIC_TESTBED_PLUS_MUSILANGUAGE != WHOLE_REPOSITORY',
      'MUSILANGUAGE_PUBLIC != WHOLE_PLAY',
      'PUBLIC_EXPERIMENT != VERIFIED_TRUTH',
      'PRIVATE SOURCE MUST NOT PROPAGATE'
    ]
  };
  await writeFile(path.join(out,'projection-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}

function parseArgs(argv){
  const out={root:'.'};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--root')out.root=argv[++i];
    else if(arg==='--out')out.out=argv[++i];
    else if(arg==='--revision')out.sourceRevision=argv[++i];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return out;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const args=parseArgs(process.argv.slice(2));
  const manifest=await buildPublicTestbed(args);
  process.stdout.write(JSON.stringify({schema:manifest.schema,source_revision:manifest.source_revision,file_count:manifest.files.length,projection_sha256:manifest.projection_sha256})+'\n');
}
