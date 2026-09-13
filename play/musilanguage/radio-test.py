"""Browser checks. Default: real repository API/data. --fixture: inline local player only; API check deferred to real CI.
Run from a repository checkout: python play/musilanguage/radio-test.py
Optional --render-dir exports all tracks as stereo WAV, MIDI and score JSON.
"""
import argparse, asyncio, base64, functools, hashlib, http.server, json, os, shutil, threading
from pathlib import Path
from playwright.async_api import async_playwright

async def run(args):
    root = Path(__file__).resolve().parents[2]
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *unused): pass
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    url = f'http://127.0.0.1:{server.server_port}'
    errors=[]; checks=[]; audio=[]
    output=Path(args.render_dir).resolve() if args.render_dir else None
    if output: output.mkdir(parents=True, exist_ok=True)
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('google-chrome'), headless=True, args=['--no-sandbox'])
            page=await browser.new_page(viewport={'width':1280,'height':1000},accept_downloads=True)
            page.on('pageerror',lambda e: errors.append(str(e)))
            if args.fixture:
                html=(root/'play/musilanguage/radio.html').read_text()
                for name in ['engine.js','radio.js']:
                    html=html.replace('<script src="'+name+'"></script>','<script>'+(root/'play/musilanguage'/name).read_text()+'</script>')
                await page.set_content(html)
            else:
                await page.goto(url+'/play/musilanguage/radio.html')
            await page.wait_for_function('window.MusilanguageRadio && window.MusilanguageEngine')
            info=await page.evaluate('''()=>{const e=MusilanguageEngine;return e.catalog.map(c=>{const s=e.compose(c.id);return {id:s.id,title:s.title,seconds:s.duration,notes:s.events.length,sections:s.sections.length,valid:s.events.every(n=>[n.b,n.n,n.d,n.v,n.pan].every(Number.isFinite)&&n.b>=0&&n.d>0&&n.n>=0&&n.n<128&&n.v>=0&&n.v<=1&&n.b+n.d<=s.end+.001)};});}''')
            assert len(info)==4 and all(s['valid'] and s['sections']==7 for s in info)
            checks.append('four full seven-movement scores; finite, in-bounds MIDI notes')
            variants=await page.evaluate('''()=>{const e=MusilanguageEngine;return e.catalog.slice(1).map(c=>{const a=e.compose(c.id,640),b=e.compose(c.id,640),z=e.compose(c.id,641);return JSON.stringify(a.events)===JSON.stringify(b.events)&&JSON.stringify(a.events)!==JSON.stringify(z.events);});}''')
            assert all(variants);checks.append('fixed seeds repeat exactly; changed seeds change each new score')
            await page.get_by_role('button',name='Play radio',exact=True).click()
            await page.wait_for_function('MusilanguageRadio.state.playing && MusilanguageRadio.state.next')
            checks.append('user-gesture start and queued next buffer')
            await page.get_by_role('button',name='Pause',exact=True).click()
            await page.wait_for_function('!MusilanguageRadio.state.playing')
            t=await page.evaluate('MusilanguageRadio.state.position');await page.wait_for_timeout(300)
            assert abs(await page.evaluate('MusilanguageRadio.state.position')-t)<.01
            await page.get_by_role('button',name='Resume radio',exact=True).click()
            await page.wait_for_function('MusilanguageRadio.state.playing')
            checks.append('pause freezes audio clock; resume continues')
            await page.evaluate('MusilanguageRadio.seek(119)')
            await page.wait_for_function('MusilanguageRadio.state.transitions>=1',timeout=15000)
            assert await page.evaluate("MusilanguageRadio.state.current==='cathedral-of-sparks'")
            checks.append('actual scheduled source end advances to the next track')
            await page.get_by_role('button',name='Stop',exact=True).click()
            await page.wait_for_timeout(1200)
            stopped=await page.evaluate('MusilanguageRadio.state')
            assert not stopped['playing'] and stopped['position']==0 and stopped['liveSources']==0
            checks.append('stop clears live/queued sources without restarting')
            await page.select_option('#mode','single')
            await page.evaluate('MusilanguageRadio.choose(2,false)')
            await page.evaluate('MusilanguageRadio.seek(151.7)')
            await page.get_by_role('button',name='Play radio',exact=True).click()
            await page.wait_for_function('MusilanguageRadio.state.playing')
            await page.wait_for_function('!MusilanguageRadio.state.playing',timeout=10000)
            assert await page.evaluate('MusilanguageRadio.state.next===null')
            checks.append('one-track mode ends without advancing')
            if args.fixture:
                receipt={'status':'NOT_TESTED','reason':'Local browser navigation is blocked; source-bound API check runs in GitHub CI.'}
            else:
                await page.get_by_role('button',name='Connect & use inspiration',exact=True).click()
                await page.wait_for_function('MusilanguageRadio.state.connected',timeout=25000)
                receipt=await page.evaluate('MusilanguageRadio.state.receipt')
                assert receipt['sources'] and 1<=len(receipt['sources'])<=8
                assert receipt['totalPublicObjects']>0 and (args.fixture or receipt['spaceUoid']!='FIXTURE')
                assert await page.input_value('#mode')=='mutate'
                assert await page.evaluate("MusilanguageRadio.acceptMessage({origin:'https://evil.invalid',source:window,data:{type:'conscience64.api.result',id:'forged',ok:true,result:{}}})===false")
                assert await page.evaluate("MusilanguageRadio.acceptMessage({origin:location.origin,source:window,data:{type:'conscience64.api.result',id:'forged',ok:true,result:{}}})===false")
                checks.append(('contract fixture' if args.fixture else 'REAL Conscience64 repository API')+': stats, search, seed mapping, origin/source rejection')
                assert await page.evaluate('MusilanguageRadio.state.pendingRequests===0')
            await page.select_option('#mode','single')
            for i in (1,2,3):
                await page.evaluate('(i)=>MusilanguageRadio.choose(i,false)',i)
                async with page.expect_download() as waiting:
                    await page.get_by_role('button',name='Export MIDI',exact=True).click()
                dl=await waiting.value
                path=(output or Path('/tmp'))/(info[i]['id']+'.mid');await dl.save_as(path)
                assert path.read_bytes()[:4]==b'MThd'
            checks.append('three new MIDI exports contain valid headers')
            if output:
                for i,meta in enumerate(info):
                    print('RENDER '+meta['title'],flush=True)
                    result=await page.evaluate('''async id=>{const e=MusilanguageEngine,s=e.compose(id),r=e.renderer(s),buf=await r.render(e.levels(),44100);let peak=0,sum=0,bad=0,clipped=0;for(let c=0;c<buf.numberOfChannels;c++){const a=buf.getChannelData(c);for(const x of a){peak=Math.max(peak,Math.abs(x));sum+=x*x;if(!Number.isFinite(x))bad++;if(Math.abs(x)>=1)clipped++;}}window.radioWav=new Uint8Array(r.wav(buf));window.radioScore=s;return {id,duration:buf.duration,frames:buf.length,channels:buf.numberOfChannels,sampleRate:buf.sampleRate,peak,rms:Math.sqrt(sum/(buf.length*buf.numberOfChannels)),nonfinite:bad,clipped};}''',meta['id'])
                    assert result['nonfinite']==0 and result['clipped']==0 and result['rms']>.005
                    # Slice the binary transfer to avoid huge single browser responses.
                    length=await page.evaluate('radioWav.length')
                    with (output/(meta['id']+'.wav')).open('wb') as f:
                        for start in range(0,length,1024*1024):
                            enc=await page.evaluate('''start=>{const bytes=radioWav.subarray(start,start+1048576);let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out);}''',start)
                            f.write(base64.b64decode(enc))
                    (output/(meta['id']+'.score.json')).write_text(await page.evaluate('JSON.stringify(radioScore)'),encoding='utf-8')
                    audio.append(result)
                await page.screenshot(path=str(output/'radio-desktop.png'),full_page=True)
            await page.set_viewport_size({'width':390,'height':844})
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            await page.focus('#play');assert await page.evaluate("document.activeElement.id==='play'")
            if output: await page.screenshot(path=str(output/'radio-mobile.png'),full_page=True)
            checks.append('keyboard focus; 390px mobile width without overflow')
            assert await page.evaluate('MusilanguageRadio.state.cacheEntries<=2 && MusilanguageRadio.state.pendingRequests===0')
            checks.append('two-track cache bound and no outstanding bridge requests')
            assert not errors,errors
            result={'status':'PASS','api_basis':'NOT_TESTED_INLINE_LOCAL' if args.fixture else 'ACTUAL_REPOSITORY_API_AND_PUBLIC_DATA','browser':'Chromium','checks':checks,'tracks':info,'audio':audio,'companion_receipt':receipt,'browser_errors':errors,'scope':'Programmatic browser/signal checks; not an independent listening or cross-browser review.'}
            dest=(output or root/'play/musilanguage')/'radio-validation.json'
            dest.write_text(json.dumps(result,indent=2),encoding='utf-8')
            print(json.dumps(result,indent=2),flush=True)
            await browser.close()
    finally: server.shutdown();server.server_close()

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--fixture',action='store_true');ap.add_argument('--render-dir');args=ap.parse_args();asyncio.run(run(args))
