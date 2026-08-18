import { state } from './state.js';

export function getMultiplier() {
  const c = state.comboCount;
  if (c >= 20) return 3;
  if (c >= 10) return 2;
  if (c >= 5) return 1.5;
  return 1;
}

export function registerKill() {
  state.comboCount += 1;
  state.comboTimer = 1.2;
  return getMultiplier();
}

export function updateCombo(dt) {
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.comboCount = 0;
      state.comboTimer = 0;
    }
  }
}

export function resetCombo() {
  state.comboCount = 0;
  state.comboTimer = 0;
}
