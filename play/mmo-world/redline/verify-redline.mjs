import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const cooperation = readJson('play/mmo-world/redline/cooperation.json');
assert(cooperation.schema === 'conscience64.redline.cooperation/v1', 'unexpected cooperation schema');
assert(cooperation.scope === 'redogit/conscience64 play/mmo-world Redline only', 'Redline scope drift');
assert(cooperation.separateCompassRepository === false, 'Compass must remain an in-repository cooperating surface');

const participantIds = new Set(cooperation.participants.map((participant) => participant.id));
for (const required of ['redline-runtime', 'master', 'compass', 'library-orbit', 'reality-canon', 'visual-library']) {
  assert(participantIds.has(required), `missing cooperation participant: ${required}`);
}
for (const participant of cooperation.participants) {
  for (const relative of participant.paths) {
    assert(exists(relative), `cooperation path missing: ${relative}`);
  }
}

const materials = readJson('play/mmo-world/redline/materials.json');
assert(materials.schema === 'conscience64.redline.character-materials/v1', 'unexpected materials schema');
assert(materials.characterId === 'redline-shapeshifter', 'material character ID drift');
for (const channel of ['baseColor', 'normal', 'roughness', 'metallic', 'ao', 'height', 'emissive', 'opacity']) {
  assert(materials.pbrChannels.includes(channel), `missing PBR channel: ${channel}`);
}
for (const family of ['skin', 'hair', 'technicalFabric', 'leatherAndCoatedTextile', 'metalHardware', 'glassAndVisor', 'redlineEmissive']) {
  assert(materials.families[family], `missing material family: ${family}`);
}
assert(materials.rules.preferReusableMasks === true, 'reusable-mask policy must remain enabled');
assert(materials.rules.wetDryStatesRequired === true, 'wet/dry states must remain required');
assert(materials.rules.darkSceneReadabilityRequired === true, 'dark-scene readability must remain required');

const states = readJson('play/mmo-world/redline/shapeshifter-states.json');
assert(states.schema === 'conscience64.redline.shapeshifter-states/v1', 'unexpected shapeshifter schema');
assert(states.characterId === 'redline-shapeshifter', 'state character ID drift');
assert(states.fictional === true, 'character must remain explicitly fictional');
assert(states.identityClaim === false, 'identity claims are not permitted');
assert(states.reversible === true, 'state system must remain reversible');
for (const guard of ['noRealPersonIdentityInference', 'noBiometricReplicationRequirement', 'noSensitiveTraitInference', 'allStateChangesAuthoredFiction', 'deterministicTransitionIDs']) {
  assert(states.constraints[guard] === true, `missing shapeshifter guard: ${guard}`);
}
const stateIds = states.states.map((state) => state.id);
assert(new Set(stateIds).size === stateIds.length, 'duplicate shapeshifter state IDs');
const knownStates = new Set(stateIds);
for (const transition of states.transitions) {
  assert(knownStates.has(transition.from), `unknown transition source: ${transition.from}`);
  assert(knownStates.has(transition.to), `unknown transition target: ${transition.to}`);
  assert(transition.reversible === true, `transition must remain reversible: ${transition.from}->${transition.to}`);
}

const redline = readJson('play/mmo-world/plugins/redline-classic.json');
assert(redline.schema === 'conscience64.mmo.plugin/v1', 'Redline plugin schema drift');
assert(redline.id === 'redline-classic', 'Redline plugin ID drift');
assert(redline.mechanic === 'timing', 'Redline timing mechanic drift');
assert(redline.minDelayMs === 900 && redline.maxDelayMs === 2700, 'Redline source timing bounds drift');
assert(!Object.hasOwn(redline, 'reactionThreshold'), 'reaction threshold must not become a progression/accessibility gate');

const gallery = readJson('play/mmo/simple/visual-samples/manifest.json');
assert(Array.isArray(gallery.invariants) && gallery.invariants.includes('REFERENCE != IDENTITY'), 'gallery identity boundary missing');
assert(gallery.videoCount === 0, 'current ingestion snapshot video count changed; update dossier and verification deliberately');
const generatedCharacterStudies = gallery.samples.filter((sample) => ['generated-neon-noir-agent', 'generated-shapeshifter-dossier'].includes(sample.id));
assert(generatedCharacterStudies.length === 2, 'expected generated character studies are missing');
for (const sample of generatedCharacterStudies) {
  assert(sample.kind === 'generated_concept', `${sample.id} must remain a generated concept`);
  assert(sample.canon === false, `${sample.id} must not silently become canon`);
  assert(sample.identityClaim === false, `${sample.id} must not carry an identity claim`);
}

for (const requiredPath of [
  'play/mmo/REALITY_CANON.md',
  'space-lens-master.js',
  'coordinate-space/coordinate_runtime.py',
  'coordinate-space/release_manifest.json',
  'play/orbit/index.html',
  'research/projects/orbit-library.md',
  'play/mmo-world/timing-runtime.mjs',
  'play/mmo-world/redline/REFERENCE_DOSSIER.md'
]) {
  assert(exists(requiredPath), `required cooperation surface missing: ${requiredPath}`);
}

console.log(`PASS redline-character-cooperation states=${states.states.length} participants=${participantIds.size} galleryImages=${gallery.imageCount} videos=${gallery.videoCount}`);
