export const WORLD=Object.freeze({width:2400,height:1600});
export const REGIONS=Object.freeze([
  {id:'sunmeadow',name:'Sunmeadow',x:0,y:0,w:800,h:800,ground:'#24483a',accent:'#8bd69f',story:'Sunmeadow hums with warm insects and impossible blue flowers.'},
  {id:'nightbog',name:'Nightbog',x:800,y:0,w:800,h:800,ground:'#1b3034',accent:'#6fbdc7',story:'Nightbog answers every footstep with a second sound.'},
  {id:'emberwood',name:'Emberwood',x:0,y:800,w:800,h:800,ground:'#3b2926',accent:'#e18c61',story:'Emberwood sheds sparks instead of leaves. Nothing here seems burned.'},
  {id:'frostfield',name:'Frostfield',x:800,y:800,w:800,h:800,ground:'#25384a',accent:'#a5d9ef',story:'Frostfield grows glass grass that bends toward moving things.'},
  {id:'anomaly',name:'The Anomaly',x:1600,y:0,w:800,h:1600,ground:'#302844',accent:'#c6a0ff',story:'The Anomaly has no consistent horizon. The map insists this place is still here.'}
]);
export const MONSTER_TYPES=Object.freeze({
  gravehowler:{name:'Gravehowler',speed:74,hp:60,damage:14,radius:18,color:'#c88e8e'},
  mirejaw:{name:'Mirejaw',speed:48,hp:95,damage:20,radius:24,color:'#76a58e'},
  prismmoth:{name:'Prism Moth',speed:92,hp:42,damage:10,radius:15,color:'#d1a7eb'},
  clockstag:{name:'Clockstag',speed:66,hp:78,damage:16,radius:21,color:'#d2b57b'}
});
export function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function regionAt(x,y){return REGIONS.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)||REGIONS[0];}
export function clampPoint(x,y,pad=20){return{x:Math.max(pad,Math.min(WORLD.width-pad,x)),y:Math.max(pad,Math.min(WORLD.height-pad,y))};}
export function circleHit(a,b,extra=0){const dx=a.x-b.x,dy=a.y-b.y,r=(a.radius||0)+(b.radius||0)+extra;return dx*dx+dy*dy<=r*r;}
export function fuzzballUnlocked(state){return Number(state?.echoes||0)>=3;}
export function portalUnlocked(state){return Number(state?.echoes||0)>=6&&!!state?.fuzzballFound;}
function pointInRegion(rng,region,pad=80){return{x:region.x+pad+rng()*Math.max(1,region.w-pad*2),y:region.y+pad+rng()*Math.max(1,region.h-pad*2)};}
export function createWorld(seed=640064){
  const rng=mulberry32(seed),types=Object.keys(MONSTER_TYPES),monsters=[];
  for(let i=0;i<18;i++){
    const region=REGIONS[i%REGIONS.length],p=pointInRegion(rng,region,110),type=types[i%types.length],spec=MONSTER_TYPES[type];
    monsters.push({id:`m${i}`,type,x:p.x,y:p.y,homeX:p.x,homeY:p.y,hp:spec.hp,maxHp:spec.hp,radius:spec.radius,phase:rng()*Math.PI*2,cooldown:0,alive:true});
  }
  const echoes=[];
  for(let i=0;i<12;i++){
    const region=REGIONS[i%REGIONS.length],p=pointInRegion(rng,region,100);
    echoes.push({id:`e${i}`,x:p.x,y:p.y,radius:10,collected:false,phase:rng()*Math.PI*2});
  }
  const decor=[];
  for(let i=0;i<220;i++){const r=REGIONS[Math.floor(rng()*REGIONS.length)],p=pointInRegion(rng,r,10);decor.push({x:p.x,y:p.y,size:2+rng()*5,region:r.id,phase:rng()*6.28});}
  return{seed,monsters,echoes,decor,fuzzball:{x:2170,y:1310,radius:22,found:false},portal:{x:2110,y:275,radius:38,active:false}};
}
