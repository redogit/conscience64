export const ROUTING_BOUNDARIES=Object.freeze([
  'RELATED != SUPPORTS',
  'SEMANTIC_PATH != PROOF_CHAIN',
  'BRIDGE_CANDIDATE != APPLICABILITY',
  'ROUTE != AUTHORITY_TRANSFER'
]);

const edgeScore=e=>Number.isFinite(e?.score)?e.score:0;

function nodeMap(graph){return new Map((graph?.nodes||[]).map(n=>[n.id,n]));}
function usableEdge(edge,options={}){
  const minScore=Number.isFinite(options.minScore)?options.minScore:0;
  if(edgeScore(edge)<minScore)return false;
  if(options.includeExplicit===false&&edge.epistemicStatus==='explicit-relation')return false;
  if(options.includeDerived===false&&edge.epistemicStatus==='derived-relation')return false;
  if(Array.isArray(options.relations)&&options.relations.length&&!options.relations.includes(edge.relation))return false;
  return true;
}
function adjacency(graph,options={}){
  const out=new Map((graph?.nodes||[]).map(n=>[n.id,[]]));
  for(const edge of graph?.edges||[]){
    if(!usableEdge(edge,options))continue;
    if(out.has(edge.source)&&out.has(edge.target)){
      out.get(edge.source).push({neighbor:edge.target,edge});
      out.get(edge.target).push({neighbor:edge.source,edge});
    }
  }
  for(const rows of out.values())rows.sort((a,b)=>{
    const ae=a.edge.epistemicStatus==='explicit-relation'?1:0;
    const be=b.edge.epistemicStatus==='explicit-relation'?1:0;
    return be-ae||edgeScore(b.edge)-edgeScore(a.edge)||a.neighbor.localeCompare(b.neighbor)||String(a.edge.relation).localeCompare(String(b.edge.relation));
  });
  return out;
}

export function semanticRoute(graph,source,target,options={}){
  const nodes=nodeMap(graph);
  if(!nodes.has(source)||!nodes.has(target))return {found:false,source,target,reason:'unknown-node',boundaries:[...ROUTING_BOUNDARIES]};
  if(source===target)return {found:true,source,target,nodes:[source],edges:[],hopCount:0,bottleneckScore:1,boundaries:[...ROUTING_BOUNDARIES]};
  const maxHops=Number.isInteger(options.maxHops)?Math.max(1,options.maxHops):8;
  const adj=adjacency(graph,options);
  const queue=[{id:source,nodes:[source],edges:[],bottleneckScore:1}];
  const bestDepth=new Map([[source,0]]);
  while(queue.length){
    const current=queue.shift();
    const depth=current.edges.length;
    if(depth>=maxHops)continue;
    for(const {neighbor,edge} of adj.get(current.id)||[]){
      const nextDepth=depth+1;
      const prev=bestDepth.get(neighbor);
      if(prev!=null&&prev<nextDepth)continue;
      const state={
        id:neighbor,
        nodes:[...current.nodes,neighbor],
        edges:[...current.edges,edge],
        bottleneckScore:Math.min(current.bottleneckScore,edgeScore(edge))
      };
      if(neighbor===target)return {
        found:true,source,target,nodes:state.nodes,edges:state.edges,hopCount:nextDepth,
        bottleneckScore:Number(state.bottleneckScore.toFixed(6)),
        boundaries:[...ROUTING_BOUNDARIES]
      };
      if(prev==null||nextDepth<=prev){bestDepth.set(neighbor,nextDepth);queue.push(state);}
    }
  }
  return {found:false,source,target,reason:'no-route-within-bound',maxHops,boundaries:[...ROUTING_BOUNDARIES]};
}

export function crossReferenceSubgraph(graph,seeds,options={}){
  const wanted=new Set(Array.isArray(seeds)?seeds:[seeds]);
  const nodes=nodeMap(graph);
  const maxDepth=Number.isInteger(options.depth)?Math.max(0,options.depth):2;
  const maxNodes=Number.isInteger(options.maxNodes)?Math.max(1,options.maxNodes):100;
  const adj=adjacency(graph,options);
  const depth=new Map();
  const queue=[];
  for(const seed of [...wanted].sort())if(nodes.has(seed)){depth.set(seed,0);queue.push(seed);}
  while(queue.length&&depth.size<maxNodes){
    const id=queue.shift();const d=depth.get(id);
    if(d>=maxDepth)continue;
    for(const {neighbor} of adj.get(id)||[]){
      if(depth.has(neighbor))continue;
      depth.set(neighbor,d+1);queue.push(neighbor);
      if(depth.size>=maxNodes)break;
    }
  }
  const included=new Set(depth.keys());
  const outNodes=(graph?.nodes||[]).filter(n=>included.has(n.id)).sort((a,b)=>a.id.localeCompare(b.id));
  const outEdges=(graph?.edges||[]).filter(e=>included.has(e.source)&&included.has(e.target)&&usableEdge(e,options)).sort((a,b)=>a.source.localeCompare(b.source)||a.target.localeCompare(b.target)||String(a.relation).localeCompare(String(b.relation)));
  return {schema:'conscience64.semantic-subgraph/v1',seeds:[...wanted].sort(),depth:maxDepth,nodes:outNodes,edges:outEdges,boundaries:[...ROUTING_BOUNDARIES]};
}

export function crossProjectBridgeCandidates(graph,options={}){
  const nodes=nodeMap(graph);
  const limit=Number.isInteger(options.limit)?Math.max(1,options.limit):50;
  const minScore=Number.isFinite(options.minScore)?options.minScore:.25;
  return (graph?.edges||[])
    .filter(e=>usableEdge(e,{...options,minScore}))
    .map(edge=>({edge,sourceNode:nodes.get(edge.source),targetNode:nodes.get(edge.target)}))
    .filter(x=>x.sourceNode&&x.targetNode&&x.sourceNode.project&&x.targetNode.project&&x.sourceNode.project!==x.targetNode.project)
    .sort((a,b)=>edgeScore(b.edge)-edgeScore(a.edge)||a.edge.source.localeCompare(b.edge.source)||a.edge.target.localeCompare(b.edge.target))
    .slice(0,limit)
    .map(x=>({
      source:x.edge.source,target:x.edge.target,relation:x.edge.relation,score:x.edge.score,
      sourceProject:x.sourceNode.project,targetProject:x.targetNode.project,
      epistemicStatus:x.edge.epistemicStatus,
      boundaries:['BRIDGE_CANDIDATE != APPLICABILITY','RELATED != SUPPORTS','ROUTE != AUTHORITY_TRANSFER']
    }));
}
