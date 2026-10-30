import {posters} from './poster-data.js';

const openers=[...document.querySelectorAll('[data-poster-book-open]')],opener=openers[0];
if(opener){
  const dialog=document.createElement('dialog');
  dialog.className='poster-book-dialog';dialog.id='poster-book-dialog';
  dialog.setAttribute('aria-labelledby','poster-book-title');
  dialog.innerHTML=`<header class="book-header"><span class="book-eyebrow">SELECTED WORK / 2026</span><h2 id="poster-book-title"></h2><p class="book-description"></p><button class="book-close" type="button" data-book-close></button></header><div class="book-viewer"><div class="book-spread"><div class="book-side-stack stack-left" aria-hidden="true"></div><div class="book-side-stack stack-right" aria-hidden="true"></div><button class="book-leaf leaf-left" type="button" data-book-zoom="0"><img alt=""><span class="leaf-caption"></span></button><button class="book-leaf leaf-right" type="button" data-book-zoom="1"><img alt=""><span class="leaf-caption"></span></button><span class="book-spine" aria-hidden="true"></span></div></div><footer class="book-footer"><div class="book-navigation"><button type="button" data-book-direction="-1">←</button><div class="book-progress" aria-live="polite"><strong></strong><span></span></div><button type="button" data-book-direction="1">→</button></div><div class="book-thumbnails"></div><p class="book-hint"></p></footer><div class="poster-zoom" hidden><button class="zoom-close" type="button"></button><img alt=""><p></p></div>`;
  document.body.append(dialog);
  const left=dialog.querySelector('.leaf-left'),right=dialog.querySelector('.leaf-right'),book=dialog.querySelector('.book-spread'),viewer=dialog.querySelector('.book-viewer'),zoom=dialog.querySelector('.poster-zoom');
  const language=()=>document.documentElement.lang==='en'?1:0;
  const text=(zh,en)=>language()?en:zh;
  const count=posters.length,spreads=Math.ceil(count/2),pad=n=>String(n).padStart(2,'0');
  const playback=document.createElement('button');playback.type='button';playback.className='book-playback';playback.dataset.bookPlayback='';dialog.querySelector('.book-footer').append(playback);
  const autoplayDelay=3000;
  let autoplay=true,autoplayTimer=null,activeOpener=opener;
  let spread=0,turning=false,turnToken=0,activeAnimation=null,zoomIndex=0,pointerStart=null,suppressClick=false;
  function stopAutoplayTimer(){clearTimeout(autoplayTimer);autoplayTimer=null;}
  function renderPlayback(){
    const paused=autoplay&&(!zoom.hidden||document.hidden||Boolean(pointerStart));
    dialog.dataset.playback=!dialog.open?'stopped':autoplay?(paused?'waiting':'playing'):'paused';
    playback.textContent=autoplay?text('Ⅱ 暂停播放','Ⅱ Pause'):text('▶ 继续播放','▶ Play');
    playback.setAttribute('aria-label',autoplay?text('暂停自动翻页','Pause automatic page turns'):text('继续自动翻页','Resume automatic page turns'));
    playback.setAttribute('aria-pressed',String(autoplay));
  }
  function scheduleAutoplay(){
    stopAutoplayTimer();renderPlayback();
    if(!dialog.open||!autoplay||!zoom.hidden||document.hidden||pointerStart||turning)return;
    autoplayTimer=setTimeout(()=>{autoplayTimer=null;turn(1);},autoplayDelay);
  }
  function category(item){return item.category==='paper'?text('手作纸艺拼贴','Paper collage'):text('毛绒 3D','Plush 3D');}
  function setImage(image,index){const item=posters[index%count];image.src=item.src;image.alt=item.title[language()];image.width=item.width;image.height=item.height;image.draggable=false;}
  function renderLeaf(leaf,index){setImage(leaf.querySelector('img'),index);leaf.dataset.bookZoom=String(index);leaf.querySelector('.leaf-caption').textContent=pad(index+1)+' / '+posters[index].title[language()];leaf.setAttribute('aria-label',text('放大查看：','Enlarge: ')+posters[index].title[language()]);}
  function renderStacks(){
    for(const [side,sign] of [['left',-1],['right',1]]){
      const stack=dialog.querySelector('.stack-'+side);stack.replaceChildren();
      for(let depth=3;depth>0;depth--){const page=document.createElement('span');page.className='stack-page';page.style.setProperty('--depth',depth);const image=document.createElement('img');const index=(spread*2+(sign<0?-depth:1+depth)+count*2)%count;setImage(image,index);image.alt='';page.append(image);stack.append(page);}
    }
  }
  function render(){
    dialog.dataset.spread=String(spread);dialog.dataset.flipping='false';
    renderLeaf(left,spread*2);renderLeaf(right,(spread*2+1)%count);renderStacks();
    dialog.querySelector('.book-eyebrow').textContent='SELECTED WORK / 2026';
    dialog.querySelector('#poster-book-title').textContent=text('AI 海报作品','AI posters');
    dialog.querySelector('.book-description').textContent=text('8 件作品 · 手作纸艺拼贴 / 毛绒 3D','8 works · Paper collage / Plush 3D');
    dialog.querySelector('[data-book-close]').textContent=text('退出作品册 ×','Close book ×');
    dialog.querySelector('.book-progress strong').textContent=pad(spread*2+1)+' — '+pad(Math.min(count,spread*2+2))+' / '+pad(count);
    dialog.querySelector('.book-progress span').textContent=autoplay?text('作品册正在自动播放','The book is playing automatically'):text('自动播放已暂停','Automatic playback paused');
    dialog.querySelector('.book-hint').textContent=text('自动循环翻页 · 点击海报放大','Automatic looping page turns · Click a poster to enlarge');
    renderPlayback();
    dialog.querySelector('[data-book-direction="-1"]').setAttribute('aria-label',text('向前翻页','Previous spread'));
    dialog.querySelector('[data-book-direction="1"]').setAttribute('aria-label',text('向后翻页','Next spread'));
    dialog.querySelector('.book-thumbnails').setAttribute('aria-label',text('选择海报','Choose a poster'));
    dialog.querySelectorAll('[data-book-index]').forEach(button=>{const index=Number(button.dataset.bookIndex);button.setAttribute('aria-pressed',String(Math.floor(index/2)===spread));button.setAttribute('aria-label',text('翻到：','Turn to: ')+posters[index].title[language()]);});
    opener.setAttribute('aria-label',text('查看 AI 海报作品，共 8 件','View AI posters, eight works'));
  }
  function face(index,className){const side=document.createElement('span');side.className='turn-face '+className;const image=document.createElement('img');setImage(image,index);side.append(image);return side;}
  async function turn(direction,target){
    if(turning)return;
    stopAutoplayTimer();
    const next=target??(spread+direction+spreads)%spreads;if(next===spread){scheduleAutoplay();return;}
    const motionSetting=document.querySelector('#journey-stage')?.dataset.motion;
    const reduced=motionSetting?motionSetting!=='on':matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(reduced){spread=next;render();scheduleAutoplay();return;}
    const request=++turnToken;turning=true;dialog.dataset.flipping='true';
    const sheet=document.createElement('div');sheet.className='turning-sheet '+(direction>0?'turn-forward':'turn-backward');sheet.setAttribute('aria-hidden','true');
    const oldIndex=spread*2+(direction>0?1:0),newIndex=next*2+(direction>0?0:1);
    sheet.append(face(oldIndex,'turn-front'),face(newIndex,'turn-back'));
    if(direction>0)renderLeaf(right,next*2+1);else renderLeaf(left,next*2);
    book.append(sheet);
    activeAnimation=sheet.animate([{transform:`rotateY(${direction>0?-7:7}deg)`},{transform:`rotateY(${direction>0?-173:173}deg)`}],{duration:720,easing:'cubic-bezier(.38,.08,.24,1)',fill:'forwards'});
    await activeAnimation.finished.catch(()=>{});if(request!==turnToken)return;
    sheet.remove();activeAnimation=null;turning=false;spread=next;render();scheduleAutoplay();
  }
  function setBookInert(value){for(const element of dialog.querySelectorAll('.book-header,.book-viewer,.book-footer'))element.inert=value;}
  function showZoom(index){stopAutoplayTimer();zoomIndex=(index+count)%count;setImage(zoom.querySelector('img'),zoomIndex);zoom.querySelector('p').textContent=posters[zoomIndex].title[language()]+' · '+category(posters[zoomIndex]);zoom.querySelector('button').textContent=text('返回作品册 ×','Back to the book ×');zoom.hidden=false;setBookInert(true);zoom.querySelector('button').focus();dialog.dataset.zoom='open';renderPlayback();}
  function hideZoom(){zoom.hidden=true;setBookInert(false);dialog.dataset.zoom='closed';dialog.querySelector(`[data-book-zoom="${spread*2}"]`)?.focus();scheduleAutoplay();}
  for(const [index,item] of posters.entries()){
    const button=document.createElement('button');button.type='button';button.dataset.bookIndex=String(index);const image=document.createElement('img');setImage(image,index);image.alt='';button.append(image);button.addEventListener('click',()=>turn(Math.floor(index/2)>spread?1:-1,Math.floor(index/2)));dialog.querySelector('.book-thumbnails').append(button);
  }
  openers.forEach(button=>button.addEventListener('click',()=>{if(button.hasAttribute('data-work-flip')&&(button.dataset.side!=='back'||button.dataset.flipState==='flipping'))return;activeOpener=button;spread=0;autoplay=true;render();dialog.showModal();scheduleAutoplay();}));
  playback.addEventListener('click',()=>{autoplay=!autoplay;render();scheduleAutoplay();});
  dialog.querySelector('[data-book-close]').addEventListener('click',()=>dialog.close());
  dialog.querySelectorAll('[data-book-direction]').forEach(button=>button.addEventListener('click',()=>turn(Number(button.dataset.bookDirection))));
  for(const leaf of [left,right])leaf.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(!turning)showZoom(Number(leaf.dataset.bookZoom));});
  zoom.querySelector('button').addEventListener('click',hideZoom);
  dialog.addEventListener('cancel',event=>{if(!zoom.hidden){event.preventDefault();hideZoom();}});
  dialog.addEventListener('close',()=>{stopAutoplayTimer();turnToken++;activeAnimation?.cancel();activeAnimation=null;turning=false;book.querySelector('.turning-sheet')?.remove();zoom.hidden=true;setBookInert(false);pointerStart=null;renderPlayback();activeOpener?.focus({preventScroll:true});});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const direction=event.key==='ArrowRight'?1:-1;if(!zoom.hidden)showZoom(zoomIndex+direction);else turn(direction);}});
  viewer.addEventListener('pointerdown',event=>{if(event.button===0&&!turning){pointerStart={x:event.clientX,y:event.clientY};stopAutoplayTimer();renderPlayback();}});
  window.addEventListener('pointerup',event=>{if(!pointerStart)return;const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){suppressClick=true;turn(dx<0?1:-1);setTimeout(()=>suppressClick=false,60);}else scheduleAutoplay();});
  window.addEventListener('pointercancel',()=>{pointerStart=null;scheduleAutoplay();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  document.addEventListener('visibilitychange',scheduleAutoplay);
  document.addEventListener('portfolio-language-change',()=>{stopAutoplayTimer();turnToken++;activeAnimation?.cancel();activeAnimation=null;turning=false;book.querySelector('.turning-sheet')?.remove();render();if(!zoom.hidden)showZoom(zoomIndex);else scheduleAutoplay();});
  render();
}
