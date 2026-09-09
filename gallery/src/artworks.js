import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function makeLabelTexture(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 190;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#2a241d';
  c.font = '500 27px "Space Grotesk", Arial, sans-serif';
  c.fillText(item.title, 8, 62, 720);
  c.fillStyle = '#71695f';
  c.font = '400 17px "Space Grotesk", Arial, sans-serif';
  const meta = [item.category, item.year].filter(Boolean).join('  ·  ').toUpperCase();
  c.fillText(meta, 8, 104, 720);
  c.fillStyle = '#9a8c7b';
  c.fillRect(8, 137, 92, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function createArtworks(scene, items, mats) {
  const loader = new THREE.TextureLoader();
  const targets = [];
  const frameBatches = { wood: [], dark: [] };

  const framePiece = (key, x, y, z, w, h, d, group) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    g.applyMatrix4(group.matrix);
    frameBatches[key].push(g);
  };

  await Promise.all(items.map(async item => {
    const group = new THREE.Group();
    group.position.set(...item.position);
    group.rotation.y = item.rotation;
    group.updateMatrix();

    const isFilm = item.displayType === 'film';
    const w = item.physicalWidth, h = item.physicalHeight;
    const matWidth = isFilm ? .045 : .115;
    const frameWidth = isFilm ? .045 : .055;
    const depth = isFilm ? .11 : .085;
    const outerW = w + matWidth * 2;
    const outerH = h + matWidth * 2;
    const frameKey = isFilm ? 'dark' : 'wood';

    framePiece(frameKey, -outerW / 2 - frameWidth / 2, 0, 0, frameWidth, outerH + frameWidth * 2, depth, group);
    framePiece(frameKey, outerW / 2 + frameWidth / 2, 0, 0, frameWidth, outerH + frameWidth * 2, depth, group);
    framePiece(frameKey, 0, outerH / 2 + frameWidth / 2, 0, outerW, frameWidth, depth, group);
    framePiece(frameKey, 0, -outerH / 2 - frameWidth / 2, 0, outerW, frameWidth, depth, group);

    const backingMaterial = isFilm ? mats.dark : mats.paper;
    const backing = new THREE.Mesh(new THREE.PlaneGeometry(outerW, outerH), backingMaterial);
    backing.position.z = -.052;
    backing.receiveShadow = true;
    group.add(backing);

    let texture;
    try {
      texture = await loader.loadAsync(item.image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    } catch {
      throw new Error(`Could not load ${item.title}`);
    }

    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    art.position.z = .018;
    art.userData.item = item;
    group.add(art);
    targets.push(art);

    // Tiny physical museum label: readable up close, almost invisible from across the room.
    const labelTexture = makeLabelTexture(item);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(.72, .178),
      new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, toneMapped: false, depthWrite: false })
    );
    label.position.set(-outerW / 2 + .36, -outerH / 2 - .25, .026);
    group.add(label);

    // Small spacer blocks create a real shadow gap between frame and wall.
    if (!isFilm) {
      const spacerMaterial = mats.dark;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const spacer = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .07), spacerMaterial);
        spacer.position.set(sx * (outerW / 2 - .12), sy * (outerH / 2 - .12), -.075);
        spacer.castShadow = true;
        group.add(spacer);
      }
    }

    scene.add(group);
  }));

  for (const [key, geometries] of Object.entries(frameBatches)) {
    if (!geometries.length) continue;
    const frames = new THREE.Mesh(mergeGeometries(geometries), mats[key]);
    frames.castShadow = true;
    frames.receiveShadow = true;
    scene.add(frames);
    geometries.forEach(g => g.dispose());
  }
  return targets;
}

export function addSign(scene, text, subtitle, position, rotation = 0, width = 2.1) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 460;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.textAlign = 'left';
  c.fillStyle = '#2c261f';
  c.font = '500 25px "Space Grotesk", Arial, sans-serif';
  c.fillText(subtitle.toUpperCase(), 34, 125);
  c.fillStyle = '#2a241d';
  c.font = 'italic 72px "Playfair Display", Georgia, serif';
  c.fillText(text, 34, 245);
  c.fillStyle = '#a08365';
  c.fillRect(34, 294, 132, 3);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * .383),
    new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false })
  );
  mesh.position.set(...position);
  mesh.rotation.y = rotation;
  scene.add(mesh);
}
