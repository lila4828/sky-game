import { state } from './state.js';
import { WEAPON_DEFS, DIFFICULTY_PRESETS } from './constants.js';
import { getMultiplier } from './combo.js';
import { setMuted } from './audio.js';
import { saveSettings } from './storage.js';

export const scoreEl = document.getElementById('score');
export const levelEl = document.getElementById('level');
export const heartsEl = document.getElementById('hearts');
export const startScreen = document.getElementById('startScreen');
export const gameOverScreen = document.getElementById('gameOverScreen');
export const finalScoreEl = document.getElementById('finalScore');
export const finalLevelEl = document.getElementById('finalLevel');
export const pauseScreen = document.getElementById('pauseScreen');
export const pauseBtn = document.getElementById('pauseBtn');
export const muteBtn = document.getElementById('muteBtn');
const powerupHudEl = document.getElementById('powerupHud');
const comboBadgeEl = document.getElementById('comboBadge');
const bannerEl = document.getElementById('banner');
const pickupToastEl = document.getElementById('pickupToast');
const hitFlashEl = document.getElementById('hitFlash');
const bossFlashEl = document.getElementById('bossFlash');
const difficultyButtons = Array.prototype.slice.call(document.querySelectorAll('.diff-btn'));
const growthModeBtn = document.getElementById('growthModeBtn');

export function updateHearts() {
  heartsEl.innerHTML = '';
  for (let i = 0; i < state.maxLives; i++) {
    const span = document.createElement('span');
    span.className = 'heart' + (i < state.lives ? '' : ' lost');
    span.textContent = '♥';
    heartsEl.appendChild(span);
  }
}

export function updatePowerupHud() {
  powerupHudEl.innerHTML = '';
  const badges = [];
  if (state.weapon !== 'basic' && state.weaponTimer > 0) {
    const def = WEAPON_DEFS[state.weapon];
    badges.push({ icon: def.icon, time: state.weaponTimer, cls: 'weapon' });
  }
  if (state.rapidFireTimer > 0) badges.push({ icon: '⚡', time: state.rapidFireTimer, cls: 'rapid' });
  if (state.shieldTimer > 0) badges.push({ icon: '🛡', time: state.shieldTimer, cls: 'shield' });
  if (state.growthMode && state.growthTier > 0) {
    badges.push({ icon: '💪 성장 ' + state.growthTier, time: null, cls: 'growth' });
  }

  badges.forEach(function (b) {
    const el = document.createElement('div');
    el.className = 'powerup-badge ' + b.cls;
    el.textContent = b.time == null ? b.icon : (b.icon + ' ' + b.time.toFixed(1) + 's');
    powerupHudEl.appendChild(el);
  });
}

let comboPopTimer = null;
export function updateComboBadge() {
  if (state.comboCount >= 5) {
    const mult = getMultiplier();
    comboBadgeEl.textContent = (state.comboCount) + ' COMBO x' + mult;
    comboBadgeEl.classList.remove('hidden');
    if (!comboPopTimer) {
      comboBadgeEl.classList.add('pop');
      comboPopTimer = setTimeout(function () { comboBadgeEl.classList.remove('pop'); comboPopTimer = null; }, 220);
    }
  } else {
    comboBadgeEl.classList.add('hidden');
  }
}

let bannerTimer = null;
export function showBanner(text) {
  bannerEl.textContent = text;
  bannerEl.classList.remove('hidden');
  bannerEl.style.animation = 'none';
  void bannerEl.offsetWidth;
  bannerEl.style.animation = '';
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(function () { bannerEl.classList.add('hidden'); }, 1300);
}

let toastTimer = null;
export function showPickupToast(text) {
  pickupToastEl.textContent = text;
  pickupToastEl.classList.remove('hidden');
  pickupToastEl.style.animation = 'none';
  void pickupToastEl.offsetWidth;
  pickupToastEl.style.animation = '';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { pickupToastEl.classList.add('hidden'); }, 1100);
}

let hitFlashTimer = null;
export function flashHit() {
  hitFlashEl.style.opacity = '1';
  if (hitFlashTimer) clearTimeout(hitFlashTimer);
  hitFlashTimer = setTimeout(function () { hitFlashEl.style.opacity = '0'; }, 160);
}

let bossFlashTimer = null;
export function flashBoss() {
  bossFlashEl.style.opacity = '1';
  if (bossFlashTimer) clearTimeout(bossFlashTimer);
  bossFlashTimer = setTimeout(function () { bossFlashEl.style.opacity = '0'; }, 450);
}

export function initDifficultyButtons() {
  difficultyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setDifficultySelection(btn.dataset.difficulty);
      saveSettings({ difficulty: btn.dataset.difficulty });
    });
  });
}

export function setDifficultySelection(diff) {
  state.difficulty = DIFFICULTY_PRESETS[diff] ? diff : 'normal';
  difficultyButtons.forEach(function (btn) {
    btn.classList.toggle('selected', btn.dataset.difficulty === state.difficulty);
  });
}

export function initGrowthModeButton() {
  growthModeBtn.addEventListener('click', function () {
    setGrowthModeSelection(!state.growthMode);
    saveSettings({ growthMode: state.growthMode });
  });
}

export function setGrowthModeSelection(enabled) {
  state.growthMode = !!enabled;
  growthModeBtn.classList.toggle('selected', state.growthMode);
}

export function wireMuteButton() {
  muteBtn.addEventListener('click', function () {
    const next = muteBtn.textContent !== '🔇';
    setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
    saveSettings({ muted: next });
  });
}

export function applyStoredMute(muted) {
  setMuted(!!muted);
  muteBtn.textContent = muted ? '🔇' : '🔊';
}

export function showStartScreen() {
  startScreen.classList.remove('hidden');
}
export function hideStartScreen() {
  startScreen.classList.add('hidden');
}
export function showGameOverScreen(score, level) {
  finalScoreEl.textContent = String(score);
  finalLevelEl.textContent = String(level);
  gameOverScreen.classList.remove('hidden');
}
export function hideGameOverScreen() {
  gameOverScreen.classList.add('hidden');
}
export function showPauseScreen() {
  pauseScreen.classList.remove('hidden');
  pauseBtn.textContent = '▶';
}
export function hidePauseScreen() {
  pauseScreen.classList.add('hidden');
  pauseBtn.textContent = '⏸';
}
