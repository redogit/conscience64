(()=>{
'use strict';

// Capability-adaptive visual accelerator for the Space Lens.
// WebGPU is preferred where the browser exposes it. WebGL2/WebGL is the fallback.
// The existing 2D Space Lens field remains the semantic/event layer and accessibility fallback.

const VERT=`
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f }
@vertex fn vs(@builtin(vertex_index) i:u32)->VSOut {
  var p=array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));
  var o:VSOut; o.pos=vec4f(p[i],0.0,1.0); o.uv=p[i]*0.5+0.5; return o;
}`;
const FRAG=`
struct U { t:f32, aspect:f32, gain:f32, pad:f32 }
@group(0) @binding(0) var<uniform> u:U;
@fragment fn fs(@location(0) uv:vec2f)->@location(0) vec4f {
  var p=(uv-vec2f(.5,.5))*vec2f(u.aspect,1.0);
  let r=length(p);
  let a=atan2(p.y,p.x);
  let ring=exp(-70.0*abs(r-(.27+.018*sin(a*4.0-u.t*.35))));
  let ring2=exp(-55.0*abs(r-(.39+.012*cos(a*6.0+u.t*.22))));
  let core=1.0-smoothstep(.055,.22,r);
  let stars=pow(max(0.0,sin((p.x*91.0+p.y*73.0+sin(u.t*.09))*18.0)),42.0)*(1.0-smoothstep(.2,.8,r));
  let c=vec3f(.12,.40,.62)*ring*u.gain + vec3f(.58,.38,.13)*ring2*.65 + vec3f(.25,.45,.34)*stars*.38;
  return vec4f(c*(1.0-core),clamp((ring+ring2)*.55+stars*.22,0.0,.72));
}`;

function canvas(){
  const stage=document.querySelector('.space-stage');
  if(!stage)return null;
  let c=document.getElementById('space-gpu');
  if(!c){
    c=document.createElement('canvas'); c.id='space-gpu'; c.setAttribute('aria-hidden','true');
    c.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.78';
    stage.prepend(c);
  }
  return c;
}
function fit(c){
  const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(c.clientWidth*d)),h=Math.max(2,Math.floor(c.clientHeight*d));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;} return {w,h};
}
function status(mode){
  document.documentElement.dataset.spaceGpu=mode;
  globalThis.SpaceLensGPU={mode};
  dispatchEvent(new CustomEvent('space-lens-gpu-ready',{detail:{mode}}));
}

