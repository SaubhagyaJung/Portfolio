import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player } from '../gallery/src/player.js';
function setup() {
  const target=()=>Object.assign(new EventTarget(),{closest:()=>null,focus(){},setPointerCapture(){}});
  const surface=target(),joystick=target(),knob={style:{}};
  joystick.querySelector=()=>knob;joystick.getBoundingClientRect=()=>({left:0,top:0,width:98,height:98});
  globalThis.window=target();globalThis.document=target();document.querySelector=()=>joystick;
  const camera=new THREE.PerspectiveCamera();const player=new Player(camera,surface,[],()=>{},()=>{});player.setEnabled(true);
  const event=(target,type,props={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
  return {player,camera,surface,joystick,event};
}
test('held keyboard input moves at walking speed and blur prevents stuck movement',()=>{
  const {player,camera,event}=setup();event(window,'keydown',{code:'KeyW'});
  for(let i=0;i<120;i++)player.update(1/60);
  const distance=10.5-camera.position.z;assert.ok(distance>3 && distance<3.5);
  event(window,'blur');const stopped=camera.position.clone();player.update(.1);assert.equal(camera.position.distanceTo(stopped),0);player.dispose();
});
test('touch movement and touch look operate independently and release cleanly',()=>{
  const {player,camera,event,surface,joystick}=setup();
  event(joystick,'pointerdown',{pointerId:1,clientX:49,clientY:18});
  event(surface,'pointerdown',{pointerId:2,button:0,clientX:200,clientY:100});
  event(surface,'pointermove',{pointerId:2,clientX:250,clientY:100});
  for(let i=0;i<60;i++)player.update(1/60);
  // The authored acceleration, partial stick input and turn cover about 1.35 m in one second.
  assert.ok(camera.position.z<9.2 && camera.position.z>9.0);assert.ok(Math.abs(player.yaw)>.1);
  event(joystick,'pointercancel',{pointerId:1});assert.equal(player.stick.length(),0);
  player.setEnabled(false);const stopped=camera.position.clone();player.update(.1);assert.equal(camera.position.distanceTo(stopped),0);player.dispose();
});
test('focus and Escape restoration preserve the exact prior position and orientation',async()=>{
  const {player,camera}=setup();const before=player.pose();player.setEnabled(false);
  const focused=player.focus({position:[0,1.85,2],rotation:0,physicalWidth:2},false);
  for(let i=0;i<60;i++)player.update(1/60);await focused;
  assert.ok(camera.position.z<6);
  const back=player.restore(before,false);for(let i=0;i<60;i++)player.update(1/60);await back;
  assert.ok(camera.position.distanceTo(before.position)<1e-6);assert.ok(camera.quaternion.angleTo(before.quaternion)<1e-6);player.dispose();
});
