(()=>{
'use strict';

const STOP=new Set(['a','an','and','are','as','at','be','been','but','by','can','do','does','for','from','has','have','how','i','if','in','is','it','of','on','or','our','that','the','their','this','to','was','we','were','what','when','where','which','who','why','will','with','you','your']);
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9:_-]+/g,' ').trim();
const tokens=s=>norm(s).split(/\s+/).filter(t=>t&&(!STOP.has(t)||t.length>2));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
const api=()=>globalThis.Conscience64API||null;
const memory=()=>globalThis.SpaceLensMemory||null;
let INDEX={docs:[],df:new Map(),avgLen:1,builtAt:null};
let UI_STATE={query:'',type:'all',offset:0,limit:8};

function weightedTerms(parts){
  const tf=new Map(),add=(text,weight)=>{for(const t of tokens(text))tf.set(t,(tf.get(t)||0)+weight);};
  add(parts.title,6);add(parts.id,5);add(parts.tags,3);add(parts.body,1);add(parts.provenance,1.5);
  return tf;
}
function projectDoc(p){
  const body=[p.I,p.R,p.P,p.O,p.highlight,p.lowlight,p.claimCeiling,p.checks?.assumption,p.checks?.test,p.checks?.unknown].filter(Boolean).join(' ');
  return{id:`project:${p.id}`,refId:p.id,title:p.name||p.id,type:'project',authority:'PROJECT_RECORD',body,provenance:p.path||'',tags:`${p.status||''} project research`,raw:p};
}
function recordDoc(r){
  const body=[r.description,r.basis,r.microdata?.properties?.description,r.source,r.target,r.relation].filter(Boolean).join(' ');
  return{id:r.uoid||r.logicalId,refId:r.uoid||r.logicalId,title:r.label||r.logicalId||r.uoid||'Untitled record',type:'record',authority:'PUBLIC_RECORD',body,provenance:r.provenance||r.basis||'',tags:[r.objectType,r.kind,r.domain,r.category,r.time_layer,r.authority,...(r.nonstem_tags||[])].filter(Boolean).join(' '),raw:r};
}
function learnedDocs(){
  const m=memory();if(!m?.exportText)return[];let state;try{state=JSON.parse(m.exportText());}catch{return[];}
  const out=[];
  for(const [key,t] of Object.entries(state.teachings||{}))out.push({id:`learned:${key}`,refId:key,title:t.question||key,type:'learned',authority:'LOCAL_USER_TAUGHT',body:t.answer||'',provenance:t.note||'Local browser teaching',tags:'learned teaching local memory',raw:t});
  for(const [key,q] of Object.entries(state.queries||{})){
    if(!q.lastAnswer||Number(q.helpful||0)<=Number(q.notHelpful||0))continue;
    out.push({id:`history:${key}`,refId:key,title:q.question||key,type:'learned',authority:'LOCAL_HELPFUL_HISTORY',body:q.lastAnswer,provenance:'Helpful local search history',tags:'learned history local memory',raw:q});
  }
  return out;
}
function rebuild(){
  const a=api();if(!a)return INDEX;
  const docs=[...(a.all?.()||[]).map(recordDoc),...(a.projects?.list?.().projects||[]).map(projectDoc),...learnedDocs()];
  const df=new Map(),prepared=[];
  for(const d of docs){const tf=weightedTerms(d),seen=new Set(tf.keys());for(const t of seen)df.set(t,(df.get(t)||0)+1);const length=[...tf.values()].reduce((x,y)=>x+y,0)||1;prepared.push({...d,_tf:tf,_len:length,_hay:norm([d.title,d.body,d.tags,d.provenance,d.id].join(' '))});}
  const avgLen=prepared.length?prepared.reduce((s,d)=>s+d._len,0)/prepared.length:1;
  INDEX={docs:prepared,df,avgLen,builtAt:new Date().toISOString()};
  return INDEX;
}
function ensureIndex(){if(!INDEX.docs.length)return rebuild();return INDEX;}
function idf(term,N,df){return Math.log(1+(N-(df||0)+.5)/((df||0)+.5));}
function scoreDoc(d,qTokens,qNorm,index){
  const N=index.docs.length||1,k1=1.35,b=.72;let score=0;
  for(const t of qTokens){const tf=d._tf.get(t)||0;if(!tf)continue;const denom=tf+k1*(1-b+b*d._len/index.avgLen);score+=idf(t,N,index.df.get(t))*(tf*(k1+1))/denom;}
  const title=norm(d.title),id=norm(d.id);
  if(qNorm&&title===qNorm)score+=28;
  else if(qNorm&&title.includes(qNorm))score+=14;
  if(qNorm&&id.includes(qNorm))score+=10;
  if(qNorm&&d._hay.includes(qNorm))score+=7;
  // Learned preference may rerank a real lexical match, but must never manufacture one.
  if(score<=0)return 0;
  const boost=memory()?.sourceBoost?.(d.refId)||memory()?.sourceBoost?.(d.id)||0;score+=Math.min(12,Number(boost||0)*1.75);
  if(d.type==='learned')score+=1.5;
  return score;
}
function snippet(d,qTokens,max=220){
  const text=clean(d.body||d.provenance||d.title);if(!text)return'';
  const lower=text.toLowerCase();let at=-1;for(const t of qTokens){const i=lower.indexOf(t.toLowerCase());if(i>=0&&(at<0||i<at))at=i;}
  if(at<0)return text.length<=max?text:text.slice(0,max-1)+'…';
  const start=Math.max(0,at-Math.floor(max*.32)),end=Math.min(text.length,start+max);return(start>0?'…':'')+text.slice(start,end).trim()+(end<text.length?'…':'');
}
function search(query,{type='all',offset=0,limit=8}={}){
  const index=ensureIndex(),q=clean(query),qNorm=norm(q),qTokens=tokens(q);offset=Math.max(0,Number(offset)||0);limit=Math.min(50,Math.max(1,Number(limit)||8));
  if(!q)return{query:q,type,total:0,offset,limit,results:[],stats:stats()};
  let rows=index.docs;if(type!=='all')rows=rows.filter(d=>d.type===type);
  const ranked=[];for(const d of rows){const score=scoreDoc(d,qTokens,qNorm,index);if(score>0)ranked.push({d,score});}
  ranked.sort((a,b)=>b.score-a.score||a.d.title.localeCompare(b.d.title));
  const results=ranked.slice(offset,offset+limit).map(({d,score})=>({id:d.id,refId:d.refId,title:d.title,type:d.type,authority:d.authority,score:Number(score.toFixed(4)),snippet:snippet(d,qTokens),provenance:d.provenance}));
  memory()?.record?.(q,{answer:`Local search returned ${ranked.length} result${ranked.length===1?'':'s'}.`,confidence:'local-search',sources:results.slice(0,6).map(r=>({id:r.refId}))});
  return{query:q,type,total:ranked.length,offset,limit,results,hasPrevious:offset>0,hasNext:offset+limit<ranked.length,stats:stats()};
}
function suggestions(prefix='',limit=8){
  const p=norm(prefix),out=[];for(const d of ensureIndex().docs){if(!p||norm(d.title).includes(p))out.push({title:d.title,type:d.type,id:d.id});if(out.length>=limit)break;}return out;
}
function stats(){const idx=ensureIndex(),counts={record:0,project:0,learned:0};for(const d of idx.docs)counts[d.type]=(counts[d.type]||0)+1;return{total:idx.docs.length,counts,builtAt:idx.builtAt,local:true};}
function inspect(result,query=''){
  const a=api();if(!a||!result)return null;memory()?.learnSelection?.(query,result.refId||result.id);
  if(result.type==='project'){const out=a.projects.reflow(result.refId);a.irpo({I:result.refId,R:{source:'Local Search selection'},P:{action:'projects.reflow'},O:out});return out;}
  if(result.type==='record'){const out=a.get(result.refId);a.irpo({I:result.refId,R:{source:'Local Search selection'},P:{action:'get'},O:out});return out;}
  return clone(result);
}

