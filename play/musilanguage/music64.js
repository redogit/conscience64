/* MUSIC64/v1: six-note musical cells in binary64 mantissas, not stored recordings.
 * Original creative mapping. Source text, UTF-8 rank and recipes remain distinct. */
'use strict';
(function(root){
const U=root.UTF8MusicSpace, BASE=0x3ff0000000000000n, MASK=(1n<<52n)-1n;
const FIELDS=[['notes',18],['rhythm',8],['tonic',4],['mode',3],['tempo',7],['meter',2],['style',2],['transform',2],['intensity',6]];
const MODES=[['Harmonic minor',[0,2,3,5,7,8,11,12]],['Dorian',[0,2,3,5,7,9,10,12]],['Natural minor',[0,2,3,5,7,8,10,12]],['Phrygian',[0,1,3,5,7,8,10,12]],['Major',[0,2,4,5,7,9,11,12]],['Lydian',[0,2,4,6,7,9,11,12]],['Minor pentatonic',[0,3,5,7,10,12,15,17]],['Whole tone',[0,2,4,6,8,10,12,14]]];
const STYLES=['Fusion','Metal','Classical','Funk'], METERS=[[4,4],[7,8],[5,4],[3,4]], NOTES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
function integer(x,lo,hi,name){if(!Number.isSafeInteger(x)||Object.is(x,-0)||x<lo||x>hi)throw Error(name+' must be an integer in '+lo+'..'+hi);return x;}
function rawFloat(h){const v=new DataView(new ArrayBuffer(8));v.setBigUint64(0,h,false);return v.getFloat64(0,false);}
function floatBits(x){if(typeof x!=='number'||!Number.isFinite(x)||x<1||x>=2)throw Error('MUSIC64 floats must be finite and in [1,2).');const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,x,false);return v.getBigUint64(0,false);}
function pack(p){let v=0n,offset=0n;for(const [name,bits]of FIELDS){integer(p[name],0,name==='tonic'?11:2**bits-1,name);v|=BigInt(p[name])<<offset;offset+=BigInt(bits);}return rawFloat(BASE|v);}
function unpack(f){let v=floatBits(f)&MASK;const p={};for(const [name,bits]of FIELDS){p[name]=Number(v&((1n<<BigInt(bits))-1n));v>>=BigInt(bits);}integer(p.tonic,0,11,'tonic');return p;}
function hex(f){unpack(f);return 'm64v1:'+floatBits(f).toString(16).padStart(16,'0');}
function parse(value){if(typeof value==='number'){unpack(value);return value;}if(typeof value!=='string')throw Error('MUSIC64 address or decimal required.');const s=value.trim();if(/^m64v1:3ff[0-9a-f]{13}$/.test(s)){const f=rawFloat(BigInt('0x'+s.slice(6)));unpack(f);return f;}if(!/^1(?:\.\d+)?$/.test(s))throw Error('Use m64v1:hex or the full round-trip decimal.');const f=Number(s);unpack(f);return f;}
function config(p={}){const c={tonic:2,mode:0,bpm:144,meter:0,style:0,transform:0,intensity:48,...p};for(const [k,max]of [['tonic',11],['mode',7],['meter',3],['style',3],['transform',3],['intensity',63]])integer(c[k],0,max,k);integer(c.bpm,72,199,'BPM');return c;}
function noteCode(a){return a.reduce((v,n,i)=>v|(n<<(i*3)),0);}
function digits(n){return Array.from({length:6},(_,i)=>(n>>>(i*3))&7);}
function sourcePacket(text){const raw=U.bytes(text),coordinates=[];for(let i=0;i<raw.length;i+=6){let v=0;for(let j=0;j<6;j++)v=v*256+(raw[i+j]??0);coordinates.push(v);}return {text,utf8Bytes:raw.length,utf8Hex:Array.from(raw,b=>b.toString(16).padStart(2,'0')).join(''),rank:U.rank(raw).toString(),coordinateFormat:'six-byte-big-endian-zero-padded-exact-integer-f64',coordinates,padBytes:(6-raw.length%6)%6};}
function fromText(text,settings={}){
 const c=config(settings),source=sourcePacket(text),raw=U.bytes(text);if(!raw.length)throw Error('Give the instrument at least one character.');
 const count=Math.ceil(raw.length/6),used=Math.min(32,count),selection=[],cells=[];
 for(let k=0;k<used;k++){const index=used===1?0:Math.floor(k*(count-1)/(used-1));selection.push(index);const a=Array.from({length:6},(_,j)=>raw[index*6+j]??0);let rhythm=0x91;for(let j=0;j<6;j++)rhythm^=((a[j]+j*17)<<(j%3))&255;rhythm|=0x91;
 cells.push(hex(pack({notes:noteCode(a.map(b=>b%8)),rhythm,tonic:c.tonic,mode:c.mode,tempo:c.bpm-72,meter:c.meter,style:c.style,transform:c.transform,intensity:c.intensity})));}
 return {schema:'music64/recipe/v1',form:'word-forge-32bars/v1',cells,source,selection,coverage:{sourceBytes:raw.length,totalSixByteBlocks:count,activeCells:used,policy:'At most 32 evenly spaced six-byte blocks; full source retained, unselected blocks not sonified.'},mapping:'Designed byte-to-music mapping, not the meaning or natural sound of a language.'};
}
function validate(recipe){if(!recipe||recipe.schema!=='music64/recipe/v1'||recipe.form!=='word-forge-32bars/v1'||!Array.isArray(recipe.cells)||recipe.cells.length<1||recipe.cells.length>32)throw Error('Unsupported recipe or cell count.');const p=recipe.cells.map(x=>unpack(parse(x)));const shared=FIELDS.map(x=>x[0]).filter(x=>!['notes','rhythm'].includes(x));for(const x of p)for(const k of shared)if(x[k]!==p[0][k])throw Error('Shared musical settings differ between cells: '+k);return p;}
function fromFloat(value){const f=parse(value);return {schema:'music64/recipe/v1',form:'word-forge-32bars/v1',cells:[hex(f)],source:null,selection:[],coverage:{activeCells:1,policy:'Recipe-only replay. No source text is recoverable from this address.'}};}
function neighbor(recipe,step=1){integer(step,-1,1,'step');const out=structuredClone(recipe);validate(out);const p=unpack(parse(out.cells[0]));p.notes=(p.notes+step+2**18)%2**18;out.cells[0]=hex(pack(p));out.edit={kind:'first-cell-note-code-neighbor',step};return out;}
function withSettings(recipe,settings){const out=structuredClone(recipe),p=validate(out),old=p[0],c=config({tonic:old.tonic,mode:old.mode,bpm:old.tempo+72,meter:old.meter,style:old.style,transform:old.transform,intensity:old.intensity,...settings});out.cells=p.map(x=>hex(pack({...x,tonic:c.tonic,mode:c.mode,tempo:c.bpm-72,meter:c.meter,style:c.style,transform:c.transform,intensity:c.intensity})));return out;}
const SYLLABLES=['DA','ki','DUM','ra','ta','VO','ka','zim','BA','ru','tek','la'];
function compose(recipe){
 const cells=validate(recipe),p=cells[0],bpm=p.tempo+72,scale=MODES[p.mode][1],rootNote=36+p.tonic,meter=METERS[p.meter],len=meter[0]*4/meter[1],amp=.3+.7*p.intensity/63,events=[],sections=[],cues=[];
 const specs=[['I. Letters catch fire','intro',4],['II. Ask the floor','call',8],['III. The room answers','answer',8],['IV. Break the pattern','break',4],['V. Carry it onward','final',8]];
 let beat=0,number=0;const add=(track,b,n,d,v,pan=0)=>events.push({track,b,n:Math.max(0,Math.min(127,n)),d:Math.max(.03,d),v:Math.min(1,v*amp),pan});
 const degree=(n)=>scale[((n%7)+7)%7]+12*Math.floor(n/7);
 const original=recipe.source?U.escape(recipe.source.text):'A musical address; its source is not stored here.';
 const chant=cells.slice(0,2).map(x=>digits(x.notes).map((d,i)=>SYLLABLES[(d+i)%SYLLABLES.length]).join('-')).join(' / ');
 for(const [name,kind,count]of specs){const s={name,sub:kind,count,kind,start:beat,index:sections.length,meter};sections.push(s);
 for(let j=0;j<count;j++,number++){const x=cells[number%cells.length],raw=digits(x.notes);let motif=raw.slice();if(p.transform===1)motif.reverse();if(p.transform===2)motif=motif.map(n=>7-n);if(p.transform===3)motif=motif.slice(j%6).concat(motif.slice(0,j%6));
 const chordDegree=[0,5,3,4][Math.floor(number/2)%4],base=rootNote+degree(chordDegree),third=degree(chordDegree+2)-degree(chordDegree),quiet=kind==='intro',reply=kind==='answer',big=kind==='final',br=kind==='break',funk=p.style===3,classical=p.style===2,steps=Math.round(len*2);
 // One subject, transformed by answer/inversion/augmentation rather than four fixed songs.
 for(let i=0;i<steps;i++){const ix=(i+(reply?2:0))%6,m=reply?7-motif[ix]:motif[ix],pitch=rootNote+24+scale[m];const active=(x.rhythm>>>(i%8))&1;
 if(active){add(classical||quiet?'harp':'lead',beat+i*.5,pitch,.36,quiet?.55:big?.66:.54,reply?.25:-.2);if(reply||classical)add('strings',beat+i*.5,rootNote+12+scale[motif[(5-ix+6)%6]],.44,.3,-.35);}
 if(!funk||quiet) add('harp',beat+i*.5,base+24+[0,third,7,12][i%4],.32,quiet?.56:classical?.55:.21,i%2?.38:-.38);
 }
 for(const [i,n]of [base+12,base+12+third,base+19].entries())add('strings',beat,n,len-.12,quiet?.32:big?.55:.24,(i-1)*.38);
 const hits=Array.from({length:steps},(_,i)=>i*.5).filter((_,i)=>((x.rhythm>>>(i%8))&1)||i===0);
 if(quiet){add('bass',beat,Math.max(24,base-12),len-.15,.35);}else{
 for(const [i,t]of hits.entries()){const v=br?.82:.66;if(!classical)for(const pan of [-.7,.7]){add('guitar',beat+t,base,(big&&i%3===0)?.36:.17,funk?.34:v,pan);if(big||br)add('guitar',beat+t,base+7,.2,.4,pan);}add('bass',beat+t,Math.max(24,base-12)+(funk?[0,12,7,10][i%4]:i%4===3?7:0),.24,funk?.82:.62);}
 if(funk)for(let i=1;i<steps;i+=2)for(const n of [base+24,base+24+third,base+31])add('harp',beat+i*.5+.04,n,.16,.4,.2);
 for(let i=0;i<steps;i++){const t=i*.5;if(i===0||((x.rhythm>>>(i%8))&1)&&(i%2===0||p.style===1))add('drums',beat+t,36,.18,classical?.25:.82);if(i%4===2)add('drums',beat+t,38,.2,classical?.24:br?.9:.72);add('drums',beat+t+(funk&&i%2?.035:0),42,.09,classical?.16:i%2?.3:.44,.28);}
 if(j%4===0)add('drums',beat,49,1.2,classical?.2:.47,-.25);
 }
 beat+=len;}
 s.end=beat;
 const lines=kind==='intro'?[original.slice(0,180),'A phrase becomes a pulse; the pulse makes room.']:kind==='call'?['Take these letters; let them strike the ground.',chant,'A crooked little question in a wall of sound.','Leave the next beat open for a new reply.']:kind==='answer'?['The keys ask; the low strings answer.',chant,'Same material. Another way to move.','No single voice decides the whole room’s groove.']:kind==='break'?[chant,'Break the pattern. Keep the possibility.']:['Pass the rhythm; do not close the door.','Every changed note leaves us something to explore.',chant,'An unfinished song is somewhere to begin.'];
 lines.forEach((text,i)=>cues.push({b:s.start+(s.end-s.start)*i/lines.length,text,section:s.index}));
 }
 // Cadence leaves an audible end and a silence before any next variation.
 const last=beat-len;for(let i=events.length-1;i>=0;i--)if(events[i].b>=last)events.splice(i,1);
 for(const [t,n,v]of [['bass',rootNote-12,.5],['harp',rootNote+24,.65],['strings',rootNote+12,.58],['strings',rootNote+19,.52],['lead',rootNote+36,.4]])add(t,last,n,len-.15,v);
 events.sort((a,b)=>a.b-b.b);
 return {id:'word-forge',title:recipe.source?U.escape(recipe.source.text).slice(0,72):'Music from '+recipe.cells[0],bpm,key:NOTES[p.tonic]+' '+MODES[p.mode][0],description:STYLES[p.style]+' / UTF-8 musical cells',duration:beat*60/bpm+2.8,end:beat,sections,events,cues,seed:0,recipe};
}
root.Music64=Object.freeze({version:'1.0.0',FIELDS,MODES,STYLES,METERS,NOTES,pack,unpack,hex,parse,fromText,fromFloat,neighbor,withSettings,validate,compose,digits});
})(globalThis);
