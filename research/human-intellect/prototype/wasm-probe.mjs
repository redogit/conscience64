// Minimal valid empty WebAssembly module. No imports means no ambient capability.
const bytes=new Uint8Array([0,97,115,109,1,0,0,0]);
export async function loadCapabilityProbe(){
  const module=await WebAssembly.compile(bytes);
  const instance=await WebAssembly.instantiate(module,{});
  return Object.freeze({module,instance,valid:WebAssembly.validate(bytes)});
}
