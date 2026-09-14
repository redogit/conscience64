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
  const starterPack = [
    {
      schema:runtime.schema,id:'market-closing-shift',name:'Market Closing Shift',version:'1.0.0',mechanic:'choice',
      prompt:'Rainwater is running toward a cardboard sidewalk display outside the corner market. What is the safest useful first move?',
      choices:['Move the display onto dry covered ground','Leave it in the walkway','Push it closer to the curb'],correctIndex:0,
      reward:{xp:12,joy:6,tokens:1,discoveries:0},description:'Untimed grounded helping activity at the corner market.'
    },
    {
      schema:runtime.schema,id:'bus-transfer-seven',name:'Bus Transfer',version:'1.0.0',mechanic:'input',
      prompt:'The posted neighborhood map says Route 7 connects Mercer Street to the Maker Quarter. Enter the route number.',
      answers:['7','route 7'],reward:{xp:10,joy:5,tokens:0,discoveries:0},description:'Untimed transit-reading activity using fictional in-game route information.'
    },
    {
      schema:runtime.schema,id:'workshop-sort',name:'Workshop Sort',version:'1.0.0',mechanic:'choice',
      prompt:'The maker garage is closing. A hand tool is lying in the walking path. What is the useful first action?',
      choices:['Put the tool in its marked storage place','Leave it where it is','Hide it behind a box'],correctIndex:0,
      reward:{xp:12,joy:6,tokens:1,discoveries:0},description:'Untimed ordinary workshop organization activity.'
    },
    {
      schema:runtime.schema,id:'observatory-label-check',name:'Observatory Label Check',version:'1.0.0',mechanic:'choice',
      prompt:'The roof display shows an EHT-inspired black-hole view created for the game. Which label preserves the evidence boundary?',
      choices:['In-game reconstruction — not telescope data','Direct photograph from this rooftop','Proof of a new black-hole discovery'],correctIndex:0,
      reward:{xp:10,joy:5,tokens:0,discoveries:1},description:'Untimed astronomy-literacy activity preserving observation versus reconstruction.'
    }
  ];
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
  function installStarterPack(){
    try {
      const installed=starterPack.map(item=>runtime.install(item));
      refresh();
      renderTester(installed[0]);
      status(`Installed Grounded Starter Pack: ${installed.map(p=>p.name).join(', ')}. Open the MMO to play them as local cabinets.`);
    } catch(error) { status(`Starter pack rejected: ${error.message}`,true); }
  }
  $('mechanic').addEventListener('change',()=>{$('choice-field').hidden=$('mechanic').value!=='choice';$('answer-field').hidden=$('mechanic').value!=='input';});
  $('name').addEventListener('input',()=>{if(!$('id').dataset.manual)$('id').value=slug($('name').value);});$('id').addEventListener('input',()=>{$('id').dataset.manual='1';});
  $('build').addEventListener('click',()=>{try{const p=recipe();renderTester(p);status('Recipe validated. Test it below.');}catch(e){status(e.message,true);}});
  $('install').addEventListener('click',()=>{try{const p=runtime.install(recipe());renderTester(p);refresh();status(`Installed ${p.name} locally.`);}catch(e){status(e.message,true);}});
  $('export').addEventListener('click',()=>{try{download(recipe());status('Plug-in exported.');}catch(e){status(e.message,true);}});
  $('import').addEventListener('change',async()=>{const file=$('import').files[0];if(!file)return;try{if(file.size>65536)throw new Error('plugin file too large');const p=runtime.install(JSON.parse(await file.text()));renderTester(p);refresh();status(`Imported and installed ${p.name}.`);}catch(e){status(`Import rejected: ${e.message}`,true);}finally{$('import').value='';}});
  $('refresh').addEventListener('click',refresh);
  const packButton=document.createElement('button');
  packButton.type='button';packButton.id='install-starter-pack';packButton.textContent='Install Grounded Starter Pack';packButton.addEventListener('click',installStarterPack);
  document.querySelector('.actions')?.appendChild(packButton);
  $('randomize').addEventListener('click',()=>{
    const settings=['corner market','bus stop','maker garage','apartment stairwell','city park','school gym','loading dock','rooftop observatory','community garden','small arcade'];
    const actions=['repair','deliver','sort','match','build','identify','carry','teach','find','balance'];
    const objects=['loose shelf','grocery bag','broken bicycle light','toolbox','bus timetable','garden hose','lost glove','star chart','arcade token tray','market display'];
    const anomalies=['',' while one object keeps moving when nobody touches it',' after Fuzzball adds one impossible clue',' while the hallway becomes slightly longer each trip',' as one sign changes a single word',' while a monster politely offers unhelpful advice',' during a brief gravity anomaly'];
    const setting=settings[Math.floor(Math.random()*settings.length)],action=actions[Math.floor(Math.random()*actions.length)],object=objects[Math.floor(Math.random()*objects.length)],anomaly=anomalies[Math.floor(Math.random()*anomalies.length)];
    const title=`${action[0].toUpperCase()+action.slice(1)} at the ${setting}`;
    $('name').value=title;$('id').dataset.manual='';$('id').value=slug(title);$('mechanic').value='creative';$('mechanic').dispatchEvent(new Event('change'));
    $('prompt').value=`At the ${setting}, ${action} the ${object}${anomaly}. Give your solution or method a name.`;
    status(anomaly?'Grounded recipe loaded with one anomaly.':'Grounded ordinary-life recipe loaded.');
  });
  refresh();
})();
