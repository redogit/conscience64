(()=>{
'use strict';

const SCHEMA='conscience64/image-generation/v1';
const VERSION='1.0.0';
const DEFAULT_ENDPOINT='/api/image-generate';
const VALID_SIZES=new Set(['auto','1024x1024','1536x1024','1024x1536']);
const MAX_PROMPT=4000;
const MAX_NEGATIVE_PROMPT=2000;

let CONFIG={
  endpoint:DEFAULT_ENDPOINT,
  method:'POST',
  credentials:'same-origin',
  allowCrossOrigin:false,
  headers:Object.freeze({'content-type':'application/json'})
};

const clean=(value,max)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));

function endpointURL(endpoint){
  if(typeof location==='undefined') return new URL(endpoint,'http://localhost/');
  return new URL(endpoint,location.href);
}

function configure(next={}){
  if(!next||typeof next!=='object'||Array.isArray(next)) throw new TypeError('Image generator configuration must be an object.');
  const candidate={...CONFIG,...next};
  candidate.endpoint=clean(candidate.endpoint||DEFAULT_ENDPOINT,2048);
  candidate.method=String(candidate.method||'POST').toUpperCase();
  if(candidate.method!=='POST') throw new TypeError('Image generation currently requires POST.');
  candidate.credentials=['omit','same-origin','include'].includes(candidate.credentials)?candidate.credentials:'same-origin';
  candidate.allowCrossOrigin=Boolean(candidate.allowCrossOrigin);
  const url=endpointURL(candidate.endpoint);
  if(typeof location!=='undefined'&&url.origin!==location.origin&&!candidate.allowCrossOrigin)
    throw new Error('Cross-origin image generation endpoint blocked. Set allowCrossOrigin:true only for a trusted provider.');
  candidate.headers=Object.freeze({...CONFIG.headers,...(next.headers||{})});
  CONFIG=candidate;
  return configuration();
}

function configuration(){
  const {endpoint,method,credentials,allowCrossOrigin}=CONFIG;
  return Object.freeze({schema:SCHEMA,version:VERSION,endpoint,method,credentials,allowCrossOrigin});
}

function normalizeRequest(input,options={}){
  const src=typeof input==='string'?{prompt:input}:{...(input||{})};
  const opts=options&&typeof options==='object'?options:{};
  const prompt=clean(src.prompt??opts.prompt,MAX_PROMPT);
  if(!prompt) throw new TypeError('Image prompt is required.');
  const negativePrompt=clean(src.negativePrompt??src.negative_prompt??opts.negativePrompt,MAX_NEGATIVE_PROMPT);
  const size=String(src.size??opts.size??'1024x1024');
  if(!VALID_SIZES.has(size)) throw new TypeError(`Unsupported image size: ${size}`);
  const n=Math.max(1,Math.min(4,Number(src.n??opts.n??1)||1));
  return {
    schema:SCHEMA,
    prompt,
    negativePrompt:negativePrompt||undefined,
    size,
    n,
    transparent_background:Boolean(src.transparent_background??src.transparentBackground??opts.transparent_background??false),
    metadata:{
      source:'Conscience64ImageGen',
      requestedAt:new Date().toISOString()
    }
  };
}

function provider(){
  const p=globalThis.Conscience64ImageProvider;
  return p&&typeof p.generate==='function'?p:null;
}

function capabilities(){
  return Object.freeze({
    schema:SCHEMA,
    version:VERSION,
    injectedProvider:Boolean(provider()),
    endpoint:CONFIG.endpoint,
    transport:provider()?'injected-provider':'http-json',
    sizes:[...VALID_SIZES],
    maxImages:4,
    maxPromptChars:MAX_PROMPT,
    secretsPersisted:false
  });
}

function normalizeImage(item,index,prompt){
  if(typeof item==='string') return {url:item,alt:prompt,index};
  const x=item&&typeof item==='object'?item:{};
  let url=x.url||x.dataUrl||x.data_url||null;
  const b64=x.b64_json||x.base64||x.b64||null;
  const mime=clean(x.mime||x.mimeType||'image/png',100)||'image/png';
  if(!url&&b64) url=`data:${mime};base64,${b64}`;
  if(!url) return null;
  return {
    url,
    alt:clean(x.alt||x.revised_prompt||x.revisedPrompt||prompt,MAX_PROMPT)||prompt,
    revisedPrompt:clean(x.revised_prompt||x.revisedPrompt||'',MAX_PROMPT)||undefined,
    index
  };
}