async function webgpu(c){
  if(!navigator.gpu)return false;
  const adapter=await navigator.gpu.requestAdapter(); if(!adapter)return false;
  const device=await adapter.requestDevice();
  const ctx=c.getContext('webgpu'); if(!ctx)return false;
  const format=navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({device,format,alphaMode:'premultiplied'});
  const module=device.createShaderModule({code:VERT+'\n'+FRAG});
  const pipeline=device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'triangle-list'}});
  const ub=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
  const bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}}]});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(ms){const {w,h}=fit(c);const gain=Number(document.getElementById('space-field-gain')?.value||1.5);device.queue.writeBuffer(ub,0,new Float32Array([reduced?0:ms/1000,w/h,gain,0]));const enc=device.createCommandEncoder(),pass=enc.beginRenderPass({colorAttachments:[{view:ctx.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.draw(3);pass.end();device.queue.submit([enc.finish()]);requestAnimationFrame(frame);}requestAnimationFrame(frame);status('webgpu');return true;
}

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function webgl(c){
  const gl=c.getContext('webgl2',{alpha:true,premultipliedAlpha:true})||c.getContext('webgl',{alpha:true,premultipliedAlpha:true}); if(!gl)return false;
  const vs=shader(gl,gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
  const fs=shader(gl,gl.FRAGMENT_SHADER,'precision highp float; varying vec2 uv; uniform float t; uniform float aspect; uniform float gain; void main(){vec2 p=(uv-.5)*vec2(aspect,1.);float r=length(p),a=atan(p.y,p.x);float q=exp(-70.*abs(r-(.27+.018*sin(a*4.-t*.35))));float q2=exp(-55.*abs(r-(.39+.012*cos(a*6.+t*.22))));float core=1.-smoothstep(.055,.22,r);vec3 c=vec3(.12,.40,.62)*q*gain+vec3(.58,.38,.13)*q2*.65;gl_FragColor=vec4(c*(1.-core),clamp((q+q2)*.55,0.,.72));}');
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr)||'program link failed');gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const ut=gl.getUniformLocation(pr,'t'),ua=gl.getUniformLocation(pr,'aspect'),ug=gl.getUniformLocation(pr,'gain');const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(ms){const {w,h}=fit(c);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(pr);gl.uniform1f(ut,reduced?0:ms/1000);gl.uniform1f(ua,w/h);gl.uniform1f(ug,Number(document.getElementById('space-field-gain')?.value||1.5));gl.drawArrays(gl.TRIANGLES,0,3);requestAnimationFrame(frame);}requestAnimationFrame(frame);status(gl instanceof WebGL2RenderingContext?'webgl2':'webgl');return true;
}

async function start(){const c=canvas();if(!c)return;try{if(await webgpu(c))return;}catch(e){console.warn('Space Lens WebGPU fallback:',e);}try{if(webgl(c))return;}catch(e){console.warn('Space Lens WebGL fallback:',e);}c.remove();status('canvas2d');}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',start,{once:true});else start();
// Capability-adaptive 2.5D/3D visual layer for the Conscience64 Space Lens.
// Order: WebGPU -> WebGL2 -> WebGL -> existing Canvas2D semantic field.

function ensureCanvas(){const stage=document.querySelector('.space-stage');if(!stage)return null;let c=document.getElementById('space-gpu');if(!c){c=document.createElement('canvas');c.id='space-gpu';c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.78';stage.prepend(c);}return c;}
function fit(c){const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(c.clientWidth*d)),h=Math.max(2,Math.floor(c.clientHeight*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return{w,h};}
function announce(mode){document.documentElement.dataset.spaceRenderer=mode;globalThis.SpaceLensGPU=Object.freeze({mode});const badge=document.getElementById('space-renderer');if(badge)badge.textContent=`Renderer: ${mode}`;dispatchEvent(new CustomEvent('space-lens-gpu-ready',{detail:{mode}}));}

async function startWebGPU(c){
 if(!navigator.gpu)return false;
 const adapter=await navigator.gpu.requestAdapter();if(!adapter)return false;const device=await adapter.requestDevice(),ctx=c.getContext('webgpu');if(!ctx)return false;
 const format=navigator.gpu.getPreferredCanvasFormat();ctx.configure({device,format,alphaMode:'premultiplied'});
 const code=`
 struct Out{@builtin(position)pos:vec4f,@location(0)uv:vec2f}
 struct U{t:f32,aspect:f32,gain:f32,pad:f32}
 @group(0) @binding(0) var<uniform> u:U;
 @vertex fn vs(@builtin(vertex_index)i:u32)->Out{var p=array<vec2f,3>(vec2f(-1.,-1.),vec2f(3.,-1.),vec2f(-1.,3.));var o:Out;o.pos=vec4f(p[i],0.,1.);o.uv=p[i]*.5+.5;return o;}
 @fragment fn fs(@location(0)uv:vec2f)->@location(0)vec4f{let p=(uv-vec2f(.5))*vec2f(u.aspect,1.);let r=length(p);let a=atan2(p.y,p.x);let z=.018*sin(a*5.-u.t*.32);let r1=exp(-72.*abs(r-(.27+z)));let r2=exp(-58.*abs(r-(.42+.014*cos(a*7.+u.t*.21))));let core=1.-smoothstep(.06,.20,r);let depth=clamp(1.-r,0.,1.);let col=vec3f(.12,.42,.68)*r1*u.gain+vec3f(.64,.42,.16)*r2*.7+vec3f(.12,.32,.28)*depth*.08;return vec4f(col*(1.-core),clamp((r1+r2)*.6,0.,.74));}`;
 const module=device.createShaderModule({code});
 const pipeline=device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'triangle-list'}});
 const ub=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}}]});const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function frame(ms){const{w,h}=fit(c),gain=Number(document.getElementById('space-field-gain')?.value||1.5);device.queue.writeBuffer(ub,0,new Float32Array([reduced?0:ms/1000,w/h,gain,0]));const enc=device.createCommandEncoder(),pass=enc.beginRenderPass({colorAttachments:[{view:ctx.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.draw(3);pass.end();device.queue.submit([enc.finish()]);requestAnimationFrame(frame);}requestAnimationFrame(frame);announce('WebGPU 3D');return true;
}
function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function startWebGL(c){let mode='WebGL2 3D',gl=c.getContext('webgl2',{alpha:true,premultipliedAlpha:true});if(!gl){gl=c.getContext('webgl',{alpha:true,premultipliedAlpha:true});mode='WebGL 3D';}if(!gl)return false;const vs=compile(gl,gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'),fs=compile(gl,gl.FRAGMENT_SHADER,'precision highp float;varying vec2 uv;uniform float t;uniform float aspect;uniform float gain;void main(){vec2 p=(uv-.5)*vec2(aspect,1.);float r=length(p),a=atan(p.y,p.x),z=.018*sin(a*5.-t*.32),r1=exp(-72.*abs(r-(.27+z))),r2=exp(-58.*abs(r-(.42+.014*cos(a*7.+t*.21)))),core=1.-smoothstep(.06,.20,r),depth=clamp(1.-r,0.,1.);vec3 col=vec3(.12,.42,.68)*r1*gain+vec3(.64,.42,.16)*r2*.7+vec3(.12,.32,.28)*depth*.08;gl_FragColor=vec4(col*(1.-core),clamp((r1+r2)*.6,0.,.74));}');const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr)||'program link failed');gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const p=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);const ut=gl.getUniformLocation(pr,'t'),ua=gl.getUniformLocation(pr,'aspect'),ug=gl.getUniformLocation(pr,'gain'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;function frame(ms){const{w,h}=fit(c);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(pr);gl.uniform1f(ut,reduced?0:ms/1000);gl.uniform1f(ua,w/h);gl.uniform1f(ug,Number(document.getElementById('space-field-gain')?.value||1.5));gl.drawArrays(gl.TRIANGLES,0,3);requestAnimationFrame(frame);}requestAnimationFrame(frame);announce(mode);return true;}
async function start(){const c=ensureCanvas();if(!c)return;try{if(await startWebGPU(c))return;}catch(e){console.warn('WebGPU unavailable; falling back.',e);}try{if(startWebGL(c))return;}catch(e){console.warn('WebGL unavailable; falling back.',e);}c.remove();announce('Canvas2D fallback');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
