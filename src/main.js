import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const planetButtonsContainer = document.querySelector('#planet-buttons');
const planetName = document.querySelector('#planet-name');
const planetDescription = document.querySelector('#planet-description');
const prevPlanetButton = document.querySelector('#prev-planet');
const nextPlanetButton = document.querySelector('#next-planet');

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
  { name: 'Mercury', size: 1.2, distance: 11, color: '#f2c89b', speed: 1.6, fact: 'Fast little bean and closest to the Sun.' },
  { name: 'Venus', size: 1.65, distance: 17, color: '#ffd9a8', speed: 1.2, fact: 'Thick clouds and the hottest planet vibes.' },
  { name: 'Earth', size: 1.8, distance: 24, color: '#9ed2ff', speed: 1.0, fact: 'Our cozy blue marble home.' },
  { name: 'Mars', size: 1.4, distance: 31, color: '#ffac8e', speed: 0.82, fact: 'Dusty red adventurer with giant volcanoes.' },
  { name: 'Jupiter', size: 3.8, distance: 44, color: '#ffd4ba', speed: 0.45, fact: 'Huge stormy giant with a famous red spot.' },
  { name: 'Saturn', size: 3.4, distance: 58, color: '#f9e4af', speed: 0.34, fact: 'Ring champion of the solar system.' },
  { name: 'Uranus', size: 2.5, distance: 72, color: '#aeeaff', speed: 0.26, fact: 'Icy giant that spins tipped on its side.' },
  { name: 'Neptune', size: 2.4, distance: 86, color: '#9db8ff', speed: 0.22, fact: 'Deep blue and super windy at the edge.' }
];

const planets = [];
const buttonsByName = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const worldCameraPosition = new THREE.Vector3();
let activeFocus = null;
let activeIndex = 0;

function createEye(radius, side) {
  const eyeRoot = new THREE.Group();
  eyeRoot.position.set(radius * 0.34 * side, radius * 0.16, radius * 0.92);

  const white = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.16, 20, 20),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45, metalness: 0.02 })
  );

  const pupilAnchor = new THREE.Group();
  pupilAnchor.position.z = radius * 0.125;
  white.add(pupilAnchor);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.07, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#0f1940', roughness: 0.4, metalness: 0.1 })
  );
  pupilAnchor.add(pupil);

  const sparkle = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.02, 12, 12),
    new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.25 })
  );
  sparkle.position.set(radius * 0.028, radius * 0.03, radius * 0.035);
  pupil.add(sparkle);

  eyeRoot.add(white);
  return { eyeRoot, pupilAnchor };
}

function addCuteFace(planetMesh, radius) {
  const leftEye = createEye(radius, -1);
  const rightEye = createEye(radius, 1);

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.34, radius * 0.055, 20, 60, Math.PI * 0.92),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.04 })
  );
  smile.position.set(0, -radius * 0.26, radius * 0.84);
  smile.rotation.z = Math.PI;

  const smileShadow = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.34, radius * 0.022, 12, 48, Math.PI * 0.92),
    new THREE.MeshStandardMaterial({ color: '#ff7faa', roughness: 0.65 })
  );
  smileShadow.position.set(0, -radius * 0.285, radius * 0.825);
  smileShadow.rotation.z = Math.PI;

  const cheekGeometry = new THREE.SphereGeometry(radius * 0.1, 16, 16);
  const cheekMaterial = new THREE.MeshStandardMaterial({ color: '#ffb7c9', roughness: 0.8 });
  const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
  leftCheek.position.set(-radius * 0.5, -radius * 0.08, radius * 0.84);
  const rightCheek = leftCheek.clone();
  rightCheek.position.x *= -1;

  planetMesh.add(leftEye.eyeRoot, rightEye.eyeRoot, smile, smileShadow, leftCheek, rightCheek);

  return {
    eyeRoots: [leftEye.eyeRoot, rightEye.eyeRoot],
    pupilAnchors: [leftEye.pupilAnchor, rightEye.pupilAnchor],
    eyeRestScaleY: 1,
    nextWinkAt: Math.random() * 4 + 2,
    winkEyeIndex: Math.random() > 0.5 ? 1 : 0,
    winkDuration: 0,
    winkProgress: 0
  };
}

