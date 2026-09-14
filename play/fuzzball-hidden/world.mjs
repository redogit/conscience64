export const WORLD=Object.freeze({width:1800,height:1100});
export const HUMANOID_TYPES=Object.freeze({
  mosswalker:{name:'Mosswalker',speed:42,radius:14,color:'#7fb58e',temperament:'curious'},
  glasskin:{name:'Glasskin',speed:58,radius:13,color:'#9bd8e8',temperament:'wary'},
  emberkin:{name:'Emberkin',speed:51,radius:15,color:'#e79562',temperament:'bold'},
  duskseer:{name:'Duskseer',speed:38,radius:14,color:'#b39ae8',temperament:'watchful'}
});
export function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function createWorld(seed=640064){const rng=mulberry32(seed),humanoids=[],types=Object.keys(HUMANOID_TYPES);for(let i=0;i<16;i++){const type=types[i%types.length],spec=HUMANOID_TYPES[type];humanoids.push({id:`h${i}`,type,x:100+rng()*(WORLD.width-200),y:100+rng()*(WORLD.height-200),homeX:0,homeY:0,radius:spec.radius,phase:rng()*Math.PI*2});humanoids[i].homeX=humanoids[i].x;humanoids[i].homeY=humanoids[i].y;}const fuzzballs=[];for(let i=0;i<22;i++)fuzzballs.push({id:`f${i}`,x:60+rng()*(WORLD.width-120),y:60+rng()*(WORLD.height-120),r:7+rng()*8,phase:rng()*6.28});return{seed,humanoids,fuzzballs,beacon:{x:WORLD.width/2,y:WORLD.height/2,radius:28}};}
export function updateHumanoid(h,time,dt,player){const spec=HUMANOID_TYPES[h.type],dx=player.x-h.x,dy=player.y-h.y,d=Math.hypot(dx,dy)||1;let vx=Math.cos(time*.35+h.phase),vy=Math.sin(time*.29+h.phase);if(d<180){const sign=spec.temperament==='bold'?1:-1;vx=sign*dx/d;vy=sign*dy/d;}h.x=Math.max(20,Math.min(WORLD.width-20,h.x+vx*spec.speed*dt));h.y=Math.max(20,Math.min(WORLD.height-20,h.y+vy*spec.speed*dt));return h;}
