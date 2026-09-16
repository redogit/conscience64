function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const PLUGIN_POLICY = deepFreeze({
  schema: 'conscience64.mmo-world.plugin-contract/v1',
  pluginSchema: 'conscience64.mmo.plugin/v1',
  version: '1.2.0',
  executionModel: 'data-only',
  mechanics: ['choice', 'input', 'creative', 'timing'],
  limits: {
    fileBytes: 65536,
    shelfEntries: 64,
    shelfBytes: 262144,
    idPattern: '^[a-z0-9][a-z0-9-]{2,63}$',
    nameChars: 80,
    versionChars: 32,
    descriptionChars: 300,
    promptChars: 500,
    choices: 8,
    answers: 16,
    itemChars: 120,
    timing: {
      minDelayMs: 250,
      maxDelayMs: 10000,
      maxSpanMs: 5000,
      clock: 'trusted-runtime-monotonic',
    },
    rewardCaps: { xp: 40, joy: 20, tokens: 4, discoveries: 1 },
  },
  validation: {
    unknownTopLevelFields: 'reject',
    unknownRewardFields: 'reject',
    duplicateChoicesOrAnswersAfterTrimCasefold: 'reject',
    timingDelayBounds: 'reject-out-of-range-or-inverted',
    reactionThresholdField: 'not-supported',
    corruptStoredShelf: 'fail-visible-do-not-overwrite',
  },
  security: {
    executablePluginCode: false,
    htmlInterpretation: false,
    urlFields: false,
    networkAuthority: false,
    serverAuthority: false,
    accountAuthority: false,
    multiplayerAuthority: false,
    commerceAuthority: false,
    prizeAuthority: false,
    importedTextIsDataOnly: true,
    pluginSuppliedClockOrTimer: false,
  },
  authority: {
    localPluginReward: 'preview metadata only; not applied to canonical game state',
    timingMeasurement: 'local preview measurement only; not an accessibility gate, player-worth metric, or authoritative score',
    multiplayerAchievement: 'requires future authoritative server validation',
    realWorldPrize: 'never granted by this plugin contract',
  },
  lineage: {
    source: 'retired conscience64-mmorpg-site-2026-09-13 branch',
    admission: 'features extracted into canonical play/mmo-world without reviving play/mmo architecture',
  },
});

export function renderPluginContract() {
  return `${JSON.stringify(PLUGIN_POLICY, null, 2)}\n`;
}
