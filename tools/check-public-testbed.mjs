import assert from 'node:assert/strict';
import {cp,mkdtemp,mkdir,readFile,readdir,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildPublicTestbed} from './build-public-testbed.mjs';

function revisionFromArgs(){
  const i=process.argv.indexOf('--revision');
  if(i<0||!process.argv[i+1])throw new Error('--revision is required');
  return process.argv[i+1];
}
async function filesUnder(root,rel=''){
  const entries=(await readdir(path.join(root,rel),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  const out=[];
  for(const entry of entries){
    const child=rel?path.join(rel,entry.name):entry.name;
    if(entry.isDirectory())out.push(...await filesUnder(root,child));
    else out.push(child.split(path.sep).join('/'));
  }
  return out;
}
const revision=revisionFromArgs();
const workspace=await mkdtemp(path.join(tmpdir(),'c64-public-testbed-'));
try{
  const outA=path.join(workspace,'a');
  const outB=path.join(workspace,'b');
  const a=await buildPublicTestbed({root:'.',out:outA,sourceRevision:revision});
  const b=await buildPublicTestbed({root:'.',out:outB,sourceRevision:revision});
  assert.deepEqual(a,b,'public testbed build must be deterministic');
  assert.equal(a.source_revision,revision);
  assert.equal(a.source_root,'public-testbed/');
  assert.equal(a.publication_scope,'public-testbed-only');
  assert.equal(a.authority,'experimental-non-authoritative');
  assert.match(a.projection_sha256,/^[0-9a-f]{64}$/);
  assert.ok(a.files.every(file=>file.source.startsWith('public-testbed/')));
  assert.ok(a.boundaries.includes('PUBLIC_TESTBED != WHOLE_REPOSITORY'));

  const projected=await filesUnder(outA);
  assert.deepEqual(projected,['app.js','index.html','projection-manifest.json','style.css','testbed.json']);
  assert.ok(!projected.some(p=>p.startsWith('research/')||p.startsWith('play/')||p==='README.md'));

  for(const rel of projected){
    const first=await readFile(path.join(outA,rel));
    const second=await readFile(path.join(outB,rel));
    assert.deepEqual(first,second,`nondeterministic output: ${rel}`);
  }

  const source=JSON.parse(await readFile('public-testbed/testbed.json','utf8'));
  assert.equal(source.schema,'conscience64.public-testbed-source/v0');
  assert.equal(source.marker,'31173');
  assert.equal(source.rooms.length,6);
  assert.deepEqual(source.rooms.map(x=>x.id),[
    'path-constellation','compass','failure-museum',
    'evidence-telescope','language-garden','wonder-room'
  ]);
  assert.equal(source.progression_model.currency_meaning,'knowledge-currentness');
  assert.ok(source.progression_model.boundaries.includes('ALIAS != LINEAGE'));
  const exp=source.experiments[0];
  for(const field of ['id','title','status','currentness','changed_degree','evidence','result','zero_result','remainder','provenance','claim_boundary']){
    assert.ok(Object.hasOwn(exp,field),`experiment missing ${field}`);
  }
  assert.equal(exp.id,'projection-isolation-v0');
  assert.ok(Array.isArray(exp.invariants)&&exp.invariants.length>=3);
  assert.ok(Array.isArray(exp.remainder)&&exp.remainder.length>=1);
  assert.match(exp.zero_result,/no claim/i);

  const html=await readFile('public-testbed/site/index.html','utf8');
  const css=await readFile('public-testbed/site/style.css','utf8');
  const js=await readFile('public-testbed/site/app.js','utf8');
  assert.match(html,/<html lang="en">/);
  assert.match(html,/class="skip-link"/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/31173/);
  assert.match(html,/PUBLIC EXPERIMENT ≠ VERIFIED TRUTH/);
  assert.ok(!html.includes('http://')&&!html.includes('https://'),'testbed shell must have no external runtime dependency');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.ok(!js.includes('innerHTML'),'testbed client must construct text safely');
  assert.match(js,/textContent/);
  assert.match(js,/projection-manifest\.json/);

  const unsafeRoot=path.join(workspace,'unsafe-root');
  await cp('public-testbed',path.join(unsafeRoot,'public-testbed'),{recursive:true});
  const unsafeDescriptor=JSON.parse(await readFile(path.join(unsafeRoot,'public-testbed','testbed.json'),'utf8'));
  unsafeDescriptor.privacy_origin={classification:'private-history-method-only',independently_regrounded:false};
  await writeFile(path.join(unsafeRoot,'public-testbed','testbed.json'),JSON.stringify(unsafeDescriptor));
  await assert.rejects(
    buildPublicTestbed({root:unsafeRoot,out:path.join(workspace,'unsafe-out'),sourceRevision:revision}),
    /private-origin carrier rejected/
  );

  const nestedRoot=path.join(workspace,'nested-root');
  await cp('public-testbed',path.join(nestedRoot,'public-testbed'),{recursive:true});
  await writeFile(
    path.join(nestedRoot,'public-testbed','site','private.json'),
    JSON.stringify({wrapper:{derived_from_private_history:true},canary:'PRIVATE_TESTBED_CANARY'})
  );
  await assert.rejects(
    buildPublicTestbed({root:nestedRoot,out:path.join(workspace,'nested-out'),sourceRevision:revision}),
    /private-origin carrier rejected/
  );

  const linkRoot=path.join(workspace,'link-root');
  await cp('public-testbed',path.join(linkRoot,'public-testbed'),{recursive:true});
  await symlink('index.html',path.join(linkRoot,'public-testbed','site','alias.html'));
  await assert.rejects(
    buildPublicTestbed({root:linkRoot,out:path.join(workspace,'link-out'),sourceRevision:revision}),
    /symlink/
  );

  console.log(`PASS public testbed source v0: ${a.files.length} projected source files, exact revision ${revision}, deterministic isolated build, privacy/symlink counterprobes, accessibility shell, visible progression + remainder`);
}finally{
  await rm(workspace,{recursive:true,force:true});
}
