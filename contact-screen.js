(() => {
  const stages=[...document.querySelectorAll('[data-contact-stage]')];
  if(!stages.length)return;
  const english=()=>document.documentElement.lang==='en';
  for(const stage of stages){
    const rows=[...stage.querySelectorAll('[data-contact-channel]')];
    const lamp=stage.querySelector('.contact-lamp-art'),beam=stage.querySelector('.contact-beam');
    const toggle=stage.querySelector('[data-contact-lamp-toggle]'),status=stage.querySelector('[data-contact-status]');
    let active=rows[0],pendingFrame=0,light=true,resetTimer,pointerTarget=null;
    // A one-time light field: soft falloff and a little paper grain. This is
    // illumination rather than a downloaded image, so it can point anywhere.
    const context=beam.getContext('2d');
    if(context){
      const field=context.createImageData(beam.width,beam.height);
      let seed=527;
      for(let y=0;y<beam.height;y++)for(let x=0;x<beam.width;x++){
        const t=x/(beam.width-1),spread=Math.max(1,(1-t)*beam.height*.48),d=Math.abs(y-beam.height*.5)/spread;
        if(d>=1)continue;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const grain=.88+(seed/4294967295)*.12,edge=Math.min(1,(x+1)/20);
        const alpha=Math.pow(1-d*d,1.4)*(.25+.5*t)*grain*edge;
        const pixel=(y*beam.width+x)*4;
        field.data[pixel]=246;field.data[pixel+1]=242;field.data[pixel+2]=218;field.data[pixel+3]=Math.round(alpha*255);
      }
      context.putImageData(field,0,0);stage.dataset.beamReady='true';
    }
    function aim(){
      pendingFrame=0;
      const box=stage.getBoundingClientRect(),art=lamp.getBoundingClientRect(),target=active.querySelector('.contact-channel-name').getBoundingClientRect();
      const scale=Math.min(art.width/(lamp.naturalWidth||1024),art.height/(lamp.naturalHeight||1536));
      const drawnWidth=(lamp.naturalWidth||1024)*scale,drawnHeight=(lamp.naturalHeight||1536)*scale;
      const emitter={x:art.left-box.left+(art.width-drawnWidth)/2+drawnWidth*.29,y:art.top-box.top+(art.height-drawnHeight)/2+drawnHeight*.255};
      const destination=pointerTarget||{x:target.left-box.left+target.width*.6,y:target.top-box.top+target.height*.5};
      const distance=Math.hypot(emitter.x-destination.x,emitter.y-destination.y)+40,angle=Math.atan2(emitter.y-destination.y,emitter.x-destination.x)*180/Math.PI;
      const height=Math.max(100,distance*.5);
      Object.assign(beam.style,{left:`${emitter.x-distance}px`,top:`${emitter.y-height/2}px`,width:`${distance}px`,height:`${height}px`,transform:`rotate(${angle}deg)`});
      stage.style.setProperty('--lamp-tilt',`${Math.max(-7,Math.min(7,-angle*.16))}deg`);
    }
    const schedule=()=>{if(!pendingFrame)pendingFrame=requestAnimationFrame(aim);};
    function highlight(row){pointerTarget=null;active=row;rows.forEach(item=>item.classList.toggle('is-lit',item===row));schedule();}
    rows.forEach(row=>{row.addEventListener('pointerenter',()=>highlight(row));row.addEventListener('focusin',()=>highlight(row));});
    stage.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'||event.target.closest('[data-contact-channel]'))return;
      const box=stage.getBoundingClientRect();
      pointerTarget={x:Math.max(25,Math.min(box.width*.76,event.clientX-box.left)),y:Math.max(30,Math.min(box.height-45,event.clientY-box.top))};schedule();
    },{passive:true});
    stage.addEventListener('pointerleave',()=>{pointerTarget=null;schedule();});
    function language(){
      toggle.setAttribute('aria-label',english()?(light?'Turn the lamp off':'Turn the lamp on'):(light?'关闭台灯':'打开台灯'));
      toggle.querySelector('[data-contact-lamp-label]').textContent=english()?`Lamp · ${light?'On':'Off'}`:`台灯 · ${light?'开':'关'}`;
      stage.querySelector('.contact-links').setAttribute('aria-label',english()?'Social profiles and contact details':'社交账号和联系方式');
      stage.querySelectorAll('[data-contact-copy]').forEach(button=>{
        const copied=button.dataset.copyState==='copied';
        button.querySelector('[data-contact-copy-label]').textContent=english()?(copied?'Copied':'Copy'):(copied?'已复制':'复制');
        button.setAttribute('aria-label',english()?`Copy ${button.dataset.copyKind==='wechat'?'WeChat ID':'email address'}`:`复制${button.dataset.copyKind==='wechat'?'微信号':'邮箱地址'}`);
      });schedule();
    }
    toggle.addEventListener('click',()=>{light=!light;stage.dataset.light=light?'on':'off';toggle.setAttribute('aria-pressed',String(light));language();});
    stage.querySelectorAll('[data-contact-copy]').forEach(button=>button.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(button.dataset.contactCopy);
        button.dataset.copyState='copied';
        status.textContent=english()?(button.dataset.copyKind==='wechat'?'WeChat ID copied.':'Email address copied.'):(button.dataset.copyKind==='wechat'?'微信号已复制。':'邮箱地址已复制。');
        language();clearTimeout(resetTimer);resetTimer=setTimeout(()=>{stage.querySelectorAll('[data-copy-state]').forEach(node=>delete node.dataset.copyState);language();status.textContent='';},2400);
      }catch{status.textContent=english()?'Please select the ID and copy it manually.':'可以选中上方账号，手动复制。';}
    }));
    new ResizeObserver(schedule).observe(stage);
    lamp.addEventListener('load',schedule);
    document.addEventListener('portfolio-language-change',language);
    highlight(active);language();
  }
})();
