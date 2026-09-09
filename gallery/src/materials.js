import * as THREE from 'three';

const SIZE = 1024;

function seededRandom(seed = 712) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvasTexture(canvas, renderer, { repeat = [1, 1], color = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 4);
  return texture;
}

function makeBrick(renderer) {
  const random = seededRandom(90210);
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  const rough = document.createElement('canvas');
  for (const canvas of [color, bump, rough]) canvas.width = canvas.height = SIZE;
  const c = color.getContext('2d');
  const b = bump.getContext('2d');
  const r = rough.getContext('2d');

  c.fillStyle = '#b99178'; c.fillRect(0, 0, SIZE, SIZE);
  b.fillStyle = '#4b4b4b'; b.fillRect(0, 0, SIZE, SIZE);
  r.fillStyle = '#ececec'; r.fillRect(0, 0, SIZE, SIZE);

  const brickW = 206, brickH = 69, mortar = 5;
  for (let row = 0; row < 15; row++) {
    for (let col = -1; col < 6; col++) {
      const x = col * brickW + (row % 2) * brickW / 2;
      const y = row * brickH;
      const hue = 10 + random() * 8;
      const sat = 48 + random() * 12;
      const light = 31 + random() * 10;
      c.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
      c.fillRect(x + mortar, y + mortar, brickW - mortar * 2, brickH - mortar * 2);

      const shade = 120 + Math.floor(random() * 48);
      b.fillStyle = `rgb(${shade},${shade},${shade})`;
      b.fillRect(x + mortar, y + mortar, brickW - mortar * 2, brickH - mortar * 2);

      const rv = 220 + Math.floor(random() * 28);
      r.fillStyle = `rgb(${rv},${rv},${rv})`;
      r.fillRect(x + mortar, y + mortar, brickW - mortar * 2, brickH - mortar * 2);

      c.fillStyle = `rgba(255,203,156,${0.05 + random() * .09})`;
      c.fillRect(x + mortar + 2, y + mortar + 2, brickW - mortar * 2 - 4, 2);
      c.fillStyle = `rgba(30,13,8,${0.04 + random() * .07})`;
      c.fillRect(x + mortar + 2, y + brickH - mortar - 4, brickW - mortar * 2 - 4, 2);
    }
  }

  // Fired clay has mottling and occasional dark inclusions. Keep it restrained.
  for (let i = 0; i < 5200; i++) {
    const x = random() * SIZE, y = random() * SIZE, radius = random() * 2.2 + .2;
    c.fillStyle = random() > .55 ? `rgba(36,12,8,${random() * .10})` : `rgba(255,213,170,${random() * .065})`;
    c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
    b.fillStyle = `rgba(255,255,255,${random() * .05})`; b.fillRect(x, y, 1, 1);
  }

  return {
    map: canvasTexture(color, renderer),
    bumpMap: canvasTexture(bump, renderer, { color: false }),
    roughnessMap: canvasTexture(rough, renderer, { color: false })
  };
}

function makeWood(renderer) {
  const random = seededRandom(4217);
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  for (const canvas of [color, bump]) canvas.width = canvas.height = SIZE;
  const c = color.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#2d1b13'; c.fillRect(0, 0, SIZE, SIZE);
  b.fillStyle = '#777'; b.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 1250; i++) {
    const x = random() * SIZE;
    const bend = (random() - .5) * 34;
    const alpha = .035 + random() * .16;
    c.strokeStyle = random() > .54 ? `rgba(168,110,70,${alpha})` : `rgba(9,5,3,${alpha})`;
    c.lineWidth = .35 + random() * 2.2;
    c.beginPath(); c.moveTo(x, -20);
    c.bezierCurveTo(x + bend, 280, x - bend * .7, 720, x + bend * .25, 1044); c.stroke();

    b.strokeStyle = `rgba(255,255,255,${.02 + random() * .08})`;
    b.lineWidth = .4 + random();
    b.beginPath(); b.moveTo(x, -20); b.bezierCurveTo(x + bend, 280, x - bend * .7, 720, x + bend * .25, 1044); b.stroke();
  }

  for (let i = 0; i < 18; i++) {
    const x = 80 + random() * 864, y = 80 + random() * 864;
    const rx = 6 + random() * 15, ry = 12 + random() * 34;
    c.strokeStyle = `rgba(12,7,4,${.28 + random() * .28})`; c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, y, rx, ry, random() * .35, 0, Math.PI * 2); c.stroke();
  }

  return { map: canvasTexture(color, renderer), bumpMap: canvasTexture(bump, renderer, { color: false }) };
}

