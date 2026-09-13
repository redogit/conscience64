// Byte-source assertions are separate from the existing v1 codec contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
for (const name of ['sha256.js','codec.js','locales.js','i18n.js','source_file.js'])
  vm.runInThisContext(readFileSync(new URL(name,import.meta.url),'utf8'),{filename:name});
const C=CoordinateCodec,F=CoordinateSourceFile,I=CoordinateI18n;
let checks=0;
function equal(a,b){assert.deepEqual(a,b);checks++;}
function rejects(fn){assert.throws(fn);checks++;}
async function rejectsAsync(fn){await assert.rejects(fn);checks++;}
for(const text of ['', '\ufeffA\r\nB\rC\0', 'é e\u0301 👩🏽‍💻 العربية ᎣᏏᏲ', '{"coordinates":"original JSON, not an envelope"}', '<img src=x onerror=alert(1)>', 'x'.repeat(1024*1024)]) {
  const raw=new TextEncoder().encode(text),packet=F.fromBytes(raw);
  equal(C.decode(packet).raw,raw);
  equal(packet.sha256,createHash('sha256').update(raw).digest('hex'));
  equal(packet,C.encode(text));
  const blob=new Blob([raw]);blob.text=()=>{throw Error('Lossy text path used');};
  equal(await F.read(blob),packet);
}
const backing=new Uint8Array([120,65,66,121]);equal(C.decode(F.fromBytes(backing.subarray(1,3))).text,'AB');
for(const raw of [[128],[255],[0xc0,0xaf],[0xed,0xa0,0x80],[0xf4,0x90,0x80,0x80],[0xe2,0x82],[0xff,0xfe,65,0]])
  rejects(()=>F.fromBytes(new Uint8Array(raw)));
rejects(()=>F.fromBytes(new Uint8Array(1024*1024+1)));
rejects(()=>F.fromBytes([65]));
await rejectsAsync(()=>F.read({size:1,arrayBuffer:async()=>new ArrayBuffer(0)}));
await rejectsAsync(()=>F.read({size:1,arrayBuffer:async()=>new Uint8Array([65])}));
await rejectsAsync(()=>F.read({size:1024*1024+1,arrayBuffer:()=>{throw Error('Must not read oversized file');}}));
await rejectsAsync(()=>F.read({size:NaN,arrayBuffer:async()=>new ArrayBuffer(0)}));
await rejectsAsync(()=>F.read(null));
for(const [input,expected] of [[['zz-ZZ','ar-EG'],'ar'],[['zh-TW','fr-FR'],'fr'],[['en','ar'],'en'],[[],'en'],[['bad_tag','ko-KR'],'ko']])
  equal(I.resolvePreferred(input),expected);
equal(I.resolve('zh-TW'),'en');
rejects(()=>I.resolvePreferred('ar'));
const OriginalDate=globalThis.Date;
globalThis.Date=class{constructor(){throw Error('Date accessed');}static now(){throw Error('Date accessed');}};
try{equal(C.decode(await F.read(new Blob(['timeless']))).text,'timeless');}finally{globalThis.Date=OriginalDate;}
console.log(JSON.stringify({status:'PASS',checks,scope:'UTF-8 original-byte intake, invalid inputs, full preference chain and clock independence; v1 codec unchanged'},null,2));
