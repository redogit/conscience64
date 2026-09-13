(()=>{
'use strict';

const MAX_BASE=220;
const MAX_SUCCESS=360;
const EVENTS_KEY='conscience64.spaceField.v1';
const carriers=['Master','Conscience64','Companions','Library','Operator'];
const domains=['research','history','language','geometry','models','human','recovery','cross-domain'];
const now=()=>Date.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const seeded=(h,n)=>(((h>>>((n%4)*8))&255)/255);

function loadEvents(){try{const x=JSON.parse(localStorage.getItem(EVENTS_KEY)||'[]');return Array.isArray(x)?x.slice(-180):[];}catch{return[];}}
let successEvents=loadEvents();
function saveEvents(){try{localStorage.setItem(EVENTS_KEY,JSON.stringify(successEvents.slice(-180)));}catch{}}
function pushEvent(type,strength=1,meta={}){
  successEvents.push({type,strength:clamp(Number(strength)||1,.15,4),at:now(),meta});
  successEvents=successEvents.slice(-180);saveEvents();
}
function ageWeight(e,t){const age=Math.max(0,t-e.at);return Math.exp(-age/(1000*60*12));}
function confidenceStrength(){
  const chips=[...document.querySelectorAll('#space-answer-meta .space-chip')].map(x=>x.textContent.toLowerCase());
  const text=chips.join(' ');
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
  if(/master|librarian/.test(s))return'Master';
  if(/conscience64|space lens/.test(s))return'Conscience64';
  if(/companion/.test(s))return'Companions';
  if(/orbit|library/.test(s))return'Library';
  if(/operator|moonshot/.test(s))return'Operator';
  return'Conscience64';
}
function inferDomain(text){
  const s=String(text).toLowerCase();
  for(const d of domains)if(s.includes(d.replace('-',' '))||s.includes(d))return d;
  if(/carrier|wave|transform/.test(s))return'cross-domain';
  return'research';
}
function modeMultiplier(mode,carrier,domain){
  if(mode==='cross-carrier')return carrier==='Conscience64'?1.15:1.5;
  if(mode==='cross-domain')return domain==='research'?1.1:1.5;
  if(mode==='carrier-domain')return (carrier!=='Conscience64'&&domain!=='research')?1.85:1.25;
  return 1;
}
function rot4(p,a,b,c){
  let[x,y,z,w]=p;
  let ca=Math.cos(a),sa=Math.sin(a);[x,w]=[x*ca-w*sa,x*sa+w*ca];
  ca=Math.cos(b);sa=Math.sin(b);[y,z]=[y*ca-z*sa,y*sa+z*ca];
  ca=Math.cos(c);sa=Math.sin(c);[z,w]=[z*ca-w*sa,z*sa+w*ca];
  return[x,y,z,w];
}
function project4(p,w,h,scale=1){
  const[x,y,z,q]=p;const d4=2.7/(3.2-q);const z3=z*d4;const d3=3.3/(4.2-z3);
  return {x:w/2+x*d4*d3*scale,y:h/2+y*d4*d3*scale,depth:clamp(d4*d3,.25,2),w:q};
}
function addUI(){
  if(document.getElementById('space-field-controls'))return;
  const host=document.querySelector('.space-tool-header');if(!host)return;
  const wrap=document.createElement('div');wrap.id='space-field-controls';wrap.className='space-field-controls';
  wrap.innerHTML=`<label>Wave <select id="space-wave-mode" aria-label="Space field wave mode"><option value="local">Local</option><option value="cross-carrier">Cross carrier</option><option value="cross-domain">Cross domain</option><option value="carrier-domain" selected>Carrier × domain</option></select></label><label>Gain <input id="space-field-gain" type="range" min="0.5" max="2.5" value="1.4" step="0.1" aria-label="Space field aggregation gain"></label><span id="space-field-readout" role="status" aria-live="polite">4D field ready</span>`;
  host.appendChild(wrap);
  const style=document.createElement('style');style.textContent=`
  .space-field-controls{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap;font-size:.75rem;color:var(--muted);max-width:36rem;justify-content:flex-end}.space-field-controls label{display:flex;align-items:center;gap:.35rem}.space-field-controls select,.space-field-controls input{accent-color:var(--cyan)}.space-field-controls select{border:1px solid #405071;background:#080d19;color:var(--fg);border-radius:.45rem;padding:.32rem .42rem}.space-field-legend{position:absolute;z-index:4;left:50%;top:1rem;transform:translateX(-50%);display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;pointer-events:none}.space-field-legend span{font:700 .64rem ui-sans-serif,system-ui;letter-spacing:.06em;padding:.25rem .45rem;border:1px solid rgba(141,216,255,.28);border-radius:999px;background:rgba(5,7,14,.62);color:#cbd6eb;backdrop-filter:blur(6px)}#space-field{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.space-core{z-index:3!important;border-width:2px!important;box-shadow:0 0 0 1.05rem rgba(91,63,114,.12),0 0 7rem rgba(141,216,255,.25),inset 0 0 4.5rem rgba(0,0,0,1)!important;background:radial-gradient(circle,#000 0 53%,rgba(3,3,9,.98) 59%,rgba(91,63,114,.33) 70%,rgba(141,216,255,.12) 74%,transparent 77%)!important}`;document.head.appendChild(style);
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
    ctx.clearRect(0,0,w,h);const m=Math.min(w,h),t=reduced?0:ms/1000,mode=document.getElementById('space-wave-mode')?.value||'carrier-domain',gain=Number(document.getElementById('space-field-gain')?.value||1.4);
    const cx=w/2,cy=h/2;const sum=successEvents.reduce((a,e)=>a+e.strength*ageWeight(e,now()),0);const prominence=clamp(1+sum*.025,1,2.3);
    const halo=ctx.createRadialGradient(cx,cy,m*.02,cx,cy,m*.24*prominence);halo.addColorStop(0,'rgba(0,0,0,1)');halo.addColorStop(.28,'rgba(0,0,0,.98)');halo.addColorStop(.54,'rgba(34,25,52,.55)');halo.addColorStop(.72,'rgba(141,216,255,.12)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,m*.24*prominence,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`rgba(141,216,255,${clamp(.12+sum*.004,.12,.45)})`;ctx.lineWidth=Math.max(1,d);ctx.beginPath();ctx.ellipse(cx,cy,m*.18*prominence,m*.055*prominence,t*.08,0,Math.PI*2);ctx.stroke();
    for(const b of base){const mult=modeMultiplier(mode,b.carrier,b.domain);const q=rot4(b.p,t*.08+seeded(b.h,0),t*.05,t*.035);const radius=m*(.34-(prominence-1)*.035)/Math.max(1,mult*.18);const pp=project4(q,w,h,radius);ctx.globalAlpha=clamp(.14+pp.depth*.18,.12,.55);ctx.fillStyle=b.carrier==='Master'?'#ffd486':b.carrier==='Companions'?'#c7ffac':'#8dd8ff';ctx.beginPath();ctx.arc(pp.x,pp.y,Math.max(1.1*d,2.0*d*pp.depth),0,Math.PI*2);ctx.fill();}
    const current=now();const active=successEvents.filter(e=>ageWeight(e,current)>.025).slice(-MAX_SUCCESS);
    active.forEach((e,i)=>{const hsh=hash(`${e.type}:${e.at}:${i}:${JSON.stringify(e.meta||{})}`),carrier=e.meta.carrier||inferCarrier(e.meta.text||e.type),domain=e.meta.domain||inferDomain(e.meta.text||e.type),mult=modeMultiplier(mode,carrier,domain),age=ageWeight(e,current),strength=e.strength*age*gain*mult;const angle=t*(.3+.08*strength)+(hsh%6283)/1000;const ring=m*clamp(.20-.025*strength,.065,.21);const wobble=(seeded(hsh,1)-.5)*m*.08;const p=[Math.cos(angle)*(ring+wobble),Math.sin(angle)*(ring*.42),Math.sin(angle*.7)*m*.08,(seeded(hsh,3)-.5)*1.8];const pp=project4(rot4([p[0]/m,p[1]/m,p[2]/m,p[3]],t*.16,t*.09,t*.12),w,h,m);ctx.globalAlpha=clamp(.25+strength*.18,.25,.95);ctx.fillStyle=e.type==='helpful'?'#c7ffac':e.type==='selection'?'#ffd486':'#8dd8ff';ctx.beginPath();ctx.arc(pp.x,pp.y,Math.max(1.6*d,(1.3+strength)*d),0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
    const readout=document.getElementById('space-field-readout');if(readout)readout.textContent=`4D→2D · ${active.length} active successes · field ${sum.toFixed(1)}`;
    requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
}
function wireEvents(){
  document.addEventListener('submit',e=>{if(e.target?.id!=='space-search-form')return;setTimeout(()=>{const input=document.getElementById('space-search');pushEvent('search',confidenceStrength(),{text:input?.value||'',carrier:inferCarrier(input?.value),domain:inferDomain(input?.value)});},80);},true);
  document.addEventListener('click',e=>{const target=e.target.closest?.('.space-result');if(target){pushEvent('selection',1.8,{text:target.textContent,carrier:inferCarrier(target.textContent),domain:inferDomain(target.textContent)});return;}if(e.target?.id==='space-helpful'){pushEvent('helpful',2.7,{text:document.getElementById('space-search')?.value||''});return;}if(e.target?.id==='space-not-helpful'){pushEvent('correction',.3,{text:document.getElementById('space-search')?.value||''});}});
  addEventListener('space-lens-memory-changed',()=>pushEvent('memory',.6,{text:'companion memory'}));
}
wireEvents();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
globalThis.SpaceLensField=Object.freeze({pushEvent,events:()=>successEvents.slice(),carriers:carriers.slice(),domains:domains.slice()});
})();