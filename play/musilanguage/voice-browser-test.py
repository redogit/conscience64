"""Local Chromium integration checks; synthetic metadata only, no downloads required."""
import asyncio, functools, http.server, json, shutil, threading
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    root=Path(__file__).resolve().parent
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    descriptor=dict(format='musilanguage-private-voice/v1',label='Private test singer',reference=dict(kind='private-library',libraryFileId='libfile_TESTSECRET',backingFileId='file_TESTSECRET'),consent=dict(subject='self',scope='private-generated-vocals',externalUpload=False,recordedAt='2026-10-21',provenance='SYNTHETICPRIVATECONSENT'))
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
            page=await browser.new_page();errors=[];requests=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:requests.append(r.url))
            await page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            await page.wait_for_function('() => !!window.WordForge')
            original=await page.evaluate('WordForge.session()');score=await page.evaluate('WordForge.score')
            count=len(requests)
            await page.set_input_files('#voice-profile',dict(name='private.json',mimeType='application/json',buffer=json.dumps(descriptor).encode()))
            assert await page.input_value('#voice-reference')=='default'
            assert 'Instrumental.' in await page.inner_text('#voice-status')
            await page.check('#vocals');assert 'Pending singing renderer' in await page.inner_text('#voice-status')
            assert await page.evaluate('WordForge.score')==score
            assert await page.evaluate('WordForge.session()')==original
            async with page.expect_download() as d:await page.click('#export')
            data=Path(await (await d.value).path()).read_text()
            for secret in ['TESTSECRET','SYNTHETICPRIVATECONSENT','Private test singer']:assert secret not in data
            await page.select_option('#voice-reference','none');assert 'needs a selected' in await page.inner_text('#voice-status')
            await page.select_option('#voice-reference','default')
            await page.evaluate('(s)=>WordForge.importSession({...s,voice:{enabled:true,reference:"untrusted"}})',original)
            assert not await page.is_checked('#vocals')
            assert await page.evaluate('WordForge.session()')==original
            await page.check('#vocals')
            await page.click('#play');await page.wait_for_function('() => WordForge.state.playing && !WordForge.state.busy',timeout=60000)
            assert 'no sung vocals' in await page.inner_text('#status')
            await page.click('#stop')
            async with page.expect_download() as d:await page.click('#midi')
            assert Path(await (await d.value).path()).read_bytes().startswith(b'MThd')
            async with page.expect_download(timeout=60000) as d:await page.click('#wav')
            wav=Path(await (await d.value).path()).read_bytes();assert wav.startswith(b'RIFF')
            assert b'TESTSECRET' not in wav
            assert 'no sung vocals' in await page.inner_text('#status')
            assert len(requests)==count
            assert await page.evaluate('localStorage.length + sessionStorage.length')==0
            await page.click('#voice-clear');assert await page.input_value('#voice-reference')=='none'
            assert not await page.is_checked('#vocals')
            await page.reload();await page.wait_for_function('() => !!window.WordForge')
            assert await page.input_value('#voice-reference')=='none'
            assert not errors,errors
            await browser.close()
            print('PASS: current Studio UI, private import/default/opt-out, unchanged score/session, sanitized exports, import resets vocals, instrumental playback/MIDI/WAV, no reference network/storage, forget/reload, no browser errors')
    finally:server.shutdown()

asyncio.run(main())
