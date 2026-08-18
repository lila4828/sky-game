require('dotenv').config();
const express = require('express');
const path = require('path');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const NAME_MAX_LEN = 12;
const SCORE_MAX = 10000000;
const LEVEL_MAX = 10000;
const TOP_N = 10;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, NAME_MAX_LEN);
  return trimmed.length ? trimmed : null;
}

async function fetchTop() {
  const result = await pool.query(
    `SELECT name, score, level, created_at FROM leaderboard
     ORDER BY score DESC, created_at ASC LIMIT $1`,
    [TOP_N]
  );
  return result.rows;
}

app.get('/api/leaderboard', async (req, res) => {
  try {
    res.json({ leaderboard: await fetchTop() });
  } catch (err) {
    console.error('leaderboard fetch error', err);
    res.status(500).json({ error: 'failed to fetch leaderboard' });
  }
});

app.post('/api/leaderboard', async (req, res) => {
  const name = sanitizeName(req.body && req.body.name);
  const score = Number(req.body && req.body.score);
  const level = Number(req.body && req.body.level);

  if (!name) return res.status(400).json({ error: 'invalid name' });
  if (!Number.isInteger(score) || score < 0 || score > SCORE_MAX) {
    return res.status(400).json({ error: 'invalid score' });
  }
  if (!Number.isInteger(level) || level < 1 || level > LEVEL_MAX) {
    return res.status(400).json({ error: 'invalid level' });
  }

  try {
    await pool.query(
      'INSERT INTO leaderboard (name, score, level) VALUES ($1, $2, $3)',
      [name, score, level]
    );
    res.json({ leaderboard: await fetchTop() });
  } catch (err) {
    console.error('leaderboard insert error', err);
    res.status(500).json({ error: 'failed to save score' });
  }
});

initDb()
  .catch((err) => {
    console.error('DB init failed - leaderboard endpoints will return errors until DATABASE_URL is set:', err.message);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  });
