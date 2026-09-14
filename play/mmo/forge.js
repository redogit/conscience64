'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const runtime = globalThis.Conscience64MMOPlugins;
  let current = null;
  const rewards = {
    small:{xp:8,joy:4,tokens:0,discoveries:0},
    medium:{xp:16,joy:8,tokens:1,discoveries:0},
    big:{xp:30,joy:15,tokens:2,discoveries:1}
  };
  function lines(id){return $(id).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
  function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'new-game';}
  function recipe(){
    const mechanic=$('mechanic').value;
    const base={schema:runtime.schema,id:$('id').value.trim(),name:$('name').value.trim(),version:'1.0.0',mechanic,prompt:$('prompt').value.trim(),reward:rewards[$('reward').value]};
    if(mechanic==='choice'){base.choices=lines('choices');base.correctIndex=0;}
    if(mechanic==='input')base.answers=lines('answers');
    return runtime.validate(base);
  }
  function status(t,error=false){$('status').textContent=t;$('status').style.color=error?'#ff9aa4':'var(--green)';}
  function renderTester(plugin){
    current=plugin;$('preview-title').textContent=plugin.name;$('preview-prompt').textContent=plugin.prompt;$('tester').replaceChildren();$('test-result').textContent='';
    if(plugin.mechanic==='choice')plugin.choices.forEach((choice,i)=>{const b=document.createElement('button');b.type='button';b.textContent=choice;b.addEventListener('click',()=>{$('test-result').textContent=i===plugin.correctIndex?'Success.':'Not this one. Try another or keep the idea.';});$('tester').appendChild(b);});
    if(plugin.mechanic==='input'){const input=document.createElement('input');input.type='text';input.setAttribute('aria-label','Plug-in answer');const b=document.createElement('button');b.type='button';b.textContent='Check';b.addEventListener('click',()=>{const v=input.value.trim().toLowerCase();$('test-result').textContent=plugin.answers.some(a=>a.toLowerCase()===v)?'Accepted.':'Not accepted by this recipe.';});$('tester').append(input,b);}
    if(plugin.mechanic==='creative'){const input=document.createElement('input');input.type='text';input.maxLength=120;input.placeholder='Name what you made';input.setAttribute('aria-label','Creative result');const b=document.createElement('button');b.type='button';b.textContent='Complete';b.addEventListener('click',()=>{$('test-result').textContent=input.value.trim()?`Created: ${input.value.trim()}`:'Give it a name first.';});$('tester').append(input,b);}
  }
  function refresh(){const list=$('installed');list.replaceChildren();const rows=runtime.list();if(!rows.length){const li=document.createElement('li');li.textContent='No local plug-ins installed yet.';list.appendChild(li);return;}rows.forEach(p=>{const li=document.createElement('li');const strong=document.createElement('strong');strong.textContent=p.name;const play=document.createElement('button');play.type='button';play.textContent='Test';play.addEventListener('click',()=>renderTester(p));const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.addEventListener('click',()=>{runtime.remove(p.id);refresh();status(`Removed ${p.name}.`);});li.append(strong,' · ',document.createTextNode(`${p.mechanic} · ${p.id} `),play,remove);list.appendChild(li);});}
  function download(plugin){const blob=new Blob([runtime.exportPlugin(plugin)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${plugin.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  $('mechanic').addEventListener('change',()=>{$('choice-field').hidden=$('mechanic').value!=='choice';$('answer-field').hidden=$('mechanic').value!=='input';});
  $('name').addEventListener('input',()=>{if(!$('id').dataset.manual)$('id').value=slug($('name').value);});$('id').addEventListener('input',()=>{$('id').dataset.manual='1';});
  $('build').addEventListener('click',()=>{try{const p=recipe();renderTester(p);status('Recipe validated. Test it below.');}catch(e){status(e.message,true);}});
  $('install').addEventListener('click',()=>{try{const p=runtime.install(recipe());renderTester(p);refresh();status(`Installed ${p.name} locally.`);}catch(e){status(e.message,true);}});
  $('export').addEventListener('click',()=>{try{download(recipe());status('Plug-in exported.');}catch(e){status(e.message,true);}});
  $('import').addEventListener('change',async()=>{const file=$('import').files[0];if(!file)return;try{if(file.size>65536)throw new Error('plugin file too large');const p=runtime.install(JSON.parse(await file.text()));renderTester(p);refresh();status(`Imported and installed ${p.name}.`);}catch(e){status(`Import rejected: ${e.message}`,true);}finally{$('import').value='';}});
  $('refresh').addEventListener('click',refresh);
  $('randomize').addEventListener('click',()=>{const actions=['Race','Repair','Match','Build','Teach','Balance','Escape','Compose'];const objects=['Monster','Rubber Duck','Broken Compass','Singing Rock','Tiny Robot','Floating Library','Fuzzball'];const twists=['while gravity changes','before the monster gets bored','without using the obvious answer','while everything rhymes','with one deliberately useless tool','as the room rotates'];const a=actions[Math.floor(Math.random()*actions.length)],o=objects[Math.floor(Math.random()*objects.length)],t=twists[Math.floor(Math.random()*twists.length)];$('name').value=`${a} the ${o}`;$('id').dataset.manual='';$('id').value=slug($('name').value);$('mechanic').value='creative';$('mechanic').dispatchEvent(new Event('change'));$('prompt').value=`${a} a ${o} ${t}. Give your solution a name.`;status('Fresh ridiculous recipe loaded.');});
  refresh();
})();
