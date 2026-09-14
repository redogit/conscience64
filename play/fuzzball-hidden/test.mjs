import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HUMANOID_TYPES,createWorld,updateHumanoid} from './world.mjs';
const html=await readFile(new URL('index.html',import.meta.url),'utf8');
assert.match(html,/Fuzzball Hidden Game · Alpha/);assert.match(html,/noindex,nofollow/);assert.match(html,/humanoid creatures/i);
const world=createWorld(640064),again=createWorld(640064);assert.equal(world.humanoids.length,16);assert.equal(world.fuzzballs.length,22);assert.deepEqual(world.humanoids,again.humanoids);assert.deepEqual(Object.keys(HUMANOID_TYPES),['mosswalker','glasskin','emberkin','duskseer']);
for(const h of world.humanoids){const before={x:h.x,y:h.y};updateHumanoid(h,1,.016,{x:900,y:550});assert.ok(Number.isFinite(h.x)&&Number.isFinite(h.y));assert.ok(h.x!==before.x||h.y!==before.y);}
console.log('PASS Fuzzball Hidden Game alpha: deterministic world, humanoid families, hidden/noindex release surface.');
