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