function normalizeResponse(raw,request){
  const source=raw&&typeof raw==='object'?raw:{};
  const candidates=Array.isArray(source.images)?source.images:
    Array.isArray(source.data)?source.data:
    source.image?[source.image]:
    source.url?[source]:[];
  const images=candidates.map((x,i)=>normalizeImage(x,i,request.prompt)).filter(Boolean);
  if(!images.length) throw new Error('Image provider returned no usable images.');
  return {
    schema:SCHEMA,
    version:VERSION,
    request:clone(request),
    images,
    provider:clean(source.provider||source.model||provider()?.name||'configured-provider',200),
    createdAt:source.createdAt||source.created_at||new Date().toISOString()
  };
}

async function viaEndpoint(request,signal){
  const url=endpointURL(CONFIG.endpoint);
  const response=await fetch(url,{
    method:CONFIG.method,
    credentials:CONFIG.credentials,
    headers:CONFIG.headers,
    body:JSON.stringify(request),
    signal
  });
  if(!response.ok){
    let detail='';
    try{detail=(await response.text()).slice(0,500);}catch{}
    throw new Error(`Image generation backend returned HTTP ${response.status}${detail?`: ${detail}`:''}`);
  }
  const type=(response.headers.get('content-type')||'').toLowerCase();
  if(type.startsWith('image/')){
    const blob=await response.blob();
    return {images:[{url:URL.createObjectURL(blob),mime:blob.type}],provider:url.origin};
  }
  return response.json();
}

async function generate(input,options={}){
  const request=normalizeRequest(input,options);
  const p=provider();
  const raw=p?await p.generate(clone(request),options):await viaEndpoint(request,options.signal);
  return normalizeResponse(raw,request);
}

