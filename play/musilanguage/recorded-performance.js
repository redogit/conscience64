/* Local recorded-performance editing. No singing synthesis, upload or persistence. */
'use strict';
(function(root){
const MAX_BYTES=32*1024*1024,MAX_SECONDS=600;
function create(){
 let audio=null,start=0,end=0,offset=0,gain=.7,confirmed=false,enabled=false,epoch=0;
 const state=()=>({loaded:!!audio,duration:audio?.duration||0,start,end,offset,gain,confirmed,enabled,epoch,kind:'recorded-performance',synthesized:false});
 function invalidate(){confirmed=false;enabled=false;epoch++;}
 function clear(){audio=null;start=end=offset=0;invalidate();return state();}
 async function loadFile(file){
  clear();const token=epoch;
  if(!file||file.size<1||file.size>MAX_BYTES)throw Error('Choose an audio file no larger than 32 MiB.');
  const AC=root.AudioContext||root.webkitAudioContext;if(!AC)throw Error('Web Audio unavailable.');
  const ctx=new AC();
  try{
   const decoded=await ctx.decodeAudioData(await file.arrayBuffer());
   if(token!==epoch)return false;
   if(!decoded.length||decoded.duration>MAX_SECONDS||decoded.numberOfChannels>2)throw Error('Use mono/stereo audio up to 10 minutes.');
   for(let c=0;c<decoded.numberOfChannels;c++)for(const v of decoded.getChannelData(c))if(!Number.isFinite(v))throw Error('Invalid decoded audio.');
   audio=decoded; // Original file is never modified; no full-file segment is selected.
   return true;
  }finally{await ctx.close();}
 }
 function select(a,b){
  start=end=0;invalidate();
  if(!audio||!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||b>audio.duration||b-a>120)throw Error('Select a valid segment of at most 120 seconds.');
  start=a;end=b;return state();
 }
 function requireSelection(){if(!audio||end<=start)throw Error('Choose a recording and explicit segment first.');}
 function confirm(value){requireSelection();if(typeof value!=='boolean')throw Error('Explicit confirmation required.');confirmed=value;if(!value)enabled=false;epoch++;return state();}
 function enable(value){if(typeof value!=='boolean')throw Error('Explicit recording setting required.');if(value){requireSelection();if(!confirmed)throw Error('Confirm the selected speaker and segment first.');}enabled=value;epoch++;return state();}
 function placement(seconds,level){if(!Number.isFinite(seconds)||seconds<0||seconds>600||!Number.isFinite(level)||level<0||level>1)throw Error('Invalid recording placement or gain.');offset=seconds;gain=level;epoch++;return state();}
 function segment(requireConsent=true){requireSelection();if(requireConsent&&!confirmed)throw Error('Confirm the selected speaker and segment first.');const first=Math.floor(start*audio.sampleRate),last=Math.floor(end*audio.sampleRate);if(last<=first)throw Error('Segment is shorter than one sample.');const b=new root.AudioBuffer({length:last-first,numberOfChannels:audio.numberOfChannels,sampleRate:audio.sampleRate});for(let c=0;c<b.numberOfChannels;c++)b.copyToChannel(audio.getChannelData(c).subarray(first,last),c);return b;}
 function mix(accompaniment){
  if(!enabled)return accompaniment;
  const vocal=segment();if(offset+vocal.duration>accompaniment.duration)throw Error('The selected recording must fit inside the accompaniment. Shorten it or reduce its offset.');
  const out=new root.AudioBuffer({length:accompaniment.length,numberOfChannels:Math.max(accompaniment.numberOfChannels,vocal.numberOfChannels),sampleRate:accompaniment.sampleRate});
  for(let c=0;c<out.numberOfChannels;c++){
   const dest=out.getChannelData(c),base=accompaniment.getChannelData(Math.min(c,accompaniment.numberOfChannels-1)),src=vocal.getChannelData(Math.min(c,vocal.numberOfChannels-1));dest.set(base);
   const first=Math.round(offset*out.sampleRate),count=Math.min(Math.floor(vocal.duration*out.sampleRate),out.length-first);
   for(let i=0;i<count;i++){const p=i*vocal.sampleRate/out.sampleRate,k=Math.floor(p),f=p-k;dest[first+i]+=gain*(src[k]*(1-f)+src[Math.min(k+1,src.length-1)]*f);}
  }
  return out; // Caller peak-limits the mix. No looping, pitch shift or time stretch.
 }
 return Object.freeze({state,loadFile,select,clearSelection(){start=end=0;invalidate();return state();},confirm,enable,placement,segment,mix,clear});
}
root.MusilanguageRecorded=Object.freeze({create});
})(typeof window==='undefined'?globalThis:window);
