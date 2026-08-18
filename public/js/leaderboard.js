import { state } from './state.js';

const viewRankBtn = document.getElementById('viewRankBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardListEl = document.getElementById('leaderboardList');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const gameOverListEl = document.getElementById('gameOverLeaderboardList');
const nicknameInput = document.getElementById('nicknameInput');
const submitBtn = document.getElementById('submitScoreBtn');
const submitStatusEl = document.getElementById('submitStatus');

function renderLeaderboard(el, list) {
  el.innerHTML = '';
  if (!list || !list.length) {
    const empty = document.createElement('li');
    empty.className = 'lb-empty';
    empty.textContent = '아직 기록이 없습니다';
    el.appendChild(empty);
    return;
  }
  list.forEach(function (row, i) {
    const li = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = String(i + 1);
    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = row.name;
    const score = document.createElement('span');
    score.className = 'lb-score';
    score.textContent = row.score;
    li.appendChild(rank);
    li.appendChild(name);
    li.appendChild(score);
    el.appendChild(li);
  });
}

function fetchLeaderboard(targetEl) {
  fetch('/api/leaderboard').then(function (r) {
    if (!r.ok) throw new Error('bad response');
    return r.json();
  }).then(function (data) {
    renderLeaderboard(targetEl, data.leaderboard);
  }).catch(function () {
    targetEl.innerHTML = '';
    const err = document.createElement('li');
    err.className = 'lb-error';
    err.textContent = '랭킹을 불러올 수 없습니다';
    targetEl.appendChild(err);
  });
}

export function refreshGameOverBoard() {
  nicknameInput.value = '';
  submitStatusEl.textContent = '';
  submitBtn.disabled = false;
  fetchLeaderboard(gameOverListEl);
}

export function initLeaderboardUI() {
  viewRankBtn.addEventListener('click', function () {
    leaderboardModal.classList.remove('hidden');
    fetchLeaderboard(leaderboardListEl);
  });
  closeLeaderboardBtn.addEventListener('click', function () {
    leaderboardModal.classList.add('hidden');
  });

  submitBtn.addEventListener('click', function () {
    const name = nicknameInput.value.trim().slice(0, 12);
    if (!name) { submitStatusEl.textContent = '닉네임을 입력하세요'; return; }
    submitBtn.disabled = true;
    submitStatusEl.textContent = '등록 중...';
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, score: state.score, level: state.level })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad response');
      return r.json();
    }).then(function (data) {
      submitStatusEl.textContent = '등록 완료!';
      renderLeaderboard(gameOverListEl, data.leaderboard);
    }).catch(function () {
      submitStatusEl.textContent = '등록 실패 - 다시 시도해주세요';
      submitBtn.disabled = false;
    });
  });
}
