import * as THREE from 'three';
import { moveWithCollision, canOccupy, EYE_HEIGHT } from './collision.js';
export class Player {
  constructor(camera, surface, obstacles, onSelect, onInspect) {
    this.camera=camera;this.surface=surface;this.obstacles=obstacles;this.enabled=false;this.keys=new Set();this.velocity=new THREE.Vector2();this.stick=new THREE.Vector2();this.yaw=0;this.pitch=0;this.transition=null;this.destination=null;
    this.abort=new AbortController();const options={signal:this.abort.signal};
    camera.position.set(0,EYE_HEIGHT,10.5);camera.rotation.order='YXZ';
    this.updateRotation();
    const supported=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE'];
    window.addEventListener('keydown',e=>{
      if(!this.enabled || e.target.closest('dialog,button,a,input,select,textarea'))return;
      if(supported.includes(e.code)){e.preventDefault();this.destination=null;this.keys.add(e.code);}
      if(e.code==='Enter'){e.preventDefault();onInspect();}
    },options);
    window.addEventListener('keyup',e=>this.keys.delete(e.code),options);
    window.addEventListener('blur',()=>this.resetInput(),options);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.resetInput();},options);
    let pointer=null;
    surface.addEventListener('pointerdown',e=>{
      if(!this.enabled || e.button!==0)return;
      surface.focus({preventScroll:true});pointer={id:e.pointerId,x:e.clientX,y:e.clientY,total:0};surface.setPointerCapture(e.pointerId);
    },options);
    surface.addEventListener('pointermove',e=>{
      if(!this.enabled)return;
      if(document.pointerLockElement===surface) {this.look(e.movementX,e.movementY);return;}
      if(pointer?.id!==e.pointerId)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.total+=Math.abs(dx)+Math.abs(dy);pointer.x=e.clientX;pointer.y=e.clientY;this.look(dx,dy);
    },options);
    surface.addEventListener('pointerup',e=>{
      if(pointer?.id!==e.pointerId)return;
      if(pointer.total<7 && this.enabled)onSelect(e.clientX,e.clientY);
      pointer=null;
    },options);
    surface.addEventListener('pointercancel',()=>{pointer=null;},options);
    const joystick=document.querySelector('#joystick'),knob=joystick.querySelector('.joystick-knob');let touch=null;
    const stickMove=e=>{const r=joystick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/32,dy=(e.clientY-r.top-r.height/2)/32;
      this.destination=null;this.stick.set(dx,dy);if(this.stick.length()>1)this.stick.normalize();knob.style.transform=`translate(${this.stick.x*25}px,${this.stick.y*25}px)`;};
    joystick.addEventListener('pointerdown',e=>{if(!this.enabled || touch!==null)return;e.preventDefault();touch=e.pointerId;joystick.setPointerCapture(e.pointerId);stickMove(e);},options);
    joystick.addEventListener('pointermove',e=>{if(touch===e.pointerId)stickMove(e);},options);
    const release=e=>{if(e && e.pointerId!==touch)return;touch=null;this.stick.set(0,0);knob.style.transform='';};
    joystick.addEventListener('pointerup',release,options);joystick.addEventListener('pointercancel',release,options);joystick.addEventListener('lostpointercapture',release,options);this.releaseStick=()=>release();
  }
  look(dx,dy){this.yaw-=dx*.003;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0025,-.65,.65);this.updateRotation();}
  updateRotation(){this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');}
  walkTo(point){if(this.enabled)this.destination=point.clone();}
  resetInput(){this.destination=null;this.keys.clear();this.velocity.set(0,0);this.stick.set(0,0);this.releaseStick?.();}
  setEnabled(value){this.enabled=value;this.resetInput();if(!value && document.pointerLockElement)document.exitPointerLock();}
  pose(){return {position:this.camera.position.clone(),quaternion:this.camera.quaternion.clone(),yaw:this.yaw,pitch:this.pitch};}
  goTo(position,quaternion,reducedMotion=false){
    this.resetInput();
    return new Promise(resolve=>{this.transition?.resolve();this.transition={from:this.camera.position.clone(),rotation:this.camera.quaternion.clone(),position,quaternion,elapsed:0,duration:reducedMotion?0:.85,resolve};});
  }
  focus(item,reducedMotion){
    const normal=new THREE.Vector3(Math.sin(item.rotation),0,Math.cos(item.rotation));
    const target=new THREE.Vector3(...item.position);
    const distance=Math.max(2.2,item.physicalWidth*.92);
    let position=target.clone().addScaledVector(normal,distance);position.y=EYE_HEIGHT;
    // Only approach along a traversable line; otherwise keep the viewer's position and turn.
    for(let i=1;i<=30;i++){
      const p=this.camera.position.clone().lerp(position,i/30);
      if(!canOccupy(p.x,p.z,this.obstacles)){position=this.camera.position.clone();break;}
    }
    const dummy=this.camera.clone();dummy.position.copy(position);dummy.lookAt(target);
    return this.goTo(position,dummy.quaternion.clone(),reducedMotion);
  }
  async restore(pose,reducedMotion){await this.goTo(pose.position,pose.quaternion,reducedMotion);this.yaw=pose.yaw;this.pitch=pose.pitch;this.updateRotation();}
  update(dt){
    if(this.transition){const t=this.transition;t.elapsed+=dt;const progress=t.duration?Math.min(1,t.elapsed/t.duration):1;const eased=progress*progress*(3-2*progress);
      this.camera.position.lerpVectors(t.from,t.position,eased);this.camera.quaternion.slerpQuaternions(t.rotation,t.quaternion,eased);
      if(progress===1){this.transition=null;t.resolve();}return true;}
    if(!this.enabled)return false;
    let sx=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
    let sz=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)+this.stick.y;
    if(this.destination){
      const dx=this.destination.x-this.camera.position.x,dz=this.destination.z-this.camera.position.z,dist=Math.hypot(dx,dz);
      if(dist<.12)this.destination=null;
      else {sx=(Math.cos(this.yaw)*dx-Math.sin(this.yaw)*dz)/dist;sz=(Math.sin(this.yaw)*dx+Math.cos(this.yaw)*dz)/dist;}
    }
    const len=Math.hypot(sx,sz);if(len>1){sx/=len;sz/=len;}
    const speed=1.6,blend=1-Math.exp(-dt*8);
    this.velocity.x=THREE.MathUtils.lerp(this.velocity.x,sx*speed,blend);this.velocity.y=THREE.MathUtils.lerp(this.velocity.y,sz*speed,blend);
    const turn=(this.keys.has('KeyQ')?1:0)-(this.keys.has('KeyE')?1:0);this.yaw+=turn*dt*1.3;this.updateRotation();
    if(this.velocity.length()<.002 && !turn)return false;
    const dx=(Math.cos(this.yaw)*this.velocity.x+Math.sin(this.yaw)*this.velocity.y)*dt;
    const dz=(-Math.sin(this.yaw)*this.velocity.x+Math.cos(this.yaw)*this.velocity.y)*dt;
    const previous=this.camera.position.clone();
    moveWithCollision(this.camera.position,dx,dz,this.obstacles);
    if(this.destination && this.camera.position.distanceToSquared(previous)<.000001)this.destination=null;
    return true;
  }
  dispose(){this.abort.abort();this.resetInput();this.transition?.resolve();this.transition=null;}
}
