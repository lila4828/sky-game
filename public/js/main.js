import { scene, camera, renderer, updateStarfield } from './three-scene.js';
import { state } from './state.js';
import { DIFFICULTY_PRESETS, BOSS_LEVEL_INTERVAL, CAMERA_FOLLOW_SPEED } from './constants.js';
import { loadSettings } from './storage.js';
import { ensureAudio, sfxHit } from './audio.js';
import * as ui from './ui.js';
import { player, shieldMesh, resetPlayer, updatePlayerMovement } from './player.js';
import { resetWeapons, trySpawnBullet, updateBullets } from './weapons.js';
import { resetEnemies, spawnEnemy, updateEnemies } from './enemies.js';
import { resetPowerups, spawnHeartPickup, spawnPowerupPickup, updatePickups } from './powerups.js';
import { resetBoss, maybeSpawnEncounters, updateBoss, updateMiniboss, updateEnemyBullets } from './boss.js';
import { getWaveConfig, applyWaveForLevel, resetWave } from './waves.js';
import { updateCombo, resetCombo } from './combo.js';
import { updateParticles, applyShake, disposeAndRemove, shakeCamera } from './utils3d.js';
import { initLeaderboardUI, refreshGameOverBoard } from './leaderboard.js';
import { sendVisit, sendPlay } from './stats.js';
import { initTouchControls } from './touch-controls.js';
import { registerServiceWorker } from './pwa.js';

const particles = [];
const keys = { left: false, right: false, up: false, down: false, fire: false };

function addScore(v) {
  state.score += v;
  ui.scoreEl.textContent = String(state.score);
  const newLevel = 1 + Math.floor(state.score / 100);
  if (newLevel !== state.level) {
    state.level = newLevel;
    ui.levelEl.textContent = String(state.level);
    const wave = applyWaveForLevel(state.level);
    const diff = DIFFICULTY_PRESETS[state.difficulty] || DIFFICULTY_PRESETS.normal;
    const baseSpawn = Math.max(0.55, 1.4 - (state.level - 1) * 0.06);
    const baseSpeed = 6.5 + (state.level - 1) * 0.7;
    state.spawnInterval = baseSpawn * wave.spawnMult * diff.spawnMult;
    state.enemySpeed = baseSpeed * wave.speedMult * diff.speedMult;
  }
}

function loseLife() {
  if (state.invincible > 0) return;
  state.lives -= 1;
  state.invincible = 1.6;
  resetCombo();
  sfxHit();
  ui.flashHit();
  shakeCamera(0.22, 0.3);
  ui.updateHearts();
  if (state.lives <= 0) gameOver();
}

function gameOver() {
  state.running = false;
  ui.showGameOverScreen(state.score, state.level);
  refreshGameOverBoard();
}

function clearParticles() {
  for (let i = particles.length - 1; i >= 0; i--) disposeAndRemove(particles[i].mesh);
  particles.length = 0;
}

function resetGame() {
  resetWeapons();
  resetEnemies();
  resetPowerups();
  resetBoss();
  clearParticles();
  resetPlayer();
  resetWave();
  resetCombo();

  const diff = DIFFICULTY_PRESETS[state.difficulty] || DIFFICULTY_PRESETS.normal;
  state.score = 0;
  state.lives = diff.lives;
  state.maxLives = diff.lives;
  state.level = 1;
  state.paused = false;
  state.spawnTimer = 0;
  state.spawnInterval = 1.1 * diff.spawnMult;
  state.enemySpeed = 6.5 * diff.speedMult;
  state.fireCooldown = 0;
  state.invincible = 1.8;
  state.nextBossLevel = BOSS_LEVEL_INTERVAL;
  state.heartTimer = 14;
  state.powerupTimer = 18 + Math.random() * 8;

  ui.hidePauseScreen();
  ui.scoreEl.textContent = '0';
  ui.levelEl.textContent = '1';
  ui.updateHearts();
  ui.updatePowerupHud();
  ui.updateComboBadge();
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) ui.showPauseScreen(); else ui.hidePauseScreen();
}

