(() => {
  const key = 'saubhagya-gallery-return';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[data-gallery-entry]').forEach(link => {
    link.addEventListener('click', event => {
      if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      try { sessionStorage.setItem(key, JSON.stringify({y:scrollY,hash:location.hash})); } catch {}
      if(reduced) return;
      event.preventDefault();
      document.documentElement.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});
      setTimeout(()=>location.href=link.href,290);
    });
  });
  function restore() {
    let state;try {state=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);}catch{}
    if(!state || !document.referrer.includes('/gallery'))return;
    history.replaceState(null,'',location.pathname+location.search+(state.hash||''));
    requestAnimationFrame(()=>window.scrollTo({top:state.y,behavior:'instant'}));
  }
  if(document.readyState==='complete')restore();else window.addEventListener('load',restore,{once:true});
  window.addEventListener('pageshow',e=>{if(e.persisted)document.documentElement.getAnimations().forEach(a=>a.cancel());});
})();
