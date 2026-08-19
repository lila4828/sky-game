import { scene } from './three-scene.js';
import { state } from './state.js';
import { WEAPON_DEFS, MAX_HOMING_BULLETS, MIN_FIRE_COOLDOWN } from './constants.js';
import { disposeAndRemove, registerSharedGeometry, spawnExplosion } from './utils3d.js';
import { registerKill } from './combo.js';
import { sfxShoot, sfxExplode, sfxHit } from './audio.js';
import { player } from './player.js';
import { enemies } from './enemies.js';

export const bullets = [];

const bulletGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
registerSharedGeometry(bulletGeo);

function makeBulletMesh(color) {
  const mat = new THREE.MeshBasicMaterial({ color: color });
  const mesh = new THREE.Mesh(bulletGeo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addBullet(pos, vel, pierceLeft) {
  const color = WEAPON_DEFS[state.weapon].color;
  const mesh = makeBulletMesh(color);
  mesh.position.copy(pos);
  scene.add(mesh);
  if (state.weapon === 'homing') {
    const light = new THREE.PointLight(color, 0.8, 3);
    mesh.add(light);
  }
  bullets.push({ mesh: mesh, vel: vel, pierceLeft: pierceLeft, homing: state.weapon === 'homing', color: color, target: null });
}

export function resetWeapons() {
  for (let i = bullets.length - 1; i >= 0; i--) disposeAndRemove(bullets[i].mesh);
  bullets.length = 0;
  state.weapon = 'basic';
  state.weaponTimer = 0;
  state.rapidFireTimer = 0;
  state.fireCooldown = 0;
}

export function trySpawnBullet(dt, keys) {
  state.fireCooldown -= dt;
  if (state.weaponTimer > 0) {
    state.weaponTimer -= dt;
    if (state.weaponTimer <= 0) state.weapon = 'basic';
  }
  if (!keys.fire || state.fireCooldown > 0) return;

  const origin = new THREE.Vector3(player.position.x, player.position.y, player.position.z - 0.9);
  const speed = 42;
  const def = WEAPON_DEFS[state.weapon];

  let spawned = true;
  if (state.weapon === 'spread') {
    for (let i = 0; i < def.spreadCount; i++) {
      const offset = (i - (def.spreadCount - 1) / 2) * def.spreadAngle;
      const vel = new THREE.Vector3(Math.sin(offset) * speed, 0, -Math.cos(offset) * speed);
      addBullet(origin, vel, 1);
    }
  } else if (state.weapon === 'pierce') {
    addBullet(origin, new THREE.Vector3(0, 0, -speed), def.pierceCount);
  } else if (state.weapon === 'homing') {
    const homingCount = bullets.reduce((n, bl) => n + (bl.homing ? 1 : 0), 0);
    if (homingCount < MAX_HOMING_BULLETS) {
      addBullet(origin, new THREE.Vector3(0, 0, -speed), 1);
    } else {
      spawned = false;
    }
  } else {
    addBullet(origin, new THREE.Vector3(0, 0, -speed), 1);
  }

  if (spawned) {
    sfxShoot();
    const baseCooldown = state.rapidFireTimer > 0 ? 0.07 : 0.18;
    state.fireCooldown = Math.max(MIN_FIRE_COOLDOWN, baseCooldown * state.attackSpeedMult);
  }
}

function findNearestEnemy(pos) {
  let best = null, bestDist = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const d = enemies[i].mesh.position.distanceTo(pos);
    if (d < bestDist) { bestDist = d; best = enemies[i]; }
  }
  return best;
}

export function updateBullets(dt, callbacks) {
  const turnRate = WEAPON_DEFS.homing.turnRate;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    if (b.homing) {
      if (!b.target || b.target.removed) {
        b.target = findNearestEnemy(b.mesh.position);
      }
      if (b.target) {
        const desired = b.target.mesh.position.clone().sub(b.mesh.position).normalize().multiplyScalar(b.vel.length());
        b.vel.lerp(desired, Math.min(1, turnRate * dt)).setLength(42);
      }
    }

    b.mesh.position.addScaledVector(b.vel, dt);

    if (b.mesh.position.z < -65 || Math.abs(b.mesh.position.x) > 40 || Math.abs(b.mesh.position.y) > 40) {
      disposeAndRemove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const enemy = enemies[ei];
      if (b.mesh.position.distanceTo(enemy.mesh.position) < 0.75) {
        enemy.hp -= state.attackPower;
        if (enemy.hp <= 0) {
          spawnExplosion(callbacks.particles, enemy.mesh.position, b.color);
          sfxExplode();
          enemy.removed = true;
          disposeAndRemove(enemy.mesh);
          enemies.splice(ei, 1);
          const mult = registerKill();
          callbacks.addScore(Math.round(10 * mult));
        } else {
          spawnExplosion(callbacks.particles, enemy.mesh.position, b.color, 3);
          sfxHit();
        }
        b.pierceLeft -= 1;
        if (b.pierceLeft <= 0) {
          disposeAndRemove(b.mesh);
          bullets.splice(i, 1);
        }
        break;
      }
    }
  }
}
