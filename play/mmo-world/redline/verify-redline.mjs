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
for (const required of ['redline-runtime', 'master', 'compass', 'library-orbit', 'reality-canon', 'visual-library', 'child-boundary']) {
  assert(participantIds.has(required), `missing cooperation participant: ${required}`);
}
for (const participant of cooperation.participants) {
  for (const relative of participant.paths) {
    assert(exists(relative), `cooperation path missing: ${relative}`);
  }
}
assert(cooperation.redlineCharacter.child === 'play/mmo-world/redline/child-character.json', 'child character routing drift');

const materials = readJson('play/mmo-world/redline/materials.json');
assert(materials.schema === 'conscience64.redline.character-materials/v1', 'unexpected materials schema');
assert(materials.characterId === 'redline-shapeshifter', 'material character ID drift');
assert(materials.ageClass === 'adult', 'adult material age class drift');
for (const channel of ['baseColor', 'normal', 'roughness', 'metallic', 'ao', 'height', 'emissive', 'opacity']) {
  assert(materials.pbrChannels.includes(channel), `missing PBR channel: ${channel}`);
}
for (const family of ['skin', 'hair', 'technicalFabric', 'leatherAndCoatedTextile', 'metalHardware', 'glassAndVisor', 'redlineEmissive']) {
  assert(materials.families[family], `missing material family: ${family}`);
}
assert(materials.rules.preferReusableMasks === true, 'reusable-mask policy must remain enabled');
assert(materials.rules.wetDryStatesRequired === true, 'wet/dry states must remain required');
assert(materials.rules.darkSceneReadabilityRequired === true, 'dark-scene readability must remain required');
assert(materials.rules.automaticChildInheritance === false, 'adult materials must not automatically inherit to child');
assert(materials.rules.childMaterialsRequireSeparateAgeAppropriateSpecification === true, 'child material specification boundary missing');

const states = readJson('play/mmo-world/redline/shapeshifter-states.json');
assert(states.schema === 'conscience64.redline.shapeshifter-states/v1', 'unexpected shapeshifter schema');
assert(states.characterId === 'redline-shapeshifter', 'state character ID drift');
assert(states.ageClass === 'adult', 'adult shapeshifter age class drift');
assert(states.fictional === true, 'character must remain explicitly fictional');
assert(states.identityClaim === false, 'identity claims are not permitted');
assert(states.reversible === true, 'state system must remain reversible');
for (const guard of ['noRealPersonIdentityInference', 'noBiometricReplicationRequirement', 'noSensitiveTraitInference', 'allStateChangesAuthoredFiction', 'deterministicTransitionIDs', 'childCharacterIsSeparateEntity', 'noAgeTransformBetweenAdultAndChild']) {
  assert(states.constraints[guard] === true, `missing shapeshifter guard: ${guard}`);
}
assert(states.constraints.childStateIdsAllowed === false, 'child state IDs must not be admitted to adult shapeshifter state machine');
const stateIds = states.states.map((state) => state.id);
assert(new Set(stateIds).size === stateIds.length, 'duplicate shapeshifter state IDs');
assert(stateIds.every((id) => !id.includes('child')), 'adult shapeshifter state machine contains child state ID');
const knownStates = new Set(stateIds);
for (const transition of states.transitions) {
  assert(knownStates.has(transition.from), `unknown transition source: ${transition.from}`);
  assert(knownStates.has(transition.to), `unknown transition target: ${transition.to}`);
  assert(transition.reversible === true, `transition must remain reversible: ${transition.from}->${transition.to}`);
}

const child = readJson('play/mmo-world/redline/child-character.json');
assert(child.schema === 'conscience64.redline.child-character/v1', 'unexpected child character schema');
assert(child.characterId === 'redline-child', 'child character ID drift');
assert(child.fictional === true, 'child character must remain explicitly fictional');
assert(child.ageClass === 'child', 'child age class drift');
assert(child.exactAge === null, 'exact child age must remain unresolved until story-authored');
assert(child.identityClaim === false, 'child identity claims are not permitted');
assert(child.presentation.ageAppropriate === true, 'child presentation must remain age appropriate');
assert(child.presentation.sexualizedPresentationAllowed === false, 'sexualized child presentation is forbidden');
assert(child.presentation.romanceOrSexualStorylineAllowed === false, 'sexual/romance child storyline is forbidden');
assert(child.presentation.adultProvocativeMaterialInheritanceAllowed === false, 'child must not inherit adult provocative material contract');
assert(child.presentation.adultShapeshifterStateInheritanceAllowed === false, 'child must not inherit adult shapeshifter states');
assert(child.contentBoundary.matureOrExplicitContentAllowed === false, 'mature/explicit child-visible content must remain blocked');
assert(child.contentBoundary.whenChildPresent === 'block-or-replace-before-render', 'child content handling must remain pre-render');
assert(child.contentBoundary.matureModuleVisibility === 'off', 'mature module must remain hidden when child is present');
assert(child.contentBoundary.childAndAdultContentPipelinesSeparate === true, 'child/adult content pipelines must remain separate');
assert(child.gameplay.directCombatTarget === false, 'child must not be a direct combat target');
assert(child.gameplay.reactionTimeGate === false, 'child reaction speed must not be a progression gate');
assert(child.gameplay.playerWorthScoring === false, 'child must not receive player-worth scoring');
for (const guard of ['noRealPersonIdentityInference', 'noBiometricReplicationRequirement', 'noSensitiveTraitInference', 'childIsSeparateEntityFromAdultShapeshifter', 'noAgeTransformBetweenAdultAndChild', 'ageAppropriateContentAlways']) {
  assert(child.constraints[guard] === true, `missing child guard: ${guard}`);
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
  'play/mmo-world/redline/REFERENCE_DOSSIER.md',
  'play/mmo-world/redline/child-character.json'
]) {
  assert(exists(requiredPath), `required cooperation surface missing: ${requiredPath}`);
}

console.log(`PASS redline-character-cooperation adultStates=${states.states.length} child=${child.characterId} participants=${participantIds.size} galleryImages=${gallery.imageCount} videos=${gallery.videoCount}`);
