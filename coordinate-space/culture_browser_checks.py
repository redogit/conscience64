"""UI culture and time-independence regression tests using authored inputs."""
import re
import json
from pathlib import Path
from playwright.sync_api import expect

def exercise(page, check):
    text = 'Original 1900-01-01 / é e\u0301 / العربية עברית தமிழ் বাংলা / ᎣᏏᏲ ᐃᓄᒃᑎᑐᑦ / 𞤀𞤣𞤤𞤢𞤥 / 👩🏽‍💻'
    page.locator('#text').fill(text); page.locator('#encode').click()
    baseline = page.locator('#packet').input_value()
    locales = page.evaluate('CoordinateI18n.list().map(p=>({locale:p.locale,dir:p.direction}))')
    check('16 bundled language drafts', len(locales) == 16)
    for pack in locales:
        tag = pack['locale']; page.locator('#language').select_option(tag)
        check(tag+' language and direction', page.evaluate('document.documentElement.lang') == tag and page.evaluate('document.documentElement.dir') == pack['dir'])
        check(tag+' complete visible keys', page.evaluate("[...document.querySelectorAll('[data-i18n]')].every(e=>e.textContent===CoordinateI18n.get(document.documentElement.lang).messages[e.dataset.i18n] && e.lang===document.documentElement.lang)"))
        check(tag+' unchanged source and envelope', page.locator('#text').input_value() == text and page.locator('#packet').input_value() == baseline and page.locator('#recovered').inner_text() == text)
        check(tag+' localized count', page.evaluate("document.querySelector('#summary bdi').textContent===CoordinateI18n.number(new TextEncoder().encode(document.getElementById('text').value).length,document.documentElement.lang)"))
        check(tag+' isolated machine fields', page.locator('#packet').get_attribute('dir') == 'ltr' and page.locator('#digest').get_attribute('dir') == 'ltr')
        for width in [320,1100]:
            page.set_viewport_size({'width':width,'height':900})
            check(tag+f' layout {width}px', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.locator('#language').select_option('ar')
    page.locator('#source-lang').fill('chr'); page.locator('#source-dir').select_option('ltr')
    check('source language independent of Arabic UI', page.locator('#text').get_attribute('lang') == 'chr' and page.locator('#recovered').get_attribute('lang') == 'chr' and page.locator('#text').get_attribute('dir') == 'ltr')
    check('presentation hints do not alter envelope', page.locator('#packet').input_value() == baseline)
    page.locator('#source-lang').fill('../bad')
    check('invalid source tag explicitly flagged', page.locator('#source-lang').get_attribute('aria-invalid') == 'true' and page.locator('#source-status').inner_text() != '')
    page.locator('#source-lang').fill(''); page.locator('#source-dir').select_option('auto')
    check('unknown source language stays unknown', page.locator('#text').get_attribute('lang') == '')
    # Date throws if the codec accidentally consults wall time. Timers for download
    # URL cleanup are separate and do not establish document identity or expiry.
    stable = page.evaluate("""() => {
      const before=JSON.stringify(CoordinateCodec.encode(document.getElementById('text').value));
      const prior=globalThis.Date;
      globalThis.Date=class {constructor(){throw Error('Clock used')} static now(){throw Error('Clock used')}};
      try{return JSON.stringify(CoordinateCodec.encode(document.getElementById('text').value))===before && CoordinateCodec.decode(JSON.parse(before)).text===document.getElementById('text').value;}
      finally{globalThis.Date=prior;}
    }""")
    check('encode and decode without Date access', stable)
    with page.expect_download() as info: page.locator('#template').click()
    template = json.loads(Path(info.value.path()).read_text())
    check('translation template export has all keys', template['locale']=='ar' and len(template['messages'])==40)
    template['locale']='chr';template['nativeName']='ᏣᎳᎩ — test';template['direction']='ltr';template['messages']['title']='<img src=x onerror=alert(1)>'
    page.locator('#language-pack').set_input_files({'name':'test-language.json','mimeType':'application/json','buffer':json.dumps(template).encode()})
    expect(page.locator("html")).to_have_attribute("lang", "chr")
    check('extensible local language pack', page.locator('#language').input_value() == 'chr')
    check('translations are text not executable HTML', page.locator('h1').inner_text() == template['messages']['title'] and page.locator('h1 img').count()==0)
    check('language pack preserves verified bytes', page.locator('#packet').input_value() == baseline and page.locator('#status').get_attribute('data-state')=='passed')
    del template['messages']['title']
    page.locator('#language-pack').set_input_files({'name':'bad-language.json','mimeType':'application/json','buffer':json.dumps(template).encode()})
    page.wait_for_timeout(100)
    check('incomplete translation rejected atomically', page.evaluate("document.documentElement.lang==='chr'") and page.locator('#packet').input_value()==baseline)
    # Clear invalidates pending translation imports, just as it invalidates envelopes.
    page.evaluate("() => {window.savedText=File.prototype.text; File.prototype.text=function(){return new Promise(resolve=>window.finishImport=()=>resolve(CoordinateI18n.template('en')))}}")
    page.locator('#language-pack').set_input_files({'name':'slow-language.json','mimeType':'application/json','buffer':b'{}'})
    page.locator('#clear').click();page.evaluate('() => {window.finishImport(); File.prototype.text=window.savedText;}');page.wait_for_timeout(30)
    check('clear wins pending language import', page.evaluate("document.documentElement.lang==='chr'") and page.locator('#language-status').inner_text()=='')
    page.locator('#language').select_option('en')
    # Do not force the selected source culture/script on a newly imported payload.
    page.locator('#source-lang').fill('ar'); page.locator('#source-dir').select_option('rtl')
    payload=page.evaluate("CoordinateCodec.encode('\\ufeffA\\r\\nB\\0')")
    page.locator('#load').set_input_files({'name':'exact.json','mimeType':'application/json','buffer':json.dumps(payload).encode()})
    expect(page.locator("#status")).to_have_attribute("data-state", "passed")
    check('import has no invented source language', page.locator('#recovered').get_attribute('lang')=='' and page.locator('#recovered').get_attribute('dir')=='auto')
    with page.expect_download() as info: page.locator('#saveText').click()
    check('BOM CRLF and NUL survive export', Path(info.value.path()).read_bytes() == b'\xef\xbb\xbfA\r\nB\0')
    check('all interactive inputs explicitly labeled', page.evaluate("[...document.querySelectorAll('input,textarea,select')].every(e=>e.labels.length>0)"))
    sources = '\n'.join((Path(__file__).parent/name).read_text(encoding='utf8') for name in ['ui.js','codec.js','i18n.js','locales.js'])
    check('runtime has no persistent storage calls', re.search(r'localStorage|sessionStorage|indexedDB|document\.cookie|caches\.', sources) is None)
