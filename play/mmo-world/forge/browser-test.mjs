import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const profile = await mkdtemp(resolve(tmpdir(), 'arcade-forge-test-'));
let chrome, socket, sequence = 0;
const pending = new Map(), errors = [];
const server = createServer(async (req, res) => {
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) throw new Error();
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': ({ '.html':'text/html;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json' })[extname(path)] || 'text/plain;charset=utf-8', 'Cache-Control':'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
function send(method, params = {}, sessionId) {
  return new Promise((resolvePromise, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 12000);
    pending.set(id, { resolve: resolvePromise, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
try {
  await new Promise(resolvePromise => server.listen(0, '127.0.0.1', resolvePromise));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chrome startup timeout')), 20000);
    chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], { stdio:['ignore','ignore','pipe'] });
    chrome.stderr.on('data', chunk => {
      output = (output + chunk).slice(-12000);
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolveEndpoint(match[1]); }
    });
    chrome.once('error', reject);
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolvePromise, reject) => { socket.addEventListener('open', resolvePromise, { once:true }); socket.addEventListener('error', reject, { once:true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id); if (!request) return;
      pending.delete(message.id); clearTimeout(request.timer);
      message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || 'runtime exception');
    }
  });
  const { targetId } = await send('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten:true });
  const call = (method, params = {}) => send(method, params, sessionId);
  await call('Page.enable'); await call('Runtime.enable');
  const evaluate = async (fn, ...args) => {
    const result = await call('Runtime.evaluate', { expression:`(${fn.toString()})(...${JSON.stringify(args)})`, awaitPromise:true, returnByValue:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  async function visit() {
    const url = `${origin}/play/mmo-world/forge/?smoke=${Date.now()}`;
    await call('Page.navigate', { url });
    for (let i = 0; i < 80; i++) {
      const ready = await evaluate(() => document.readyState === 'complete' && !!document.getElementById('build') && document.getElementById('installed')?.children.length > 0);
      if (ready) return;
      await new Promise(resolvePromise => setTimeout(resolvePromise, 100));
    }
    throw new Error('Arcade Forge did not initialize');
  }

  await visit();
  await evaluate(() => {
    const prompt = document.getElementById('prompt');
    prompt.value = '<img src=x onerror=globalThis.pwned=true> Make a safe plan.';
    prompt.dispatchEvent(new Event('input', { bubbles:true }));
    document.getElementById('build').click();
  });
  const safePreview = await evaluate(() => ({
    title: document.getElementById('preview-title').textContent,
    prompt: document.getElementById('preview-prompt').textContent,
    imageCount: document.getElementById('preview-prompt').querySelectorAll('img').length,
    pwned: globalThis.pwned === true,
    reward: document.getElementById('preview-reward').textContent,
  }));
  assert.equal(safePreview.title, 'Storm Drain Duck Rescue');
  assert.match(safePreview.prompt, /<img src=x/);
  assert.equal(safePreview.imageCount, 0);
  assert.equal(safePreview.pwned, false);
  assert.match(safePreview.reward, /does not change canonical MMO World state/);

  await evaluate(() => document.getElementById('install').click());
  assert.equal(await evaluate(() => document.querySelectorAll('#installed li strong').length), 1);
  await visit();
  assert.equal(await evaluate(() => document.querySelectorAll('#installed li strong').length), 1, 'local shelf did not survive reload');

  await evaluate(async () => {
    const bad = {
      schema:'conscience64.mmo.plugin/v1', id:'bad-authority', name:'Bad Authority', version:'1.0.0', mechanic:'creative',
      prompt:'Attempt authority injection', reward:{xp:0,joy:0,tokens:0,discoveries:0}, url:'https://example.com'
    };
    const transfer = new DataTransfer();
    transfer.items.add(new File([JSON.stringify(bad)], 'bad.json', { type:'application/json' }));
    const input = document.getElementById('import');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    for (let i = 0; i < 40 && !document.getElementById('status').classList.contains('error'); i++) await new Promise(resolvePromise => setTimeout(resolvePromise, 50));
  });
  const rejected = await evaluate(() => ({ status:document.getElementById('status').textContent, shelf:document.querySelectorAll('#installed li strong').length }));
  assert.match(rejected.status, /unsupported field: url/);
  assert.equal(rejected.shelf, 1, 'rejected import changed the shelf');

  await call('Emulation.setDeviceMetricsOverride', { width:320, height:800, deviceScaleFactor:1, mobile:false });
  const layout = await evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    unnamedButtons: [...document.querySelectorAll('button')].filter(button => !(button.textContent.trim() || button.getAttribute('aria-label'))).length,
    unlabeledFields: [...document.querySelectorAll('input:not([type=file]),select,textarea')].filter(field => !field.getAttribute('aria-label') && !document.querySelector(`label[for="${CSS.escape(field.id)}"]`)).length,
  }));
  assert.ok(layout.scroll <= layout.width + 1, `320px horizontal overflow: ${JSON.stringify(layout)}`);
  assert.equal(layout.unnamedButtons, 0);
  assert.equal(layout.unlabeledFields, 0);
  assert.deepEqual(errors, [], 'browser runtime exceptions');
  console.log('PASS Arcade Forge Chrome: safe text, local persistence, authority-field rejection, named controls, 320px layout.');
} catch (error) {
  console.error(`FAIL Arcade Forge Chrome: ${error.message}`);
  process.exitCode = 1;
} finally {
  socket?.close(); chrome?.kill('SIGTERM');
  for (const request of pending.values()) clearTimeout(request.timer);
  server.closeAllConnections(); await new Promise(resolvePromise => server.close(resolvePromise));
  await rm(profile, { recursive:true, force:true, maxRetries:10, retryDelay:100 });
}
