import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {buildInventory, findInInventory, generateInventorySnapshot} from './work-inventory.mjs';

const inventory = buildInventory({
  sources:[
    {id:'hodge',canonicalName:'Hodge Conjecture Research Spine',domain:'research',sourceLocations:['research/projects/hodge-conjecture.md'],state:'current'},
    {id:'poem-one',canonicalName:'Unnamed recovered poem',domain:'poetry',sourceLocations:[],state:'unresolved'},
    {id:'red-wilds',canonicalName:'Red Wilds',domain:'game',sourceLocations:['play/mmo/simple/'],state:'current'}
  ],
  seeds:[]
});
assert.equal(findInInventory(inventory,'hodge').domain,'research');
assert.equal(findInInventory(inventory,'poem-one').domain,'poetry');
assert.equal(findInInventory(inventory,'red-wilds').domain,'game');
assert.notEqual(findInInventory(inventory,'hodge').domain, findInInventory(inventory,'red-wilds').domain);
assert.equal(findInInventory(inventory,'poem-one').state,'unresolved');
assert.equal(inventory.works.length,3);
console.log('PASS preservation inventory keeps individual works distinct');

const exactMerge = buildInventory({
  seeds:[{id:'x',canonicalName:'X',domain:'research',sourceLocations:[],state:'unresolved',aliases:['shared']}],
  sources:[{id:'x',canonicalName:'X',domain:'research',sourceLocations:['research/x.md'],state:'current'}]
});
assert.equal(exactMerge.works.length,1);
assert.deepEqual(findInInventory(exactMerge,'x').sourceLocations,['research/x.md']);
assert.equal(findInInventory(exactMerge,'x').domain,'research');

const aliasCollision = buildInventory({sources:[
  {id:'a',canonicalName:'A',domain:'poetry',aliases:['same']},
  {id:'b',canonicalName:'B',domain:'philosophy',aliases:['same']}
]});
const ambiguous = findInInventory(aliasCollision,'same');
assert.equal(ambiguous.ambiguous,true);
assert.deepEqual(ambiguous.matches.map(x=>x.id),['a','b']);
assert.throws(()=>buildInventory({sources:[
  {id:'same-id',canonicalName:'A',domain:'poetry'},
  {id:'same-id',canonicalName:'B',domain:'game'}
]}),/conflicting domains/);
console.log('PASS stable-ID merge only; alias conflicts stay ambiguous; domain conflicts fail closed');

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const generated=await generateInventorySnapshot(repoRoot);
const dream=findInInventory(generated,'dream-to-action');
const maui=findInInventory(generated,'maui-brick-break');
const hea=findInInventory(generated,'human-expression-archive');
const df=findInInventory(generated,'decision-field-mmorpg');
assert.equal(dream.preservationStatus,'located');
assert.equal(dream.publicationStatus,'public');
assert.ok(dream.sourceLocations.includes('github:redogit/Dream-To-Action'));
assert.ok(maui.sourceLocations.includes('github:redogit/MauiBrickBreak'));
assert.ok(hea.sourceLocations.includes('github:redogit/Other-Projects-/Human Expression Archive/'));
assert.equal(hea.domain,'archive');
assert.equal(df.domain,'game');
assert.ok(generated.generatedFrom.some(x=>x.path==='navigation/context-horizon/external-public-sources.json'));
assert.equal(generated.works.some(x=>x.canonicalName==='DnD'),false,'private repository identity must not enter the public inventory');
console.log('PASS external public repositories resolve preservation seeds without exposing private repository identity');

const requiredHistorical=[
  ['one-level-up-airlock','research-governance'],
  ['r3-scientific-method','methodology'],
  ['shadow','research'],
  ['runtime-relation-index','software-research'],
  ['language-structure-workbench','language-research'],
  ['csol','language-research'],
  ['compact-branching-geometry','research'],
  ['computer-mind','research'],
  ['knowledge-decay','research'],
  ['shared-well-human-compass','human-orientation'],
  ['pursuit-of-happiness','human-orientation'],
  ['moonshot-philosophy-foundation','philosophy'],
  ['before-i-speak','poetry'],
  ['pool-cleaner-engineering','engineering'],
  ['member-success-jira','professional-operations'],
  ['rivir','software-research']
];
for(const [id,domain] of requiredHistorical){
  const work=findInInventory(generated,id);
  assert.ok(work,`historical preservation target missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved',`${id} must stay unresolved until source is admitted`);
}
assert.equal(findInInventory(generated,'before-i-speak').canonicalName,'Before I Speak');
assert.ok(findInInventory(generated,'operator-moonshot').aliases.includes('/MoonShot'));
assert.ok(findInInventory(generated,'tiny-babel-tbcl').aliases.includes('/TBCL'));
assert.ok(generated.generatedFrom.some(x=>x.path==='navigation/context-horizon/historical-context-seeds.json'));
console.log('PASS historical, philosophical, professional, and creative works remain separate unresolved preservation targets');

const olderProtocolTargets=[
  ['rolling-research-airlock','research-governance'],
  ['scop-framing','methodology'],
  ['checkpoint-0','research-governance'],
  ['adm-005-recovery-failure-probe','experiment'],
  ['change-set-1','research-governance'],
  ['software-engineering-spec-review','methodology'],
  ['learned-2d8a6332ed','learned-artifact'],
  ['o1-1-v1-1','experiment'],
  ['gate-o2','research-governance'],
  ['llvm-wasm-generator','software-research'],
  ['fractal3d','research'],
  ['factored-library','knowledge-system'],
  ['distinction-kernel-016','research-result'],
  ['fermat-fourfold-hodge-reduction','research'],
  ['education-e1-e2-e3','education-research'],
  ['ift9-grm9-esa8-conditional-equality','research-result'],
  ['bgzf-compressed-text-ai','model-research'],
  ['mfai','creative-research'],
  ['quiet-mode-protocol','methodology'],
  ['human-aims-cross-carrier-goals-draft-01','human-orientation']
];
for(const [id,domain] of olderProtocolTargets){
  const work=findInInventory(generated,id);
  assert.ok(work,`older protocol/experiment target missing: ${id}`);
  assert.equal(work.domain,domain,`${id} domain changed`);
  assert.equal(work.preservationStatus,'must-locate-or-retain-unresolved',`${id} should not be promoted without admitted source`);
}
console.log('PASS older protocols, negative experiments, learned artifacts, and human-aim drafts remain individually preserved');
