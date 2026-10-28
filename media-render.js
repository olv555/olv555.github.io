function renderMedia(index){
  imageScroll.classList.toggle('dodeez-media',index===1);
  imageScroll.querySelectorAll('video').forEach(video=>video.pause());
  imageScroll.replaceChildren();
  for(const [rowIndex,row] of projectMedia[index].rows.entries()){
    const line=document.createElement('div');
    line.className='media-row';
    line.dataset.row=row.number;
    line.style.setProperty('--columns',row.columns||row.items.length);
    for(const [column,item] of row.items.entries()){
      const cell=document.createElement('div');cell.className='media-cell';
      const label=projects[index].name+' — row '+row.number+', item '+(column+1);
      if(item.type==='compare'){
        const compare=document.createElement('div');compare.className='photo-compare';
        compare.style.aspectRatio=item.images[0].width+'/'+item.images[0].height;
        item.images.forEach((asset,i)=>{const img=document.createElement('img');img.src=asset.src;img.alt=label+(i===0?' � before':' � after');img.loading='lazy';img.className=i===0?'compare-before':'compare-after';compare.append(img);});
        const handle=document.createElement('span');handle.className='compare-handle';handle.setAttribute('aria-hidden','true');compare.append(handle);
        const range=document.createElement('input');range.type='range';range.min=0;range.max=100;range.value=20;range.setAttribute('aria-label',label+' � before and after comparison');
        range.addEventListener('input',()=>compare.style.setProperty('--split',range.value+'%'));compare.append(range);cell.append(compare);
      }else if(item.type==='image'){
        const img=document.createElement('img');img.src=item.src;img.alt=item.title||label;
        if(index===1)img.draggable=false;
        if(item.displayWidth){img.style.width=item.displayWidth+'px';img.style.maxWidth='100%';}
        if(item.width)img.width=item.width;if(item.height)img.height=item.height;img.loading=rowIndex===0?'eager':'lazy';img.decoding='async';cell.append(img);
      }else if(item.type==='video'){
        const video=document.createElement('video');video.src=item.src;video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label',label);
        if(item.fallbackSrc)video.addEventListener('error',()=>{video.src=item.fallbackSrc;video.load();},{once:true});
        cell.append(video);
      }else{
        const frame=document.createElement('iframe');frame.src=item.src;frame.title=item.title||label;

        frame.className='media-embed '+item.type+(item.portrait?' portrait':'');
        if(item.type==='vimeo'){cell.classList.add('vimeo-cell');frame.allowFullscreen=true;frame.allow='autoplay; fullscreen; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';}
        if(item.type==='instagram'){
          const shell=document.createElement('div');shell.className='instagram-shell';shell.append(frame);cell.append(shell);
          const scale=Math.min(1,(479-12*(row.items.length-1))/row.items.length/326);
          const frameWidth=scale<1?326:479;
          const headerHeight=54;
          const mediaRatio=item.src.includes('DMp00T8K7bT')?.94:(item.src.includes('/reel/')?5/4:4/3);
          const mediaHeight=frameWidth*mediaRatio;
          frame.setAttribute('scrolling','no');
          frame.style.width=frameWidth+'px';frame.style.height=(headerHeight+mediaHeight+250)+'px';
          frame.style.transform='scale('+scale+')';frame.style.top='0px';
          shell.style.height=((headerHeight+mediaHeight)*scale)+'px';
        }else cell.append(frame);

      }
      line.append(cell);
    }
    imageScroll.append(line);
  }
}

// Warm only the first two media rows of neighbouring projects, one file at a time.
const neighbourImages=new Map();
let neighbourQueue=[];
let neighbourTimer;
let neighbourLoading=false;
function preloadNeighbourMedia(index,neighbours=[index+1,index-1]){
  clearTimeout(neighbourTimer);
  neighbourQueue=[];
  neighbourTimer=setTimeout(()=>{
    const urls=[];
    for(const neighbour of neighbours){
      if(!projectMedia[neighbour])continue;
      for(const row of projectMedia[neighbour].rows.slice(0,2)){
        for(const item of row.items){
          if(item.type==='image')urls.push(item.src);
          if(item.type==='compare')urls.push(...item.images.map(image=>image.src));
        }
      }
    }
    neighbourQueue=[...new Set(urls)].filter(url=>!neighbourImages.has(url));
    loadNextNeighbourImage();
  },300);
}
function loadNextNeighbourImage(){
  if(neighbourLoading||!neighbourQueue.length)return;
  const src=neighbourQueue.shift();
  if(neighbourImages.has(src)){loadNextNeighbourImage();return;}
  neighbourLoading=true;
  const image=new Image();
  image.fetchPriority='low';
  image.decoding='async';
  neighbourImages.set(src,image);
  const complete=failed=>{
    image.onload=image.onerror=null;
    if(failed)neighbourImages.delete(src);
    while(neighbourImages.size>12)neighbourImages.delete(neighbourImages.keys().next().value);
    neighbourLoading=false;
    loadNextNeighbourImage();
  };
  image.onload=()=>complete(false);
  image.onerror=()=>complete(true);
  image.src=src;
}
function stopNeighbourPreload(){
  clearTimeout(neighbourTimer);
  neighbourQueue=[];
}
