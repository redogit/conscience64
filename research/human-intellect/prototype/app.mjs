import {createRuntime} from "./core.mjs";
import {experimentReceipt} from "./doe.mjs";
const $=id=>document.getElementById(id);
const runtime=createRuntime({activeLimit:7});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function announce(message,error=false){$("status").textContent=message;$("status").dataset.error=error?"true":"false";}
function render(){
 const {kd,obligations,controller}=runtime;
 $("active").innerHTML=kd.activeItems().map(x=>"<li><strong>"+esc(x.epistemicStatus)+"</strong> "+esc(x.text)+"</li>").join("")||"<li>Nothing active.</li>";
 $("unknown").innerHTML=kd.unknown.map(x=>"<li>"+esc(x.text)+"</li>").join("")||"<li>No explicit unknown remainder yet.</li>";
 $("lineage").innerHTML=kd.lineage.slice(-12).reverse().map(x=>"<li><strong>"+esc(x.kind)+"</strong> — "+esc(x.reason)+" <small>"+esc(x.at)+"</small></li>").join("")||"<li>No lineage yet.</li>";
 $("budget").textContent=obligations.current?(obligations.remaining()+" / "+obligations.current.budget):"—";
 $("decision").textContent=controller.decisions.at(-1)?.decision||"—";
}
$("obligation-form").addEventListener("submit",event=>{
 event.preventDefault();
 try{
  runtime.obligations.authorize({o0:$("o0").value.trim(),reason:$("reason").value.trim(),authority:$("authority").value.trim(),authorityStatus:$("authority-status").value,budget:Number($("budget-input").value),unresolvedCost:Number($("unresolved-cost").value),expectedBenefit:$("benefit").value.trim(),stopCondition:$("stop").value.trim()});
  announce("Obligation recorded. O0 is preserved separately from later interpretations.");render();
 }catch(error){announce(error.message,true);}
});
$("observe-form").addEventListener("submit",event=>{event.preventDefault();const value=$("observation").value.trim();if(!value)return;runtime.kd.observe(value,{consequential:$("consequential").checked,epistemicStatus:$("epistemic").value});$("observation").value="";announce("Observation recorded.");render();});
$("unknown-form").addEventListener("submit",event=>{event.preventDefault();const value=$("unknown-input").value.trim();if(value){runtime.kd.markUnknown(value);$("unknown-input").value="";announce("Unknown preserved explicitly.");render();}});
$("activate").addEventListener("click",()=>{const q=$("query").value.trim();runtime.kd.activate(q||runtime.obligations.current?.o0||"",{mode:$("retrieval-mode").value});announce("Consequential neighborhood activated.");render();});
$("decay").addEventListener("click",()=>{runtime.kd.decayActivation();announce("Non-consequential activation decayed; durable state remains.");render();});
$("controller-check").addEventListener("click",()=>{const d=runtime.controller.decide({cost:1,consequential:true});announce("Controller: "+d.decision+" — "+d.reason,d.decision==="reject");render();});
$("repair").addEventListener("click",()=>{const active=runtime.kd.activeItems();if(active.length<2){announce("Need at least two active observations for a 1° contradiction probe.",true);return;}const r=runtime.controller.contradiction({beliefId:active[0].id,observationId:active[1].id,dimension:"interpretation",proposedValue:"one-degree-change",reason:"manual contradiction probe"});announce("Repair proposal "+r.decision+": "+r.reason);render();});
$("doe").addEventListener("click",()=>{const receipt=experimentReceipt();const blob=new Blob([JSON.stringify(receipt,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="hli-doe-receipt.json";a.click();URL.revokeObjectURL(a.href);announce("Synthetic 16-run DOE receipt exported.");});
render();
