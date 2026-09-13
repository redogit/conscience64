(()=>{
'use strict';
let observedAnswer=null;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const $=id=>document.getElementById(id);
function confidenceText(){return [...document.querySelectorAll('#space-answer-meta .space-chip')].map(x=>x.textContent).join(' ').toLowerCase();}
function sourceCount(){return document.querySelectorAll('#space-evidence-list .space-evidence-item').length;}
function currentQuestion(){return clean($('space-search')?.value||'');}
function intentOf(q){const s=q.toLowerCase();if(/\b(compare|difference|versus|vs\.?|better)\b/.test(s))return'compare';if(/\b(build|make|create|implement|code|design)\b/.test(s))return'build';if(/\b(find|search|locate|where|source|evidence)\b/.test(s))return'find';if(/\b(plan|next|should|how do i|how can i)\b/.test(s))return'plan';if(/\b(recover|restore|history|archive|missing)\b/.test(s))return'recover';return'explain';}
function deriveHelp(){
  const question=currentQuestion(),answer=clean($('space-answer-text')?.textContent||''),confidence=confidenceText(),sources=sourceCount(),intent=intentOf(question),weak=/unresolved|weak|remembered local answer/.test(confidence)||!sources;
  let next='Check the source if you need to rely on this answer.';
  if(weak)next='Try a narrower question, or choose a wider search if the local material is not enough.';
  else if(intent==='build')next='Turn this into one small reversible test before changing more.';
  else if(intent==='compare')next='Compare the strongest sources side by side before choosing.';
  else if(intent==='find')next='Open the strongest match and verify its identity and provenance.';
  else if(intent==='plan')next='Take the smallest reversible step supported by the current evidence.';
  else if(intent==='recover')next='Follow exact identity and chronology before relying on resemblance.';
  return{question,answer,confidence,sources,intent,weak,next};
}
function ensureUI(){
  const answer=$('space-answer');if(!answer||$('space-default-help'))return null;const box=document.createElement('aside');box.id='space-default-help';box.className='space-default-help';box.setAttribute('aria-label','Suggested next step');box.innerHTML='<span class="space-help-label">Next</span><span id="space-help-next"></span>';const evidence=answer.querySelector('.space-evidence');if(evidence)answer.insertBefore(box,evidence);else answer.appendChild(box);
  const style=document.createElement('style');style.textContent=`.space-master-runtime,.space-field-controls,.space-field-legend{display:none!important}.space-default-help{display:flex;gap:.55rem;align-items:baseline;margin:.55rem 0;padding:.5rem .65rem;border-left:2px solid rgba(199,255,172,.5);background:rgba(10,18,22,.32);font:500 .82rem/1.4 ui-sans-serif,system-ui;color:#cbd6eb}.space-help-label{flex:none;color:#c7ffac;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:.68rem}`;document.head.appendChild(style);return box;
}
function render(){const data=deriveHelp();if(!data.answer)return;ensureUI();const el=$('space-help-next');if(el)el.textContent=data.next;}
function watch(){const host=$('space-answer-text');if(!host||host===observedAnswer)return;observedAnswer=host;new MutationObserver(render).observe(host,{childList:true,subtree:true,characterData:true});render();}
function install(){watch();const readout=document.querySelector('.space-readout');if(readout)new MutationObserver(watch).observe(readout,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();addEventListener('conscience64-ready',watch);globalThis.SpaceLensHelp=Object.freeze({derive:deriveHelp,render});
})();