import {DIMENSION_KEYS,ROUTE_REGISTRY,validateRegistry} from './route-registry.mjs';

export const WEIGHTS=Object.freeze({
  version:'1.0.0',
  explicitIntent:6,
  dimensionMatch:1.5,
  relationStrength:2.5,
  graphCloseness:1.5,
  currentTaskContinuity:1,
  historyUtility:2.5,
  provenanceQuality:.2,
  contradictionPenalty:1.5
});

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const uniq=a=>[...new Set(a)];
export function tokenize(value){
  return String(value??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(Boolean);
}
function tokensOf(values){return uniq((Array.isArray(values)?values:[values]).flatMap(tokenize));}
function routeTokens(route){
  return new Set(tokensOf([
    route.id,route.title,route.kind,route.status,route.ownerDomain,route.epistemicRole,
    ...route.keywords,...route.workIds,
    ...DIMENSION_KEYS.flatMap(k=>route.dimensions[k])
  ]));
}
export function normalizeSnapshot(snapshot={},registry=ROUTE_REGISTRY){
  const ids=new Set(registry.routes.map(r=>r.id));
  const currentRoute=ids.has(snapshot.currentRoute)?snapshot.currentRoute:registry.primaryRoute;
  const explicitIntentTokens=tokensOf(snapshot.explicitIntentTokens||[]);
  const recentActions=(Array.isArray(snapshot.recentActions)?snapshot.recentActions:[]).map(String).slice(-12);
  const selectedFacet=snapshot.selectedFacet==null?null:String(snapshot.selectedFacet);
  const historyDepth=Math.max(0,Math.min(12,Math.trunc(Number(snapshot.historyDepth)||0)));
  const accessibilityMode=['standard','reduced-motion','forced-colors'].includes(snapshot.accessibilityMode)?snapshot.accessibilityMode:'standard';
  const timestampBucket=snapshot.timestampBucket==null?'session':String(snapshot.timestampBucket);
  return Object.freeze({currentRoute,explicitIntentTokens:Object.freeze(explicitIntentTokens),recentActions:Object.freeze(recentActions),selectedFacet,historyDepth,accessibilityMode,timestampBucket});
}

function adjacency(registry){
  const map=new Map(registry.routes.map(r=>[r.id,new Set()]));
  for(const r of registry.routes)for(const e of r.relations){map.get(r.id)?.add(e.to);map.get(e.to)?.add(r.id);}
  return map;
}
function distancesFrom(start,registry){
  const adj=adjacency(registry),dist=new Map([[start,0]]),q=[start];
  for(let i=0;i<q.length;i++){
    const id=q[i],d=dist.get(id);
    for(const n of adj.get(id)||[])if(!dist.has(n)){dist.set(n,d+1);q.push(n);}
  }
  return dist;
}
const REL_STRENGTH=Object.freeze({opens:1,'navigates-to':1,'returns-to':.7,'related-to':.45,references:.55,'inspired-by':.4,'predecessor-of':.8,'successor-of':.8,'depends-on':.7,'history-of':.8,'part-of':.65,'index-of':.65,'creates-with':.85,'creates-content-for':.85,'has-reference-visuals':.75,'has-history':.8,'neighbor-game':.55,'cooperates-with':.5,'links-to':.5});
function directRelation(current,candidate,registry){
  const c=registry.routes.find(r=>r.id===current),r=registry.routes.find(x=>x.id===candidate);
  const forward=c?.relations.find(e=>e.to===candidate),back=r?.relations.find(e=>e.to===current);
  const edge=forward||back;
  return edge?{type:edge.type,strength:REL_STRENGTH[edge.type]??.25}:null;
}
function recognizedRecentRoute(action,registry){
  const m=String(action).match(/^(?:opened|focused|selected):([a-z0-9-]+)$/);
  if(!m)return null;
  return registry.routes.some(r=>r.id===m[1])?m[1]:null;
}
function sharedExplicit(route,intent){const rt=routeTokens(route);return intent.filter(t=>rt.has(t));}
function dimensionMatches(route,intent){
  const intentSet=new Set(intent),out=[];
  for(const key of DIMENSION_KEYS)for(const raw of route.dimensions[key]){
    const ts=tokenize(raw);if(ts.some(t=>intentSet.has(t)))out.push(`${key}:${raw}`);
  }
  return uniq(out);
}
function evidenceSeeking(intent){return intent.some(t=>['research','evidence','proof','verify','claim','experiment','hodge','science'].includes(t));}
function historySeeking(intent){return intent.some(t=>['history','restore','recover','rollback','predecessor','changed','change','diff','previous','prior'].includes(t));}

export function rankRoutes(snapshot={},registry=ROUTE_REGISTRY){
  validateRegistry(registry);
  const s=normalizeSnapshot(snapshot,registry),dist=distancesFrom(s.currentRoute,registry),historyIntent=historySeeking(s.explicitIntentTokens),evidenceIntent=evidenceSeeking(s.explicitIntentTokens);
  const recentIds=s.recentActions.map(a=>recognizedRecentRoute(a,registry)).filter(Boolean);
  const rows=registry.routes.map(route=>{
    let score=0;const matched=[];
    const explicit=sharedExplicit(route,s.explicitIntentTokens);
    if(explicit.length){score+=WEIGHTS.explicitIntent*(explicit.length/Math.max(1,s.explicitIntentTokens.length));matched.push(...explicit.map(x=>`explicit:${x}`));}
    const dm=dimensionMatches(route,s.explicitIntentTokens);
    if(dm.length){score+=WEIGHTS.dimensionMatch*Math.min(1,dm.length/3);matched.push(...dm.map(x=>`dimension:${x}`));}
    const dr=directRelation(s.currentRoute,route.id,registry);
    if(dr&&route.id!==s.currentRoute){score+=WEIGHTS.relationStrength*dr.strength;matched.push(`relation:${dr.type}`);}
    const d=dist.get(route.id);
    if(Number.isInteger(d)){score+=WEIGHTS.graphCloseness/(d+1);matched.push(`graph-distance:${d}`);}
    if(recentIds.includes(route.id)){score+=WEIGHTS.currentTaskContinuity;matched.push('recent-explicit-route-action');}
    if(historyIntent&&(route.ownerDomain==='history'||route.status==='predecessor')){score+=WEIGHTS.historyUtility*(route.ownerDomain==='history'?1:.5);matched.push('history-intent');}
    if(route.provenance?.status==='admitted'){score+=WEIGHTS.provenanceQuality;matched.push('provenance:admitted');}
    if(evidenceIntent&&route.ownerDomain==='game'&&route.epistemicRole==='none'){score-=WEIGHTS.contradictionPenalty;matched.push('penalty:evidence-seeking-vs-game-none');}
    score=Math.round(score*1e6)/1e6;
    return {route,score,confidence:0,matched:Object.freeze(uniq(matched).sort()),authorityDelta:0,evidenceDelta:0,unresolved:Object.freeze([])};
  });
  rows.sort((a,b)=>b.score-a.score||a.route.id.localeCompare(b.route.id));
  for(const row of rows)row.confidence=Math.round(clamp(row.score/(Math.abs(row.score)+5))*1e6)/1e6;
  return Object.freeze(rows.map(r=>Object.freeze(r)));
}

function sharedDimensions(a,b){
  const out=[];
  for(const k of DIMENSION_KEYS){const s=new Set(a.dimensions[k]);if(b.dimensions[k].some(v=>s.has(v)))out.push(k);}
  return out;
}
function linkedOrSharedWork(a,b){return a.relations.some(e=>e.to===b.id)||b.relations.some(e=>e.to===a.id)||a.workIds.some(x=>b.workIds.includes(x));}
export function deriveEmergentRelation(snapshot={},ranked=[]){
  const top=ranked.filter(r=>r.score>0).slice(0,6),candidates=[];
  for(let i=0;i<top.length;i++)for(let j=i+1;j<top.length;j++){
    const a=top[i].route,b=top[j].route,dims=sharedDimensions(a,b);
    if(dims.length>=2&&linkedOrSharedWork(a,b))candidates.push({a,b,dims,score:top[i].score+top[j].score});
  }
  candidates.sort((x,y)=>y.score-x.score||`${x.a.id}|${x.b.id}`.localeCompare(`${y.a.id}|${y.b.id}`));
  const best=candidates[0];if(!best)return null;
  return Object.freeze({kind:'emergentRelation',routes:Object.freeze([best.a.id,best.b.id]),dimensions:Object.freeze([...best.dims].sort()),sourceRoute:normalizeSnapshot(snapshot).currentRoute,interpretation:'Derived from converging D1–D12 context relations; this is a navigation hypothesis, not an asserted fact.'});
}
