/* Strict byte-lexicographic UTF-8 index. Browser port of UTF8Space in
 * redogit/Other-Projects-/S1024 Compression Lab/sections1024.py
 * revision 0837d5bc11c7f5806fbbc919e9721b1b182e3cb9.
 * Exact BigInt counts; no interpretation of sampled strings as meaningful words. */
'use strict';
(function(root){
function transition(s,b){
 if(s===0){if(b<128)return 0;if(b>=194&&b<=223)return 1;if(b===224)return 4;
 if((b>=225&&b<=236)||(b>=238&&b<=239))return 2;if(b===237)return 5;
 if(b===240)return 6;if(b>=241&&b<=243)return 3;if(b===244)return 7;return 8;}
 if(s>=1&&s<=3)return b>=128&&b<=191?s-1:8;
 if(s===4)return b>=160&&b<=191?1:8;if(s===5)return b>=128&&b<=159?1:8;
 if(s===6)return b>=144&&b<=191?2:8;if(s===7)return b>=128&&b<=143?2:8;return 8;
}
const table=Array.from({length:9},(_,s)=>Array.from({length:256},(_,b)=>transition(s,b)));
const runs=table.map(row=>{const a=[];let start=0;for(let i=1;i<=256;i++)if(i===256||row[i]!==row[start]){a.push([start,i-1,row[start]]);start=i;}return a;});
const counts=[Array.from({length:9},(_,s)=>s===0?1n:0n)];
function ensure(n){if(!Number.isInteger(n)||n<0||n>1024)throw Error('UTF-8 length must be 0..1024 bytes.');while(counts.length<=n){const old=counts.at(-1);counts.push(runs.map(row=>row.reduce((v,[lo,hi,s])=>v+BigInt(hi-lo+1)*old[s],0n)));}}
function count(n){ensure(n);return counts[n][0];}
function bytes(text){if(typeof text!=='string')throw Error('Text required.');for(const c of text){const p=c.codePointAt(0);if(p>=55296&&p<=57343)throw Error('Unpaired surrogate; source was not changed.');}const b=new TextEncoder().encode(text);if(b.length>1024)throw Error('Use at most 1024 UTF-8 bytes per phrase.');return b;}
function rank(raw){if(!(raw instanceof Uint8Array))throw Error('Uint8Array required.');ensure(raw.length);let s=0,r=0n;for(let i=0;i<raw.length;i++){const b=raw[i],c=counts[raw.length-i-1];for(const [lo,hi,d]of runs[s]){if(lo>=b)break;r+=BigInt(Math.min(hi+1,b)-lo)*c[d];}s=table[s][b];}if(s!==0)throw Error('Not a complete strict UTF-8 string.');return r;}
function unrank(n,r){ensure(n);if(typeof r!=='bigint'||r<0n||r>=count(n))throw Error('Rank outside this exact-length UTF-8 space.');let s=0;const out=new Uint8Array(n);for(let i=0;i<n;i++){const c=counts[n-i-1];let found=false;for(const [lo,hi,d]of runs[s]){const size=BigInt(hi-lo+1)*c[d];if(r<size){out[i]=lo+Number(r/c[d]);r%=c[d];s=d;found=true;break;}r-=size;}if(!found)throw Error('Empty unrank branch.');}if(s!==0||r!==0n)throw Error('Terminal invariant.');return out;}
function decode(b){return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(b);}
function randomRank(n){const limit=count(n);if(limit===1n)return 0n;const bits=(limit-1n).toString(2).length,size=Math.ceil(bits/8),a=new Uint8Array(size);if(!root.crypto?.getRandomValues)throw Error('Secure random sampling unavailable; enter an exact rank instead.');for(let tries=0;tries<128;tries++){root.crypto.getRandomValues(a);a[0]&=255>>>(8*size-bits);let r=0n;for(const b of a)r=(r<<8n)|BigInt(b);if(r<limit)return r;}throw Error('Sampling attempt cap reached.');}
function escape(text){return [...text].map(c=>{const n=c.codePointAt(0);return n<32||n===127||(n>=128&&n<=159)||(n>=0x200b&&n<=0x200f)||(n>=0x2028&&n<=0x202e)||(n>=0x2060&&n<=0x206f)||n===0xfeff?'\\u{'+n.toString(16)+'}':c;}).join('');}
root.UTF8MusicSpace=Object.freeze({version:'s1024-utf8-index-js/1',transition,count,rank,unrank,bytes,decode,randomRank,escape});
})(globalThis);
