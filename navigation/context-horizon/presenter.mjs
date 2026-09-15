import {ROUTE_REGISTRY} from './route-registry.mjs';
import {rankRoutes,normalizeSnapshot,tokenize} from './engine.mjs';
import {chooseQuestion,applyAnswer} from './questions.mjs';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const hash=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const round=(v,n=3)=>Number(Number(v).toFixed(n));
function relationFrom(row){return row.matched.find(x=>x.startsWith('relation:'))?.slice(9)||null;}
export function buildPresentation(ranked=[], {reducedMotion=false,maxHairs=8,question=null}={}){
  const eligible=ranked.filter(row=>Number.isFinite(row.score)&&row.score>0).slice(0,maxHairs);
  const max=Math.max(1,...eligible.map(row=>row.score));
  const hairs=eligible.map((row,index)=>{
    const relevance=clamp(row.score/max),relation=relationFrom(row),disclosure=index===0?'focused':index<=2?'close':index<=5?'near':'far';
    return Object.freeze({
      routeId:row.route.id,title:row.route.title,href:row.route.href,ownerDomain:row.route.ownerDomain,epistemicRole:row.route.epistemicRole,
      rank:index+1,score:row.score,confidence:row.confidence,relevance:round(relevance),angle:hash(row.route.id)%360,
      radialPct:round(24+(1-relevance)*54,1),length:Math.min(62,24+row.matched.length*4),thickness:relation?2.6:1.4,
      brightness:round(.35+.65*clamp(row.confidence)),pulse:!reducedMotion&&index<2,disclosure,relation,
      explanation:row.matched.length?`Matched ${row.matched.slice(0,4).join(', ')}.`:'Nearby admitted route.',
      semanticLabel:`Rank ${index+1}: ${row.route.title}; ${row.route.ownerDomain}; ${relation?`relation ${relation}; `:''}navigation relevance ${row.score.toFixed(2)}. Navigation relevance is not evidence or authority.`
    });
  });
  const top=hairs[0]||null,second=hairs[1]||null;
  return Object.freeze({
    schema:'conscience64/context-horizon-presentation/v1',
    center:top?Object.freeze({routeId:top.routeId,title:top.title,confidence:top.confidence,ambiguityGap:round(top.score-(second?.score??0)),interpretation:'Current best navigation hypothesis; not asserted user intent.'}):null,
    hairs:Object.freeze(hairs),question:question||null,reducedMotion:Boolean(reducedMotion),
    invariants:Object.freeze(['PROXIMITY != TRUTH','RELEVANCE != EVIDENCE','CONFIDENCE != AUTHORITY','RELATION != MERGE'])
  });
}

export function detectRouteId(loc=globalThis.location,registry=ROUTE_REGISTRY){
  if(!loc)return registry.primaryRoute;
  const path=String(loc.pathname||''),search=String(loc.search||'');
  const matchesPath=rp=>rp===path||rp.replace(/^\/conscience64/,'')===path;
  const exact=registry.routes.find(r=>{const [rp,rq='']=r.href.split('?');return matchesPath(rp)&&(!rq||`?${rq}`===search);});
  if(exact)return exact.id;
  const samePath=registry.routes.filter(r=>matchesPath(r.href.split('?')[0]));
  if(samePath.length)return samePath.find(r=>!r.href.includes('?'))?.id||samePath[0].id;
  return registry.primaryRoute;
}

