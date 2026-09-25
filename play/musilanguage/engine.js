/* Musilanguage Music v2. Original local compositions and synthesizer.
 * v1 Carry the Fire score and renderer retained from blob d36ef0dab955132ab012085d674499ec703f371a.
 * Public-source metadata can seed variations. This is art, not research validation. */
'use strict';
(function(root){
const TRACKS=['guitar','bass','harp','strings','lead','drums'];
const NAMES={guitar:'Iron guitar',bass:'Funk bass',harp:'Harpsichord',strings:'String choir',lead:'Guide melody',drums:'Drums'};
const PRESETS={fusion:[82,86,70,66,68,80],metal:[100,80,38,60,65,92],classical:[22,48,100,100,70,32],funk:[46,100,68,34,52,92]};
function carry(){
const BPM=144,SPB=60/BPM,TAIL=2.8,TRACKS=['guitar','bass','harp','strings','lead','drums'];
const NAMES={guitar:'Iron guitar',bass:'Funk bass',harp:'Harpsichord',strings:'String choir',lead:'Guide melody',drums:'Drums'};
const PRESETS={fusion:[82,86,70,66,68,80],metal:[100,80,38,60,65,92],classical:[22,48,100,100,70,32],funk:[46,100,68,34,52,92]};
const sectionSpecs=[['I. Spark','Baroque prelude',8,'intro'],['II. The question','Syncopated verse',16,'verse'],['III. Carry the fire','Metal / strings chorus',8,'chorus'],['IV. Mirror fugue','Counterpoint exchange',8,'fugue'],['V. Seven steps','7/8 breakdown',8,'break'],['VI. Open hands','Final chorus',16,'final'],['VII. Ember','Return to the first cell',8,'outro']];
const TEXT={
intro:['Before the word, a rhythm.','Before the rhythm, a reply.','One hand against the silence.','One spark against the sky.'],
verse:['I heard a question knocking in the floor,','Four feet of thunder looking for a door.','A silver thread ran through a wall of sound;','I dropped the crown and kept the pulse I found.','Not every scar belongs beneath a light;','Not every silence asks us to ignite.','We learn the weight by changing what we hold;','We leave a place for stories still untold.'],
chorus:['Carry the fire—do not carry the throne.','No spark is small when it lights the way home.','Bend with the rhythm; let broken things mend.','What we can spare is where others begin.'],
fugue:['The strings ask. The keys answer.','The bass turns the question around.','Different voices; room for the difference.','A meeting—not a march—in the sound.'],
break:['DA-ka / DIM-da / TA-ra-DUM!','One for the question; one for the ground.','DA-ka / DIM-da / TA-ra-DUM!','Leave room for the voice that has not made a sound.'],
final:['Carry the fire—do not carry the throne.','No spark is small when it lights the way home.','Bend with the rhythm; let broken things mend.','What we can spare is where others begin.','Hold up the small; let the mighty make room.','Turn down the fear; let the low strings bloom.','Keep what can teach us. Change what can break.','Carry the fire for another dawn’s sake.'],
outro:['No final word. No finished sky.','A hand held open. A new reply.','Do what we must. Give what we can.','The smallest thunder: begin again.']};
let beat=0,barNumber=0;const sections=[],bars=[],events=[],cues=[];
function add(track,b,n,d=.25,v=.8,pan=0){events.push({track,b,n,d,v,pan});}
const chordRoots=[38,34,31,33],thirds=[3,4,3,4];
for(const [name,sub,count,kind] of sectionSpecs){const sec={name,sub,count,kind,start:beat,index:sections.length};sections.push(sec);for(let j=0;j<count;j++){const len=kind==='break'?3.5:4;bars.push({b:beat,len,j,kind,section:sec.index,number:barNumber++});beat+=len;}sec.end=beat;const lines=TEXT[kind];for(let i=0;i<lines.length;i++)cues.push({b:sec.start+(sec.end-sec.start)*i/lines.length,text:lines[i],section:sec.index});}
const END=beat,DURATION=END*SPB+TAIL;
function chord(bar){const z=bar.j%4;return {r:chordRoots[z],third:thirds[z]};}
for(const bar of bars){let {b,len,j,kind}=bar;let {r,third}=chord(bar);const quiet=kind==='intro'||kind==='outro',chorus=kind==='chorus'||kind==='final',fugue=kind==='fugue',br=kind==='break';
// The four-note subject is developed by transposition, answer, inversion and rhythm.
const cell=[r+36,r+36+third,r+38,r+35];
const arp=[r+24,r+31,r+36+third,r+43,r+36,r+31,r+36+third,r+31];
if(!br){for(let i=0;i<8;i++){let note=arp[(i+(fugue?j%2:0))%8];let v=quiet?.62:fugue?.73:.34;if(kind==='outro')v*=Math.max(.28,1-j*.09);add('harp',b+i*.5,note,.42,v,(i%2?1:-1)*.25);}if(quiet||fugue){for(let i=0;i<4;i++)add('lead',b+i*.75,cell[i],.62,quiet?.3:.57,-.1);}}
if(!br){for(const [n,p] of [[r+12,-.35],[r+19,.35],[r+24+third,.1]])add('strings',b,n,3.85,quiet?.32:chorus?.68:.32,p);}
if(!quiet){
// Two separately detuned, panned low-string voices; rests are part of the riff.
const hits=br?[0,.5,1,1.25,2,2.5,3]:fugue?[0,1.5,2.5]:chorus?[0,.5,.75,1.5,2,2.5,2.75,3.5]:[0,.5,.75,1.5,2.25,2.5,3.25,3.75];
for(let k=0;k<hits.length;k++){let pos=hits[k],n=r;if(!chorus&&k===hits.length-1)n+=j%2?2:1;let dur=chorus&&k%4===0?.41:.18;for(const pan of [-.72,.72]){add('guitar',b+pos,n,dur,fugue?.42:.8,pan);if(chorus||br)add('guitar',b+pos,n+7,dur,.5,pan);}}
const bassHits=br?[0,.5,1,1.5,2,2.75,3.25]:[0,.75,1.5,1.75,2.25,2.75,3.25,3.75];
for(let k=0;k<bassHits.length;k++){const off=[0,0,12,7,0,third+12,7,12][k%8];add('bass',b+bassHits[k],r-12+off,k%3===0?.4:.2,.78);}
// Drum part: backbeat, displaced kicks, ghost notes, then a 2+2+3 odd-meter break.
const kicks=br?[0,.75,1.5,2,2.25,3]:chorus?[0,.5,.75,1.75,2,2.5,2.75,3.5,3.75]:[0,.75,2,2.75,3.5];
for(const p of kicks)add('drums',b+p,36,.18,.9);
for(const p of (br?[1,2.5]:[1,3]))add('drums',b+p,38,.21,.85);
if(!br&&j%2===1)for(const p of [1.75,2.75])add('drums',b+p,38,.12,.25);
for(let i=0;i<len*2;i++)add('drums',b+i*.5+(i%2&&!chorus&&!br?.035:0),i===len*2-1&&j%2===1?46:42,.11,i%2?.38:.53,.24);
if(j%4===0)add('drums',b,49,1.2,.58,-.3);
if(j%4===3)for(let i=0;i<4;i++)add('drums',b+len-1+i*.25,[45,45,43,41][i],.23,.63,(i-1.5)*.16);
}else{
add('bass',b,r-12,3.6,.44);
if(kind==='intro'&&j>=4){add('drums',b,36,.16,.44);add('drums',b+2,36,.16,.35);for(let i=0;i<8;i++)add('drums',b+i*.5,42,.1,.18,.2);}
}
if(chorus){const melody=j%2===0?[r+36+third,r+43,r+41,r+36+third]:[r+38,r+36,r+35,r+36];for(let i=0;i<4;i++)add('lead',b+i,melody[i],i===3?.88:.72,.69,.05);}
if(kind==='verse'){for(let i=0;i<3;i++)add('lead',b+.5+i,cell[(i+j)%4],.43,.32,.1);}
if(fugue){const inv=[r+36,r+33,r+34,r+38];for(let i=0;i<4;i++){add('harp',b+.5+i*.75,inv[i],.6,.6,.4);add('strings',b+i*.75,cell[i]-12,.61,.54,-.4);}}
if(br){for(const p of [0,1,2])add('lead',b+p,r+24+(p===2?7:0),p===2?.6:.32,.5,-.2);}
}
// Resolve the last four bars back to D and end on a held open fifth.
const codaStart=sections.at(-1).start;for(let i=events.length-1;i>=0;i--)if(events[i].b>=END-4)events.splice(i,1);
for(const [track,n,v]of[['bass',26,.6],['harp',62,.7],['harp',69,.45],['strings',50,.65],['strings',57,.55],['lead',74,.45]])add(track,END-4,n,3.5,v);
events.sort((a,z)=>a.b-z.b);cues.sort((a,z)=>a.b-z.b);

return {id:'carry-the-fire',title:'Carry the Fire',bpm:BPM,key:'D harmonic minor',description:'The original fire: baroque keys, iron riffs and seven-step thunder.',duration:DURATION,end:END,sections,events,cues,seed:0};
}
function renderer(score){
const BPM=score.bpm,SPB=60/BPM,DURATION=score.duration,events=score.events,sections=score.sections,cues=score.cues;
function noise(seed){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/2147483648-1;};}
const cache=new Map();
function sample(ctx,e){const sr=22050,d=e.d*SPB,drum=e.track==='drums';const release=e.track==='strings'?.42:e.track==='harp'?.28:.09;const length=drum?(e.n===49?1.6:e.n===46?.25:.35):d+release;const key=[sr,e.track,e.n,e.d,e.pan].join(':');if(cache.has(key))return cache.get(key);const out=ctx.createBuffer(1,Math.ceil(length*sr),sr),a=out.getChannelData(0),rand=noise(7131+e.n*173+Math.round(e.pan*99));const f=440*Math.pow(2,(e.n-69)/12)*(e.track==='guitar'?(e.pan<0?.9985:1.0015):1);let low=0,prior=0,high=0,phase=0;
for(let i=0;i<a.length;i++){let t=i/sr,s=0,env=1;const w=2*Math.PI*f*t;if(drum){const n=rand();if(e.n===36){phase+=2*Math.PI*(47+112*Math.exp(-t*45))/sr;s=Math.sin(phase)*Math.exp(-t*14)+n*.12*Math.exp(-t*140);}else if(e.n===38){low+=.18*(n-low);s=(n-low)*.85*Math.exp(-t*19)+Math.sin(2*Math.PI*184*t)*.48*Math.exp(-t*27);}else if([42,46,49].includes(e.n)){low+=.36*(n-low);const decay=e.n===49?3.6:e.n===46?14:55;s=((n-low)*.7+.12*Math.sin(2*Math.PI*4133*t)*Math.sin(2*Math.PI*6173*t))*Math.exp(-t*decay)*.45;}else{phase+=2*Math.PI*((e.n===45?140:e.n===43?113:88)+65*Math.exp(-t*24))/sr;s=(Math.sin(phase)+n*.045)*Math.exp(-t*13);}}
else{const attack=e.track==='strings'?.08:.004;env=Math.min(1,t/attack)*Math.min(1,Math.max(0,(length-t)/release));if(e.track==='guitar'){const pluck=.75*Math.sin(w)+.35*Math.sin(2*w)+.23*Math.sin(3*w)+.12*Math.sin(5*w);s=Math.tanh((pluck+rand()*.04*Math.exp(-t*90))*4.2)*(.58+.42*Math.exp(-t*17));low+=.29*(s-low);high=.986*(high+low-prior);prior=low;s=high*.58;}else if(e.track==='bass'){s=(Math.sin(w)+.3*Math.sin(2*w)*Math.exp(-t*7)+.16*Math.sin(3*w)*Math.exp(-t*22)+rand()*.06*Math.exp(-t*85))*.8*Math.exp(-t*1.2);}else if(e.track==='harp'){s=(Math.sin(w)+.4*Math.sin(2*w)+.23*Math.sin(3*w)+.12*Math.sin(5*w)+.07*Math.sin(7*w))*Math.exp(-t*5.5)*.55;}else if(e.track==='strings'){s=(Math.sin(w+.025*Math.sin(2*Math.PI*5.2*t))+.32*Math.sin(2*w)+.17*Math.sin(3*w)+.16*Math.sin(w*1.003))*.36;}else{s=(Math.sin(w+.028*Math.sin(2*Math.PI*5*t))+.22*Math.sin(2*w)+.08*Math.sin(3*w))*.58;}}
a[i]=s*env*Math.min(1,(length-t)*100);}
cache.set(key,out);return out;}
function graph(ctx,levels,vol=1){const master=ctx.createGain(),sum=ctx.createGain(),comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=3;comp.attack.value=.004;comp.release.value=.14;sum.connect(comp);comp.connect(master);master.gain.value=vol*.72;master.connect(ctx.destination);const reverb=ctx.createConvolver(),wet=ctx.createGain();let ir=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.25),ctx.sampleRate);for(let c=0;c<2;c++){const x=ir.getChannelData(c),rnd=noise(871+c);for(let i=0;i<x.length;i++)x[i]=rnd()*Math.pow(1-i/x.length,3)*.22;}reverb.buffer=ir;reverb.connect(wet);wet.gain.value=.24;wet.connect(sum);const gains={};for(const t of TRACKS){let g=ctx.createGain();g.gain.value=levels[t]/100;g.connect(sum);const send=ctx.createGain();send.gain.value=t==='strings'?.28:t==='harp'?.15:t==='lead'?.12:.025;g.connect(send);send.connect(reverb);gains[t]=g;}return {master,gains};}
const amps={guitar:.145,bass:.3,harp:.2,strings:.17,lead:.18,drums:.46};
let stemCache=null;
function stems(ctx){if(stemCache)return stemCache;const sr=22050,frames=Math.ceil(DURATION*sr),out={};for(const track of TRACKS){const stereo=['guitar','harp','strings'].includes(track);out[track]=ctx.createBuffer(stereo?2:1,frames,sr);}for(const e of events){const data=sample(ctx,e).getChannelData(0),buf=out[e.track],left=buf.getChannelData(0),right=buf.numberOfChannels===2?buf.getChannelData(1):null,start=Math.round(e.b*SPB*sr),level=e.v*amps[e.track],angle=(e.pan+1)*Math.PI/4,lg=right?Math.cos(angle):1,rg=Math.sin(angle),end=Math.min(data.length,frames-start);for(let i=0;i<end;i++){left[start+i]+=data[i]*level*lg;if(right)right[start+i]+=data[i]*level*rg;}}stemCache=out;return out;}
function schedule(ctx,g,offset,when){const buffers=stems(ctx);for(const track of TRACKS){const source=ctx.createBufferSource();source.buffer=buffers[track];source.connect(g.gains[track]);source.start(when,offset);}return TRACKS.length;}
function wav(buffer){const n=buffer.length,ch=buffer.numberOfChannels,bytes=new ArrayBuffer(44+n*ch*2),v=new DataView(bytes);function str(p,s){for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i));}str(0,'RIFF');v.setUint32(4,36+n*ch*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*ch*2,true);const data=Array.from({length:ch},(_,i)=>buffer.getChannelData(i));let p=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){let x=Math.max(-1,Math.min(1,data[c][i]));v.setInt16(p,x<0?x*32768:x*32767,true);p+=2;}return bytes;}
async function render(levels,sr=44100){const ctx=new OfflineAudioContext(2,Math.ceil(DURATION*sr),sr),g=graph(ctx,levels,1);schedule(ctx,g,0,0);return ctx.startRendering();}
function vlq(n){let a=[n&127];while((n>>=7)>0)a.unshift((n&127)|128);return a;}
function midi(){const enc=new TextEncoder(),ppq=480,tracks=[];function meta(type,text){const z=Array.from(enc.encode(text));return [255,type,...vlq(z.length),...z];}function chunk(es){es.sort((a,b)=>a.t-b.t||a.order-b.order);let last=0,data=[];for(const e of es){data.push(...vlq(e.t-last),...e.d);last=e.t;}data.push(0,255,47,0);return [...enc.encode('MTrk'),(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255,...data];}const micro=Math.round(60000000/BPM),con=[{t:0,order:0,d:[255,81,3,(micro>>>16)&255,(micro>>>8)&255,micro&255]},{t:0,order:0,d:meta(3,score.title+' - Musilanguage')}];for(const s of sections){con.push({t:Math.round(s.start*ppq),order:0,d:meta(6,s.name)});con.push({t:Math.round(s.start*ppq),order:1,d:[255,88,4,s.meter?s.meter[0]:(s.kind==='break'?7:4),s.meter?Math.log2(s.meter[1]):(s.kind==='break'?3:2),24,8]});}for(const c of cues)con.push({t:Math.round(c.b*ppq),order:2,d:meta(5,c.text)});tracks.push(chunk(con));const programs=[30,36,6,48,81,0];TRACKS.forEach((track,i)=>{let ch=track==='drums'?9:i,es=[{t:0,order:0,d:meta(3,NAMES[track])},{t:0,order:0,d:[192|ch,programs[i]]}];const seen=new Set();for(const e of events.filter(e=>e.track===track)){const key=[e.b,e.n,e.d].join(':');if(seen.has(key))continue;seen.add(key);es.push({t:Math.round(e.b*ppq),order:2,d:[144|ch,e.n,Math.round(e.v*110)]},{t:Math.round((e.b+e.d)*ppq),order:1,d:[128|ch,e.n,0]});}tracks.push(chunk(es));});return new Uint8Array([...enc.encode('MThd'),0,0,0,6,0,1,0,tracks.length,1,224,...tracks.flat()]);}
return {render,midi,wav};
}
const SONGS=[
{id:'cathedral-of-sparks',title:'Cathedral of Sparks',bpm:152,root:40,key:'E harmonic minor',flavor:'metal',description:'A clockwork prelude opens into double-kick thunder and a 7/8 iron procession.',progression:[0,-4,-7,-5],thirds:[3,4,3,4],counts:[12,12,8,8,8,16,8],odd:3.5,
words:[
['Copper rain on the windowsill,','The city sleeps; the wires are still.','A crooked bell remembers light,','And rings a crack into the night.'],
['I built a tower out of answers,','Every stone a borrowed name.','Then a question shook the rafters;','Nothing honest stayed the same.','Let the velvet curtains shiver.','Let the iron organ breathe.','There is room inside the thunder','For a voice beneath the teeth.'],
['Raise no altar to the spark—','Let it travel through the dark.','We are more than what we know.','Strike the chord and let it grow.'],
['One small phrase climbs up the stair.','Another meets it in the air.','The keys run wild; the strings reply.','No single voice can hold the sky.'],
['TA-ka / DUM-ka / RI-ba-DUM!','Break the lock—not the hand on the door.','TA-ka / DUM-ka / RI-ba-DUM!','Leave it wider than it was before.'],
['Raise no altar to the spark—','Let it travel through the dark.','We are more than what we know.','Strike the chord and let it grow.','When the biggest bell is broken,','Let a thousand small ones ring.','In the space we leave each other,','Hear the unfinished city sing.'],
['Copper rain. An open gate.','No perfect world for which to wait.','Take the light that made it through.','Leave a little burning, too.']]},
{id:'gravity-wears-dancing-shoes',title:'Gravity Wears Dancing Shoes',bpm:112,root:38,key:'D Dorian / funk',flavor:'funk',description:'Elastic bass, offbeat keys, chunky guitars, and a five-beat dance-floor detour.',progression:[0,5,3,7],thirds:[3,4,4,3],counts:[8,16,8,8,8,16,4],odd:5,
words:[
['The floor says down. The bass says maybe.','The clock walks straight; the snare goes crazy.','A little room between the rules—','Gravity wears dancing shoes.'],
['I put my worry in a coat of brass,','It caught the beat and let the morning pass.','My left foot asked what the right one knew;','We missed one step and made a brand-new two.','The fancy staircase had a missing stair.','We built a ramp and left the music there.','No velvet rope around the second chance;','Bring your strange and let the strange ones dance.'],
['Down to the ground, then up on the two!','The world has weight, but it has room for you.','Slip in the space where the backbeat moves—','Gravity wears dancing shoes.'],
['Bass: a question with a rubber spine.','Keys: an answer, just a shade behind.','Strings lean left and the kick comes through.','Nobody owns what the whole room grew.'],
['BOOM-ba / KI-da / WA-ka / DUM-da / HEY!','Five little steps take the long way home.','BOOM-ba / KI-da / WA-ka / DUM-da / HEY!','Keep the pocket; leave the door alone.'],
['Down to the ground, then up on the two!','The world has weight, but it has room for you.','Slip in the space where the backbeat moves—','Gravity wears dancing shoes.','Less of the posing, more of the groove.','Something worth keeping has room to improve.','Pass that good rhythm to somebody new.','A floor full of different is a better view.'],
['Leave the last beat open.','Let the next foot choose.','Even heavy hearts can move—','In gravity’s dancing shoes.']]},
{id:'no-small-thunder',title:'No Small Thunder',bpm:132,root:36,key:'C minor / symphonic metal',flavor:'anthem',description:'A quiet string invocation, palm-muted verses, a broad chorus, and a half-time breakdown.',progression:[0,-4,5,7],thirds:[3,4,3,4],counts:[8,16,8,8,8,16,8],odd:4,
words:[
['A match beside a mountain.','A whisper in the rain.','Not everything that changes us','Arrives upon a train.'],
['I have no map that knows your weather,','No borrowed crown that makes me wise.','But I can hold a door against it;','I can look you in the eyes.','We do not need a thousand banners','To lift a stone from someone’s way.','A small refusal to abandon','Can turn the color of a day.'],
['There is no small thunder','When it breaks a wall of fear.','There is no lost voice here—','Make a space and let it clear.'],
['The low strings keep the question.','The bright keys carry air.','One phrase becomes another','Without pretending they were there.'],
['DUM—ka / DUM—ka / RISE—again!','Hold the line; don’t build a cage.','DUM—ka / DUM—ka / RISE—again!','Turn the wound into a page.'],
['There is no small thunder','When it breaks a wall of fear.','There is no lost voice here—','Make a space and let it clear.','Let the youngest have tomorrow.','Let the weary have a chair.','We can change the weight we carry','By remembering who is there.'],
['Keep the truth. Release the armor.','Let the last chord turn to air.','Not a promise to be perfect—','Just a promise to take care.']]}
];
function hash(text){let h=2166136261;for(const c of String(text)){h=Math.imul(h^c.codePointAt(0),16777619);}return h>>>0;}
function compose(id,seed=0){
 if(id==='carry-the-fire')return carry();
 const def=SONGS.find(s=>s.id===id);if(!def)throw Error('Unknown track: '+id);
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Seed must be a uint32.');
 const shift=seed?[-2,0,2,3,5][seed%5]:0,BPM=def.bpm,spb=60/BPM;
 const kinds=['intro','verse','chorus','solo','break','final','outro'];
 const names=['I. First light','II. The question','III. The answer','IV. Voices in motion','V. Broken symmetry','VI. All together','VII. Carry it onward'];
 const sections=[],events=[],cues=[],bars=[];let b=0;
 const add=(track,b,n,d=.3,v=.7,pan=0)=>events.push({track,b,n,d,v,pan});
 kinds.forEach((kind,s)=>{const start=b,len=kind==='break'?def.odd:4;for(let j=0;j<def.counts[s];j++){bars.push({b,j,kind,len});b+=len;}sections.push({name:names[s],sub:kind==='break'?(def.odd===3.5?'7/8 · 2+2+3':def.odd===5?'5/4 · elastic detour':'Half-time wall of sound'):kind,kind,start,end:b,count:def.counts[s],index:s,meter:len===3.5?[7,8]:len===5?[5,4]:[4,4]});def.words[s].forEach((text,i)=>cues.push({b:start+(b-start)*i/def.words[s].length,text,section:s}));});
 for(const bar of bars){const {b,j,kind,len}=bar,q=j%4,r=def.root+shift+def.progression[q],third=def.thirds[q],quiet=kind==='intro'||kind==='outro',chorus=kind==='chorus'||kind==='final',solo=kind==='solo',br=kind==='break',funk=def.flavor==='funk';
 const variant=seed?(hash(seed+':'+j+':'+kind)%3):0;
 const chord=[r+24,r+24+third,r+31,r+36],arp=[0,2,1,3,2,1,2,0];
 // Sustained strings, split voicing; classical counterpoint passes between keys and lead.
 if(!funk||quiet||chorus)for(const [i,n] of [r+12,r+12+third,r+19].entries())add('strings',b,n,len-.2,quiet?.43:chorus?.7:.28,(i-1)*.42);
 const steps=Math.floor(len*2);
 if(funk&&!quiet){for(const x of [.5,1.75,2.5,3.75].filter(x=>x<len-.1))for(const n of chord.slice(1))add('harp',b+x,n,.18,.43,.22);}
 else for(let i=0;i<steps;i++)add('harp',b+i*.5,chord[arp[(i+variant)%8]],quiet?.46:.23,quiet?.64:solo?.62:.34,(i%2?.3:-.3));
 const motif=[0,third,7,12,11,7,third,2];
 if(quiet||solo){for(let i=0;i<steps;i++)add('lead',b+i*.5,r+24+motif[(i+j%2*4+variant)%8],.42,quiet?.25:.62,solo?-.3:.06);}
 if(quiet){add('bass',b,Math.max(24,r-12),len-.25,.36);if(kind==='intro'&&j>=def.counts[0]-4)for(const x of [0,2])add('drums',b+x,36,.2,.33);continue;}
 const guitarHits=br?(len===3.5?[0,.5,1,1.25,2,2.5,3]:[0,.5,.75,2,2.75,3.5]):funk?[.25,.75,1.5,2.25,3,3.75]:[0,.5,.75,1.5,2,2.5,2.75,3.5];
 for(const [i,x]of guitarHits.entries()){const n=r+(variant===2&&i===guitarHits.length-1?2:0),d=chorus&&i%4===0?.43:.17;for(const pan of [-.7,.7]){add('guitar',b+x,n,d,funk?.46:.76,pan);if(chorus||br)add('guitar',b+x,n+7,d,.45,pan);}}
 const bassHits=funk?[0,.75,1.25,1.75,2.5,2.75,3.25,3.75]:br?[0,.75,1.5,2,2.75,3.25]:[0,.75,1.5,2,2.75,3.5];
 const bassNotes=funk?[0,12,7,10,0,third+12,7,12]:[0,0,7,0,12,7,0,12];
 for(const [i,x]of bassHits.entries())if(x<len)add('bass',b+x,Math.max(24,r-12)+bassNotes[(i+variant)%bassNotes.length],i%3===0?.38:.2,funk?.9:.76);
 if(len===5){add('bass',b+4,r, .7,.85);add('guitar',b+4,r+12,.27,.58,-.4);}
 const kick=br?[0,.75,2,2.25,3]:funk?[0,.75,2.25,3.5]:chorus?[0,.5,.75,1.75,2,2.5,2.75,3.75]:[0,.75,1.5,2,2.75,3.5];
 for(const x of kick.filter(x=>x<len))add('drums',b+x,36,.2,.86);
 for(const x of (br?(len===3.5?[1,2.5]:[2]):[1,3]))add('drums',b+x,38,.24,.82);
 for(let i=0;i<steps;i++)add('drums',b+i*.5+(funk&&i%2?.035:0),i===steps-1&&j%2?46:42,.12,i%2?.36:.55,.25);
 if(funk)for(const x of [1.75,2.75])add('drums',b+x,38,.12,.22);
 if(j%4===0)add('drums',b,49,1.2,.56,-.3);
 if(j%4===3){for(let i=0;i<4;i++)add('drums',b+len-1+i*.25,[45,43,45,41][(i+variant)%4],.22,.65,(i-1.5)*.18);}
 if(chorus){const mel=j%2?[7,third,2,0]:[third,7,12,11];for(let i=0;i<4;i++)add('lead',b+i,r+24+mel[(i+variant)%4],i===3?.9:.72,.72,.02);}
 if(kind==='verse')for(let i=0;i<3;i++)add('lead',b+.5+i,r+24+[0,third,7,2][(i+j)%4],.4,.32,.03);
 if(br)for(const x of [0,1,2])add('lead',b+x,r+24+(x===2?7:0),.35,.46,-.2);
 if(solo)for(let i=0;i<8;i++)add('harp',b+i*.5,r+36+[0,2,third,7,11,7,third,2][(7-i+variant)%8],.3,.55,.4);
 }
 const end=b;for(let i=events.length-1;i>=0;i--)if(events[i].b>=end-4)events.splice(i,1);
 for(const [track,n,v]of[['bass',def.root-12,.48],['strings',def.root+12,.65],['strings',def.root+19,.58],['harp',def.root+24,.65],['lead',def.root+36,.4]])add(track,end-4,n+shift,3.7,v);
 events.sort((a,z)=>a.b-z.b);
 return {id,title:def.title,bpm:BPM,key:def.key+(shift?' · transposed '+shift+' semitones':''),description:def.description,duration:end*spb+2.8,end,sections,events,cues,seed};
}
const catalog=[{id:'carry-the-fire',title:'Carry the Fire',bpm:144,key:'D harmonic minor',description:'The original fire. Seven movements, one shared spark.'},...SONGS.map(({id,title,bpm,key,description})=>({id,title,bpm,key,description}))];
root.MusilanguageEngine={version:'2.0.0',catalog,compose,renderer,hash,TRACKS,PRESETS,levels:(preset='fusion')=>Object.fromEntries(TRACKS.map((t,i)=>[t,PRESETS[preset][i]]))};
})(typeof window==='undefined'?globalThis:window);
