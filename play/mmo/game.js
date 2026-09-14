'use strict';
(() => {
  const root = document;
  const $ = id => root.getElementById(id);
  const state = { xp:0, joy:50, discoveries:0, tokens:0, level:1, role:'Explorer', morph:0, activeGame:null, raceTimer:null };
  const log = $('log');
  const apiFrame = $('conscience-companion');
  const apiState = $('conscience-state');
  const pending = new Map();
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
    $('xp').textContent = state.xp;
    $('joy').textContent = state.joy;
    $('discoveries').textContent = state.discoveries;
    $('tokens').textContent = state.tokens;
    $('level').textContent = state.level;
    $('role').textContent = state.role;
  }

  function reward({xp=0,joy=0,discoveries=0,tokens=0}, reason) {
    state.xp += xp;
    state.joy = clamp(state.joy + joy, 0, 100);
    state.discoveries += discoveries;
    state.tokens += tokens;
    state.level = 1 + Math.floor(state.xp / 100);
    render();
    if (reason) addLog(reason);
  }

  function apiCall(method, ...args) {
    return new Promise((resolve, reject) => {
      if (!apiFrame || !apiFrame.contentWindow) return reject(new Error('Conscience64 companion frame unavailable'));
      const id = `mmo-${Date.now()}-${++requestSeq}`;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Conscience64 timeout: ${method}`));
      }, 4500);
      pending.set(id, {resolve, reject, timeout});
      apiFrame.contentWindow.postMessage({type:'conscience64.api', id, method, args}, targetOrigin);
    });
  }

  addEventListener('message', event => {
    if (apiFrame && event.source !== apiFrame.contentWindow) return;
    const data = event.data;
    if (!data || data.type !== 'conscience64.api.result' || !pending.has(data.id)) return;
    const slot = pending.get(data.id);
    clearTimeout(slot.timeout);
    pending.delete(data.id);
    if (data.ok) slot.resolve(data.result);
    else slot.reject(new Error(data.error || 'Conscience64 API error'));
  });

  async function connectConscience() {
    try {
      const stats = await apiCall('stats');
      apiState.textContent = `Conscience64 connected · ${stats.total} objects · ${stats.projects.count} projects · ${stats.projects.lessonCount || 0} lessons`;
      addLog('Conscience64 companion connected to the public read-only research space.');
      return stats;
    } catch (error) {
      apiState.textContent = 'Conscience64 companion unavailable; local game remains playable.';
      addLog(`Conscience64 connection unavailable: ${error.message}`);
      return null;
    }
  }

  async function conscienceSeed(term) {
    try {
      const out = await apiCall('search.simple', term, {limit:4});
      const rows = out?.results || [];
      if (!rows.length) return null;
      const row = rows[Math.floor(Math.random() * rows.length)];
      return row.label || row.logicalId || row.kind || null;
    } catch { return null; }
  }

  async function recordIRPO(input, action='search.simple') {
    try {
      return await apiCall('irpo', {
        I: input,
        R: {scope:'Conscience64 MMO world event', boundary:'Retrieval is inspiration/context, not independent evidence or prize verification.'},
        P: {action, options:{limit:4}}
      });
    } catch { return null; }
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

  async function visitZone(zone) {
    const terms = {monster:'game monsters behavior',race:'movement timing',puzzle:'language pattern',make:'geometry codecs construction',help:'human cooperation practical',fuzz:'black hole quantum physics'};
    const labels = {monster:'Monster District',race:'Impossible Speedway',puzzle:'Cipher Ruins',make:'Maker Quarter',help:'Common Ground',fuzz:'Fuzzball anomaly'};
    $('world-status').textContent = `Entering ${labels[zone] || zone}…`;
    reward({xp:6,joy:3}, `You entered ${labels[zone] || zone}.`);
    const seed = await conscienceSeed(terms[zone] || zone);
    await recordIRPO(terms[zone] || zone);
    if (seed) {
      reward({discoveries:1}, `Conscience64 surfaced “${seed}” as a world-event seed. Related context only; no research claim promoted.`);
      $('world-status').textContent = `${labels[zone]} shifted around a Conscience64 research seed.`;
    } else {
      $('world-status').textContent = `${labels[zone]} is open. The local world improvised without a research seed.`;
    }
  }

  function setPlayfield(title, prompt) {
    state.activeGame = title;
    $('game-title').textContent = title;
    $('game-prompt').textContent = prompt;
    $('game-result').textContent = '';
    $('game-controls').replaceChildren();
  }

  function button(label, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', action);
    $('game-controls').appendChild(b);
    return b;
  }

  function monsterGame() {
    const moods = ['GRUMPY','CONFUSED','DELIGHTED','SUSPICIOUS'];
    const mood = moods[Math.floor(Math.random()*moods.length)];
    setPlayfield('Monster Mood', `The monster is ${mood}. Match its mood before it mutates.`);
    moods.forEach(m => button(m, () => {
      if (m === mood) {
        $('game-result').textContent = 'Perfect read. The monster gives you a completely unnecessary trophy.';
        reward({xp:18,joy:8,tokens:2}, 'Won Monster Mood.');
      } else {
        $('game-result').textContent = `Wrong mood. It was ${mood}. The monster respects the attempt anyway.`;
        reward({xp:5,joy:2}, 'Monster Mood attempt recorded without punishment.');
      }
      $('game-controls').replaceChildren();
    }));
  }

  function raceGame() {
    setPlayfield('Redline', 'Wait. Do not press GO until the signal changes.');
    const go = button('WAIT…', () => {
      if (go.dataset.ready === '1') {
        const elapsed = performance.now() - Number(go.dataset.start);
        $('game-result').textContent = `Reaction: ${Math.round(elapsed)} ms. The road grudgingly approves.`;
        reward({xp:24,joy:7,tokens:2}, 'Finished a Redline reaction race.');
      } else {
        $('game-result').textContent = 'False start. The road laughs politely.';
        reward({xp:3,joy:1}, 'Redline false start: no loss, try again later.');
      }
      clearTimeout(state.raceTimer); $('game-controls').replaceChildren();
    });
    state.raceTimer = setTimeout(() => {
      go.textContent = 'GO!'; go.dataset.ready='1'; go.dataset.start=String(performance.now());
    }, 900 + Math.random()*1800);
  }

  function puzzleGame() {
    const puzzles = [
      {q:'2 · 4 · 8 · ?', a:'16'},
      {q:'A · C · E · ?', a:'G'},
      {q:'◆ ● ◆ ● ?', a:'◆'}
    ];
    const p = puzzles[Math.floor(Math.random()*puzzles.length)];
    setPlayfield('Cipher Snap', `Complete the sequence: ${p.q}`);
    const input = document.createElement('input'); input.type='text'; input.maxLength=20; input.setAttribute('aria-label','Cipher answer'); $('game-controls').appendChild(input);
    button('Solve', () => {
      if (input.value.trim().toUpperCase() === p.a.toUpperCase()) {
        $('game-result').textContent='Correct. A wall opens and immediately pretends it was always a door.';
        reward({xp:20,joy:6,tokens:2,discoveries:1}, 'Solved a Cipher Snap puzzle.');
      } else {
        $('game-result').textContent=`Not this time. Answer: ${p.a}. The clue remains yours.`;
        reward({xp:5,joy:2}, 'Cipher attempt recorded; answer revealed so play can continue.');
      }
      $('game-controls').replaceChildren();
    });
  }

  function makeGame() {
    const materials=['rubber duck','broken compass','solar spoon','singing bolt','cardboard star','tiny wheel'];
    const needs=['help someone carry water','make waiting less boring','signal a friend','move something awkward','teach a pattern','make a monster laugh'];
    const m1=materials[Math.floor(Math.random()*materials.length)], m2=materials[Math.floor(Math.random()*materials.length)], need=needs[Math.floor(Math.random()*needs.length)];
    setPlayfield('Make Something', `Use “${m1}” + “${m2}” to ${need}. Give the invention a name.`);
    const input=document.createElement('input'); input.type='text'; input.maxLength=80; input.placeholder='Invention name'; input.setAttribute('aria-label','Invention name'); $('game-controls').appendChild(input);
    button('Build it',()=>{
      const name=input.value.trim()||'Unnamed Contraption';
      $('game-result').textContent=`${name} exists in the local chronicle. Usefulness remains wonderfully unverified.`;
      reward({xp:16,joy:10,tokens:2,discoveries:1},`Built ${name} from ridiculous constraints.`);
      $('game-controls').replaceChildren();
    });
  }

  const games={monster:monsterGame,race:raceGame,puzzle:puzzleGame,make:makeGame};

  $('enter-world').addEventListener('click', () => {
    $('world-title').scrollIntoView({behavior:'smooth',block:'start'});
    reward({xp:2,joy:4}, 'You entered the Red Wilds.');
  });
  $('random-event').addEventListener('click', async () => {
    const event = weirdEvents[Math.floor(Math.random()*weirdEvents.length)];
    const seed = await conscienceSeed('play creativity strange world');
    reward({joy:5,xp:3}, seed ? `${event} Conscience64 also surfaced “${seed}” as optional context.` : event);
  });
  root.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>visitZone(b.dataset.zone)));
  root.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>games[b.dataset.game]?.()));
  $('shuffle-games').addEventListener('click',()=>{
    const cards=[...root.querySelectorAll('.game-card')];
    cards.sort(()=>Math.random()-.5).forEach(c=>c.parentNode.appendChild(c));
    reward({joy:2},'The arcade rearranged itself.');
  });
  $('save-identity').addEventListener('click',()=>{
    state.role=$('role-select').value; render();
    const motto=$('motto').value.trim();
    addLog(`Today you are a ${state.role}${motto?`: “${motto}”`:'.'}`);
  });
  $('morph').addEventListener('click',()=>{
    const forms=['Red-world wanderer','Cosmic glam form','Noir guardian','Impossible geometry','Heroic festival form'];
    state.morph=(state.morph+1)%forms.length;
    $('companion-state').textContent=`Form: ${forms[state.morph]}.`;
    reward({joy:3},`Private shapeshifter changed to ${forms[state.morph]}.`);
  });
  $('reset').addEventListener('click',()=>{
    state.xp=0;state.joy=50;state.discoveries=0;state.tokens=0;state.level=1;state.role='Explorer';render();
    log.replaceChildren(); addLog('Local run reset. The world remembers nothing except that restarting is allowed.');
    $('game-title').textContent='Pick a game.'; $('game-prompt').textContent='The arcade is waiting.'; $('game-controls').replaceChildren(); $('game-result').textContent='';
  });

  render();
  if (apiFrame) apiFrame.addEventListener('load', connectConscience, {once:true});
})();
