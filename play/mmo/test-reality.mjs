import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [index, style, forge, forgeJs, gameJs, current, canon, linkages, linkagesJsonText, projectsText, sampleText, contractText] = await Promise.all([
  read('index.html'), read('style.css'), read('forge.html'), read('forge.js'), read('game.js'), read('CURRENT.md'), read('REALITY_CANON.md'), read('LINKAGES.md'), read('linkages.json'), read('../projects.json'), read('plugins/duck-rescue.json'), read('plugin-contract.json')
]);

assert.match(current, /implemented now/i);
assert.match(current, /TEST_CONFIGURED != TEST_OBSERVED_PASSING/);
assert.match(current, /Not implemented yet/i);
assert.match(current, /CURRENT\.md → REALITY_CANON\.md/);
assert.match(canon, /real before it becomes impossible/i);
assert.match(canon, /OBSERVATION != PROCESSED_SCIENCE_IMAGE != GAME_RECONSTRUCTION/);
assert.match(canon, /older MMO aesthetic or content note conflicts.*this file wins/is);
assert.match(canon, /Event Horizon Telescope M87\*/);
assert.match(canon, /James Webb Space Telescope/);
assert.match(index, /CURRENT\.md/);
assert.match(index, /Mercer &amp; Red Street/);
assert.match(index, /IN-GAME RECONSTRUCTION · NOT TELESCOPE DATA/);
assert.match(index, /Roof observatory/i);
assert.match(index, /World time and conditions are fictional game state/i);
assert.match(index, /eventhorizontelescope\.org/);
assert.match(index, /science\.nasa\.gov/);
assert.match(index, /plugin-runtime\.js/);
assert.match(index, /Locally installed cabinets/);
assert.match(index, /id="plugin-games"/);
assert.match(style, /--brick:/); assert.match(style, /--concrete:/); assert.match(style, /\.street-scene/); assert.match(style, /\.sky-window/); assert.match(style, /\.black-hole/);
assert.match(forge, /ordinary place\/object\/activity first/i); assert.match(forge, /MAKER GARAGE/);
assert.match(forgeJs, /corner market/); assert.match(forgeJs, /bus stop/); assert.match(forgeJs, /rooftop observatory/); assert.doesNotMatch(forgeJs, /Floating Library/);
assert.match(gameJs, /Conscience64MMOPlugins/);
assert.match(gameJs, /refreshPlugins/);
assert.match(gameJs, /plugins\.validate/);
assert.match(gameJs, /Completed local plug-in/);
assert.match(gameJs, /no multiplayer or prize authority/i);
assert.match(linkages, /Load order/i); assert.match(linkages, /CURRENT\.md/); assert.match(linkages, /canonical reality chain/i); assert.match(linkages, /REALITY_CANON\.md/);
const linkageGraph = JSON.parse(linkagesJsonText);
assert.ok(linkageGraph.nodes.some(node=>node.id==='current-state' && node.path==='CURRENT.md'));
assert.ok(linkageGraph.edges.some(edge=>edge.from==='current-state' && edge.to==='release-plan' && edge.relation==='distinguishes-current-from-roadmap'));
assert.ok(linkageGraph.invariants.includes('TEST_CONFIGURED != TEST_OBSERVED_PASSING'));
const projects = JSON.parse(projectsText); const mmo = projects.projects.find(project => project.id === 'mmo'); assert.ok(mmo); assert.equal(mmo.source, 'mmo/REALITY_CANON.md'); assert.match(mmo.purpose, /grounded real-world-feeling/i);
const sample = JSON.parse(sampleText); assert.equal(sample.schema, 'conscience64.mmo.plugin/v1'); assert.match(sample.prompt, /corner market|market display/i); assert.match(sample.description, /grounded-reality-first/i);
const contract = JSON.parse(contractText); assert.equal(contract.contentDirection.canonical, 'REALITY_CANON.md'); assert.equal(contract.contentDirection.anomalyRequired, false);
console.log('PASS MMO reality canon: current-state boundary, grounded world, astronomy boundary, Forge generation, main-MMO plug-in discovery, plug-in contract, registry and linkages');
