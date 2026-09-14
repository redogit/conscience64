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

  const url=`${origin}/play/mmo/?test=1`;
  await call('Page.navigate',{url});
  for(let i=0;i<100;i++){
    if(await evaluate(url=>location.href===url && !!globalThis.Conscience64MMOPlugins && !!document.getElementById('plugin-games'),url))break;
    if(i===99)throw new Error('MMO did not initialize');
    await new Promise(r=>setTimeout(r,100));
  }

  for(const width of [1100,320]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    const layout=await evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,street:!!document.querySelector('.street-scene'),observatory:!!document.querySelector('.sky-window'),label:document.querySelector('.sky-label')?.textContent||''}));
    assert.ok(layout.street && layout.observatory,'grounded world surfaces missing');
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
    return {
      prompt,
      after:Number(document.getElementById('xp').textContent),
      before,
      result:document.getElementById('game-result').textContent,
      status:document.getElementById('plugin-status').textContent,
      images:document.querySelectorAll('#playfield img').length
    };
  });
  assert.match(pluginResult.prompt,/cardboard display/);
  assert.equal(pluginResult.images,0);
  assert.equal(pluginResult.after-pluginResult.before,16);
  assert.match(pluginResult.result,/Completed|success/i);
  assert.match(pluginResult.status,/validated local plug-in/i);

  console.log('PASS MMO Chrome: grounded world, 320px layout, labeled astronomy, local plug-in discovery/play, bounded reward and text safety');
} catch(error) {
  console.error(`FAIL MMO Chrome: ${error.message}`); process.exitCode=1;
} finally {
  socket?.close(); chrome?.kill('SIGTERM');
  for(const request of pending.values())clearTimeout(request.timer);
  server.closeAllConnections(); await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
