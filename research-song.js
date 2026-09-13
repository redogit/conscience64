(()=>{
'use strict';

const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;
const KEY='conscience64.researchSong.enabled';
const lines=Object.freeze([
  'Meaning moves. Memory maps. Models meet the measure.',
  'Syntax shapes signals. Semantics survives the switch.',
  'Subject stays. Structure shifts. Semantics still survives.',
  'Carrier crosses context. Consequence continues. Remainder remains.',
  'Input. Relation. Plan. Output. Observe the change and keep the remainder.',
  'Life, learning, living belong inside the calculation.',
  'Cost counts. Time turns. Ethics edges every plan.',
  'Period. Enter. Tweet. Explode. Compress the carrier. Keep the code.',
  'Witness written. Verifier works. Search can still swell.',
  'N P hardness needs a reduction. Resemblance is not reduction.',
  'P versus N P stays open. Proof pending. Pattern is not proof.',
  'Unicode units. U T F eight bytes. Float sixty four brings the bytes back.',
  'Minimal repair. Smallest shift. Strict test. Surviving structure.',
  'Hodge classes call for cycles. Coincidence cannot close the conjecture.',
  'Compress. Compare. Counterprobe. Carry. Claim only what survives.',
  'Period. Enter. Tweet. Explode. Say it. Test it. Trace what changed.'
]);
const scale=[0,2,3,5,7,9,10,12];
let ctx=null,master=null,timer=null,nextTime=0,step=0,started=false,enabled=true,ducked=false,ui=null;
try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
const hash=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
const midi=n=>440*Math.pow(2,(n-69)/12);
function wordNotes(line){return line.replace(/[^\p{L}\p{N}' ]/gu,' ').trim().split(/\s+/).filter(Boolean).map((w,i)=>({degree:(w.length+i+hash(w)%3)%scale.length,accent:/^[A-Z]/.test(w),len:w.length}));}
const mapped=lines.map(wordNotes);
function tone(freq,time,dur=.12,{type='triangle',gain=.04,detune=0}={}){if(!ctx||!master)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);o.detune.setValueAtTime(detune,time);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+dur);o.connect(g).connect(master);o.start(time);o.stop(time+dur+.03);}
function kick(time){if(!ctx||!master)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(115,time);o.frequency.exponentialRampToValueAtTime(42,time+.11);g.gain.setValueAtTime(.12,time);g.gain.exponentialRampToValueAtTime(.0001,time+.14);o.connect(g).connect(master);o.start(time);o.stop(time+.16);}
function hat(time){if(!ctx||!master)return;const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.035),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;hp.type='highpass';hp.frequency.value=5500;g.gain.setValueAtTime(.025,time);g.gain.exponentialRampToValueAtTime(.0001,time+.035);src.connect(hp).connect(g).connect(master);src.start(time);}
function bass(time,index){const root=45+[0,5,3,7][index%4];tone(midi(root),time,.23,{type:'sawtooth',gain:.035});tone(midi(root-12),time,.24,{type:'sine',gain:.035});}
function updateCaption(lineIndex){if(!ui)return;const cap=ui.querySelector('[data-song-line]');if(cap)cap.textContent=lines[lineIndex];}
function schedule(time,n){const lineIndex=Math.floor(n/16)%lines.length,notes=mapped[lineIndex],local=n%16;if(local===0){bass(time,Math.floor(n/16));setTimeout(()=>updateCaption(lineIndex),Math.max(0,(time-ctx.currentTime)*1000));}if(local%4===0)kick(time);if(local%2===1)hat(time);if(notes.length){const item=notes[(local+Math.floor(n/16))%notes.length],root=60+scale[item.degree],oct=item.len>7?12:0;tone(midi(root+oct),time,.095,{type:item.accent?'square':'triangle',gain:item.accent ? .028 : .021,detune:(item.len%3-1)*4});if(local%4===2)tone(midi(root-12),time+.03,.13,{type:'sine',gain:.016});}}
function tick(){if(!ctx||!started)return;const beat=60/132/2;while(nextTime<ctx.currentTime+.18){schedule(nextTime,step++);nextTime+=beat;}}
function applyGain(){if(!master||!ctx)return;const target=ducked ? .012 : .065;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(target,ctx.currentTime,.04);}
async function start(){if(!enabled||!AudioContext||started)return false;ctx=new AudioContext();master=ctx.createGain();master.gain.value=.0001;master.connect(ctx.destination);try{await ctx.resume();}catch{}started=true;nextTime=ctx.currentTime+.04;applyGain();timer=setInterval(tick,45);tick();renderState();return true;}
function stop(){started=false;if(timer)clearInterval(timer);timer=null;try{ctx?.close();}catch{}ctx=null;master=null;renderState();}
function setEnabled(value){enabled=!!value;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}if(!enabled)stop();renderState();}
function setDucked(value){ducked=!!value;applyGain();}
function renderState(){if(!ui)return;const b=ui.querySelector('[data-song-toggle]');if(b)b.textContent=enabled?(started?'♫ Song on':'♫ Song armed'):'♫ Song off';ui.dataset.active=started?'true':'false';}
function installUI(){if(document.getElementById('research-song-dock'))return;ui=document.createElement('div');ui.id='research-song-dock';ui.className='research-song-dock';ui.innerHTML='<button type="button" data-song-toggle aria-pressed="false">♫ Song armed</button><span data-song-line>Keep the Remainder: first interaction starts the procedural song.</span>';const style=document.createElement('style');style.textContent=`.research-song-dock{position:fixed;z-index:2147482999;left:.75rem;bottom:.75rem;max-width:min(38rem,calc(100vw - 10rem));display:flex;align-items:center;gap:.55rem;padding:.4rem .55rem;border:1px solid rgba(125,145,170,.5);border-radius:.7rem;background:rgba(12,18,30,.78);color:#eef4ff;font:600 .72rem/1.3 system-ui,sans-serif;backdrop-filter:blur(8px);box-shadow:0 .35rem 1.3rem rgba(0,0,0,.22)}.research-song-dock button{font:inherit;white-space:nowrap;padding:.35rem .5rem;border:1px solid #53647d;border-radius:.45rem;background:#17243a;color:inherit;cursor:pointer}.research-song-dock [data-song-line]{font-weight:500;color:#c7d3e7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.research-song-dock[data-active="true"]{border-color:rgba(199,255,172,.5)}@media(max-width:650px){.research-song-dock{max-width:calc(100vw - 1.5rem);right:.75rem;bottom:3.8rem}.research-song-dock [data-song-line]{display:none}}@media(prefers-reduced-motion:reduce){.research-song-dock{backdrop-filter:none}}`;document.head.appendChild(style);document.body.appendChild(ui);ui.querySelector('[data-song-toggle]').addEventListener('click',async e=>{e.stopPropagation();if(enabled&&started)setEnabled(false);else{setEnabled(true);await start();}});renderState();}
function arm(){if(!enabled||started)return;start();}
addEventListener('voice-anywhere-state',e=>setDucked(['listening','speaking','heard'].includes(e.detail?.phase)));
addEventListener('blur',()=>setDucked(true));addEventListener('focus',()=>setDucked(false));
const boot=()=>{installUI();if(enabled){document.addEventListener('pointerdown',arm,{once:true,capture:true});document.addEventListener('keydown',arm,{once:true,capture:true});}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
globalThis.ResearchSong=Object.freeze({version:'1.1.0',lines,start,stop,setEnabled,setDucked,get state(){return{enabled,started,ducked,step};}});
})();
