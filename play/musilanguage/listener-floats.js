/* Listener-local musical experiments. Changes touch only MUSIC64 note/rhythm
 * fraction bits. No network, storage, source mutation or volume mutation. */
'use strict';
(function(root){
const M=root.Music64, clone=x=>structuredClone(x), SAME=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const MASK=(1n<<26n)-1n;
function uint(x,lo,hi,label){if(!Number.isInteger(x)||x<lo||x>hi)throw Error(label+' out of range.');return x;}
function random(seed){let x=(seed^0x9e3779b9)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};}
function bits(address){return BigInt('0x'+M.hex(M.parse(address)).slice(6));}
function clear(recipe){M.validate(recipe);const out=clone(recipe);delete out.listener;return out;}
function options(o){if(!o||typeof o!=='object')throw Error('Listener options required.');uint(o.seed,0,4294967295,'seed');uint(o.amount,1,6,'amount');if(!['notes','rhythm','mixed'].includes(o.kind))throw Error('Unknown musical slip.');if(!['trial','journey'].includes(o.phase))throw Error('Unknown listener phase.');return {seed:o.seed,amount:o.amount,kind:o.kind,phase:o.phase};}
function stumble(anchor,opts){
 const o=options(opts),out=clear(anchor),before=out.cells.slice(),rng=random(o.seed),lo=o.kind==='rhythm'?18:0,hi=o.kind==='notes'?18:26;
 const changes=[];
 out.cells=before.map((address,cell)=>{
  const choices=Array.from({length:hi-lo},(_,i)=>lo+i);
  for(let i=choices.length-1;i>0;i--){const j=rng()%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
  let mask=0n;for(const bit of choices.slice(0,o.amount))mask|=1n<<BigInt(bit);
  const b=bits(address),after='m64v1:'+(b^mask).toString(16).padStart(16,'0');M.parse(after);
  changes.push({cell,before:M.hex(M.parse(address)),after,xorMask:mask.toString(16)});return after;
 });
 out.listener={schema:'music64/listener/v1',...o,anchorCells:before,changes};return out;
}
function validate(recipe){
 M.validate(recipe);const l=recipe.listener;if(!l)return;
 if(l.schema!=='music64/listener/v1'||!Array.isArray(l.anchorCells)||l.anchorCells.length!==recipe.cells.length)throw Error('Malformed listener receipt.');
 const anchor=clear(recipe);anchor.cells=l.anchorCells.slice();M.validate(anchor);
 const expected=stumble(anchor,options(l));
 if(!SAME(expected.cells,recipe.cells)||!SAME(expected.listener.changes,l.changes))throw Error('Listener receipt does not replay these musical floats.');
 for(let i=0;i<recipe.cells.length;i++)if(((bits(recipe.cells[i])^bits(l.anchorCells[i]))&~MASK)!==0n)throw Error('Nonmusical field changed.');
}
function repair(recipe){validate(recipe);const out=clear(recipe);if(recipe.listener)out.cells=recipe.listener.anchorCells.slice();return out;}
function keep(recipe){validate(recipe);return clear(recipe);}
function next(recipe){validate(recipe);if(!recipe.listener)return M.neighbor(recipe);return stumble(repair(recipe),{...options(recipe.listener),seed:(recipe.listener.seed+1)>>>0});}
function compose(recipe){
 validate(recipe);if(!recipe.listener||recipe.listener.phase==='trial')return M.compose(recipe);
 const anchor=M.compose(repair(recipe)),trial=M.compose(clear(recipe)),meter=anchor.sections[1].meter,len=meter[0]*4/meter[1],span=4*len,start=anchor.sections[1].start;
 const score={...trial,id:'listener-float-journey',title:'My floats: original → stumble → repair',events:[],sections:[],cues:[],end:3*span,duration:3*span*60/trial.bpm+2.8,recipe};
 const stages=[['I. Original floats',anchor,'Your local anchor motif.'],['II. My floats stumble',trial,'Only note and rhythm bits changed.'],['III. Repair / return',anchor,'The original musical bits return exactly.']];
 stages.forEach(([name,part,text],i)=>{
  const b=i*span;score.sections.push({name,sub:'listener-only audition',kind:'listener',count:4,start:b,end:b+span,index:i,meter});score.cues.push({b,text,section:i});
  for(const e of part.events)if(e.b>=start&&e.b<start+span)score.events.push({...e,b:e.b-start+b,d:Math.min(e.d,start+span-e.b)});
 });
 score.description='12-bar local audition of four call bars: original, changed float fields, exact restoration. Not the entire source score.';return score;
}
root.ListenerFloatMusic=Object.freeze({version:'1.0.0',stumble,validate,repair,keep,next,compose});
})(globalThis);
