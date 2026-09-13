/* Finite transport coverage, not a claim to represent every culture or every string. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
for (const name of ['sha256.js','codec.js','locales.js','i18n.js']) vm.runInThisContext(readFileSync(new URL(name,import.meta.url),'utf8'),{filename:name});
const C=CoordinateCodec,I=CoordinateI18n;
let checks=0,scalarValues=0,batches=0,bytes=0;
function check(actual,expected=true) {assert.deepEqual(actual,expected);checks++;}
const allDigest=createHash('sha256');
let batch=[];
function flush() {
  if(!batch.length)return;
  const text=batch.join(''),raw=new TextEncoder().encode(text),packet=C.encode(text);
  check(C.decode(packet).text,text);check(packet.sha256,createHash('sha256').update(raw).digest('hex'));
  allDigest.update(raw);bytes+=raw.length;batches++;batch=[];
}
for(let cp=0;cp<=0x10ffff;cp++) {
  if(cp>=0xd800&&cp<=0xdfff)continue;
  batch.push(String.fromCodePoint(cp));scalarValues++;
  if(batch.length===8192)flush();
}
flush();check(scalarValues,1112064);
const source='\ufeffOriginal 1900-01-01\r\n\0e\u0301 é العربية עברית தமிழ் বাংলা ᎣᏏᏲ ᐃᓄᒃᑎᑐᑦ ߒߞߏ 𞤀𞤣𞤤𞤢𞤥 ⠃⠗⠁⠊⠇⠇⠑ 👩🏽‍💻';
const baseline=JSON.stringify(C.encode(source));
for(const pack of I.list()) {
  check(I.validate(pack).locale,pack.locale);check(Object.keys(pack.messages).length,40);
  check(JSON.stringify(C.encode(source)),baseline);check(I.number(12345,pack.locale),new Intl.NumberFormat(pack.locale).format(12345));
}
check(I.resolve('ar-EG'),'ar');check(I.resolve('pt-BR'),'pt');check(I.resolve('zh-TW'),'en');check(I.resolve('zh-CN'),'zh-Hans');
check(I.resolve('sw-KE'),'sw');check(I.resolve('not_a_tag'),'en');
check(C.encode('é').sha256===C.encode('e\u0301').sha256,false);
check(C.encode('A').sha256===C.encode('Ａ').sha256,false);
const DateOriginal=globalThis.Date;
globalThis.Date=class{constructor(){throw Error('Wall clock used');}static now(){throw Error('Wall clock used');}};
try {
  for(const tag of ['en-u-ca-gregory','ar-u-ca-islamic','he-u-ca-hebrew','th-u-ca-buddhist']) {
    check(JSON.stringify(C.encode(source)),baseline);check(C.decode(JSON.parse(baseline)).text,source);check(typeof I.number(12345,tag),'string');
  }
}finally{globalThis.Date=DateOriginal;}
for(const mutate of [p=>delete p.messages.title,p=>p.messages.title=12,p=>p.messages.extra='x',p=>p.direction='auto',p=>p.locale='../etc',p=>p.messages.title='\ud800',p=>p.messages.title='x'.repeat(1001),p=>p.nativeName='\u202ebad']) {
  const p=JSON.parse(I.template());mutate(p);assert.throws(()=>I.importText(JSON.stringify(p)));checks++;
}
const demo=JSON.parse(I.template());demo.locale='chr';demo.nativeName='ᏣᎳᎩ — fixture';demo.messages.title='<img src=x onerror=alert(1)>';
check(I.importText(JSON.stringify(demo)).locale,'chr');check(I.get('chr').messages.title,demo.messages.title);
console.log(JSON.stringify({status:'PASS',checks,locales:16,unicode_scalar_values:scalarValues,batches,utf8_bytes:bytes,
  concatenated_utf8_sha256:allDigest.digest('hex'),timezone:process.env.TZ||'runtime default',
  boundary:'All Unicode scalar values tested in ordered batches of at most 8192; not all possible strings, rendering systems, languages or cultures. Clock, calendar and UI language do not enter the existing codec.'},null,2));
