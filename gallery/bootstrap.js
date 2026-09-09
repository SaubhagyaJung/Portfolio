const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const artDialog=$('#art-dialog'),helpDialog=$('#help-dialog');
let experience=null,items=[],walking=false,selected=null,savedPose=null,busy=false,opener=null,failed=false;
const showCatalogue=(message)=>{
  experience?.pause();$('#experience').hidden=true;$('#catalogue').hidden=false;document.body.classList.remove('walking','scene-mode');
  $('#return-walk').hidden=!experience || failed;$('#return-walk').textContent=walking?'Return to the courtyard ↗':'Enter the courtyard ↗';
  if(message)$('#fallback-message').textContent=message;$('#catalogue').focus({preventScroll:true});window.scrollTo(0,0);
};
const fallback=()=>{failed=true;experience?.dispose();experience=null;artDialog.close();helpDialog.close();showCatalogue('The courtyard is unavailable on this device. The complete collection is here to explore.');};
function resetMedia(){const v=$('#art-media video');if(v){v.pause();v.removeAttribute('src');v.load();}$('#art-media').replaceChildren();}
function fillMedia(item,film=false){
  resetMedia();
  const element=document.createElement(film?'video':'img');
  if(film){element.controls=true;element.playsInline=true;element.preload='metadata';element.poster=item.image;element.src=item.video;element.setAttribute('aria-label',`${item.title} project walkthrough`);
    element.addEventListener('error',()=>{const message=document.createElement('p');message.textContent='This film could not play. You can open the original video below.';const link=document.createElement('a');link.href='../'+item.source;link.textContent='Open original video ↗';message.append(link);$('#art-media').replaceChildren(message);},{once:true});
  }else{element.src=item.image;element.alt=`${item.title} — ${item.category}`;}
  $('#art-media').append(element);if(film)element.play().catch(()=>{});
}
async function inspect(item,film=false){
  if(busy || artDialog.open)return;busy=true;opener=document.activeElement;selected=item;
  const inScene=walking&&!$('#experience').hidden&&experience;
  if(inScene){experience.setControls(false);savedPose=experience.player.pose();await experience.focus(item,reduced.matches);}
  if(inScene && failed){busy=false;return;}
  $('#art-title').textContent=item.title;$('#art-category').textContent=[item.category,item.year].filter(Boolean).join(' · ');
  $('#art-description').textContent=item.description;$('#asset-note').textContent=item.room==='creative'?'From the Creative Vision collection.':'';
  fillMedia(item,film);$('#art-actions').replaceChildren();
  if(item.video){const play=document.createElement('button');play.textContent='Play film →';play.addEventListener('click',()=>fillMedia(item,true));$('#art-actions').append(play);}
  else{const link=document.createElement('a');link.href='../'+item.source;link.target='_blank';link.rel='noopener';link.textContent='View original artwork ↗';$('#art-actions').append(link);}
  if(item.projectUrl){const link=document.createElement('a');link.href=item.projectUrl;link.target='_blank';link.rel='noopener';link.textContent='View project ↗';$('#art-actions').append(link);}
  artDialog.showModal();experience?.pause();busy=false;
}
artDialog.addEventListener('close',async()=>{
  resetMedia();selected=null;
  if(savedPose && experience){busy=true;await experience.restore(savedPose,reduced.matches);savedPose=null;busy=false;if(walking&&!$('#experience').hidden){experience.resume();$('#scene').focus({preventScroll:true});}}
  else opener?.focus({preventScroll:true});
});
$('#close-art').addEventListener('click',()=>artDialog.close());
artDialog.addEventListener('click',e=>{if(e.target===artDialog){const r=artDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)artDialog.close();}});
$('#enter').addEventListener('click',()=>{
  if(!experience)return;walking=true;document.body.classList.add('walking');$('#entry').classList.add('leaving');$('#walk-ui').hidden=false;
  setTimeout(()=>{$('#entry').hidden=true;},reduced.matches?0:850);experience.start();
  if(matchMedia('(pointer:coarse)').matches)$('#instructions').textContent='Thumb control — Move · Drag — Look · Tap art — Explore';
  $('#scene-status').textContent='You are at the timber threshold. Walk forward into the courtyard.';
});
$('#browse').addEventListener('click',()=>showCatalogue());
$('#header-index').addEventListener('click',()=>showCatalogue());
$('#entry-browse').addEventListener('click',()=>showCatalogue());
$('#return-walk').addEventListener('click',()=>{
  $('#catalogue').hidden=true;$('#experience').hidden=false;document.body.classList.add('scene-mode');
  if(walking){document.body.classList.add('walking');experience?.resume();$('#scene').focus({preventScroll:true});}else experience?.resume();
});
$('#help').addEventListener('click',()=>{experience?.pause();helpDialog.showModal();});
$('#close-help').addEventListener('click',()=>helpDialog.close());
helpDialog.addEventListener('close',()=>{if(walking&&!$('#experience').hidden){experience?.resume();$('#scene').focus({preventScroll:true});}});
$('#help-catalogue').addEventListener('click',()=>{showCatalogue();helpDialog.close();});
$('#look-mode').addEventListener('click',async()=>{try{await $('#scene').requestPointerLock();$('#scene').focus();}catch{$('#scene-status').textContent='Free look is unavailable. Drag to look, or use Q and E.';}});
document.addEventListener('pointerlockchange',()=>{$('#look-mode').textContent=document.pointerLockElement?'Esc to release':'Free look';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)$('#art-media video')?.pause();});
document.querySelectorAll('.exit-link').forEach(a=>a.addEventListener('click',e=>{
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();experience?.dispose();resetMedia();
  document.body.classList.add('fading');setTimeout(()=>location.href=a.href,reduced.matches?0:280);
}));
// The static collection remains usable even if this module, the manifest, or WebGL fails.
try {
  const response=await fetch('content.json');if(!response.ok)throw new Error('Collection unavailable');items=await response.json();
  document.querySelectorAll('[data-inspect],[data-film]').forEach(link=>link.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const item=items.find(i=>i.id===(link.dataset.inspect||link.dataset.film));if(!item)return;e.preventDefault();inspect(item,!!link.dataset.film);
  }));
  $('.skip-link').addEventListener('click',e=>{e.preventDefault();showCatalogue();});
  if(new URLSearchParams(location.search).get('view')==='collection')showCatalogue();
  else {
    $('#experience').hidden=false;$('#catalogue').hidden=true;document.body.classList.add('scene-mode');
    const timeout=setTimeout(()=>{if(!experience)fallback();},25000);
    try {
      const {createExperience}=await import('./build/experience.js');
      const loaded=await createExperience({items,onSelect:inspect,onFailure:fallback,onHover:item=>{const hint=$('#art-hint');hint.hidden=!item;if(item){hint.textContent=`View ${item.title} ↗`;hint.onclick=()=>inspect(item);}}});
      clearTimeout(timeout);if(failed)loaded.dispose();else {experience=loaded;document.body.classList.add('scene-ready');$('#enter').disabled=false;$('#enter').textContent='Enter the courtyard ↗';$('#load-status').textContent='';if($('#experience').hidden){experience.pause();$('#return-walk').hidden=false;}}
    } catch {clearTimeout(timeout);fallback();}
  }
} catch {showCatalogue('Explore the complete collection below.');}
window.addEventListener('pagehide',()=>{experience?.dispose();resetMedia();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
