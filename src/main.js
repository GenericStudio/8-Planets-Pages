import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const planetButtonsContainer = document.querySelector('#planet-buttons');
const planetName = document.querySelector('#planet-name');
const planetDescription = document.querySelector('#planet-description');
const prevPlanetButton = document.querySelector('#prev-planet');
const nextPlanetButton = document.querySelector('#next-planet');
const versionIndicator = document.querySelector('#version-indicator');

const APP_VERSION = 'v2026.03.04.5';

if (versionIndicator) {
  versionIndicator.textContent = `Version: ${APP_VERSION}`;
}

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

const moonConfigs = {
  Earth: [{ name: 'Moon', size: 0.42, distance: 3.2, speed: 2.6, color: '#dfe8ff' }],
  Mars: [
    { name: 'Phobos', size: 0.22, distance: 2.1, speed: 4.4, color: '#d6bca2' },
    { name: 'Deimos', size: 0.16, distance: 2.8, speed: 3.7, color: '#cfa987' }
  ],
  Jupiter: [
    { name: 'Io', size: 0.4, distance: 6.2, speed: 2.7, color: '#f8dd94' },
    { name: 'Europa', size: 0.34, distance: 7.4, speed: 2.2, color: '#e4e8ff' },
    { name: 'Ganymede', size: 0.48, distance: 8.7, speed: 1.8, color: '#d7cab8' }
  ],
  Saturn: [{ name: 'Titan', size: 0.38, distance: 6.6, speed: 2.0, color: '#f1cf97' }],
  Uranus: [{ name: 'Titania', size: 0.26, distance: 4.4, speed: 2.2, color: '#d6f5ff' }],
  Neptune: [{ name: 'Triton', size: 0.3, distance: 4.8, speed: 2.1, color: '#cae1ff' }]
};

const dwarfPlanetConfigs = [
  { name: 'Ceres', size: 0.62, distance: 37, color: '#cebdab', speed: 0.72, fact: 'Largest object in the asteroid belt.' },
  { name: 'Pluto', size: 0.78, distance: 103, color: '#ccb8a5', speed: 0.18, fact: 'Kuiper belt icon with a heart-shaped plain.' },
  { name: 'Haumea', size: 0.62, distance: 116, color: '#d6e6ff', speed: 0.14, fact: 'Spinning fast and shaped like a cosmic football.' },
  { name: 'Eris', size: 0.74, distance: 130, color: '#d2c7d9', speed: 0.12, fact: 'A distant icy world beyond Pluto.' }
];

const planets = [];
const dwarfPlanets = [];
const buttonsByName = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const worldCameraPosition = new THREE.Vector3();
const cameraTargetPosition = new THREE.Vector3();
const cameraFocusPosition = new THREE.Vector3();
let activeFocus = null;
let activeIndex = 0;

const cameraTransition = {
  active: false,
  duration: 0.72,
  elapsed: 0,
  startCamera: new THREE.Vector3(),
  endCamera: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3()
};

const currentFocusPlanetPosition = new THREE.Vector3();
const previousFocusPlanetPosition = new THREE.Vector3();
const focusPlanetDelta = new THREE.Vector3();
let hasFocusReference = false;
const moonBodies = [];

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



function createMoon(planet, config) {
  const moonPivot = new THREE.Object3D();
  planet.add(moonPivot);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(config.size, 18, 18),
    new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.88, metalness: 0.03 })
  );
  moon.position.x = config.distance;
  moonPivot.add(moon);

  moonBodies.push({ moonPivot, moon, speed: config.speed, baseRotation: Math.random() * Math.PI * 2 });
}

function createAsteroidBelt({ innerRadius, outerRadius, count, spread, color }) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * spread;
    positions[i3 + 2] = Math.sin(angle) * radius;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color, size: 0.34, transparent: true, opacity: 0.78 });

  const belt = new THREE.Points(geometry, material);
  scene.add(belt);
  return belt;
}