function makeStone(renderer) {
  const random = seededRandom(8204);
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  for (const canvas of [color, bump]) canvas.width = canvas.height = SIZE;
  const c = color.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#aaa18e'; c.fillRect(0, 0, SIZE, SIZE);
  b.fillStyle = '#777'; b.fillRect(0, 0, SIZE, SIZE);

  const tile = 256;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const light = 55 + random() * 9;
    const hue = 34 + random() * 10;
    c.fillStyle = `hsl(${hue} ${7 + random() * 8}% ${light}%)`;
    c.fillRect(col * tile + 4, row * tile + 4, tile - 8, tile - 8);
    b.fillStyle = `rgb(${130 + random() * 25},${130 + random() * 25},${130 + random() * 25})`;
    b.fillRect(col * tile + 4, row * tile + 4, tile - 8, tile - 8);
  }
  for (let i = 0; i < 8500; i++) {
    const x = random() * SIZE, y = random() * SIZE;
    const v = random() > .5 ? 255 : 20;
    c.fillStyle = `rgba(${v},${v},${v},${random() * .028})`; c.fillRect(x, y, random() * 2 + .4, random() * 2 + .4);
  }
  return { map: canvasTexture(color, renderer), bumpMap: canvasTexture(bump, renderer, { color: false }) };
}

function makePlaster(renderer) {
  const random = seededRandom(1271);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d'); c.fillStyle = '#d9ccb5'; c.fillRect(0, 0, 512, 512);
  const image = c.getImageData(0, 0, 512, 512);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (random() - .5) * 13;
    image.data[i] += n; image.data[i + 1] += n * .9; image.data[i + 2] += n * .7;
  }
  c.putImageData(image, 0, 0);
  for (let i = 0; i < 65; i++) {
    c.strokeStyle = `rgba(95,73,51,${.018 + random() * .022})`; c.lineWidth = .4 + random() * 1.2;
    c.beginPath(); c.moveTo(random() * 512, random() * 512); c.lineTo(random() * 512, random() * 512); c.stroke();
  }
  return canvasTexture(canvas, renderer);
}

export function createMaterials(renderer) {
  const brickTex = makeBrick(renderer);
  const woodTex = makeWood(renderer);
  const stoneTex = makeStone(renderer);
  const plaster = makePlaster(renderer);

  return {
    brick: new THREE.MeshStandardMaterial({ ...brickTex, bumpScale: .045, roughness: .88, metalness: 0 }),
    wood: new THREE.MeshStandardMaterial({ ...woodTex, bumpScale: .022, roughness: .68, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ ...stoneTex, bumpScale: .018, roughness: .86, metalness: 0 }),
    plaster: new THREE.MeshStandardMaterial({ map: plaster, bumpMap: plaster, bumpScale: .006, roughness: .93, color: '#e2d6c0' }),
    roof: new THREE.MeshStandardMaterial({ color: '#5d3427', roughness: .9, metalness: 0 }),
    dark: new THREE.MeshStandardMaterial({ color: '#17130f', roughness: .78, metalness: .04 }),
    brass: new THREE.MeshStandardMaterial({ color: '#a88a54', metalness: .72, roughness: .38 }),
    paper: new THREE.MeshStandardMaterial({ color: '#eee6d7', roughness: .96, metalness: 0 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#46523b', roughness: .9, side: THREE.DoubleSide }),
    light: new THREE.MeshBasicMaterial({ color: '#ffd6a0', toneMapped: false })
  };
}
