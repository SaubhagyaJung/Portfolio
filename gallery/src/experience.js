import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMaterials } from './materials.js';
import { buildArchitecture } from './architecture.js';
import { createArtworks, addSign } from './artworks.js';
import { Player } from './player.js';

function createSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 512;
  const c = canvas.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#9ba8aa');
  g.addColorStop(.46, '#c6cbc5');
  g.addColorStop(.76, '#dfd2bc');
  g.addColorStop(1, '#c5b39c');
  c.fillStyle = g; c.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addGalleryLighting(scene) {
  // Soft, non-shadow-casting gallery pools. The sun remains the only expensive shadow source.
  const fixtures = [
    [-9.55, 3.1, 7.2, 7.2], [-9.55, 3.1, .2, 7.2], [-9.55, 3.1, -7.0, 7.2],
    [9.55, 3.1, 7.2, 6.4], [9.55, 3.1, .2, 6.4], [9.55, 3.1, -7.0, 6.4],
    [-4.3, 3.05, -9.55, 4.8], [0, 3.05, -9.55, 4.8], [4.3, 3.05, -9.55, 4.8]
  ];
  for (const [x, y, z, intensity] of fixtures) {
    const light = new THREE.PointLight('#ffd4a3', intensity, 6.6, 2);
    light.position.set(x, y, z);
    scene.add(light);
  }
}

