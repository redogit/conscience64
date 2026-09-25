/* MUSIC64 style profiles v1: recipe-level interpretations over the stable
 * four-family MUSIC64/v1 float. Profiles alter only the rendered score;
 * they do not change source text, UTF-8 rank, or the listener-local bit layer. */
'use strict';
(function(root){
const P=[];
function add(family, rows){for(const r of rows)P.push({family,...r});}
const W=(g=1,b=1,h=1,s=1,l=1,d=1)=>({guitar:g,bass:b,harp:h,strings:s,lead:l,drums:d});
add('Heavy / guitar',[
 ['iron-fusion','Iron fusion',0,144,0,0,.00,1.00,.12,0,W(1,.95,.72,.76,.8,1)],
 ['heavy-metal','Heavy metal',1,156,0,0,.00,1.05,.10,0,W(1.22,.9,.28,.42,.55,1.15)],
 ['thrash-rush','Thrash rush',1,188,0,0,.00,1.18,.06,0,W(1.28,.82,.18,.28,.42,1.3)],
 ['doom-mass','Doom mass',1,82,0,0,.00,.62,.02,-12,W(1.18,1.02,.15,.7,.3,.66)],
 ['progressive-metal','Progressive metal',1,148,1,3,.00,1.00,.18,0,W(1.1,.92,.42,.62,.68,1.08)],
 ['polyrhythmic-metal','Polyrhythmic metal',1,136,2,3,.00,1.08,.24,-12,W(1.14,1,.22,.35,.55,1.18)],
 ['symphonic-metal','Symphonic metal',1,152,0,0,.00,1.03,.08,0,W(1.12,.82,.52,1.22,.72,1.06)],
 ['post-metal','Post-metal',1,104,0,2,.00,.72,.08,-12,W(1.12,.92,.28,1.05,.45,.72)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Classical / acoustic',[
 ['baroque-counterpoint','Baroque counterpoint',2,118,0,0,.00,1.08,.02,12,W(.05,.3,1.28,.8,.72,.12)],
 ['chamber-classical','Chamber classical',2,104,0,0,.00,.82,.00,0,W(.02,.28,1.02,1.18,.68,.08)],
 ['romantic-swell','Romantic swell',2,88,2,0,.00,.74,.00,0,W(.02,.32,.74,1.35,.75,.05)],
 ['impressionist-color','Impressionist color',2,92,3,2,.00,.68,.06,12,W(.02,.2,.92,1.22,.82,.04)],
 ['minimal-pulse','Minimal pulse',2,126,0,3,.00,1.22,.04,12,W(.02,.42,1.12,.72,.65,.22)],
 ['string-quartet','String quartet',2,96,0,1,.00,.72,.00,0,W(0,.16,.36,1.42,.55,0)],
 ['organ-procession','Organ procession',2,76,0,0,.00,.58,.00,-12,W(.02,.42,.55,1.4,.38,.04)],
 ['waltz-chamber','Waltz chamber',2,108,3,0,.02,.82,.04,0,W(.02,.35,.94,1.05,.58,.16)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Jazz / blues / soul',[
 ['swing-jazz','Swing jazz',3,132,0,0,.16,.88,.18,0,W(.38,1,.82,.32,.92,.62)],
 ['bebop-motion','Bebop motion',3,176,0,3,.12,1.12,.22,12,W(.26,.84,.9,.18,1.2,.82)],
 ['cool-jazz','Cool jazz',3,104,0,1,.11,.68,.10,0,W(.18,.78,.72,.52,.9,.42)],
 ['modal-jazz','Modal jazz',3,118,0,2,.10,.8,.14,0,W(.28,.94,.68,.45,1.05,.55)],
 ['jazz-fusion','Jazz fusion',0,148,0,3,.08,1.06,.2,0,W(.72,1.08,.7,.38,1.02,.92)],
 ['slow-blues','Slow blues',3,78,0,0,.14,.64,.12,-12,W(.68,.94,.48,.3,.88,.48)],
 ['electric-blues','Electric blues',1,116,0,1,.10,.9,.14,0,W(.92,.9,.34,.25,.88,.7)],
 ['soul-pocket','Soul pocket',3,98,0,0,.09,.82,.2,0,W(.28,1.12,.72,.5,.86,.72)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Rock / punk / indie',[
 ['classic-rock','Classic rock',1,124,0,0,.01,.94,.1,0,W(1.05,.9,.3,.28,.65,.94)],
 ['punk-sprint','Punk sprint',1,182,0,0,.00,1.18,.04,0,W(1.16,.8,.12,.12,.42,1.16)],
 ['post-punk','Post-punk',1,132,0,1,.00,.88,.16,0,W(.82,1.02,.38,.38,.72,.82)],
 ['indie-shimmer','Indie shimmer',0,116,0,0,.03,.78,.12,12,W(.52,.76,.85,.68,.75,.58)],
 ['garage-crunch','Garage crunch',1,138,0,0,.00,1.02,.08,-12,W(1.18,.82,.16,.14,.36,.98)],
 ['math-rock','Math rock',0,142,1,3,.00,1.05,.24,12,W(.76,.86,.82,.45,.9,.92)],
 ['shoegaze-cloud','Shoegaze cloud',1,102,0,2,.00,.72,.04,0,W(.92,.7,.35,1.12,.5,.58)],
 ['arena-anthem','Arena anthem',1,128,0,0,.00,.88,.06,0,W(1.06,.86,.3,.72,.78,1.0)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Electronic / dance',[
 ['house-pulse','House pulse',3,124,0,0,.00,1.0,.06,0,W(.08,.98,.58,.45,.72,1.18)],
 ['techno-drive','Techno drive',3,132,0,3,.00,1.12,.08,0,W(.05,.88,.44,.34,.62,1.28)],
 ['trance-rise','Trance rise',0,138,0,0,.00,1.14,.04,12,W(.08,.7,.9,.9,1.0,1.04)],
 ['breakbeat','Breakbeat',3,128,0,3,.04,1.08,.28,0,W(.16,1.0,.62,.3,.82,1.22)],
 ['drum-bass','Drum & bass',3,174,0,3,.02,1.24,.3,-12,W(.08,1.16,.4,.26,.78,1.36)],
 ['synthwave','Synthwave',0,108,0,0,.00,.9,.08,0,W(.22,.92,.9,.92,.86,.82)],
 ['industrial-electro','Industrial electro',1,126,0,2,.00,1.04,.18,-12,W(.72,.92,.28,.35,.54,1.26)],
 ['glitch-pulse','Glitch pulse',3,146,1,3,.00,1.28,.34,12,W(.1,.82,.88,.2,1.04,1.18)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Beat / groove',[
 ['boom-bap','Boom-bap instrumental',3,92,0,0,.12,.76,.22,-12,W(.12,1.02,.64,.28,.72,1.06)],
 ['lofi-beat','Lo-fi beat',3,82,0,1,.13,.62,.16,0,W(.08,.86,.78,.5,.58,.64)],
 ['halftime-trap','Half-time trap-inspired',3,140,0,2,.00,.78,.3,-12,W(.08,1.12,.48,.26,.68,1.16)],
 ['disco-floor','Disco floor',3,120,0,0,.00,1.02,.18,0,W(.18,1.18,.78,.62,.72,1.08)],
 ['deep-funk','Deep funk',3,104,0,3,.10,1.02,.32,-12,W(.38,1.28,.7,.25,.62,1.06)],
 ['offbeat-groove','Offbeat groove',3,96,0,0,.08,.82,.3,0,W(.42,1.0,.82,.32,.56,.76)],
 ['ska-upstroke-inspired','Upstroke dance groove',3,148,0,0,.02,1.08,.3,12,W(.55,.94,.78,.18,.52,1.0)],
 ['slow-rnb','Slow R&B instrumental',3,74,0,1,.11,.58,.2,0,W(.1,.94,.72,.68,.8,.5)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Ambient / cinematic',[
 ['ambient-drift','Ambient drift',2,72,0,2,.00,.42,.00,12,W(0,.28,.58,1.38,.66,.03)],
 ['dark-ambient','Dark ambient',2,72,0,2,.00,.36,.02,-12,W(.04,.48,.36,1.25,.38,.04)],
 ['cinematic-rise','Cinematic rise',0,96,0,0,.00,.72,.04,0,W(.38,.66,.6,1.32,.82,.62)],
 ['epic-score','Epic score',0,118,0,0,.00,.9,.04,-12,W(.52,.74,.48,1.42,.9,.92)],
 ['mystery-score','Mystery score',2,84,3,2,.00,.58,.08,12,W(.08,.42,.82,1.0,.78,.18)],
 ['gentle-soundscape','Gentle soundscape',2,72,0,0,.00,.34,.00,12,W(0,.2,.7,1.1,.52,.01)],
 ['space-drift','Space drift',0,76,0,3,.00,.48,.06,12,W(.03,.4,.86,1.15,.8,.12)],
 ['storm-score','Storm score',1,110,1,2,.00,.84,.12,-12,W(.78,.72,.34,1.18,.66,.9)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
add('Folk / unusual pulse',[
 ['acoustic-folk','Acoustic folk',2,104,0,0,.03,.76,.08,0,W(.08,.5,1.08,.64,.58,.28)],
 ['modal-folk','Modal folk',2,112,3,0,.02,.82,.12,0,W(.06,.56,1.0,.68,.7,.3)],
 ['drone-folk','Drone folk',2,86,0,2,.00,.56,.04,-12,W(.05,.7,.74,1.05,.46,.18)],
 ['odd-circle-dance','Odd-meter circle dance',3,126,1,3,.02,1.08,.24,0,W(.18,1.04,.94,.36,.72,.94)],
 ['five-step-dance','Five-step dance',3,118,2,3,.02,1.04,.26,0,W(.16,1.02,.9,.32,.74,.9)],
 ['interlocking-pulse','Interlocking pulse',3,132,0,3,.00,1.2,.3,12,W(.1,.92,1.0,.3,.78,1.08)],
 ['pentatonic-dance','Pentatonic dance',3,120,0,0,.04,.98,.2,12,W(.12,.88,.94,.45,.82,.86)],
 ['lullaby','Lullaby',2,72,3,0,.04,.42,.00,12,W(0,.24,.82,.92,.48,.02)]
].map(([id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights])=>({id,label,baseStyle,bpm,meter,transform,swing,density,sync,register,weights})));
for(const p of P){p.id=String(p.id);p.label=String(p.label);p.baseStyle|=0;p.bpm|=0;p.meter|=0;p.transform|=0;Object.freeze(p.weights);Object.freeze(p);}
const BY=new Map(P.map(p=>[p.id,p]));
function get(id){return BY.get(id)||BY.get('iron-fusion');}
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.codePointAt(0),16777619)>>>0;return h>>>0;}
function apply(score,recipe){const p=get(recipe?.styleProfile);if(!p)return score;const out=structuredClone(score),seed=hash((recipe?.cells||[]).join('|')+'|'+p.id),events=[];
 for(let i=0;i<out.events.length;i++){const e={...out.events[i]},weight=p.weights[e.track]??1;if(weight<=0)continue;const r=(Math.imul(seed^(i+1),2654435761)>>>0)/4294967296;if(r>Math.min(1,p.density*(e.track==='strings'?.92:1)))continue;e.v=Math.min(1,e.v*weight);if(e.track!=='drums')e.n=Math.max(0,Math.min(127,e.n+p.register));
  const eighth=Math.round(e.b*2);if(p.swing&&Math.abs(e.b*2-eighth)<1e-6&&eighth%2===1)e.b+=p.swing*.5;if(p.sync&&['guitar','bass','harp','lead'].includes(e.track)&&r<.45)e.b+=p.sync*(r<.22?1:-1);e.b=Math.max(0,e.b);events.push(e);
 }
 if(p.weights.drums>=1.05&&p.density>=.9){for(let b=0;b<out.end;b+=1)events.push({track:'drums',b,n:36,d:.14,v:Math.min(.78,.48*p.weights.drums),pan:0});}
 if(['interlocking-pulse','minimal-pulse','baroque-counterpoint','bebop-motion'].includes(p.id)){for(const e of out.events.filter(e=>e.track==='lead').slice(0,160))events.push({...e,track:'harp',b:e.b+.25,n:Math.min(127,e.n+7),v:e.v*.55,pan:.45});}
 out.events=events.sort((a,b)=>a.b-b.b);out.styleProfile=p.id;out.styleLabel=p.label;out.description=p.label+' · '+out.description;return out;}
function groups(){const m={};for(const p of P)(m[p.family]??=[]).push(p);return m;}
root.Music64Styles=Object.freeze({version:'1.0.0',profiles:Object.freeze(P),get,groups,apply});
})(globalThis);
