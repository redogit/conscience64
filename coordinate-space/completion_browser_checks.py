"""Import regression tests: strict bytes and the user's latest choice wins."""
import json
from playwright.sync_api import expect


def exercise_completion(page, check):
    def upload(selector, raw, name='fixture.json'):
        page.locator(selector).set_input_files({
            'name': name, 'mimeType': 'application/json', 'buffer': raw})

    def pack_bytes():
        pack = page.evaluate("JSON.parse(CoordinateI18n.template('en'))")
        pack['locale'] = 'en'; pack['messages']['title'] = 'BROKEN_MARKER'
        return json.dumps(pack, ensure_ascii=False).encode('utf-8')

    page.locator('#language').select_option('en')
    page.locator('#text').fill('Unchanged source / العربية / 1900-01-01')
    page.locator('#encode').click()
    packet_text = page.locator('#packet').input_value()
    raw = pack_bytes().replace(b'BROKEN_MARKER', b'\xff')
    upload('#language-pack', raw)
    error_text = page.evaluate("CoordinateI18n.get('en').messages.packError")
    expect(page.locator('#language-status')).to_have_text(error_text)
    check('malformed UTF-8 language pack rejected without source change',
          page.locator('html').get_attribute('lang') == 'en'
          and page.locator('#packet').input_value() == packet_text
          and page.locator('#status').get_attribute('data-state') == 'passed')

    # A JSON envelope may have an outer UTF-8 BOM. That transport marker is
    # distinct from a BOM inside the exact source, already tested elsewhere.
    upload('#load', b'\xef\xbb\xbf' + packet_text.encode('utf-8'))
    expect(page.locator('#status')).to_have_attribute('data-state', 'passed')
    check('outer JSON BOM accepted without changing source digest',
          page.locator('#digest').inner_text() == json.loads(packet_text)['sha256'])

    # Invalid bytes even in JSON whitespace must not be replaced during import.
    upload('#load', b'\xff' + packet_text.encode('utf-8'))
    expect(page.locator('#status')).to_have_attribute('data-state', 'failed')
    check('malformed UTF-8 envelope leaves no verified output',
          page.locator('#saveText').is_disabled()
          and page.locator('#savePacket').is_disabled()
          and page.locator('#recovered').inner_text() == '')

    def delay_read():
        page.evaluate("""() => {
          window.savedBuffer = File.prototype.arrayBuffer;
          File.prototype.arrayBuffer = function() {
            return new Promise(resolve => window.finishRead = text =>
              resolve(new TextEncoder().encode(text).buffer));
          };
        }""")

    def finish_read(text):
        page.evaluate("""async text => {
          window.finishRead(text);
          File.prototype.arrayBuffer = window.savedBuffer;
          await new Promise(resolve => setTimeout(resolve, 0));
        }""", text)

    delay_read()
    upload('#language-pack', b'{}', 'slow-language.json')
    page.locator('#language').select_option('fr')
    finish_read(page.evaluate("CoordinateI18n.template('en')"))
    check('manual language selection wins earlier pending import',
          page.locator('html').get_attribute('lang') == 'fr'
          and page.locator('#language').input_value() == 'fr'
          and page.locator('#language-status').inner_text() == '')

    # An obsolete malformed read must not show an error over the newer choice.
    delay_read()
    upload('#language-pack', b'{}', 'slow-invalid-language.json')
    page.locator('#language').select_option('ar')
    finish_read('{not-json')
    check('obsolete failed language import cannot overwrite current status',
          page.locator('html').get_attribute('lang') == 'ar'
          and page.locator('#language-status').inner_text() == '')

    page.locator('#language').select_option('en')
    delay_read()
    upload('#load', b'{}', 'slow-envelope.json')
    page.locator('#text').fill('The newer input stays.')
    finish_read(packet_text)
    check('typed input wins earlier pending envelope read',
          page.locator('#text').input_value() == 'The newer input stays.'
          and page.locator('#status').get_attribute('data-state') == 'changed'
          and page.locator('#saveText').is_disabled())

    # Returning to a valid input after rejection is a normal recovery path.
    upload('#load', packet_text.encode('utf-8'), 'valid-again.json')
    expect(page.locator('#status')).to_have_attribute('data-state', 'passed')
    check('valid envelope remains usable after rejected imports',
          page.locator('#digest').inner_text() == json.loads(packet_text)['sha256'])

    source = page.locator('#packet').input_value()
    valid_pack = json.loads(pack_bytes()); valid_pack['messages']['title'] = 'Local reviewed wording (test fixture)'
    upload('#language-pack', json.dumps(valid_pack).encode('utf-8'), 'valid-pack.json')
    expected_title = valid_pack['messages']['title']
    expect(page.locator('h1')).to_have_text(expected_title)
    check('valid language import still works after manual cancellation',
          page.locator('#packet').input_value() == source
          and page.locator('#status').get_attribute('data-state') == 'passed')

    # Count UTF-8 bytes, not UTF-16 code units, at the pasted-envelope limit.
    page.evaluate("() => {const e=document.getElementById('packet'); e.value='界'.repeat(4*1024*1024+1); e.dispatchEvent(new Event('input'));}")
    page.locator('#decode').click()
    expect(page.locator('#status')).to_have_attribute('data-state', 'failed')
    check('pasted envelope limit counts UTF-8 bytes',
          'E_ENVELOPE_LIMIT' in page.locator('#details').inner_text()
          and page.locator('#saveText').is_disabled())
    page.locator('#clear').click()
