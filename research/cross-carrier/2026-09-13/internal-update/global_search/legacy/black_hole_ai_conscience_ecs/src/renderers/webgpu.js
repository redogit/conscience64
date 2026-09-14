
function rgb(hex){const h=hex.replace("#","");return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];}
export class WebGPURenderer {
  static async create(canvas){
    if(!navigator.gpu)throw new Error("WebGPU unavailable.");
    let adapter=null;
    try{adapter=await navigator.gpu.requestAdapter({featureLevel:"compatibility"});}catch{}
    adapter ||= await navigator.gpu.requestAdapter();
    if(!adapter)throw new Error("No WebGPU adapter.");
    const hasCore=adapter.features?.has?.("core-features-and-limits");
    const device=await adapter.requestDevice(hasCore?{requiredFeatures:["core-features-and-limits"]}:undefined);
    return new WebGPURenderer(canvas,device,hasCore?"WebGPU core":"WebGPU compatibility");
  }
  constructor(canvas,device,kind){
    this.canvas=canvas;this.device=device;this.kind=kind;this.context=canvas.getContext("webgpu");
    if(!this.context)throw new Error("WebGPU canvas context unavailable.");
    this.format=navigator.gpu.getPreferredCanvasFormat();this.capacity=2048;
    this.buffer=device.createBuffer({size:this.capacity*28,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
    const module=device.createShaderModule({code:`
      struct In{@location(0)pos:vec2f,@location(1)size:vec2f,@location(2)color:vec3f};
      struct Out{@builtin(position)pos:vec4f,@location(0)uv:vec2f,@location(1)color:vec3f};
      struct U{@location(3) dummy:f32};
      @vertex fn vs(@builtin(vertex_index)vi:u32,i:In)->Out{
        var q=array<vec2f,6>(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(-1.,1.),vec2f(-1.,1.),vec2f(1.,-1.),vec2f(1.,1.));
        var o:Out;let c=q[vi];o.pos=vec4f(i.pos+c*i.size,0.,1.);o.uv=c;o.color=i.color;return o;
      }
      @fragment fn fs(i:Out)->@location(0)vec4f{
        let r=dot(i.uv,i.uv);if(r>1.){discard;}let a=smoothstep(1.,.35,r);return vec4f(i.color*a,1.);
      }`
    });
    this.pipeline=device.createRenderPipeline({
      layout:"auto",
      vertex:{module,entryPoint:"vs",buffers:[{arrayStride:28,stepMode:"instance",attributes:[
        {shaderLocation:0,offset:0,format:"float32x2"},
        {shaderLocation:1,offset:8,format:"float32x2"},
        {shaderLocation:2,offset:16,format:"float32x3"}]}]},
      fragment:{module,entryPoint:"fs",targets:[{format:this.format}]},
      primitive:{topology:"triangle-list"}
    });
    this.configure();
  }
  configure(){this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"});}
  resize(){
    const dpr=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.configure();}
  }
  render(items){
    this.resize();if(items.length>this.capacity)return;
    const aspect=this.canvas.width/this.canvas.height,data=new Float32Array(items.length*7);let i=0;
    for(const d of items){const c=rgb(d.fill);data[i++]=d.x/aspect;data[i++]=d.y;data[i++]=d.radius/aspect;data[i++]=d.radius;data[i++]=c[0];data[i++]=c[1];data[i++]=c[2];}
    this.device.queue.writeBuffer(this.buffer,0,data);
    const enc=this.device.createCommandEncoder(),view=this.context.getCurrentTexture().createView();
    const pass=enc.beginRenderPass({colorAttachments:[{view,clearValue:{r:.02,g:.027,b:.055,a:1},loadOp:"clear",storeOp:"store"}]});
    pass.setPipeline(this.pipeline);pass.setVertexBuffer(0,this.buffer);pass.draw(6,items.length);pass.end();this.device.queue.submit([enc.finish()]);
  }
}
