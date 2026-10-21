import assert from 'node:assert/strict';
// In-memory Web Audio stand-in for deterministic DSP and lifecycle checks.
class Buffer {
 constructor({length,numberOfChannels,sampleRate}){Object.assign(this,{length,numberOfChannels,sampleRate,duration:length/sampleRate});this.data=Array.from({length:numberOfChannels},()=>new Float32Array(length));}
 getChannelData(c){return this.data[c];}copyToChannel(a,c){this.data[c].set(a);}
}
globalThis.AudioBuffer=Buffer;
let decoded,waitDecode=null,closed=0;
globalThis.AudioContext=class{async decodeAudioData(){if(waitDecode)await waitDecode;return decoded;}async close(){closed++;}};
await import('./recorded-performance.js');
const file={size:10,arrayBuffer:async()=>new ArrayBuffer(10)},r=MusilanguageRecorded.create();
decoded=new Buffer({length:40,numberOfChannels:1,sampleRate:10});decoded.data[0].set(Array.from({length:40},(_,i)=>i/100));
const original=decoded.data[0].slice();await r.loadFile(file);
assert.equal(r.state().end,0);assert.throws(()=>r.segment());assert.throws(()=>r.enable(true));
r.select(1,2);assert.throws(()=>r.segment());assert.equal(r.segment(false).length,10);
r.confirm(true);r.enable(true);r.placement(.5,.5);
const base=new Buffer({length:80,numberOfChannels:2,sampleRate:20});base.data.forEach(a=>a.fill(.1));const mixed=r.mix(base);
assert.notEqual(mixed,base);assert.deepEqual(decoded.data[0],original);assert.ok(base.data[0].every(x=>Math.abs(x-.1)<1e-6));
assert.equal(mixed.length,80);assert.equal(mixed.numberOfChannels,2);
assert.ok(Math.abs(mixed.data[0][10]-.15)<1e-6);assert.ok(Math.abs(mixed.data[1][11]-.1525)<1e-6);
assert.ok(Math.abs(mixed.data[0][9]-.1)<1e-6);assert.ok(Math.abs(mixed.data[0][30]-.1)<1e-6); // exactly once, no looping
r.placement(3.5,.5);assert.throws(()=>r.mix(base));r.placement(0,.5);
r.select(2,3);assert.equal(r.state().confirmed,false);assert.equal(r.state().enabled,false);assert.equal(r.mix(base),base);
r.confirm(true);r.enable(true);assert.throws(()=>r.select(3,8));assert.equal(r.state().confirmed,false);assert.equal(r.state().enabled,false);
r.clearSelection();assert.throws(()=>r.confirm(true));
let release;waitDecode=new Promise(resolve=>release=resolve);const loading=r.loadFile(file);r.clear();release();assert.equal(await loading,false);assert.equal(r.state().loaded,false);waitDecode=null;
assert.throws(()=>r.placement(NaN,1));await assert.rejects(()=>r.loadFile({size:33*1024*1024}));
assert.ok(closed>=2);assert.equal(r.state().synthesized,false);
console.log('PASS: segment/consent gates, one-pass resampling/mixing, original preservation, fit validation, stale decode cancellation and clear');
