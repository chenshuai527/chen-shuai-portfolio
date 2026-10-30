const camera=document.getElementById('journey-photography-station');
if(camera){
  const photos=[
    {src:'assets/photography-sculpture.jpg',zh:'展厅里的光',en:'Light in the gallery'},
    {src:'assets/photography-dragon.jpg',zh:'檐角与蓝天',en:'Rooflines and blue sky'},
    {src:'assets/photography-night.jpg',zh:'夜色中的建筑',en:'Architecture after dark'}
  ];
  const shutter=camera.querySelector('[data-camera-shutter]'),print=camera.querySelector('.camera-printed-photo'),image=print.querySelector('img'),caption=print.querySelector('.camera-print-caption'),status=camera.querySelector('.camera-print-status');
  let next=0,current=-1,printed=0,animation,develop,feedback,hideTimer=0,printRequest=0;
  const english=()=>document.documentElement.lang==='en';
  function translate(){
    shutter.setAttribute('aria-label',english()?'Press the camera to print one photo':'点击相机，出一张照片');
    camera.setAttribute('aria-label',english()?'Photography':'摄影作品');
    if(current<0){status.textContent=english()?'Click the camera to print a photo':'点击相机，出一张照片';return;}
    const title=photos[current][english()?'en':'zh'];caption.textContent=title;
    status.textContent=`${String(current+1).padStart(2,'0')} / 03 · ${title}`;
  }
  function ejectPhoto(){
    clearTimeout(hideTimer);const request=++printRequest;
    animation?.cancel();develop?.cancel();feedback?.cancel();current=next;next=(next+1)%photos.length;printed++;
    image.src=photos[current].src;camera.dataset.photoReady='true';camera.dataset.photoIndex=String(current);camera.dataset.printCount=String(printed);translate();
    const reduced=document.getElementById('journey-stage').dataset.motion==='off';
    animation=print.animate(reduced?[{opacity:1,transform:'translateY(8px) rotate(-3deg)'}]:[
      {transform:'translateY(-112%) rotate(0deg)',offset:0},
      {transform:'translateY(-55%) rotate(0deg)',offset:.38},
      {transform:'translateY(13px) rotate(-4deg)',offset:.83},
      {transform:'translateY(8px) rotate(-3deg)',offset:1}
    ],{duration:reduced?1:1250,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
    if(!reduced){
      develop=image.animate([{filter:'brightness(.48) saturate(.35)'},{filter:'brightness(.72) saturate(.65)',offset:.45},{filter:'brightness(1) saturate(1)'}],{duration:1750,easing:'ease-out'});
      feedback=shutter.querySelector('.camera-visual').animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(.97)',filter:'brightness(1.18)',offset:.22},{transform:'scale(1)',filter:'brightness(1)'}],{duration:340,easing:'ease-out'});
    }
    // A click reveals one photograph briefly; the resting icon never keeps a card out.
    hideTimer=setTimeout(async()=>{
      if(request!==printRequest)return;
      animation?.cancel();
      const still=document.getElementById('journey-stage').dataset.motion==='off';
      animation=print.animate(still?[{opacity:0}]:[{transform:'translateY(8px) rotate(-3deg)',opacity:1},{transform:'translateY(18px) rotate(-4deg)',opacity:0}],{duration:still?1:400,easing:'ease-in',fill:'forwards'});
      try{await animation.finished;}catch{return;}
      if(request!==printRequest)return;
      camera.dataset.photoReady='false';current=-1;translate();animation.cancel();
    },reduced?3300:4300);
  }
  document.addEventListener('portfolio-photo-eject',ejectPhoto);
  document.addEventListener('portfolio-language-change',translate);translate();
}
