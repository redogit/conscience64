
import {ECS,coord4,vec3} from "./ecs.js";
import {ConscienceEngine,normalizeProposal} from "./conscience.js";
import {loadBestRenderer} from "./renderer-loader.js";
import {LazyLocalLLM} from "./llm.js";

const $=s=>document.querySelector(s);
const status=$("#status"), rendererStatus=$("#rendererStatus"), canvas=$("#world");
const announce=msg=>{status.textContent=msg;};

const world=await fetch("./data/world.json").then(r=>{if(!r.ok)throw new Error("Could not load world.json");return r.json();});
const ecs=new ECS(), conscience=new ConscienceEngine(world.conscience), llm=new LazyLocalLLM();

function hashDate(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const today=new Date().toISOString().slice(0,10);
ecs.setResource("dateSeed",hashDate(today));
ecs.setResource("paused",false);
ecs.setResource("assist",true);
ecs.setResource("input",new Set());
ecs.setResource("scanned",new Set());
ecs.setResource("admitted",new Set());
ecs.setResource("lastProposal",null);
ecs.setResource("lastReview",null);
ecs.setResource("reducedMotion",matchMedia("(prefers-reduced-motion: reduce)").matches);

ecs.add("black-hole","position",coord4(0,0,0,0));
ecs.add("black-hole","render",{kind:"blackHole",radius:.145});
ecs.add("probe","position",coord4(.72,0,0,0));
ecs.add("probe","velocity",vec3(0,1.05,0));
ecs.add("probe","player",{});
ecs.add("probe","energy",{value:1});

for(const f of world.fragments){
  ecs.add(f.id,"position",coord4());
  ecs.add(f.id,"fragment",structuredClone(f));
  ecs.add(f.id,"render",{kind:"fragment",radius:.028});
}

const colorFor=kind=>({
  human_direction:"#8dd8ff",evidence:"#ffd486",agency:"#c7ffac",privacy:"#f0b6ff",
  correctability:"#9ff5e9",cost:"#ffb4a8"
}[kind]||"#d2ddff");

function drawables(){
  const items=[],reduced=ecs.resource("reducedMotion"),count=reduced?18:52,t=performance.now()/1000;
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2+(reduced?0:t*.055),rr=.18+(i%5)*.012;
    items.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr*.42,radius:.006,fill:i%2?"#f5b86f":"#9f8cff"});
  }
  items.push({x:0,y:0,radius:.145,fill:"#070710"});
  for(const id of ecs.query("position","render")){
    if(id==="black-hole")continue;
    const p=ecs.get(id,"position"),r=ecs.get(id,"render"),frag=ecs.get(id,"fragment");
    const admitted=ecs.resource("admitted").has(id);
    items.push({x:p[0],y:p[1],radius:admitted?r.radius*1.35:r.radius,fill:id==="probe"?"#ffffff":colorFor(frag?.kind),ring:admitted?"#ffffff":null});
  }
  return items;
}

function installSystems(){
  ecs.addSystem("input",10,(e,dt)=>{
    if(e.resource("paused"))return;
    const input=e.resource("input"),v=e.get("probe","velocity"),en=e.get("probe","energy");
    const thrust=e.resource("assist")?1.8:1.4,cost=e.resource("assist")?.06:.10;
    let ax=0,ay=0;if(input.has("left"))ax--;if(input.has("right"))ax++;if(input.has("up"))ay++;if(input.has("down"))ay--;
    const m=Math.hypot(ax,ay)||1;
    if(ax||ay){v[0]+=ax/m*thrust*dt;v[1]+=ay/m*thrust*dt;en.value=Math.max(0,en.value-cost*dt);}
    else en.value=Math.min(1,en.value+.035*dt);
  });
  ecs.addSystem("gravity",20,(e,dt)=>{
    if(e.resource("paused"))return;
    const p=e.get("probe","position"),v=e.get("probe","velocity"),r=Math.max(.12,Math.hypot(p[0],p[1]));
    const a=-(e.resource("assist")?.20:.27)/(r*r);v[0]+=a*p[0]/r*dt;v[1]+=a*p[1]/r*dt;
  });
  ecs.addSystem("movement",30,(e,dt)=>{
    if(e.resource("paused"))return;
    const p=e.get("probe","position"),v=e.get("probe","velocity"),speed=Math.hypot(v[0],v[1]),max=e.resource("assist")?1.25:1.55;
    if(speed>max){v[0]*=max/speed;v[1]*=max/speed;}p[0]+=v[0]*dt;p[1]+=v[1]*dt;p[3]+=dt;
    const r=Math.hypot(p[0],p[1]);
    if(r<world.game.eventHorizonRadius*.92||r>1.18){
      p[0]=.72;p[1]=0;v[0]=0;v[1]=1.05;e.emit("safe-reset",{reason:r<.2?"event-horizon":"out-of-bounds"});
      announce("Probe safely recovered. No evidence was lost.");
    }
  });
  ecs.addSystem("orbit",40,(e,dt,now)=>{
    const slow=e.resource("reducedMotion")?.18:1,seed=(e.resource("dateSeed")%997)/997;
    for(const id of e.query("fragment","position")){
      const f=e.get(id,"fragment"),p=e.get(id,"position");
      const phase=f.orbit.phase+seed*Math.PI*2+(now/1000)*f.orbit.speed*slow;
      p[0]=Math.cos(phase)*f.orbit.radius;p[1]=Math.sin(phase)*f.orbit.radius*.74;p[3]=now/1000;
    }
  });
}
installSystems();

