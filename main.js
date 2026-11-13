import * as THREE from 'three';

const canvas = document.getElementById('scene');
const fallback = document.getElementById('webgl-fallback');
const loader = document.getElementById('loader');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  fallback.hidden = false;
  loader.classList.add('done');
  throw e;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060b, 0.02);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.6, 11.5);

const hemi = new THREE.HemisphereLight(0x8fa3ff, 0x0a0a12, 0.5);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 6, 6);
scene.add(key);

const rim = new THREE.DirectionalLight(0x7c5cff, 1.6);
rim.position.set(-6, 2, -5);
scene.add(rim);

const warm = new THREE.PointLight(0xff6a00, 30, 30);
warm.position.set(-5, -3, 4);
scene.add(warm);

/* ---------- Textures ---------- */

function makeScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 1280;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 640, 1280);
  grad.addColorStop(0, '#171038');
  grad.addColorStop(0.55, '#3a0f4d');
  grad.addColorStop(1, '#0b0b1e');
  g.fillStyle = grad;
  g.fillRect(0, 0, 640, 1280);

  const orb = (x, y, r, col) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  orb(500, 280, 320, 'rgba(255,106,0,0.5)');
  orb(140, 1000, 360, 'rgba(124,92,255,0.45)');

  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.font = '600 130px "Space Grotesk", sans-serif';
  g.fillText('09:41', 320, 300);
  g.font = '400 34px Inter, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillText('Martedì 17 marzo', 320, 362);

  g.beginPath();
  g.arc(320, 1060, 150, 0, Math.PI * 2);
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 2;
  g.stroke();

  g.fillStyle = '#ffffff';
  g.font = '700 56px "Space Grotesk", sans-serif';
  g.fillText('XIAOMI 18', 320, 1150);
  g.font = '400 32px Inter, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText('Fold', 320, 1200);

  g.beginPath();
  g.arc(320, 30, 11, 0, Math.PI * 2);
  g.fillStyle = '#0a0a0f';
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeCoverTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, '#0c0c16');
  grad.addColorStop(1, '#141224');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 1024);

  g.textAlign = 'right';
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.font = '600 92px "Space Grotesk", sans-serif';
  g.fillText('09:41', 460, 210);
  g.font = '400 26px Inter, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillText('mar 17 mar', 460, 256);

  g.textAlign = 'left';
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.font = '700 40px "Space Grotesk", sans-serif';
  g.fillText('XIAOMI', 52, 950);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ---------- Phone model ---------- */

const HALF_W = 4.4;
const HALF_H = 6.9;
const T = 0.11;
const BEVEL = 0.016;

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const bodyGeo = new THREE.ExtrudeGeometry(roundedRectShape(HALF_W, HALF_H, 0.42), {
  depth: T,
  bevelEnabled: true,
  bevelThickness: BEVEL,
  bevelSize: 0.02,
  bevelSegments: 3,
  curveSegments: 16,
});

const bodyMat = new THREE.MeshPhysicalMaterial({
  color: 0x8b939e,
  metalness: 0.85,
  roughness: 0.32,
  clearcoat: 0.6,
  clearcoatRoughness: 0.25,
});

const frameMat = new THREE.MeshPhysicalMaterial({
  color: 0xd8dbe0,
  metalness: 1,
  roughness: 0.22,
});

const screenMat = new THREE.MeshBasicMaterial({ map: makeScreenTexture(), toneMapped: false });
const coverMat = new THREE.MeshBasicMaterial({ map: makeCoverTexture(), toneMapped: false });

const lensGlassMat = new THREE.MeshPhysicalMaterial({
  color: 0x05070c,
  metalness: 0.4,
  roughness: 0.05,
  clearcoat: 1,
});
const lensRingMat = new THREE.MeshPhysicalMaterial({
  color: 0xcfd3da,
  metalness: 1,
  roughness: 0.3,
});

const phone = new THREE.Group();
scene.add(phone);

function buildHalf() {
  const half = new THREE.Group();

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.z = BEVEL;
  half.add(body);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W - 0.42, HALF_H - 0.42), screenMat);
  screen.position.z = T + BEVEL + 0.004;
  half.add(screen);

  return half;
}

const leftHalf = buildHalf();
leftHalf.position.x = -HALF_W / 2;
phone.add(leftHalf);

const hingeGroup = new THREE.Group();
phone.add(hingeGroup);

const rightHalf = buildHalf();
rightHalf.position.x = HALF_W / 2;
hingeGroup.add(rightHalf);

const coverScreen = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W - 0.55, HALF_H - 0.95), coverMat);
coverScreen.rotation.y = Math.PI;
coverScreen.position.z = -BEVEL - 0.004;
leftHalf.add(coverScreen);

