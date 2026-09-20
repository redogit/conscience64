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

function rgb(hex){
  const raw=hex.replace('#','');
  return [0,2,4].map(i=>parseInt(raw.slice(i,i+2),16)/255);
}
function luminance(hex){
  return rgb(hex).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
}
function contrast(a,b){
  const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (hi+0.05)/(lo+0.05);
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
  assert.ok(a.files.reduce((sum,file)=>sum+file.bytes,0)<128_000,'public testbed source projection exceeded 128 KB static source ceiling');
  assert.ok(a.boundaries.includes('PUBLIC_TESTBED != WHOLE_REPOSITORY'));

  const projected=await filesUnder(outA);
  assert.deepEqual(projected,['app.js','carrier-surface/index.html','index.html','projection-manifest.json','s1-models/index.html','style.css','testbed.json']);
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
  assert.ok(typeof exp.zero_result==='string'&&exp.zero_result.length>0);

  const requiredStatuses=['active','blocked','deferred','failed','return','tested'];
  assert.deepEqual([...new Set(source.paths.map(p=>p.status))].sort(),requiredStatuses);
  const currentness=new Set(source.progression_model.states);
  for(const pathState of source.paths){
    for(const field of ['id','title','status','currentness','progression_position','relation','evidence','result','provenance','claim_boundary','remainder']){
      assert.ok(Object.hasOwn(pathState,field),`path ${pathState.id} missing ${field}`);
    }
    assert.ok(currentness.has(pathState.currentness),`unknown currentness: ${pathState.currentness}`);
    assert.ok(String(pathState.provenance).length>0);
    assert.ok(String(pathState.claim_boundary).includes('!='));
  }
  const failed=source.paths.find(p=>p.status==='failed');
  assert.equal(failed.currentness,'HISTORICAL_SUPERSEDED');
  assert.match(failed.provenance,/pr:171;pr:172/);
  const blocked=source.paths.find(p=>p.status==='blocked');
  assert.match(blocked.claim_boundary,/PUBLIC_TESTBED != WHOLE_REPOSITORY/);
  const tested=source.paths.find(p=>p.id==='network-edge-isolation');
  assert.match(tested.zero_result,/0 declared forbidden repository routes/);
  const returned=source.paths.find(p=>p.status==='return');
  assert.match(returned.provenance,/gh-pages:3dcb37a5/);
  assert.ok(source.aliases.every(a=>a.relation==='ALIAS_ONLY'));
  assert.ok(source.aliases.some(a=>a.term==='CURRENCY'&&/knowledge currentness/.test(a.meaning)));
  assert.ok(source.verified_lineage.some(e=>e.from==='pr:171'&&e.to==='pr:172'&&e.relation==='VERIFIER_REPAIR'));
  assert.ok(source.verified_lineage.some(e=>e.from==='pr:178'&&e.to==='pr:179'&&e.relation==='VERIFIED_SUCCESSOR'));
  assert.ok(source.unresolved_relations.some(e=>e.relation==='PRESERVED_UNRESOLVED'));
  assert.deepEqual(
    source.principles.map(p=>p.name).sort(),
    ['Interlingua','One-degree experiment','Pairity','USDAY','Visible paths','Wonderment']
  );
  assert.ok(source.principles.every(p=>p.meaning&&String(p.boundary).includes('!=')));
  assert.ok(source.principles.some(p=>p.name==='Pairity'&&p.boundary==='PAIRITY != PARITY'));
  assert.ok(source.principles.some(p=>p.name==='USDAY'&&/cooperative work/.test(p.meaning)));
  assert.ok(source.principles.some(p=>p.name==='Interlingua'&&/shared operational language/.test(p.meaning)));

  const html=await readFile('public-testbed/site/index.html','utf8');
  const css=await readFile('public-testbed/site/style.css','utf8');
  const js=await readFile('public-testbed/site/app.js','utf8');
  assert.match(html,/<html lang="en">/);
  assert.match(html,/class="skip-link"/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/31173/);
  assert.match(html,/PUBLIC EXPERIMENT ≠ VERIFIED TRUTH/);
  assert.match(html,/Path Constellation — visible states/);
  assert.match(html,/Language Garden — aliases without forced identity/);
  assert.match(html,/Working principles/);
  assert.match(html,/id="principle-grid"/);
  assert.match(html,/id="lineage-list"/);
  assert.match(html,/\.\/s1-models\//);
  assert.match(html,/\.\/carrier-surface\//);
  const carrierPage=await readFile('public-testbed/site/carrier-surface/index.html','utf8');
  const s1Page=await readFile('public-testbed/site/s1-models/index.html','utf8');
  assert.match(carrierPage,/Object identity is invariant; coordinates are negotiable\./);
  assert.match(carrierPage,/17ce340776455735a1af814031b88b887a5cf421/);
  assert.match(carrierPage,/MULTI_KEY_RELATION != MATHEMATICAL_MANIFOLD/);
  assert.doesNotMatch(carrierPage,/<script\b/i,'Carrier–Surface public page must remain passive');
  assert.match(s1Page,/S Prime candidate-state model/);
  assert.match(s1Page,/Survivor/);
  assert.match(s1Page,/SemanticWorkUnit/);
  assert.match(s1Page,/Grand Unified Perceptron \/ multi-timescale cell/);
  assert.match(s1Page,/29effa0cfb52a019d51d81fae47aa8e056ab71cf/);
  assert.match(s1Page,/ab0b7c4724989f5d79a0bbfcd009582b40509140/);
  assert.match(s1Page,/CURRENT WORKING MODEL ≠ PINNED IMPLEMENTATION/);
  assert.doesNotMatch(s1Page,/<script\b/i,'S′ model public page must remain passive');
  assert.ok(!html.includes('http://')&&!html.includes('https://'),'testbed shell must have no external runtime dependency');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.ok(!js.includes('innerHTML'),'testbed client must construct text safely');
  assert.match(js,/textContent/);
  assert.match(js,/projection-manifest\.json/);
  assert.match(js,/function renderPaths/);
  assert.match(js,/function renderAliases/);
  assert.match(js,/function renderPrinciples/);
  assert.match(js,/Boundary: /);
  assert.match(js,/State: /);
  assert.match(js,/Unresolved relation:/);
  assert.match(css,/data-status="failed"/);
  assert.match(css,/data-status="blocked"/);
  assert.match(css,/data-status="deferred"/);
  assert.match(css,/data-status="return"/);
  const vars=Object.fromEntries([...css.matchAll(/--([a-z]+):(#(?:[0-9a-f]{6}))/gi)].map(m=>[m[1],m[2]]));
  assert.ok(contrast(vars.text,vars.bg)>=7,'primary text/background contrast must be at least 7:1');
  assert.ok(contrast(vars.muted,vars.panel)>=4.5,'muted text/panel contrast must be at least 4.5:1');
  assert.ok(contrast(vars.focus,vars.bg)>=3,'focus indicator/background contrast must be at least 3:1');

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

  console.log(`PASS public testbed source v0: ${a.files.length} projected source files, exact revision ${revision}, six visible path states, USDAY/Interlingua/Pairity/visible-path/wonderment/one-degree principles, verified lineage, aliases, unresolved relation, zero-result retention, deterministic isolation, privacy/symlink counterprobes, WCAG-oriented contrast gates, accessibility shell, static-size ceiling`);
}finally{
  await rm(workspace,{recursive:true,force:true});
}
