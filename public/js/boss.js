import { scene } from './three-scene.js';
import { state } from './state.js';
import { BOSS_TYPES, MINIBOSS, BOUND_X, BOSS_LEVEL_INTERVAL, DIFFICULTY_PRESETS, ENEMY_HIT_RADIUS, BOSS_GROWTH_HP_PER_TIER, MINIBOSS_GROWTH_HP_PER_LEVEL, enemyGrowthFactor } from './constants.js';
import { disposeAndRemove, makeEmojiSprite, spawnExplosion, shakeCamera } from './utils3d.js';
import { sfxHit, sfxExplode, sfxBossAppear } from './audio.js';
import { showBanner, flashBoss } from './ui.js';
import { player } from './player.js';
import { bullets } from './weapons.js';
import { spawnPowerupPickup } from './powerups.js';

export let boss = null;
export let miniboss = null;
export const enemyBullets = [];

const bossBarEl = document.getElementById('bossBar');
const bossNameEl = document.getElementById('bossName');
const bossBarFillEl = document.getElementById('bossBarFill');

let bossTypeCursor = 0;

function scoreMult() {
  return (DIFFICULTY_PRESETS[state.difficulty] || DIFFICULTY_PRESETS.normal).scoreMult;
}

function fireBossPattern(b, patternKey) {
  if (patternKey === 'spread3') {
    const base = new THREE.Vector3(
      player.position.x - b.mesh.position.x,
      player.position.y - b.mesh.position.y,
      player.position.z - b.mesh.position.z
    ).normalize();
    [-0.28, 0, 0.28].forEach(function (offset) {
      const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset);
      spawnEnemyBullet(b.mesh.position, dir);
    });
  } else if (patternKey === 'wideFan') {
    const base = new THREE.Vector3(
      player.position.x - b.mesh.position.x,
      player.position.y - b.mesh.position.y,
      player.position.z - b.mesh.position.z
    ).normalize();
    [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].forEach(function (offset) {
      const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offset);
      spawnEnemyBullet(b.mesh.position, dir);
    });
  } else {
    spawnEnemyBullet(b.mesh.position);
  }
}

export function resetBoss() {
  if (boss) { disposeAndRemove(boss.mesh); boss = null; }
  if (miniboss) { disposeAndRemove(miniboss.mesh); miniboss = null; }
  for (let i = enemyBullets.length - 1; i >= 0; i--) disposeAndRemove(enemyBullets[i].mesh);
  enemyBullets.length = 0;
  state.bossActive = false;
  state.minibossActive = false;
  state.minibossTimer = MINIBOSS.interval;
  bossBarEl.classList.add('hidden');
}

function spawnEnemyBullet(fromPos, dirOverride) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff5533 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mat);
  mesh.position.copy(fromPos);
  scene.add(mesh);
  const dir = dirOverride || new THREE.Vector3(
    player.position.x - fromPos.x,
    player.position.y - fromPos.y,
    player.position.z - fromPos.z
  ).normalize();
  enemyBullets.push({ mesh: mesh, dir: dir, speed: 10 });
}

export function spawnBoss() {
  const type = BOSS_TYPES[bossTypeCursor % BOSS_TYPES.length];
  bossTypeCursor += 1;

  const group = new THREE.Group();
  const body = makeEmojiSprite(type.emoji, 3.4, 0xff2b2b);
  group.add(body);
  const crown = makeEmojiSprite(type.crown, 1.4);
  crown.position.set(0, 2.1, 0.05);
  group.add(crown);

  const growthBonus = state.growthMode ? enemyGrowthFactor(state.level) * BOSS_GROWTH_HP_PER_TIER : 0;
  const maxHp = 40 + state.level * 6 + growthBonus;
  group.position.set(0, 1.2, -45);
  scene.add(group);

  boss = {
    mesh: group,
    type: type,
    hp: maxHp,
    maxHp: maxHp,
    phase: 'enter',
    targetZ: -9,
    driftPhase: Math.random() * Math.PI * 2,
    fireTimer: 1.5,
    enraged: false
  };
  state.bossActive = true;
  bossNameEl.textContent = type.crown + ' ' + type.name;
  bossBarEl.classList.remove('hidden');
  bossBarFillEl.style.width = '100%';
  showBanner(type.crown + ' ' + type.name + ' 등장!');
  flashBoss();
  shakeCamera(0.45, 0.8);
  sfxBossAppear();
}

export function spawnMiniboss() {
  const sprite = makeEmojiSprite(MINIBOSS.emoji, 2.0, 0x66aaff);
  sprite.position.set((Math.random() - 0.5) * 2 * (BOUND_X - 1.5), 1.0, -40);
  scene.add(sprite);
  const growthBonus = state.growthMode ? Math.round(state.level * MINIBOSS_GROWTH_HP_PER_LEVEL) : 0;
  const maxHp = MINIBOSS.hp + growthBonus;
  miniboss = {
    mesh: sprite,
    hp: maxHp,
    maxHp: maxHp,
    phase: 'enter',
    targetZ: -10,
    driftPhase: Math.random() * Math.PI * 2,
    fireTimer: 1.2
  };
  state.minibossActive = true;
  bossNameEl.textContent = MINIBOSS.emoji + ' ' + MINIBOSS.name;
  bossBarEl.classList.remove('hidden');
  bossBarFillEl.style.width = '100%';
  showBanner(MINIBOSS.emoji + ' ' + MINIBOSS.name + ' 접근!');
  shakeCamera(0.18, 0.35);
}

