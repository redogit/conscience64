import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const profile = await mkdtemp(resolve(tmpdir(), 'conscience64-mmo-test-'));
let chrome, socket, seq = 0;
const pending = new Map();
const server = createServer(async (req, res) => {
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) throw new Error('path');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    const type = ({'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json'})[extname(path)] || 'text/plain;charset=utf-8';
    res.writeHead(200, {'Content-Type':type,'Cache-Control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});

function send(method, params={}, sessionId) {
  return new Promise((resolvePromise,reject) => {
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},15000);
    pending.set(id,{resolve:resolvePromise,reject,timer});
    socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
}

try {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const endpoint=await new Promise((resolvePromise,reject)=>{
    let output='';
    const timer=setTimeout(()=>reject(new Error('Chrome did not start')),20000);
    chrome=spawn(process.env.CHROME_BIN || 'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
    chrome.once('error',e=>{clearTimeout(timer);reject(e);});
    chrome.stderr.on('data',chunk=>{output=(output+chunk).slice(-12000);const m=output.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolvePromise(m[1]);}});
  });
  socket=new WebSocket(endpoint);
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  socket.addEventListener('message',event=>{
    const msg=JSON.parse(event.data);
    if(!msg.id)return;
    const slot=pending.get(msg.id); if(!slot)return;
    pending.delete(msg.id);clearTimeout(slot.timer);
    if(msg.error)slot.reject(new Error(JSON.stringify(msg.error))); else slot.resolve(msg.result);
  });
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const call=(method,params={})=>send(method,params,sessionId);
  await call('Page.enable'); await call('Runtime.enable');
  const evaluate=async(fn,...args)=>{
    const result=await call('Runtime.evaluate',{expression:`(${fn.toString()})(...${JSON.stringify(args)})`,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
    return result.result.value;
  };
  async function waitReady(url) {
    for(let i=0;i<100;i++){
      if(await evaluate(url=>location.href===url && !!globalThis.Conscience64MMOPlugins && !!globalThis.Conscience64MMOSave && !!document.getElementById('plugin-games'),url))return;
      if(i===99)throw new Error('MMO did not initialize');
      await new Promise(r=>setTimeout(r,100));
    }
  }

  const forgeUrl=`${origin}/play/mmo/forge.html?test=starter-pack`;
  await call('Page.navigate',{url:forgeUrl});
  for(let i=0;i<100;i++){
    if(await evaluate(url=>location.href===url && !!globalThis.Conscience64MMOPlugins && !!document.getElementById('install-starter-pack'),forgeUrl))break;
    if(i===99)throw new Error('Arcade Forge starter pack did not initialize');
    await new Promise(r=>setTimeout(r,100));
  }
  const starterPack=await evaluate(()=>{
    document.getElementById('install-starter-pack').click();
    return {names:globalThis.Conscience64MMOPlugins.list().map(p=>p.name).sort(),status:document.getElementById('status').textContent};
  });
  assert.deepEqual(starterPack.names,['Bus Transfer','Market Closing Shift','Observatory Label Check','Workshop Sort'].sort());
  assert.match(starterPack.status,/Installed Grounded Starter Pack/);

  let url=`${origin}/play/mmo/?test=1`;
  await call('Page.navigate',{url});
  await waitReady(url);

  const starterCabinets=await evaluate(()=>[...document.querySelectorAll('#plugin-games .game-card h3')].map(node=>node.textContent).sort());
  assert.deepEqual(starterCabinets,['Bus Transfer','Market Closing Shift','Observatory Label Check','Workshop Sort'].sort());

  for(const width of [1100,320]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    const layout=await evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,street:!!document.querySelector('.street-scene'),observatory:!!document.querySelector('.sky-window'),label:document.querySelector('.sky-label')?.textContent||'',save:!!document.getElementById('save-local')}));
    assert.ok(layout.street && layout.observatory && layout.save,'grounded world or save surfaces missing');
    assert.match(layout.label,/NOT TELESCOPE DATA/);
    assert.ok(layout.scroll<=layout.width+1,`MMO horizontal overflow at ${width}: ${JSON.stringify(layout)}`);
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1100,height:900,deviceScaleFactor:1,mobile:false});

  const pluginResult=await evaluate(()=>{
    const runtime=globalThis.Conscience64MMOPlugins;
    runtime.install({
      schema:runtime.schema,id:'browser-market-test',name:'Browser Market Test',version:'1.0.0',mechanic:'choice',
      prompt:'Move the wet cardboard display away from the drain. <img src=x onerror=alert(1)>',
      choices:['Move it safely','Leave it in traffic'],correctIndex:0,
      reward:{xp:16,joy:8,tokens:1,discoveries:0},description:'Browser-installed grounded plug-in.'
    });
    document.getElementById('refresh-plugins').click();
    const card=[...document.querySelectorAll('#plugin-games .game-card')].find(c=>c.textContent.includes('Browser Market Test'));
    if(!card)throw new Error('installed plug-in not discovered');
    if(card.querySelector('img'))throw new Error('plug-in text interpreted as HTML');
    card.querySelector('button').click();
    const prompt=document.getElementById('game-prompt').textContent;
    const before=Number(document.getElementById('xp').textContent);
    document.querySelector('#game-controls button').click();
    return {prompt,after:Number(document.getElementById('xp').textContent),before,result:document.getElementById('game-result').textContent,status:document.getElementById('plugin-status').textContent,images:document.querySelectorAll('#playfield img').length};
  });
  assert.match(pluginResult.prompt,/cardboard display/);
  assert.equal(pluginResult.images,0);
  assert.equal(pluginResult.after-pluginResult.before,16);
  assert.match(pluginResult.result,/Completed|success/i);
  assert.match(pluginResult.status,/validated local plug-in/i);

  const untimedRedline=await evaluate(()=>{
    const before=Number(document.getElementById('xp').textContent);
    document.querySelector('[data-game="race"]').click();
    const route=[...document.querySelectorAll('#game-controls button')].find(b=>b.textContent==='Use untimed route');
    if(!route)throw new Error('untimed Redline route missing');
    route.click();
    const prompt=document.getElementById('game-prompt').textContent;
    const enter=[...document.querySelectorAll('#game-controls button')].find(b=>b.textContent==='Enter when ready');
    if(!enter)throw new Error('untimed Redline completion control missing');
    enter.click();
    return {before,after:Number(document.getElementById('xp').textContent),prompt,result:document.getElementById('game-result').textContent};
  });
  assert.equal(untimedRedline.after-untimedRedline.before,12);
  assert.match(untimedRedline.prompt,/No reaction timer/);
  assert.match(untimedRedline.result,/own pace/);

  const saveRoundTrip=await evaluate(()=>{
    const xpSaved=Number(document.getElementById('xp').textContent);
    document.getElementById('role-select').value='Builder';
    document.getElementById('motto').value='Keep the street useful';
    document.getElementById('save-identity').click();
    document.getElementById('save-local').click();
    const savedStatus=document.getElementById('save-status').textContent;
    document.querySelector('[data-life="walk"]').click();
    const changed=Number(document.getElementById('xp').textContent);
    document.getElementById('load-local').click();
    return {xpSaved,changed,restored:Number(document.getElementById('xp').textContent),role:document.getElementById('role').textContent,motto:document.getElementById('motto').value,savedStatus,loadedStatus:document.getElementById('save-status').textContent};
  });
  assert.ok(saveRoundTrip.changed>saveRoundTrip.xpSaved,'run did not change after local save');
  assert.equal(saveRoundTrip.restored,saveRoundTrip.xpSaved,'explicit load did not restore XP');
  assert.equal(saveRoundTrip.role,'Builder');
  assert.equal(saveRoundTrip.motto,'Keep the street useful');
  assert.match(saveRoundTrip.savedStatus,/Saved locally/);
  assert.match(saveRoundTrip.loadedStatus,/Loaded local save/);

  url=`${origin}/play/mmo/?test=2`;
  await call('Page.navigate',{url});
  await waitReady(url);
  const noAutoLoad=await evaluate(()=>({xp:Number(document.getElementById('xp').textContent),role:document.getElementById('role').textContent,status:document.getElementById('save-status').textContent}));
  assert.equal(noAutoLoad.xp,0,'saved state loaded automatically without consent');
  assert.equal(noAutoLoad.role,'Explorer');
  assert.match(noAutoLoad.status,/Nothing loads automatically/);

  const explicitAfterReload=await evaluate(()=>{
    document.getElementById('load-local').click();
    return {xp:Number(document.getElementById('xp').textContent),role:document.getElementById('role').textContent,motto:document.getElementById('motto').value,status:document.getElementById('save-status').textContent};
  });
  assert.equal(explicitAfterReload.xp,saveRoundTrip.xpSaved);
  assert.equal(explicitAfterReload.role,'Builder');
  assert.equal(explicitAfterReload.motto,'Keep the street useful');
  assert.match(explicitAfterReload.status,/Loaded local save/);

  console.log('PASS MMO Chrome: Grounded Starter Pack Forge-to-MMO path, grounded world, 320px layout, labeled astronomy, local plug-in discovery/play, bounded reward, text safety, untimed Redline route, explicit portable save/load and no auto-load');
} catch(error) {
  console.error(`FAIL MMO Chrome: ${error.message}`); process.exitCode=1;
} finally {
  socket?.close(); chrome?.kill('SIGTERM');
  for(const request of pending.values())clearTimeout(request.timer);
  server.closeAllConnections(); await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
