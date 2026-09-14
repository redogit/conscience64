import assert from 'node:assert/strict';
await import('../space-lens-image-gen.js');

const api=globalThis.Conscience64ImageGen;
assert.equal(api.version,'1.0.0');
assert.equal(api.capabilities().secretsPersisted,false);

const req=api.normalizeRequest('a small spacecraft over an ocean',{size:'1024x1024'});
assert.equal(req.prompt,'a small spacecraft over an ocean');
assert.equal(req.size,'1024x1024');

assert.throws(()=>api.normalizeRequest(''),/required/);
assert.throws(()=>api.normalizeRequest('x',{size:'999x999'}),/Unsupported/);

globalThis.Conscience64ImageProvider={
  name:'mock-local-provider',
  async generate(request){
    return {provider:'mock-local-provider',images:[{url:'data:image/png;base64,AA==',revisedPrompt:request.prompt+' refined'}]};
  }
};

const out=await api.generate({prompt:'test image',n:1});
assert.equal(out.images.length,1);
assert.equal(out.provider,'mock-local-provider');
assert.match(out.images[0].revisedPrompt,/refined/);

console.log('image generation companion tests: PASS');
