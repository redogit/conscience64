(()=>{
'use strict';
const SpeechRecognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
const synth=globalThis.speechSynthesis||null;
let recognition=null,phase='idle',autoSpeak=true,currentLang=(navigator.language||'en-US'),autoLanguage=true,observedAnswer=null;
let pendingTranscript='',submitting=false,speechGeneration=0;
const $=id=>document.getElementById(id);
const baseLang=tag=>String(tag||'en').split('-')[0].toLowerCase();
function setStatus(text){const el=$('space-voice-status');if(el)el.textContent=text;}
function setButton(){const b=$('space-voice-button');if(!b)return;const active=phase==='listening';b.textContent=active?'Stop':'Speak';b.setAttribute('aria-pressed',String(active));b.disabled=submitting;}
function bestVoice(lang){if(!synth)return null;const voices=synth.getVoices(),want=String(lang||'').toLowerCase(),base=baseLang(want);return voices.find(v=>v.lang?.toLowerCase()===want)||voices.find(v=>baseLang(v.lang)===base&&v.localService)||voices.find(v=>baseLang(v.lang)===base)||voices.find(v=>v.default)||voices[0]||null;}
function scriptLanguage(text,fallback=currentLang){const s=String(text||'');if(/[\u0600-\u06ff]/.test(s))return'ar';if(/[\u0900-\u097f]/.test(s))return'hi';if(/[\u3040-\u30ff]/.test(s))return'ja';if(/[\uac00-\ud7af]/.test(s))return'ko';if(/[\u4e00-\u9fff]/.test(s))return'zh';if(/[\u0400-\u04ff]/.test(s))return'ru';return fallback;}
async function detectLanguage(text){
  if(!autoLanguage)return currentLang;const scripted=scriptLanguage(text,currentLang);if(baseLang(scripted)!==baseLang(currentLang))return scripted;
  if(!('LanguageDetector' in globalThis)||String(text||'').trim().length<12)return scripted;
  try{const availability=await LanguageDetector.availability();if(availability==='unavailable')return scripted;const detector=await LanguageDetector.create();const results=await detector.detect(text),top=results?.[0];if(top?.confidence>=.62&&top.detectedLanguage)return top.detectedLanguage;}catch{}
  return scripted;
}
async function translateForVoice(text,targetLang){
  const target=baseLang(targetLang),source='en';if(!text||target===source)return text;if(!('Translator' in globalThis))return text;
  try{const state=await Translator.availability({sourceLanguage:source,targetLanguage:target});if(state==='unavailable')return text;const translator=await Translator.create({sourceLanguage:source,targetLanguage:target});return await translator.translate(text);}catch{return text;}
}
function renderSpokenTranslation(text,lang){let el=$('space-spoken-translation');const answer=$('space-answer');if(!answer)return;if(!el){el=document.createElement('p');el.id='space-spoken-translation';el.className='space-spoken-translation';answer.querySelector('.space-answer-text')?.insertAdjacentElement('afterend',el);}if(el){el.lang=lang;el.textContent=text&&baseLang(lang)!=='en'?text:'';el.hidden=!el.textContent;}}
function speechChunks(text,max=220){
  const src=String(text||'').replace(/\s+/g,' ').trim();if(!src)return[];const sentences=src.match(/[^.!?]+[.!?]?/g)||[src],out=[];let cur='';
  for(const raw of sentences){const s=raw.trim();if(!s)continue;if((cur+' '+s).trim().length<=max){cur=(cur+' '+s).trim();continue;}if(cur)out.push(cur);if(s.length<=max){cur=s;continue;}const words=s.split(/\s+/);cur='';for(const w of words){if((cur+' '+w).trim().length>max&&cur){out.push(cur);cur=w;}else cur=(cur+' '+w).trim();}}
  if(cur)out.push(cur);return out;
}
function cancelSpeech(){speechGeneration++;try{synth?.cancel();}catch{}if(phase==='speaking')phase='idle';setButton();}
function speak(text,lang=currentLang){
  if(!synth||!String(text||'').trim())return;cancelSpeech();const generation=++speechGeneration,chunks=speechChunks(text),voice=bestVoice(lang);let i=0;phase='speaking';setButton();
  const next=()=>{if(generation!==speechGeneration)return;if(i>=chunks.length){phase='idle';setStatus('Voice ready');setButton();return;}const u=new SpeechSynthesisUtterance(chunks[i++]);u.lang=lang;if(voice)u.voice=voice;u.rate=1;u.pitch=1;u.onend=()=>setTimeout(next,0);u.onerror=()=>setTimeout(next,0);try{synth.speak(u);}catch{phase='idle';setStatus('Could not speak this answer.');setButton();}};next();
}
async function speakAnswer(text){if(!autoSpeak||!text||phase==='listening'||submitting)return;const translated=await translateForVoice(text,currentLang);renderSpokenTranslation(translated,currentLang);speak(translated,currentLang);}
function submitTranscript(text){const input=$('space-search'),form=$('space-search-form');if(!input||!form)return;input.value=text;globalThis.SpaceLensField?.pushEvent?.('voice-input',1.35,{text,carrier:'Learner',domain:'language'});form.requestSubmit?.();if(!form.requestSubmit)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
async function finishTranscript(text){
  if(submitting||!text)return;submitting=true;setButton();setStatus('Thinking…');try{if(autoLanguage)currentLang=await detectLanguage(text);submitTranscript(text);}finally{submitting=false;setButton();}
}
function resetRecognitionUI(message='Voice ready'){phase='idle';setStatus(message);setButton();}
function stop({discard=false}={}){if(discard)pendingTranscript='';if(recognition&&phase==='listening'){try{recognition.stop();}catch{resetRecognitionUI();}}else resetRecognitionUI();}
async function configureLocalRecognition(rec){
  if(!SpeechRecognition||!('processLocally' in rec))return false;try{if(typeof SpeechRecognition.available!=='function')return false;const lang=currentLang,state=await SpeechRecognition.available({langs:[lang],processLocally:true,quality:'dictation'});if(state==='available'){rec.processLocally=true;return true;}if(state==='downloadable'&&typeof SpeechRecognition.install==='function'&&navigator.userActivation?.isActive){setStatus(`Installing speech pack · ${lang}`);const ok=await SpeechRecognition.install({langs:[lang],processLocally:true,quality:'dictation'});if(ok){rec.processLocally=true;return true;}}}catch{}rec.processLocally=false;return false;
}
function buildRecognition(){
  if(recognition||!SpeechRecognition)return;recognition=new SpeechRecognition();recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{phase='listening';setStatus(`Listening${recognition.processLocally?' · on-device':''}`);setButton();};
  recognition.onresult=e=>{let final='',interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)final+=t;else interim+=t;}const text=(final||interim).trim(),input=$('space-search');if(input&&text)input.value=text;if(final.trim()){pendingTranscript=final.trim();setStatus('Got it…');try{recognition.stop();}catch{}}};
  recognition.onend=()=>{const text=pendingTranscript;pendingTranscript='';resetRecognitionUI(text?'Processing…':'Voice ready');if(text)setTimeout(()=>finishTranscript(text),0);};
  recognition.onerror=e=>{pendingTranscript='';resetRecognitionUI(e.error==='aborted'?'Voice ready':`Voice input: ${e.error||'error'}`);};
}
async function start(){
  if(!SpeechRecognition){setStatus('Speech recognition is unavailable here; typing still works.');return;}if(submitting)return;if(phase==='listening'){stop({discard:true});return;}cancelSpeech();pendingTranscript='';buildRecognition();recognition.lang=currentLang;await configureLocalRecognition(recognition);try{recognition.start();}catch(err){resetRecognitionUI(String(err?.message||err));}
}
function toggle(){phase==='listening'?stop({discard:true}):start();}
function addUI(){
  if($('space-voice-controls'))return;const consoleBox=document.querySelector('.space-console');if(!consoleBox)return;const wrap=document.createElement('div');wrap.id='space-voice-controls';wrap.className='space-voice-controls';wrap.innerHTML=`<button type="button" id="space-voice-button" aria-pressed="false">Speak</button><span id="space-voice-status" role="status" aria-live="polite">Voice ready</span><details class="space-voice-more"><summary>Voice options</summary><label><select id="space-voice-language" aria-label="Voice language"><option value="auto" selected>Automatic language</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="es-ES">Español</option><option value="fr-FR">Français</option><option value="de-DE">Deutsch</option><option value="pt-BR">Português</option><option value="it-IT">Italiano</option><option value="ja-JP">日本語</option><option value="ko-KR">한국어</option><option value="zh-CN">中文</option><option value="hi-IN">हिन्दी</option><option value="ar-SA">العربية</option><option value="ru-RU">Русский</option></select></label><label class="space-voice-check"><input id="space-voice-autospeak" type="checkbox" checked> Speak answers</label></details>`;consoleBox.appendChild(wrap);
  const style=document.createElement('style');style.textContent=`.space-voice-controls{grid-column:1/-1;display:flex;gap:.55rem;align-items:center;flex-wrap:wrap;padding:.4rem .1rem 0;border-top:1px solid #26314b;font-size:.75rem;color:var(--muted)}.space-voice-controls button,.space-voice-controls select{border:1px solid #405071;background:#111a2b;color:var(--fg);border-radius:.5rem;padding:.45rem .6rem}.space-voice-controls button{cursor:pointer}.space-voice-more{margin-left:auto}.space-voice-more summary{cursor:pointer}.space-voice-more[open]{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.space-voice-check{display:inline-flex;align-items:center;gap:.3rem;margin-left:.45rem}.space-spoken-translation{margin:.25rem 0 .65rem;color:#c7ffac;font:500 .88rem/1.45 ui-sans-serif,system-ui}`;document.head.appendChild(style);
  $('space-voice-button').addEventListener('click',toggle);$('space-voice-language').addEventListener('change',e=>{autoLanguage=e.target.value==='auto';currentLang=autoLanguage?(navigator.language||'en-US'):e.target.value;setStatus(autoLanguage?'Automatic language':'Voice: '+currentLang);});$('space-voice-autospeak').addEventListener('change',e=>{autoSpeak=e.target.checked;if(!autoSpeak)cancelSpeech();});if(!SpeechRecognition)$('space-voice-button').disabled=true;setButton();
}
function watchAnswers(){const host=$('space-answer-text');if(!host||host===observedAnswer)return;observedAnswer=host;let last='';new MutationObserver(()=>{const text=host.textContent.trim();if(text&&text!==last){last=text;setTimeout(()=>speakAnswer(text),0);}}).observe(host,{childList:true,subtree:true,characterData:true});}
function install(){addUI();watchAnswers();if(synth){synth.getVoices();synth.onvoiceschanged=()=>synth.getVoices();}setStatus(SpeechRecognition?'Voice ready':'Speech input unavailable; typing still works.');}
addEventListener('conscience64-ready',()=>{addUI();watchAnswers();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
globalThis.SpaceLensVoice=Object.freeze({speak,start,stop,cancel:cancelSpeech,detectLanguage,translateForVoice,get language(){return currentLang;},get state(){return{phase,submitting,pending:!!pendingTranscript};}});
})();