const sidebar=document.querySelector('.site-sidebar');
const menu=sidebar.querySelector('.site-menu');
menu.addEventListener('click',()=>{
 const expanded=sidebar.classList.toggle('expanded');
 menu.setAttribute('aria-expanded',String(expanded));
 menu.setAttribute('aria-label',expanded?'Collapse navigation':'Expand navigation');
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('expanded')){sidebar.classList.remove('expanded');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Expand navigation');menu.focus();}});
const colors=['#1dbfe1','#fec97a','#ff8888','#1fbb9f'];
document.querySelectorAll('.skill').forEach((skill,i)=>{skill.tabIndex=0;skill.style.setProperty('--skill-glow',colors[i%colors.length]);});

// Only the visible silhouette receives hover, not the exported image rectangle.
// Flood from the image edges to exclude its black/transparent background while
// retaining enclosed black lettering as part of the shape.
const contactArtwork=document.querySelector('.contact-artwork');
if(contactArtwork){
  const shapes=[...contactArtwork.querySelectorAll('.contact-shape')];
  const masks=new Map();
  for(const shape of shapes){
    const img=shape.querySelector('img');
    const prepare=()=>{
      const canvas=document.createElement('canvas');
      const width=canvas.width=img.naturalWidth,height=canvas.height=img.naturalHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(img,0,0);
      const pixels=context.getImageData(0,0,width,height).data;
      const outside=new Uint8Array(width*height),queue=[];
      const visit=index=>{
        if(outside[index])return;
        const p=index*4;
        if(pixels[p+3]>32&&Math.max(pixels[p],pixels[p+1],pixels[p+2])>32)return;
        outside[index]=1;queue.push(index);
      };
      for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
      for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
      for(let i=0;i<queue.length;i++){
        const index=queue[i],x=index%width,y=Math.floor(index/width);
        if(x>0)visit(index-1);if(x<width-1)visit(index+1);
        if(y>0)visit(index-width);if(y<height-1)visit(index+width);
      }
      masks.set(shape,{width,height,outside});
    };
    if(img.complete&&img.naturalWidth)prepare();else img.addEventListener('load',prepare,{once:true});
  }
  const clear=()=>{shapes.forEach(shape=>shape.classList.remove('is-hovered'));contactArtwork.style.cursor='';};
  const hitAt=event=>{
    let hit=null;
    for(const shape of [...shapes].reverse()){
      const mask=masks.get(shape);if(!mask)continue;
      const rect=shape.getBoundingClientRect();
      const x=Math.floor((event.clientX-rect.left)/rect.width*mask.width);
      const y=Math.floor((event.clientY-rect.top)/rect.height*mask.height);
      if(x>=0&&y>=0&&x<mask.width&&y<mask.height&&!mask.outside[y*mask.width+x]){hit=shape;break;}
    }
    return hit;
  };
  contactArtwork.addEventListener('pointermove',event=>{
    const hit=hitAt(event);
    shapes.forEach(shape=>shape.classList.toggle('is-hovered',shape===hit));
    contactArtwork.style.cursor=hit?'pointer':'';
  });
  contactArtwork.addEventListener('click',event=>{
    // Keyboard/native anchor clicks already follow their href.
    if(event.target.closest('.contact-shape'))return;
    hitAt(event)?.click();
  });
  contactArtwork.addEventListener('pointerleave',clear);
}

// Spotlight the skills in display order; pointer entry restarts from that icon.
const skillItems=[...document.querySelectorAll('.skill')];
if(skillItems.length){
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentSkill=0,skillTimer=null,skillsVisible=false;
  const showSkill=index=>{
    currentSkill=index;
    skillItems.forEach((skill,i)=>skill.classList.toggle('is-spotlit',i===index));
  };
  const restartSkills=()=>{
    clearInterval(skillTimer);
    skillTimer=null;
    if(skillsVisible&&!document.hidden&&!reducedMotion.matches){
      skillTimer=setInterval(()=>showSkill((currentSkill+1)%skillItems.length),1800);
    }
  };
  skillItems.forEach((skill,index)=>{
    const select=()=>{showSkill(index);restartSkills();};
    skill.addEventListener('pointerenter',select);
    skill.addEventListener('focus',select);
  });
  new IntersectionObserver(entries=>{
    skillsVisible=entries[0].isIntersecting;
    restartSkills();
  },{threshold:.1}).observe(document.querySelector('.skills-grid'));
  document.addEventListener('visibilitychange',restartSkills);
  reducedMotion.addEventListener('change',restartSkills);
  showSkill(0);
}