function ensureStyles(){
  if(document.querySelector('link[data-context-horizon-style]'))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href=new URL('./context-horizon.css',import.meta.url).href;l.dataset.contextHorizonStyle='';document.head.appendChild(l);
}
function runtimeHref(href){
  if(typeof location==='undefined')return href;
  return String(location.pathname||'').startsWith('/conscience64/')?href:href.replace(/^\/conscience64/,'');
}
function ensurePanel(routeId){
  let panel=document.getElementById('context-horizon-panel');if(panel)return panel;
  panel=document.createElement('section');panel.id='context-horizon-panel';panel.className='context-horizon-panel';panel.setAttribute('aria-labelledby','context-horizon-title');
  panel.innerHTML=`<div class="context-horizon-head"><div><p class="context-horizon-eyebrow">13D++ navigation</p><h2 id="context-horizon-title">Context Horizon</h2><p>Suggestions are navigation hypotheses. Peer domains keep their own identity, provenance, and authority.</p></div><a href="/conscience64/navigation/context-horizon/">All pages &amp; preserved works</a></div><form class="context-horizon-form" role="search"><label for="context-horizon-intent">What are you trying to reach?</label><div><input id="context-horizon-intent" type="search" autocomplete="off"><button type="submit">Orient</button></div></form><div id="context-horizon-question" class="context-horizon-question" hidden></div><p id="context-horizon-status" role="status" aria-live="polite">Context Horizon ready.</p><ol id="context-horizon-links" class="context-horizon-links"></ol><p class="context-horizon-boundary"><code>RELATION != MERGE</code> · <code>RELEVANCE != EVIDENCE</code> · <code>CONFIDENCE != AUTHORITY</code></p>`;
  panel.dataset.routeId=routeId;
  const rootReadout=document.querySelector('.space-readout');
  if(rootReadout)rootReadout.insertAdjacentElement('afterend',panel);else(document.querySelector('main')||document.body).appendChild(panel);
  return panel;
}
function ensureHairLayer(){
  const stage=document.querySelector('.space-stage');if(!stage)return null;
  let svg=document.getElementById('context-horizon-hairs');if(svg)return svg;
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='context-horizon-hairs';svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');svg.classList.add('context-horizon-hairs');stage.appendChild(svg);return svg;
}
function renderHairLayer(view){
  const svg=ensureHairLayer();if(!svg)return;svg.replaceChildren();
  for(const hair of view.hairs){
    const rad=hair.angle*Math.PI/180,r=14+hair.radialPct*.34,x=50+Math.cos(rad)*r,y=50+Math.sin(rad)*r;
    const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','50');line.setAttribute('y1','50');line.setAttribute('x2',String(x));line.setAttribute('y2',String(y));line.setAttribute('stroke-width',String(hair.thickness/2));line.setAttribute('opacity',String(hair.brightness));line.dataset.routeId=hair.routeId;line.classList.add('context-hair');if(hair.pulse)line.classList.add('context-hair-pulse');svg.appendChild(line);
    const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.setAttribute('r',String(Math.max(.8,hair.thickness*.45)));dot.setAttribute('opacity',String(hair.brightness));dot.classList.add('context-hair-dot');svg.appendChild(dot);
  }
}
function renderList(panel,view){
  const list=panel.querySelector('#context-horizon-links');list.replaceChildren();
  for(const hair of view.hairs){const li=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=runtimeHref(hair.href);a.textContent=hair.title;a.setAttribute('aria-label',hair.semanticLabel);const meta=document.createElement('span');meta.textContent=`${hair.ownerDomain} · rank ${hair.rank}${hair.relation?` · ${hair.relation}`:''}`;p.textContent=hair.disclosure==='far'?`${hair.ownerDomain} route.`:hair.explanation;li.dataset.disclosure=hair.disclosure;li.append(a,meta,p);list.appendChild(li);}
  panel.querySelector('#context-horizon-status').textContent=view.center?`Current navigation hypothesis: ${view.center.title}. ${view.hairs.length} admitted routes shown.`:'No ranked route available; use the plain route map.';
}
function renderQuestion(panel,question,onAnswer){
  const host=panel.querySelector('#context-horizon-question');host.replaceChildren();if(!question){host.hidden=true;return;}host.hidden=false;const p=document.createElement('p');p.textContent=question.prompt;host.appendChild(p);const actions=document.createElement('div');for(const opt of question.options){const b=document.createElement('button');b.type='button';b.textContent=opt.label;b.addEventListener('click',()=>onAnswer(opt.id));actions.appendChild(b);}host.appendChild(actions);
}

export function installContextHorizon({routeId=detectRouteId()}={}){
  ensureStyles();const panel=ensurePanel(routeId),form=panel.querySelector('.context-horizon-form'),input=panel.querySelector('#context-horizon-intent');
  let snapshot={currentRoute:routeId,explicitIntentTokens:[],recentActions:[],selectedFacet:null,historyDepth:0,accessibilityMode:matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced-motion':'standard',timestampBucket:'session'};
  const orient=()=>{const ranked=rankRoutes(snapshot),question=chooseQuestion(ranked,snapshot),view=buildPresentation(ranked,{reducedMotion:snapshot.accessibilityMode==='reduced-motion',question});renderList(panel,view);renderHairLayer(view);renderQuestion(panel,question,id=>{snapshot=applyAnswer(snapshot,question,id);orient();});dispatchEvent(new CustomEvent('context-horizon-ranking',{detail:view}));if(question)dispatchEvent(new CustomEvent('context-horizon-question',{detail:question}));return view;};
  form.addEventListener('submit',e=>{e.preventDefault();snapshot={...normalizeSnapshot(snapshot),currentRoute:routeId,explicitIntentTokens:tokenize(input.value),recentActions:[...snapshot.recentActions,`focused:${routeId}`]};orient();});
  addEventListener('space-master-route',e=>{const q=String(e.detail?.question||'').trim();if(!q)return;input.value=q;snapshot={...normalizeSnapshot(snapshot),currentRoute:routeId,explicitIntentTokens:tokenize(q),recentActions:[...snapshot.recentActions,`focused:${routeId}`]};orient();});
  document.addEventListener('click',e=>{const a=e.target.closest?.('#context-horizon-links a');if(!a)return;const id=ROUTE_REGISTRY.routes.find(r=>runtimeHref(r.href)===a.getAttribute('href')||r.href===a.getAttribute('href'))?.id;if(id)snapshot={...snapshot,recentActions:[...snapshot.recentActions,`selected:${id}`].slice(-12)};},true);
  orient();return Object.freeze({routeId,panel,orient,getSnapshot:()=>structuredClone(snapshot)});
}
