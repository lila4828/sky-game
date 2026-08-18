let audioCtx = null;
export let muted = false;

export function setMuted(v) {
  muted = v;
}

export function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
}

function beep(freq, dur, type, vol) {
  if (muted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.value = freq;
  gain.gain.value = vol || 0.06;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}

export function sfxShoot() { beep(880, 0.08, 'square', 0.05); }
export function sfxExplode() { beep(140, 0.25, 'sawtooth', 0.08); }
export function sfxHit() { beep(90, 0.35, 'sawtooth', 0.1); }
export function sfxPowerup() { beep(660, 0.16, 'sine', 0.07); beep(990, 0.16, 'sine', 0.07); }
export function sfxLifeUp() { beep(660, 0.18, 'sine', 0.07); beep(880, 0.18, 'sine', 0.07); }
