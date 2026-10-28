const categories=['content','content','content','content','animation','animation','animation','shortfilm'];
function categoryProjects(index){return categories.flatMap((category,i)=>category===categories[index]?[i]:[]);}
function adjacentProject(index,direction){const group=categoryProjects(index);return group[group.indexOf(index)+direction];}
const overlay=document.querySelector('#overlay');
const dialog=document.querySelector('.popover');
const background=document.querySelector('#background');
let opener=null;
const text=document.querySelector('.text-scroll');
const nav=document.querySelector('.panel nav');
const imageScroll=document.querySelector('.image-scroll');
const previous=document.querySelector('#previous-project');
const next=document.querySelector('#next-project');
let projectIndex=0;
let sections=[];
let links=[];
let navigating=false;

function updateScrollSpace(){
  const last=sections.at(-1);
  text.style.paddingBottom=last?Math.max(0,text.clientHeight-last.offsetHeight-24)+'px':'0px';
}
new ResizeObserver(updateScrollSpace).observe(text);
function setProjectUrl(index){
  const url='/portfolio'+String(index+1).padStart(2,'0');
  if(location.pathname!==url)history.pushState(null,'',url);
}
function open(syncUrl=true){
  overlay.hidden=false;
  document.body.classList.add('modal-open');
  background.inert=true;
  updateScrollSpace();
  dialog.focus({preventScroll:true});
  if(syncUrl)setProjectUrl(projectIndex);
}
function close(syncUrl=true){
  stopNeighbourPreload();
  imageScroll.querySelectorAll('video').forEach(video=>video.pause());
  imageScroll.querySelectorAll('iframe').forEach(frame=>frame.remove());
  overlay.hidden=true;
  document.body.classList.remove('modal-open');
  background.inert=false;
  if(opener?.isConnected)opener.focus({preventScroll:true});
  document.title='My works — Portfolio';
  if(syncUrl&&location.pathname!=='/')history.pushState(null,'','/');
}
function select(id){
  for(const link of links){
    if(link.hash==='#'+id)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  }
}
function renderProject(index){
  projectIndex=index;
  const project=projects[index];
  renderMedia(index);
  document.querySelector('#project-title').textContent=project.name;
  document.querySelector('#project-description').textContent=project.description;
  nav.replaceChildren();
  text.replaceChildren();
  sections=project.sections.map((copy,i)=>{
    const section=document.createElement('section');
    section.id='section-'+(i+1);
    section.setAttribute('aria-label',copy.title);
    const p=document.createElement('p');
    p.textContent=copy.body;
    section.append(p);
    text.append(section);
    const link=document.createElement('a');
    link.href='#'+section.id;
    link.textContent=copy.title;
    link.addEventListener('click',event=>{
      event.preventDefault();
      navigating=true;
      text.scrollTo({top:section.offsetTop,behavior:'instant'});
      select(section.id);
      requestAnimationFrame(()=>{navigating=false;});
    });
    nav.append(link);
    return section;
  });
  links=[...nav.querySelectorAll('a')];
  const group=categoryProjects(index);
  previous.disabled=adjacentProject(index,-1)===undefined;
  next.disabled=adjacentProject(index,1)===undefined;
  document.querySelector('#project-status').textContent='Project '+(group.indexOf(index)+1)+' of '+group.length+': '+project.name;
  document.title=project.name+' — Portfolio';
  updateScrollSpace();
  text.scrollTop=0;
  imageScroll.scrollTop=0;
  select(sections[0].id);
  if(document.activeElement===next&&next.disabled&&!previous.disabled)previous.focus({preventScroll:true});
  if(document.activeElement===previous&&previous.disabled&&!next.disabled)next.focus({preventScroll:true});
}
function showProject(index,syncUrl=true){
  if(!Number.isInteger(index)||index<0||index>=projects.length)return;
  if(activeCategory!==categories[index])renderWorks(categories[index]);
  renderProject(index);
  if(overlay.hidden)open(false);
  preloadNeighbourMedia(index,[adjacentProject(index,1),adjacentProject(index,-1)].filter(Number.isInteger));
  if(syncUrl)setProjectUrl(index);
}
function restoreRoute(){
  const match=location.pathname.match(/^\/portfolio(\d{2})\/?$/);
  const index=match?Number(match[1])-1:-1;
  if(index>=0&&index<projects.length)showProject(index,false);
  else close(false);
}

previous.addEventListener('click',()=>showProject(adjacentProject(projectIndex,-1)));
next.addEventListener('click',()=>showProject(adjacentProject(projectIndex,1)));
overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
text.addEventListener('scroll',()=>{
  if(navigating||!sections.length)return;
  let current=sections[0];
  for(const section of sections)if(section.offsetTop<=text.scrollTop+32)current=section;
  select(current.id);
});
document.addEventListener('keydown',event=>{
  if(overlay.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close();}
  if(event.key==='Tab'){
    const focusable=[...dialog.querySelectorAll('button:not(:disabled),a,input,video[controls],iframe,[tabindex="0"]')];
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
window.addEventListener('popstate',restoreRoute);
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/route-worker.js').catch(error=>console.warn('Navigation fallback unavailable:',error));
}

const glowColours=['#ff8888','#fec97a','#1dbfe1','#1fbb9f'];
const grid=document.querySelector('.work-grid');
let activeCategory=new URLSearchParams(location.search).get('category')||'content';
if(!['content','animation','shortfilm'].includes(activeCategory))activeCategory='content';
function renderWorks(category){
  activeCategory=category;
  document.querySelectorAll('[data-category]').forEach(chip=>chip.setAttribute('aria-pressed',String(chip.dataset.category===category)));
  grid.replaceChildren();
  projects.forEach((project,index)=>{
    if(categories[index]!==category)return;
    const card=document.createElement('a');
    card.className='work-card';
    card.href='/portfolio'+String(index+1).padStart(2,'0');
    card.style.setProperty('--glow',glowColours[index%glowColours.length]);
    card.setAttribute('aria-label',project.name);
    const cover=document.createElement('img');
    cover.className='work-cover';
    cover.src=projectMedia[index].cover||projectMedia[index].rows.flatMap(row=>row.items).find(item=>item.type==='image').src;
    cover.alt=project.name;
    cover.decoding='async';
    const copy=document.createElement('div');copy.className='work-copy';
    const heading=document.createElement('h2');heading.textContent=project.name;
    const description=document.createElement('p');description.textContent=project.description;
    copy.append(heading,description);
    const skills=document.createElement('div');skills.className='work-skills';skills.setAttribute('aria-hidden','true');
    card.append(cover,copy,skills);
    card.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();opener=card;showProject(index);
    });
    grid.append(card);
  });
  document.querySelector('#filter-status').textContent=grid.children.length+' projects';
}
document.querySelectorAll('[data-category]').forEach(chip=>chip.addEventListener('click',()=>renderWorks(chip.dataset.category)));

renderWorks(activeCategory);
restoreRoute();

Promise.all([
  document.fonts.load('400 14px Poppins'),
  document.fonts.load('500 12px Poppins'),
  document.fonts.load('700 16px "TT Travels Next"')
]).then(faces=>{
  document.documentElement.dataset.worksFonts=faces.every(group=>group.length>0)?'loaded':'missing';
}).catch(()=>{document.documentElement.dataset.worksFonts='error';});