function nearestFragment(){
  const p=ecs.get("probe","position");let best=null;
  for(const id of ecs.query("fragment","position")){
    const q=ecs.get(id,"position"),d=Math.hypot(p[0]-q[0],p[1]-q[1]);
    if(!best||d<best.distance)best={id,distance:d,fragment:ecs.get(id,"fragment")};
  }
  return best;
}
function fragmentById(id){return world.fragments.find(f=>f.id===id);}
function admittedEvidence(){return [...ecs.resource("admitted")].map(fragmentById).filter(Boolean);}

function scanNearest(){
  const n=nearestFragment();
  if(!n||n.distance>world.game.scanRadius){announce("No evidence fragment is close enough to scan.");return;}
  ecs.resource("scanned").add(n.id);ecs.emit("scan",{id:n.id,distance:n.distance});renderEvidence();
  announce(`Scanned ${n.fragment.label}. Decide whether to admit it to the context ring.`);
}
function toggleAdmit(id){
  const scanned=ecs.resource("scanned"),admitted=ecs.resource("admitted");
  if(!scanned.has(id))return;
  if(admitted.has(id)){admitted.delete(id);announce(`Removed ${fragmentById(id)?.label} from active context.`);}
  else{admitted.add(id);announce(`Admitted ${fragmentById(id)?.label} to active context.`);}
  renderEvidence();
}

function renderEvidence(){
  const scanned=ecs.resource("scanned"),admitted=ecs.resource("admitted"),host=$("#evidenceList");
  if(!scanned.size){host.innerHTML="<p>No fragments scanned yet.</p>";return;}
  host.innerHTML=[...scanned].map(id=>{
    const f=fragmentById(id),checked=admitted.has(id)?"checked":"";
    return `<article class="evidence-card"><h3>${escapeHTML(f.label)}</h3><p>${escapeHTML(f.text)}</p>
      <p class="meta">Provenance: ${escapeHTML(f.provenance)}</p>
      <label><input type="checkbox" data-admit="${id}" ${checked}> Admit to active context</label></article>`;
  }).join("");
  host.querySelectorAll("[data-admit]").forEach(el=>el.addEventListener("change",()=>toggleAdmit(el.dataset.admit)));
}

function worldState(){
  const p=ecs.get("probe","position"),v=ecs.get("probe","velocity");
  return {
    date:today,probe:{x:p[0],y:p[1],vx:v[0],vy:v[1],energy:ecs.get("probe","energy").value},
    admitted:admittedEvidence().map(x=>x.id),scanned:[...ecs.resource("scanned")],
    renderer:renderer?.kind||"pending",assist:ecs.resource("assist")
  };
}
function renderProposal(){
  const p=ecs.resource("lastProposal"),r=ecs.resource("lastReview"),host=$("#proposalResult");
  if(!p||!r){host.innerHTML="<p>No proposal reviewed yet.</p>";return;}
  const scores=Object.entries(r.scores).map(([k,v])=>`<li><strong>${escapeHTML(k)}:</strong> ${(v*100).toFixed(0)}%</li>`).join("");
  host.innerHTML=`<section class="decision ${r.decision}">
    <h3>Human Boundary Gate: ${escapeHTML(r.decision.toUpperCase())}</h3>
    <p><strong>Proposal:</strong> ${escapeHTML(p.action)}</p>
    <p>${escapeHTML(p.explanation)}</p>
    <p><strong>Why:</strong> ${escapeHTML(r.reason)}</p>
    <p><strong>Composite:</strong> ${(r.score*100).toFixed(1)}%</p>
    <details><summary>Inspect score components</summary><ul>${scores}</ul>
    <p>${escapeHTML(r.claimBoundary)}</p><p>Source: ${escapeHTML(p.source)}</p></details>
    <div class="row">
      <button id="acceptProposal" ${r.decision==="block"?"disabled":""}>Human: accept reversible step</button>
      <button id="rejectProposal">Reject</button>
    </div>
  </section>`;
  $("#acceptProposal")?.addEventListener("click",()=>{
    ecs.emit("human-accept",{proposalId:p.id,decision:r.decision});announce("Accepted as a game-world decision. No external action was taken.");
  });
  $("#rejectProposal")?.addEventListener("click",()=>{
    ecs.emit("human-reject",{proposalId:p.id});announce("Proposal rejected. World state and evidence remain recoverable.");
  });
}