window.addEventListener('keydown', function (e) {
  const activeTag = document.activeElement && document.activeElement.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
  switch (e.code) {
    case 'ArrowLeft': case 'KeyA': keys.left = true; break;
    case 'ArrowRight': case 'KeyD': keys.right = true; break;
    case 'ArrowUp': case 'KeyW': keys.up = true; break;
    case 'ArrowDown': case 'KeyS': keys.down = true; break;
    case 'Space': keys.fire = true; e.preventDefault(); break;
    case 'Escape': togglePause(); break;
  }
});
window.addEventListener('keyup', function (e) {
  const activeTag = document.activeElement && document.activeElement.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
  switch (e.code) {
    case 'ArrowLeft': case 'KeyA': keys.left = false; break;
    case 'ArrowRight': case 'KeyD': keys.right = false; break;
    case 'ArrowUp': case 'KeyW': keys.up = false; break;
    case 'ArrowDown': case 'KeyS': keys.down = false; break;
    case 'Space': keys.fire = false; e.preventDefault(); break;
  }
});

document.getElementById('startBtn').addEventListener('click', function () {
  ensureAudio();
  resetGame();
  ui.hideStartScreen();
  ui.hideGameOverScreen();
  state.running = true;
  sendPlay();
});
document.getElementById('restartBtn').addEventListener('click', function () {
  resetGame();
  ui.hideGameOverScreen();
  state.running = true;
  sendPlay();
});
ui.pauseBtn.addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);

function update(dt) {
  updatePlayerMovement(dt, keys);

  trySpawnBullet(dt, keys);
  updateBullets(dt, { addScore: addScore, particles: particles });

  if (state.rapidFireTimer > 0) state.rapidFireTimer -= dt;
  if (state.shieldTimer > 0) state.shieldTimer -= dt;
  shieldMesh.visible = state.shieldTimer > 0;
  if (shieldMesh.visible) shieldMesh.rotation.y += dt * 1.5;

  maybeSpawnEncounters(dt);

  if (!state.bossActive) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy(getWaveConfig(state.level));
      state.spawnTimer = state.spawnInterval;
    }
    if (state.lives < state.maxLives) {
      state.heartTimer -= dt;
      if (state.heartTimer <= 0) {
        spawnHeartPickup();
        state.heartTimer = 14 + Math.random() * 6;
      }
    }
  }

  state.powerupTimer -= dt;
  if (state.powerupTimer <= 0) {
    spawnPowerupPickup();
    state.powerupTimer = 18 + Math.random() * 10;
  }

  updateEnemies(dt, { loseLife: loseLife, addScore: addScore, particles: particles });
  updatePickups(dt, { onLifeChange: ui.updateHearts, onPickup: ui.showPickupToast, particles: particles });

  updateBoss(dt, { addScore: addScore, particles: particles });
  updateMiniboss(dt, { addScore: addScore, particles: particles });
  updateEnemyBullets(dt, { loseLife: loseLife, particles: particles });

  updateCombo(dt);
  updateParticles(particles, dt);

  if (state.invincible > 0) {
    state.invincible -= dt;
    player.visible = Math.floor(state.invincible * 12) % 2 === 0;
  } else {
    player.visible = true;
  }

  updateStarfield(dt);

  // Chase the player on both axes with frame-rate-independent exponential
  // smoothing, so it still fully compensates at rest (no clipping behind the
  // touch UI at the BOUND_X/BOUND_Y extremes) but lags a beat during fast
  // moves instead of snapping 1:1 to the ship. lookAt tracks the camera's own
  // (lagged) position so orientation lags along with translation.
  const followT = 1 - Math.exp(-CAMERA_FOLLOW_SPEED * dt);
  camera.position.x += (player.position.x - camera.position.x) * followT;
  camera.position.y += ((2.2 + player.position.y) - camera.position.y) * followT;
  camera.lookAt(camera.position.x, camera.position.y - 2.2, -10);
  applyShake(dt);

  ui.updatePowerupHud();
  ui.updateComboBadge();
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.running && !state.paused) update(dt);
  renderer.render(scene, camera);
}

function boot() {
  const stored = loadSettings();
  ui.applyStoredMute(!!stored.muted);
  ui.setDifficultySelection(stored.difficulty || 'normal');
  ui.initDifficultyButtons();
  ui.wireMuteButton();
  initLeaderboardUI();
  registerServiceWorker();
  sendVisit();
  initTouchControls(keys);
  ui.updateHearts();
  ui.updatePowerupHud();
  animate();
}

boot();
