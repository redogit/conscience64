(()=>{
'use strict';

const ROLE=Object.freeze({visitor:'Learner',master:'Master',masterKind:'Governance Master',compass:'Compass4D',compassKind:'Navigation Master'});
const DEFAULT_COMPANIONS=Object.freeze(['Conscience64','Library','Operator','Companions']);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const uniq=a=>[...new Set(a.filter(Boolean))];
const tokens=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9:_-]+/).filter(Boolean);
const now=()=>Date.now();
let lastRoute=null,lastOrientation=null,eventsWired=false,observedAnswer=null;

function inferDomains(text){
  const s=String(text||'').toLowerCase(),out=[];
  const tests={history:/history|archive|chronolog|recovery|source/,language:/language|utf|unicode|semantic|translation|speech|voice/,geometry:/geometry|4d|coordinate|topolog|hodge|compass/,models:/model|neural|agent|learning|compression/,human:/human|people|accessib|ethic|help|culture/,research:/research|evidence|claim|experiment|proof|test/,'cross-domain':/cross[- ]?domain|carrier|wave|transform|functional/};
  for(const[k,re]of Object.entries(tests))if(re.test(s))out.push(k);
  return out.length?out:['research'];
}
function inferCarriers(text){
  const s=String(text||'').toLowerCase(),out=['Master','Compass4D','Conscience64'];
  if(/orbit|library|archive|source|history/.test(s))out.push('Library');
  if(/operator|moonshot|experiment|claim|proof|math|physics/.test(s))out.push('Operator');
  if(/companion|cooperat|agent|assist|help/.test(s))out.push('Companions');
  return uniq(out);
}
function route(question){
  const q=String(question||'').trim(),domains=inferDomains(q),carriers=inferCarriers(q);
  lastRoute={role:ROLE.visitor,master:ROLE.master,masterKind:ROLE.masterKind,compass:ROLE.compass,compassKind:ROLE.compassKind,question:q,carriers,domains,at:new Date().toISOString(),rule:'Learner asks; Master governs routing and evidence boundaries; Compass4D is the navigation master; carriers retrieve; evidence rules still govern claims.'};
  dispatchEvent(new CustomEvent('space-master-route',{detail:lastRoute}));
  renderRoute(lastRoute);return structuredClone(lastRoute);
}
function confidenceValue(text){
  const s=String(text||'').toLowerCase();
  if(s.includes('strong project match'))return 1;
  if(s.includes('bounded project match'))return .82;
  if(s.includes('bounded record match'))return .68;
  if(s.includes('learned locally'))return .5;
  if(s.includes('weak'))return .3;
  if(s.includes('unresolved'))return .12;
  return .45;
}
function parameterize({question='',answer='',confidence='',sourceLabels=[],selected=0,helpful=0,events=[]}={}){
  const carriers=inferCarriers(`${question} ${sourceLabels.join(' ')}`),domains=inferDomains(`${question} ${answer} ${sourceLabels.join(' ')}`);
  const recent=(events||[]).filter(e=>now()-Number(e.at||0)<12*60*1000).length;
  const carrierDiversity=clamp((carriers.length-1)/5),domainDiversity=clamp((domains.length-1)/6),evidence=confidenceValue(confidence),selection=clamp(selected/5),helpfulness=clamp(helpful/3),recency=clamp(recent/12);
  const transformIntensity=clamp((tokens(question).filter(t=>/carrier|wave|transform|functional|cross|4d/.test(t)).length+domains.length-1)/7);
  const crossCarrierWave=clamp(.22+.46*carrierDiversity+.18*selection+.14*evidence);
  const crossDomainWave=clamp(.18+.48*domainDiversity+.18*transformIntensity+.16*evidence);
  const crossCarrierDomainWave=clamp(Math.sqrt(crossCarrierWave*crossDomainWave)*(.72+.28*transformIntensity));
  const successAggregation=clamp(.27*evidence+.20*selection+.18*helpfulness+.14*recency+.09*crossCarrierWave+.06*crossDomainWave+.06*crossCarrierDomainWave);
  const vector=Object.freeze({x:carrierDiversity,y:domainDiversity,z:clamp(.55*evidence+.45*transformIntensity),w:recency});
  lastOrientation={schema:'conscience64/compass4d/v1',role:ROLE.compass,roleKind:ROLE.compassKind,vector,functionals:{crossCarrierWave,crossDomainWave,crossCarrierDomainWave,successAggregation,selection,helpfulness,evidence,transformIntensity},carriers,domains,at:new Date().toISOString(),interpretation:'4D runtime orientation vector projected into the UI; not a physical four-dimensional measurement or scientific claim.'};
  dispatchEvent(new CustomEvent('space-compass4d-orientation',{detail:lastOrientation}));
  renderCompass(lastOrientation);return structuredClone(lastOrientation);
}
function currentAnswerOrientation(){
  const question=document.getElementById('space-search')?.value||'';
  const answer=document.getElementById('space-answer-text')?.textContent||'';
  const confidence=[...document.querySelectorAll('#space-answer-meta .space-chip')].map(x=>x.textContent).join(' ');
  const sourceLabels=[...document.querySelectorAll('#space-evidence-list strong')].map(x=>x.textContent);
  const memory=globalThis.SpaceLensMemory?.stats?.()||{};
  const events=globalThis.SpaceLensField?.events?.()||[];
  return parameterize({question,answer,confidence,sourceLabels,selected:Number(memory.selections||0),helpful:events.filter(e=>e.type==='helpful').length,events});
}
function addUI(){
  if(document.getElementById('space-master-runtime'))return;
  const header=document.querySelector('.space-tool-header');if(!header)return;
  const box=document.createElement('div');box.id='space-master-runtime';box.className='space-master-runtime';box.innerHTML=`<div class="space-role-chain" aria-label="Space Lens runtime roles"><strong>Learner</strong><span aria-hidden="true">→</span><strong>Master · governance</strong><span aria-hidden="true">→</span><strong>Compass4D · navigation master</strong></div><div id="space-master-route" class="space-master-route">Master governs every route; all visitors begin as learners. Compass4D is the navigation master.</div><div id="space-compass-readout" class="space-compass-readout">Compass4D: x carrier · y domain · z transform/evidence · w recent time</div>`;header.appendChild(box);
  const style=document.createElement('style');style.textContent=`.space-master-runtime{flex:1 1 100%;display:grid;gap:.3rem;padding:.55rem .7rem;border:1px solid rgba(255,212,134,.22);border-radius:.65rem;background:rgba(5,7,14,.48);font:600 .7rem/1.35 ui-sans-serif,system-ui;color:var(--muted)}.space-role-chain{display:flex;gap:.42rem;align-items:center;flex-wrap:wrap}.space-role-chain strong:nth-of-type(2){color:#ffd486}.space-role-chain strong:nth-of-type(3){color:#c7ffac}.space-master-route,.space-compass-readout{font-weight:500}.space-compass-readout{color:#b9c4d8}`;document.head.appendChild(style);
}
function renderRoute(r){const el=document.getElementById('space-master-route');if(el)el.textContent=`Master route: ${r.carriers.join(' → ')} · domains ${r.domains.join(' × ')} · Compass4D navigation`;}
function renderCompass(o){const el=document.getElementById('space-compass-readout');if(!el)return;const v=o.vector,f=o.functionals;el.textContent=`Compass4D x=${v.x.toFixed(2)} y=${v.y.toFixed(2)} z=${v.z.toFixed(2)} w=${v.w.toFixed(2)} · carrier ${f.crossCarrierWave.toFixed(2)} · domain ${f.crossDomainWave.toFixed(2)} · carrier×domain ${f.crossCarrierDomainWave.toFixed(2)} · success ${f.successAggregation.toFixed(2)}`;}
function wireAnswer(){const answer=document.getElementById('space-answer-text');if(!answer||answer===observedAnswer)return;observedAnswer=answer;new MutationObserver(()=>setTimeout(currentAnswerOrientation,0)).observe(answer,{childList:true,subtree:true,characterData:true});}
function wire(){
  if(eventsWired)return;eventsWired=true;
  document.addEventListener('submit',e=>{if(e.target?.id==='space-search-form')route(document.getElementById('space-search')?.value||'');},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('.space-result')||e.target?.id==='space-helpful')setTimeout(currentAnswerOrientation,40);});
  wireAnswer();
}
function install(){addUI();wire();wireAnswer();route('');}
addEventListener('conscience64-ready',()=>{addUI();wire();wireAnswer();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
globalThis.SpaceLensMaster=Object.freeze({roles:ROLE,companions:DEFAULT_COMPANIONS,route,parameterize,current:()=>({route:structuredClone(lastRoute),orientation:structuredClone(lastOrientation)})});
})();

(()=>{
'use strict';
let loading=false,loaded=false;
const scriptUrl=document.currentScript?.src||new URL('./space-lens-master.js',location.href).href;
const adapterUrl=new URL('./navigation/context-horizon/page-adapter.mjs',scriptUrl).href;
function loadContextHorizon(){
  if(loading||loaded)return;loading=true;
  import(adapterUrl).then(()=>{loaded=true;}).catch(error=>{console.warn('Context Horizon unavailable; ordinary navigation remains active.',error);}).finally(()=>{loading=false;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadContextHorizon,{once:true});else queueMicrotask(loadContextHorizon);
addEventListener('conscience64-ready',loadContextHorizon,{once:true});
})();
