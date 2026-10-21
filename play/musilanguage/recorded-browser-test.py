"""Exercise real local file decoding, selection, recorded mixing/export and privacy.
Synthetic tone fixture only; no assertion about human vocal quality.
"""
import asyncio, functools, http.server, io, json, math, shutil, struct, threading, wave
from pathlib import Path
from playwright.async_api import async_playwright

def fixture():
    out=io.BytesIO()
    with wave.open(out,'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000)
        w.writeframes(b''.join(struct.pack('<h',int(4000*math.sin(2*math.pi*220*i/48000))) for i in range(4*48000)))
    return out.getvalue()

async def main():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(Path(__file__).resolve().parent)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
            page=await browser.new_page();errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
            await page.goto(f'http://127.0.0.1:{server.server_port}/index.html');await page.wait_for_function('()=>!!window.WordForge')
            initial=await page.evaluate('WordForge.session()');count=len(requests)
            await page.set_input_files('#recorded-file',dict(name='PRIVATE_SYNTHETIC.wav',mimeType='audio/wav',buffer=fixture()))
            await page.wait_for_function("()=>document.getElementById('recorded-status').textContent.includes('decoded locally')")
            assert await page.input_value('#recorded-end')=='0'
            await page.click('#recorded-export');assert 'segment first' in await page.inner_text('#recorded-status')
            await page.fill('#recorded-start','1');await page.fill('#recorded-end','2');await page.click('#recorded-select')
            await page.click('#recorded-enable');assert not await page.is_checked('#recorded-enable')
            await page.click('#recorded-preview');assert 'Auditioning' in await page.inner_text('#recorded-status');await page.click('#recorded-stop')
            await page.check('#recorded-confirm');await page.check('#recorded-enable')
            assert await page.evaluate('WordForge.session()')==initial
            async with page.expect_download() as d:await page.click('#recorded-export')
            raw=Path(await (await d.value).path()).read_bytes()
            with wave.open(io.BytesIO(raw)) as w:assert abs(w.getnframes()/w.getframerate()-1)<.001
            await page.click('#play');await page.wait_for_function('()=>WordForge.state.playing && !WordForge.state.busy',timeout=60000)
            assert 'recorded-performance mix' in await page.inner_text('#status');await page.click('#stop')
            async with page.expect_download(timeout=60000) as d:await page.click('#wav')
            assert Path(await (await d.value).path()).read_bytes().startswith(b'RIFF')
            assert 'not synthesized singing' in await page.inner_text('#status')
            await page.fill('#recorded-start','1.1')
            assert not await page.is_checked('#recorded-enable');assert not await page.is_checked('#recorded-confirm')
            await page.click('#recorded-export');assert 'segment first' in await page.inner_text('#recorded-status')
            await page.click('#recorded-select');await page.check('#recorded-confirm');await page.check('#recorded-enable')
            await page.evaluate('(s)=>WordForge.importSession(s)',initial);assert not await page.is_checked('#recorded-enable')
            await page.click('#recorded-forget');assert 'No recording' in await page.inner_text('#recorded-status')
            assert len(requests)==count
            assert await page.evaluate('localStorage.length+sessionStorage.length')==0
            assert not errors,errors
            await browser.close()
            print('PASS: real WAV decode/segment/audition/mix/export, consent gates, invalidation on edits/import/forget, unchanged session, no upload/storage, no browser errors')
    finally:server.shutdown()
asyncio.run(main())
