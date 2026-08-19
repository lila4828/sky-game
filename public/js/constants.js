export const BOUND_X = 6.2;
export const BOUND_Y_MIN = -2.6;
export const BOUND_Y_MAX = 3.6;
export const MOVE_SPEED = 7;

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
  { key: 'dragon', emoji: '🐲', crown: '👑', name: '폭풍룡',   pattern: 'spread3', speedMult: 1.25 }
];

export const MINIBOSS = { emoji: '🛰', name: '정찰대장', hp: 5, interval: 90 };

export const BOSS_LEVEL_INTERVAL = 5;

export const MAX_LIVES_CAP = 4;
