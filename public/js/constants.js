export const BOUND_X = 6.2;
export const BOUND_Y_MIN = -2.6;
export const BOUND_Y_MAX = 3.6;
export const MOVE_SPEED = 7;

export const MAX_HOMING_BULLETS = 8;
export const CAMERA_FOLLOW_SPEED = 6; // 1/s, frame-rate-independent exponential follow rate
export const ENEMY_HIT_RADIUS = 0.65;
export const ENEMY_MISS_RADIUS = 0.8;

export const DIFFICULTY_PRESETS = {
  easy:   { label: '쉬움',   lives: 4, spawnMult: 1.3,  speedMult: 0.85, scoreMult: 0.8 },
  normal: { label: '보통',   lives: 3, spawnMult: 1.0,  speedMult: 1.0,  scoreMult: 1.0 },
  hard:   { label: '어려움', lives: 2, spawnMult: 0.75, speedMult: 1.2,  scoreMult: 1.3 }
};

export const WEAPON_DEFS = {
  basic:  { label: '기본',   icon: null,  color: 0x00ffff },
  pierce: { label: '관통탄', icon: '🎯', color: 0xffd23b, pierceCount: 3 },
  spread: { label: '샷건',   icon: '🔱', color: 0xff8c3b, spreadCount: 3, spreadAngle: 0.22 },
  homing: { label: '유도탄', icon: '🚀', color: 0xb84bff, turnRate: 3.2 }
};
export const WEAPON_PICKUP_TYPES = ['pierce', 'spread', 'homing'];

export const WAVE_CONFIGS = [
  { minLevel: 1, label: '웨이브 1 · 진입',      enemyPool: ['👾', '👽'],                spawnMult: 1.0,  speedMult: 1.0,  fogColor: 0x02060a },
  { minLevel: 3, label: '웨이브 2 · 잔해지대',  enemyPool: ['👾', '👽', '🛸', '💀'],    spawnMult: 0.9,  speedMult: 1.05, fogColor: 0x120a18 },
  { minLevel: 6, label: '웨이브 3 · 심연',      enemyPool: ['💀', '🐙', '🦇'],          spawnMult: 0.82, speedMult: 1.12, fogColor: 0x08040f },
  { minLevel: 9, label: '웨이브 4 · 용의 둥지', enemyPool: ['🐙', '🦇', '🐉', '🦂'],    spawnMult: 0.75, speedMult: 1.2,  fogColor: 0x140404 }
];

export const BOSS_TYPES = [
  { key: 'king',   emoji: '👹', crown: '👑', name: '적군의 왕', pattern: 'aimed',   speedMult: 1.0 },
  { key: 'dragon', emoji: '🐲', crown: '👑', name: '폭풍룡',   pattern: 'spread3', speedMult: 1.25 },
  { key: 'wraith', emoji: '👻', crown: '👑', name: '망령왕',   pattern: 'wideFan', speedMult: 1.1 }
];

export const MINIBOSS = { emoji: '🛰', name: '정찰대장', hp: 12, interval: 90 };

export const BOSS_LEVEL_INTERVAL = 5;

export const MAX_LIVES_CAP = 4;

// --- Growth Mode (opt-in) ---
// When state.growthMode is false, growthTier stays 0, attackPower stays 1,
// attackSpeedMult stays 1, and every formula below reduces to today's
// default-mode values - default gameplay is unchanged.
export const GROWTH_LEVEL_INTERVAL = 5;
export const GROWTH_TIER_CAP = 8; // tier growth stops at level 40

export const ATTACK_POWER_PER_TIER = 1;
export const ATTACK_SPEED_MULT_PER_TIER = 0.9; // fire cooldown *= 0.9 per tier, compounding
export const MIN_FIRE_COOLDOWN = 0.05; // hard floor so stacked attack speed can't flood bullets

// Perf math (same approach used to size MAX_HOMING_BULLETS): bullet lifetime
// ~= 65/42 ~= 1.55s. At tier 8 + rapid-fire, unfloored cooldown would be
// 0.07 * 0.9^8 ~= 0.030s -> ~51 concurrent bullets (too many). With the
// MIN_FIRE_COOLDOWN floor: 1.55/0.05 ~= 31 concurrent bullets - same order
// of magnitude as the already-validated homing case (~22).
export function growthTierForLevel(level) {
  return Math.min(GROWTH_TIER_CAP, Math.floor(level / GROWTH_LEVEL_INTERVAL));
}

// Enemy hp grows at 2x the rate of attack power so, once any tier is active,
// regular enemies converge on taking ~2 hits (never 1, never a bullet-sponge):
//   tier 1: hp=1+2=3,   power=1+1=2 -> ceil(3/2)=2 hits
//   tier 8: hp=1+16=17, power=1+8=9 -> ceil(17/9)=2 hits
export const GROWTH_ENEMY_HP_PER_TIER = 2;

export const BOSS_GROWTH_HP_PER_TIER = 6;        // added to boss maxHp per tier
export const MINIBOSS_GROWTH_HP_PER_LEVEL = 1.4; // added to miniboss maxHp per level
