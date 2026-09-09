import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildArchitecture(scene, mats) {
  const batches = new Map();
  const obstacles = [];

  function box(key, x, y, z, w, h, d, rotation = [0, 0, 0], solid = false) {
    const g = new THREE.BoxGeometry(w, h, d);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    const scale = key === 'brick' ? 1.3 : key === 'stone' ? 2.5 : key === 'wood' ? 1.15 : 1.4;
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
      uv.setXY(i, (nx > .5 ? p.getZ(i) : p.getX(i)) / scale, (ny > .5 ? p.getZ(i) : p.getY(i)) / scale);
    }
    g.rotateX(rotation[0]); g.rotateY(rotation[1]); g.rotateZ(rotation[2]); g.translate(x, y, z);
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(g);
    if (solid) obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  }

  function beamRun(axis, fixed, start, end, y, spacing = 2.2, key = 'wood') {
    for (let t = start; t <= end + .001; t += spacing) {
      if (axis === 'z') box(key, fixed, y, t, 3.25, .12, .12);
      else box(key, t, y, fixed, .12, .12, 3.25);
    }
  }

  // Ground plane and a slightly raised courtyard field. The tiny height changes catch natural shadow.
  box('stone', 0, -.16, 0, 23.6, .30, 23.6);
  box('stone', 0, .006, 0, 11.35, .03, 11.35);
  for (const s of [-1, 1]) {
    box('dark', s * 5.7, .025, 0, .055, .02, 11.35);
    box('dark', 0, .025, s * 5.7, 11.35, .02, .055);
  }

  // Outer masonry shell. Keep original collision dimensions stable for the movement tests.
  for (const s of [-1, 1]) {
    box('brick', s * 11.55, 3.25, 0, .5, 6.5, 23.6, undefined, true);
    box('plaster', s * 11.27, 1.85, 0, .055, 3.55, 22.9);
    box('brick', 0, 3.25, s * 11.55, 22.6, 6.5, .5, undefined, true);
    box('plaster', 0, 1.85, s * 11.27, 22.5, 3.55, .055);

    // Low timber plinth and gallery wall rails.
    box('wood', s * 11.2, .14, 0, .13, .28, 22.5);
    box('wood', 0, .14, s * 11.2, 22.5, .28, .13);
    box('wood', s * 11.16, 3.45, 0, .13, .18, 22.45);
    box('wood', 0, 3.45, s * 11.16, 22.45, .18, .13);

    // Ground-level brick piers define the entrances into the side galleries.
    for (const z of [-4.8, 4.8]) box('brick', s * 7.7, 1.85, z, .48, 3.7, 3.25, undefined, true);
    box('wood', s * 7.7, 3.35, 0, .62, .4, 6.5);

    // Covered gallery ceiling: this is the key addition that makes the side wings read as rooms.
    box('plaster', s * 9.52, 3.61, 0, 3.12, .12, 22.25);
    beamRun('z', s * 9.52, -10.2, 10.2, 3.49, 2.25);

    // Balcony deck/soffit around the courtyard and the upper brick gallery wall behind it.
    box('wood', s * 6.92, 3.68, 0, 1.55, .18, 22.6);
    box('brick', s * 7.8, 5.12, 0, .46, 2.7, 23);
    box('brick', 0, 5.12, s * 7.8, 15.3, 2.7, .46);
    box('wood', s * 7.48, 3.77, 0, .28, .36, 23);
    box('wood', 0, 3.77, s * 7.48, 15, .36, .28);

    // Continuous upper balcony railing. Broad spacing keeps it elegant rather than ornamental noise.
    box('wood', s * 6.14, 4.28, 0, .105, .12, 22.1);
    box('wood', s * 6.14, 4.82, 0, .105, .11, 22.1);
    for (let z = -10.4; z <= 10.4; z += .82) box('wood', s * 6.14, 4.54, z, .075, .63, .075);

    // Deep eaves and tiled courses.
    box('wood', s * 9.45, 3.76, 0, 4.4, .16, 22.7);
    box('wood', s * 6.25, 3.35, 0, .24, .32, 22.6);
    box('wood', 0, 3.35, s * 6.25, 12.5, .32, .24);
    box('wood', 0, 3.76, s * 9.45, 15.4, .16, 4.4);
    box('roof', s * 9.0, 6.68, 0, 6.3, .18, 24, [0, 0, s * .17]);
    box('roof', 0, 6.68, s * 9.0, 12, .18, 6.3, [-s * .17, 0, 0]);
    for (let i = 0; i < 15; i++) {
      const a = 6 + i * .43;
      box('roof', s * a, 6.3 + (a - 6) * .17, 0, .052, .09, 24);
      box('roof', 0, 6.3 + (a - 6) * .17, s * a, 12, .09, .052);
    }
    box('wood', s * 5.85, 6.2, 0, .16, .24, 24);
    box('wood', 0, 6.2, s * 5.85, 11.5, .24, .16);
    for (let z = -10.7; z <= 10.7; z += .75) box('wood', s * 6.85, 6.04, z, 2.15, .11, .09, [0, 0, s * .17]);
    for (let x = -5.5; x <= 5.5; x += .75) box('wood', x, 6.04, s * 6.85, .09, .11, 2.15, [-s * .17, 0, 0]);

    // Courtyard posts with stepped stone bases, capitals and paired timber brackets.
    for (let z = -9; z <= 9; z += 3) {
      box('stone', s * 6.25, .13, z, .5, .26, .5, undefined, true);
      box('wood', s * 6.25, 1.73, z, .22, 3.18, .22, undefined, true);
      box('wood', s * 6.25, 3.03, z, .38, .16, .36);
      box('wood', s * 6.25, 3.2, z, .62, .14, .36);
      box('wood', s * 6.25, 2.94, z + .32, .12, .86, .12, [.7, 0, 0]);
      box('wood', s * 6.25, 2.94, z - .32, .12, .86, .12, [-.7, 0, 0]);
      box('wood', s * 6.95, 3.44, z, 1.62, .14, .15);
      // Upper roof strut, deliberately simpler than historic sacred struts.
      box('wood', s * 6.38, 5.54, z, .13, 1.1, .13, [0, 0, -s * .42]);
    }
    for (const x of [-3, 3]) {
      box('stone', x, .13, s * 6.25, .5, .26, .5, undefined, true);
      box('wood', x, 1.73, s * 6.25, .22, 3.18, .22, undefined, true);
      box('wood', x, 3.13, s * 6.25, .56, .26, .34);
    }
  }

  // North gallery gets the same low ceiling and beams, tying the creative wing into a real room sequence.
  box('plaster', 0, 3.61, -9.52, 15.2, .12, 3.12);
  beamRun('x', -9.52, -6.6, 6.6, 3.49, 2.2);

  // South entrance vestibule. Nested lintels and jambs give the threshold convincing depth.
  for (const s of [-1, 1]) {
    box('brick', s * 4.65, 1.85, 8.5, 6.7, 3.7, .55, undefined, true);
    box('wood', s * 1.37, 1.5, 8.17, .22, 3, .32, undefined, true);
    box('wood', s * 1.54, 1.5, 8.12, .11, 3.15, .38);
    box('wood', s * 1.7, 1.52, 8.08, .07, 3.22, .42);
  }
  box('wood', 0, 3.02, 8.14, 3.28, .32, .42);
  box('wood', 0, 3.27, 8.12, 3.65, .15, .5);
  box('wood', 0, 3.43, 8.1, 3.9, .08, .54);
  box('brick', 0, 3.55, 8.5, 2.6, .3, .55);

  // Recessed contemporary Newari-inspired lattice windows. They borrow rhythm and depth, not sacred motifs.
  function windowAt(x, z, angle) {
    const place = (key, lx, y, lz, w, h, d, rot = 0) => {
      const wx = x + lx * Math.cos(angle) + lz * Math.sin(angle);
      const wz = z - lx * Math.sin(angle) + lz * Math.cos(angle);
      box(key, wx, y, wz, w, h, d, [0, angle, rot]);
    };
    place('dark', 0, 5.08, 0, 2.42, 1.76, .12);
    place('wood', 0, 5.08, .09, 2.70, 1.98, .12);
    place('dark', 0, 5.08, .155, 2.40, 1.70, .08);
    for (const side of [-1, 1]) {
      place('wood', side * 1.28, 5.08, .13, .16, 2.04, .24);
      place('wood', 0, 5.08 + side * .96, .14, 2.82, .16, .30);
      place('wood', 0, 5.08 + side * 1.10, .08, 3.02, .085, .38);
    }
    for (const lx of [-.44, .44]) place('wood', lx, 5.08, .19, .12, 1.72, .16);
    // Fine verticals plus diagonals create a crafted screen without becoming a literal historic carving.
    for (let i = -8; i <= 8; i++) place('wood', i * .135, 5.08, .205, .026, 1.62, .052);
    for (let i = -5; i <= 5; i++) {
      place('wood', i * .21, 5.08, .215, .035, 1.72, .045, .47);
      place('wood', i * .21, 5.08, .217, .035, 1.72, .045, -.47);
    }
    place('wood', 0, 4.02, .22, 3.02, .11, .5);
    place('wood', 0, 6.12, .22, 3.10, .11, .52);
  }
  for (const s of [-1, 1]) {
    for (const z of [-8.5, -4.25, 0, 4.25, 8.5]) windowAt(s * 7.53, z, -s * Math.PI / 2);
    for (const x of [-4.1, 0, 4.1]) windowAt(x, s * 7.53, s < 0 ? 0 : Math.PI);
  }

  // Gallery lighting rails and restrained warm luminaires. Actual light sources are added in experience.js.
  for (const s of [-1, 1]) {
    box('dark', s * 10.25, 3.38, 0, .075, .07, 20.8);
    for (let z = -9; z <= 9; z += 3) {
      box('dark', s * 10.25, 3.29, z, .18, .18, .22);
      box('light', s * 10.34, 3.18, z, .12, .025, .18);
    }
  }
  box('dark', 0, 3.38, -10.25, 13.7, .07, .075);
  for (let x = -5.6; x <= 5.6; x += 2.8) {
    box('dark', x, 3.29, -10.25, .22, .18, .18);
    box('light', x, 3.18, -10.34, .18, .025, .12);
  }

  // Courtyard furniture: one timber bench and a single planted corner keep the court calm.
  box('wood', 3.9, .46, -4.55, 2.4, .13, .62, undefined, true);
  for (const x of [3.05, 4.75]) box('stone', x, .2, -4.55, .26, .4, .48, undefined, true);
  box('stone', -4.35, .26, -4.3, 1.05, .52, 1.05, undefined, true);
  box('dark', -4.35, .525, -4.3, .89, .018, .89);
  box('wood', -4.35, 1.12, -4.3, .065, 1.2, .065);
  const leaves = [];
  for (let i = 0; i < 56; i++) {
    const a = i * 2.399, y = .72 + (i / 56) * 1.18, radius = .18 + Math.sin(i * 3.7) * .16 + .24;
    const shape = new THREE.Shape();
    shape.moveTo(0, -.19); shape.bezierCurveTo(-.14, -.05, -.09, .12, 0, .19); shape.bezierCurveTo(.09, .12, .14, -.05, 0, -.19);
    const leaf = new THREE.ShapeGeometry(shape, 5);
    leaf.rotateX(-.55); leaf.rotateY(a); leaf.rotateZ(Math.sin(i) * .75);
    leaf.translate(-4.35 + Math.cos(a) * radius, y, -4.3 + Math.sin(a) * radius);
    leaves.push(leaf);
  }
  const plant = new THREE.Mesh(mergeGeometries(leaves), mats.leaf);
  plant.castShadow = true; plant.receiveShadow = true; scene.add(plant); leaves.forEach(g => g.dispose());

  const meshes = [];
  for (const [key, geometries] of batches) {
    const material = mats[key] || mats.dark;
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    mesh.castShadow = key !== 'light' && key !== 'plaster';
    mesh.receiveShadow = true;
    scene.add(mesh); meshes.push(mesh); geometries.forEach(g => g.dispose());
  }
  return { obstacles, occluders: meshes };
}
