(()=>{
'use strict';

const STOP=new Set([
  'a','an','and','are','as','at','be','because','been','but','by','can','could','did','do','does','for','from','had','has','have','how','i','if','in','into','is','it','its','me','my','of','on','or','our','should','so','that','the','their','them','then','there','these','this','to','us','was','we','were','what','when','where','which','who','why','will','with','would','you','your'
]);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const words=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9:_-]+/).filter(Boolean);
const meaningful=q=>words(q).filter(w=>!STOP.has(w)&&w.length>1);
const sentence=s=>{const t=clean(s);return !t?'':/[.!?]$/.test(t)?t:t+'.';};
const api=()=>globalThis.Conscience64API||null;

function questionKind(q){
  const s=clean(q).toLowerCase();
  if(/^(why|what caused|what made)\b/.test(s))return'why';
  if(/^(how|how do|how does|how did)\b/.test(s))return'how';
  if(/\b(next|should we|what now|what should)\b/.test(s))return'next';
  if(/\b(fail|failed|failure|problem|wrong|lowlight|regress)\b/.test(s))return'failure';
  if(/\b(unknown|unresolved|missing|remain|remainder)\b/.test(s))return'unknown';
  if(/\b(status|current|where are|where is)\b/.test(s))return'status';
  return'what';
}

function projectScore(p,tokens,raw){
  const name=String(p.name||'').toLowerCase(),id=String(p.id||'').toLowerCase(),hay=JSON.stringify(p).toLowerCase();
  let score=0;
  if(raw&&name===raw)score+=80;
  if(raw&&id===raw.replace(/\s+/g,'-'))score+=80;
  if(raw&&name.includes(raw))score+=35;
  for(const t of tokens){if(name.includes(t)||id.includes(t))score+=16;else if(hay.includes(t))score+=3;}
  return score;
}

function mergeSearch(a,queries){
  const map=new Map();
  for(const q of queries){
    if(!q)continue;
    const out=a.search.simple(q,{limit:16});
    for(const r of out.results||[]){
      const key=r.uoid||r.logicalId||JSON.stringify(r);
      const prior=map.get(key);
      const bonus=q===queries[0]?4:0;
      const score=(r.searchScore||0)+bonus;
      if(!prior||score>prior._qaScore)map.set(key,{...r,_qaScore:score});
    }
  }
  return [...map.values()].sort((x,y)=>y._qaScore-x._qaScore).slice(0,12);
}

function objectSummary(r){
  return clean(r?.description||r?.basis||r?.microdata?.properties?.description||r?.label||r?.logicalId||'');
}
function sourceView(r){
  return {
    id:r.uoid||r.logicalId||'',
    label:r.label||r.logicalId||r.uoid||'Record',
    type:r.objectType||r.kind||'record',
    summary:objectSummary(r),
    provenance:clean(r.provenance||r.basis||'')
  };
}

function answerFromProject(p,kind){
  if(kind==='failure')return sentence(p.lowlight||p.O||p.R);
  if(kind==='unknown')return sentence(p.checks?.unknown||p.claimCeiling||p.O);
  if(kind==='next')return sentence(p.P||p.checks?.test);
  if(kind==='why')return sentence(p.R||p.O);
  if(kind==='how')return sentence(p.P||p.highlight||p.O);
  if(kind==='status')return `${p.name} is currently recorded as ${String(p.status||'unknown').replaceAll('_',' ').toLowerCase()}. ${sentence(p.O)}`;
  return `${p.name}: ${sentence(p.O||p.I)}${p.highlight?' '+sentence(p.highlight):''}`;
}

