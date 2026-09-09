import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import * as THREE from 'three';
import { canOccupy,moveWithCollision } from '../gallery/src/collision.js';
import { buildArchitecture } from '../gallery/src/architecture.js';
import { extractContent } from '../scripts/content.mjs';
const material=new THREE.MeshBasicMaterial();
const materials=Object.fromEntries(['brick','wood','stone','plaster','roof','dark','brass','paper','leaf','light'].map(k=>[k,material]));
const scene=new THREE.Scene();
const {obstacles}=buildArchitecture(scene,materials);
test('doorway and both exhibition wings are connected at human radius',()=>{
  const start={x:0,y:1.65,z:10.5};
  moveWithCollision(start,0,-9,obstacles);assert.ok(start.z<2,'threshold must be clear');
  moveWithCollision(start,-9,0,obstacles);assert.ok(start.x<-8.9,'west wing entrance');
  moveWithCollision(start,18,0,obstacles);assert.ok(start.x>8.9,'east wing entrance');
});
test('long steps cannot tunnel through masonry and allow wall sliding',()=>{
  const position={x:0,y:1.65,z:9.5};moveWithCollision(position,5,-8,obstacles);
  assert.ok(canOccupy(position.x,position.z,obstacles));
  const wall={x:9,y:1.65,z:4};moveWithCollision(wall,100,0,obstacles);assert.ok(wall.x<=11.22);
  moveWithCollision(wall,10,-3,obstacles);assert.ok(wall.z<2);
  const pier={x:6.8,y:1.65,z:4.8};moveWithCollision(pier,4,0,obstacles);assert.ok(pier.x<7.5);
});
test('every exhibition viewing point is reachable through the floor plan',async()=>{
  // Flood-fill the actual authored collision map, at a 20 cm sampling interval.
  const step=.2,seen=new Set(),queue=[[0,50]],key=(x,z)=>`${x},${z}`;
  while(queue.length){const [gx,gz]=queue.shift(),k=key(gx,gz);if(seen.has(k))continue;
    if(!canOccupy(gx*step,gz*step,obstacles))continue;seen.add(k);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!seen.has(key(gx+dx,gz+dz)))queue.push([gx+dx,gz+dz]);
  }
  for(const item of await extractContent()){
    const distance=Math.max(2.2,item.physicalWidth*.92);
    const x=item.position[0]+Math.sin(item.rotation)*distance,z=item.position[2]+Math.cos(item.rotation)*distance;
    assert.ok(seen.has(key(Math.round(x/step),Math.round(z/step))),`${item.title} unreachable`);
  }
});
test('content reflects real work and keeps missing metadata honest',async()=>{
  const items=await extractContent();assert.equal(items.length,14);assert.equal(items.filter(i=>i.video).length,4);
  assert.equal(new Set(items.map(i=>i.id)).size,14);assert.equal(items.find(i=>i.id==='sacar').category,'Concept Design / Brand Identity');
  for(const item of items){assert.equal(item.year,null);assert.equal(item.projectUrl,undefined);await stat(item.source);}
});
test('production has a static accessible catalogue and no gallery engine on home',async()=>{
  const {document}=parseHTML(await readFile('dist/gallery/index.html','utf8'));
  assert.equal(document.querySelectorAll('.collection-grid article').length,14);
  assert.ok(document.querySelector('meta[property="og:title"]'));assert.ok(document.querySelector('noscript'));
  const home=await readFile('dist/index.html','utf8');assert.ok(!home.includes('experience.js'));assert.ok(!home.includes('three'));
  assert.ok(home.includes('href="gallery/"'));await stat('dist/gallery/build/experience.js');
});
test('all optimized media exist and maintain their source aspect ratio',async()=>{
  const items=JSON.parse(await readFile('dist/gallery/content.json','utf8'));
  for(const item of items){await stat(`dist/gallery/${item.image}`);if(item.video)await stat(`dist/gallery/${item.video}`);
    assert.ok(Math.abs(item.physicalWidth/item.physicalHeight-item.width/item.height)<.001);assert.ok(item.physicalHeight<=2.25);}
});
