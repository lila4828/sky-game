import { scene } from './three-scene.js';
import { state } from './state.js';
import { WAVE_CONFIGS } from './constants.js';
import { showBanner } from './ui.js';

export function getWaveIndexForLevel(level) {
  let idx = 0;
  for (let i = 0; i < WAVE_CONFIGS.length; i++) {
    if (WAVE_CONFIGS[i].minLevel <= level) idx = i;
  }
  return idx;
}

export function getWaveConfig(level) {
  return WAVE_CONFIGS[getWaveIndexForLevel(level)];
}

export function applyWaveForLevel(level) {
  const idx = getWaveIndexForLevel(level);
  if (idx !== state.wave) {
    state.wave = idx;
    const cfg = WAVE_CONFIGS[idx];
    scene.fog.color.setHex(cfg.fogColor);
    showBanner(cfg.label);
  }
  return WAVE_CONFIGS[idx];
}

export function resetWave() {
  state.wave = 0;
  scene.fog.color.setHex(WAVE_CONFIGS[0].fogColor);
}
