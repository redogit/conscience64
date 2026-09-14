'use strict';
(() => {
  const root = document;
  const $ = id => root.getElementById(id);
  const state = { xp:0, joy:50, discoveries:0, tokens:0, level:1, role:'Explorer', morph:0, motto:'', activeGame:null, raceTimer:null };
  const log = $('log');
  const apiFrame = $('conscience-companion');
  const apiState = $('conscience-state');
  const plugins = globalThis.Conscience64MMOPlugins || null;
  const saves = globalThis.Conscience64MMOSave || null;
  const pending = new Map();
  const companionForms=['Red-world wanderer','Cosmic glam form','Noir guardian','Impossible geometry','Heroic festival form'];
  let requestSeq = 0;
  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const targetOrigin = location.origin === 'null' ? '*' : location.origin;

  function addLog(text) {
    const li = document.createElement('li');
    li.textContent = text;
    log.prepend(li);
    while (log.children.length > 12) log.lastElementChild.remove();
  }
  function render() {
    $('xp').textContent = state.xp; $('joy').textContent = state.joy; $('discoveries').textContent = state.discoveries;
    $('tokens').textContent = state.tokens; $('level').textContent = state.level; $('role').textContent = state.role;
  }
  function reward({xp=0,joy=0,discoveries=0,tokens=0}, reason) {
    state.xp += xp; state.joy = clamp(state.joy + joy, 0, 100); state.discoveries += discoveries; state.tokens += tokens;
    state.level = 1 + Math.floor(state.xp / 100); render(); if (reason) addLog(reason);
  }
  function renderCompanion() { $('companion-state').textContent=`Form: ${companionForms[state.morph] || companionForms[0]}.`; }

  function apiCall(method, ...args) {
    return new Promise((resolve, reject) => {
      if (!apiFrame || !apiFrame.contentWindow) return reject(new Error('Conscience64 companion frame unavailable'));
      const id = `mmo-${Date.now()}-${++requestSeq}`;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Conscience64 timeout: ${method}`)); }, 4500);
      pending.set(id, {resolve, reject, timeout});
      apiFrame.contentWindow.postMessage({type:'conscience64.api', id, method, args}, targetOrigin);
    });
  }
  addEventListener('message', event => {
    if (apiFrame && event.source !== apiFrame.contentWindow) return;
    const data = event.data;
    if (!data || data.type !== 'conscience64.api.result' || !pending.has(data.id)) return;
    const slot = pending.get(data.id); clearTimeout(slot.timeout); pending.delete(data.id);
    if (data.ok) slot.resolve(data.result); else slot.reject(new Error(data.error || 'Conscience64 API error'));
  });
  async function connectConscience() {
    try {
      const stats = await apiCall('stats');
      apiState.textContent = `Conscience64 connected · ${stats.total} objects · ${stats.projects.count} projects · ${stats.projects.lessonCount || 0} lessons`;
      addLog('Conscience64 companion connected to the public read-only research space.'); return stats;
    } catch (error) {
      apiState.textContent = 'Conscience64 companion unavailable; local game remains playable.';
      addLog(`Conscience64 connection unavailable: ${error.message}`); return null;
    }
  }
  async function conscienceSeed(term) {
    try {
      const out = await apiCall('search.simple', term, {limit:4}); const rows = out?.results || [];
      if (!rows.length) return null; const row = rows[Math.floor(Math.random() * rows.length)];
      return row.label || row.logicalId || row.kind || null;
    } catch { return null; }
  }
  async function recordIRPO(input, action='search.simple') {
    try { return await apiCall('irpo', {I:input,R:{scope:'Conscience64 MMO world event',boundary:'Retrieval is inspiration/context, not independent evidence or prize verification.'},P:{action,options:{limit:4}}}); }
    catch { return null; }
  }

  const weirdEvents = [
    'A three-headed librarian asks for a receipt proving the moon is open.',
    'Every tree votes to become a staircase for exactly eleven seconds.',
    'A monster challenges you to a dance battle and forgets the rules halfway through.',
    'The road changes its name and demands a tiny parade.',
    'A cloud drops seven harmless rubber ducks and one philosophical objection.',
    'The local dragon union declares a mandatory snack interval.',
    'Gravity becomes slightly embarrassed and looks away.'
  ];
  const lifeEvents = {
    walk:['You take the long way around the block. Wet pavement reflects the apartment windows. Nothing supernatural happens, which is almost suspicious.',{xp:3,joy:4}],
    shop:['The market smells like coffee, bread, detergent and somebody’s dinner. You hear a rumor about a service road that was not there yesterday.',{xp:2,joy:5,discoveries:1}],
    workshop:['At the garage you help tighten a loose shelf, borrow a marker, and leave with three better ideas than you arrived with.',{xp:8,joy:5,tokens:1}],
    bus:['The bus is six minutes late. You get a window seat. Two stops later you notice a building whose top floor does not line up with the floors below it.',{xp:4,joy:4,discoveries:1}],
    park:['You sit down and do absolutely nothing productive. Wind moves through the trees. Joy is allowed to count by itself.',{joy:9}],
    neighbor:['You talk with somebody carrying groceries upstairs. They remember your face and mention that the arcade has been louder since Tuesday.',{xp:3,joy:7}]
  };

  async function visitZone(zone) {
    const terms = {monster:'game monsters behavior',race:'movement timing',puzzle:'language pattern',make:'geometry codecs construction',help:'human cooperation practical',fuzz:'black hole quantum physics'};
    const labels = {monster:'Monster District',race:'Impossible Speedway',puzzle:'Cipher Ruins',make:'Maker Quarter',help:'Common Ground',fuzz:'Fuzzball anomaly'};
    $('world-status').textContent = `Entering ${labels[zone] || zone}…`; reward({xp:6,joy:3}, `You entered ${labels[zone] || zone}.`);
    const seed = await conscienceSeed(terms[zone] || zone); await recordIRPO(terms[zone] || zone);
    if (seed) { reward({discoveries:1}, `Conscience64 surfaced “${seed}” as a world-event seed. Related context only; no research claim promoted.`); $('world-status').textContent = `${labels[zone]} shifted around a Conscience64 research seed.`; }
    else $('world-status').textContent = `${labels[zone]} is open. The local world improvised without a research seed.`;
  }

  function setPlayfield(title, prompt) { state.activeGame = title; $('game-title').textContent=title; $('game-prompt').textContent=prompt; $('game-result').textContent=''; $('game-controls').replaceChildren(); }
  function button(label, action) { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.addEventListener('click',action); $('game-controls').appendChild(b); return b; }
  function monsterGame() {
    const moods=['GRUMPY','CONFUSED','DELIGHTED','SUSPICIOUS'], mood=moods[Math.floor(Math.random()*moods.length)];
    setPlayfield('Monster Mood',`The monster is ${mood}. Match its mood before it mutates.`);
    moods.forEach(m=>button(m,()=>{ if(m===mood){$('game-result').textContent='Perfect read. The monster gives you a completely unnecessary trophy.';reward({xp:18,joy:8,tokens:2},'Won Monster Mood.');} else {$('game-result').textContent=`Wrong mood. It was ${mood}. The monster respects the attempt anyway.`;reward({xp:5,joy:2},'Monster Mood attempt recorded without punishment.');} $('game-controls').replaceChildren(); }));
  }
  function raceGame() {
    setPlayfield('Redline','Wait for GO, or choose the untimed route if reaction speed is not how you want to play.');
    const go=button('WAIT…',()=>{ if(go.dataset.ready==='1'){const elapsed=performance.now()-Number(go.dataset.start);$('game-result').textContent=`Reaction: ${Math.round(elapsed)} ms. The road grudgingly approves.`;reward({xp:24,joy:7,tokens:2},'Finished a Redline reaction race.');} else {$('game-result').textContent='False start. The road laughs politely.';reward({xp:3,joy:1},'Redline false start: no loss, try again later.');} clearTimeout(state.raceTimer);$('game-controls').replaceChildren(); });
    button('Use untimed route',()=>{
      clearTimeout(state.raceTimer);
      setPlayfield('Redline — untimed route','No reaction timer. The signal is green, the road is clear, and you can enter when you are ready.');
      button('Enter when ready',()=>{$('game-result').textContent='You enter cleanly at your own pace. Same world, different interaction.';reward({xp:12,joy:6,tokens:1},'Finished Redline using the untimed route.');$('game-controls').replaceChildren();});
      button('Keep waiting',()=>{$('game-result').textContent='You wait. There is no penalty and no timer pushing you forward.';});
    });
    state.raceTimer=setTimeout(()=>{go.textContent='GO!';go.dataset.ready='1';go.dataset.start=String(performance.now());},900+Math.random()*1800);
  }
  function puzzleGame() {
    const puzzles=[{q:'2 · 4 · 8 · ?',a:'16'},{q:'A · C · E · ?',a:'G'},{q:'◆ ● ◆ ● ?',a:'◆'}], p=puzzles[Math.floor(Math.random()*puzzles.length)];
    setPlayfield('Cipher Snap',`Complete the sequence: ${p.q}`); const input=document.createElement('input');input.type='text';input.maxLength=20;input.setAttribute('aria-label','Cipher answer');$('game-controls').appendChild(input);
    button('Solve',()=>{if(input.value.trim().toUpperCase()===p.a.toUpperCase()){$('game-result').textContent='Correct. A wall opens and immediately pretends it was always a door.';reward({xp:20,joy:6,tokens:2,discoveries:1},'Solved a Cipher Snap puzzle.');}else{$('game-result').textContent=`Not this time. Answer: ${p.a}. The clue remains yours.`;reward({xp:5,joy:2},'Cipher attempt recorded; answer revealed so play can continue.');}$('game-controls').replaceChildren();});
  }
  function makeGame() {
    const materials=['rubber duck','broken compass','solar spoon','singing bolt','cardboard star','tiny wheel'], needs=['help someone carry water','make waiting less boring','signal a friend','move something awkward','teach a pattern','make a monster laugh'];
    const m1=materials[Math.floor(Math.random()*materials.length)],m2=materials[Math.floor(Math.random()*materials.length)],need=needs[Math.floor(Math.random()*needs.length)];
    setPlayfield('Make Something',`Use “${m1}” + “${m2}” to ${need}. Give the invention a name.`);const input=document.createElement('input');input.type='text';input.maxLength=80;input.placeholder='Invention name';input.setAttribute('aria-label','Invention name');$('game-controls').appendChild(input);
    button('Build it',()=>{const name=input.value.trim()||'Unnamed Contraption';$('game-result').textContent=`${name} exists in the local chronicle. Usefulness remains wonderfully unverified.`;reward({xp:16,joy:10,tokens:2,discoveries:1},`Built ${name} from ridiculous constraints.`);$('game-controls').replaceChildren();});
  }
  const games={monster:monsterGame,race:raceGame,puzzle:puzzleGame,make:makeGame};

  function finishPlugin(plugin, message) {
    $('game-result').textContent = message;
    reward(plugin.reward, `Completed local plug-in “${plugin.name}”. Local result only; no multiplayer or prize authority.`);
    $('game-controls').replaceChildren();
  }
  function playPlugin(plugin) {
    if (!plugins) return;
    let safe;
    try { safe = plugins.validate(plugin); } catch (error) { $('plugin-status').textContent = `Plug-in rejected: ${error.message}`; return; }
    setPlayfield(safe.name, safe.prompt);
    if (safe.mechanic === 'choice') {
      safe.choices.forEach((choice, index) => button(choice, () => {
        if (index === safe.correctIndex) finishPlugin(safe, 'Completed. The cabinet records a local success.');
        else $('game-result').textContent = 'Not this one. Nothing is lost; try another answer.';
      }));
    } else if (safe.mechanic === 'input') {
      const input=document.createElement('input'); input.type='text'; input.maxLength=120; input.setAttribute('aria-label',`${safe.name} answer`); $('game-controls').appendChild(input);
      button('Check',()=>{
        const value=input.value.trim().toLowerCase();
        if (safe.answers.some(answer=>answer.toLowerCase()===value)) finishPlugin(safe,'Accepted. The cabinet records a local success.');
        else $('game-result').textContent='Not accepted by this recipe. Try again.';
      });
    } else if (safe.mechanic === 'creative') {
      const input=document.createElement('input'); input.type='text'; input.maxLength=120; input.placeholder='Name what you made'; input.setAttribute('aria-label',`${safe.name} creation`); $('game-controls').appendChild(input);
      button('Complete',()=>{
        const value=input.value.trim();
        if (!value) { $('game-result').textContent='Give your result a name first.'; return; }
        finishPlugin(safe,`Created locally: ${value}.`);
      });
    }
  }
  function refreshPlugins() {
    const shelf=$('plugin-games'), status=$('plugin-status');
    if (!shelf || !status) return;
    shelf.replaceChildren();
    if (!plugins) { status.textContent='Plug-in runtime unavailable; built-in arcade remains playable.'; return; }
    const rows=plugins.list();
    if (!rows.length) { status.textContent='Nothing installed yet. Build or import a data-only game in Arcade Forge.'; return; }
    for (const plugin of rows) {
      const article=document.createElement('article'); article.className='game-card';
      const copy=document.createElement('div'); const kind=document.createElement('small'); kind.textContent='LOCAL PLUG-IN';
      const title=document.createElement('h3'); title.textContent=plugin.name;
      const desc=document.createElement('p'); desc.textContent=plugin.description || `${plugin.mechanic} mini-game · ${plugin.id}`;
      const play=document.createElement('button'); play.type='button'; play.textContent='Play'; play.addEventListener('click',()=>playPlugin(plugin));
      copy.append(kind,title,desc); article.append(copy,play); shelf.appendChild(article);
    }
    status.textContent=`${rows.length} validated local plug-in${rows.length===1?'':'s'} ready. Local-only; not multiplayer or prize authority.`;
  }

  function snapshotState() {
    return {
      xp:state.xp, joy:state.joy, discoveries:state.discoveries, tokens:state.tokens,
      role:state.role, morph:state.morph, motto:state.motto,
      chronicle:[...log.children].map(li=>li.textContent).slice(0,12)
    };
  }
  function applySave(doc) {
    if (!saves) throw new Error('save runtime unavailable');
    const safe=saves.validate(doc), data=safe.state;
    state.xp=data.xp; state.joy=data.joy; state.discoveries=data.discoveries; state.tokens=data.tokens;
    state.role=data.role; state.morph=data.morph; state.motto=data.motto; state.level=1+Math.floor(state.xp/100);
    $('role-select').value=state.role; $('motto').value=state.motto; render(); renderCompanion();
    log.replaceChildren();
    if(data.chronicle.length){
      for(const text of data.chronicle){const li=document.createElement('li');li.textContent=text;log.appendChild(li);}
    } else addLog('Loaded a local save with an empty chronicle.');
    return safe;
  }
  function setSaveStatus(text,error=false){const el=$('save-status');if(!el)return;el.textContent=text;el.style.color=error?'#e59097':'';}
  function downloadSave(doc){
    const blob=new Blob([saves.exportSave(doc)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='conscience64-mmo-save.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  $('enter-world').addEventListener('click',()=>{$('street-title').scrollIntoView({behavior:'smooth',block:'start'});reward({xp:2,joy:4},'You stepped outside into Mercer & Red Street.');});
  $('random-event').addEventListener('click',async()=>{const event=weirdEvents[Math.floor(Math.random()*weirdEvents.length)],seed=await conscienceSeed('play creativity strange world');reward({joy:5,xp:3},seed?`${event} Conscience64 also surfaced “${seed}” as optional context.`:event);});
  root.querySelectorAll('[data-life]').forEach(b=>b.addEventListener('click',()=>{const [text,gain]=lifeEvents[b.dataset.life]||['You spend some time in the neighborhood.',{joy:2}];$('life-status').textContent=text;reward(gain,text);}));
  if($('observe-sky')) $('observe-sky').addEventListener('click',async()=>{const seed=await conscienceSeed('black hole stars galaxy astronomy');const text=seed?`You compare the in-game reconstruction with real astronomy notes. Conscience64 surfaced “${seed}” as related context, not telescope evidence.`:'You look up at a dense field of stars and compare it with the labeled reconstruction. The ring is illustrative; the linked EHT/NASA observations are the evidence source.';$('sky-status').textContent=text;reward({xp:6,joy:8,discoveries:1},text);});
  root.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>visitZone(b.dataset.zone)));
  root.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>games[b.dataset.game]?.()));
  $('shuffle-games').addEventListener('click',()=>{const cards=[...root.querySelectorAll('.game-card')];cards.sort(()=>Math.random()-.5).forEach(c=>c.parentNode.appendChild(c));reward({joy:2},'The arcade rearranged itself.');});
  if($('refresh-plugins')) $('refresh-plugins').addEventListener('click',refreshPlugins);
  addEventListener('storage',event=>{if(plugins && event.key===plugins.storageKey) refreshPlugins();});
  addEventListener('pageshow',refreshPlugins);
  $('save-identity').addEventListener('click',()=>{state.role=$('role-select').value;state.motto=$('motto').value.trim();render();addLog(`Today you are a ${state.role}${state.motto?`: “${state.motto}”`:'.'}`);});
  $('morph').addEventListener('click',()=>{state.morph=(state.morph+1)%companionForms.length;renderCompanion();reward({joy:3},`Private shapeshifter changed to ${companionForms[state.morph]}.`);});

  if($('save-local')) $('save-local').addEventListener('click',()=>{try{if(!saves)throw new Error('save runtime unavailable');const doc=saves.save(snapshotState());setSaveStatus(`Saved locally at ${new Date(doc.savedAt).toLocaleString()}.`);}catch(error){setSaveStatus(error.message,true);}});
  if($('load-local')) $('load-local').addEventListener('click',()=>{try{if(!saves)throw new Error('save runtime unavailable');const doc=saves.load();if(!doc){setSaveStatus('No local saved copy exists yet.');return;}applySave(doc);setSaveStatus(`Loaded local save from ${new Date(doc.savedAt).toLocaleString()}. Local state only.`);}catch(error){setSaveStatus(`Load rejected: ${error.message}`,true);}});
  if($('export-save')) $('export-save').addEventListener('click',()=>{try{if(!saves)throw new Error('save runtime unavailable');const doc=saves.documentFor(snapshotState());downloadSave(doc);setSaveStatus('Portable save exported. It is local player data, not multiplayer or prize proof.');}catch(error){setSaveStatus(error.message,true);}});
  if($('import-save')) $('import-save').addEventListener('change',async()=>{const input=$('import-save'),file=input.files[0];if(!file)return;try{if(!saves)throw new Error('save runtime unavailable');if(file.size>131072)throw new Error('save file too large');const doc=saves.parse(await file.text());applySave(doc);setSaveStatus('Imported save loaded into this run. It was not automatically stored as the local saved copy.');}catch(error){setSaveStatus(`Import rejected: ${error.message}`,true);}finally{input.value='';}});
  if($('clear-save')) $('clear-save').addEventListener('click',()=>{try{if(!saves)throw new Error('save runtime unavailable');saves.clear();setSaveStatus('Saved browser copy cleared. Current run is unchanged.');}catch(error){setSaveStatus(error.message,true);}});

  $('reset').addEventListener('click',()=>{state.xp=0;state.joy=50;state.discoveries=0;state.tokens=0;state.level=1;state.role='Explorer';state.morph=0;state.motto='';render();renderCompanion();$('role-select').value='Explorer';$('motto').value='';log.replaceChildren();addLog('Local run reset. The world remembers nothing except that restarting is allowed.');$('game-title').textContent='Pick a game.';$('game-prompt').textContent='The arcade is waiting.';$('game-controls').replaceChildren();$('game-result').textContent='';if($('life-status'))$('life-status').textContent='The block is alive. Nothing demands your attention yet.';if($('sky-status'))$('sky-status').textContent='The roof is quiet. The sky is not.';setSaveStatus('Current run reset. Any separately saved browser copy remains until you clear or replace it.');});

  render(); renderCompanion(); refreshPlugins(); if(apiFrame) apiFrame.addEventListener('load',connectConscience,{once:true});
})();