function ensureUI(){
  if(typeof document==='undefined') return null;
  let panel=document.getElementById('image-generation-panel');
  if(panel) return panel;
  const actions=document.querySelector('.lens-actions');
  const readout=document.querySelector('.space-readout');
  if(!actions||!readout) return null;

  if(!document.getElementById('image-generation-open')){
    const openButton=document.createElement('button');
    openButton.type='button';
    openButton.id='image-generation-open';
    openButton.textContent='Image';
    openButton.setAttribute('aria-controls','image-generation-panel');
    openButton.setAttribute('aria-expanded','false');
    actions.appendChild(openButton);
  }

  const style=document.createElement('style');
  style.textContent=`
    .image-gen-panel{margin:.9rem 0 0;padding:1rem;border:1px solid #405071;border-radius:.8rem;background:rgba(7,11,22,.95)}
    .image-gen-panel[hidden]{display:none}.image-gen-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}
    .image-gen-head h3{margin:0;font:700 1rem ui-sans-serif,system-ui}.image-gen-head p{margin:.3rem 0 0}
    .image-gen-form{display:grid;gap:.65rem;margin-top:.8rem}.image-gen-form label{display:grid;gap:.3rem;color:#dbe6f6;font-size:.82rem}
    .image-gen-form textarea,.image-gen-form select,.image-gen-form input{width:100%;border:1px solid #405071;background:#080d19;color:#eef4ff;border-radius:.55rem;padding:.65rem;font:inherit}
    .image-gen-row{display:grid;grid-template-columns:1fr 10rem;gap:.65rem}.image-gen-actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .image-gen-actions button,.image-gen-close{border:1px solid #405071;background:#111a2b;color:#eef4ff;border-radius:.55rem;padding:.6rem .8rem;cursor:pointer}
    .image-gen-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:.8rem}
    .image-gen-card{margin:0;border:1px solid #26314b;border-radius:.7rem;overflow:hidden;background:#05070e}
    .image-gen-card img{display:block;width:100%;height:auto}.image-gen-card figcaption{padding:.55rem;color:#9eabc4;font-size:.75rem}
    .image-gen-status{min-height:1.4rem}.image-gen-note{font-size:.75rem;color:#9eabc4}
    @media(max-width:640px){.image-gen-row,.image-gen-gallery{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  panel=document.createElement('section');
  panel.id='image-generation-panel';
  panel.className='image-gen-panel';
  panel.hidden=true;
  panel.innerHTML=`
    <div class="image-gen-head">
      <div><h3>Image Generation AI</h3><p>Create an image from a text prompt through a configured Conscience64 image provider.</p></div>
      <button type="button" class="image-gen-close" id="image-generation-close">Close</button>
    </div>
    <form id="image-generation-form" class="image-gen-form">
      <label>Prompt
        <textarea id="image-generation-prompt" rows="4" maxlength="${MAX_PROMPT}" required placeholder="Describe the image to create…"></textarea>
      </label>
      <label>Optional negative prompt
        <input id="image-generation-negative" maxlength="${MAX_NEGATIVE_PROMPT}" placeholder="Elements to avoid…">
      </label>
      <div class="image-gen-row">
        <label>Size
          <select id="image-generation-size">
            <option value="1024x1024">1024 × 1024</option>
            <option value="1536x1024">1536 × 1024</option>
            <option value="1024x1536">1024 × 1536</option>
            <option value="auto">Auto</option>
          </select>
        </label>
        <label>Images
          <input id="image-generation-count" type="number" min="1" max="4" value="1">
        </label>
      </div>
      <div class="image-gen-actions"><button type="submit">Generate image</button></div>
      <p class="image-gen-note">No provider secret is stored by this UI. The default transport is the same-origin <code>/api/image-generate</code> backend, or a runtime can inject <code>Conscience64ImageProvider</code>.</p>
      <p id="image-generation-status" class="image-gen-status" role="status" aria-live="polite"></p>
    </form>
    <div id="image-generation-gallery" class="image-gen-gallery" aria-live="polite"></div>
  `;
  readout.appendChild(panel);

  const open=document.getElementById('image-generation-open');
  const close=document.getElementById('image-generation-close');
  const form=document.getElementById('image-generation-form');
  const prompt=document.getElementById('image-generation-prompt');
  const negative=document.getElementById('image-generation-negative');
  const size=document.getElementById('image-generation-size');
  const count=document.getElementById('image-generation-count');
  const status=document.getElementById('image-generation-status');
  const gallery=document.getElementById('image-generation-gallery');

  function show(){
    panel.hidden=false;
    open.setAttribute('aria-expanded','true');
    const mainPrompt=document.getElementById('space-search')?.value?.trim();
    if(mainPrompt&&!prompt.value) prompt.value=mainPrompt;
    prompt.focus();
  }
  function hide(){
    panel.hidden=true;
    open.setAttribute('aria-expanded','false');
    open.focus();
  }
  open.addEventListener('click',()=>panel.hidden?show():hide());
  close.addEventListener('click',hide);

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    status.textContent='Generating…';
    gallery.replaceChildren();
    const submit=form.querySelector('button[type="submit"]');
    submit.disabled=true;
    try{
      const out=await generate({
        prompt:prompt.value,
        negativePrompt:negative.value,
        size:size.value,
        n:Number(count.value)
      });
      for(const image of out.images){
        const figure=document.createElement('figure');
        figure.className='image-gen-card';
        const img=document.createElement('img');
        img.src=image.url;
        img.alt=image.alt||prompt.value;
        img.loading='lazy';
        const caption=document.createElement('figcaption');
        caption.textContent=image.revisedPrompt||`Generated image ${image.index+1}`;
        figure.append(img,caption);
        gallery.appendChild(figure);
      }
      status.textContent=`Generated ${out.images.length} image${out.images.length===1?'':'s'} via ${out.provider||'configured provider'}.`;
      globalThis.Conscience64API?.irpo?.({
        I:{prompt:prompt.value,size:size.value,n:Number(count.value)},
        R:{source:'Image Generation AI',boundary:'Generated media is an output artifact; it is not research evidence by itself.'},
        P:{action:'image.generate',provider:out.provider},
        O:{status:'GENERATED',count:out.images.length}
      });
    }catch(error){
      status.textContent=String(error?.message||error);
    }finally{
      submit.disabled=false;
    }
  });

  return panel;
}

function open(){
  const panel=ensureUI();
  if(!panel) return false;
  const button=document.getElementById('image-generation-open');
  if(panel.hidden) button?.click();
  return true;
}

function install(){
  ensureUI();
  if(typeof CustomEvent==='function') globalThis.dispatchEvent?.(new CustomEvent('conscience64-image-ready',{detail:capabilities()}));
}

globalThis.Conscience64ImageGen=Object.freeze({
  schema:SCHEMA,
  version:VERSION,
  configure,
  configuration,
  normalizeRequest,
  capabilities,
  generate,
  open,
  install
});

globalThis.addEventListener?.('message',async event=>{
  const m=event.data;
  if(!m||m.type!=='conscience64.image.generate'||!m.id) return;
  const reply={type:'conscience64.image.result',id:m.id,ok:true,result:null};
  try{reply.result=await generate(m.request||m.prompt||'',m.options||{});}
  catch(error){reply.ok=false;reply.error=String(error?.message||error);}
  event.source?.postMessage(reply,'*');
});

if(typeof document!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
})();