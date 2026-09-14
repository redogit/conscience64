import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('save-runtime.js',import.meta.url),'utf8');
const store=new Map();
const localStorage={getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
const context=vm.createContext({globalThis:{},localStorage,TextEncoder,Date,Object,Array,JSON,Number,String,Set,Error});
context.globalThis=context;
vm.runInContext(source,context,{filename:'save-runtime.js'});
const runtime=context.Conscience64MMOSave;
assert.ok(runtime,'save runtime did not initialize');
assert.equal(runtime.schema,'conscience64.mmo.save/v1');

const state={xp:128,joy:77,discoveries:4,tokens:9,role:'Builder',morph:2,motto:'Build useful weird things',chronicle:['Fixed a market shelf.','Observed the labeled sky reconstruction.']};
const doc=runtime.documentFor(state);
assert.equal(doc.state.xp,128);
assert.equal(doc.state.role,'Builder');
assert.ok(!Number.isNaN(Date.parse(doc.savedAt)));
runtime.save(state);
assert.equal(runtime.load().state.motto,state.motto);
assert.equal(runtime.load().state.chronicle.length,2);

assert.throws(()=>runtime.validate({...doc,state:{...state,joy:101}}),/state\.joy invalid/);
assert.throws(()=>runtime.validate({...doc,state:{...state,role:'Supreme Being'}}),/state\.role invalid/);
assert.throws(()=>runtime.validate({...doc,state:{...state,morph:5}}),/state\.morph invalid/);
assert.throws(()=>runtime.validate({...doc,state:{...state,chronicle:Array(13).fill('x')}}),/chronicle too long/);
assert.throws(()=>runtime.validate({...doc,schema:'wrong'}),/wrong save schema/);
assert.equal(runtime.validate({...doc,authority:'server',state:{...state,serverAchievement:true}}).authority,undefined);
assert.equal(runtime.validate({...doc,authority:'server',state:{...state,serverAchievement:true}}).state.serverAchievement,undefined);

const exported=runtime.exportSave(doc);
assert.equal(runtime.parse(exported).state.tokens,9);
runtime.clear();
assert.equal(runtime.load(),null);
console.log('PASS MMO save: validated portable local state, explicit storage, import/export, bounds and authority-field stripping');
