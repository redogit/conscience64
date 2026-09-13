(()=>{
'use strict';

let observedAnswer=null;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const $=id=>document.getElementById(id);

function confidenceText(){return [...document.querySelectorAll('#space-answer-meta .space-chip')].map(x=>x.textContent).join(' ').toLowerCase();}
function sourceCount(){return document.querySelectorAll('#space-evidence-list .space-evidence-item').length;}
function currentQuestion(){return clean($('space-search')?.value||'');}
function intentOf(q){
  const s=q.toLowerCase();
  if(/\b(compare|difference|versus|vs\.?|better)\b/.test(s))return'compare';
  if(/\b(build|make|create|implement|code|design)\b/.test(s))return'build';
  if(/\b(find|search|locate|where|source|evidence)\b/.test(s))return'find';
  if(/\b(plan|next|should|how do i|how can i)\b/.test(s))return'plan';
  if(/\b(recover|restore|history|archive|missing)\b/.test(s))return'recover';
  return'explain';
}
function deriveHelp(){
  const question=currentQuestion(),answer=clean($('space-answer-text')?.textContent||''),confidence=confidenceText(),sources=sourceCount(),intent=intentOf(question);
  const weak=/unresolved|weak|remembered local answer/.test(confidence)||!sources;
  let next='Inspect the strongest source and keep the stated limit attached to the answer.';
  if(weak)next='Keep the uncertainty explicit. Narrow the question, inspect nearby records, or choose a wider search deliberately.';
  else if(intent==='build')next='Turn the supported answer into one small testable change, then check what actually changed.';
  else if(intent==='compare')next='Compare the strongest supporting records side by side before choosing between them.';
  else if(intent==='find')next='Open the strongest matching record and verify identity, provenance, and scope before reusing it.';
  else if(intent==='plan')next='Choose the smallest reversible next action supported by the current evidence.';
  else if(intent==='recover')next='Prefer exact identity, chronology, source path, and unresolved gaps over semantic resemblance.';
  const followup=weak?(question?`What is the smallest well-supported part of: ${question}`:'What can this space support with the least uncertainty?'):(question?`What evidence supports this answer to: ${question}`:'What evidence supports this answer?');
  return{question,answer,confidence,sources,intent,weak,next,followup};
}
function ensureUI(){
  const answer=$('space-answer');if(!answer||$('space-default-help'))return null;
  const box=document.createElement('section');box.id='space-default-help';box.className='space-default-help';box.setAttribute('aria-label','Default help');
  const title=document.createElement('p');title.className='space-help-kicker';title.textContent='Help by default';
  const next=document.createElement('p');next.id='space-help-next';next.className='space-help-next';
  const actions=document.createElement('div');actions.className='space-help-actions';
  const buttons=[['space-help-evidence','Inspect evidence'],['space-help-followup','Ask the next useful question'],['space-help-wider','Search wider'],['space-help-speak','Speak answer']];
  for(const[id,label]of buttons){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;actions.appendChild(b);}
  const note=document.createElement('p');note.className='space-help-note';note.textContent='Master coordinates. Compass4D navigates. Neither overrides evidence, uncertainty, or the learner’s choice.';
  box.append(title,next,actions,note);
  const evidence=answer.querySelector('.space-evidence');if(evidence)answer.insertBefore(box,evidence);else answer.appendChild(box);
  const style=document.createElement('style');style.textContent=`.space-default-help{margin:.8rem 0;padding:.8rem .9rem;border:1px solid rgba(199,255,172,.24);border-radius:.65rem;background:rgba(10,18,22,.58)}.space-help-kicker{margin:0 0 .3rem!important;color:#c7ffac!important;font:700 .72rem ui-sans-serif,system-ui;text-transform:uppercase;letter-spacing:.1em}.space-help-next{margin:.2rem 0 .6rem!important;color:#eef4ff!important;font:500 .94rem/1.45 ui-sans-serif,system-ui}.space-help-actions{display:flex;gap:.45rem;flex-wrap:wrap}.space-help-actions button{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.48rem .65rem;cursor:pointer}.space-help-actions button:focus-visible{outline:3px solid #8dd8ff;outline-offset:2px}.space-help-note{margin:.55rem 0 0!important;font-size:.74rem!important;color:#9eabc4!important}`;document.head.appendChild(style);
  return box;
}
function render(){const data=deriveHelp();if(!data.answer)return;ensureUI();const el=$('space-help-next');if(el)el.textContent=data.next;const wider=$('space-help-wider');if(wider)wider.hidden=!document.querySelector('#space-web-links a');}
function action(type){
  const data=deriveHelp();globalThis.SpaceLensField?.pushEvent?.('help-action',1.45,{text:type,carrier:'Master',domain:'human'});
  if(type==='evidence'){const d=document.querySelector('.space-evidence');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'nearest'});}return;}
  if(type==='followup'){const input=$('space-search');if(input){input.value=data.followup;input.focus();input.select?.();}return;}
  if(type==='wider'){const a=document.querySelector('#space-web-links a');if(a){a.focus();document.getElementById('space-web-links')?.scrollIntoView({behavior:'smooth',block:'nearest'});}return;}
  if(type==='speak'){globalThis.SpaceLensVoice?.speak?.(data.answer,globalThis.SpaceLensVoice?.language);}
}
function wireActions(){document.addEventListener('click',e=>{const id=e.target?.id;if(id==='space-help-evidence')action('evidence');else if(id==='space-help-followup')action('followup');else if(id==='space-help-wider')action('wider');else if(id==='space-help-speak')action('speak');});}
function watch(){const host=$('space-answer-text');if(!host||host===observedAnswer)return;observedAnswer=host;new MutationObserver(render).observe(host,{childList:true,subtree:true,characterData:true});render();}
function install(){wireActions();watch();const readout=document.querySelector('.space-readout');if(readout)new MutationObserver(watch).observe(readout,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
addEventListener('conscience64-ready',watch);
globalThis.SpaceLensHelp=Object.freeze({derive:deriveHelp,render});
})();
