export const canvas = document.getElementById('gameCanvas');
export const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02060a, 0.012);

export const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2.2, 9);
camera.lookAt(0, 0, -10);

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

scene.add(new THREE.AmbientLight(0x445566, 0.9));
const dirLight = new THREE.DirectionalLight(0x99ddff, 0.8);
dirLight.position.set(3, 8, 6);
scene.add(dirLight);
const backLight = new THREE.PointLight(0x00ffe0, 1.2, 30);
backLight.position.set(0, 3, 6);
scene.add(backLight);

const starGeo = new THREE.BufferGeometry();
const STAR_COUNT = 900;
const starPos = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 120;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
  starPos[i * 3 + 2] = -Math.random() * 160;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0x88ffff, size: 0.18, transparent: true, opacity: 0.8 });
export const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

export function updateStarfield(dt) {
  stars.position.z += 6 * dt;
  if (stars.position.z > 60) stars.position.z = 0;
}
