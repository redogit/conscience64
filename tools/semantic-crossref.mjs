export const CROSSREF_SCHEMA='conscience64.semantic-crossref/v1';
export const CROSSREF_BOUNDARIES=Object.freeze([
  'RELATED != SUPPORTS',
  'SEMANTIC_SIMILARITY != EVIDENCE',
  'RETRIEVAL != CORROBORATION',
  'DERIVED_EDGE != AUTHORITY_TRANSFER',
  'PRIVATE_ORIGIN != SEARCHABLE_GRAPH'
]);

const DEFAULT_TEXT_FIELDS=['title','name','label','summary','description','text','content','definition','purpose','context','notes'];
const DEFAULT_ALIAS_FIELDS=['aliases','alias','historicalAliases','names'];
const DEFAULT_TAG_FIELDS=['tags','topics','domains','categories','keywords'];
const DEFAULT_ID_FIELDS=['id','key','uid','stable_id','stableId'];
const DEFAULT_RELATION_FIELDS=['relations','links','references','crossReferences','cross_references'];
const STOPWORDS=new Set('a an and are as at be by for from has have in into is it its of on or that the their this to was were will with without within via vs versus we our you your'.split(/\s+/));

const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[_/\\]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const primitiveText=v=>{
  if(v==null)return '';
  if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return String(v);
  if(Array.isArray(v))return v.map(primitiveText).join(' ');
  return '';
};
const tokenize=s=>normalize(s).split(' ').filter(t=>t.length>=2&&!STOPWORDS.has(t)&&!/^[0-9]+$/.test(t));
const uniq=xs=>[...new Set(xs)];
const stableHash=s=>{
  let h1=0x811c9dc5,h2=0x9e3779b9;
  for(const ch of String(s)){const c=ch.codePointAt(0);h1=Math.imul(h1^c,0x01000193);h2=Math.imul(h2^c,0x85ebca6b);h1^=h1>>>13;h2^=h2>>>16;}
  return `${(h1>>>0).toString(16).padStart(8,'0')}${(h2>>>0).toString(16).padStart(8,'0')}`;
};
const pairKey=(a,b)=>a<b?`${a}\u0000${b}`:`${b}\u0000${a}`;

function valueFromFields(record,fields){return fields.flatMap(f=>arr(record?.[f])).flatMap(v=>arr(v)).map(primitiveText).filter(Boolean);}
function chooseId(record,index,fields){for(const f of fields){const v=record?.[f];if(typeof v==='string'||typeof v==='number')return String(v);}return `record:${index}`;}
function extractExplicitRelations(record,fields){
  const out=[];
  for(const field of fields){
    for(const raw of arr(record?.[field])){
      if(typeof raw==='string'||typeof raw==='number'){out.push({target:String(raw),relation:'REFERENCES'});continue;}
      if(!raw||typeof raw!=='object')continue;
      const target=raw.target??raw.target_id??raw.targetId??raw.to??raw.id??raw.key??raw.ref;
      if(target==null)continue;
      out.push({
        target:String(target),
        relation:String(raw.relation??raw.type??raw.kind??'REFERENCES').toUpperCase(),
        provenance:raw.provenance??raw.source??null,
        evidence:raw.evidence??null,
        declared:true
      });
    }
  }
  return out;
}
function vectorFrom(record,field){
  const v=record?.[field];
  if(!Array.isArray(v)||v.length===0||!v.every(Number.isFinite))return null;
  return v.map(Number);
}
function cosineVector(a,b){
  if(!a||!b||a.length!==b.length)return null;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
  if(aa===0||bb===0)return null;
  return clamp01((dot/Math.sqrt(aa*bb)+1)/2);
}
function embeddingSignature(vector,bits,table){
  let signature=0;
  for(let bit=0;bit<bits;bit++){
    let sum=0;
    for(let d=0;d<vector.length;d++){
      let x=(Math.imul(d+1,0x9e3779b1)^Math.imul(bit+1,0x85ebca6b)^Math.imul(table+1,0xc2b2ae35))|0;
      x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
      sum+=vector[d]*((x&1)?1:-1);
    }
    if(sum>=0)signature|=(1<<bit);
  }
  return `${table}:${(signature>>>0).toString(36)}`;
}
function cosineSparse(a,b){
  let dot=0,aa=0,bb=0;
  for(const v of a.values())aa+=v*v;
  for(const v of b.values())bb+=v*v;
  if(!aa||!bb)return 0;
  const [small,large]=a.size<=b.size?[a,b]:[b,a];
  for(const [k,v] of small)dot+=v*(large.get(k)||0);
  return clamp01(dot/Math.sqrt(aa*bb));
}
function jaccard(a,b){
  if(!a.size||!b.size)return 0;
  let inter=0;for(const x of a)if(b.has(x))inter++;
  return inter/(a.size+b.size-inter);
}
function normalizedAliasSet(node){return new Set([...node.aliases,node.title].map(normalize).filter(Boolean));}
function commonTop(a,b,weights,limit=6){
  const out=[];const [small,large]=a.size<=b.size?[a,b]:[b,a];
  for(const x of small)if(large.has(x))out.push(x);
  out.sort((x,y)=>(weights.get(y)||0)-(weights.get(x)||0)||x.localeCompare(y));
  return out.slice(0,limit);
}

