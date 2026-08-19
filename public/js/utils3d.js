import { scene, camera } from './three-scene.js';

const bulletGeoRegistry = new Set();
export function registerSharedGeometry(geo) {
  bulletGeoRegistry.add(geo);
}

// Frees GPU geometry/material for anything removed from the scene mid-game.
// Geometries registered via registerSharedGeometry (reused across many spawns)
// and cached emoji textures are intentionally left alone since other live
// objects still reference them.
export function disposeAndRemove(obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse(function (child) {
    if (child.geometry && !bulletGeoRegistry.has(child.geometry)) {
      child.geometry.dispose();
    }
    if (child.material) {
      child.material.dispose();
    }
  });
}

const emojiTextureCache = {};
export function getEmojiTexture(emoji) {
  if (emojiTextureCache[emoji]) return emojiTextureCache[emoji];
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = Math.floor(size * 0.82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  emojiTextureCache[emoji] = tex;
  return tex;
}

export function makeEmojiSprite(emoji, scale, glowColor) {
  const mat = new THREE.SpriteMaterial({ map: getEmojiTexture(emoji), transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, scale);
  if (glowColor) {
    const light = new THREE.PointLight(glowColor, 0.6, 4);
    sprite.add(light);
  }
  return sprite;
}

export function spawnExplosion(particles, pos, color, count) {
  const n = count || 10;
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: color || 0xffaa33, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize();
    const sp = 3 + Math.random() * 4;
    particles.push({ mesh: mesh, vel: dir.multiplyScalar(sp), life: 0.5 + Math.random() * 0.3, age: 0 });
  }
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) {
      disposeAndRemove(p.mesh);
      particles.splice(i, 1);
      continue;
    }
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.material.opacity = 1 - (p.age / p.life);
  }
}

const shake = { time: 0, duration: 0, intensity: 0 };
export function shakeCamera(intensity, duration) {
  shake.intensity = intensity;
  shake.duration = duration;
  shake.time = duration;
}

export function applyShake(dt) {
  if (shake.time > 0) {
    shake.time -= dt;
    const t = Math.max(shake.time, 0) / shake.duration;
    const mag = shake.intensity * t;
    camera.position.x += (Math.random() - 0.5) * mag;
    camera.position.y += (Math.random() - 0.5) * mag;
  }
}
