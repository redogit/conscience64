(()=>{
'use strict';

const KEY='conscience64.spaceLensMemory.v1';
const SCHEMA='conscience64/space-lens-memory/v1';
const MAX_QUERIES=250;
const MAX_SELECTIONS=600;
const PRIVATE_METHOD_ORIGIN=Object.freeze({
  classification:'private-history-method-only',
  source:'private-history:withheld',
  independentlyRegrounded:false,
  requiresIndependentRegrounding:true,
  publicationAllowed:false,
  claimCeiling:'abstract method only; no source or identity claim'
});
const PRIVATE_METHOD_ORIGIN_KEYS=Object.keys(PRIVATE_METHOD_ORIGIN).sort().join('|');
const now=()=>new Date().toISOString();
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const normalize=q=>String(q??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9:_-]+/g,' ').trim().replace(/\s+/g,' ');
const fresh=()=>({schema:SCHEMA,version:1,createdAt:now(),updatedAt:now(),queries:{},teachings:{},aliases:{},sourceVotes:{},selections:[]});
let volatile=fresh();

function storage(){try{return globalThis.localStorage||null;}catch{return null;}}
function valid(x){return x&&x.schema===SCHEMA&&typeof x.queries==='object'&&typeof x.teachings==='object'&&typeof x.sourceVotes==='object';}
function privateOrigin(value){
  if(value==null)return null;
  if(!plain(value)||Object.keys(value).sort().join('|')!==PRIVATE_METHOD_ORIGIN_KEYS)throw new TypeError('Invalid private-method privacy origin.');
  for(const [key,expected] of Object.entries(PRIVATE_METHOD_ORIGIN))if(value[key]!==expected)throw new TypeError('Invalid private-method privacy origin.');
  return clone(PRIVATE_METHOD_ORIGIN);
}
function originFrom(record){
  if(!plain(record)||!Object.hasOwn(record,'privacyOrigin'))return null;
  return privateOrigin(record.privacyOrigin);
}
function validatePrivateOrigins(state){
  for(const bucket of [state.queries,state.teachings])for(const record of Object.values(bucket||{}))originFrom(record);
  return state;
}
function hasBlockedPrivateOrigin(state){
  for(const bucket of [state.queries,state.teachings])for(const record of Object.values(bucket||{}))if(originFrom(record))return true;
  return false;
}
function mergeBucket(current,incoming){
  const out={...current};
  for(const [key,value] of Object.entries(incoming||{})){
    const next=clone(value),priorOrigin=originFrom(out[key]),nextOrigin=originFrom(next);
    if(priorOrigin&&!nextOrigin&&plain(next))next.privacyOrigin=priorOrigin;
    out[key]=next;
  }
  return out;
}
function notify(state){
  if(typeof globalThis.dispatchEvent!=='function'||typeof globalThis.CustomEvent!=='function')return;
  try{globalThis.dispatchEvent(new CustomEvent('space-lens-memory-changed',{detail:{updatedAt:state.updatedAt}}));}catch{}
}
function load(){
  const s=storage();if(!s)return clone(volatile);
  try{const x=JSON.parse(s.getItem(KEY)||'null');if(valid(x)){volatile=x;return clone(x);}}catch{}
  return clone(volatile);
}
function save(state){
  state.updatedAt=now();volatile=clone(state);const s=storage();if(s){try{s.setItem(KEY,JSON.stringify(state));}catch{}}
  notify(state);return clone(state);
}
function trimQueries(state){
  const rows=Object.entries(state.queries).sort((a,b)=>String(b[1].lastAsked||'').localeCompare(String(a[1].lastAsked||'')));
  state.queries=Object.fromEntries(rows.slice(0,MAX_QUERIES));
  state.selections=(state.selections||[]).slice(-MAX_SELECTIONS);
}
function record(question,result={}){
  const key=normalize(question);if(!key)return null;const state=load(),prior=state.queries[key]||{question:String(question).trim(),count:0,helpful:0,notHelpful:0};
  prior.question=String(question).trim();prior.count=(prior.count||0)+1;prior.lastAsked=now();
  if(result.answer)prior.lastAnswer=String(result.answer).slice(0,4000);
  if(result.confidence)prior.lastConfidence=String(result.confidence);
  if(Array.isArray(result.sources))prior.lastSources=result.sources.map(s=>s.id).filter(Boolean).slice(0,12);
  const requestedOrigin=Object.hasOwn(result,'privacyOrigin')?privateOrigin(result.privacyOrigin):null;
  const inheritedOrigin=originFrom(state.teachings[key])||originFrom(prior);
  const origin=requestedOrigin||inheritedOrigin;
  if(origin)prior.privacyOrigin=origin;
  state.queries[key]=prior;trimQueries(state);save(state);return clone(prior);
}
function feedback(question,value){
  const key=normalize(question);if(!key)return null;const state=load(),q=state.queries[key]||{question:String(question).trim(),count:0,helpful:0,notHelpful:0};
  if(value==='helpful')q.helpful=(q.helpful||0)+1;else if(value==='not-helpful')q.notHelpful=(q.notHelpful||0)+1;
  q.lastFeedback=value;q.lastFeedbackAt=now();state.queries[key]=q;return save(state).queries[key];
}
function teach(question,answer,note='',options={}){
  const key=normalize(question),text=String(answer??'').trim();if(!key||!text)throw new TypeError('Question and taught answer are required.');
  if(options==null)options={};if(!plain(options))throw new TypeError('Teaching options must be an object.');
  const state=load(),existing=state.teachings[key];
  const requestedOrigin=Object.hasOwn(options,'privacyOrigin')?privateOrigin(options.privacyOrigin):null;
  const origin=requestedOrigin||originFrom(existing);
  const teaching={question:String(question).trim(),answer:text.slice(0,12000),note:String(note||'').trim().slice(0,2000),createdAt:existing?.createdAt||now(),updatedAt:now(),authority:'LOCAL_USER_TAUGHT'};
  if(origin)teaching.privacyOrigin=origin;
  state.teachings[key]=teaching;
  return save(state).teachings[key];
}
function forgetTeaching(question){const key=normalize(question),state=load();delete state.teachings[key];save(state);}
function recall(question){const key=normalize(question);if(!key)return null;const state=load(),t=state.teachings[key];if(t)return clone({kind:'teaching',...t});const q=state.queries[key];if(q?.helpful>q?.notHelpful&&q.lastAnswer)return clone({kind:'helpful-history',...q});return null;}
function learnSelection(question,sourceId){
  const key=normalize(question),id=String(sourceId||'').trim();if(!key||!id)return;const state=load();state.sourceVotes[id]=(state.sourceVotes[id]||0)+1;state.selections.push({query:key,sourceId:id,at:now()});trimQueries(state);save(state);
}
function sourceBoost(sourceId){return Number(load().sourceVotes[String(sourceId||'')]||0);}
function rememberAlias(alias,target){const a=normalize(alias),t=String(target||'').trim();if(!a||!t)return;const state=load();state.aliases[a]=t;save(state);}
function aliasFor(query){return load().aliases[normalize(query)]||null;}
function expand(question){
  const key=normalize(question);if(!key)return[];const state=load(),out=[];
  if(state.aliases[key])out.push(state.aliases[key]);
  const tokens=new Set(key.split(' '));
  for(const [past,meta] of Object.entries(state.queries)){
    if(past===key)continue;const p=new Set(past.split(' '));let overlap=0;for(const t of tokens)if(p.has(t))overlap++;
    if(overlap>=Math.min(2,tokens.size)&&meta.helpful>=meta.notHelpful)out.push(meta.question||past);
    if(out.length>=5)break;
  }
  return [...new Set(out)].slice(0,5);
}
function stats(){const s=load();return{schema:SCHEMA,queries:Object.keys(s.queries).length,teachings:Object.keys(s.teachings).length,aliases:Object.keys(s.aliases).length,rememberedSources:Object.keys(s.sourceVotes).length,selections:s.selections.length,updatedAt:s.updatedAt,persistent:!!storage()};}
function exportText(){
  const state=load();validatePrivateOrigins(state);
  if(hasBlockedPrivateOrigin(state))throw new Error('Private-origin memory requires independent re-grounding before export.');
  return JSON.stringify(state,null,2);
}
function importText(text,{merge=true}={}){
  const incoming=JSON.parse(String(text));if(!valid(incoming))throw new TypeError('Invalid Space Lens memory file.');
  validatePrivateOrigins(incoming);
  if(!merge)return save(incoming);
  const state=load();
  state.queries=mergeBucket(state.queries,incoming.queries);state.teachings=mergeBucket(state.teachings,incoming.teachings);state.aliases={...state.aliases,...incoming.aliases};
  for(const[id,n]of Object.entries(incoming.sourceVotes||{}))state.sourceVotes[id]=Math.max(Number(state.sourceVotes[id]||0),Number(n||0));
  state.selections=[...(state.selections||[]),...(incoming.selections||[])];trimQueries(state);return save(state);
}
function clear(){volatile=fresh();const s=storage();if(s){try{s.removeItem(KEY);}catch{}}notify(volatile);return stats();}

const API=Object.freeze({schema:SCHEMA,normalize,record,feedback,teach,forgetTeaching,recall,learnSelection,sourceBoost,rememberAlias,aliasFor,expand,stats,exportText,importText,clear});
globalThis.SpaceLensMemory=API;

// Space Lens local search is a browser-local tool layered on this memory store.
// Loading is explicit and local; no external search service is contacted.
if(typeof document!=='undefined'&&document.createElement&&!globalThis.SpaceLensLocalSearch&&!document.querySelector?.('script[data-space-lens-local-search]')){
  const script=document.createElement('script');script.src='./space-lens-local-search.js';script.defer=true;script.dataset.spaceLensLocalSearch='true';document.head?.appendChild(script);
}
})();