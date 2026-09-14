(()=>{
'use strict';

// Conscience64 Space Lens GPU renderer.
// Real XYZ geometry + perspective projection.
// Fallback order: WebGPU -> WebGL2 -> WebGL -> existing Canvas2D semantic field.

const COUNT=640;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
function points(){const r=rng(640064),a=new Float32Array(COUNT*4);for(let i=0;i<COUNT;i++){const u=r()*2-1,th=r()*Math.PI*2,rad=.35+Math.pow(r(),.62)*1.85,s=Math.sqrt(1-u*u);a[i*4]=rad*s*Math.cos(th);a[i*4+1]=rad*s*Math.sin(th);a[i*4+2]=rad*u;a[i*4+3]=.45+r()*.9;}return a;}
const geometry=points();
function canvas(){const stage=document.querySelector('.space-stage');if(!stage)return null;let c=document.getElementById('space-gpu');if(!c){c=document.createElement('canvas');c.id='space-gpu';c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.86';stage.prepend(c);}return c;}
function fit(c){const d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(c.clientWidth*d)),h=Math.max(2,Math.floor(c.clientHeight*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return{w,h};}
function announce(mode){document.documentElement.dataset.spaceRenderer=mode;globalThis.SpaceLensGPU=Object.freeze({mode,geometry:'xyz-perspective',points:COUNT});const badge=document.getElementById('space-renderer');if(badge)badge.textContent=`Renderer: ${mode}`;dispatchEvent(new CustomEvent('space-lens-gpu-ready',{detail:{mode,geometry:'xyz-perspective'}}));}

async function webgpu(c){
 if(!navigator.gpu)return false;const adapter=await navigator.gpu.requestAdapter();if(!adapter)return false;const device=await adapter.requestDevice(),ctx=c.getContext('webgpu');if(!ctx)return false;
 const format=navigator.gpu.getPreferredCanvasFormat();ctx.configure({device,format,alphaMode:'premultiplied'});
 const code=`
 struct U{t:f32,aspect:f32,gain:f32,pad:f32}
 struct O{@builtin(position)pos:vec4f,@builtin(point_size)size:f32,@location(0)depth:f32,@location(1)energy:f32}
 @group(0) @binding(0) var<uniform> u:U;
 @vertex fn vs(@location(0)p:vec3f,@location(1)e:f32)->O{
   let a=u.t*.17;let b=u.t*.11;let ca=cos(a);let sa=sin(a);let cb=cos(b);let sb=sin(b);
   var q=vec3f(p.x*ca-p.z*sa,p.y,p.x*sa+p.z*ca);
   q=vec3f(q.x,q.y*cb-q.z*sb,q.y*sb+q.z*cb);
   let z=q.z+4.3;let f=1.7/max(.55,z);var o:O;o.pos=vec4f(q.x*f/u.aspect,q.y*f,clamp((z-1.)/6.,0.,1.)*2.-1.,1.);o.size=clamp((4.6/z)*e*u.gain,1.2,8.0);o.depth=z;o.energy=e;return o;
 }
 @fragment fn fs(@location(0)depth:f32,@location(1)energy:f32)->@location(0)vec4f{
   let near=clamp(1.-(depth-2.)/5.,.18,1.);let c=mix(vec3f(.12,.42,.68),vec3f(.95,.70,.28),clamp(energy-.45,0.,1.));return vec4f(c*near,clamp(.28+near*.62,0.,.92));
 }`;
 const module=device.createShaderModule({code});
 const pipeline=device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32'}]}]},fragment:{module,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'src-alpha',dstFactor:'one',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'point-list'}});
 const vb=device.createBuffer({size:geometry.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(vb,0,geometry);
 const ub=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),bg=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}}]});
 function frame(ms){const{w,h}=fit(c),gain=Number(document.getElementById('space-field-gain')?.value||1.5);device.queue.writeBuffer(ub,0,new Float32Array([reduced?0:ms/1000,w/h,gain,0]));const enc=device.createCommandEncoder(),pass=enc.beginRenderPass({colorAttachments:[{view:ctx.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipeline);pass.setBindGroup(0,bg);pass.setVertexBuffer(0,vb);pass.draw(COUNT);pass.end();device.queue.submit([enc.finish()]);requestAnimationFrame(frame);}requestAnimationFrame(frame);announce('WebGPU perspective 3D');return true;
}
function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function webgl(c){let gl=c.getContext('webgl2',{alpha:true,premultipliedAlpha:true}),mode='WebGL2 perspective 3D';if(!gl){gl=c.getContext('webgl',{alpha:true,premultipliedAlpha:true});mode='WebGL perspective 3D';}if(!gl)return false;
 const vs=compile(gl,gl.VERTEX_SHADER,'attribute vec3 p;attribute float e;uniform float t;uniform float aspect;uniform float gain;varying float depth;varying float energy;void main(){float a=t*.17,b=t*.11,ca=cos(a),sa=sin(a),cb=cos(b),sb=sin(b);vec3 q=vec3(p.x*ca-p.z*sa,p.y,p.x*sa+p.z*ca);q=vec3(q.x,q.y*cb-q.z*sb,q.y*sb+q.z*cb);float z=q.z+4.3,f=1.7/max(.55,z);gl_Position=vec4(q.x*f/aspect,q.y*f,clamp((z-1.)/6.,0.,1.)*2.-1.,1.);gl_PointSize=clamp((4.6/z)*e*gain,1.2,8.0);depth=z;energy=e;}');
 const fs=compile(gl,gl.FRAGMENT_SHADER,'precision highp float;varying float depth;varying float energy;void main(){vec2 d=gl_PointCoord-.5;if(dot(d,d)>.25)discard;float near=clamp(1.-(depth-2.)/5.,.18,1.);vec3 c=mix(vec3(.12,.42,.68),vec3(.95,.70,.28),clamp(energy-.45,0.,1.));gl_FragColor=vec4(c*near,clamp(.28+near*.62,0.,.92));}');
 const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr)||'program link failed');gl.useProgram(pr);
 const bfr=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bfr);gl.bufferData(gl.ARRAY_BUFFER,geometry,gl.STATIC_DRAW);const p=gl.getAttribLocation(pr,'p'),e=gl.getAttribLocation(pr,'e');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(e);gl.vertexAttribPointer(e,1,gl.FLOAT,false,16,12);const ut=gl.getUniformLocation(pr,'t'),ua=gl.getUniformLocation(pr,'aspect'),ug=gl.getUniformLocation(pr,'gain');gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
 function frame(ms){const{w,h}=fit(c);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(pr);gl.uniform1f(ut,reduced?0:ms/1000);gl.uniform1f(ua,w/h);gl.uniform1f(ug,Number(document.getElementById('space-field-gain')?.value||1.5));gl.drawArrays(gl.POINTS,0,COUNT);requestAnimationFrame(frame);}requestAnimationFrame(frame);announce(mode);return true;
}
async function start(){const c=canvas();if(!c)return;try{if(await webgpu(c))return;}catch(e){console.warn('Space Lens WebGPU fallback:',e);}try{if(webgl(c))return;}catch(e){console.warn('Space Lens WebGL fallback:',e);}c.remove();announce('Canvas2D accessibility fallback');}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
