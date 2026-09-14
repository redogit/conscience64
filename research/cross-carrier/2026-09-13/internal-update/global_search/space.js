/* Uses the recovered ECS coordinate convention; w is an illustrative fourth axis, not physical time. */
(()=>{
const c=document.getElementById('space'),ctx=c.getContext('2d');if(!ctx)return;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,angle=0;
const pts=Array.from({length:1800},(_,i)=>{const t=i*2.39996323,r=1.2+(i%43)/48;return new Float64Array([r*Math.cos(t),.09*Math.sin(t*7),r*Math.sin(t),.22*Math.cos(t*3)]);});
function project(p,a){const [x,y,z,w]=p,xx=x*Math.cos(a)-w*Math.sin(a),ww=x*Math.sin(a)+w*Math.cos(a),k=4/(4-ww);return [xx*k,(y*Math.cos(.5)-z*Math.sin(.5))*k,(y*Math.sin(.5)+z*Math.cos(.5))*k];}
function draw(){const d=Math.min(devicePixelRatio||1,2),width=Math.max(1,c.clientWidth),height=260;c.width=width*d;c.height=height*d;ctx.scale(d,d);ctx.fillStyle='#060b13';ctx.fillRect(0,0,width,height);const scale=Math.min(width*.21,83),p3=pts.map(p=>project(p,angle)).sort((a,b)=>b[2]-a[2]);
const horizon=()=>{const g=ctx.createRadialGradient(width/2,130,29,width/2,130,45);g.addColorStop(0,'#000');g.addColorStop(.72,'#030608');g.addColorStop(.8,'#b8ffff');g.addColorStop(.87,'#438c99');g.addColorStop(1,'#060b1300');ctx.fillStyle=g;ctx.beginPath();ctx.arc(width/2,130,45,0,Math.PI*2);ctx.fill();};
let front=false;for(const p of p3){if(!front&&p[2]<0){horizon();front=true;}const k=5/(5+p[2]);ctx.fillStyle=p[2]>0?'#49898b':'#f6d6a2';ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(width/2+p[0]*scale*k,130+p[1]*scale*k,1.15*k,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(!front)horizon();}
document.getElementById('spacepause').onclick=()=>{paused=!paused;document.getElementById('spacepause').textContent=paused?'Animate':'Pause';};document.getElementById('spacepause').textContent=paused?'Animate':'Pause';
let previous=0;function tick(now){if(!paused&&!document.hidden&&document.getElementById('spacedetails').open&&now-previous>32){angle+=.004;draw();previous=now;}requestAnimationFrame(tick);}new ResizeObserver(draw).observe(c);draw();requestAnimationFrame(tick);window.orbitProjection=project;
})();
