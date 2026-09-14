
const requestId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;

export class LazyLocalLLM {
  constructor(){this.worker=null;this.ready=false;this.modelId=null;this.pending=new Map();}
  deterministic(question,evidence){
    const enough=evidence.length>=2;
    return {
      action:enough
        ?"Keep the active evidence ring small and inspect one unresolved fragment before widening scope."
        :"Scan and admit more evidence before asking the system to act.",
      explanation:enough
        ?"This is a reversible next step supported by the currently admitted context."
        :"There is not enough admitted evidence for a supported proposal.",
      humanBenefit:.72,agency:1,privacy:1,evidence:enough?.76:.22,reversibility:.98,
      cost:.08,uncertainty:enough?.30:.80,flags:[],requiresHuman:false,irreversible:false,
      source:"Conscience:deterministic-local-fallback",question
    };
  }
  async enable(onProgress=()=>{}){
    if(!navigator.gpu)throw new Error("The optional browser LLM requires WebGPU. The deterministic proposer remains available.");
    if(this.ready)return this.modelId;
    if(!globalThis.Worker)throw new Error("Module workers unavailable. The deterministic proposer remains available.");
    this.worker=new Worker(new URL("./llm-worker.js",import.meta.url),{type:"module"});
    return await new Promise((resolve,reject)=>{
      const cleanup=()=>clearTimeout(timer);
      const timer=setTimeout(()=>{reject(new Error("WebLLM initialization timed out."));},180000);
      this.worker.onmessage=e=>{
        const m=e.data||{};
        if(m.type==="progress")onProgress(m.text);
        if(m.type==="ready"){cleanup();this.ready=true;this.modelId=m.modelId;resolve(m.modelId);}
        if(m.type==="error"&&!m.requestId){cleanup();reject(new Error(m.message));}
        if(m.type==="proposal"){
          const p=this.pending.get(m.requestId);if(p){this.pending.delete(m.requestId);p.resolve(m.raw);}
        }
        if(m.type==="error"&&m.requestId){
          const p=this.pending.get(m.requestId);if(p){this.pending.delete(m.requestId);p.reject(new Error(m.message));}
        }
      };
      this.worker.onerror=e=>{cleanup();reject(new Error(e.message||"WebLLM worker failed."));};
      this.worker.postMessage({type:"enable"});
    });
  }
  async propose(question,evidence,worldState){
    if(!this.ready||!this.worker)return this.deterministic(question,evidence);
    const id=requestId();
    return await new Promise((resolve,reject)=>{
      this.pending.set(id,{resolve,reject});
      this.worker.postMessage({type:"propose",requestId:id,question,evidence,worldState});
    });
  }
}
