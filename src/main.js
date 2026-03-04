import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#040712');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 45, 120);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 260;
controls.minDistance = 9;

scene.add(new THREE.AmbientLight('#9bb2ff', 0.35));
const sunLight = new THREE.PointLight('#ffd49e', 2.1, 0, 0.7);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const starGeometry = new THREE.BufferGeometry();
const starCount = 1500;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const i3 = i * 3;
  const radius = 380 + Math.random() * 520;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i3 + 2] = radius * Math.cos(phi);
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: '#ffffff', size: 1.1, sizeAttenuation: true })
);
scene.add(stars);

const orbitGroup = new THREE.Group();
scene.add(orbitGroup);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4.8, 48, 48),
  new THREE.MeshStandardMaterial({ color: '#ffcf63', emissive: '#ff9d2a', emissiveIntensity: 1.2 })
);
scene.add(sun);

const planetConfigs = [
  { name: 'Mercury', size: 1.2, distance: 11, color: '#f2c89b', speed: 1.6 },
  { name: 'Venus', size: 1.65, distance: 17, color: '#ffd9a8', speed: 1.2 },
  { name: 'Earth', size: 1.8, distance: 24, color: '#9ed2ff', speed: 1.0 },
  { name: 'Mars', size: 1.4, distance: 31, color: '#ffac8e', speed: 0.82 },
  { name: 'Jupiter', size: 3.8, distance: 44, color: '#ffd4ba', speed: 0.45 },
  { name: 'Saturn', size: 3.4, distance: 58, color: '#f9e4af', speed: 0.34 },
  { name: 'Uranus', size: 2.5, distance: 72, color: '#aeeaff', speed: 0.26 },
  { name: 'Neptune', size: 2.4, distance: 86, color: '#9db8ff', speed: 0.22 }
];

const planets = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeFocus = null;

function addCuteFace(planetMesh, radius) {
  const eyeGeometry = new THREE.SphereGeometry(radius * 0.11, 16, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#1f2a4a', roughness: 0.6 });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-radius * 0.28, radius * 0.1, radius * 0.94);
  const rightEye = leftEye.clone();
  rightEye.position.x *= -1;

  const cheekGeometry = new THREE.SphereGeometry(radius * 0.08, 16, 16);
  const cheekMaterial = new THREE.MeshStandardMaterial({ color: '#ffb7c9', roughness: 0.8 });
  const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  leftCheek.position.set(-radius * 0.45, -radius * 0.08, radius * 0.88);
  const rightCheek = leftCheek.clone();
  rightCheek.position.x *= -1;

  planetMesh.add(leftEye, rightEye, leftCheek, rightCheek);
}

for (const [idx, config] of planetConfigs.entries()) {
  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(config.distance - 0.06, config.distance + 0.06, 180),
    new THREE.MeshBasicMaterial({ color: '#3f4f89', side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  const pivot = new THREE.Object3D();
  orbitGroup.add(pivot);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(config.size, 32, 32),
    new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.9, metalness: 0.05 })
  );

  addCuteFace(planet, config.size);

  if (config.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(config.size * 1.3, config.size * 2.0, 64),
      new THREE.MeshStandardMaterial({ color: '#d6c596', side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    ring.rotation.x = Math.PI * 0.43;
    planet.add(ring);
  }

  planet.position.x = config.distance;
  planet.userData = { ...config, idx, pivot };
  pivot.add(planet);
  planets.push(planet);
}

window.addEventListener('dblclick', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(planets, false);
  if (hits.length > 0) {
    activeFocus = hits[0].object;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  planets.forEach((planet) => {
    const { speed, idx, pivot } = planet.userData;
    pivot.rotation.y = elapsed * speed * 0.3;
    planet.rotation.y += 0.01 + idx * 0.0008;
  });

  sun.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.03);

  if (activeFocus) {
    const planetPosition = new THREE.Vector3();
    activeFocus.getWorldPosition(planetPosition);
    const idealPosition = planetPosition.clone().add(new THREE.Vector3(0, activeFocus.userData.size * 1.6, activeFocus.userData.size * 4.6));

    camera.position.lerp(idealPosition, 0.04);
    controls.target.lerp(planetPosition, 0.08);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
