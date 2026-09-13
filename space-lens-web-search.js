(()=>{
'use strict';

const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const memory=()=>globalThis.SpaceLensMemory||null;
const local=()=>globalThis.SpaceLensLocalSearch||null;
const MAX_PER_PROVIDER=6;
let LAST=null;

function stripHtml(s){
  if(!s)return'';
  if(typeof document!=='undefined'){const d=document.createElement('div');d.innerHTML=String(s);return clean(d.textContent||'');}
  return clean(String(s).replace(/<[^>]*>/g,' '));
}
function yearFromParts(parts){try{return parts?.['date-parts']?.[0]?.[0]||'';}catch{return'';}}
async function json(url,options={}){const r=await fetch(url,options);if(!r.ok)throw new Error(`${r.status} ${r.statusText||'request failed'}`);return r.json();}

async function wikipedia(query){
  const q=encodeURIComponent(query),data=await json(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=${MAX_PER_PROVIDER}&format=json&origin=*`);
  return (data?.query?.search||[]).map(x=>({provider:'Wikipedia',title:x.title,snippet:stripHtml(x.snippet),url:`https://en.wikipedia.org/wiki/${encodeURIComponent(String(x.title).replaceAll(' ','_'))}`,meta:'encyclopedia'}));
}
async function openalex(query){
  const q=encodeURIComponent(query),data=await json(`https://api.openalex.org/works?search=${q}&per-page=${MAX_PER_PROVIDER}`);
  return (data?.results||[]).map(x=>({provider:'OpenAlex',title:x.display_name||x.title||'Untitled work',snippet:clean([x.publication_year,x.primary_location?.source?.display_name,(x.authorships||[]).slice(0,3).map(a=>a.author?.display_name).filter(Boolean).join(', ')].filter(Boolean).join(' · ')),url:x.doi||x.primary_location?.landing_page_url||x.id||'',meta:'scholarly work'}));
}
async function crossref(query){
  const q=encodeURIComponent(query),data=await json(`https://api.crossref.org/works?query=${q}&rows=${MAX_PER_PROVIDER}`);
  return (data?.message?.items||[]).map(x=>({provider:'Crossref',title:Array.isArray(x.title)?x.title[0]:x.title||'Untitled work',snippet:clean([yearFromParts(x.published||x['published-print']||x['published-online']),Array.isArray(x['container-title'])?x['container-title'][0]:x['container-title'],(x.author||[]).slice(0,3).map(a=>[a.given,a.family].filter(Boolean).join(' ')).filter(Boolean).join(', ')].filter(Boolean).join(' · ')),url:x.URL||(x.DOI?`https://doi.org/${x.DOI}`:''),meta:'publication metadata'}));
}
async function internetArchive(query){
  const q=encodeURIComponent(query),data=await json(`https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&fl[]=title&fl[]=description&fl[]=creator&fl[]=year&rows=${MAX_PER_PROVIDER}&page=1&output=json`);
  return (data?.response?.docs||[]).map(x=>({provider:'Internet Archive',title:Array.isArray(x.title)?x.title[0]:x.title||x.identifier||'Archive item',snippet:clean([Array.isArray(x.creator)?x.creator.join(', '):x.creator,x.year,Array.isArray(x.description)?x.description[0]:x.description].filter(Boolean).join(' · ')).slice(0,380),url:x.identifier?`https://archive.org/details/${encodeURIComponent(x.identifier)}`:'',meta:'archive item'}));
}
async function githubRepos(query){
  const q=encodeURIComponent(query),data=await json(`https://api.github.com/search/repositories?q=${q}&per_page=${MAX_PER_PROVIDER}`,{headers:{Accept:'application/vnd.github+json'}});
  return (data?.items||[]).map(x=>({provider:'GitHub',title:x.full_name||x.name||'Repository',snippet:clean(x.description||`Repository with ${x.stargazers_count||0} stars`),url:x.html_url||'',meta:'repository'}));
}

const PROVIDERS={wikipedia,openalex,crossref,archive:internetArchive,github:githubRepos};
const LABELS={wikipedia:'Wikipedia',openalex:'OpenAlex',crossref:'Crossref',archive:'Internet Archive',github:'GitHub'};

async function search(query,{providers=['wikipedia','openalex','crossref','archive','github']}={}){
  const q=clean(query);if(!q)throw new TypeError('Search query is required.');
  const selected=[...new Set(providers)].filter(p=>PROVIDERS[p]);
  const settled=await Promise.allSettled(selected.map(async p=>({provider:p,results:await PROVIDERS[p](q)})));
  const results=[],errors=[];
  settled.forEach((s,i)=>{const p=selected[i];if(s.status==='fulfilled')results.push(...s.value.results);else errors.push({provider:LABELS[p]||p,error:String(s.reason?.message||s.reason)});});
  const out={query:q,providers:selected,total:results.length,results,errors,searchedAt:new Date().toISOString(),network:true};LAST=out;return out;
}

function remember(result,query){
  const m=memory();if(!m)return;
  const text=`${result.title}${result.snippet?': '+result.snippet:''}${result.url?' Source: '+result.url:''}`;
  m.teach?.(`Web result: ${result.title}`,text,`Saved from ${result.provider} while searching: ${query}`);
  m.rememberAlias?.(result.title,result.title);
}

function ensureUI(){
  if(typeof document==='undefined'||document.getElementById('space-web-search'))return;
  const actions=document.querySelector('.lens-actions');
  if(actions&&!actions.querySelector('[data-lens-action="web-search"]')){const b=document.createElement('button');b.type='button';b.dataset.lensAction='web-search';b.textContent='Web Search';actions.prepend(b);}
  const readout=document.querySelector('.space-readout');if(!readout)return;
  const style=document.createElement('style');style.textContent=`
    .web-search{margin:.8rem 0 1rem;padding:1rem;border:1px solid #405071;border-radius:.85rem;background:rgba(7,11,22,.97)}.web-search[hidden]{display:none}.web-search-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;flex-wrap:wrap}.web-search h3{margin:0;font:700 1rem ui-sans-serif,system-ui}.web-search-note{margin:.25rem 0;color:#9eabc4;font-size:.78rem;max-width:75ch}.web-search-form{display:grid;grid-template-columns:minmax(14rem,1fr) auto;gap:.5rem;margin:.8rem 0}.web-search-form input{min-width:0;border:1px solid #405071;background:#080d19;color:#eef4ff;border-radius:.5rem;padding:.65rem}.web-search-form button,.web-result button{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.55rem .7rem;cursor:pointer}.web-provider-row{display:flex;gap:.75rem;flex-wrap:wrap;margin:.5rem 0 .8rem}.web-provider-row label{font-size:.78rem;color:#cbd6eb}.web-provider-row input{accent-color:#8dd8ff}.web-search-summary{color:#b9c4d8;font-size:.78rem;margin:.35rem 0}.web-results{display:grid;gap:.65rem;margin-top:.7rem}.web-result{padding:.8rem .85rem;border:1px solid #26314b;border-radius:.65rem;background:rgba(17,26,43,.72)}.web-result h4{margin:0;font:700 .96rem ui-sans-serif,system-ui}.web-result p{margin:.45rem 0;color:#c7d1e4;font:400 .84rem/1.5 ui-sans-serif,system-ui}.web-result-meta{display:flex;gap:.4rem;flex-wrap:wrap;margin:.3rem 0}.web-badge{border:1px solid #405071;border-radius:999px;padding:.15rem .45rem;color:#cbd6eb;font-size:.68rem}.web-result-actions{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.55rem}.web-result-actions a{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.5rem;padding:.55rem .7rem;text-decoration:none}.web-errors{margin-top:.65rem;color:#d8b9a4;font-size:.75rem}.web-search-close{border:0;background:transparent;color:#a9e9db;cursor:pointer}@media(max-width:640px){.web-search-form{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
  const panel=document.createElement('section');panel.id='space-web-search';panel.className='web-search';panel.hidden=true;panel.innerHTML=`<div class="web-search-head"><div><h3>Web Search</h3><p class="web-search-note">Search public sources inside Conscience64. Queries are sent only to the providers you select when you press Search. Results are rendered here; opening the original source is optional.</p></div><button type="button" id="web-search-close" class="web-search-close">Close</button></div><form id="web-search-form" class="web-search-form" role="search"><label for="web-search-input" style="position:absolute;left:-10000px">Search public sources</label><input id="web-search-input" type="search" placeholder="Search Wikipedia, research, archives, GitHub…"><button type="submit">Search web inside</button></form><div class="web-provider-row">${Object.entries(LABELS).map(([id,label])=>`<label><input type="checkbox" name="web-provider" value="${id}" checked> ${esc(label)}</label>`).join('')}</div><div id="web-search-summary" class="web-search-summary">No external query has been sent.</div><div id="web-results" class="web-results"></div><div id="web-errors" class="web-errors"></div>`;readout.appendChild(panel);
}
function checkedProviders(){return[...document.querySelectorAll('input[name="web-provider"]:checked')].map(x=>x.value);}
function render(out){
  const results=document.getElementById('web-results'),summary=document.getElementById('web-search-summary'),errors=document.getElementById('web-errors');if(!results)return;results.replaceChildren();summary.textContent=`${out.total} in-page result${out.total===1?'':'s'} from ${out.providers.length} selected public source${out.providers.length===1?'':'s'}.`;
  for(const r of out.results){const card=document.createElement('article');card.className='web-result';card._webResult=r;card.innerHTML=`<h4>${esc(r.title)}</h4><div class="web-result-meta"><span class="web-badge">${esc(r.provider)}</span><span class="web-badge">${esc(r.meta||'public result')}</span></div><p>${esc(r.snippet||'No summary supplied by this source.')}</p><div class="web-result-actions"><button type="button" data-web-remember="1">Save to local memory</button><button type="button" data-web-ask="1">Ask Space Lens</button>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open source</a>`:''}</div>`;results.appendChild(card);}
  errors.textContent=out.errors.length?`Unavailable this search: ${out.errors.map(e=>`${e.provider} (${e.error})`).join(' · ')}`:'';
}
async function run(){
  const input=document.getElementById('web-search-input'),summary=document.getElementById('web-search-summary');if(!input)return;const q=input.value.trim();if(!q)return;summary.textContent='Searching selected public sources inside Conscience64…';document.getElementById('web-results').replaceChildren();document.getElementById('web-errors').textContent='';
  try{const out=await search(q,{providers:checkedProviders()});render(out);}catch(err){summary.textContent=`Search failed: ${String(err?.message||err)}`;}
}
function open(query=''){
  ensureUI();const panel=document.getElementById('space-web-search');if(!panel)return;panel.hidden=false;const input=document.getElementById('web-search-input');input.value=query||document.getElementById('space-search')?.value||'';input.focus();
}
function install(){
  ensureUI();
  document.addEventListener('click',e=>{
    const openButton=e.target.closest?.('[data-lens-action="web-search"]');if(openButton){e.preventDefault();open();return;}
    if(e.target.id==='web-search-close'){document.getElementById('space-web-search').hidden=true;return;}
    const card=e.target.closest?.('.web-result');if(!card)return;const r=card._webResult,q=document.getElementById('web-search-input')?.value||LAST?.query||'';
    if(e.target.closest?.('[data-web-remember]')){remember(r,q);e.target.textContent='Saved locally';globalThis.SpaceLensLocalSearch?.rebuild?.();return;}
    if(e.target.closest?.('[data-web-ask]')){const input=document.getElementById('space-search');if(input){input.value=`Tell me about ${r.title}`;input.focus();input.form?.requestSubmit?.();}return;}
  });
  document.getElementById('web-search-form')?.addEventListener('submit',e=>{e.preventDefault();run();});
}

const API=Object.freeze({version:'1.0.0',providers:cloneLabels=>cloneLabels?{...LABELS}:Object.keys(LABELS),search,open,last:()=>LAST});
globalThis.SpaceLensWebSearch=API;
if(typeof document!=='undefined'){addEventListener('conscience64-ready',install,{once:true});if(globalThis.Conscience64API)install();}
})();