const tokens = value => new Set(String(value).toLowerCase().match(/[a-z0-9]+/g) || []);
const overlap = (a,b) => {
  const aa=tokens(a), bb=tokens(b);
  if (!aa.size || !bb.size) return 0;
  let n=0; for (const w of aa) if (bb.has(w)) n++;
  return n/Math.max(aa.size,bb.size);
};
export const uid = prefix => prefix + "-" + crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export class KDKernel {
  constructor({activeLimit=7}={}) {
    if (!Number.isInteger(activeLimit) || activeLimit<1) throw new Error("activeLimit must be positive");
    this.activeLimit=activeLimit; this.items=new Map(); this.lineage=[]; this.unknown=[]; this.anchors=new Map();
  }
  observe(text,{tags=[],links=[],consequential=false,epistemicStatus="observed",reason="observation"}={}) {
    const item={id:uid("k"),text:String(text),tags:[...tags],links:[...links],at:nowIso(),active:true,consequential:!!consequential,epistemicStatus};
    this.items.set(item.id,item);
    this.recordLineage({kind:"observation",subject:item.id,reason,evidence:[item.id]});
    this.enforceBound(); return item;
  }
  markUnknown(text,reason="explicit unknown remainder") {
    const entry={id:uid("u"),text:String(text),at:nowIso(),reason};
    this.unknown.push(entry);
    this.recordLineage({kind:"unknown",subject:entry.id,reason,unresolved:[entry.text],status:"unknown"});
    return entry;
  }
  recordLineage({kind,subject,reason,evidence=[],unresolved=[],authority,cost=0,status}) {
    const row={id:uid("l"),at:nowIso(),kind,subject,reason,evidence:[...evidence],unresolved:[...unresolved],cost};
    if(authority) row.authority=authority; if(status) row.status=status;
    this.lineage.push(row); return row;
  }
  activeItems(){ return [...this.items.values()].filter(x=>x.active); }
  enforceBound(){
    const ranked=this.activeItems().sort((a,b)=>{
      const weight=x=>(x.consequential?10:0)+x.links.length;
      return weight(a)-weight(b) || a.at.localeCompare(b.at);
    });
    while(this.activeItems().length>this.activeLimit && ranked.length) ranked.shift().active=false;
  }
  decayActivation({keepConsequential=true}={}){
    for(const item of this.items.values()) if(!(keepConsequential && item.consequential)) item.active=false;
    return this.activeItems();
  }
  relevantNeighborhood(query,{limit=this.activeLimit,mode="hybrid"}={}){
    return [...this.items.values()].map(item=>{
      const relation=item.links.length?0.15:0;
      const semantic=overlap(query,item.text+" "+item.tags.join(" "));
      const consequential=item.consequential?0.2:0;
      const score=mode==="relation"?relation+consequential:semantic+relation+consequential;
      return {item,score};
    }).sort((a,b)=>b.score-a.score || b.item.at.localeCompare(a.item.at)).filter(x=>x.score>0).slice(0,limit).map(x=>x.item);
  }
  activate(query,options={}){
    for(const item of this.items.values()) item.active=false;
    for(const item of this.relevantNeighborhood(query,options)) item.active=true;
    this.enforceBound(); return this.activeItems();
  }
  createAnchor(name,itemIds,{reason="consequential divergence",returnPointer=null}={}){
    const ids=[...new Set(itemIds)].filter(id=>this.items.has(id));
    const anchor={id:uid("a"),name:String(name),itemIds:ids,reason,returnPointer,at:nowIso()};
    this.anchors.set(anchor.id,anchor);
    this.recordLineage({kind:"anchor",subject:anchor.id,reason,evidence:ids});
    return anchor;
  }
  retrieveAnchor(id){
    const anchor=this.anchors.get(id); if(!anchor) return null;
    return {anchor,items:anchor.itemIds.map(x=>this.items.get(x)).filter(Boolean),unknown:[...this.unknown]};
  }
  snapshot(){ return {schema:"hli-kd-state/v0.1",activeLimit:this.activeLimit,items:[...this.items.values()],unknown:[...this.unknown],anchors:[...this.anchors.values()],lineage:[...this.lineage]}; }
}

export class ObligationKernel {
  constructor(kd){this.kd=kd;this.current=null;}
  authorize(input){
    for(const key of ["o0","reason","authority","authorityStatus","budget","unresolvedCost","expectedBenefit","stopCondition"])
      if(input[key]===undefined || input[key]==="") throw new Error("missing obligation field: "+key);
    const o={id:uid("o"),o0:String(input.o0),o1:String(input.o1||input.o0),localObjective:String(input.localObjective||input.o1||input.o0),reason:String(input.reason),authority:String(input.authority),authorityStatus:input.authorityStatus,budget:Number(input.budget),spent:0,unresolvedCost:Number(input.unresolvedCost),limits:[...(input.limits||[])],expectedBenefit:String(input.expectedBenefit),stopCondition:String(input.stopCondition),createdAt:nowIso()};
    if(!(o.budget>=0)) throw new Error("budget must be non-negative");
    this.current=o;
    this.kd.recordLineage({kind:"authorization",subject:o.id,reason:o.reason,authority:o.authority});
    return o;
  }
  remaining(){return this.current?Math.max(0,this.current.budget-this.current.spent):0;}
  spend(cost){if(!this.current) throw new Error("no active obligation"); const c=Number(cost); if(c<0) throw new Error("cost must be non-negative"); if(c>this.remaining()) return false; this.current.spent+=c; return true;}
}

export class Controller {
  constructor(kd,obligations){this.kd=kd;this.obligations=obligations;this.decisions=[];}
  decide({cost=0,consequential=false,requestedAuthority=null}={}){
    const o=this.obligations.current;
    if(!o) return this._record("reject","no active obligation");
    if(o.authorityStatus==="unavailable" || o.authorityStatus==="ambiguous") return this._record("wait","authority is not currently sufficient");
    if(o.authorityStatus==="rejected") return this._record("reject","authority rejected the obligation");
    if(requestedAuthority && requestedAuthority!==o.authority) return this._record("wait","requested authority exceeds current scope");
    if(cost>this.obligations.remaining()) return this._record("reject","budget exceeded");
    if(consequential && !o.authority) return this._record("wait","consequential action needs explicit authority");
    this.obligations.spend(cost); return this._record("allow","authorized within current obligation and budget");
  }
  contradiction({beliefId,observationId,dimension,proposedValue,reason,cost=1}){
    const gate=this.decide({cost,consequential:true});
    const residual={id:uid("r"),beliefId,observationId,dimension,proposedValue,reason,decision:gate.decision,at:nowIso()};
    this.kd.recordLineage({kind:"repair",subject:residual.id,reason:"1-degree proposal on "+dimension+": "+reason,evidence:[beliefId,observationId].filter(Boolean),unresolved:gate.decision==="allow"?[]:[gate.reason],authority:this.obligations.current&&this.obligations.current.authority,cost});
    return residual;
  }
  _record(decision,reason){const row={id:uid("d"),decision,reason,remainingBudget:this.obligations.remaining(),at:nowIso()};this.decisions.push(row);return row;}
}
export const createRuntime=options=>{const kd=new KDKernel(options);const obligations=new ObligationKernel(kd);const controller=new Controller(kd,obligations);return {kd,obligations,controller};};
