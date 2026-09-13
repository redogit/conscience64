import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await import('./utf8-space.js');await import('./music64.js');await import('./listener-floats.js');await import('./engine.js');
const U=globalThis.UTF8MusicSpace,M=globalThis.Music64,L=globalThis.ListenerFloatMusic,E=globalThis.MusilanguageEngine,checks=[];
const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
let accepted=0;
for(let k=0;k<65536;k++){const b=new Uint8Array([k>>8,k&255]);let valid=true;try{decoder.decode(b);}catch{valid=false;}if(valid){const r=U.rank(b);assert.deepEqual(U.unrank(2,r),b);accepted++;}else assert.throws(()=>U.rank(b));}
assert.equal(BigInt(accepted),U.count(2));checks.push({name:'65,536 two-byte strings versus strict native UTF-8 decoder',accepted});
const ways=[1n],weights=[128n,1920n,61440n,1048576n];for(let n=1;n<=1024;n++){let s=0n;for(let k=1;k<=4&&k<=n;k++)s+=weights[k-1]*ways[n-k];ways[n]=s;assert.equal(U.count(n),s);}checks.push({name:'Independent scalar-length recurrence vs byte-state counts',lengths:1025,rankBits1024:ways[1024].toString(2).length});
let rng=642601;function next(){rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return rng>>>0;}
for(let n of [0,1,3,4,6,8,16,64,1024]){const count=U.count(n);for(let k=0;k<20;k++){let r=0n;for(let i=0;i<Math.ceil(n/4)+1;i++)r=(r<<32n)|BigInt(next());r%=count;const b=U.unrank(n,r);assert.equal(b.length,n);decoder.decode(b);assert.equal(U.rank(b),r);}}
checks.push({name:'Rank/unrank plus strict decoding',fixtures:180});
for(let i=0;i<4096;i++){const p=Object.fromEntries(M.FIELDS.map(([k,b])=>[k,next()%(k==='tonic'?12:2**b)])),f=M.pack(p);assert.deepEqual(M.unpack(f),p);assert.equal(M.parse(M.hex(f)),f);assert.equal(M.parse(f.toPrecision(17)),f);assert.ok(Number.isFinite(f)&&f>=1&&f<2);}
for(const v of [NaN,Infinity,-Infinity,0,-0,2,-1,'x','1e0','m64v1:7ff0000000000000','m64v1:3ff000003c000000'])assert.throws(()=>M.parse(v));
checks.push({name:'Binary64 field, decimal, hex roundtrip and rejection',fixtures:4096});
const phrases=['Velvet anvils dance beneath a clockwork moon.','Thunder writes a fugue on the bones of silence.','Starlight teaches gravity to dance.','雷 / lumière / groove / 🌒','A\0','e\u0301','é','\ufeffA','x'.repeat(1024),'👩🏽‍💻 مرحبا 你好 नमस्ते'];
let scores=0;for(const text of phrases)for(let style=0;style<4;style++)for(let meter=0;meter<4;meter++){
 const r=M.fromText(text,{style,meter}),s=M.compose(r);assert.deepEqual(M.compose(structuredClone(r)),s);assert.ok(r.cells.length<=32);assert.equal(s.sections.length,5);assert.ok(s.events.length>100);for(const e of s.events)assert.ok([e.b,e.n,e.d,e.v,e.pan].every(Number.isFinite)&&e.b>=0&&e.n>=0&&e.n<128&&e.d>0&&e.v>=0&&e.v<=1&&e.b+e.d<=s.end+.001);assert.equal(Buffer.from(E.renderer(s).midi()).subarray(0,4).toString(),'MThd');scores++;
}
checks.push({name:'Deterministic Unicode score, ensembles/meters, event ranges and MIDI',scores});
const anchor=M.fromText(phrases[0]),unchanged=JSON.stringify(anchor),listenerB=structuredClone(anchor);
let trials=0,audibleChanges=0;for(const seed of [0,1,7,99,4294967295])for(const amount of [1,2,6])for(const kind of ['notes','rhythm','mixed'])for(const phase of ['trial','journey']){
 const r=L.stumble(anchor,{seed,amount,kind,phase});L.validate(r);assert.deepEqual(L.stumble(anchor,{seed,amount,kind,phase}),r);assert.deepEqual(L.repair(r),anchor);assert.equal(JSON.stringify(anchor),unchanged);assert.deepEqual(listenerB,anchor);assert.deepEqual(r.source,anchor.source);
 const mask=(1n<<26n)-1n;for(let i=0;i<r.cells.length;i++){const a=BigInt('0x'+anchor.cells[i].slice(6)),b=BigInt('0x'+r.cells[i].slice(6));assert.equal((a^b)&~mask,0n);assert.equal((a^b).toString(2).replaceAll('0','').length,amount);}
 const score=L.compose(r);assert.ok(score.events.every(e=>e.b>=0&&e.b+e.d<=score.end+.001));if(phase==='journey'){assert.equal(score.sections.length,3);const span=score.sections[0].end,part=i=>score.events.filter(e=>e.b>=span*i&&e.b<span*(i+1)).map(e=>({...e,b:e.b-span*i}));assert.deepEqual(part(0),part(2));if(JSON.stringify(part(0))!==JSON.stringify(part(1)))audibleChanges++;}
 const bad=structuredClone(r);bad.listener.changes[0].xorMask='ffffffff';assert.throws(()=>L.validate(bad));trials++;
}
checks.push({name:'Local float-only edits, deterministic repair, independent listener, source/settings invariants, tamper rejection, ABA note identity',trials,journeysWithEventChanges:audibleChanges});
assert.equal(M.fromText('A').source.coordinates[0],M.fromText('A\0').source.coordinates[0]);assert.notEqual(M.fromText('A').source.utf8Bytes,M.fromText('A\0').source.utf8Bytes);
for(const x of ['', '\ud800','x'.repeat(1025)])assert.throws(()=>M.fromText(x));
const html=await readFile(new URL('word-forge.html',import.meta.url),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);for(const [,id]of html.matchAll(/\bfor="([^"]+)"/g))assert.ok(ids.includes(id));
const listener=await readFile(new URL('listener-floats.js',import.meta.url),'utf8');assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|WebSocket/.test(listener));checks.push({name:'DOM labels/IDs; no listener network or persistence APIs'});
const result={status:'PASS',scope:'Finite software tests, not musical-quality guarantees or research validation.',node:process.version,checks,files:{}};for(const f of ['utf8-space.js','music64.js','listener-floats.js','word-forge.js','word-forge.html','engine.js'])result.files[f]=createHash('sha256').update(await readFile(new URL(f,import.meta.url))).digest('hex');if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
