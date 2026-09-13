"""Original-file intake and stale-operation regressions. Authored fixtures only."""
import hashlib
import json
from pathlib import Path
from playwright.sync_api import expect


def exercise(page, check):
    page.locator('#language').select_option('en')
    raw = b'\xef\xbb\xbfA\r\nB\rC\x00' + ' العربية é e\u0301'.encode()
    sample={'name':'original.txt','mimeType':'text/plain','buffer':raw}
    page.locator('#source-file').set_input_files(sample)
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    check('source file digest is the original-byte digest', json.loads(page.locator('#packet').input_value())['sha256']==hashlib.sha256(raw).hexdigest())
    check('exact source separated from normalized textarea preview', '\r' not in page.locator('#text').input_value() and page.locator('#recovered').text_content()==raw.decode('utf8'))
    check('imported-byte mode explicitly visible', page.locator('#source-origin').get_attribute('data-mode')=='imported')
    baseline=page.locator('#packet').input_value()
    for tag in page.evaluate('CoordinateI18n.list().map(p=>p.locale).filter(p=>p!=="chr")'):
        page.locator('#language').select_option(tag)
        page.locator('#encode').click()
        check(tag+' re-encode retains exact imported bytes', page.locator('#packet').input_value()==baseline)
    with page.expect_download() as info:page.locator('#saveText').click()
    check('direct source download preserves BOM CRLF CR NUL', Path(info.value.path()).read_bytes()==raw)
    edited=page.locator('#text').input_value()+' new'
    page.locator('#text').fill(edited)
    check('editing file preview invalidates verification', page.locator('#saveText').is_disabled() and page.locator('#source-origin').get_attribute('data-mode')=='editor')
    page.locator('#encode').click()
    check('explicit edit creates a new byte identity', json.loads(page.locator('#packet').input_value())['sha256']==hashlib.sha256(edited.encode()).hexdigest())
    # Reusing the same selected file must be possible after editing.
    page.locator('#source-file').set_input_files(sample)
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    check('same-file reimport restores original bytes', page.locator('#source-file').input_value()=='' and page.locator('#packet').input_value()==baseline)
    page.locator('#source-file').set_input_files({'name':'bad.txt','mimeType':'text/plain','buffer':b'\xff'})
    expect(page.locator('#status')).to_have_attribute('data-state','failed')
    check('invalid UTF-8 fails without verified replacement', page.locator('#saveText').is_disabled() and page.locator('#recovered').text_content()=='')
    page.locator('#source-file').set_input_files({'name':'empty.txt','mimeType':'text/plain','buffer':b''})
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    check('zero-byte source is valid', json.loads(page.locator('#packet').input_value())['utf8_bytes']==0)
    json_source=b'{"coordinates":"source, not envelope"}'
    page.locator('#source-file').set_input_files({'name':'source.json','mimeType':'application/json','buffer':json_source})
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    check('JSON source is not implicitly treated as an envelope', page.locator('#recovered').text_content()==json_source.decode())
    page.locator('#source-file').set_input_files({'name':'large.txt','mimeType':'text/plain','buffer':b'a'*(1024*1024+1)})
    expect(page.locator('#status')).to_have_attribute('data-state','failed')
    check('oversized source rejected', page.locator('#saveText').is_disabled())
    # An old translation-file read must not overwrite a newer explicit choice.
    page.evaluate("""() => {window.savedFileBuffer=File.prototype.arrayBuffer;
      File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.finishLanguage=()=>resolve(new TextEncoder().encode(CoordinateI18n.template('en')).buffer))}}""")
    page.locator('#language-pack').set_input_files({'name':'slow-language.json','mimeType':'application/json','buffer':b'{}'})
    page.locator('#language').select_option('ar')
    page.evaluate('() => {window.finishLanguage(); File.prototype.arrayBuffer=window.savedFileBuffer;}')
    page.wait_for_timeout(30)
    check('newer language choice wins older import', page.locator('html').get_attribute('lang')=='ar' and page.locator('#language-status').text_content()=='')
    # Hold original-file reads to test Clear, typing, and a newer import separately.
    page.evaluate("""() => {window.savedArrayBuffer=File.prototype.arrayBuffer;window.byteReads=[];
      File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.byteReads.push(resolve))}}""")
    page.locator('#source-file').set_input_files({'name':'A.txt','mimeType':'text/plain','buffer':b'A'})
    page.locator('#clear').click()
    page.evaluate('() => window.byteReads.shift()(new Uint8Array([65]).buffer)')
    page.wait_for_timeout(30)
    check('Clear wins pending source-file intake', page.locator('#status').get_attribute('data-state')=='cleared' and page.locator('#text').input_value()=='')
    page.locator('#source-file').set_input_files({'name':'A.txt','mimeType':'text/plain','buffer':b'A'})
    page.locator('#text').fill('newer typing');page.locator('#encode').click()
    typed=page.locator('#packet').input_value()
    page.evaluate('() => window.byteReads.shift()(new Uint8Array([65]).buffer)')
    page.wait_for_timeout(30)
    check('typing wins pending original-file read', page.locator('#packet').input_value()==typed and page.locator('#recovered').text_content()=='newer typing')
    page.locator('#source-file').set_input_files({'name':'A.txt','mimeType':'text/plain','buffer':b'A'})
    page.locator('#source-file').set_input_files({'name':'B.txt','mimeType':'text/plain','buffer':b'B'})
    page.evaluate('() => window.byteReads[1](new Uint8Array([66]).buffer)')
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    page.evaluate('() => window.byteReads[0](new Uint8Array([65]).buffer)')
    page.wait_for_timeout(30)
    check('latest source selection wins reversed completion order', page.locator('#recovered').text_content()=='B')
    page.evaluate('() => {File.prototype.arrayBuffer=window.savedArrayBuffer;}')
    # Old envelopes also retain CRLF on a subsequent press of Encode.
    envelope=page.evaluate("CoordinateCodec.encode('\\ufeffold\\r\\nsource\\0')")
    page.locator('#load').set_input_files({'name':'v1.json','mimeType':'application/json','buffer':json.dumps(envelope).encode()})
    expect(page.locator('#status')).to_have_attribute('data-state','passed')
    page.locator('#encode').click()
    check('legacy v1 envelope can be re-encoded without newline loss', json.loads(page.locator('#packet').input_value())==envelope)
    check('new source-file control has an explicit label', page.evaluate("document.getElementById('source-file').labels.length===1"))
    page.locator('#language').select_option('en')