const cameraBump = new THREE.Mesh(
  new THREE.ExtrudeGeometry(roundedRectShape(1.75, 1.75, 0.5), {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 12,
  }),
  bodyMat
);
cameraBump.position.set(HALF_W / 2 - 1.05, HALF_H / 2 - 1.05, -BEVEL - 0.08);
hingeGroup.add(cameraBump);

const lensPositions = [
  [-0.4, 0.4],
  [0.4, 0.4],
  [0, -0.4],
];
lensPositions.forEach(([dx, dy]) => {
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 32), lensGlassMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(HALF_W / 2 - 1.05 + dx, HALF_H / 2 - 1.05 + dy, -BEVEL - 0.12);
  hingeGroup.add(lens);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 12, 40), lensRingMat);
  ring.position.copy(lens.position);
  ring.position.z -= 0.015;
  hingeGroup.add(ring);
});

const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24), lensGlassMat);
flash.rotation.x = Math.PI / 2;
flash.position.set(HALF_W / 2 - 1.05 - 0.55, HALF_H / 2 - 1.05 - 0.55, -BEVEL - 0.1);
hingeGroup.add(flash);

const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, HALF_H * 0.92, 32), frameMat);
hinge.position.set(0, 0, 0);
phone.add(hinge);

/* ---------- Particles ---------- */

const pCount = 450;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const r = 9 + Math.random() * 16;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 22;
  pPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particles = new THREE.Points(
  pGeo,
  new THREE.PointsMaterial({ color: 0x9aa7ff, size: 0.035, transparent: true, opacity: 0.55, sizeAttenuation: true })
);
scene.add(particles);

/* ---------- Scroll choreography ---------- */

const PI = Math.PI;
const KEYS = [
  { p: 0.0,  fold: 0,          cam: [0, 0.6, 11.5],   rotY: 0,        look: [0, 0, 0] },
  { p: 0.15, fold: 0,          cam: [4.6, 1.4, 9.2],  rotY: -0.5,     look: [0, 0, 0] },
  { p: 0.3,  fold: PI * 0.96,  cam: [5.6, 0.8, 7.6],  rotY: 0.55,     look: [0, 0, 0] },
  { p: 0.45, fold: 0,          cam: [0, 0.2, 9.4],    rotY: 0,        look: [0, 0, 0] },
  { p: 0.6,  fold: PI * 0.5,   cam: [2.2, 0.6, 5.4],  rotY: 0.95,     look: [0, 0, 0] },
  { p: 0.74, fold: PI * 0.97,  cam: [-4.8, 1.2, 7.6], rotY: PI * 0.9, look: [0, 0, 0] },
  { p: 0.87, fold: 0.4,        cam: [0, 0.3, 10.6],   rotY: PI * 0.15,look: [0, 0, 0] },
  { p: 1.0,  fold: 0,          cam: [0, 0.9, 12.2],   rotY: PI * 2,   look: [0, 0, 0] },
];

function sampleKeys(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1);
  const e = t * t * (3 - 2 * t);
  return {
    fold: THREE.MathUtils.lerp(a.fold, b.fold, e),
    cam: a.cam.map((v, j) => THREE.MathUtils.lerp(v, b.cam[j], e)),
    rotY: THREE.MathUtils.lerp(a.rotY, b.rotY, e),
  };
}

/* ---------- Interaction ---------- */

const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});

const swatches = document.querySelectorAll('.swatch');
swatches.forEach((btn) => {
  btn.addEventListener('click', () => {
    swatches.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const col = new THREE.Color(btn.dataset.color);
    bodyMat.color.copy(col);
    frameMat.color.copy(col).lerp(new THREE.Color(0xffffff), 0.35);
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  },
  { threshold: 0.2 }
);
document.querySelectorAll('.panel').forEach((el) => revealObserver.observe(el));

/* ---------- Resize ---------- */

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

/* ---------- Render loop ---------- */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = new THREE.Clock();
let firstFrame = true;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  const doc = document.documentElement;
  const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
  const p = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
  const k = sampleKeys(p);

  const sway = reducedMotion ? 0 : Math.sin(t * 0.6) * 0.05;
  const breathe = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.03 * (1 - Math.min(k.fold, 1) * 0.5);

  phone.rotation.y = k.rotY + mouse.x * 0.12 + sway * 0.4;
  phone.rotation.x = mouse.y * 0.05;
  phone.position.y = Math.sin(t * 0.7) * 0.08;

  hingeGroup.rotation.y = -k.fold - breathe;
  hingeGroup.position.z = Math.sin(k.fold) * 0.02;

  camera.position.set(
    k.cam[0] + mouse.x * 0.4,
    k.cam[1] - mouse.y * 0.3,
    k.cam[2] * (camera.aspect < 1 ? 1.35 : 1)
  );
  camera.lookAt(k.look[0], k.look[1], k.look[2]);

  particles.rotation.y = t * 0.02;
  particles.rotation.x = Math.sin(t * 0.1) * 0.05;

  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    loader.classList.add('done');
  }
}

animate();
