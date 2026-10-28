// Move the wrapper so the portrait's independent CSS rocking stays intact.
gsap.registerPlugin(ScrollTrigger);
const portrait=document.querySelector('.portrait-anchor');
const about=document.querySelector('#about-me');
const skills=document.querySelector('.skills-grid');
const scrollMedia=gsap.matchMedia();
scrollMedia.add('(prefers-reduced-motion: no-preference)',()=>{
  // Stop when About me reaches 55% of the viewport; always leave 60px before skills.
  const followDistance=()=>Math.max(0,Math.min(
    about.offsetTop-window.innerHeight*.55,
    skills.offsetTop-60-portrait.offsetTop-portrait.offsetHeight
  ));
  gsap.to(portrait,{
    y:followDistance,
    ease:'none',
    scrollTrigger:{
      id:'home-planet-follow',
      trigger:'.home-canvas',
      start:'top top',
      end:()=>'+='+Math.max(1,followDistance()),
      scrub:.6,
      invalidateOnRefresh:true
    }
  });
});
document.fonts.ready.then(()=>ScrollTrigger.refresh());
