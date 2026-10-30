import {posters} from './poster-data.js';

const camera=document.getElementById('ai-posters');
if(camera?.querySelector('[data-poster-shutter]')){
  const shutter=camera.querySelector('[data-poster-shutter]'),print=camera.querySelector('.camera-printed-photo'),image=print.querySelector('img'),caption=print.querySelector('.camera-print-caption'),status=camera.querySelector('.camera-print-status');
  let next=0,current=-1,printed=0,animation,develop,feedback,printRequest=0;
  const english=()=>document.documentElement.lang==='en';
  function translate(){
    shutter.setAttribute('aria-label',english()?'Press any letter key to print a poster':'按任意字母键，打印一张海报');
    camera.querySelector('.typewriter-keys').setAttribute('aria-label',english()?'Typewriter letter keys':'打字机字母键');
    camera.setAttribute('aria-label',english()?'AI posters':'AI 海报作品');
    if(current<0){status.textContent=english()?'Press any letter to print a poster':'按任意字母键，打印一张海报';return;}
    const title=posters[current].title[english()?1:0];caption.textContent=title;
    status.textContent=`${String(current+1).padStart(2,'0')} / ${String(posters.length).padStart(2,'0')} · ${title}`;
  }
  function ejectPoster(){
    const request=++printRequest;
    animation?.cancel();develop?.cancel();feedback?.cancel();current=next;next=(next+1)%posters.length;printed++;
    image.src=posters[current].src;camera.dataset.photoReady='true';camera.dataset.printPhase='printing';camera.dataset.posterIndex=String(current);camera.dataset.printCount=String(printed);translate();
    const reduced=document.getElementById('journey-stage').dataset.motion==='off';
    animation=image.animate(reduced?[{clipPath:'inset(0 0 0 0)'}]:[
      {clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}
    ],{duration:reduced?1:1250,easing:'linear',fill:'forwards'});
    animation.finished.then(()=>{if(request===printRequest)camera.dataset.printPhase='displaying';}).catch(()=>{});
    if(!reduced){
      develop=image.animate([{filter:'brightness(.55) saturate(.5)'},{filter:'brightness(.8) saturate(.75)',offset:.45},{filter:'brightness(1) saturate(1)'}],{duration:1500,easing:'ease-out'});
      feedback=shutter.querySelector('.camera-visual').animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(.97)',filter:'brightness(1.18)',offset:.22},{transform:'scale(1)',filter:'brightness(1)'}],{duration:340,easing:'ease-out'});
    }
  }
  document.addEventListener('portfolio-poster-eject',ejectPoster);
  shutter.addEventListener('keydown',event=>{
    if(!/^[a-z]$/i.test(event.key)||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
    event.preventDefault();
    shutter.querySelector(`[data-typewriter-key="${event.key.toUpperCase()}"]`)?.click();
  });
  document.addEventListener('portfolio-language-change',translate);translate();
}