function ensureUI(){
  if(typeof document==='undefined'||document.getElementById('space-local-search'))return;
  const actions=document.querySelector('.lens-actions');
  if(actions&&!actions.querySelector('[data-lens-action="local-search"]')){const b=document.createElement('button');b.type='button';b.dataset.lensAction='local-search';b.textContent='Local Search';actions.prepend(b);}
  const readout=document.querySelector('.space-readout');if(!readout)return;
  const style=document.createElement('style');style.textContent=`
    .local-search{margin:.8rem 0 1rem;padding:1rem;border:1px solid #405071;border-radius:.85rem;background:rgba(7,11,22,.96)}.local-search[hidden]{display:none}.local-search-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;flex-wrap:wrap}.local-search h3{margin:0;font:700 1rem ui-sans-serif,system-ui}.local-search-note{margin:.2rem 0;color:#9eabc4;font-size:.78rem}.local-search-form{display:grid;grid-template-columns:minmax(12rem,1fr) auto auto;gap:.5rem;margin:.8rem 0}.local-search-form input,.local-search-form select{min-width:0;border:1px solid #405071;background:#080d19;color:#eef4ff;border-radius:.5rem;padding:.65rem}.local-search-form button,.local-search-nav button,.local-result button{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.55rem .7rem;cursor:pointer}.local-search-form button:focus-visible,.local-search-nav button:focus-visible,.local-result button:focus-visible,.local-search-form input:focus-visible,.local-search-form select:focus-visible{outline:3px solid #8dd8ff;outline-offset:2px}.local-search-summary{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;color:#b9c4d8;font-size:.78rem}.local-results{display:grid;gap:.65rem;margin-top:.7rem}.local-result{padding:.8rem .85rem;border:1px solid #26314b;border-radius:.65rem;background:rgba(17,26,43,.72)}.local-result-top{display:flex;justify-content:space-between;gap:.75rem;align-items:start}.local-result h4{margin:0;font:700 .95rem ui-sans-serif,system-ui}.local-result-meta{display:flex;gap:.35rem;flex-wrap:wrap;margin:.3rem 0}.local-badge{display:inline-block;border:1px solid #405071;border-radius:999px;padding:.15rem .45rem;color:#cbd6eb;font-size:.68rem}.local-result p{margin:.45rem 0;color:#c7d1e4;font:400 .84rem/1.5 ui-sans-serif,system-ui}.local-result small{color:#8795af}.local-result-actions{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.55rem}.local-search-nav{display:flex;justify-content:space-between;align-items:center;gap:.6rem;margin-top:.75rem}.local-search-close{border:0;background:transparent;color:#a9e9db;cursor:pointer}@media(max-width:640px){.local-search-form{grid-template-columns:1fr}.local-result-top{display:block}}
  `;document.head.appendChild(style);
  const panel=document.createElement('section');panel.id='space-local-search';panel.className='local-search';panel.hidden=true;panel.innerHTML=`<div class="local-search-head"><div><h3>Local Search</h3><p class="local-search-note">On-device index of public Conscience64 records, project records, and your learned browser memory. No network search is required.</p></div><button type="button" class="local-search-close" id="local-search-close">Close</button></div><form id="local-search-form" class="local-search-form" role="search"><label for="local-search-input" style="position:absolute;left:-10000px">Search local Conscience64 index</label><input id="local-search-input" type="search" placeholder="Search the local index…"><select id="local-search-type" aria-label="Result type"><option value="all">All sources</option><option value="record">Public records</option><option value="project">Projects</option><option value="learned">Learned locally</option></select><button type="submit">Search local</button></form><div class="local-search-summary"><span id="local-search-count">Index ready.</span><button type="button" id="local-search-rebuild" class="local-search-close">Rebuild index</button></div><div id="local-search-results" class="local-results"></div><div class="local-search-nav"><button type="button" id="local-search-prev">Previous</button><span id="local-search-page" aria-live="polite"></span><button type="button" id="local-search-next">Next</button></div>`;
  readout.appendChild(panel);
}
function render(out){
  const container=document.getElementById('local-search-results'),count=document.getElementById('local-search-count'),page=document.getElementById('local-search-page'),prev=document.getElementById('local-search-prev'),next=document.getElementById('local-search-next');if(!container)return;
  container.replaceChildren();count.textContent=`${out.total} local result${out.total===1?'':'s'} · ${out.stats.counts.record} records · ${out.stats.counts.project} projects · ${out.stats.counts.learned} learned`;
  if(!out.results.length){const p=document.createElement('p');p.textContent='No local matches. Try fewer terms, switch source type, or teach Space Lens a new local answer.';container.appendChild(p);}
  for(const r of out.results){const card=document.createElement('article');card.className='local-result';card.innerHTML=`<div class="local-result-top"><div><h4>${esc(r.title)}</h4><div class="local-result-meta"><span class="local-badge">${esc(r.type)}</span><span class="local-badge">${esc(r.authority)}</span><span class="local-badge">score ${r.score.toFixed(2)}</span></div></div></div><p>${esc(r.snippet||'No snippet available.')}</p><small>${esc(r.provenance||r.refId||r.id)}</small><div class="local-result-actions"><button type="button" data-local-inspect="${esc(r.id)}">Inspect</button><button type="button" data-local-ask="${esc(r.title)}">Ask about this</button></div>`;card._localResult=r;container.appendChild(card);}
  const first=out.total?out.offset+1:0,last=Math.min(out.total,out.offset+out.limit);page.textContent=out.total?`${first}–${last} of ${out.total}`:'0 results';prev.disabled=!out.hasPrevious;next.disabled=!out.hasNext;
}
function runSearch({resetOffset=false}={}){
  const input=document.getElementById('local-search-input'),type=document.getElementById('local-search-type');if(!input)return null;if(resetOffset)UI_STATE.offset=0;UI_STATE.query=input.value.trim();UI_STATE.type=type?.value||'all';const out=search(UI_STATE.query,{type:UI_STATE.type,offset:UI_STATE.offset,limit:UI_STATE.limit});render(out);return out;
}
function open(query=''){
  ensureUI();rebuild();const panel=document.getElementById('space-local-search');if(!panel)return null;panel.hidden=false;const input=document.getElementById('local-search-input');if(query)input.value=query;else if(!input.value)input.value=document.getElementById('space-search')?.value||'';const out=runSearch({resetOffset:true});input.focus();return out;
}
function install(){
  ensureUI();rebuild();
  document.addEventListener('click',e=>{
    const local=e.target.closest?.('[data-lens-action="local-search"]');if(local){e.preventDefault();open();return;}
    if(e.target.id==='local-search-close'){document.getElementById('space-local-search').hidden=true;return;}
    if(e.target.id==='local-search-rebuild'){rebuild();runSearch({resetOffset:true});return;}
    if(e.target.id==='local-search-prev'){UI_STATE.offset=Math.max(0,UI_STATE.offset-UI_STATE.limit);runSearch();return;}
    if(e.target.id==='local-search-next'){UI_STATE.offset+=UI_STATE.limit;runSearch();return;}
    const inspectButton=e.target.closest?.('[data-local-inspect]');if(inspectButton){const card=inspectButton.closest('.local-result'),r=card?._localResult;if(r)inspect(r,UI_STATE.query);return;}
    const askButton=e.target.closest?.('[data-local-ask]');if(askButton){const q=askButton.dataset.localAsk||'';const main=document.getElementById('space-search'),form=document.getElementById('space-search-form');if(main)main.value=`What is ${q}?`;form?.requestSubmit?.();return;}
  });
  document.getElementById('local-search-form')?.addEventListener('submit',e=>{e.preventDefault();runSearch({resetOffset:true});});
  document.getElementById('local-search-type')?.addEventListener('change',()=>runSearch({resetOffset:true}));
  addEventListener('space-lens-memory-changed',()=>rebuild());
}

const API=Object.freeze({version:'1.0.1',rebuild,refresh:rebuild,search,suggestions,stats,inspect,open});
globalThis.SpaceLensLocalSearch=API;
if(typeof document!=='undefined'){addEventListener('conscience64-ready',install,{once:true});if(api())install();}
})();
