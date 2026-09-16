import {normalizeSnapshot,tokenize} from './engine.mjs';

const freezeOptions=options=>Object.freeze(options.map(o=>Object.freeze({...o,addTokens:Object.freeze([...o.addTokens])})));
export const QUESTION_TEMPLATES=Object.freeze([
  Object.freeze({
    id:'research-or-game-use',
    prompt:'Do you want the original research work, or a game surface that references it?',
    distinction:'research-source-vs-game-reference',
    options:freezeOptions([
      {id:'research',label:'Original research work',addTokens:['research','source','evidence'],selectedFacet:'research'},
      {id:'game',label:'Game surface that references it',addTokens:['game','play','reference'],selectedFacet:'game'}
    ])
  }),
  Object.freeze({
    id:'computational-chorus-or-musilanguage',
    prompt:'Do you want Computational Chorus—the research/mnemonic projection tool—or Musilanguage—the broader creative music-and-language surface?',
    distinction:'creative-tool-purpose',
    options:freezeOptions([
      {id:'computational-chorus',label:'Computational Chorus',addTokens:['computational','chorus','mnemonic','research'],selectedFacet:'creative:computational-chorus'},
      {id:'musilanguage',label:'Musilanguage',addTokens:['musilanguage','creative','music'],selectedFacet:'creative:musilanguage'}
    ])
  })
]);

const RESEARCH=new Set(['research','evidence','source','proof','verify','experiment','science','scientific','hodge','pnp']);
const GAME=new Set(['game','play','mmo','world','red','wilds']);
const hasAny=(tokens,set)=>tokens.some(t=>set.has(t));
const byId=id=>QUESTION_TEMPLATES.find(q=>q.id===id)||null;
function candidateInWindow(ranked,ownerDomain,window=4){
  const top=ranked?.[0]?.score;
  if(!Number.isFinite(top))return null;
  return ranked.find(row=>row.route.ownerDomain===ownerDomain&&row.score>=top-window)||null;
}
function alreadyResolved(snapshot,id){
  if((snapshot?.unresolvedQuestions||[]).includes(id))return true;
  if(id==='research-or-game-use'&&['research','game'].includes(snapshot?.selectedFacet))return true;
  if(id==='computational-chorus-or-musilanguage'&&String(snapshot?.selectedFacet||'').startsWith('creative:'))return true;
  return false;
}
function materialize(template,candidates,reason){
  return Object.freeze({id:template.id,prompt:template.prompt,distinction:template.distinction,candidates:Object.freeze([...candidates]),options:template.options,reason});
}

export function chooseQuestion(ranked=[],snapshot={}){
  if(!Array.isArray(ranked)||!ranked.length)return null;
  const explicit=[...new Set((snapshot.explicitIntentTokens||[]).flatMap(tokenize))];
  const rq=byId('research-or-game-use');
  if(!alreadyResolved(snapshot,rq.id)&&hasAny(explicit,RESEARCH)&&hasAny(explicit,GAME)){
    const research=candidateInWindow(ranked,'research'),game=candidateInWindow(ranked,'game');
    if(research&&game)return materialize(rq,[research.route.id,game.route.id],'Explicit intent spans distinct research and game domains; asking avoids silently merging source work with a referencing game surface.');
  }

  const cq=byId('computational-chorus-or-musilanguage');
  if(!alreadyResolved(snapshot,cq.id)&&explicit.some(t=>t==='music'||t==='language')){
    const chorus=ranked.find(r=>r.route.id==='computational-chorus'),musi=ranked.find(r=>r.route.id==='musilanguage');
    if(chorus&&musi&&Math.abs(chorus.score-musi.score)<=0.5&&Math.max(chorus.score,musi.score)>0){
      return materialize(cq,['computational-chorus','musilanguage'],'Two admitted creative routes are materially tied but preserve different purposes and lineages.');
    }
  }
  return null;
}

export function applyAnswer(snapshot={},question,answerId){
  const base=normalizeSnapshot(snapshot);
  const unresolved=[...new Set(Array.isArray(snapshot.unresolvedQuestions)?snapshot.unresolvedQuestions.map(String):[])];
  const template=QUESTION_TEMPLATES.find(q=>q.id===question?.id);
  const option=template?.options.find(o=>o.id===answerId);
  if(!template||!option){
    if(question?.id&&!unresolved.includes(question.id))unresolved.push(question.id);
    return Object.freeze({...base,explicitIntentTokens:Object.freeze([...base.explicitIntentTokens]),unresolvedQuestions:Object.freeze(unresolved.sort())});
  }
  const nextTokens=[...new Set([...base.explicitIntentTokens,...option.addTokens.flatMap(tokenize)])];
  const nextUnresolved=unresolved.filter(id=>id!==template.id);
  return Object.freeze({...base,explicitIntentTokens:Object.freeze(nextTokens),selectedFacet:option.selectedFacet,unresolvedQuestions:Object.freeze(nextUnresolved)});
}