function setActivePlanet(planet, options = {}) {
  const { snap = false } = options;

  activeFocus = planet;
  activeIndex = planet.userData.idx;
  planetName.textContent = planet.userData.name;
  planetDescription.textContent = planet.userData.fact;

  buttonsByName.forEach((button, name) => {
    button.classList.toggle('active', name === planet.userData.name);
  });

  if (snap) {
    const planetPosition = new THREE.Vector3();
    activeFocus.getWorldPosition(planetPosition);
    const snappedCameraPosition = planetPosition
      .clone()
      .add(new THREE.Vector3(0, activeFocus.userData.size * 1.6, activeFocus.userData.size * 4.6));

    camera.position.copy(snappedCameraPosition);
    controls.target.copy(planetPosition);
    controls.update();
  }
}

function focusRelativePlanet(direction) {
  const nextIndex = (activeIndex + direction + planets.length) % planets.length;
  setActivePlanet(planets[nextIndex]);
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

  const faceData = addCuteFace(planet, config.size);

  if (config.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(config.size * 1.3, config.size * 2.0, 64),
      new THREE.MeshStandardMaterial({ color: '#d6c596', side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    ring.rotation.x = Math.PI * 0.43;
    planet.add(ring);
  }

  planet.position.x = config.distance;
  planet.userData = { ...config, idx, pivot, faceData };
  pivot.add(planet);
  planets.push(planet);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'planet-button';
  button.textContent = config.name;
  button.style.setProperty('--planet-color', config.color);
  button.addEventListener('click', () => setActivePlanet(planet));
  planetButtonsContainer.append(button);
  buttonsByName.set(config.name, button);
}

setActivePlanet(planets[2], { snap: true });

prevPlanetButton?.addEventListener('click', () => focusRelativePlanet(-1));
nextPlanetButton?.addEventListener('click', () => focusRelativePlanet(1));

window.addEventListener('dblclick', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(planets, false);
  if (hits.length > 0) {
    setActivePlanet(hits[0].object);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();
let elapsedTime = 0;

function animate() {
  const delta = clock.getDelta();
  elapsedTime += delta;
  const elapsed = elapsedTime;

  planets.forEach((planet) => {
    const { speed, idx, pivot, faceData } = planet.userData;
    pivot.rotation.y = elapsed * speed * 0.3;
    planet.rotation.y += 0.01 + idx * 0.0008;

    planet.worldToLocal(worldCameraPosition.copy(camera.position));
    const eyeLookX = THREE.MathUtils.clamp(worldCameraPosition.x / planet.userData.size, -0.5, 0.5);
    const eyeLookY = THREE.MathUtils.clamp(worldCameraPosition.y / planet.userData.size, -0.35, 0.35);

    faceData.pupilAnchors.forEach((pupilAnchor) => {
      pupilAnchor.position.x = eyeLookX * planet.userData.size * 0.052;
      pupilAnchor.position.y = eyeLookY * planet.userData.size * 0.045;
    });

    if (elapsed >= faceData.nextWinkAt) {
      faceData.winkDuration = 0.22 + Math.random() * 0.22;
      faceData.winkProgress = 0;
      faceData.winkEyeIndex = Math.random() > 0.5 ? 1 : 0;
      faceData.nextWinkAt = elapsed + 2.6 + Math.random() * 4.8;
    }

    if (faceData.winkProgress < faceData.winkDuration) {
      faceData.winkProgress += delta;
      const phase = faceData.winkProgress / faceData.winkDuration;
      const blinkScale = 0.08 + Math.abs(Math.cos(phase * Math.PI)) * 0.92;
      faceData.eyeRoots.forEach((eye, eyeIndex) => {
        eye.scale.y = eyeIndex === faceData.winkEyeIndex ? blinkScale : faceData.eyeRestScaleY;
      });
    } else {
      faceData.eyeRoots.forEach((eye) => {
        eye.scale.y = faceData.eyeRestScaleY;
      });
    }
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
