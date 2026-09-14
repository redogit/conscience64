import { VARIETY_AXES, describeRegion, nextRegionVariety } from './varieties.mjs';

const STORAGE_KEY = 'conscience64.mmo.variety-generation.v1';
const WORLD_SEED = 640064;
const regionElement = document.getElementById('region');
const headlineElement = document.getElementById('variety-headline');
const axesElement = document.getElementById('variety-axes');
const statusElement = document.getElementById('variety-status');
const mutateButton = document.getElementById('variety-mutate');
const resetButton = document.getElementById('variety-reset');

function readGeneration() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000 ? value : 0;
  } catch {
    return 0;
  }
}

let generation = readGeneration();

function saveGeneration() {
  try {
    localStorage.setItem(STORAGE_KEY, String(generation));
    return true;
  } catch {
    return false;
  }
}

function currentRegion() {
  return regionElement?.textContent?.trim() || 'Sunmeadow';
}

export function renderVariety(regionName = currentRegion()) {
  const description = describeRegion(regionName, generation, WORLD_SEED);
  if (headlineElement) headlineElement.textContent = description.headline;
  if (axesElement) {
    axesElement.replaceChildren(...VARIETY_AXES.map(axis => {
      const item = document.createElement('li');
      item.textContent = `${axis}: ${description.adjectives[axis]}`;
      return item;
    }));
  }
  if (statusElement) statusElement.textContent = `Variety generation ${generation}. Flavor only; map, combat, progression, and rewards are unchanged.`;
  return description;
}

function mutate() {
  const next = nextRegionVariety(currentRegion(), generation, WORLD_SEED);
  generation = next.generation;
  const stored = saveGeneration();
  renderVariety();
  if (!stored && statusElement) statusElement.textContent += ' This browser did not persist the local variety generation.';
}

function reset() {
  generation = 0;
  const stored = saveGeneration();
  renderVariety();
  if (!stored && statusElement) statusElement.textContent += ' This browser did not persist the reset.';
}

mutateButton?.addEventListener('click', mutate);
resetButton?.addEventListener('click', reset);
if (regionElement) new MutationObserver(() => renderVariety()).observe(regionElement, { childList: true, characterData: true, subtree: true });
renderVariety();
