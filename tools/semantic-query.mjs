import {massSemanticCrossReferenceMap,semanticNeighbors} from './semantic-crossref.mjs';
import {hasRestrictedOriginMarker} from './private-origin-boundary.mjs';

export const SEMANTIC_QUERY_BOUNDARIES=Object.freeze([
  'QUERY_MATCH != SUPPORT',
  'HELPER_CANDIDATE != APPLICABLE_HELPER',
  'RELATED != SUPPORTS',
  'TRANSIENT_QUERY != CORPUS_RECORD',
  'PRIVATE_ORIGIN != QUERY_RESULT'
]);

const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);
const text=v=>{
  if(v==null)return '';
  if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return String(v);
  if(Array.isArray(v))return v.map(text).filter(Boolean).join(' ');
  return '';
};

export function situationToQueryText(situation){
  if(typeof situation==='string')return situation.trim();
  if(!situation||typeof situation!=='object')return '';
  const fields=['subject','goal','motivator','request','entreaty','obligation','obligations','constraints','costs','uncertainty','unknowns','description','context','outputDefinition','output_definition'];
  return fields.flatMap(field=>arr(situation[field])).map(text).filter(Boolean).join(' ').trim();
}

export function querySemanticRecords(records,query,options={}){
  if(!Array.isArray(records))throw new TypeError('records must be an array');
  const queryText=situationToQueryText(query);
  if(!queryText)throw new Error('semantic query text is empty');
  const visibleForIdentity=records.filter(record=>!hasRestrictedOriginMarker(record));
  const ids=new Set(visibleForIdentity.map((r,i)=>String(r?.id??r?.key??r?.uid??r?.stable_id??r?.stableId??`record:${i}`)));
  let queryId='query:__transient__';let suffix=0;
  while(ids.has(queryId))queryId=`query:__transient__:${++suffix}`;
  const tags=Array.isArray(query?.tags)?query.tags:[];
  const limit=Number.isInteger(options.limit)?Math.max(1,options.limit):12;
  const threshold=Number.isFinite(options.threshold)?options.threshold:.10;
  const maxEdgesPerNode=Number.isInteger(options.maxEdgesPerNode)?Math.max(limit,options.maxEdgesPerNode):Math.max(64,limit*4);
  const queryRecord={
    id:queryId,
    title:`Transient semantic query: ${queryText.slice(0,96)}`,
    description:queryText,
    tags,
    project:'__query__',
    provenance:'transient-query'
  };
  const graph=massSemanticCrossReferenceMap([...records,queryRecord],{
    threshold,
    maxEdgesPerNode,
    includeReasons:options.includeReasons!==false,
    ...(options.mapOptions||{})
  });
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  let matches=semanticNeighbors(graph,queryId,{minScore:threshold})
    .filter(row=>row.neighbor!==queryId)
    .map(row=>{
      const node=nodes.get(row.neighbor)||{};
      return {
        id:row.neighbor,
        title:node.title??row.neighbor,
        kind:node.kind??null,
        project:node.project??null,
        provenance:node.provenance??null,
        relation:row.relation,
        score:row.score,
        epistemicStatus:row.epistemicStatus,
        signals:row.signals??null,
        reasons:row.reasons??null,
        boundaries:['QUERY_MATCH != SUPPORT','HELPER_CANDIDATE != APPLICABLE_HELPER','RELATED != SUPPORTS','PRIVATE_ORIGIN != QUERY_RESULT']
      };
    });
  if(Array.isArray(options.projects)&&options.projects.length)matches=matches.filter(m=>options.projects.includes(m.project));
  if(Array.isArray(options.excludeProjects)&&options.excludeProjects.length)matches=matches.filter(m=>!options.excludeProjects.includes(m.project));
  if(Array.isArray(options.kinds)&&options.kinds.length)matches=matches.filter(m=>options.kinds.includes(m.kind));
  matches.sort((a,b)=>Number(b.score||0)-Number(a.score||0)||a.id.localeCompare(b.id));
  matches=matches.slice(0,limit);
  const result={
    schema:'conscience64.semantic-query/v1',
    query:queryText,
    matchCount:matches.length,
    matches,
    boundaries:[...SEMANTIC_QUERY_BOUNDARIES]
  };
  if(options.includeGraph)result.graph=graph;
  return result;
}

export function suggestSituationHelpers(records,situation,options={}){
  const result=querySemanticRecords(records,situation,options);
  return {
    schema:'conscience64.situation-helper-candidates/v1',
    situation:situationToQueryText(situation),
    helperCount:result.matches.length,
    helpers:result.matches,
    boundaries:[...SEMANTIC_QUERY_BOUNDARIES]
  };
}
