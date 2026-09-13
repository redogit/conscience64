"""Browser checks for Word Forge; --live also exercises repository Conscience64 API.
Run with Python + Playwright and an installed Chromium. No package downloads here.
"""
import argparse, asyncio, base64, functools, http.server, json, os, shutil, threading
from pathlib import Path
from playwright.async_api import async_playwright

async def run(args):
    here=Path(__file__).resolve().parent
    root=here.parents[1] if here.name=='musilanguage' else here
    urlpath='/play/musilanguage/word-forge.html' if here.name=='musilanguage' else '/word-forge.html'
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*unused): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}'
    out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    checks=[];errors=[];requests=[];audio=[]
    html=(here/'word-forge.html').read_text()
    for f in ['engine.js','utf8-space.js','music64.js','listener-floats.js','word-forge.js']:
        html=html.replace('<script src="'+f+'"></script>','<script>'+(here/f).read_text()+'</script>')
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
            context=await browser.new_context(viewport={'width':1280,'height':1050},accept_downloads=True)
            page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:requests.append((r.method,r.url)))
            if args.fixture: await page.set_content(html)
            else: await page.goto(base+urlpath)
            await page.wait_for_function('window.WordForge && window.ListenerFloatMusic');print('LOADED',flush=True)
            idle_requests=len(requests)
            assert not await page.evaluate('WordForge.state.playing')
            other=await browser.new_context();page_b=await other.new_page()
            if args.fixture: await page_b.set_content(html)
            else: await page_b.goto(base+urlpath)
            await page_b.wait_for_function('window.WordForge')
            original_b=await page_b.evaluate('WordForge.recipe')
            await page.click('#forge');await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            await page.click('#play');t=await page.evaluate('WordForge.state.position')
            await page.wait_for_timeout(160);assert abs(await page.evaluate('WordForge.state.position')-t)<.01
            await page.click('#play');await page.wait_for_function('WordForge.state.playing')
            await page.click('#stop');assert not await page.evaluate('WordForge.state.playing')
            checks.append('Playback, paused clock, resume and stop')
            anchor=await page.evaluate('WordForge.recipe');await page.fill('#seed','7')
            await page.click('#journey');await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            changed=await page.evaluate('WordForge.recipe');assert changed['cells']!=anchor['cells']
            assert len((await page.evaluate('WordForge.score'))['sections'])==3
            assert await page_b.evaluate('WordForge.recipe')==original_b
            assert not await page_b.evaluate('WordForge.state.playing')
            await page.click('#stop');await page.click('#repair')
            await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            assert (await page.evaluate('WordForge.recipe'))['cells']==anchor['cells']
            await page.click('#stop');await page.click('#slip')
            await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            trial=await page.evaluate('WordForge.recipe');await page.click('#keep')
            assert not (await page.evaluate('WordForge.recipe')).get('listener')
            assert (await page.evaluate('WordForge.recipe'))['cells']==trial['cells']
            await page.click('#undo');await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            assert (await page.evaluate('WordForge.recipe'))==trial
            await page.click('#stop')
            checks.append('Per-listener browser isolation; local float edits, exact repair, keep and undo')
            async with page.expect_download() as wait:await page.click('#export')
            dl=await wait.value;recipe_path=out/'roundtrip.json';await dl.save_as(recipe_path)
            session=json.loads(recipe_path.read_text());await page.set_input_files('#import',str(recipe_path))
            await page.wait_for_function("document.getElementById('status').textContent.startsWith('Local recipe restored')")
            assert await page.evaluate('WordForge.recipe')==session['recipe']
            tampered=json.loads(recipe_path.read_text());tampered['recipe']['listener']['changes'][0]['xorMask']='fffffff'
            bad=out/'tampered.json';bad.write_text(json.dumps(tampered));await page.set_input_files('#import',str(bad))
            await page.wait_for_function("document.getElementById('status').textContent.startsWith('Import:')")
            assert await page.evaluate('WordForge.recipe')==session['recipe']
            async with page.expect_download() as wait:await page.click('#midi')
            dl=await wait.value;await dl.save_as(out/'take.mid');assert (out/'take.mid').read_bytes()[:4]==b'MThd'
            checks.append('Session and MIDI exports; listener receipt tampering rejected without mutation')
            await page.get_by_text('Exact UTF-8 expedition',exact=True).click()
            rank=await page.evaluate("UTF8MusicSpace.rank(new Uint8Array([65,13,10,66])).toString()")
            await page.select_option('#length','4');await page.fill('#rank',rank);await page.click('#use-rank');await page.click('#forge')
            await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            assert (await page.evaluate('WordForge.recipe'))['source']['utf8Hex']=='410d0a42'
            await page.click('#stop');await page.select_option('#length','1024');await page.fill('#rank','0');await page.click('#use-rank')
            assert len(await page.input_value('#words'))==1024
            await page.select_option('#length','8');await page.click('#sample')
            assert 'One sample of 8 bytes' in await page.text_content('#sample-info')
            await page.evaluate("document.getElementById('words').value='Canceled music';document.getElementById('words').dispatchEvent(new Event('input'));document.getElementById('forge').click();WordForge.stop()")
            await page.wait_for_function('!WordForge.state.busy');assert not await page.evaluate('WordForge.state.playing')
            checks.append('Exact UTF-8 samples including CRLF; 1024-byte bound; stop cancels outstanding render')
            assert await page.evaluate("WordForge.accept({origin:'https://evil.invalid',source:window,data:{type:'conscience64.api.result',id:'word-forge-1',ok:true,result:{}}})") is False
            if not args.fixture:
                assert await page.evaluate('localStorage.length')==0
                assert await page.evaluate('sessionStorage.length')==0
            assert all(u.endswith('/favicon.ico') for _,u in requests[idle_requests:])
            checks.append('No listener network activity; forged API message rejected; storage empty where accessible')
            await page.fill('#words','Velvet anvils dance beneath a clockwork moon.');await page.click('#forge')
            await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
            await page.check('#endless');await page.evaluate("const seek=document.getElementById('seek');seek.value=WordForge.score.duration-.15;seek.dispatchEvent(new Event('change'))")
            await page.wait_for_function('WordForge.state.transitions>=1 && WordForge.state.playing && !WordForge.state.busy',timeout=30000)
            await page.uncheck('#endless');await page.click('#stop')
            checks.append('Automatic next local take and cancelable exploration')
            if args.live:
                await page.click('#connect');await page.wait_for_function("document.getElementById('connection').textContent.startsWith('Connected:')",timeout=45000)
                await page.wait_for_function('WordForge.state.playing && !WordForge.state.busy')
                receipt=await page.evaluate('WordForge.session().companion');assert receipt['kind']=='LIVE_PUBLIC_METADATA' and receipt['sources']
                checks.append('Real repository Conscience64 stats/search bridge and composed public labels')
                await page.click('#stop')
            for name,style,phase in [('velvet-anvils',0,None),('my-floats-stumble',1,'trial'),('original-mistake-repair',0,'journey')]:
                rendered=await page.evaluate('''async ({style,phase,save})=>{
                    let r=Music64.fromText('Velvet anvils dance beneath a clockwork moon.',{style,bpm:144});
                    if(phase)r=ListenerFloatMusic.stumble(r,{seed:7,amount:2,kind:'mixed',phase});
                    const score=ListenerFloatMusic.compose(r),renderer=MusilanguageEngine.renderer(score),b=await renderer.render(MusilanguageEngine.levels(['fusion','metal','classical','funk'][style]),22050);
                    let peak=0,energy=0,bad=0;for(let c=0;c<2;c++)for(const x of b.getChannelData(c)){if(!Number.isFinite(x))bad++;peak=Math.max(peak,Math.abs(x));energy+=x*x;}
                    let encoded=null;if(save){const a=new Uint8Array(renderer.wav(b));let str='';for(let i=0;i<a.length;i+=32768)str+=String.fromCharCode(...a.subarray(i,i+32768));encoded=btoa(str);}
                    return {duration:score.duration,peak,rms:Math.sqrt(energy/(b.length*2)),nonfinite:bad,wav:encoded,recipe:r};
                }''',{'style':style,'phase':phase,'save':args.audio})
                assert rendered['nonfinite']==0 and 0<rendered['peak']<1 and rendered['rms']>.001
                data=rendered.pop('wav');recipe=rendered.pop('recipe');audio.append({'name':name,**rendered})
                if args.audio:
                    (out/(name+'.wav')).write_bytes(base64.b64decode(data));(out/(name+'.json')).write_text(json.dumps(recipe,ensure_ascii=False,indent=2))
            checks.append('Three full Web Audio renders: nonzero, finite, peak below PCM clipping')
            await page.set_viewport_size({'width':390,'height':844})
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            await page.screenshot(path=str(out/'mobile.png'),full_page=True)
            await page.set_viewport_size({'width':1280,'height':1050});await page.screenshot(path=str(out/'desktop.png'),full_page=True)
            checks.append('Mobile layout has no horizontal overflow')
            assert not errors,errors
            await browser.close()
    finally:server.shutdown()
    result={'status':'PASS','inlineFixture':args.fixture,'liveCompanionTested':args.live,'checks':checks,'audio':audio,'pageErrors':errors}
    (out/'browser-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--live',action='store_true');ap.add_argument('--fixture',action='store_true');ap.add_argument('--audio',action='store_true');ap.add_argument('--output',default='/tmp/music64-browser');asyncio.run(run(ap.parse_args()))
