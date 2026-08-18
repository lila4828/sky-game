import { scene } from './three-scene.js';
import { state } from './state.js';
import { BOUND_X, BOUND_Y_MIN, BOUND_Y_MAX, WEAPON_DEFS, WEAPON_PICKUP_TYPES } from './constants.js';
import { disposeAndRemove, makeEmojiSprite, spawnExplosion } from './utils3d.js';
import { player } from './player.js';
import { sfxPowerup, sfxLifeUp } from './audio.js';

const PICKUP_RADIUS = 1.1;

export const heartPickups = [];
export const powerupPickups = [];

const POWERUP_POOL = WEAPON_PICKUP_TYPES.concat(['rapid', 'shield']);

function iconFor(type) {
  if (type === 'rapid') return '⚡';
  if (type === 'shield') return '🛡';
  return WEAPON_DEFS[type].icon;
}
function glowFor(type) {
  if (type === 'rapid') return 0xffe066;
  if (type === 'shield') return 0x3fa8ff;
  return WEAPON_DEFS[type].color;
}
function labelFor(type) {
  if (type === 'rapid') return '⚡ 연사 강화!';
  if (type === 'shield') return '🛡 실드 획득!';
  return WEAPON_DEFS[type].icon + ' ' + WEAPON_DEFS[type].label + ' 장착!';
}

export function resetPowerups() {
  for (let i = heartPickups.length - 1; i >= 0; i--) disposeAndRemove(heartPickups[i].mesh);
  for (let i = powerupPickups.length - 1; i >= 0; i--) disposeAndRemove(powerupPickups[i].mesh);
  heartPickups.length = 0;
  powerupPickups.length = 0;
}

export function spawnHeartPickup() {
  const sprite = makeEmojiSprite('❤️', 1.1, 0x33ff88);
  const x = (Math.random() - 0.5) * 2 * BOUND_X;
  const y = BOUND_Y_MIN + Math.random() * (BOUND_Y_MAX - BOUND_Y_MIN);
  sprite.position.set(x, y, -55);
  scene.add(sprite);
  heartPickups.push({ mesh: sprite, speed: 8, driftPhase: Math.random() * Math.PI * 2 });
}

export function spawnPowerupPickup() {
  const type = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
  const sprite = makeEmojiSprite(iconFor(type), 1.2, glowFor(type));
  const x = (Math.random() - 0.5) * 2 * BOUND_X;
  const y = BOUND_Y_MIN + Math.random() * (BOUND_Y_MAX - BOUND_Y_MIN);
  sprite.position.set(x, y, -55);
  scene.add(sprite);
  powerupPickups.push({ mesh: sprite, type: type, speed: 8, driftPhase: Math.random() * Math.PI * 2 });
}

export function applyPowerup(type, pos, callbacks) {
  sfxPowerup();
  if (type === 'rapid') {
    state.rapidFireTimer = 8;
  } else if (type === 'shield') {
    state.shieldTimer = 6;
  } else {
    state.weapon = type;
    state.weaponTimer = 10;
  }
  if (callbacks) {
    spawnExplosion(callbacks.particles, pos, glowFor(type));
    callbacks.onPickup(labelFor(type));
  }
}

export function updatePickups(dt, callbacks) {
  for (let i = heartPickups.length - 1; i >= 0; i--) {
    const hp = heartPickups[i];
    hp.mesh.position.z += hp.speed * dt;
    hp.driftPhase += dt * 1.2;
    hp.mesh.position.x += Math.sin(hp.driftPhase) * 0.4 * dt;

    if (hp.mesh.position.z > player.position.z + 1) {
      disposeAndRemove(hp.mesh);
      heartPickups.splice(i, 1);
      continue;
    }
    if (hp.mesh.position.distanceTo(player.position) < PICKUP_RADIUS) {
      const pos = hp.mesh.position.clone();
      disposeAndRemove(hp.mesh);
      heartPickups.splice(i, 1);
      if (state.lives < state.maxLives) {
        state.lives += 1;
        sfxLifeUp();
        spawnExplosion(callbacks.particles, pos, 0x33ff88);
        callbacks.onPickup('❤️ 생명 +1!');
        callbacks.onLifeChange();
      }
    }
  }

  for (let i = powerupPickups.length - 1; i >= 0; i--) {
    const pw = powerupPickups[i];
    pw.mesh.position.z += pw.speed * dt;
    pw.driftPhase += dt * 1.2;
    pw.mesh.position.x += Math.sin(pw.driftPhase) * 0.4 * dt;

    if (pw.mesh.position.z > player.position.z + 1) {
      disposeAndRemove(pw.mesh);
      powerupPickups.splice(i, 1);
      continue;
    }
    if (pw.mesh.position.distanceTo(player.position) < PICKUP_RADIUS) {
      const pos = pw.mesh.position.clone();
      const type = pw.type;
      disposeAndRemove(pw.mesh);
      powerupPickups.splice(i, 1);
      applyPowerup(type, pos, callbacks);
    }
  }
}
