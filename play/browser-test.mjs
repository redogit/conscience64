// Dependency-free integration checks. Requires Node.js 22+ and Google Chrome.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const profile = await mkdtemp(resolve(tmpdir(), 'conscience64-play-test-'));
let chrome, socket, sequence = 0;
const pending = new Map();
const server = createServer(async (req, res) => {
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) throw new Error();
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html;charset=utf-8', '.mjs': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.json': 'application/json' })[extname(path)] || 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start within 20 seconds')), 20000);
    chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    chrome.once('error', error => { clearTimeout(timer); reject(error); });
    chrome.once('exit', code => { clearTimeout(timer); reject(new Error(`Chrome exited during startup: ${code}`)); });
    chrome.stderr.on('data', chunk => {
      output = (output + chunk).slice(-12000);
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id); if (!request) return;
      pending.delete(message.id); clearTimeout(request.timer);
      if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
    } else if (message.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true }, message.sessionId).catch(() => {});
    }
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params = {}) => send(method, params, sessionId);
  await call('Page.enable'); await call('Runtime.enable');
  const evaluate = async (fn, ...args) => {
    const result = await call('Runtime.evaluate', { expression: `(${fn.toString()})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  let navigation = 0;
  async function visit(app) {
    const url = `${origin}/play/${app === 'home' ? '' : app + '/'}?test=${++navigation}&lang=en`;
    await call('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      if (await evaluate(url => location.href === url && document.body?.dataset.ready === 'true', url)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`App did not initialize: ${app}`);
  }
  async function checkLayouts(app) {
    for (const locale of ['en', 'es', 'fr', 'ar']) {
      await evaluate(locale => { const el = document.getElementById('language'); el.value = locale; el.dispatchEvent(new Event('change')); }, locale);
      for (const width of [1100, 320]) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
        const report = await evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, width: innerWidth, scroll: document.documentElement.scrollWidth, missing: [...document.querySelectorAll('button')].filter(b => !b.getAttribute('aria-label') && !b.textContent.trim()).length, focusRule: [...document.styleSheets].some(s => [...s.cssRules].some(r => r.selectorText?.includes(':focus-visible'))) }));
        assert.equal(report.lang, locale); assert.equal(report.dir, locale === 'ar' ? 'rtl' : 'ltr');
        assert.equal(report.missing, 0, `${app}/${locale}: unnamed button`);
        assert.ok(report.focusRule, 'visible focus styles missing');
        assert.ok(report.scroll <= report.width + 1, `${app}/${locale}: horizontal overflow ${JSON.stringify(report)}`);
      }
    }
    await call('Emulation.setDeviceMetricsOverride', { width: 1100, height: 800, deviceScaleFactor: 1, mobile: false });
  }

  await visit('home'); await checkLayouts('home');
  await visit('orbit');
  await evaluate(() => {
    const $ = id => document.getElementById(id);
    $('note-title').value = 'عنوان <img src=x onerror=alert(1)> 👩🏽‍💻';
    $('note-text').value = 'नमस्ते / שלום / 你好'; $('note-source').value = 'https://example.org/source'; $('writing-language').value = 'ar';
    $('note-form').requestSubmit();
    if (document.querySelectorAll('.note-card').length !== 1 || $('notes').querySelector('img')) throw new Error('Note insertion or text escaping failed');
    if ($('notes').querySelector('h3').getAttribute('lang') !== 'ar') throw new Error('Writing language lost');
    $('search').value = '你好'; $('search').dispatchEvent(new Event('input'));
    if (document.querySelectorAll('.note-card').length !== 1) throw new Error('Unicode search failed');
    $('notes').querySelector('button').click(); $('undo-note').click();
    if (document.querySelectorAll('.note-card').length !== 1) throw new Error('Remove/undo failed');
    $('save').click();
  });
  await checkLayouts('orbit');
  await visit('orbit');
  await evaluate(() => {
    if (document.querySelector('.note-card')) throw new Error('Saved notes loaded without consent');
    document.getElementById('load').click();
    if (!document.querySelector('.note-card h3').textContent.includes('عنوان')) throw new Error('Save/load lost text');
  });

  await visit('weave');
  await evaluate(() => {
    const $ = id => document.getElementById(id), original = 'one\n\nمرحبا 👩🏽‍💻';
    $('original').value = original; $('original').dispatchEvent(new Event('input'));
    $('writing-language').value = 'ar'; $('writing-language').dispatchEvent(new Event('change'));
    document.querySelector('[data-position="0"][data-direction="down"]').click();
    if ($('remix').textContent !== '\none\nمرحبا 👩🏽‍💻' || $('original').value !== original) throw new Error('Line reordering changed original or lost blank lines');
    $('restore').click(); if ($('remix').textContent !== original) throw new Error('Original order restore failed');
    $('shuffle').click(); if ($('original').value !== original) throw new Error('Shuffle altered original');
    $('save').click();
  });
  await checkLayouts('weave');
  await evaluate(async () => {
    const $ = id => document.getElementById(id), original = $('original').value;
    const data = new DataTransfer(); data.items.add(new File(['{"schema":"conscience64.play/v1","app":"garden","data":{}}'], 'wrong.json', { type: 'application/json' }));
    $('import').files = data.files; $('import').dispatchEvent(new Event('change'));
    for (let i = 0; i < 30 && !$('status').classList.contains('error'); i++) await new Promise(r => setTimeout(r, 50));
    if (!$('status').classList.contains('error') || $('original').value !== original) throw new Error('Invalid import replaced work');
    const valid = new DataTransfer(); valid.items.add(new File([JSON.stringify({ schema: 'conscience64.play/v1', app: 'weave', data: { original: '你好\nمرحبا', language: '', order: [1, 0] } })], 'valid.json', { type: 'application/json' }));
    $('import').files = valid.files; $('import').dispatchEvent(new Event('change'));
    for (let i = 0; i < 30 && $('original').value !== '你好\nمرحبا'; i++) await new Promise(r => setTimeout(r, 50));
    if ($('remix').textContent !== 'مرحبا\n你好') throw new Error('Valid import lost writing or order');
  });

  await visit('garden');
  await evaluate(() => {
    const $ = id => document.getElementById(id), cells = [...$('grid').children];
    cells[0].focus(); cells[0].click();
    cells[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    if (document.activeElement !== cells[1]) throw new Error('Arrow-key movement failed');
    if (cells.filter(c => c.tabIndex === 0).length !== 1) throw new Error('Grid should be one tab stop');
    const before = cells.map(c => c.dataset.value).join();
    for (let i = 0; i < 4; i++) $('rotate').click();
    if (cells.map(c => c.dataset.value).join() !== before) throw new Error('Four rotations did not restore pattern');
    $('clear').click(); $('undo-pattern').click();
    if (cells.map(c => c.dataset.value).join() !== before) throw new Error('Pattern undo failed');
    $('grow').click(); $('mirror').click();
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) if (cells[row * 6 + col].dataset.value !== cells[row * 6 + 5 - col].dataset.value) throw new Error('Mirror failed');
    $('pattern-title').value = '花 <script> & نجمة'; $('pattern-title').dispatchEvent(new Event('input'));
    $('save').click();
  });
  await checkLayouts('garden');
  await evaluate(async () => {
    let exported;
    const originalCreate = URL.createObjectURL, originalClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = blob => { exported = blob; return originalCreate(blob); };
    HTMLAnchorElement.prototype.click = function () { if (!this.download) originalClick.call(this); };
    document.getElementById('download-svg').click();
    const xml = new DOMParser().parseFromString(await exported.text(), 'image/svg+xml');
    URL.createObjectURL = originalCreate; HTMLAnchorElement.prototype.click = originalClick;
    if (xml.querySelector('parsererror,script') || !xml.querySelector('title').textContent.includes('نجمة')) throw new Error('Invalid or unsafe SVG export');
    if (getComputedStyle(document.getElementById('grid')).direction !== 'ltr') throw new Error('Grid coordinate direction changed in RTL layout');
  });
  console.log('PASS Chrome: all three applications, four interface languages, 320px/1100px layouts, Unicode writing, keyboard grid, undo, storage, imports, and safe SVG export.');
} catch (error) {
  console.error(`FAIL Chrome: ${error.message}`); process.exitCode = 1;
} finally {
  socket?.close(); chrome?.kill('SIGTERM');
  for (const request of pending.values()) clearTimeout(request.timer);
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  // Chrome may briefly hold its temporary profile after SIGTERM.
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
