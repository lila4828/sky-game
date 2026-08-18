import { scene } from './three-scene.js';
import { state } from './state.js';
import { BOUND_X, BOUND_Y_MIN, BOUND_Y_MAX } from './constants.js';
import { disposeAndRemove, makeEmojiSprite, spawnExplosion } from './utils3d.js';
import { player } from './player.js';

export const enemies = [];

const DEFAULT_POOL = ['👾', '👽', '🛸', '💀', '🐙', '🦇', '🐉', '🦂'];

export function resetEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) disposeAndRemove(enemies[i].mesh);
  enemies.length = 0;
}

export function spawnEnemy(waveConfig) {
  const pool = (waveConfig && waveConfig.enemyPool) || DEFAULT_POOL;
  const emoji = pool[Math.floor(Math.random() * pool.length)];
  const sprite = makeEmojiSprite(emoji, 1.5, 0xff3b6b);
  const x = (Math.random() - 0.5) * 2 * BOUND_X;
  const y = BOUND_Y_MIN + Math.random() * (BOUND_Y_MAX - BOUND_Y_MIN);
  sprite.position.set(x, y, -60);
  scene.add(sprite);
  enemies.push({
    mesh: sprite,
    speed: state.enemySpeed + Math.random() * 2,
    driftPhase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 2.2
  });
}

export function updateEnemies(dt, callbacks) {
  const shielded = state.shieldTimer > 0;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    en.mesh.position.z += en.speed * dt;
    en.driftPhase += dt * 1.5;
    en.mesh.position.x += Math.sin(en.driftPhase) * 0.6 * dt;
    en.mesh.material.rotation += dt * en.spin;

    if (en.mesh.position.z > player.position.z + 1) {
      const missDist = Math.hypot(en.mesh.position.x - player.position.x, en.mesh.position.y - player.position.y);
      disposeAndRemove(en.mesh);
      enemies.splice(i, 1);
      if (missDist < 1.3) callbacks.loseLife();
      continue;
    }

    const pd = en.mesh.position.distanceTo(player.position);
    if (pd < 0.65) {
      if (state.invincible <= 0 && !shielded) {
        spawnExplosion(callbacks.particles, en.mesh.position, 0xff3b6b);
        disposeAndRemove(en.mesh);
        enemies.splice(i, 1);
        callbacks.loseLife();
        continue;
      } else if (shielded) {
        spawnExplosion(callbacks.particles, en.mesh.position, 0x3fa8ff);
        disposeAndRemove(en.mesh);
        enemies.splice(i, 1);
        callbacks.addScore(5);
        continue;
      }
    }
  }
}