function answerQuestion(question){
  const a=api();
  if(!a)throw new Error('Conscience64 is still loading.');
  const q=clean(question);
  if(!q)throw new TypeError('Ask a non-empty question.');
  const tokens=meaningful(q),core=tokens.join(' '),kind=questionKind(q),raw=q.toLowerCase().replace(/[?!.]+$/,'').trim();

  const allProjects=a.projects.list().projects||[];
  const projectRank=allProjects.map(p=>[p,projectScore(p,tokens,raw)]).filter(([,s])=>s>0).sort((x,y)=>y[1]-x[1]);
  const topProject=projectRank[0]?.[0]||null,projectStrength=projectRank[0]?.[1]||0;

  const queries=[q,core];
  if(tokens.length>2)queries.push(tokens.slice(0,3).join(' '));
  const records=mergeSearch(a,[...new Set(queries)]);
  const nonEdges=records.filter(r=>r.objectType!=='research-edge');
  const topRecord=nonEdges[0]||records[0]||null;

  let answer='',confidence='partial',limit='',basis=[];
  if(topProject&&projectStrength>=18){
    answer=answerFromProject(topProject,kind);
    confidence=projectStrength>=40?'strong project match':'bounded project match';
    limit=sentence(topProject.claimCeiling||topProject.checks?.unknown||'This answer is limited to the project record currently carried in Conscience64.');
    basis=[{id:topProject.id,label:topProject.name,type:'project',summary:clean(topProject.highlight||topProject.O),provenance:topProject.path||''},...records.slice(0,3).map(sourceView)];
  }else if(topRecord){
    const summary=objectSummary(topRecord);
    answer=summary?sentence(summary):`The closest indexed record is ${topRecord.label||topRecord.logicalId||'an unnamed record'}, but it does not carry enough descriptive text for a fuller answer.`;
    confidence=topRecord._qaScore>=15?'bounded record match':'weak record match';
    limit='This is an extractive answer from indexed records. A related record is not automatically supporting evidence.';
    basis=records.slice(0,4).map(sourceView);
  }else{
    answer='I do not have enough indexed material in this Conscience64 space to answer that question yet.';
    confidence='unresolved';
    limit='No match is not proof of absence. The relevant carrier may be missing, unindexed, or outside this public space.';
  }

  const dedup=[];const seen=new Set();
  for(const s of basis){const k=s.id||s.label;if(!k||seen.has(k))continue;seen.add(k);dedup.push(s);}
  const result={question:q,kind,answer,confidence,limit,sources:dedup.slice(0,4),queryTerms:tokens,
    next:topProject?['Open the project record','Inspect its unresolved remainder','Search a narrower term']:topRecord?['Inspect the closest record','Search a narrower term','Trace its relations']:['Try a project name','Try fewer key terms','Check Historical Recovery']};
  return result;
}

function ensureUI(){
  const readout=document.querySelector('.space-readout');
  if(!readout||document.getElementById('space-answer'))return;
  const style=document.createElement('style');
  style.textContent=`
    .space-answer{margin:.75rem 0 1rem;padding:1rem 1.05rem;border:1px solid #405071;border-radius:.8rem;background:rgba(8,13,25,.92)}
    .space-answer[hidden]{display:none}.space-answer-kicker{margin:0 0 .35rem;color:#8dd8ff;font:700 .74rem ui-sans-serif,system-ui;letter-spacing:.11em;text-transform:uppercase}
    .space-answer-text{margin:.1rem 0 .75rem;color:#eef4ff;font:500 clamp(1rem,2vw,1.16rem)/1.55 ui-sans-serif,system-ui}
    .space-answer-meta{display:flex;gap:.5rem;flex-wrap:wrap;margin:.45rem 0 .75rem}.space-chip{border:1px solid #405071;border-radius:999px;padding:.25rem .55rem;color:#cbd6eb;font-size:.72rem}
    .space-limit{margin:.55rem 0;color:#b9c4d8;font-size:.82rem}.space-evidence{margin-top:.7rem;border-top:1px solid #26314b;padding-top:.65rem}.space-evidence summary{cursor:pointer;color:#a9e9db;font-weight:700}
    .space-evidence-list{display:grid;gap:.5rem;margin-top:.6rem}.space-evidence-item{padding:.6rem .7rem;border-left:3px solid #405071;background:rgba(17,26,43,.7)}.space-evidence-item strong{display:block;color:#eef4ff}.space-evidence-item small{display:block;color:#9eabc4;margin-top:.2rem;line-height:1.4}
    .space-answer-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}.space-answer-actions button{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.5rem .7rem;cursor:pointer}.space-answer-actions button:focus-visible{outline:3px solid #8dd8ff;outline-offset:2px}
    .space-suggestions{display:flex;gap:.45rem;flex-wrap:wrap;margin:.6rem 0 0}.space-suggestions button{border:1px solid #31405e;background:transparent;color:#cbd6eb;border-radius:999px;padding:.35rem .6rem;cursor:pointer;font-size:.72rem}.space-suggestions button:hover{border-color:#8dd8ff}
  `;
  document.head.appendChild(style);
  const answer=document.createElement('section');answer.id='space-answer';answer.className='space-answer';answer.hidden=true;answer.setAttribute('aria-live','polite');
  answer.innerHTML='<p class="space-answer-kicker">Answer</p><div id="space-answer-text" class="space-answer-text"></div><div id="space-answer-meta" class="space-answer-meta"></div><p id="space-answer-limit" class="space-limit"></p><details class="space-evidence"><summary>Why this answer?</summary><div id="space-evidence-list" class="space-evidence-list"></div></details><div class="space-answer-actions"><button type="button" id="space-copy-answer">Copy answer</button><button type="button" id="space-clear-answer">Clear answer</button></div>';
  const top=readout.querySelector('.space-readout-top');top?.insertAdjacentElement('afterend',answer);
  const input=document.getElementById('space-search'),submit=document.querySelector('#space-search-form button[type="submit"]');
  if(input)input.placeholder='Ask Space Lens a question…';if(submit)submit.textContent='Ask';
  const header=document.querySelector('.space-tool-header p');if(header)header.textContent='Ask a question in ordinary language. Space Lens gives the shortest answer supported by the current public records, then shows its evidence and limits.';
  const suggestions=document.createElement('div');suggestions.className='space-suggestions';suggestions.setAttribute('aria-label','Example questions');
  for(const q of['What is Orbit Library?','What remains unresolved?','What did model experiments teach us?','What is Cross-Carrier Wave?']){const b=document.createElement('button');b.type='button';b.textContent=q;b.dataset.qaSuggestion=q;suggestions.appendChild(b);}
  document.querySelector('.space-tool-header div')?.appendChild(suggestions);
}