function addPlanetCharacter(planetMesh, config) {
  const radius = config.size;

  if (config.name === 'Mercury') {
    const craterMaterial = new THREE.MeshStandardMaterial({ color: '#d3a67f', roughness: 0.95 });
    const crater1 = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.26, 28), craterMaterial);
    crater1.position.set(radius * 0.52, radius * 0.22, radius * 0.72);
    crater1.rotation.y = -Math.PI * 0.18;

    const crater2 = crater1.clone();
    crater2.scale.setScalar(0.55);
    crater2.position.set(-radius * 0.5, -radius * 0.08, radius * 0.76);
    crater2.rotation.y = Math.PI * 0.24;

    planetMesh.add(crater1, crater2);
    return;
  }

  if (config.name === 'Venus') {
    const cloudBandMaterial = new THREE.MeshStandardMaterial({
      color: '#ffe8c4',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.75
    });
    const cloudBand = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, radius * 0.055, 12, 64), cloudBandMaterial);
    cloudBand.rotation.x = Math.PI * 0.48;

    const cloudBand2 = cloudBand.clone();
    cloudBand2.scale.setScalar(0.78);
    cloudBand2.rotation.x = Math.PI * 0.58;
    cloudBand2.rotation.y = Math.PI * 0.2;

    planetMesh.add(cloudBand, cloudBand2);
    return;
  }

  if (config.name === 'Earth') {
    const continentMaterial = new THREE.MeshStandardMaterial({ color: '#57b76a', roughness: 0.9 });
    const continent1 = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.34, 18, 18), continentMaterial);
    continent1.scale.set(1.15, 0.66, 0.35);
    continent1.position.set(-radius * 0.45, radius * 0.02, radius * 0.76);

    const continent2 = continent1.clone();
    continent2.scale.set(0.85, 0.52, 0.3);
    continent2.position.set(radius * 0.45, radius * 0.24, radius * 0.7);

    const continent3 = continent1.clone();
    continent3.scale.set(0.74, 0.44, 0.28);
    continent3.position.set(radius * 0.02, -radius * 0.42, radius * 0.73);

    planetMesh.add(continent1, continent2, continent3);
    return;
  }

  if (config.name === 'Mars') {
    const olympusMons = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.26, radius * 0.28, 28),
      new THREE.MeshStandardMaterial({ color: '#de7f64', roughness: 0.9 })
    );
    olympusMons.position.set(radius * 0.48, radius * 0.36, radius * 0.66);
    olympusMons.lookAt(radius * 0.9, radius * 0.66, radius * 1.5);

    const caldera = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.085, radius * 0.085, radius * 0.04, 18),
      new THREE.MeshStandardMaterial({ color: '#b95f4a', roughness: 0.95 })
    );
    caldera.position.set(radius * 0.48, radius * 0.5, radius * 0.74);

    planetMesh.add(olympusMons, caldera);
    return;
  }

  if (config.name === 'Jupiter') {
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: '#f0ba9f', roughness: 0.84, transparent: true, opacity: 0.92 });
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.96, radius * 0.085, 12, 96), stripeMaterial);
    stripe.rotation.x = Math.PI / 2;

    const stripe2 = stripe.clone();
    stripe2.scale.set(0.84, 0.84, 0.84);
    stripe2.rotation.z = Math.PI * 0.1;

    const redSpot = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.29, 24, 24),
      new THREE.MeshStandardMaterial({ color: '#d9624e', roughness: 0.85 })
    );
    redSpot.scale.set(1.5, 0.76, 0.35);
    redSpot.position.set(radius * 0.66, -radius * 0.05, radius * 0.58);

    planetMesh.add(stripe, stripe2, redSpot);
    return;
  }

  if (config.name === 'Saturn') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.82, radius * 0.05, 10, 80),
      new THREE.MeshStandardMaterial({ color: '#e7cf8d', roughness: 0.88, transparent: true, opacity: 0.78 })
    );
    band.rotation.x = Math.PI / 2;
    planetMesh.add(band);
    return;
  }

  if (config.name === 'Uranus') {
    const iceCapMaterial = new THREE.MeshStandardMaterial({ color: '#d8f8ff', roughness: 0.7, transparent: true, opacity: 0.9 });
    const capNorth = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.36, 20, 20), iceCapMaterial);
    capNorth.scale.set(1.2, 0.5, 1.2);
    capNorth.position.set(0, radius * 0.78, 0);

    const capSouth = capNorth.clone();
    capSouth.position.y *= -1;

    planetMesh.add(capNorth, capSouth);
    return;
  }

  if (config.name === 'Neptune') {
    const windBand = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.92, radius * 0.06, 12, 80),
      new THREE.MeshStandardMaterial({ color: '#7aa7ff', roughness: 0.82, transparent: true, opacity: 0.8 })
    );
    windBand.rotation.x = Math.PI / 2;

    const darkSpot = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.26, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#4568c7', roughness: 0.9 })
    );
    darkSpot.scale.set(1.35, 0.85, 0.34);
    darkSpot.position.set(-radius * 0.56, radius * 0.18, radius * 0.64);

    planetMesh.add(windBand, darkSpot);
  }
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

  activeFocus.getWorldPosition(cameraFocusPosition);
  cameraTargetPosition.copy(cameraFocusPosition).add(new THREE.Vector3(0, activeFocus.userData.size * 1.6, activeFocus.userData.size * 4.6));

  if (snap) {
    camera.position.copy(cameraTargetPosition);
    controls.target.copy(cameraFocusPosition);
    controls.update();
    cameraTransition.active = false;
    previousFocusPlanetPosition.copy(cameraFocusPosition);
    hasFocusReference = true;
    return;
  }

  cameraTransition.active = true;
  cameraTransition.elapsed = 0;
  cameraTransition.startCamera.copy(camera.position);
  cameraTransition.endCamera.copy(cameraTargetPosition);
  cameraTransition.startTarget.copy(controls.target);
  cameraTransition.endTarget.copy(cameraFocusPosition);
  hasFocusReference = false;
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

  addPlanetCharacter(planet, config);
  const faceData = addCuteFace(planet, config.size);

  if (config.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(config.size * 1.3, config.size * 2.0, 64),
      new THREE.MeshStandardMaterial({ color: '#d6c596', side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    ring.rotation.x = Math.PI * 0.43;
    planet.add(ring);
  }

  for (const moonConfig of moonConfigs[config.name] ?? []) {
    createMoon(planet, moonConfig);
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

const asteroidBelt = createAsteroidBelt({
  innerRadius: 34,
  outerRadius: 41,
  count: 2200,
  spread: 2.6,
  color: '#8e9bc8'
});

const kuiperBelt = createAsteroidBelt({
  innerRadius: 97,
  outerRadius: 142,
  count: 2600,
  spread: 6,
  color: '#7083bf'
});

for (const [idx, config] of dwarfPlanetConfigs.entries()) {
  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(config.distance - 0.04, config.distance + 0.04, 220),
    new THREE.MeshBasicMaterial({ color: '#475993', side: THREE.DoubleSide, transparent: true, opacity: 0.28 })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  const pivot = new THREE.Object3D();
  orbitGroup.add(pivot);

  const dwarfPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(config.size, 24, 24),
    new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.9, metalness: 0.03 })
  );
  dwarfPlanet.position.x = config.distance;
  dwarfPlanet.userData = { ...config, idx, pivot };
  pivot.rotation.y = idx * 0.9;
  pivot.add(dwarfPlanet);
  dwarfPlanets.push(dwarfPlanet);
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

controls.addEventListener('start', () => {
  cameraTransition.active = false;
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

  moonBodies.forEach((moonData, idx) => {
    moonData.moonPivot.rotation.y = elapsed * moonData.speed + moonData.baseRotation;
    moonData.moon.rotation.y += 0.011 + idx * 0.0006;
  });

  dwarfPlanets.forEach((dwarfPlanet) => {
    const { speed, idx, pivot } = dwarfPlanet.userData;
    pivot.rotation.y += delta * speed * 0.3;
    dwarfPlanet.rotation.y += 0.008 + idx * 0.0005;
  });

  asteroidBelt.rotation.y += delta * 0.011;
  kuiperBelt.rotation.y += delta * 0.007;

  if (activeFocus) {
    activeFocus.getWorldPosition(currentFocusPlanetPosition);

    if (!hasFocusReference) {
      previousFocusPlanetPosition.copy(currentFocusPlanetPosition);
      hasFocusReference = true;
    }

    if (cameraTransition.active) {
      cameraTransition.elapsed += delta;
      const linearT = Math.min(cameraTransition.elapsed / cameraTransition.duration, 1);
      const easedT = 1 - (1 - linearT) ** 3;

      camera.position.lerpVectors(cameraTransition.startCamera, cameraTransition.endCamera, easedT);
      controls.target.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, easedT);

      if (linearT >= 1) {
        cameraTransition.active = false;
      }
    } else {
      focusPlanetDelta.subVectors(currentFocusPlanetPosition, previousFocusPlanetPosition);
      camera.position.add(focusPlanetDelta);
      controls.target.add(focusPlanetDelta);
    }

    previousFocusPlanetPosition.copy(currentFocusPlanetPosition);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
