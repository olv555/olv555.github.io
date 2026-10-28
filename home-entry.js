// A reload starts Home at the hero, even after using the About me anchor.
(() => {
  const reloading=performance.getEntriesByType('navigation')[0]?.type==='reload';
  if(!reloading)return;
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  const reset=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
  reset();
  window.addEventListener('pageshow',()=>{
    reset();
    requestAnimationFrame(()=>{
      reset();
      history.scrollRestoration='auto';
    });
  },{once:true});
})();