async function ask(){
  const q=$("#question").value.trim()||"What bounded step should I take next?";
  announce(llm.ready?"Asking Conscience local AI…":"Conscience is using its immediate deterministic proposer…");
  try{
    const raw=await llm.propose(q,admittedEvidence(),worldState());
    const proposal=normalizeProposal(raw,admittedEvidence().length),review=conscience.review(proposal);
    ecs.setResource("lastProposal",proposal);ecs.setResource("lastReview",review);
    ecs.emit("proposal-reviewed",{proposalId:proposal.id,decision:review.decision,score:review.score});
    renderProposal();announce(`Conscience proposal reviewed by Human Boundary Gate: ${review.decision}.`);
  }catch(e){announce(`Proposal failed safely: ${e.message}`);}
}

function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function resetProbe(){
  const p=ecs.get("probe","position"),v=ecs.get("probe","velocity");p[0]=.72;p[1]=0;p[2]=0;v[0]=0;v[1]=1.05;v[2]=0;
  announce("Probe reset. Evidence and decisions were preserved.");
}
function downloadLedger(){
  const payload={
    meta:{name:world.meta.name,version:world.meta.version,date:today,privacy:"No prompts are sent anywhere unless local WebLLM was explicitly enabled."},
    scanned:[...ecs.resource("scanned")],admitted:[...ecs.resource("admitted")],
    proposal:ecs.resource("lastProposal"),review:ecs.resource("lastReview"),events:ecs.events
  };
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
  a.download=`black-hole-conscience-ledger-${today}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
}

const input=ecs.resource("input");
const keyMap={ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right",ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down"};
addEventListener("keydown",e=>{
  if(e.target.matches("input,textarea,button,select"))return;
  if(keyMap[e.key]){input.add(keyMap[e.key]);e.preventDefault();}
  if(e.code==="Space"){scanNearest();e.preventDefault();}
});
addEventListener("keyup",e=>{if(keyMap[e.key])input.delete(keyMap[e.key]);});

document.querySelectorAll("[data-move]").forEach(b=>{
  const k=b.dataset.move;
  const down=e=>{input.add(k);e.preventDefault();},up=e=>{input.delete(k);e.preventDefault();};
  b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);b.addEventListener("pointerleave",up);
});
$("#scan").addEventListener("click",scanNearest);
$("#pause").addEventListener("click",()=>{
  ecs.setResource("paused",!ecs.resource("paused"));$("#pause").textContent=ecs.resource("paused")?"Resume":"Pause";announce(ecs.resource("paused")?"Paused.":"Resumed.");
});
$("#reset").addEventListener("click",resetProbe);
$("#assist").addEventListener("change",e=>{ecs.setResource("assist",e.target.checked);announce(`Assist mode ${e.target.checked?"on":"off"}.`);});
$("#ask").addEventListener("click",ask);
$("#downloadLedger").addEventListener("click",downloadLedger);

$("#enableLLM").addEventListener("click",async()=>{
  const b=$("#enableLLM");b.disabled=true;
  try{
    const model=await llm.enable(msg=>announce(msg));b.textContent=`Local LLM enabled: ${model}`;announce("Optional local LLM ready. Human Boundary Gate remains separate from Conscience.");
  }catch(e){b.disabled=false;announce(`${e.message} Deterministic proposer remains active.`);}
});

function updateTextState(){
  const n=nearestFragment(),p=ecs.get("probe","position"),en=ecs.get("probe","energy").value;
  $("#probeState").textContent=`Probe x ${p[0].toFixed(2)}, y ${p[1].toFixed(2)}, energy ${(en*100).toFixed(0)}%.`;
  $("#nearby").textContent=n?`Nearest: ${n.fragment.label}, distance ${n.distance.toFixed(2)}. ${n.distance<=world.game.scanRadius?"In scan range.":"Move closer."}`:"No fragment detected.";
}
renderEvidence();renderProposal();

let renderer=null;
renderer=await loadBestRenderer(canvas,msg=>rendererStatus.textContent=msg);
rendererStatus.textContent=`Renderer: ${renderer.kind}. Date seed: ${today}.`;

let last=performance.now(),textTick=0;
function frame(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;ecs.update(dt,now);renderer.render(drawables());
  if(now-textTick>350){updateTextState();textTick=now;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
announce("World ready. Scan evidence, decide what enters context, then ask for a bounded proposal.");
