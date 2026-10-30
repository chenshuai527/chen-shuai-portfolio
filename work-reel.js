// One work entrance at a time, on the same flat collage backdrop as the home.
const reel=document.querySelector('[data-work-reel]');
if(reel){
  const viewport=reel.querySelector('.work-reel-viewport');
  const title=document.getElementById('unified-work-title'),surfaces=[viewport,...(title?[title]:[])];
  const items=[...reel.querySelectorAll('.work-entry')];
  const coverChoices=reel.querySelector('.work-cover-choices'),flipTimers=new Map();
  reel.dataset.skillCover='fruit';
  const dots=[...reel.closest('.unified-work').querySelectorAll('[data-reel-index]')];
  const previous=reel.querySelector('[data-reel-prev]'),next=reel.querySelector('[data-reel-next]');
  const names=[['微信小程序项目','WeChat mini programs'],['AI 海报作品','AI posters'],['我的 Skill','My Skill'],['X 的插件制作','Extensions for X']];
  const en=()=>document.documentElement.lang==='en';
  const motion=()=>document.querySelector('#journey-stage')?.dataset.motion!=='off';
  let index=0,lastRenderedIndex=0,scrollFrame=0,drag=null,suppressClick=false,wheelSum=0,wheelTime=0,changedAt=0;
  function render(){
    if(index!==lastRenderedIndex){const item=items[index];clearTimeout(flipTimers.get(item));item.dataset.side='front';item.dataset.flipState='ready';item.removeAttribute('aria-busy');}
    lastRenderedIndex=index;
    items.forEach((item,i)=>{
      const back=item.dataset.side==='back',name=names[i][en()?1:0];
      item.setAttribute('aria-label',en()?`${name}, ${back?'open details':'turn over the cover'}`:`${name}，${back?'点击背面进入详情':'点击封面翻到背面'}`);
      item.querySelector('.work-entry-note').textContent=en()?(back?'Click the back to open details':'Click the cover to turn it over'):(back?'点击背面，进入详情':'点击封面，翻到背面');
    });
    coverChoices.hidden=index!==2;
    coverChoices.setAttribute('aria-label',en()?'Skill cover':'Skill 封面');
    reel.dataset.index=String(index);
    reel.dataset.motion=motion()?'on':'off';
    items.forEach((item,i)=>{item.inert=i!==index;item.setAttribute('aria-hidden',String(i!==index));item.toggleAttribute('data-current',i===index);});
    dots.forEach((dot,i)=>{dot.setAttribute('aria-pressed',String(i===index));dot.setAttribute('aria-label',(en()?'View ':'查看')+names[i][en()?1:0]);});
    reel.querySelector('[data-reel-count]').textContent=String(index+1).padStart(2,'0')+' / 04';
    reel.querySelector('[data-reel-name]').textContent=names[index][en()?1:0];
    previous.disabled=index===0;next.disabled=index===items.length-1;
    previous.setAttribute('aria-label',en()?'Previous work entrance':'上一个作品入口');next.setAttribute('aria-label',en()?'Next work entrance':'下一个作品入口');
    reel.setAttribute('aria-label',en()?'Four work entrances':'四个作品入口');
    viewport.setAttribute('aria-label',en()?'Swipe or use arrow keys to switch work':'左右滑动或按方向键切换作品入口');
  }
  items.forEach(item=>item.addEventListener('click',()=>{
    if(suppressClick||item.dataset.flipState==='flipping')return;
    if(item.dataset.side==='front'){
      item.dataset.side='back';item.dataset.flipState='flipping';item.setAttribute('aria-busy','true');render();
      clearTimeout(flipTimers.get(item));flipTimers.set(item,setTimeout(()=>{item.dataset.flipState='ready';item.removeAttribute('aria-busy');},motion()?840:0));
      return;
    }
    if(!item.dataset.workPage)return;
    const openEvent=new CustomEvent('portfolio-open-page',{detail:{href:item.dataset.workPage},cancelable:true});
    if(document.dispatchEvent(openEvent))location.assign(item.dataset.workPage);
  }));
  coverChoices.querySelectorAll('[data-skill-cover]').forEach(button=>button.addEventListener('click',()=>{
    reel.dataset.skillCover=button.dataset.skillCover;
    coverChoices.querySelectorAll('button').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
    const item=items[2];clearTimeout(flipTimers.get(item));item.dataset.side='front';item.dataset.flipState='ready';item.removeAttribute('aria-busy');
    item.querySelector('.miniapp-flip-front img').src=`assets/work-covers/${button.dataset.skillCover}-skill-cover.webp`;
    document.dispatchEvent(new CustomEvent('portfolio-skill-cover-change'));render();
  }));
  function select(value,smooth=true){index=Math.max(0,Math.min(items.length-1,value));reel.dataset.settled='false';render();viewport.scrollTo({left:index*viewport.clientWidth,behavior:smooth&&motion()?'smooth':'instant'});}
  previous.addEventListener('click',()=>select(index-1));next.addEventListener('click',()=>select(index+1));
  dots.forEach(dot=>dot.addEventListener('click',()=>select(Number(dot.dataset.reelIndex))));
  viewport.addEventListener('scroll',()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{const visible=Math.max(0,Math.min(items.length-1,Math.round(viewport.scrollLeft/viewport.clientWidth)));if(visible!==index){index=visible;render();}});},{passive:true});
  viewport.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();viewport.focus({preventScroll:true});select(index+(event.key==='ArrowRight'?1:-1));}});
  const wheel=event=>{
    if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    const now=performance.now(),delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1);
    const direction=Math.sign(delta),canMove=direction>0?index<items.length-1:index>0;
    if(!canMove&&now-changedAt>650)return;
    event.preventDefault();
    if(now-changedAt<650)return;
    if(now-wheelTime>180||Math.sign(wheelSum)!==direction)wheelSum=0;
    wheelTime=now;wheelSum+=delta;
    if(Math.abs(wheelSum)>=45){changedAt=now;wheelSum=0;select(index+direction);}
  };
  const pointerDown=event=>{
    if((event.pointerType==='touch'&&event.currentTarget===viewport)||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,startIndex:index,left:viewport.scrollLeft,active:false,owner:event.currentTarget};
  };
  const pointerMove=event=>{
    if(!drag||event.pointerId!==drag.id)return;
    drag.lastX=event.clientX;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.active&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){
      drag.active=true;viewport.classList.add('is-dragging');drag.owner.classList.add('is-dragging');drag.owner.setPointerCapture(event.pointerId);
    }
    if(drag.active){event.preventDefault();viewport.scrollLeft=drag.left-dx;}
  };
  function endDrag(event){
    if(!drag||event.pointerId!==drag.id)return;
    const active=drag.active,dx=drag.lastX-drag.x,owner=drag.owner;
    const target=Math.abs(dx)>45?drag.startIndex+(dx<0?1:-1):Math.round(viewport.scrollLeft/viewport.clientWidth);
    drag=null;
    if(!active)return;
    viewport.classList.remove('is-dragging');
    owner.classList.remove('is-dragging');if(owner.hasPointerCapture(event.pointerId))owner.releasePointerCapture(event.pointerId);
    suppressClick=true;setTimeout(()=>suppressClick=false,120);
    select(target);
  }
  surfaces.forEach(surface=>{surface.addEventListener('wheel',wheel,{passive:false});surface.addEventListener('pointerdown',pointerDown);surface.addEventListener('pointermove',pointerMove);surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);surface.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}},true);});
  viewport.querySelectorAll('img').forEach(image=>image.draggable=false);
  new ResizeObserver(()=>select(index,false)).observe(viewport);
  document.addEventListener('portfolio-language-change',render);
  const journey=document.querySelector('#journey-stage');
  if(journey)new MutationObserver(render).observe(journey,{attributes:true,attributeFilter:['data-motion']});
  render();
}