function endBoss(defeated) {
  state.bossActive = false;
  bossBarEl.classList.add('hidden');
  if (boss) { disposeAndRemove(boss.mesh); boss = null; }
  if (defeated) {
    state.nextBossLevel = state.level + BOSS_LEVEL_INTERVAL;
  }
}

function endMiniboss(defeated) {
  state.minibossActive = false;
  bossBarEl.classList.add('hidden');
  if (miniboss) { disposeAndRemove(miniboss.mesh); miniboss = null; }
  state.minibossTimer = MINIBOSS.interval;
  if (defeated) spawnPowerupPickup();
}

export function maybeSpawnEncounters(dt) {
  if (!state.bossActive && state.level >= state.nextBossLevel) {
    spawnBoss();
  }
  if (!state.bossActive && !state.minibossActive) {
    state.minibossTimer -= dt;
    if (state.minibossTimer <= 0) spawnMiniboss();
  }
}

export function updateBoss(dt, callbacks) {
  if (!boss) return;

  if (boss.phase === 'enter') {
    boss.mesh.position.z += 16 * dt;
    if (boss.mesh.position.z >= boss.targetZ) {
      boss.mesh.position.z = boss.targetZ;
      boss.phase = 'hover';
    }
  } else {
    boss.driftPhase += dt * 0.8 * boss.type.speedMult;
    boss.mesh.position.x = Math.sin(boss.driftPhase) * (BOUND_X - 1.5);
    boss.mesh.position.y = 1.2 + Math.sin(boss.driftPhase * 1.6) * 0.5;

    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      fireBossPattern(boss, boss.type.pattern);
      if (boss.enraged) fireBossPattern(boss, 'spread3');
      const baseCooldown = Math.max(0.85, 1.7 - state.level * 0.05);
      boss.fireTimer = boss.enraged ? baseCooldown * 0.6 : baseCooldown;
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const pbul = bullets[i];
    if (pbul.mesh.position.distanceTo(boss.mesh.position) < 1.9) {
      disposeAndRemove(pbul.mesh);
      bullets.splice(i, 1);
      boss.hp -= state.attackPower;
      sfxHit();
      spawnExplosion(callbacks.particles, pbul.mesh.position, 0xffd23b);
      shakeCamera(0.06, 0.15);
      bossBarFillEl.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      if (!boss.enraged && boss.hp > 0 && boss.hp <= boss.maxHp * 0.5) {
        boss.enraged = true;
        showBanner('💢 ' + boss.type.name + ' 분노!');
        shakeCamera(0.3, 0.4);
      }
      if (boss.hp <= 0) {
        spawnExplosion(callbacks.particles, boss.mesh.position, 0xff5533);
        spawnExplosion(callbacks.particles, boss.mesh.position, 0xffd23b);
        sfxExplode();
        shakeCamera(0.35, 0.5);
        callbacks.addScore(Math.round((200 + state.level * 20) * scoreMult()));
        endBoss(true);
        break;
      }
    }
  }
}

export function updateMiniboss(dt, callbacks) {
  if (!miniboss) return;

  if (miniboss.phase === 'enter') {
    miniboss.mesh.position.z += 18 * dt;
    if (miniboss.mesh.position.z >= miniboss.targetZ) {
      miniboss.mesh.position.z = miniboss.targetZ;
      miniboss.phase = 'hover';
    }
  } else {
    miniboss.driftPhase += dt * 1.1;
    miniboss.mesh.position.x = Math.sin(miniboss.driftPhase) * (BOUND_X - 1.5);
    miniboss.fireTimer -= dt;
    if (miniboss.fireTimer <= 0) {
      spawnEnemyBullet(miniboss.mesh.position);
      miniboss.fireTimer = 1.3;
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const pbul = bullets[i];
    if (pbul.mesh.position.distanceTo(miniboss.mesh.position) < 1.3) {
      disposeAndRemove(pbul.mesh);
      bullets.splice(i, 1);
      miniboss.hp -= state.attackPower;
      sfxHit();
      spawnExplosion(callbacks.particles, pbul.mesh.position, 0x66aaff);
      bossBarFillEl.style.width = Math.max(0, (miniboss.hp / miniboss.maxHp) * 100) + '%';
      if (miniboss.hp <= 0) {
        spawnExplosion(callbacks.particles, miniboss.mesh.position, 0x66aaff);
        sfxExplode();
        callbacks.addScore(Math.round((60 + state.level * 8) * scoreMult()));
        endMiniboss(true);
        break;
      }
    }
  }
}

export function updateEnemyBullets(dt, callbacks) {
  const shielded = state.shieldTimer > 0;
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.mesh.position.addScaledVector(eb.dir, eb.speed * dt);
    if (eb.mesh.position.distanceTo(player.position) > 90) {
      disposeAndRemove(eb.mesh);
      enemyBullets.splice(i, 1);
      continue;
    }
    if (eb.mesh.position.distanceTo(player.position) < ENEMY_HIT_RADIUS) {
      if (state.invincible <= 0 && !shielded) {
        disposeAndRemove(eb.mesh);
        enemyBullets.splice(i, 1);
        callbacks.loseLife();
        continue;
      } else if (shielded) {
        spawnExplosion(callbacks.particles, eb.mesh.position, 0x3fa8ff);
        disposeAndRemove(eb.mesh);
        enemyBullets.splice(i, 1);
        continue;
      }
    }
  }
}
