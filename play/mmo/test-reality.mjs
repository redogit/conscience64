import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [index, style, forge, forgeJs, canon, linkages, projectsText, sampleText] = await Promise.all([
  read('index.html'),
  read('style.css'),
  read('forge.html'),
  read('forge.js'),
  read('REALITY_CANON.md'),
  read('LINKAGES.md'),
  read('../projects.json'),
  read('plugins/duck-rescue.json')
]);

assert.match(canon, /real before it becomes impossible/i);
assert.match(canon, /OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION/);
assert.match(canon, /older MMO aesthetic or content note conflicts.*this file wins/is);
assert.match(canon, /Event Horizon Telescope M87\*/);
assert.match(canon, /James Webb Space Telescope/);

assert.match(index, /Mercer &amp; Red Street/);
assert.match(index, /IN-GAME RECONSTRUCTION · NOT TELESCOPE DATA/);
assert.match(index, /Roof observatory/i);
assert.match(index, /World time and conditions are fictional game state/i);
assert.match(index, /eventhorizontelescope\.org/);
assert.match(index, /science\.nasa\.gov/);

assert.match(style, /--brick:/);
assert.match(style, /--concrete:/);
assert.match(style, /\.street-scene/);
assert.match(style, /\.sky-window/);
assert.match(style, /\.black-hole/);

assert.match(forge, /ordinary place\/object\/activity first/i);
assert.match(forge, /MAKER GARAGE/);
assert.match(forgeJs, /corner market/);
assert.match(forgeJs, /bus stop/);
assert.match(forgeJs, /rooftop observatory/);
assert.doesNotMatch(forgeJs, /Floating Library/);

assert.match(linkages, /canonical reality chain/i);
assert.match(linkages, /REALITY_CANON\.md/);

const projects = JSON.parse(projectsText);
const mmo = projects.projects.find(project => project.id === 'mmo');
assert.ok(mmo, 'MMO registry entry missing');
assert.equal(mmo.source, 'mmo/REALITY_CANON.md');
assert.match(mmo.purpose, /grounded real-world-feeling/i);

const sample = JSON.parse(sampleText);
assert.equal(sample.schema, 'conscience64.mmo.plugin/v1');
assert.match(sample.prompt, /corner market|market display/i);
assert.match(sample.description, /grounded-reality-first/i);

console.log('PASS MMO reality canon: grounded world, astronomy boundary, Forge generation, registry and linkages');
