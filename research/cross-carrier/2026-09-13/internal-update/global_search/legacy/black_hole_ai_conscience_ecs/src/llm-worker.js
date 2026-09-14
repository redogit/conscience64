
let engine=null, modelId=null;

function progress(text){postMessage({type:"progress",text});}

self.onmessage=async(event)=>{
  const m=event.data||{};
  try{
    if(m.type==="enable"){
      progress("Importing WebLLM runtime…");
      const webllm=await import("https://esm.run/@mlc-ai/web-llm");
      const list=webllm.prebuiltAppConfig?.model_list||[];
      const pick=list.find(x=>/Qwen2\.5-0\.5B|SmolLM|Llama-3\.2-1B/i.test(x.model_id))||list[0];
      if(!pick)throw new Error("No compatible prebuilt model record found.");
      modelId=pick.model_id;
      engine=await webllm.CreateMLCEngine(modelId,{
        initProgressCallback:p=>progress(p.text||`Model ${(100*(p.progress||0)).toFixed(0)}%`)
      });
      postMessage({type:"ready",modelId});
      return;
    }
    if(m.type==="propose"){
      if(!engine)throw new Error("WebLLM is not enabled.");
      const evidence=(m.evidence||[]).map((e,i)=>`${i+1}. ${e.label}: ${e.text} [${e.provenance}]`).join("\n");
      const result=await engine.chat.completions.create({
        temperature:.25,
        messages:[
          {role:"system",content:`You are only a proposal generator inside a reversible game-world ECS.
You have no authority to act. Use only admitted evidence. Never claim consciousness or real-world proof.
If support is weak, increase uncertainty. Never request or export private data.
Return JSON with keys action, explanation, humanBenefit, agency, privacy, evidence, reversibility, cost, uncertainty, flags, requiresHuman, irreversible.`},
          {role:"user",content:`Question: ${m.question}\nAdmitted evidence:\n${evidence||"(none)"}\nWorld state:${JSON.stringify(m.worldState||{})}`}
        ],
        response_format:{type:"json_object"}
      });
      const text=result.choices?.[0]?.message?.content||"{}";
      const raw=JSON.parse(text);raw.source=`Conscience:webllm-worker:${modelId}`;
      postMessage({type:"proposal",requestId:m.requestId,raw});
    }
  }catch(error){
    postMessage({type:"error",requestId:m.requestId||null,message:String(error?.message||error)});
  }
};
