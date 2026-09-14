import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../voice-anywhere.js', import.meta.url), 'utf8');
let inputEvents = 0, changeEvents = 0;
const target = {
  id: 'target', value: 'old', selectionStart: 3, selectionEnd: 3,
  disabled: false, readOnly: false, isContentEditable: false, offsetParent: {},
  matches(selector) { return selector.includes('input'); },
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
  dispatchEvent(event) { if (event.type === 'input') inputEvents++; if (event.type === 'change') changeEvents++; return true; },
  focus() { document.activeElement = this; }
};
const document = {
  currentScript: { dataset: { voiceAuto: 'false' } },
  documentElement: { lang: 'en' },
  body: { innerText: '' }, activeElement: null,
  addEventListener() {},
  querySelector(selector) { return selector === '#target' ? target : null; },
  querySelectorAll() { return [target]; }
};
class TestEvent { constructor(type) { this.type = type; } }
class TestInputEvent extends TestEvent { constructor(type, init={}) { super(type); Object.assign(this, init); } }
class TestCustomEvent extends TestEvent { constructor(type, init={}) { super(type); this.detail = init.detail; } }
const context = vm.createContext({
  console, document, navigator: { language: 'en-US', userActivation: { isActive: false } },
  Event: TestEvent, InputEvent: TestInputEvent, CustomEvent: TestCustomEvent,
  setTimeout, clearTimeout, Promise, Object, String, Number, Math,
  addEventListener() {}, dispatchEvent() { return true; }
});
context.globalThis = context;
new vm.Script(source, { filename: 'voice-anywhere.js' }).runInContext(context);
const voice = context.VoiceAnywhere;
assert.equal(voice.version, '1.1.0');
assert.equal(voice.supported.typing, true);
assert.match(voice.toSpeakable('P ?= NP; S′; UTF-8 → Float64'), /P, question mark, equals N P/);
assert.match(voice.toSpeakable('P ?= NP; S′; UTF-8 → Float64'), /S prime/);
await voice.type('abc', { target: '#target', mode: 'replace', pace: 0 });
assert.equal(target.value, 'abc');
assert.equal(voice.state.typing, false);
await voice.type('!', { target: '#target', mode: 'append', pace: 0 });
assert.equal(target.value, 'abc!');
assert.ok(inputEvents >= 2, 'typing must emit input events');
assert.ok(changeEvents >= 2, 'typing must emit change events');
console.log('PASS Voice Anywhere: speakable math plus replace/append typing with ordinary edit events.');