export function buildSemanticCrossReferenceMap(records,options={}){
  if(!Array.isArray(records))throw new TypeError('records must be an array');
  const cfg={
    idFields:options.idFields??DEFAULT_ID_FIELDS,
    textFields:options.textFields??DEFAULT_TEXT_FIELDS,
    aliasFields:options.aliasFields??DEFAULT_ALIAS_FIELDS,
    tagFields:options.tagFields??DEFAULT_TAG_FIELDS,
    relationFields:options.relationFields??DEFAULT_RELATION_FIELDS,
    embeddingField:options.embeddingField??'embedding',
    threshold:Number.isFinite(options.threshold)?options.threshold:0.26,
    maxEdgesPerNode:Number.isInteger(options.maxEdgesPerNode)?Math.max(1,options.maxEdgesPerNode):24,
    maxTokenDfRatio:Number.isFinite(options.maxTokenDfRatio)?Math.max(.01,Math.min(1,options.maxTokenDfRatio)):.22,
    maxPosting:Number.isInteger(options.maxPosting)?Math.max(2,options.maxPosting):1200,
    includeText:Boolean(options.includeText),
    includeRecord:Boolean(options.includeRecord),
    weights:{lexical:.50,embedding:.35,alias:.10,tags:.05,...(options.weights||{})},
    embeddingLshBits:Number.isInteger(options.embeddingLshBits)?Math.max(4,Math.min(20,options.embeddingLshBits)):12,
    embeddingLshTables:Number.isInteger(options.embeddingLshTables)?Math.max(1,Math.min(8,options.embeddingLshTables)):3,
    maxEmbeddingBucket:Number.isInteger(options.maxEmbeddingBucket)?Math.max(2,options.maxEmbeddingBucket):600,
    includeReasons:options.includeReasons!==false
  };

  const ids=new Set();
  const nodes=records.map((record,index)=>{
    const id=chooseId(record,index,cfg.idFields);
    if(ids.has(id))throw new Error(`duplicate record id: ${id}`);ids.add(id);
    const title=String(record?.title??record?.name??record?.label??id);
    const texts=valueFromFields(record,cfg.textFields);
    const aliases=uniq(valueFromFields(record,cfg.aliasFields));
    const tags=uniq(valueFromFields(record,cfg.tagFields).flatMap(tokenize));
    const tokens=tokenize([title,...aliases,...texts].join(' '));
    const counts=new Map();for(const t of tokens)counts.set(t,(counts.get(t)||0)+1);
    const node={
      id,title,
      kind:record?.kind??record?.type??null,
      project:record?.project??record?.repository??record?.branch??null,
      provenance:record?.provenance??record?.source??record?.source_ref??null,
      aliases,tags,
      _tokenCounts:counts,
      _tokenSet:new Set(counts.keys()),
      _tagSet:new Set(tags.map(normalize)),
      _aliasSet:null,
      _embedding:vectorFrom(record,cfg.embeddingField),
      _explicit:extractExplicitRelations(record,cfg.relationFields)
    };
    node._aliasSet=normalizedAliasSet(node);
    if(cfg.includeText)node.text=texts.join('\n');
    if(cfg.includeRecord)node.record=structuredClone(record);
    return node;
  });

  const byId=new Map(nodes.map(n=>[n.id,n]));
  const df=new Map();
  for(const n of nodes)for(const t of n._tokenSet)df.set(t,(df.get(t)||0)+1);
  const N=Math.max(1,nodes.length);
  const idf=new Map([...df].map(([t,d])=>[t,1+Math.log((N+1)/(d+1))]));
  for(const n of nodes){
    n._tfidf=new Map();
    let total=0;for(const c of n._tokenCounts.values())total+=c;
    for(const [t,c] of n._tokenCounts)n._tfidf.set(t,(c/Math.max(1,total))*(idf.get(t)||1));
  }

  const inverted=new Map();let skippedPostings=0;
  const dfLimit=Math.max(2,Math.floor(N*cfg.maxTokenDfRatio));
  for(const n of nodes){
    for(const t of n._tokenSet){
      const d=df.get(t)||0;
      if(d>dfLimit||d>cfg.maxPosting){skippedPostings++;continue;}
      if(!inverted.has(t))inverted.set(t,[]);
      inverted.get(t).push(n.id);
    }
  }

  const candidates=new Set();
  for(const posting of inverted.values()){
    posting.sort();
    for(let i=0;i<posting.length;i++)for(let j=i+1;j<posting.length;j++)candidates.add(pairKey(posting[i],posting[j]));
  }
  const aliasIndex=new Map();
  for(const n of nodes)for(const a of n._aliasSet){if(!aliasIndex.has(a))aliasIndex.set(a,[]);aliasIndex.get(a).push(n.id);}
  for(const posting of aliasIndex.values()){
    if(posting.length<2||posting.length>cfg.maxPosting)continue;
    posting.sort();for(let i=0;i<posting.length;i++)for(let j=i+1;j<posting.length;j++)candidates.add(pairKey(posting[i],posting[j]));
  }
  const tagIndex=new Map();
  for(const n of nodes)for(const tag of n._tagSet){if(!tagIndex.has(tag))tagIndex.set(tag,[]);tagIndex.get(tag).push(n.id);}
  for(const posting of tagIndex.values()){
    if(posting.length<2||posting.length>cfg.maxPosting)continue;
    posting.sort();for(let i=0;i<posting.length;i++)for(let j=i+1;j<posting.length;j++)candidates.add(pairKey(posting[i],posting[j]));
  }
  const embeddingBuckets=new Map();
  for(const n of nodes){
    if(!n._embedding)continue;
    for(let table=0;table<cfg.embeddingLshTables;table++){
      const sig=embeddingSignature(n._embedding,cfg.embeddingLshBits,table);
      if(!embeddingBuckets.has(sig))embeddingBuckets.set(sig,[]);
      embeddingBuckets.get(sig).push(n.id);
    }
  }
  for(const posting of embeddingBuckets.values()){
    if(posting.length<2||posting.length>cfg.maxEmbeddingBucket)continue;
    posting.sort();for(let i=0;i<posting.length;i++)for(let j=i+1;j<posting.length;j++)candidates.add(pairKey(posting[i],posting[j]));
  }

  const candidateEdges=[];
  for(const key of candidates){
    const [aid,bid]=key.split('\u0000');const a=byId.get(aid),b=byId.get(bid);
    const lexical=cosineSparse(a._tfidf,b._tfidf);
    const embedding=cosineVector(a._embedding,b._embedding);
    const alias=[...a._aliasSet].some(x=>b._aliasSet.has(x))?1:0;
    const tags=jaccard(a._tagSet,b._tagSet);
    const active=[[cfg.weights.lexical,lexical],[cfg.weights.alias,alias],[cfg.weights.tags,tags]];
    if(embedding!=null)active.push([cfg.weights.embedding,embedding]);
    const denom=active.reduce((s,[w])=>s+w,0)||1;
    const score=clamp01(active.reduce((s,[w,v])=>s+w*v,0)/denom);
    if(score<cfg.threshold&&!alias)continue;
    const sharedTokens=commonTop(a._tokenSet,b._tokenSet,idf);
    const sharedTags=commonTop(a._tagSet,b._tagSet,new Map(),6);
    const relation=alias?'ALIAS_MATCH':(embedding!=null&&embedding>=.82&&embedding>lexical?'SEMANTIC_VECTOR_MATCH':'SEMANTIC_CANDIDATE');
    candidateEdges.push({
      id:`xref:${stableHash(`${aid}|${relation}|${bid}`)}`,
      source:aid,target:bid,relation,score:Number(score.toFixed(6)),
      authority:'suggestion',epistemicStatus:'derived-relation',
      signals:{lexical:Number(lexical.toFixed(6)),embedding:embedding==null?null:Number(embedding.toFixed(6)),alias,tags:Number(tags.toFixed(6))},
      ...(cfg.includeReasons?{reasons:{sharedTokens,sharedTags,aliasMatch:Boolean(alias)}}:{}),
      boundaries:['RELATED != SUPPORTS','SEMANTIC_SIMILARITY != EVIDENCE','DERIVED_EDGE != AUTHORITY_TRANSFER']
    });
  }
  candidateEdges.sort((a,b)=>b.score-a.score||a.source.localeCompare(b.source)||a.target.localeCompare(b.target)||a.relation.localeCompare(b.relation));
  const degree=new Map();const derived=[];
  for(const e of candidateEdges){
    if((degree.get(e.source)||0)>=cfg.maxEdgesPerNode||(degree.get(e.target)||0)>=cfg.maxEdgesPerNode)continue;
    derived.push(e);degree.set(e.source,(degree.get(e.source)||0)+1);degree.set(e.target,(degree.get(e.target)||0)+1);
  }

  const explicit=[];const explicitSeen=new Set();
  for(const n of nodes){
    for(const r of n._explicit){
      if(!byId.has(r.target))continue;
      const id=`xref:${stableHash(`${n.id}|EXPLICIT:${r.relation}|${r.target}`)}`;
      if(explicitSeen.has(id))continue;explicitSeen.add(id);
      explicit.push({
        id,source:n.id,target:r.target,relation:r.relation,score:1,
        authority:'declared-only',epistemicStatus:'explicit-relation',
        provenance:r.provenance??n.provenance??null,evidence:r.evidence??null,
        boundaries:['EXPLICIT_RELATION != EVIDENCE_OF_TRUTH','DERIVED_EDGE != AUTHORITY_TRANSFER']
      });
    }
  }
  explicit.sort((a,b)=>a.source.localeCompare(b.source)||a.target.localeCompare(b.target)||a.relation.localeCompare(b.relation));

  const publicNodes=nodes.map(n=>{
    const out={id:n.id,title:n.title,kind:n.kind,project:n.project,provenance:n.provenance,aliases:n.aliases,tags:n.tags};
    if(cfg.includeText)out.text=n.text;if(cfg.includeRecord)out.record=n.record;return out;
  }).sort((a,b)=>a.id.localeCompare(b.id));

  return {
    schema:CROSSREF_SCHEMA,
    generatedBy:'buildSemanticCrossReferenceMap',
    boundaries:[...CROSSREF_BOUNDARIES],
    config:{threshold:cfg.threshold,maxEdgesPerNode:cfg.maxEdgesPerNode,maxTokenDfRatio:cfg.maxTokenDfRatio,maxPosting:cfg.maxPosting,weights:cfg.weights,embeddingField:cfg.embeddingField,embeddingLshBits:cfg.embeddingLshBits,embeddingLshTables:cfg.embeddingLshTables,includeReasons:cfg.includeReasons},
    stats:{recordCount:nodes.length,candidatePairCount:candidates.size,derivedEdgeCount:derived.length,explicitEdgeCount:explicit.length,edgeCount:derived.length+explicit.length,skippedPostings},
    nodes:publicNodes,
    edges:[...explicit,...derived]
  };
}

