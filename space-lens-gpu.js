(()=>{
'use strict';

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
