import { scene } from './three-scene.js';
import { BOUND_X, BOUND_Y_MIN, BOUND_Y_MAX, MOVE_SPEED } from './constants.js';

export function buildPlayer() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8edf2, emissive: 0x0a2a2a, metalness: 0.6, roughness: 0.3 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x00e5d0, emissive: 0x00524a, metalness: 0.5, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b2430, metalness: 0.4, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x66e0ff, emissive: 0x1a5f6e, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.85 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.32, 2.0, 10), bodyMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = -0.1;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 10), accentMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.15;
  group.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), glassMat);
  canopy.position.set(0, 0.22, 0.35);
  canopy.rotation.x = -0.15;
  group.add(canopy);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(1.9, -0.35);
  wingShape.lineTo(1.55, -0.62);
  wingShape.lineTo(0.15, -0.32);
  wingShape.lineTo(0, -0.5);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false });
  const wingR = new THREE.Mesh(wingGeo, accentMat);
  wingR.rotation.x = Math.PI / 2;
  wingR.position.set(0.15, -0.02, 0.55);
  group.add(wingR);
  const wingL = wingR.clone();
  wingL.scale.x = -1;
  wingL.position.x = -0.15;
  group.add(wingL);

  const tailGeo = new THREE.BoxGeometry(0.9, 0.05, 0.4);
  const tailWing = new THREE.Mesh(tailGeo, darkMat);
  tailWing.position.set(0, 0.02, 0.85);
  group.add(tailWing);

  const finGeo = new THREE.BoxGeometry(0.05, 0.45, 0.4);
  const fin = new THREE.Mesh(finGeo, darkMat);
  fin.position.set(0, 0.28, 0.85);
  group.add(fin);

  const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), glowMat);
  glow.position.set(0, 0, 1.0);
  group.add(glow);
  const thrusterLight = new THREE.PointLight(0x00ffe0, 1.0, 5);
  thrusterLight.position.set(0, 0, 1.0);
  group.add(thrusterLight);

  // Wingtip nav lights. group is rotated 180 deg (see below) so nose faces -z;
  // local +x ends up on the player's own left (port) side after that flip,
  // so red (port, aviation convention) is placed at local +x on purpose.
  const tipMatPort = new THREE.MeshBasicMaterial({ color: 0xff3b6b });
  const tipPort = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), tipMatPort);
  tipPort.position.set(1.85, -0.32, 0.55);
  group.add(tipPort);
  const tipMatStarboard = new THREE.MeshBasicMaterial({ color: 0x33ff66 });
  const tipStarboard = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), tipMatStarboard);
  tipStarboard.position.set(-1.85, -0.32, 0.55);
  group.add(tipStarboard);

  const shieldMat = new THREE.MeshBasicMaterial({ color: 0x3fa8ff, transparent: true, opacity: 0.28, wireframe: true });
  const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), shieldMat);
  shieldMesh.visible = false;
  group.add(shieldMesh);
  group.userData.shieldMesh = shieldMesh;

  group.rotation.y = Math.PI;
  group.position.set(0, 0.3, 5);
  group.scale.set(0.55, 0.55, 0.55);
  return group;
}

export const player = buildPlayer();
export const shieldMesh = player.userData.shieldMesh;
scene.add(player);

export function resetPlayer() {
  player.position.set(0, 0.3, 5);
  player.rotation.set(0, Math.PI, 0);
  player.visible = true;
  shieldMesh.visible = false;
}

export function updatePlayerMovement(dt, keys) {
  let dx = 0, dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy += 1;
  if (keys.down) dy -= 1;
  player.position.x += dx * MOVE_SPEED * dt;
  player.position.y += dy * MOVE_SPEED * dt;
  player.position.x = Math.max(-BOUND_X, Math.min(BOUND_X, player.position.x));
  player.position.y = Math.max(BOUND_Y_MIN, Math.min(BOUND_Y_MAX, player.position.y));
  player.rotation.z = -dx * 0.35;
  player.rotation.x = dy * 0.12;
}
