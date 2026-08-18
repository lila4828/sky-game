const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
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

module.exports = { pool, initDb };