export const massSemanticCrossReferenceMap=buildSemanticCrossReferenceMap;

export function semanticNeighbors(graph,id,{limit=20,minScore=0,relations=null}={}){
  if(!graph||!Array.isArray(graph.edges))throw new TypeError('graph.edges must be an array');
  const allow=relations?new Set(arr(relations).map(String)):null;
  return graph.edges.filter(e=>(e.source===id||e.target===id)&&e.score>=minScore&&(!allow||allow.has(e.relation)))
    .map(e=>({...e,neighbor:e.source===id?e.target:e.source}))
    .sort((a,b)=>b.score-a.score||a.neighbor.localeCompare(b.neighbor)||a.relation.localeCompare(b.relation))
    .slice(0,limit);
}

export function crossReferenceComponents(graph,{minScore=0}={}){
  const adj=new Map((graph.nodes||[]).map(n=>[n.id,new Set()]));
  for(const e of graph.edges||[]){if(e.score<minScore)continue;if(!adj.has(e.source)||!adj.has(e.target))continue;adj.get(e.source).add(e.target);adj.get(e.target).add(e.source);}
  const seen=new Set(),components=[];
  for(const id of [...adj.keys()].sort()){
    if(seen.has(id))continue;const stack=[id],group=[];seen.add(id);
    while(stack.length){const x=stack.pop();group.push(x);for(const y of [...adj.get(x)].sort().reverse())if(!seen.has(y)){seen.add(y);stack.push(y);}}
    components.push(group.sort());
  }
  return components.sort((a,b)=>b.length-a.length||a[0].localeCompare(b[0]));
}
