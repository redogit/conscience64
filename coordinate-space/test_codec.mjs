// Exact transport regression checks. Node is a test harness, not a runtime dependency.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
for (const name of ['sha256.js','codec.js']) vm.runInThisContext(readFileSync(new URL(name, import.meta.url),'utf8'),{filename:name});
const C=globalThis.CoordinateCodec;
let checks=0;
for (const text of ['', 'a', 'abcdef', 'abcdefg', '\ufeffA\r\nB\0', 'é e\u0301 🙂 مرحبا नमस्ते 你好', '</script><img src=x>', 'x'.repeat(1024*1024)]) {
  const packet=C.encode(text), result=C.decode(packet);
  assert.equal(result.text,text); assert.equal(packet.sha256,createHash('sha256').update(text).digest('hex')); checks+=2;
}
const good=C.encode('a');
for (const mutate of [p=>p.coordinates.push(0),p=>p.coordinates[0]+=.5,p=>p.coordinates[0]=NaN,p=>p.coordinates[0]=Infinity,p=>p.coordinates[0]=-1,p=>p.coordinates[0]=2**48,p=>p.coordinates[0]=true,p=>p.coordinates[0]+=1,p=>p.utf8_bytes=true,p=>p.utf8_bytes=-0,p=>p.utf8_bytes=2,p=>p.pad_bytes=0,p=>p.sha256='0'.repeat(64),p=>p.schema='wrong',p=>p.extra='unexpected']) {
  const bad=structuredClone(good); mutate(bad); assert.throws(()=>C.decode(bad)); checks++;
}
for(const text of ['\ud800','\udc00','x'.repeat(1024*1024+1)]) {assert.throws(()=>C.encode(text));checks++;}
const invalidBytes=new Uint8Array([255]);
assert.throws(()=>C.decode({schema:C.schema,coordinates:[255*256**5],utf8_bytes:1,pad_bytes:5,sha256:createHash('sha256').update(invalidBytes).digest('hex')}));checks++;
console.log(JSON.stringify({status:'PASS',checks,scope:'public JavaScript exact-codec fixtures; no private corpus'},null,2));

// Culture/clock regression suite is also required by the existing deployment gate.
await import("./test_culture.mjs");
