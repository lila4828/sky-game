const { Pool } = require('pg');

const hasDatabase = !!process.env.DATABASE_URL;

const pool = hasDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : null;

// In-memory fallback used when DATABASE_URL isn't set (e.g. local dev without
// Postgres installed). Data does not persist across restarts.
const memory = {
  leaderboard: [],
  nextId: 1,
  stats: { visits: 0, plays: 0 }
};

async function initDb() {
  if (!hasDatabase) {
    console.log('DATABASE_URL not set - using in-memory storage (leaderboard/stats reset on restart).');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id SERIAL PRIMARY KEY,
      name VARCHAR(12) NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      visits INTEGER NOT NULL DEFAULT 0,
      plays INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW(),
      CHECK (id = 1)
    )
  `);
  await pool.query(`INSERT INTO site_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
}

async function fetchTopScores(limit) {
  if (!hasDatabase) {
    return memory.leaderboard
      .slice()
      .sort((a, b) => b.score - a.score || a.created_at - b.created_at)
      .slice(0, limit);
  }
  const result = await pool.query(
    `SELECT name, score, level, created_at FROM leaderboard
     ORDER BY score DESC, created_at ASC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function insertScore(name, score, level) {
  if (!hasDatabase) {
    memory.leaderboard.push({ id: memory.nextId++, name, score, level, created_at: Date.now() });
    return;
  }
  await pool.query(
    'INSERT INTO leaderboard (name, score, level) VALUES ($1, $2, $3)',
    [name, score, level]
  );
}

const STAT_FIELDS = ['visits', 'plays'];

async function incrementStat(field) {
  if (!STAT_FIELDS.includes(field)) throw new Error('invalid stat field: ' + field);
  if (!hasDatabase) {
    memory.stats[field] += 1;
    return;
  }
  await pool.query(`UPDATE site_stats SET ${field} = ${field} + 1, updated_at = NOW() WHERE id = 1`);
}

async function getStats() {
  if (!hasDatabase) {
    return { visits: memory.stats.visits, plays: memory.stats.plays };
  }
  const result = await pool.query('SELECT visits, plays FROM site_stats WHERE id = 1');
  return result.rows[0] || { visits: 0, plays: 0 };
}

module.exports = { initDb, fetchTopScores, insertScore, incrementStat, getStats };