export async function createExperience({ items, onSelect, onHover, onFailure }) {
  const surface = document.querySelector('#scene');
  const mobile = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance', alpha: false });
  const dpr = Math.min(devicePixelRatio, mobile ? 1.1 : 1.55);
  renderer.setPixelRatio(dpr);
  renderer.setSize(surface.clientWidth || innerWidth, surface.clientHeight || innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  surface.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.background = createSkyTexture();
  scene.fog = new THREE.Fog('#c8bcaa', 31, 62);

  const camera = new THREE.PerspectiveCamera(58, (surface.clientWidth || innerWidth) / (surface.clientHeight || innerHeight), .08, 75);

  // A subtle PMREM gives the generated wood/brick/stone believable highlights without downloading an HDRI.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environment = pmrem.fromScene(roomEnvironment, .04).texture;
  scene.environment = environment;
  roomEnvironment.dispose();
  pmrem.dispose();

  const sun = new THREE.DirectionalLight('#fff0d8', 2.75);
  sun.position.set(-7, 15, 8.5);
  sun.target.position.set(.5, 0, -3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? 1024 : 2048);
  sun.shadow.camera.left = -17; sun.shadow.camera.right = 17;
  sun.shadow.camera.top = 17; sun.shadow.camera.bottom = -17;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 48;
  sun.shadow.normalBias = .025; sun.shadow.bias = -.00012;
  sun.shadow.radius = mobile ? 1 : 3;
  scene.add(sun, sun.target);

  scene.add(new THREE.HemisphereLight('#dce7e5', '#76523b', 1.48));
  const courtyardFill = new THREE.DirectionalLight('#f2c795', .45);
  courtyardFill.position.set(5, 6, -8);
  scene.add(courtyardFill);
  addGalleryLighting(scene);

  const mats = createMaterials(renderer);
  for (const material of Object.values(mats)) {
    if ('envMapIntensity' in material) material.envMapIntensity = material === mats.brass ? .7 : .28;
  }
  const architecture = buildArchitecture(scene, mats);

  let disposed = false, active = true, walking = false, failed = false, nearest = null;
  let frameId, last = performance.now(), lastRender = 0, sample = 0, sampleFrames = 0, slowWindows = 0;
  const abort = new AbortController();
  const raycaster = new THREE.Raycaster(), uv = new THREE.Vector2(), forward = new THREE.Vector3();
  const point = new THREE.Vector3(), delta = new THREE.Vector3();
  let targets = [];

  function pick(clientX, clientY) {
    const r = surface.getBoundingClientRect();
    uv.set((clientX - r.left) / r.width * 2 - 1, -(clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(uv, camera);
    const hits = raycaster.intersectObjects([...targets, ...architecture.occluders], false);
    const first = hits[0];
    if (first?.object.userData.item && first.distance < 6.5) onSelect(first.object.userData.item);
    else if (first && first.face.normal.y > .9 && first.point.y < .1 && first.distance < 18) player.walkTo(first.point);
  }

  const player = new Player(camera, surface, architecture.obstacles, pick, () => { if (nearest) onSelect(nearest); });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect(); abort.abort(); player.dispose();
    const textures = new Set(), materials = new Set(), geometries = new Set();
    scene.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m);
        for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    environment.dispose(); sun.shadow.map?.dispose(); renderer.dispose(); renderer.domElement.remove();
  }

  const fail = () => { if (failed || disposed) return; failed = true; dispose(); onFailure(); };
  const observer = new ResizeObserver(() => {
    if (disposed) return;
    const w = surface.clientWidth, h = surface.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); lastRender = 0;
  });
  observer.observe(surface);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(); }, { signal: abort.signal });

  try {
    targets = await createArtworks(scene, items.filter(item => item.exhibited !== false), mats);
    addSign(scene, 'Selected Work', '01 / Development', [-7.42, 2.2, 4.8], Math.PI / 2, 2.05);
    addSign(scene, 'Creative Vision', '02 / Visual collection', [7.42, 2.2, 4.8], -Math.PI / 2, 2.05);
    addSign(scene, 'Bhagya\'s Gallery', 'Saubhagya Jung Thapa', [0, 2, 11.19], Math.PI, 2.2);
    await renderer.compileAsync(scene, camera);
    renderer.shadowMap.needsUpdate = true;
  } catch (error) {
    dispose(); throw error;
  }

  function updateHover() {
    camera.getWorldDirection(forward);
    let best = null, bestScore = Infinity;
    for (const mesh of targets) {
      mesh.getWorldPosition(point);
      delta.copy(point).sub(camera.position);
      const dist = delta.length();
      if (dist > 5.4 || dist < .1) continue;
      const alignment = delta.normalize().dot(forward);
      if (alignment < .9) continue;
      raycaster.set(camera.position, delta);
      const hits = raycaster.intersectObjects([...targets, ...architecture.occluders], false);
      if (hits[0]?.object !== mesh) continue;
      const score = dist * (2 - alignment);
      if (score < bestScore) { best = mesh.userData.item; bestScore = score; }
    }
    if (nearest?.id !== best?.id) { nearest = best; onHover(best); }
  }

  let lastPose = '';
  function loop(now) {
    if (disposed) return;
    frameId = requestAnimationFrame(loop);
    const elapsed = (now - last) / 1000, dt = Math.min(elapsed, .05); last = now;
    if (!active || document.hidden) return;

    const moved = player.update(dt);
    const pose = camera.position.toArray().join(',') + camera.quaternion.toArray().join(',');
    const changed = pose !== lastPose; lastPose = pose;
    if (changed || moved || !lastRender) { renderer.render(scene, camera); lastRender = now; }

    sample += elapsed; sampleFrames++;
    if (sample >= 1) {
      const fps = Math.round(sampleFrames / sample);
      surface.dataset.fps = String(fps);
      surface.dataset.drawCalls = String(renderer.info.render.calls);
      surface.dataset.triangles = String(renderer.info.render.triangles);
      surface.dataset.position = camera.position.toArray().map(v => v.toFixed(2)).join(',');
      surface.dataset.quality = renderer.getPixelRatio().toFixed(2);
      if (walking && moved && fps < 28) slowWindows++; else slowWindows = Math.max(0, slowWindows - 1);
      if (slowWindows === 3 && renderer.getPixelRatio() > .8) {
        renderer.setPixelRatio(Math.max(.8, renderer.getPixelRatio() - .2)); lastRender = 0;
      }
      if (slowWindows > 14 && fps < 15) { fail(); return; }
      sample = 0; sampleFrames = 0;
    }

    if (walking && (changed || moved)) {
      updateHover();
      const { x, z } = camera.position;
      const room = Math.abs(x) > 7 ? 'work' : z < -7 ? 'creative' : z > 8 ? 'threshold' : 'courtyard';
      document.querySelector('#room-name').textContent = Math.abs(x) > 7
        ? (x < 0 ? 'Selected Work' : 'Creative Vision')
        : ({ creative: 'Creative Vision', threshold: '', courtyard: '' }[room]);
    }
  }

  frameId = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { last = performance.now(); lastRender = 0; }, { signal: abort.signal });

  return {
    player, camera,
    start() { walking = true; active = true; lastRender = 0; player.setEnabled(true); surface.focus({ preventScroll: true }); },
    pause() { active = false; player.setEnabled(false); onHover(null); },
    resume() { active = true; lastRender = 0; player.setEnabled(walking); },
    setControls(value) { player.setEnabled(value); },
    focus(item, reduced) { active = true; return player.focus(item, reduced); },
    restore(pose, reduced) { active = true; return player.restore(pose, reduced); },
    dispose
  };
}
