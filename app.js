const SPACE_UOID='uoid:sha256:aa3994488ddfcf5f0d828e679b598dd905d4d1fe958c97fd6303e357171d6599';
const IRPO_HISTORY=[];

const clone=x=>x==null?null:structuredClone(x);
const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);

function tokenize(s){
  return String(s??'').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .split(/[^a-z0-9:_-]+/).filter(Boolean);
}
function b64bytes(s){
  const bin=atob(s),out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
async function gunzipText(b64){
  if(!('DecompressionStream' in globalThis)) throw new Error('Current browser required: DecompressionStream is unavailable.');
  return new Response(new Blob([b64bytes(b64)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
async function loadSpace(){
  const manifest=await fetch('./data-manifest.json',{cache:'no-store'}).then(r=>{
    if(!r.ok) throw new Error('Failed to load data-manifest.json'); return r.json();
  });
  const shards=(manifest.shards||[]).filter(s=>s.state==='PAYLOAD');
  const chunks=await Promise.all(shards.map(async s=>{
    const r=await fetch(`./${s.path}`,{cache:'no-store'});
    if(!r.ok) throw new Error(`Failed to load ${s.path}`);
    const text=await r.text();
    if(new TextEncoder().encode(text).byteLength!==s.bytes) throw new Error(`Transport length mismatch: ${s.path}`);
    return text;
  }));
  const records=JSON.parse(await gunzipText(chunks.join('')));
  if(!Array.isArray(records)) throw new Error('Space payload is not an object array.');
  return {manifest,shards,records};
}
async function loadProjects(){
  const registry=await fetch('./research/projects/projects.json',{cache:'no-store'}).then(r=>{
    if(!r.ok) throw new Error('Failed to load research/projects/projects.json'); return r.json();
  });
  if(registry?.schema!=='conscience64/research-project-registry/v1'||!Array.isArray(registry.projects))
    throw new Error('Invalid research project registry');
  return registry;
}

const [SPACE_BUNDLE,PROJECT_REGISTRY]=await Promise.all([loadSpace(),loadProjects()]);
const {manifest:TRANSPORT,shards:SHARDS,records:SPACE}=SPACE_BUNDLE;
const PROJECTS=PROJECT_REGISTRY.projects;
const PROJECT_BY_ID=new Map(PROJECTS.map(p=>[p.id,p]));
const byUoid=new Map(SPACE.map(x=>[x.uoid,x]));
const byLogicalId=new Map(SPACE.filter(x=>x.logicalId).map(x=>[x.logicalId,x]));
function resolve(id){return byUoid.get(id)||byLogicalId.get(id)||null;}
function flattenRecord(r){
  return [r.uoid,r.objectType,r.logicalId,r.label,r.description,r.kind,r.domain,r.category,
    r.time_layer,r.authority,r.provenance,r.relation,r.source,r.target,r.basis,
    ...(r.nonstem_tags||[]),JSON.stringify(r.microdata?.properties||{})]
    .filter(Boolean).join(' ').toLowerCase();
}
const SEARCH_DOCS=SPACE.map((r,index)=>{const text=flattenRecord(r);return{index,r,text,tokens:new Set(tokenize(text))};});

function simpleSearch(query,options={}){
  const q=String(query??'').trim().toLowerCase(),qt=tokenize(q);
  if(!q) return {query:q,total:0,results:[],spaceUoid:SPACE_UOID};
  const ranked=[];
  for(const d of SEARCH_DOCS){
    let score=0;
    if(d.text.includes(q)) score+=12;
    const label=String(d.r.label||'').toLowerCase();
    if(label===q) score+=25; else if(label.startsWith(q)) score+=15; else if(label.includes(q)) score+=9;
    for(const t of qt){if(d.tokens.has(t))score+=4;else if([...d.tokens].some(x=>x.startsWith(t)))score+=1;}
    if(score>0) ranked.push([d.r,score]);
  }
  ranked.sort((a,b)=>b[1]-a[1]||(b[0].degree||0)-(a[0].degree||0)||String(a[0].label||'').localeCompare(String(b[0].label||'')));
  const offset=Math.max(0,options.offset||0),limit=Math.min(500,Math.max(1,options.limit||25));
  return {query:q,total:ranked.length,offset,limit,spaceUoid:SPACE_UOID,
    results:ranked.slice(offset,offset+limit).map(([r,s])=>({...clone(r),searchScore:s}))};
}
function intersects(v,e){const a=arr(v).map(String),b=arr(e).map(String);return !b.length||b.some(x=>a.includes(x));}
function advancedSearch(spec={}){
  // Supplied-but-unresolved is not omitted: never broaden an evidence scope.
  const endpoints={};
  for(const key of ['from','to']){
    if(!Object.hasOwn(spec,key))continue;
    if(typeof spec[key]!=='string'||!spec[key].trim())throw new TypeError(`INVALID_REFERENCE: ${key}`);
    const obj=resolve(spec[key]);
    if(!obj)throw new Error(`UNRESOLVED_REFERENCE: ${key}`);
    endpoints[key]=obj.uoid;
  }
  const text=String(spec.text??'').trim().toLowerCase(),kinds=arr(spec.kind||spec.kinds),types=arr(spec.objectType||spec.objectTypes),
    times=arr(spec.timeLayer||spec.timeLayers),auths=arr(spec.authority||spec.authorities),domains=arr(spec.domain||spec.domains),
    rels=arr(spec.relation||spec.relations),ids=arr(spec.logicalId||spec.logicalIds),prefix=String(spec.uoidPrefix||''),
    prov=String(spec.provenance||'').toLowerCase(),min=spec.minDegree==null?null:Number(spec.minDegree),
    max=spec.maxDegree==null?null:Number(spec.maxDegree),has=arr(spec.hasFields),eq=spec.equals||{};
  let rows=SEARCH_DOCS.filter(d=>{
    const r=d.r;
    if(text&&!d.text.includes(text)&&!tokenize(text).every(t=>d.tokens.has(t)))return false;
    if(kinds.length&&!intersects(r.kind,kinds))return false;
    if(types.length&&!intersects(r.objectType,types))return false;
    if(times.length&&!intersects(r.time_layer,times))return false;
    if(auths.length&&!intersects(r.authority,auths))return false;
    if(domains.length&&!intersects(r.domain,domains))return false;
    if(rels.length&&!intersects(r.relation,rels))return false;
    if(ids.length&&!intersects(r.logicalId,ids))return false;
    if(prefix&&!r.uoid.startsWith(prefix))return false;
    if(prov&&!String(r.provenance||r.basis||'').toLowerCase().includes(prov))return false;
    if(min!==null&&Number(r.degree||0)<min)return false;
    if(max!==null&&Number(r.degree||0)>max)return false;
    if(has.some(f=>r[f]==null))return false;
    for(const[k,v]of Object.entries(eq)){const rv=k.split('.').reduce((o,p)=>o?.[p],r);if(JSON.stringify(rv)!==JSON.stringify(v))return false;}
    return true;
  }).map(d=>d.r);
  if(Object.keys(endpoints).length){
    const {from,to}=endpoints;
    rows=rows.filter(r=>r.objectType==='research-edge'&&(!from||r.sourceUoid===from)&&(!to||r.targetUoid===to));
  }
  const sortBy=spec.sortBy||'degree',dir=spec.sortDir==='asc'?1:-1;
  rows.sort((a,b)=>sortBy==='label'?dir*String(a.label||'').localeCompare(String(b.label||'')):
    sortBy==='uoid'?dir*String(a.uoid).localeCompare(String(b.uoid)):dir*(Number(a[sortBy]||0)-Number(b[sortBy]||0)));
  const offset=Math.max(0,spec.offset||0),limit=Math.min(1000,Math.max(1,spec.limit||100));
  return {spec:clone(spec),total:rows.length,offset,limit,spaceUoid:SPACE_UOID,results:rows.slice(offset,offset+limit).map(clone)};
}
function relations(id,spec={}){
  const obj=resolve(id);if(!obj)return{object:null,total:0,relations:[]};const uid=obj.uoid;
  let rs=SPACE.filter(r=>r.objectType==='research-edge'&&(r.sourceUoid===uid||r.targetUoid===uid));
  if(spec.direction==='out')rs=rs.filter(r=>r.sourceUoid===uid);if(spec.direction==='in')rs=rs.filter(r=>r.targetUoid===uid);
  if(spec.relation)rs=rs.filter(r=>arr(spec.relation).includes(r.relation));
  return {object:clone(obj),total:rs.length,relations:rs.map(clone)};
}
function traverse(start,spec={}){
  const root=resolve(start);if(!root)return{start:null,nodes:[],edges:[]};
  const depth=Math.max(0,Math.min(8,spec.depth??1)),rf=new Set(arr(spec.relation)),direction=spec.direction||'both',
    seen=new Set([root.uoid]),nodes=[root],edges=[];let frontier=[root.uoid];
  for(let d=0;d<depth;d++){
    const next=[];
    for(const uid of frontier)for(const e of SPACE){
      if(e.objectType!=='research-edge'||(rf.size&&!rf.has(e.relation)))continue;let other=null;
      if(direction!=='in'&&e.sourceUoid===uid)other=e.targetUoid;if(direction!=='out'&&e.targetUoid===uid)other=e.sourceUoid;
      if(!other)continue;edges.push(e);if(!seen.has(other)){seen.add(other);const n=byUoid.get(other);if(n){nodes.push(n);next.push(other);}}
    }
    frontier=next;if(!frontier.length)break;
  }
  return {start:clone(root),nodes:nodes.map(clone),edges:edges.map(clone)};
}
function projectList(spec={}){
  const q=String(spec.text??'').trim().toLowerCase(),statuses=new Set(arr(spec.status||spec.statuses));
  const rows=PROJECTS.filter(p=>{
    if(statuses.size&&!statuses.has(p.status))return false;
    if(q&&!JSON.stringify(p).toLowerCase().includes(q))return false;
    return true;
  });
  return {schema:PROJECT_REGISTRY.schema,total:rows.length,projects:rows.map(clone)};
}
function projectGet(id){return clone(PROJECT_BY_ID.get(String(id))||null);}
function projectReflow(id){
  const p=PROJECT_BY_ID.get(String(id));if(!p)return null;
  return {projectId:p.id,status:p.status,path:p.path,
    I:p.I,
    R:{difference:p.R,checks:clone(p.checks)},
    P:p.P,
    O:{result:p.O,highlight:p.highlight,lowlight:p.lowlight,claimCeiling:p.claimCeiling}};
}
function learnedInvariants(){return clone({
  invariants:PROJECT_REGISTRY.learnedInvariants,
  transformStates:PROJECT_REGISTRY.transformStates,
  evidencePolicy:PROJECT_REGISTRY.evidencePolicy
});}
function projectLessons(spec={}){
  if(!spec||typeof spec!=='object'||Array.isArray(spec))throw new TypeError('INVALID_LESSON_FILTER');
  const allowed=new Set(['date','projectId','evidenceClass','text']);
  for(const [key,value] of Object.entries(spec)){
    if(!allowed.has(key)||typeof value!=='string'||!value.trim())throw new TypeError(`INVALID_LESSON_FILTER: ${key}`);
  }
  if(spec.projectId&&!PROJECT_BY_ID.has(spec.projectId))throw new Error('UNRESOLVED_PROJECT');
  const q=String(spec.text||'').toLowerCase();
  const lessons=(PROJECT_REGISTRY.lessons||[]).filter(x=>
    (!spec.date||x.date===spec.date)&&(!spec.projectId||x.projectIds.includes(spec.projectId))&&
    (!spec.evidenceClass||x.evidenceClass===spec.evidenceClass)&&(!q||JSON.stringify(x).toLowerCase().includes(q)));
  return clone({schema:'conscience64/lessons/v1',registryVersion:PROJECT_REGISTRY.version,
    total:lessons.length,policy:PROJECT_REGISTRY.lessonPolicy,lessons});
}
function generatedMicrodata(r){
  if(!r)return null;if(r.microdata)return clone(r.microdata);
  return {itemScope:true,itemType:'https://schema.org/Thing',itemId:r.uoid,properties:{identifier:r.uoid,name:r.label||r.logicalId||r.uoid,
    description:r.description||r.basis||'',additionalType:r.kind||r.objectType||'Thing',isPartOf:'Conscience64 Search Space'}};
}
function microdata(id){return generatedMicrodata(resolve(id));}
function microdataHTML(id){
  const m=microdata(id);if(!m)return null;const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const props=Object.entries(m.properties||{}).map(([k,v])=>`<meta itemprop="${esc(k)}" content="${esc(typeof v==='string'?v:JSON.stringify(v))}">`).join('');
  return `<article itemscope itemtype="${esc(m.itemType)}" itemid="${esc(m.itemId)}">${props}</article>`;
}
function stats(){
  const byType={},byKind={};for(const r of SPACE){byType[r.objectType]=(byType[r.objectType]||0)+1;if(r.kind)byKind[r.kind]=(byKind[r.kind]||0)+1;}
  return {spaceUoid:SPACE_UOID,total:SPACE.length,byType,byKind,
    projects:{count:PROJECTS.length,registryVersion:PROJECT_REGISTRY.version,learnedInvariantCount:(PROJECT_REGISTRY.learnedInvariants||[]).length,lessonCount:(PROJECT_REGISTRY.lessons||[]).length},
    transport:{encoding:TRANSPORT.transportEncoding,payloadShards:SHARDS.length,
    reservedShards:(TRANSPORT.shards||[]).filter(s=>s.state!=='PAYLOAD').length}};
}
function updateIRPO(x){
  const safe=v=>typeof v==='string'?v:JSON.stringify(v,null,2);
  for(const k of['I','R','P','O']){const el=document.getElementById(`irpo-${k.toLowerCase()}`);if(el)el.textContent=safe(x[k]);}
}
function irpo(input={}){
  const I=input.I??input.input??null,R=input.R??input.reason??input.relation??{},P=input.P??input.plan??{action:'search.simple'};let O=input.O??null;
  const action=typeof P==='string'?P:(P.action||'search.simple');
  if(O==null){
    if(action==='search.simple')O=simpleSearch(typeof I==='string'?I:(I?.query||''),P.options||{});
    else if(action==='search.advanced')O=advancedSearch({...((typeof I==='object'&&I)?I:{}),...(R||{}),...(P.spec||{})});
    else if(action==='get')O=clone(resolve(typeof I==='string'?I:I?.id));
    else if(action==='relations')O=relations(typeof I==='string'?I:I?.id,R||{});
    else if(action==='traverse')O=traverse(typeof I==='string'?I:I?.id,R||{});
    else if(action==='projects.list')O=projectList(P.spec||((typeof I==='object'&&I)?I:{}));
    else if(action==='projects.get')O=projectGet(typeof I==='string'?I:I?.id);
    else if(action==='projects.reflow')O=projectReflow(typeof I==='string'?I:I?.id);
    else if(action==='projects.invariants')O=learnedInvariants();
    else if(action==='projects.lessons')O=projectLessons(P.spec||((typeof I==='object'&&I)?I:{}));
    else O={status:'NO_EXECUTOR',message:`Unknown P.action: ${action}`};
  }
  const rec={I,R,P,O,at:new Date().toISOString(),spaceUoid:SPACE_UOID};IRPO_HISTORY.push(rec);if(IRPO_HISTORY.length>512)IRPO_HISTORY.shift();updateIRPO(rec);return clone(rec);
}
const API=Object.freeze({
  version:'1.3.0',spaceUoid:SPACE_UOID,
  search:Object.freeze({simple:simpleSearch,advanced:advancedSearch}),get:id=>clone(resolve(id)),relations,traverse,microdata,microdataHTML,irpo,
  projects:Object.freeze({list:projectList,get:projectGet,reflow:projectReflow,invariants:learnedInvariants,lessons:projectLessons}),
  history:()=>clone(IRPO_HISTORY),stats,all:()=>SPACE.map(clone),
  help:()=>({simple:'Conscience64API.search.simple("physics black hole", {limit:20})',advanced:'Conscience64API.search.advanced({text:"language", minDegree:5})',
    get:'Conscience64API.get("project:physics")',relations:'Conscience64API.relations("project:physics", {direction:"out"})',
    traverse:'Conscience64API.traverse("project:orbit", {depth:2})',microdata:'Conscience64API.microdata("project:orbit")',
    projects:'Conscience64API.projects.list(); Conscience64API.projects.reflow("historical-recovery")',
    invariants:'Conscience64API.projects.invariants()',
    lessons:'Conscience64API.projects.lessons({date:"2026-09-13"})',
    irpo:'Conscience64API.irpo({I:"historical-recovery",R:{},P:{action:"projects.reflow"}})'})
});
globalThis.Conscience64API=API;
addEventListener('message',async event=>{
  const m=event.data;if(!m||m.type!=='conscience64.api'||!m.id)return;const reply={type:'conscience64.api.result',id:m.id,ok:true,result:null};
  try{const args=Array.isArray(m.args)?m.args:[],route={'search.simple':()=>simpleSearch(...args),'search.advanced':()=>advancedSearch(...args),'get':()=>API.get(...args),
    'relations':()=>relations(...args),'traverse':()=>traverse(...args),'microdata':()=>microdata(...args),'irpo':()=>irpo(...args),'stats':()=>stats(),
    'projects.list':()=>projectList(...args),'projects.get':()=>projectGet(...args),'projects.reflow':()=>projectReflow(...args),'projects.invariants':()=>learnedInvariants(),'projects.lessons':()=>projectLessons(...args)}[String(m.method||'')];
    if(!route)throw new Error(`Unknown API method: ${m.method}`);reply.result=await route();}catch(e){reply.ok=false;reply.error=String(e?.message||e);}
  event.source?.postMessage(reply,'*');
});
function draw(){
  const c=document.getElementById('space'),x=c?.getContext('2d');if(!x)return;const pts=SPACE.filter(r=>r.objectType==='research-node').slice(0,140),
    seed=[...new Date().toISOString().slice(0,10)].reduce((a,ch)=>Math.imul(a^ch.charCodeAt(0),16777619)>>>0,2166136261),
    reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now){const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(c.clientWidth*d)),h=Math.max(2,Math.floor(c.clientHeight*d));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const m=Math.min(w,h),cx=w/2,cy=h/2,t=reduced?0:now/1000;x.fillStyle='#05070e';x.fillRect(0,0,w,h);
    const g=x.createRadialGradient(cx,cy,0,cx,cy,m*.13);g.addColorStop(0,'#000');g.addColorStop(.7,'#070710');g.addColorStop(1,'#5b3f72');x.fillStyle=g;x.beginPath();x.arc(cx,cy,m*.12,0,Math.PI*2);x.fill();
    pts.forEach((r,i)=>{const hsh=parseInt(r.uoid.slice(-8),16)>>>0,radius=.18+((hsh%1000)/1000)*.28,speed=.015+((hsh>>>8)%100)/8000,phase=((hsh^seed)%6283)/1000+t*speed*((i%2)?1:-1),px=cx+Math.cos(phase)*radius*m,py=cy+Math.sin(phase)*radius*m*.58;x.fillStyle=i%3===0?'#8dd8ff':i%3===1?'#ffd486':'#c7ffac';x.globalAlpha=.55;x.beginPath();x.arc(px,py,Math.max(1,m*.0025),0,Math.PI*2);x.fill();});x.globalAlpha=1;requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
}
updateIRPO({I:`Searchable privacy-safe space: ${SPACE.length} universal objects plus ${PROJECTS.length} structured project records.`,
  R:{difference:'Objects retain UOIDs and searchable relations; projects retain claim ceilings, failures, and unresolved remainder.',checks:{assumption:'Related material is not automatically evidence.',test:'Use exact identity, provenance, ablation/replication, and project-specific checks.',unknown:'Unresolved project remainder remains explicit.'}},
  P:{action:'API_ONLY',available:['search.simple','search.advanced','get','relations','traverse','microdata','irpo','projects.list','projects.get','projects.reflow','projects.invariants','projects.lessons']},O:stats()});
draw();dispatchEvent(new CustomEvent('conscience64-ready',{detail:stats()}));
