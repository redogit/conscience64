(()=>{
'use strict';
const SpeechRecognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
const synth=globalThis.speechSynthesis||null;
let recognition=null,listening=false,autoSpeak=true,currentLang=(navigator.language||'en-US'),autoLanguage=true,observedAnswer=null;
const $=id=>document.getElementById(id);
const baseLang=tag=>String(tag||'en').split('-')[0].toLowerCase();
function bestVoice(lang){if(!synth)return null;const voices=synth.getVoices();const want=String(lang||'').toLowerCase(),base=baseLang(want);return voices.find(v=>v.lang?.toLowerCase()===want)||voices.find(v=>baseLang(v.lang)===base&&v.localService)||voices.find(v=>baseLang(v.lang)===base)||voices.find(v=>v.default)||voices[0]||null;}
function setStatus(text){const el=$('space-voice-status');if(el)el.textContent=text;}
function scriptLanguage(text,fallback=currentLang){const s=String(text||'');if(/[\u0600-\u06ff]/.test(s))return'ar';if(/[\u0900-\u097f]/.test(s))return'hi';if(/[\u3040-\u30ff]/.test(s))return'ja';if(/[\uac00-\ud7af]/.test(s))return'ko';if(/[\u4e00-\u9fff]/.test(s))return'zh';if(/[\u0400-\u04ff]/.test(s))return'ru';return fallback;}
async function detectLanguage(text){
  if(!autoLanguage)return currentLang;
  const scripted=scriptLanguage(text,currentLang);if(baseLang(scripted)!==baseLang(currentLang))return scripted;
  if(!('LanguageDetector' in globalThis)||String(text||'').trim().length<12)return scripted;
  try{const availability=await LanguageDetector.availability();if(availability==='unavailable')return scripted;const detector=await LanguageDetector.create();const results=await detector.detect(text);const top=results?.[0];if(top?.confidence>=.62&&top.detectedLanguage)return top.detectedLanguage;}catch{}
  return scripted;
}
async function translateForVoice(text,targetLang){
  const target=baseLang(targetLang),source='en';if(!text||target===source)return text;
  if(!('Translator' in globalThis))return text;
  try{const state=await Translator.availability({sourceLanguage:source,targetLanguage:target});if(state==='unavailable')return text;const translator=await Translator.create({sourceLanguage:source,targetLanguage:target});return await translator.translate(text);}catch{return text;}
}
function renderSpokenTranslation(text,lang){let el=$('space-spoken-translation');const answer=$('space-answer');if(!answer)return;if(!el){el=document.createElement('p');el.id='space-spoken-translation';el.className='space-spoken-translation';answer.querySelector('.space-answer-text')?.insertAdjacentElement('afterend',el);}if(el){el.lang=lang;el.textContent=text&&baseLang(lang)!=='en'?`Local voice (${lang}): ${text}`:'';el.hidden=!el.textContent;}}
function speak(text,lang=currentLang){if(!synth||!text)return;const u=new SpeechSynthesisUtterance(String(text));u.lang=lang;const v=bestVoice(lang);if(v)u.voice=v;u.rate=1;u.pitch=1;synth.cancel();synth.speak(u);}
async function speakAnswer(text){if(!autoSpeak||!text)return;const translated=await translateForVoice(text,currentLang);renderSpokenTranslation(translated,currentLang);speak(translated,currentLang);}
function submitTranscript(text){const input=$('space-search'),form=$('space-search-form');if(!input||!form)return;input.value=text;setStatus(`Heard · ${currentLang}`);globalThis.SpaceLensField?.pushEvent?.('voice-input',1.35,{text,carrier:'Learner',domain:'language'});form.requestSubmit?.();if(!form.requestSubmit)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
function stop(){if(recognition&&listening){try{recognition.stop();}catch{}}}
async function configureLocalRecognition(rec){
  if(!SpeechRecognition||!('processLocally' in rec))return false;
  try{
    if(typeof SpeechRecognition.available!=='function')return false;
    const lang=currentLang,state=await SpeechRecognition.available({langs:[lang],processLocally:true,quality:'dictation'});
    if(state==='available'){rec.processLocally=true;return true;}
    if((state==='downloadable'||state==='downloading')&&typeof SpeechRecognition.install==='function'&&navigator.userActivation?.isActive){setStatus(`Installing local speech pack · ${lang}`);const ok=await SpeechRecognition.install({langs:[lang],processLocally:true,quality:'dictation'});if(ok){rec.processLocally=true;return true;}}
  }catch{}
  rec.processLocally=false;return false;
}
async function start(){
  if(!SpeechRecognition){setStatus('Speech recognition unavailable in this browser; typing still works.');return;}
  if(!recognition){recognition=new SpeechRecognition();recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=1;recognition.onstart=()=>{listening=true;setStatus(`Listening · ${currentLang}${recognition.processLocally?' · on-device':''}`);const b=$('space-voice-button');if(b){b.textContent='Stop';b.setAttribute('aria-pressed','true');}};recognition.onend=()=>{listening=false;const b=$('space-voice-button');if(b){b.textContent='Speak';b.setAttribute('aria-pressed','false');}if($('space-voice-status')?.textContent.startsWith('Listening'))setStatus('Voice ready');};recognition.onerror=e=>setStatus(`Voice input: ${e.error||'error'}`);recognition.onresult=async e=>{let final='',interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)final+=t;else interim+=t;}const input=$('space-search');if(input&&(final||interim))input.value=(final||interim).trim();if(final.trim()){if(autoLanguage){currentLang=await detectLanguage(final.trim());const select=$('space-voice-language');if(select)select.value='auto';}submitTranscript(final.trim());}};}
  recognition.lang=currentLang;await configureLocalRecognition(recognition);try{recognition.start();}catch(err){setStatus(String(err?.message||err));}
}
function toggle(){listening?stop():start();}
function addUI(){
  if($('space-voice-controls'))return;const consoleBox=document.querySelector('.space-console');if(!consoleBox)return;const wrap=document.createElement('div');wrap.id='space-voice-controls';wrap.className='space-voice-controls';wrap.innerHTML=`<button type="button" id="space-voice-button" aria-pressed="false">Speak</button><label><span class="sr-only">Voice language</span><select id="space-voice-language" aria-label="Voice language"><option value="auto" selected>Auto / local language</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="es-ES">Español</option><option value="fr-FR">Français</option><option value="de-DE">Deutsch</option><option value="pt-BR">Português</option><option value="it-IT">Italiano</option><option value="ja-JP">日本語</option><option value="ko-KR">한국어</option><option value="zh-CN">中文</option><option value="hi-IN">हिन्दी</option><option value="ar-SA">العربية</option><option value="ru-RU">Русский</option></select></label><label class="space-voice-check"><input id="space-voice-autospeak" type="checkbox" checked> speak answers</label><span id="space-voice-status" role="status" aria-live="polite">Voice ready</span>`;consoleBox.insertAdjacentElement('afterend',wrap);
  const style=document.createElement('style');style.textContent=`.space-voice-controls{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.55rem 0 0;padding:.55rem .7rem;border:1px solid #26314b;border-radius:.6rem;background:rgba(5,7,14,.72);font-size:.75rem;color:var(--muted)}.space-voice-controls button,.space-voice-controls select{border:1px solid #405071;background:#111a2b;color:var(--fg);border-radius:.5rem;padding:.48rem .62rem}.space-voice-controls button{cursor:pointer}.space-voice-controls button:focus-visible,.space-voice-controls select:focus-visible{outline:3px solid var(--cyan);outline-offset:2px}.space-voice-check{display:flex;align-items:center;gap:.3rem}.space-spoken-translation{margin:.25rem 0 .75rem;color:#c7ffac;font:500 .9rem/1.45 ui-sans-serif,system-ui}.sr-only{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}`;document.head.appendChild(style);
  $('space-voice-button').addEventListener('click',toggle);$('space-voice-language').addEventListener('change',e=>{autoLanguage=e.target.value==='auto';currentLang=autoLanguage?(navigator.language||'en-US'):e.target.value;setStatus(`Voice language · ${autoLanguage?'automatic':currentLang}`);});$('space-voice-autospeak').addEventListener('change',e=>autoSpeak=e.target.checked);
  if(!SpeechRecognition)$('space-voice-button').disabled=true;
}
function watchAnswers(){const host=$('space-answer-text');if(!host||host===observedAnswer)return;observedAnswer=host;let last='';const observer=new MutationObserver(()=>{const text=host.textContent.trim();if(text&&text!==last){last=text;speakAnswer(text);}});observer.observe(host,{childList:true,subtree:true,characterData:true});}
function install(){addUI();watchAnswers();if(synth){synth.getVoices();synth.onvoiceschanged=()=>synth.getVoices();}setStatus(SpeechRecognition?'Voice ready · local recognition preferred when available':'Speech input unavailable here; spoken answers may still work.');}
addEventListener('conscience64-ready',()=>{addUI();watchAnswers();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
globalThis.SpaceLensVoice=Object.freeze({speak,start,stop,detectLanguage,translateForVoice,get language(){return currentLang;}});
})();