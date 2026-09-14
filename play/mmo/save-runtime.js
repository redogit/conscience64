'use strict';
(() => {
  const SCHEMA = 'conscience64.mmo.save/v1';
  const STORAGE_KEY = SCHEMA;
  const MAX_BYTES = 131072;
  const roles = new Set(['Explorer','Builder','Helper','Researcher','Storyteller','Chaos Mechanic']);
  const int = (value,min,max,field) => {
    const n=Number(value);
    if(!Number.isInteger(n)||n<min||n>max) throw new Error(`${field} invalid`);
    return n;
  };
  const text=(value,max,field,allowEmpty=true)=>{
    if(typeof value!=='string') throw new Error(`${field} must be text`);
    const v=value.trim();
    if((!allowEmpty&&!v)||v.length>max) throw new Error(`${field} invalid`);
    return v;
  };
  function validate(input) {
    if(!input||typeof input!=='object'||Array.isArray(input)) throw new Error('save must be an object');
    if(input.schema!==SCHEMA) throw new Error('wrong save schema');
    const raw=JSON.stringify(input);
    if(new TextEncoder().encode(raw).length>MAX_BYTES) throw new Error('save file too large');
    const source=input.state;
    if(!source||typeof source!=='object'||Array.isArray(source)) throw new Error('state invalid');
    const role=text(source.role,32,'state.role',false);
    if(!roles.has(role)) throw new Error('state.role invalid');
    const chronicle=Array.isArray(source.chronicle)?source.chronicle:[];
    if(chronicle.length>12) throw new Error('state.chronicle too long');
    const state={
      xp:int(source.xp,0,1000000000,'state.xp'),
      joy:int(source.joy,0,100,'state.joy'),
      discoveries:int(source.discoveries,0,1000000000,'state.discoveries'),
      tokens:int(source.tokens,0,1000000000,'state.tokens'),
      role,
      morph:int(source.morph,0,4,'state.morph'),
      motto:text(source.motto??'',120,'state.motto'),
      chronicle:chronicle.map((row,i)=>text(row,500,`state.chronicle[${i}]`,false))
    };
    const savedAt=text(input.savedAt,64,'savedAt',false);
    if(Number.isNaN(Date.parse(savedAt))) throw new Error('savedAt invalid');
    return Object.freeze({schema:SCHEMA,savedAt,state:Object.freeze(state)});
  }
  function documentFor(state) { return validate({schema:SCHEMA,savedAt:new Date().toISOString(),state}); }
  function save(state) { const doc=documentFor(state); localStorage.setItem(STORAGE_KEY,JSON.stringify(doc)); return doc; }
  function load() { const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return null; return validate(JSON.parse(raw)); }
  function clear() { localStorage.removeItem(STORAGE_KEY); }
  function parse(textValue) { return validate(JSON.parse(textValue)); }
  function exportSave(input) { return JSON.stringify(validate(input),null,2); }
  globalThis.Conscience64MMOSave = Object.freeze({schema:SCHEMA,storageKey:STORAGE_KEY,validate,documentFor,save,load,clear,parse,exportSave});
})();
