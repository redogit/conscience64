export const VARIETY_AXES = Object.freeze([
  'light', 'sound', 'flora', 'fauna', 'motion', 'mood', 'mystery', 'danger'
]);

const freezeProfile = profile => Object.freeze(Object.fromEntries(
  Object.entries(profile).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value])
));

export const REGION_VARIETIES = Object.freeze({
  Sunmeadow: freezeProfile({
    kind: 'meadow',
    light: ['sun-warmed', 'honey-lit', 'dappled'],
    sound: ['insect-loud', 'humming', 'chirring'],
    flora: ['blue-flowered', 'nectar-rich', 'soft-seeded'],
    fauna: ['pollinator-rich', 'darting', 'curious'],
    motion: ['breezy', 'swaying', 'fluttering'],
    mood: ['welcoming', 'bright-hearted', 'restless'],
    mystery: ['slightly-impossible', 'echo-touched', 'secretive'],
    danger: ['low-simmering', 'watchful', 'deceptively-gentle'],
  }),
  Nightbog: freezeProfile({
    kind: 'wetland',
    light: ['moon-dim', 'reed-shadowed', 'phosphorescent'],
    sound: ['double-echoing', 'frog-loud', 'water-whispering'],
    flora: ['reed-thick', 'moss-heavy', 'lantern-fungused'],
    fauna: ['amphibian-rich', 'skittering', 'night-winged'],
    motion: ['rippling', 'mist-drifting', 'slow-circling'],
    mood: ['uncanny', 'patient', 'hushed'],
    mystery: ['echo-haunted', 'misdirecting', 'half-remembered'],
    danger: ['mire-hidden', 'ambush-prone', 'quietly-hostile'],
  }),
  Emberwood: freezeProfile({
    kind: 'woodland',
    light: ['ember-lit', 'spark-dappled', 'copper-glowing'],
    sound: ['crackling', 'branch-ticking', 'owl-deep'],
    flora: ['spark-leafed', 'resin-sweet', 'fern-dark'],
    fauna: ['burrowing', 'bright-eyed', 'heat-seeking'],
    motion: ['ash-drifting', 'leaf-spinning', 'thermal-rising'],
    mood: ['bold', 'ancient', 'charged'],
    mystery: ['fire-without-burning', 'ritual-feeling', 'watchful'],
    danger: ['hot-tempered', 'predator-rich', 'sudden'],
  }),
  Frostfield: freezeProfile({
    kind: 'frost field',
    light: ['ice-bright', 'blue-white', 'prismatic'],
    sound: ['glass-chiming', 'wind-thin', 'snow-muted'],
    flora: ['glass-grassed', 'crystal-flowered', 'low-growing'],
    fauna: ['white-coated', 'burrow-fast', 'far-calling'],
    motion: ['wind-bent', 'shivering', 'slow-swirling'],
    mood: ['clear-minded', 'lonely', 'majestic'],
    mystery: ['motion-sensitive', 'mirror-strange', 'horizon-bending'],
    danger: ['exposure-heavy', 'slippery', 'long-range'],
  }),
  'The Anomaly': freezeProfile({
    kind: 'anomaly zone',
    light: ['violet-shifting', 'directionless', 'afterimage-bright'],
    sound: ['backwards-ringing', 'phase-wandering', 'too-close'],
    flora: ['geometry-grown', 'color-shifting', 'rootless'],
    fauna: ['pattern-breaking', 'many-shadowed', 'observer-curious'],
    motion: ['nonlinear', 'orbiting', 'stutter-smooth'],
    mood: ['wonder-heavy', 'playfully-wrong', 'sublime'],
    mystery: ['rule-bending', 'question-generating', 'map-resistant'],
    danger: ['unpredictable', 'reality-thin', 'high-attention'],
  }),
});

function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick(pool, key) {
  return pool[hash32(key) % pool.length];
}

export function describeRegion(regionName, generation = 0, seed = 640064) {
  const profile = REGION_VARIETIES[regionName];
  if (!profile) throw new RangeError(`Unknown region variety: ${regionName}`);
  if (!Number.isSafeInteger(generation) || generation < 0) throw new RangeError('Generation must be a non-negative safe integer.');
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer.');
  const adjectives = Object.freeze(Object.fromEntries(VARIETY_AXES.map(axis => [
    axis,
    pick(profile[axis], `${seed}:${generation}:${regionName}:${axis}`),
  ])));
  const headlineAxes = ['light', 'sound', 'flora', 'mood'];
  const headline = `${headlineAxes.map(axis => adjectives[axis]).join(' · ')} ${profile.kind}`;
  return Object.freeze({ region: regionName, kind: profile.kind, generation, seed, adjectives, headline });
}

export function nextRegionVariety(regionName, generation = 0, seed = 640064) {
  return describeRegion(regionName, generation + 1, seed);
}
