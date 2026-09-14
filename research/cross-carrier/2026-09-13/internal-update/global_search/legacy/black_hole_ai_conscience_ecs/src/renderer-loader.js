
export async function loadBestRenderer(canvas, announce=()=>{}) {
  if(navigator.gpu && globalThis.isSecureContext){
    try{
      announce("Trying WebGPU…");
      const {WebGPURenderer}=await import("./renderers/webgpu.js");
      const r=await WebGPURenderer.create(canvas);announce(`Renderer: ${r.kind}`);return r;
    }catch(e){console.warn("WebGPU fallback:",e);announce("WebGPU unavailable; trying WebGL2.");}
  }
  try{
    announce("Trying WebGL2…");
    const {WebGL2Renderer}=await import("./renderers/webgl2.js");
    const r=await WebGL2Renderer.create(canvas);announce("Renderer: WebGL2");return r;
  }catch(e){console.warn("WebGL2 fallback:",e);announce("WebGL2 unavailable; using Canvas 2D.");}
  const {Canvas2DRenderer}=await import("./renderers/canvas2d.js");
  const r=await Canvas2DRenderer.create(canvas);announce("Renderer: Canvas 2D");return r;
}
