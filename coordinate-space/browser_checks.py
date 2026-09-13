"""Optional UI checks: pip install playwright; playwright install chromium."""
from contextlib import contextmanager
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import hashlib
import json
import os
import re
import sys
import shutil
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

@contextmanager
def local_site():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try: yield f'http://127.0.0.1:{server.server_port}/'
    finally: server.shutdown(); server.server_close(); thread.join()

def run(dom_only=False):
    checks = []
    def check(name, condition):
        checks.append({'name':name, 'passed':bool(condition)})
        print(name, condition, file=sys.stderr)
        if not condition: raise AssertionError(name)
    with local_site() as origin, sync_playwright() as p:
        options = {'headless':True}
        exe = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome')
        if exe: options['executable_path'] = exe
        browser = p.chromium.launch(**options)
        page = browser.new_page(accept_downloads=True)
        page.set_default_timeout(5000)
        errors = []; requests = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('request', lambda request: requests.append(request.url))
        if dom_only:
            page.set_content(re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>', '', (ROOT/'index.html').read_text()))
            page.evaluate('() => {' + (ROOT/'sha256.js').read_text() + ';globalThis.sha256Bytes=sha256Bytes;globalThis.bytesToHex=bytesToHex;}')
            page.evaluate('() => {' + (ROOT/'codec.js').read_text() + '}')
            for name in ['source_file.js','locales.js','i18n.js','ui.js']:
                page.evaluate('() => {' + (ROOT/name).read_text() + '}')
            check('DOM initialization', page.locator('#encode').count() == 1)
        else:
            response = page.goto(origin, wait_until='networkidle')
            check('HTTP entrypoint loads', response.status == 200)
        page.locator('#encode').click()
        check('encode UI', page.locator('#status').inner_text().startswith('PASS'))
        check('recovered text', page.locator('#recovered').inner_text() == page.locator('#text').input_value())
        packet = json.loads(page.locator('#packet').input_value())
        with page.expect_download() as info: page.locator('#savePacket').click()
        check('envelope download', json.loads(Path(info.value.path()).read_text()) == packet)
        with page.expect_download() as info: page.locator('#saveText').click()
        check('recovered download bytes', hashlib.sha256(Path(info.value.path()).read_bytes()).hexdigest() == packet['sha256'])
        page.locator('#packet').fill('{bad json')
        check('edits invalidate saved state', page.locator('#saveText').is_disabled())
        page.locator('#decode').click()
        check('invalid JSON fails closed', page.locator('#status').inner_text().startswith('FAIL'))
        page.locator('#load').set_input_files({'name':'example.json','mimeType':'application/json','buffer':json.dumps(packet).encode()})
        expect(page.locator("#status")).to_have_attribute("data-state", "passed")
        check('file import', page.locator('#recovered').inner_text() != '')
        malicious = '<img src=x onerror=alert(1)></script> مرحبا'
        page.locator('#text').fill(malicious); page.locator('#encode').click()
        check('source displayed not executed', page.locator('#recovered').inner_text() == malicious and page.locator('#recovered img').count() == 0)
        check('controls labeled', page.evaluate("[...document.querySelectorAll('input,textarea')].every(e=>e.labels.length>0)"))
        page.locator('.skip').focus()
        check('keyboard focus', page.evaluate("document.activeElement.className==='skip'"))
        page.set_viewport_size({'width':320,'height':800})
        check('mobile layout', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.locator('#clear').click()
        check('clear erases input and result', page.locator('#text').input_value() == '' and page.locator('#packet').input_value() == '' and page.locator('#recovered').inner_text() == '' and page.locator('#saveText').is_disabled())
        # An asynchronous import must not repopulate input after Clear.
        page.evaluate("() => {window.savedBuffer=File.prototype.arrayBuffer; File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.finishImport=()=>resolve(new TextEncoder().encode('{}').buffer))}}")
        page.locator('#load').set_input_files({'name':'slow.json','mimeType':'application/json','buffer':b'{}'})
        page.locator('#clear').click(); page.evaluate('() => {window.finishImport(); File.prototype.arrayBuffer=window.savedBuffer;}')
        page.wait_for_timeout(30)
        check('clear wins pending file import', page.locator('#packet').input_value() == '' and page.locator('#status').get_attribute('data-state') == 'cleared')
        from culture_browser_checks import exercise
        exercise(page, check)
        from intake_browser_checks import exercise as intake_exercise
        intake_exercise(page, check)
        from completion_browser_checks import exercise_completion
        exercise_completion(page, check)
        check('no unexpected network requests', all(url.startswith(origin) for url in requests))
        check('no uncaught JS errors', not errors)
        version = browser.version
        browser.close()
    return {'status':'PASS', 'checks_total':len(checks), 'checks':checks, 'browser':version,
            'boundary':('DOM-only: navigation is blocked in this environment. HTML is loaded without external script tags; local scripts are evaluated explicitly. HTTP delivery and CSP enforcement are not tested.' if dom_only else 'Headless Chromium over a local HTTP server. No screen-reader or accessibility-conformance certification.')}

if __name__ == '__main__': print(json.dumps(run('--dom-only' in sys.argv), ensure_ascii=False, indent=2))
