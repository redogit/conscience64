(()=>{
'use strict';

const KEY='conscience64.humanBuilder.v1';
const SCHEMA='conscience64/human-builder/v1';
const now=()=>new Date().toISOString();
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'tool';
const api=()=>globalThis.Conscience64API||null;
const mem=()=>globalThis.SpaceLensMemory||null;
const local=()=>globalThis.SpaceLensLocalSearch||null;
const web=()=>globalThis.SpaceLensWebSearch||null;
const qa=()=>globalThis.SpaceLensQA||null;
const fresh=()=>({schema:SCHEMA,version:1,createdAt:now(),updatedAt:now(),tools:{},runs:[]});
let volatile=fresh(),CURRENT_TOOL=null,CURRENT_RUN=null;

function storage(){try{return globalThis.localStorage||null;}catch{return null;}}
function valid(s){return s&&s.schema===SCHEMA&&typeof s.tools==='object'&&Array.isArray(s.runs);}
function load(){const s=storage();if(!s)return clone(volatile);try{const x=JSON.parse(s.getItem(KEY)||'null');if(valid(x)){volatile=x;return clone(x);}}catch{}return clone(volatile);}
function save(state){state.updatedAt=now();state.runs=(state.runs||[]).slice(-100);volatile=clone(state);const s=storage();if(s){try{s.setItem(KEY,JSON.stringify(state));}catch{}}return clone(state);}
function listTools(){return Object.values(load().tools).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(clone);}
function getTool(id){return clone(load().tools[id]||null);}
function putTool(tool){const state=load(),t=normalizeTool(tool);state.tools[t.id]=t;save(state);return clone(t);}
function deleteTool(id){const state=load();delete state.tools[id];save(state);}
function exportText(){return JSON.stringify(load(),null,2);}
function importText(text,{merge=true}={}){const incoming=JSON.parse(String(text));if(!valid(incoming))throw new TypeError('Invalid Human Builder file.');if(!merge)return save(incoming);const state=load();state.tools={...state.tools,...incoming.tools};state.runs=[...(state.runs||[]),...(incoming.runs||[])];return save(state);}
function clear(){volatile=fresh();const s=storage();if(s){try{s.removeItem(KEY);}catch{}}return load();}

const STEP_TYPES={
  ask:{label:'Ask Space Lens',help:'Answer from Conscience64 + learned memory.',defaultTemplate:'{{input}}'},
  'local-search':{label:'Local Search',help:'Search the on-device Conscience64 index.',defaultTemplate:'{{input}}'},
  'web-search':{label:'Web Search',help:'Search selected public providers inside Conscience64.',defaultTemplate:'{{input}}'},
  project:{label:'Project lookup',help:'Load one project by id, e.g. orbit-library.',defaultTemplate:'{{input}}'},
  record:{label:'Record lookup',help:'Load one Conscience64 UOID/logical id.',defaultTemplate:'{{input}}'},
  remember:{label:'Remember locally',help:'Teach Space Lens a local answer or note.',defaultTemplate:'{{previous}}'},
  note:{label:'Human-facing note',help:'Produce formatted text from variables.',defaultTemplate:'{{previous}}'}
};

function normalizeTool(tool={}){
  const created=tool.createdAt||now(),name=clean(tool.name||'Untitled Human Tool'),id=tool.id||`${slug(name)}-${Math.random().toString(36).slice(2,8)}`;
  return{schema:'conscience64/human-tool/v1',id,name,description:clean(tool.description||''),createdAt:created,updatedAt:now(),
    interface:{subject:clean(tool.interface?.subject||'Conscience64 Space Lens'),motivator:clean(tool.interface?.motivator||''),request:clean(tool.interface?.request||''),obligation:clean(tool.interface?.obligation||''),surface:clean(tool.interface?.surface||''),outputDefinition:clean(tool.interface?.outputDefinition||'')},
    card:{question:clean(tool.card?.question||''),need:clean(tool.card?.need||''),limit:clean(tool.card?.limit||''),try:clean(tool.card?.try||''),left:clean(tool.card?.left||'')},
    steps:(tool.steps||[]).map((s,i)=>({id:s.id||`step-${i+1}`,type:STEP_TYPES[s.type]?s.type:'note',template:String(s.template??STEP_TYPES[s.type]?.defaultTemplate??'{{previous}}'),providers:Array.isArray(s.providers)?s.providers:undefined}))};
}
function templateVars(tool,input,trace){
  const previous=trace.length?summarize(trace.at(-1).output):'';
  const vars={input,question:tool.card.question,need:tool.card.need,limit:tool.card.limit,try:tool.card.try,left:tool.card.left,subject:tool.interface.subject,motivator:tool.interface.motivator,request:tool.interface.request,obligation:tool.interface.obligation,surface:tool.interface.surface,output:tool.interface.outputDefinition,previous};
  trace.forEach((x,i)=>{vars[`step${i+1}`]=summarize(x.output);});return vars;
}
function renderTemplate(text,vars){return String(text??'').replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g,(_,k)=>String(vars[k]??''));}
function summarize(value){
  if(value==null)return'';if(typeof value==='string')return value;
  if(value.answer)return clean(value.answer);
  if(Array.isArray(value.results))return value.results.slice(0,4).map(x=>x.title||x.label||x.logicalId||x.id).filter(Boolean).join(' | ');
  if(value.O)return typeof value.O==='string'?value.O:JSON.stringify(value.O);
  try{return JSON.stringify(value);}catch{return String(value);}
}
function observed(step,output){const s=summarize(output);return `${STEP_TYPES[step.type]?.label||step.type}: ${s||'completed with no textual summary'}`.slice(0,1200);}
function nextHint(tool,run){
  if(!tool.card.question)return'Start with a Question.';
  if(!tool.card.need&&!tool.interface.obligation)return'Add a Need / Obligation: what must this preserve or accomplish?';
  if(!tool.card.limit)return'Add a Limit if something must not be assumed, changed, exposed, or exceeded.';
  if(!tool.card.try&&!tool.steps.length)return'Add a Try or at least one bounded tool step.';
  if(!(run?.saw||[]).length)return'Run the tool, then record only what it actually returned as Saw.';
  if(!tool.card.left)return'Record what is Left unresolved—or add a Thought separately if you have an interpretation.';
  return'The card is populated. Compare Saw with Need, then think, decide, or run another bounded probe.';
}

async function executeStep(step,tool,input,trace){
  const vars=templateVars(tool,input,trace),arg=clean(renderTemplate(step.template,vars));
  if(step.type==='ask'){if(!qa())throw new Error('Space Lens QA is unavailable.');return qa().answer(arg);}
  if(step.type==='local-search'){if(!local())throw new Error('Local Search is unavailable.');return local().search(arg,{limit:8});}
  if(step.type==='web-search'){if(!web())throw new Error('Web Search is unavailable.');return web().search(arg,{providers:step.providers||undefined});}
  if(step.type==='project'){const a=api();if(!a)throw new Error('Conscience64 API is unavailable.');return a.projects.reflow(arg)||{status:'UNRESOLVED_PROJECT',id:arg};}
  if(step.type==='record'){const a=api();if(!a)throw new Error('Conscience64 API is unavailable.');return a.get(arg)||{status:'UNRESOLVED_RECORD',id:arg};}
  if(step.type==='remember'){if(!mem())throw new Error('Local memory is unavailable.');const q=tool.card.question||tool.name;mem().teach(q,arg,`Human Builder tool: ${tool.name}`);return{remembered:true,question:q,text:arg};}
  return arg;
}
async function runTool(toolOrId,input=''){
  const tool=typeof toolOrId==='string'?getTool(toolOrId):normalizeTool(toolOrId);if(!tool)throw new Error('Human tool not found.');
  const trace=[],saw=[],startedAt=now();
  for(const step of tool.steps){const started=performance?.now?.()??Date.now();try{const output=await executeStep(step,tool,input,trace);const entry={step:clone(step),status:'OK',output,elapsedMs:Math.round((performance?.now?.()??Date.now())-started)};trace.push(entry);saw.push(observed(step,output));}catch(err){const entry={step:clone(step),status:'ERROR',error:String(err?.message||err),elapsedMs:Math.round((performance?.now?.()??Date.now())-started)};trace.push(entry);saw.push(`${STEP_TYPES[step.type]?.label||step.type} failed: ${entry.error}`);}}
  const final=trace.length?trace.at(-1).output:null,run={id:`run-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,toolId:tool.id,toolName:tool.name,input:String(input),startedAt,finishedAt:now(),interface:clone(tool.interface),card:clone(tool.card),saw,thoughts:[],decision:'',trace,output:final,next:nextHint(tool,{saw})};
  const state=load();state.runs.push(run);save(state);CURRENT_RUN=run;return clone(run);
}
function updateRunReflection(runId,{thought,decision,left}={}){const state=load(),run=state.runs.find(r=>r.id===runId);if(!run)return null;if(clean(thought))run.thoughts.push({text:clean(thought),at:now(),epistemic:'PROPOSED'});if(clean(decision))run.decision=clean(decision);if(clean(left))run.card.left=clean(left);save(state);CURRENT_RUN=run;return clone(run);}

function starter(kind){
  const base={name:'Research Cycle',description:'Human-facing bounded research cycle.',interface:{subject:'Conscience64 Space Lens',motivator:'Understand a question without hiding uncertainty.',request:'Investigate the user input.',obligation:'Keep observation separate from interpretation and preserve unresolved remainder.',surface:'Current user input plus selected search surfaces.',outputDefinition:'A readable answer, observed evidence, and explicit remainder.'},card:{question:'{{input}}',need:'Return something useful without overstating evidence.',limit:'Do not treat related material as proof.',try:'Search and answer using bounded tools.',left:''},steps:[]};
  if(kind==='research'){base.name='Research Cycle';base.steps=[{type:'local-search',template:'{{input}}'},{type:'web-search',template:'{{input}}',providers:['wikipedia','openalex','crossref','archive','github']},{type:'ask',template:'{{input}}'}];}
  else if(kind==='search'){base.name='Search + Answer';base.steps=[{type:'local-search',template:'{{input}}'},{type:'web-search',template:'{{input}}'},{type:'ask',template:'{{input}}'}];}
  else if(kind==='compare'){base.name='Compare Evidence';base.description='Collect local and public-source observations before interpretation.';base.steps=[{type:'local-search',template:'{{input}}'},{type:'web-search',template:'{{input}}'},{type:'note',template:'Local: {{step1}}\nWeb: {{step2}}'}];}
  else if(kind==='build'){base.name='Build Something';base.interface.motivator='Turn a human request into a bounded build plan.';base.interface.outputDefinition='A usable plan with explicit constraints and unresolved remainder.';base.steps=[{type:'ask',template:'Given this build request: {{input}}. Need: {{need}}. Limit: {{limit}}. Produce the smallest usable next plan.'},{type:'remember',template:'{{previous}}'}];}
  return normalizeTool(base);
}

function ensureUI(){
  if(typeof document==='undefined'||document.getElementById('human-builder'))return;
  const actions=document.querySelector('.lens-actions');if(actions&&!actions.querySelector('[data-lens-action="human-builder"]')){const b=document.createElement('button');b.type='button';b.dataset.lensAction='human-builder';b.textContent='Human Builder';actions.prepend(b);}
  const readout=document.querySelector('.space-readout');if(!readout)return;
  const style=document.createElement('style');style.textContent=`
  .human-builder{margin:.8rem 0 1rem;padding:1rem;border:1px solid #405071;border-radius:.9rem;background:rgba(6,10,20,.98)}.human-builder[hidden]{display:none}.hb-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;flex-wrap:wrap}.hb-head h3{margin:0;font:700 1rem ui-sans-serif,system-ui}.hb-note{color:#9eabc4;font-size:.78rem;max-width:76ch}.hb-tabs,.hb-actions,.hb-starters{display:flex;gap:.45rem;flex-wrap:wrap}.hb-tabs button,.hb-actions button,.hb-starters button,.hb-step button,.hb-run button{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.5rem .7rem;cursor:pointer}.hb-tabs button[aria-selected="true"]{border-color:#8dd8ff;background:#152239}.hb-pane{margin-top:.8rem}.hb-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.hb-field{display:grid;gap:.25rem}.hb-field label{font-size:.74rem;color:#b9c4d8}.hb-field input,.hb-field textarea,.hb-field select,.hb-use textarea{width:100%;border:1px solid #405071;background:#080d19;color:#eef4ff;border-radius:.5rem;padding:.6rem;font:inherit}.hb-field textarea{min-height:4.6rem}.hb-section{margin:1rem 0 .45rem;font:700 .85rem ui-sans-serif,system-ui;color:#a9e9db}.hb-card{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem}.hb-steps{display:grid;gap:.55rem;margin:.65rem 0}.hb-step{border:1px solid #26314b;border-radius:.6rem;padding:.65rem;background:rgba(17,26,43,.72)}.hb-step-head{display:flex;justify-content:space-between;gap:.5rem;align-items:center}.hb-step textarea{width:100%;min-height:3.5rem;margin-top:.45rem;border:1px solid #405071;background:#080d19;color:#eef4ff;border-radius:.5rem;padding:.55rem}.hb-use{display:grid;gap:.65rem}.hb-run-output{border:1px solid #26314b;border-radius:.65rem;padding:.75rem;background:rgba(17,26,43,.65)}.hb-saw{display:grid;gap:.35rem;margin:.4rem 0}.hb-saw div{border-left:3px solid #8dd8ff;padding:.4rem .55rem;color:#d4dceb}.hb-reflect{display:grid;grid-template-columns:1fr 1fr;gap:.55rem}.hb-saved{display:grid;gap:.55rem}.hb-saved-card{border:1px solid #26314b;border-radius:.65rem;padding:.7rem}.hb-close{border:0;background:transparent;color:#a9e9db;cursor:pointer}.hb-next{color:#ffd486;font-size:.8rem}.hb-output{white-space:pre-wrap;word-break:break-word;color:#eef4ff}@media(max-width:760px){.hb-grid,.hb-card,.hb-reflect{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
  const panel=document.createElement('section');panel.id='human-builder';panel.className='human-builder';panel.hidden=true;panel.innerHTML=`<div class="hb-head"><div><h3>Human Builder</h3><p class="hb-note">Use or build bounded Space Lens tools with the Library human interface: Subject → Motivator → Request → Obligation → Surface → Output Definition, plus Question / Need / Limit / Try / Saw / Left.</p></div><button type="button" id="hb-close" class="hb-close">Close</button></div><div class="hb-tabs" role="tablist"><button type="button" data-hb-tab="use" aria-selected="true">Use</button><button type="button" data-hb-tab="build">Build</button><button type="button" data-hb-tab="saved">Saved</button></div><div id="hb-use" class="hb-pane"></div><div id="hb-build" class="hb-pane" hidden></div><div id="hb-saved" class="hb-pane" hidden></div>`;readout.appendChild(panel);renderBuild(starter('research'));renderUse();renderSaved();
}
function field(label,key,value='',textarea=false){return `<div class="hb-field"><label>${esc(label)}</label>${textarea?`<textarea data-hb-field="${esc(key)}">${esc(value)}</textarea>`:`<input data-hb-field="${esc(key)}" value="${esc(value)}">`}</div>`;}
function renderBuild(tool){CURRENT_TOOL=normalizeTool(tool);const pane=document.getElementById('hb-build');if(!pane)return;const t=CURRENT_TOOL;pane.innerHTML=`<div class="hb-section">Starter shapes</div><div class="hb-starters"><button type="button" data-hb-starter="research">Research Cycle</button><button type="button" data-hb-starter="search">Search + Answer</button><button type="button" data-hb-starter="compare">Compare Evidence</button><button type="button" data-hb-starter="build">Build Something</button></div><div class="hb-section">Tool</div><div class="hb-grid">${field('Name','name',t.name)}${field('Description','description',t.description,true)}</div><div class="hb-section">Interaction interface</div><div class="hb-grid">${field('Subject','interface.subject',t.interface.subject)}${field('Motivator','interface.motivator',t.interface.motivator,true)}${field('Request','interface.request',t.interface.request,true)}${field('Obligation','interface.obligation',t.interface.obligation,true)}${field('Surface','interface.surface',t.interface.surface,true)}${field('Output Definition','interface.outputDefinition',t.interface.outputDefinition,true)}</div><div class="hb-section">Research Card</div><div class="hb-card">${field('Question','card.question',t.card.question,true)}${field('Need','card.need',t.card.need,true)}${field('Limit','card.limit',t.card.limit,true)}${field('Try','card.try',t.card.try,true)}${field('Left','card.left',t.card.left,true)}</div><p class="hb-note">Saw is populated by actual tool results at runtime. Thought and Decision remain separate from observations.</p><div class="hb-section">Steps</div><div id="hb-steps" class="hb-steps">${t.steps.map((s,i)=>stepHtml(s,i)).join('')}</div><div class="hb-actions"><select id="hb-add-step">${Object.entries(STEP_TYPES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select><button type="button" id="hb-add-step-btn">Add step</button><button type="button" id="hb-save-tool">Save tool</button><button type="button" id="hb-save-use">Save + Use</button></div><p id="hb-next-build" class="hb-next">${esc(nextHint(t,null))}</p>`;}
function stepHtml(s,i){return `<div class="hb-step" data-step-index="${i}"><div class="hb-step-head"><strong>${i+1}. ${esc(STEP_TYPES[s.type]?.label||s.type)}</strong><div><button type="button" data-step-up="${i}" aria-label="Move step up">↑</button><button type="button" data-step-down="${i}" aria-label="Move step down">↓</button><button type="button" data-step-remove="${i}">Remove</button></div></div><textarea data-step-template="${i}" aria-label="Step ${i+1} template">${esc(s.template)}</textarea><small>${esc(STEP_TYPES[s.type]?.help||'')}</small></div>`;}
function pullBuild(){const t=clone(CURRENT_TOOL||starter('research'));document.querySelectorAll('#hb-build [data-hb-field]').forEach(el=>{const path=el.dataset.hbField.split('.');let o=t;for(let i=0;i<path.length-1;i++)o=o[path[i]];o[path.at(-1)]=el.value;});document.querySelectorAll('#hb-build [data-step-template]').forEach(el=>{const i=Number(el.dataset.stepTemplate);if(t.steps[i])t.steps[i].template=el.value;});CURRENT_TOOL=normalizeTool(t);return CURRENT_TOOL;}
function renderUse(selectedId){const pane=document.getElementById('hb-use');if(!pane)return;const tools=listTools(),id=selectedId||tools[0]?.id||'';pane.innerHTML=`<div class="hb-use"><div class="hb-field"><label>Tool</label><select id="hb-use-tool"><option value="">Choose a saved tool…</option>${tools.map(t=>`<option value="${esc(t.id)}" ${t.id===id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div><div class="hb-field"><label>Input</label><textarea id="hb-use-input" placeholder="What do you want this tool to work on?"></textarea></div><button type="button" id="hb-run-tool" class="hb-run">Run tool</button><div id="hb-run-output"></div></div>`;}
function renderRun(run){const box=document.getElementById('hb-run-output');if(!box)return;box.innerHTML=`<div class="hb-run-output"><strong>${esc(run.toolName)}</strong><p class="hb-next">${esc(run.next)}</p><div class="hb-section">Saw</div><div class="hb-saw">${run.saw.map(x=>`<div>${esc(x)}</div>`).join('')}</div><div class="hb-section">Output</div><div class="hb-output">${esc(summarize(run.output)||'No final textual output.')}</div><div class="hb-section">Reflection — kept separate from Saw</div><div class="hb-reflect"><div class="hb-field"><label>Thought</label><textarea id="hb-thought" placeholder="Interpretation, hypothesis, comparison…"></textarea></div><div class="hb-field"><label>Decision</label><textarea id="hb-decision" placeholder="What will you do next?"></textarea></div></div><div class="hb-field"><label>Left unresolved</label><textarea id="hb-left" placeholder="What still remains unexplained?">${esc(run.card.left||'')}</textarea></div><button type="button" id="hb-save-reflection">Save reflection</button></div>`;}
function renderSaved(){const pane=document.getElementById('hb-saved');if(!pane)return;const tools=listTools();pane.innerHTML=`<div class="hb-actions"><button type="button" id="hb-export">Export tools</button><button type="button" id="hb-import">Import tools</button><input type="file" id="hb-import-file" accept="application/json,.json" hidden></div><div class="hb-saved">${tools.length?tools.map(t=>`<article class="hb-saved-card"><strong>${esc(t.name)}</strong><p class="hb-note">${esc(t.description||t.interface.request||'Human-built Space Lens tool')}</p><div class="hb-actions"><button type="button" data-hb-run-saved="${esc(t.id)}">Use</button><button type="button" data-hb-edit="${esc(t.id)}">Edit</button><button type="button" data-hb-delete="${esc(t.id)}">Delete</button></div></article>`).join(''):'<p>No saved tools yet. Build one or start from a template.</p>'}</div>`;}
function switchTab(name){document.querySelectorAll('[data-hb-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.hbTab===name)));for(const n of['use','build','saved'])document.getElementById(`hb-${n}`).hidden=n!==name;}
function open(tab='use'){ensureUI();const p=document.getElementById('human-builder');if(!p)return;p.hidden=false;switchTab(tab);}
function download(){const blob=new Blob([exportText()],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`conscience64-human-tools-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function install(){ensureUI();document.addEventListener('click',async e=>{
  if(e.target.closest?.('[data-lens-action="human-builder"]')){e.preventDefault();open('use');return;}if(e.target.id==='hb-close'){document.getElementById('human-builder').hidden=true;return;}
  const tab=e.target.closest?.('[data-hb-tab]');if(tab){switchTab(tab.dataset.hbTab);return;}
  const st=e.target.closest?.('[data-hb-starter]');if(st){renderBuild(starter(st.dataset.hbStarter));switchTab('build');return;}
  if(e.target.id==='hb-add-step-btn'){const t=pullBuild(),type=document.getElementById('hb-add-step').value;t.steps.push({id:`step-${t.steps.length+1}`,type,template:STEP_TYPES[type].defaultTemplate});renderBuild(t);return;}
  const up=e.target.closest?.('[data-step-up]'),down=e.target.closest?.('[data-step-down]'),rem=e.target.closest?.('[data-step-remove]');if(up||down||rem){const t=pullBuild(),i=Number((up||down||rem).dataset[up?'stepUp':down?'stepDown':'stepRemove']);if(rem)t.steps.splice(i,1);else{const j=up?i-1:i+1;if(j>=0&&j<t.steps.length)[t.steps[i],t.steps[j]]=[t.steps[j],t.steps[i]];}renderBuild(t);return;}
  if(e.target.id==='hb-save-tool'||e.target.id==='hb-save-use'){const t=putTool(pullBuild());renderSaved();renderUse(t.id);if(e.target.id==='hb-save-use')switchTab('use');e.target.textContent='Saved';return;}
  if(e.target.id==='hb-run-tool'){const id=document.getElementById('hb-use-tool').value,input=document.getElementById('hb-use-input').value;if(!id)return;const btn=e.target;btn.disabled=true;btn.textContent='Running…';try{const run=await runTool(id,input);renderRun(run);}finally{btn.disabled=false;btn.textContent='Run tool';}return;}
  if(e.target.id==='hb-save-reflection'&&CURRENT_RUN){const r=updateRunReflection(CURRENT_RUN.id,{thought:document.getElementById('hb-thought').value,decision:document.getElementById('hb-decision').value,left:document.getElementById('hb-left').value});renderRun(r);return;}
  const use=e.target.closest?.('[data-hb-run-saved]');if(use){renderUse(use.dataset.hbRunSaved);switchTab('use');return;}const edit=e.target.closest?.('[data-hb-edit]');if(edit){renderBuild(getTool(edit.dataset.hbEdit));switchTab('build');return;}const del=e.target.closest?.('[data-hb-delete]');if(del){deleteTool(del.dataset.hbDelete);renderSaved();renderUse();return;}
  if(e.target.id==='hb-export'){download();return;}if(e.target.id==='hb-import'){document.getElementById('hb-import-file').click();return;}
  });
  document.getElementById('hb-import-file')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{importText(await f.text());renderSaved();renderUse();}catch(err){alert(String(err?.message||err));}e.target.value='';});
}

const API=Object.freeze({schema:SCHEMA,version:'1.0.0',stepTypes:()=>clone(STEP_TYPES),list:listTools,get:getTool,save:putTool,remove:deleteTool,starter,run:runTool,reflect:updateRunReflection,exportText,importText,clear,open});
globalThis.SpaceLensHumanBuilder=API;
if(typeof document!=='undefined'){addEventListener('conscience64-ready',install,{once:true});if(api())install();}
})();