function renderAnswer(out){
  const box=document.getElementById('space-answer');if(!box)return;box.hidden=false;
  document.getElementById('space-answer-text').textContent=out.answer;
  document.getElementById('space-answer-meta').innerHTML=`<span class="space-chip">${esc(out.confidence)}</span><span class="space-chip">${esc(out.kind)} question</span><span class="space-chip">${out.sources.length} source${out.sources.length===1?'':'s'}</span>`;
  document.getElementById('space-answer-limit').textContent=out.limit;
  const list=document.getElementById('space-evidence-list');list.replaceChildren();
  if(!out.sources.length){const p=document.createElement('p');p.textContent='No supporting record was selected.';list.appendChild(p);}
  for(const s of out.sources){const d=document.createElement('div');d.className='space-evidence-item';d.innerHTML=`<strong>${esc(s.label)}</strong><small>${esc(s.summary||s.type)}${s.provenance?' · '+esc(s.provenance):''}</small>`;list.appendChild(d);}
  const title=document.getElementById('space-readout-title'),status=document.getElementById('space-readout-status');
  if(title)title.textContent='Answer';if(status)status.textContent='Plain-language answer first; evidence and raw records remain available below.';

  const a=api();if(a){a.irpo({I:out.question,R:{difference:'Find the smallest answer supported by the current public records.',evidenceUsed:out.sources.map(s=>s.id),uncertainty:out.limit},P:{action:'SPACE_LENS_ANSWER',method:'extractive bounded synthesis'},O:{answer:out.answer,confidence:out.confidence,limit:out.limit}});}
  const I=document.getElementById('irpo-i'),R=document.getElementById('irpo-r'),P=document.getElementById('irpo-p'),O=document.getElementById('irpo-o');
  if(I)I.textContent=out.question;
  if(R)R.textContent=`What mattered\n${out.sources.length?out.sources.map(s=>'• '+s.label).join('\n'):'• No supporting record found'}\n\nLimit\n${out.limit}`;
  if(P)P.textContent='1. Interpret the question\n2. Prefer exact project identity\n3. Search the indexed space\n4. Answer only from carried records\n5. Preserve uncertainty';
  if(O)O.textContent=out.answer;
}

function install(){
  ensureUI();
  const form=document.getElementById('space-search-form'),input=document.getElementById('space-search');if(!form||!input)return;
  form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();try{renderAnswer(answerQuestion(input.value));}catch(err){const status=document.getElementById('space-readout-status');if(status)status.textContent=String(err?.message||err);}},true);
  document.addEventListener('click',e=>{
    const s=e.target.closest?.('[data-qa-suggestion]');if(s){input.value=s.dataset.qaSuggestion;renderAnswer(answerQuestion(input.value));return;}
    if(e.target.id==='space-clear-answer'){document.getElementById('space-answer').hidden=true;return;}
    if(e.target.id==='space-copy-answer'){const text=document.getElementById('space-answer-text')?.textContent||'';navigator.clipboard?.writeText(text);e.target.textContent='Copied';setTimeout(()=>e.target.textContent='Copy answer',1200);}
  });
}

globalThis.SpaceLensQA=Object.freeze({version:'1.0.0',answer:answerQuestion});
addEventListener('conscience64-ready',install,{once:true});
if(api())install();
})();
