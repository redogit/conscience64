(()=>{
'use strict';

const MAX_BASE=240;
const MAX_SUCCESS=360;
const EVENTS_KEY='conscience64.spaceField.v2';
const carriers=['Master','Compass4D','Learner','Conscience64','Companions','Library','Operator'];
const domains=['research','history','language','geometry','models','human','recovery','cross-domain'];
const now=()=>Date.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const hash=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const seeded=(h,n)=>(((h>>>((n%4)*8))&255)/255);

function loadEvents(){try{const x=JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]');return Array.isArray(x)?x.slice(-180):[];}catch{return[];}}
let successEvents=loadEvents();
let compass={vector:{x:0,y:0,z:0,w:0},functionals:{crossCarrierWave:0,crossDomainWave:0,successAggregation:0}};
function saveEvents(){try{localStorage.setItem(EVENTS_KEY,JSON.stringify(successEvents.slice(-180)));}catch{}}
function pushEvent(type,strength=1,meta={}){
  successEvents.push({type,strength:clamp(strength,.15,4),at:now(),meta});
  successEvents=successEvents.slice(-180);saveEvents();
}
function ageWeight(e,t){return Math.exp(-Math.max(0,t-e.at)/(1000*60*12));}
function confidenceStrength(){
  const text=[...document.querySelectorAll('#space-answer-meta .space-chip')].map(x=>x.textContent.toLowerCase()).join(' ');
  if(text.includes('strong project match'))return 2.4;
  if(text.includes('bounded project match'))return 1.9;
  if(text.includes('bounded record match'))return 1.55;
  if(text.includes('learned locally'))return 1.25;
  if(text.includes('weak'))return .75;
  if(text.includes('unresolved'))return .35;
  return 1;
}
function inferCarrier(text){
  const s=String(text).toLowerCase();
  if(/compass4d|compass 4d/.test(s))return'Compass4D';
  if(/master|librarian/.test(s))return'Master';
  if(/learner|visitor|student/.test(s))return'Learner';
  if(/conscience64|space lens/.test(s))return'Conscience64';
  if(/companion/.test(s))return'Companions';
  if(/orbit|library/.test(s))return'Library';
  if(/operator|moonshot/.test(s))return'Operator';
  return'Learner';
}
function inferDomain(text){
  const s=String(text).toLowerCase();
  for(const d of domains)if(s.includes(d.replace('-',' '))||s.includes(d))return d;
  if(/carrier|wave|transform|functional/.test(s))return'cross-domain';
  return'research';
}
function carrierGravity(carrier){
  if(carrier==='Master')return 2.4;
  if(carrier==='Compass4D')return 2.05;
  if(carrier==='Companions')return 1.4;
  if(carrier==='Library'||carrier==='Operator')return 1.3;
  return 1.12;
}
function modeMultiplier(mode,carrier,domain){
  const g=carrierGravity(carrier);
  if(mode==='cross-carrier')return g*(carrier==='Learner'?1.1:1.35);
  if(mode==='cross-domain')return g*(domain==='research'?1.05:1.45);
  if(mode==='carrier-domain')return g*(domain==='research'?1.18:1.58);
  return g;
}
function rot4(p,a,b,c){
  let[x,y,z,w]=p;
  let ca=Math.cos(a),sa=Math.sin(a);[x,w]=[x*ca-w*sa,x*sa+w*ca];
  ca=Math.cos(b);sa=Math.sin(b);[y,z]=[y*ca-z*sa,y*sa+z*ca];
  ca=Math.cos(c);sa=Math.sin(c);[z,w]=[z*ca-w*sa,z*sa+w*ca];
  return[x,y,z,w];
}
function project4(p,w,h,scale=1){
  const[x,y,z,q]=p,d4=2.7/(3.2-q),z3=z*d4,d3=3.3/(4.2-z3);
  return{x:w/2+x*d4*d3*scale,y:h/2+y*d4*d3*scale,depth:clamp(d4*d3,.25,2),w:q};
}
function colorFor(carrier,type=''){
  if(carrier==='Master')return'#ffd486';
  if(carrier==='Compass4D')return'#c7ffac';
  if(carrier==='Companions')return'#b8d5ff';
  if(type==='helpful')return'#c7ffac';
  if(type==='selection')return'#ffd486';
  return'#8dd8ff';
}
function addUI(){
  if(document.getElementById('space-field-controls'))return;
  const host=document.querySelector('.space-tool-header');if(!host)return;
  const wrap=document.createElement('div');wrap.id='space-field-controls';wrap.className='space-field-controls';
  wrap.innerHTML=`<label>Wave <select id="space-wave-mode" aria-label="Space field wave mode"><option value="local">Local</option><option value="cross-carrier">Cross carrier</option><option value="cross-domain">Cross domain</option><option value="carrier-domain" selected>Carrier × domain</option></select></label><label>Gain <input id="space-field-gain" type="range" min="0.5" max="2.5" value="1.5" step="0.1" aria-label="Space field aggregation gain"></label><span id="space-field-readout" role="status" aria-live="polite">4D field ready</span>`;
  host.appendChild(wrap);
  const style=document.createElement('style');style.textContent=`
  .space-field-controls{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap;font-size:.75rem;color:var(--muted);max-width:42rem;justify-content:flex-end}.space-field-controls label{display:flex;align-items:center;gap:.35rem}.space-field-controls select,.space-field-controls input{accent-color:var(--cyan)}.space-field-controls select{border:1px solid #405071;background:#080d19;color:var(--fg);border-radius:.45rem;padding:.32rem .42rem}.space-field-legend{position:absolute;z-index:4;left:50%;top:1rem;transform:translateX(-50%);display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;pointer-events:none}.space-field-legend span{font:700 .64rem ui-sans-serif,system-ui;letter-spacing:.06em;padding:.25rem .45rem;border:1px solid rgba(141,216,255,.28);border-radius:999px;background:rgba(5,7,14,.68);color:#cbd6eb;backdrop-filter:blur(6px)}.space-field-legend span:first-child{border-color:rgba(255,212,134,.78);color:#ffd486;font-size:.74rem}.space-field-legend span:nth-child(2){border-color:rgba(199,255,172,.72);color:#c7ffac;font-size:.7rem}#space-field{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.space-core{z-index:3!important;width:clamp(10rem,23vw,17rem)!important;height:clamp(10rem,23vw,17rem)!important;border-width:2px!important;box-shadow:0 0 0 1.45rem rgba(91,63,114,.15),0 0 10rem rgba(141,216,255,.34),0 0 15rem rgba(255,212,134,.10),inset 0 0 6rem rgba(0,0,0,1)!important;background:radial-gradient(circle,#000 0 58%,rgba(3,3,9,.99) 62%,rgba(91,63,114,.38) 72%,rgba(141,216,255,.16) 76%,transparent 81%)!important}.space-core strong{font-size:.94rem!important;letter-spacing:.18em!important}`;document.head.appendChild(style);
  const stage=document.querySelector('.space-stage');if(stage&&!document.querySelector('.space-field-legend')){const legend=document.createElement('div');legend.className='space-field-legend';legend.innerHTML=carriers.map(c=>`<span>${c}</span>`).join('');stage.appendChild(legend);}
}
function installCanvas(){
  const stage=document.querySelector('.space-stage');if(!stage)return null;let c=document.getElementById('space-field');if(!c){c=document.createElement('canvas');c.id='space-field';c.setAttribute('aria-hidden','true');stage.prepend(c);}return c;
}
function corpusPoints(){
  const rows=globalThis.Conscience64API?.search?.advanced?.({objectType:'research-node',limit:MAX_BASE})?.results||[];
  return rows.map((r,i)=>{const h=hash(r.uoid||r.logicalId||i);return{h,carrier:inferCarrier(`${r.label} ${r.kind} ${r.domain}`),domain:inferDomain(`${r.label} ${r.kind} ${r.domain}`),p:[(seeded(h,0)-.5)*2,(seeded(h,1)-.5)*2,(seeded(h,2)-.5)*2,(seeded(h,3)-.5)*2]};});
}
function render(){
  addUI();const c=installCanvas(),ctx=c?.getContext('2d');if(!ctx)return;let base=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refresh=()=>{base=corpusPoints();};refresh();addEventListener('conscience64-ready',refresh);
  function frame(ms){
    const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(c.clientWidth*d)),h=Math.max(2,Math.floor(c.clientHeight*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    ctx.clearRect(0,0,w,h);const m=Math.min(w,h),t=reduced?0:ms/1000,mode=document.getElementById('space-wave-mode')?.value||'carrier-domain',gain=Number(document.getElementById('space-field-gain')?.value||1.5);
    const current=now(),active=successEvents.filter(e=>ageWeight(e,current)>.025).slice(-MAX_SUCCESS),sum=active.reduce((a,e)=>a+e.strength*ageWeight(e,current),0),agg=Number(compass?.functionals?.successAggregation||0),prominence=clamp(1+sum*.027+agg*.28,1,2.5),cx=w/2,cy=h/2;
    const halo=ctx.createRadialGradient(cx,cy,m*.015,cx,cy,m*.27*prominence);halo.addColorStop(0,'rgba(0,0,0,1)');halo.addColorStop(.25,'rgba(0,0,0,1)');halo.addColorStop(.5,'rgba(20,13,34,.72)');halo.addColorStop(.68,'rgba(91,63,114,.36)');halo.addColorStop(.78,'rgba(141,216,255,.15)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,m*.27*prominence,0,Math.PI*2);ctx.fill();
    const waveGain=1+Number(compass?.functionals?.crossCarrierWave||0)+Number(compass?.functionals?.crossDomainWave||0);ctx.strokeStyle=`rgba(141,216,255,${clamp(.14+sum*.004+agg*.18,.14,.62)})`;ctx.lineWidth=Math.max(1.2*d,1);ctx.beginPath();ctx.ellipse(cx,cy,m*.205*prominence,m*.064*prominence,t*.08,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(255,212,134,${clamp(.08+agg*.28,.08,.42)})`;ctx.beginPath();ctx.ellipse(cx,cy,m*.235*prominence,m*.085*prominence,-t*.05,0,Math.PI*2);ctx.stroke();
    for(const b of base){const mult=modeMultiplier(mode,b.carrier,b.domain),cv=compass?.vector||{x:0,y:0,z:0,w:0},q=rot4(b.p,t*(.06+.05*cv.w)+seeded(b.h,0),t*(.04+.06*cv.y),t*(.03+.07*cv.x));const radius=m*(.38-(prominence-1)*.055)/Math.max(1,mult*.16+waveGain*.05);const pp=project4(q,w,h,radius);ctx.globalAlpha=clamp(.12+pp.depth*.2+.08*cv.z,.12,.62);ctx.fillStyle=colorFor(b.carrier);ctx.beginPath();ctx.arc(pp.x,pp.y,Math.max(1.1*d,(1.6+carrierGravity(b.carrier)*.22)*d*pp.depth),0,Math.PI*2);ctx.fill();}
    active.forEach((e,i)=>{const hsh=hash(`${e.type}:${e.at}:${i}:${JSON.stringify(e.meta||{})}`),carrier=e.meta.carrier||inferCarrier(e.meta.text||e.type),domain=e.meta.domain||inferDomain(e.meta.text||e.type),mult=modeMultiplier(mode,carrier,domain),age=ageWeight(e,current),strength=e.strength*age*gain*mult*(1+agg*.8),angle=t*(.28+.075*strength)+(hsh%6283)/1000,ring=m*clamp(.225-.026*strength-.03*agg,.052,.225),w4=(seeded(hsh,3)-.5)*1.8+Number(compass?.vector?.w||0)*.35,p=[Math.cos(angle)*(ring+(seeded(hsh,1)-.5)*m*.08),Math.sin(angle)*(ring*.42),Math.sin(angle*.7)*m*.075,w4],pp=project4(rot4([p[0]/m,p[1]/m,p[2]/m,p[3]],t*.15,t*.085,t*.115),w,h,m);ctx.globalAlpha=clamp(.24+strength*.16,.24,.98);ctx.fillStyle=colorFor(carrier,e.type);ctx.beginPath();ctx.arc(pp.x,pp.y,Math.max(1.6*d,(1.25+strength)*d),0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    const readout=document.getElementById('space-field-readout');if(readout)readout.textContent=`4D→2D · ${active.length} timed successes · aggregation ${agg.toFixed(2)} · field ${sum.toFixed(1)}`;
    requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
}
function wireEvents(){
  document.addEventListener('submit',e=>{if(e.target?.id!=='space-search-form')return;setTimeout(()=>{const input=document.getElementById('space-search');pushEvent('search',confidenceStrength(),{text:input?.value||'',carrier:inferCarrier(input?.value),domain:inferDomain(input?.value)});},90);},true);
  document.addEventListener('click',e=>{const target=e.target.closest?.('.space-result');if(target){pushEvent('selection',1.9,{text:target.textContent,carrier:inferCarrier(target.textContent),domain:inferDomain(target.textContent)});return;}if(e.target?.id==='space-helpful'){pushEvent('helpful',2.8,{text:document.getElementById('space-search')?.value||''});return;}if(e.target?.id==='space-not-helpful'){pushEvent('correction',.3,{text:document.getElementById('space-search')?.value||''});}});
  addEventListener('space-lens-memory-changed',()=>pushEvent('memory',.65,{text:'companion memory',carrier:'Companions'}));
  addEventListener('space-master-route',e=>{const r=e.detail||{};pushEvent('master-route',1.15+Math.min(1,(r.carriers?.length||1)*.12),{text:r.question||'',carrier:'Master',domain:(r.domains||[])[0]||'research'});});
  addEventListener('space-compass4d-orientation',e=>{compass=e.detail||compass;const f=compass.functionals||{};pushEvent('compass4d',.8+1.7*Number(f.successAggregation||0),{text:'Compass4D cross carrier cross domain orientation',carrier:'Compass4D',domain:Number(f.crossDomainWave||0)>Number(f.crossCarrierWave||0)?'cross-domain':'research'});});
}
wireEvents();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
globalThis.SpaceLensField=Object.freeze({pushEvent,events:()=>successEvents.slice(),carriers:carriers.slice(),domains:domains.slice(),compass:()=>structuredClone(compass)});
})();