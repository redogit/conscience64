import { PLUGIN_SCHEMA, createPluginShelf, exportPlugin, parsePluginJson, validatePlugin } from '../plugin-runtime.mjs';

const $ = id => document.getElementById(id);
const rewards = Object.freeze({
  small: Object.freeze({ xp: 8, joy: 4, tokens: 0, discoveries: 0 }),
  medium: Object.freeze({ xp: 16, joy: 8, tokens: 1, discoveries: 0 }),
  big: Object.freeze({ xp: 30, joy: 15, tokens: 2, discoveries: 1 }),
});
let current = null;
let shelf = null;

function setStatus(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function lines(id) {
  return $(id).value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
}
function slug(value) {
  return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'new-game';
}
function recipe() {
  const mechanic = $('mechanic').value;
  const base = {
    schema: PLUGIN_SCHEMA,
    id: $('id').value.trim(),
    name: $('name').value.trim(),
    version: '1.0.0',
    mechanic,
    prompt: $('prompt').value.trim(),
    reward: rewards[$('reward').value],
  };
  if (mechanic === 'choice') {
    base.choices = lines('choices');
    base.correctIndex = 0;
  } else if (mechanic === 'input') {
    base.answers = lines('answers');
  }
  return validatePlugin(base);
}
function rewardText(plugin) {
  const reward = plugin.reward;
  return `Preview reward only — XP ${reward.xp}, Joy ${reward.joy}, tokens ${reward.tokens}, discoveries ${reward.discoveries}. This does not change canonical MMO World state.`;
}
function renderTester(plugin) {
  current = plugin;
  $('preview-title').textContent = plugin.name;
  $('preview-prompt').textContent = plugin.prompt;
  $('preview-reward').textContent = rewardText(plugin);
  $('tester').replaceChildren();
  $('test-result').textContent = '';

  if (plugin.mechanic === 'choice') {
    plugin.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.addEventListener('click', () => {
        $('test-result').textContent = index === plugin.correctIndex ? 'Success in this local preview.' : 'Not this one. Try another.';
      });
      $('tester').appendChild(button);
    });
  } else if (plugin.mechanic === 'input') {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 120;
    input.setAttribute('aria-label', 'Plug-in answer');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Check answer';
    button.addEventListener('click', () => {
      const answer = input.value.normalize('NFC').trim().toLocaleLowerCase('en-US');
      const accepted = plugin.answers.some(value => value.normalize('NFC').trim().toLocaleLowerCase('en-US') === answer);
      $('test-result').textContent = accepted ? 'Accepted in this local preview.' : 'Not accepted by this recipe.';
    });
    $('tester').append(input, button);
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 120;
    input.placeholder = 'Name what you made';
    input.setAttribute('aria-label', 'Creative result');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Complete preview';
    button.addEventListener('click', () => {
      const value = input.value.trim();
      $('test-result').textContent = value ? `Created locally: ${value}` : 'Give it a name first.';
    });
    $('tester').append(input, button);
  }
}
function ensureShelf() {
  if (shelf) return shelf;
  try {
    shelf = createPluginShelf(globalThis.localStorage);
    return shelf;
  } catch (error) {
    throw new Error(`Local shelf unavailable: ${error.message}`);
  }
}
function refreshShelf() {
  const list = $('installed');
  list.replaceChildren();
  try {
    const rows = ensureShelf().list();
    if (!rows.length) {
      const item = document.createElement('li');
      item.textContent = 'No local plug-ins installed yet.';
      list.appendChild(item);
      return;
    }
    for (const plugin of rows) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = plugin.name;
      const detail = document.createTextNode(` · ${plugin.mechanic} · ${plugin.id} `);
      const test = document.createElement('button');
      test.type = 'button';
      test.textContent = 'Test';
      test.addEventListener('click', () => renderTester(plugin));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        try {
          ensureShelf().remove(plugin.id);
          refreshShelf();
          setStatus(`Removed ${plugin.name} from this browser profile.`);
        } catch (error) { setStatus(error.message, true); }
      });
      item.append(name, detail, test, ' ', remove);
      list.appendChild(item);
    }
  } catch (error) {
    const item = document.createElement('li');
    item.textContent = error.message;
    list.appendChild(item);
    setStatus(error.message, true);
  }
}
function download(plugin) {
  const blob = new Blob([exportPlugin(plugin)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `${plugin.id}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

$('mechanic').addEventListener('change', () => {
  $('choice-field').hidden = $('mechanic').value !== 'choice';
  $('answer-field').hidden = $('mechanic').value !== 'input';
});
$('name').addEventListener('input', () => {
  if (!$('id').dataset.manual) $('id').value = slug($('name').value);
});
$('id').addEventListener('input', () => { $('id').dataset.manual = '1'; });
$('build').addEventListener('click', () => {
  try {
    const plugin = recipe();
    renderTester(plugin);
    setStatus('Recipe validated. Test it below; no canonical game state was changed.');
  } catch (error) { setStatus(error.message, true); }
});
$('install').addEventListener('click', () => {
  try {
    const plugin = ensureShelf().install(recipe());
    renderTester(plugin);
    refreshShelf();
    setStatus(`Installed ${plugin.name} in this browser profile only.`);
  } catch (error) { setStatus(error.message, true); }
});
$('export').addEventListener('click', () => {
  try {
    download(recipe());
    setStatus('Validated plug-in JSON exported.');
  } catch (error) { setStatus(error.message, true); }
});
$('import').addEventListener('change', async () => {
  const file = $('import').files?.[0];
  if (!file) return;
  try {
    const plugin = parsePluginJson(await file.text());
    ensureShelf().install(plugin);
    renderTester(plugin);
    refreshShelf();
    setStatus(`Imported ${plugin.name} as data-only local content.`);
  } catch (error) {
    setStatus(`Import rejected: ${error.message}`, true);
  } finally {
    $('import').value = '';
  }
});
$('refresh').addEventListener('click', refreshShelf);
$('randomize').addEventListener('click', () => {
  const settings = ['corner market','bus stop','maker garage','city park','community garden','small arcade'];
  const actions = ['repair','deliver','sort','match','build','identify'];
  const objects = ['loose shelf','grocery bag','broken bicycle light','toolbox','bus timetable','garden hose'];
  const anomalies = ['', ' while one object keeps moving when nobody touches it', ' while one sign changes a single word', ' during a brief gravity anomaly'];
  const pick = rows => rows[Math.floor(Math.random() * rows.length)];
  const setting = pick(settings), action = pick(actions), object = pick(objects), anomaly = pick(anomalies);
  const title = `${action[0].toUpperCase()}${action.slice(1)} at the ${setting}`;
  $('name').value = title;
  $('id').dataset.manual = '';
  $('id').value = slug(title);
  $('mechanic').value = 'creative';
  $('mechanic').dispatchEvent(new Event('change'));
  $('prompt').value = `At the ${setting}, ${action} the ${object}${anomaly}. Give your solution or method a name.`;
  setStatus(anomaly ? 'Grounded recipe loaded with one optional anomaly.' : 'Grounded ordinary-life recipe loaded.');
});

refreshShelf();
