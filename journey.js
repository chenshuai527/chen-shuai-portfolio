(() => {
  const stage=document.getElementById('journey-stage');if(!stage)return;
  const stations=[...stage.querySelectorAll('[data-journey-station]')],runner=document.getElementById('paper-runner');
  const svg=stage.querySelector('.journey-map'),path=svg.querySelector('.journey-path');
  // The spline is only geometry for the cat; the visible guide consists entirely of paw prints.
  svg.querySelector('.journey-path-shadow')?.remove();svg.querySelector('.journey-route-dots')?.remove();
  const svgNS='http://www.w3.org/2000/svg',prints=document.createElementNS(svgNS,'g');
  prints.setAttribute('class','journey-footprints');svg.append(prints);let footprints=[];
  const status=document.getElementById('journey-status'),motionButton=document.querySelector('[data-journey-motion]'),tourButton=document.querySelector('[data-journey-tour]'),tools=document.getElementById('journey-tools'),intro=document.getElementById('journey-intro');
  const words={
    welcome:['我是陈帅。欢迎来到我的创作桌面。',"I’m Chen Shuai. Welcome to my creative corner."],tour:['跟小猫走一圈','Follow my cat'],stop:['先停一下','Pause the tour'],runnerHi:['喵，跟我来！','Meow! Follow me!'],
    intro:['简单认识我','A little about me'],introInterests:['设计 · AI · 摄影 · 阅读','Design · AI · Photos · Books'],tools:['技能','Skills'],posters:['海报','Posters'],projects:['项目','Projects'],skills:['Skill','Skill'],photos:['摄影作品','Photography'],photosDetail:['我眼中的日常','Through my eyes'],books:['年度书单','Reading list'],
    toolsTitle:['技能与实践','Skills & practice'],toolsNote:['从常用 AI 工具，到可复用的创作方法和小程序实践。','AI tools, reusable creative methods, and mini-program practice.'],motionOn:['动效 · 开','Motion · On'],motionOff:['动效 · 关','Motion · Off'],idle:['跟着小猫的脚印，慢慢逛一圈。','Follow the little paw prints. Take your time.'],done:['从认识，到技能、作品和持续积累。','From a hello to skills, work, and learning along the way.'],
    status0:['01 · 你好，先简单认识一下。','01 · Hello. A little introduction first.'],status1:['02 · 用 AI 技能，给想法一个开始。','02 · Give an idea its first step with AI skills.'],status2:['03 · 把脑海里的想法，做成看得见的海报。','03 · Turn an idea into a poster.'],status3:['04 · 按一下快门，看看我眼中的日常。','04 · Press the shutter. See the world through my eyes.']
  };
  const t=key=>words[key]?.[document.documentElement.lang==='en'?1:0]||key;
  const stationBounds=station=>(station.querySelector('.journey-visual')||station.querySelector('.station-label')||station).getBoundingClientRect();
  // The portfolio's motion is an explicit part of its design. Only a visitor's
  // choice on our switch should disable it, not an inherited automatic value.
  let motion=true,visited=new Set(),lastIndex=0;
  try{const saved=localStorage.getItem('chen-shuai-motion-choice');if(saved!==null)motion=saved==='on';visited=new Set(JSON.parse(sessionStorage.getItem('chen-shuai-flat-five-visited')||'[]').filter(n=>Number.isInteger(n)&&n>=0&&n<stations.length));lastIndex=Math.max(0,Math.min(stations.length-1,Number(sessionStorage.getItem('chen-shuai-flat-five-last')||0)));}catch{}
  let points=[],lengths=[],distance=0,total=0,token=0,touring=false,bypass=false,statusKey='idle',lastSize='',resizeFrame=0,previousMobile=false;
  let catPosition=null;
  stage.dataset.catMode='guide-only';
  function renderText(){document.querySelectorAll('[data-journey-i18n]').forEach(e=>e.textContent=t(e.dataset.journeyI18n));motionButton.textContent=t(motion?'motionOn':'motionOff');motionButton.setAttribute('aria-pressed',String(motion));tourButton.querySelector('[data-journey-i18n]').textContent=t(touring?'stop':'tour');tourButton.setAttribute('aria-pressed',String(touring));status.textContent=t(statusKey);stage.dataset.motion=motion?'on':'off';document.querySelector('.journey-progress').setAttribute('aria-label',document.documentElement.lang==='en'?'Exploration progress':'探索进度');}
  function setStatus(key){statusKey=key;status.textContent=t(key);}
  function progress(){stations.forEach((s,i)=>s.classList.toggle('is-visited',visited.has(i)));document.querySelectorAll('.journey-progress>i').forEach((dot,i)=>{dot.classList.toggle('is-visited',visited.has(i));dot.classList.toggle('is-current',lastIndex===i);});}
  function save(){try{sessionStorage.setItem('chen-shuai-flat-five-visited',JSON.stringify([...visited]));sessionStorage.setItem('chen-shuai-flat-five-last',String(lastIndex));localStorage.setItem('chen-shuai-motion-choice',motion?'on':'off');localStorage.setItem('chen-shuai-journey-motion',motion?'1':'0');}catch{}}
  function place(value){
    if(!total)return;
    const previous=distance;distance=Math.max(0,Math.min(total,value));
    const p=path.getPointAtLength(distance),direction=distance<previous?-1:1;
    const behind=path.getPointAtLength(Math.max(0,distance-2)),ahead=path.getPointAtLength(Math.min(total,distance+2));
    runner.style.setProperty('--runner-flip',(ahead.x-behind.x)*direction>=0?'1':'-1');
    putCat(p);
    let passed=0;
    footprints.forEach(print=>{const pressed=print.distance<=distance;print.element.classList.toggle('is-pressed',pressed);if(pressed)passed++;});
    stage.dataset.routeProgress=(distance/total).toFixed(3);stage.dataset.pawsPassed=String(passed);
  }
  function layFootprints(mobile){
    const spacing=mobile?34:39,size=mobile?18:20;
    footprints=[];
    for(let at=16,index=0;at<total-12;at+=spacing,index++){
      const p=path.getPointAtLength(at),before=path.getPointAtLength(Math.max(0,at-2)),after=path.getPointAtLength(Math.min(total,at+2));
      const angle=Math.atan2(after.y-before.y,after.x-before.x),side=index%2===0?-1:1;
      const x=p.x-Math.sin(angle)*side*4.5,y=p.y+Math.cos(angle)*side*4.5;
      const group=document.createElementNS(svgNS,'g'),mark=document.createElementNS(svgNS,'image');
      group.setAttribute('class','journey-paw');group.setAttribute('transform',`translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${(angle*180/Math.PI+90).toFixed(2)})`);
      mark.setAttribute('class','journey-paw-mark');mark.setAttribute('href','assets/paw-print.svg');mark.setAttribute('x',-size/2);mark.setAttribute('y',-size/2);mark.setAttribute('width',size);mark.setAttribute('height',size);
      group.append(mark);footprints.push({element:group,distance:at});
    }
    prints.replaceChildren(...footprints.map(print=>print.element));stage.dataset.routeStyle='paw-prints';
  }
  function routeData(list,end=list.length-1){let d=`M ${list[0].x} ${list[0].y}`;for(let i=0;i<end;i++){const p0=list[Math.max(0,i-1)],p1=list[i],p2=list[i+1],p3=list[Math.min(list.length-1,i+2)];d+=` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6},${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6},${p2.x} ${p2.y}`;}return d;}
  function putCat(point){
    catPosition={x:point.x,y:point.y};
    runner.style.transform=`translate(${point.x-runner.offsetWidth/2}px,${point.y-runner.offsetHeight}px)`;
  }
  async function joinGuide(request){
    if(!catPosition||!motion)return true;
    const start=catPosition;let nearest=distance,best=Infinity;
    for(let at=0;at<=total;at+=16){const p=path.getPointAtLength(at),away=Math.hypot(p.x-start.x,p.y-start.y);if(away<best){best=away;nearest=at;}}
    distance=nearest;const end=path.getPointAtLength(nearest),duration=Math.min(500,best*3);
    return new Promise(resolve=>{let began;function frame(now){if(request!==token){resolve(false);return;}began??=now;const fraction=duration?Math.min(1,(now-began)/duration):1;runner.style.setProperty('--runner-flip',end.x>=start.x?'1':'-1');putCat({x:start.x+(end.x-start.x)*fraction,y:start.y+(end.y-start.y)*fraction});if(fraction<1)requestAnimationFrame(frame);else resolve(true);}requestAnimationFrame(frame);});
  }
  function layout(){
    const bounds=stage.getBoundingClientRect(),size=Math.round(bounds.width)+'x'+Math.round(bounds.height);
    if(size===lastSize&&points.length)return;
    lastSize=size;token++;touring=false;runner.classList.remove('is-running','is-guiding');stage.dataset.journeyState='idle';
    const mobile=bounds.width<650;if(mobile&&!previousMobile)lastIndex=0;previousMobile=mobile;
    points=stations.map((station,i)=>{
      const v=stationBounds(station),photography=station.dataset.journeyStation==='photography';let x;
      if(mobile)x=i%2===0?v.right-bounds.left+14:v.left-bounds.left-14;
      else if(photography)x=v.right-bounds.left+32;
      else x=i===0?v.right-bounds.left+25:i===1?bounds.width*.73:i===2?v.left-bounds.left-24:i===3?v.left-bounds.left+25:v.left-bounds.left-28;
      return{x:Math.max(runner.offsetWidth/2+6,Math.min(bounds.width-runner.offsetWidth/2-6,x)),y:Math.max(110,Math.min(bounds.height-16,v.bottom-bounds.top+(mobile?3:photography?12:57)))};
    });
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);path.setAttribute('d',routeData(points));total=path.getTotalLength();
    const measure=document.createElementNS(svgNS,'path');measure.setAttribute('visibility','hidden');svg.append(measure);
    lengths=points.map((_,i)=>{if(!i)return 0;measure.setAttribute('d',routeData(points,i));return measure.getTotalLength();});measure.remove();
    layFootprints(mobile);place(lengths[lastIndex]||0);renderText();progress();
  }
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function restGuide(request){setTimeout(()=>{if(request===token&&!touring)runner.classList.remove('is-guiding');},1500);}
  async function moveTo(index,request,forceMotion=false){
    runner.classList.add('is-running','is-guiding');stage.dataset.journeyState=touring?'tour':'travel';
    if(!await joinGuide(request))return false;
    const start=distance,end=lengths[index]||0,duration=(motion||forceMotion)?Math.min(1100,520+Math.abs(end-start)*.42):0;
    const completed=await new Promise(resolve=>{let began;function frame(now){if(request!==token){resolve(false);return;}began??=now;const fraction=duration?Math.min(1,(now-began)/duration):1,eased=fraction<.5?2*fraction*fraction:1-Math.pow(-2*fraction+2,2)/2;place(start+(end-start)*eased);if(fraction<1)requestAnimationFrame(frame);else resolve(true);}requestAnimationFrame(frame);});
    if(!completed)return false;
    runner.classList.remove('is-running');lastIndex=index;visited.add(index);progress();save();runner.classList.add('is-celebrating');stations[index].classList.add('is-arrived');setStatus('status'+index);stage.dataset.journeyState='arrived';runner.dataset.station=stations[index].dataset.journeyStation;
    setTimeout(()=>{runner.classList.remove('is-celebrating');stations[index].classList.remove('is-arrived');},450);if(!touring)restGuide(request);return true;
  }
  function burst(station){const box=stage.getBoundingClientRect(),v=stationBounds(station),x=v.left-box.left+v.width*.5,y=v.top-box.top+v.height*.55,layer=stage.querySelector('.journey-particles'),colors=['#d6ed9c','#7689ff','#f1eddf','#d9a58d','#b9d9cb'];const count=motion?27:9;for(let i=0;i<count;i++){const part=document.createElement('i');part.className='journey-particle';part.style.background=colors[i%colors.length];if(i%5===0){part.textContent='✦';part.style.background='transparent';part.style.color=colors[i%colors.length];part.style.fontSize='19px';part.style.width='19px';part.style.height='19px';}const angle=(i/count)*Math.PI*2+(Math.random()-.5)*.35,radius=motion?58+Math.random()*85:14+Math.random()*18,dx=Math.cos(angle)*radius,dy=Math.sin(angle)*radius,rotation=(Math.random()-.5)*550;layer.append(part);const animation=part.animate([{transform:`translate(${x}px,${y}px) rotate(0) scale(.5)`,opacity:0},{transform:`translate(${x+dx*.5}px,${y+dy*.5}px) rotate(${rotation*.5}deg) scale(1)`,opacity:1,offset:.22},{transform:`translate(${x+dx}px,${y+dy+32}px) rotate(${rotation}deg) scale(.35)`,opacity:0}],{duration:motion?720+Math.random()*300:320,easing:'cubic-bezier(.15,.65,.3,1)',fill:'forwards'});animation.finished.catch(()=>{}).finally(()=>part.remove());}stage.dataset.lastBurst=station.dataset.journeyStation;}
  function stop(){token++;touring=false;runner.classList.remove('is-running','is-guiding');stage.dataset.journeyState='idle';renderText();}
  async function startTour(){if(touring){stop();return;}stop();motion=true;touring=true;lastIndex=0;progress();setStatus('status0');save();renderText();const request=token;for(let i=0;i<stations.length;i++){if(request!==token)return;if(stage.clientWidth<650)stations[i].scrollIntoView({behavior:'smooth',block:'center'});if(!await moveTo(i,request,true))return;burst(stations[i]);await pause(600);if(request!==token)return;}touring=false;stage.dataset.journeyState='idle';setStatus('done');renderText();restGuide(request);}
  stage.addEventListener('click',async event=>{
    const station=event.target.closest('[data-journey-station]');if(!station||bypass)return;
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();event.stopImmediatePropagation();stop();
    const request=token,index=stations.indexOf(station),toolChoice=event.target.closest('[data-desk-detail]'),albumLink=event.target.closest('[data-photography-album]'),posterBookLink=event.target.closest('[data-poster-book-link]');
    if(station.dataset.journeyStation==='photography'&&!albumLink)document.dispatchEvent(new CustomEvent('portfolio-photo-eject'));
    if(station.dataset.journeyStation==='posters'&&!posterBookLink)document.dispatchEvent(new CustomEvent('portfolio-poster-eject'));
    if(!await moveTo(index,request))return;
    burst(station);await pause(motion?210:100);if(request!==token)return;
    stage.dataset.journeyState='idle';
    if(station.dataset.journeyStation==='photography'){
      if(albumLink){const openEvent=new CustomEvent('portfolio-open-page',{detail:{href:albumLink.href},cancelable:true});if(document.dispatchEvent(openEvent))location.assign(albumLink.href);}
      return;
    }
    if(station.dataset.journeyStation==='posters'){
      if(posterBookLink){bypass=true;try{posterBookLink.click();}finally{bypass=false;}}
      return;
    }
    if(station.dataset.journeyStation==='intro'){intro.showModal();return;}
    if(station.dataset.journeyStation==='tools'){if(toolChoice){bypass=true;try{toolChoice.click();}finally{bypass=false;}}else tools.showModal();return;}
    if(station.tagName==='A'){const openEvent=new CustomEvent('portfolio-open-page',{detail:{href:station.href},cancelable:true});if(document.dispatchEvent(openEvent))location.assign(station.href);return;}
    bypass=true;try{station.click();}finally{bypass=false;}
  },true);
  document.querySelectorAll('.journey-index a').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const target=document.querySelector(link.getAttribute('href'));if(stage.clientWidth<650)target.scrollIntoView({behavior:motion?'smooth':'instant',block:'center'});target.click();}));
  intro.querySelector('[data-intro-close]').addEventListener('click',()=>intro.close());
  intro.addEventListener('click',event=>{if(event.target!==intro)return;const b=intro.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)intro.close();});
  tourButton.addEventListener('click',startTour);
  motionButton.addEventListener('click',()=>{stop();motion=!motion;save();renderText();});
  tools.querySelector('[data-tools-close]').addEventListener('click',()=>tools.close());
  tools.addEventListener('click',event=>{if(event.target.closest('[data-desk-detail]'))tools.close();},true);
  tools.addEventListener('click',event=>{if(event.target!==tools)return;const b=tools.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)tools.close();});
  document.addEventListener('portfolio-language-change',renderText);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(layout);}).observe(stage);
  renderText();progress();layout();
})();
