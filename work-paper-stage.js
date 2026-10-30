// Large, gently deforming paper planes; original artwork stays in local assets.
import * as THREE from './vendor/three-r170.module.js';
import {posters} from './poster-data.js';
import {miniProgram} from './miniprogram-data.js?v=67b449a8af';
import {creatorSkills,xReader,posterCollectionCover} from './creator-work-data.js?v=42273c0c35';

const reel=document.querySelector('[data-work-reel]');
if(reel){
  const viewport=reel.querySelector('.work-reel-viewport');
  reel.dataset.engine='loading';
  const canvas=document.createElement('canvas');canvas.className='work-stage-canvas';canvas.setAttribute('aria-hidden','true');reel.prepend(canvas);
  try{
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,60);
    camera.position.set(0,-.4,10);camera.lookAt(0,.1,0);
    scene.add(new THREE.HemisphereLight('#fff9ea','#465347',2.5));
    const sun=new THREE.DirectionalLight('#ffffff',2.5);sun.position.set(-6,9,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-34,right:34,top:10,bottom:-10,near:.1,far:45});sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;sun.shadow.radius=4;scene.add(sun);scene.add(sun.target);
    // This transparent backdrop only receives shadows. Writing its invisible
    // surface into the depth buffer would cut holes in the waving/flipped paper.
    const receiver=new THREE.Mesh(new THREE.PlaneGeometry(150,30),new THREE.ShadowMaterial({opacity:.2,depthWrite:false}));receiver.position.z=-.5;receiver.receiveShadow=true;scene.add(receiver);
    // Keep the real HTML covers visible while textures load. Retry transient
    // hosted image failures instead of turning a failed texture into blank paper.
    const loadImage=async item=>{
      const url=new URL(item.src||item.image,document.baseURI);
      const cached=[...document.images].find(image=>image.src===url.href&&image.complete&&image.naturalWidth);
      if(cached)return cached;
      for(let attempt=0;attempt<3;attempt++){
        const image=await new Promise(resolve=>{
          const image=new Image();let timer;
          const finish=value=>{clearTimeout(timer);image.onload=image.onerror=null;resolve(value);};
          image.decoding='async';image.onload=()=>finish(image.naturalWidth?image:null);image.onerror=()=>finish(null);
          timer=setTimeout(()=>finish(null),8000);
          const request=new URL(url);if(attempt)request.searchParams.set('image_retry',String(attempt));image.src=request.href;
        });
        if(image)return image;
      }
      return null;
    };
    // The four approved covers have the same dimensions. Set up the scene now;
    // an unrelated slow image must not hold the current cover hostage.
    const photos=Array(3).fill(null),miniScreens=Array(3).fill(null),skillImages=Array(3).fill(null),xImages=Array(2).fill(null),coverImages=Array(4).fill(null);
    let herbalCover=null;
    const coverRatio=1672/941;
    const items=[...reel.querySelectorAll('[data-work-flip]')],turns=items.map(()=>({angle:0,from:0,target:0,started:0,progress:1}));
    const en=()=>document.documentElement.lang==='en';
    const tones=['#325c48','#33466b','#4a6142','#3f4a68'];
    let compact=false,paperW=12,paperH=5.6,spacing=15,view=0,time=0,last=performance.now(),lastDraw=0,frames=0,visible=false,mouseX=0,mouseY=0,disposed=false;
    const meshes=[];
    const titleEl=document.getElementById('unified-work-title'),titleLetters=[...titleEl.querySelectorAll('.cut-letter')],note=document.querySelector('.collage-work-note');
    const springs=titleLetters.map(node=>({base:parseFloat(node.style.getPropertyValue('--tilt'))||0,x:0,y:0,r:0,vx:0,vy:0,vr:0}));
    let titleIndex=Number(reel.dataset.index||0);
    titleLetters.forEach((node,i)=>node.addEventListener('pointerenter',()=>{if(reel.dataset.motion==='on'){springs[i].vy-=70;springs[i].vr+=(i%2?1:-1)*35;}}));
    function moveTitle(dt,running,speed){
      const nextIndex=Number(reel.dataset.index||0),direction=Math.sign(nextIndex-titleIndex);
      if(direction&&running)springs.forEach((s,i)=>{s.vx-=direction*(38+i*3);s.vy-=42+Math.sin(i*.8)*28;s.vr+=direction*(20+i*2);});
      titleIndex=nextIndex;titleEl.dataset.workIndex=String(nextIndex);titleEl.dataset.motionLink='paper';
      let totalX=0;
      springs.forEach((s,i)=>{
        if(!running){s.x=s.y=s.r=s.vx=s.vy=s.vr=0;titleLetters[i].style.transform=`rotate(${s.base}deg)`;titleLetters[i].style.boxShadow='';return;}
        const strength=compact?.5:1;
        const tx=(-speed*900*(.85+Math.sin(i*.8)*.15)+mouseX*(i-5.5)*1.2)*strength;
        const ty=(Math.sin(time*1.05+i*.65-view*1.4)*2.5-Math.abs(speed)*160*(1+Math.cos(i)*.3)+mouseY*3)*strength;
        const tr=-speed*100+Math.sin(time*.9+i*.62-view)*1.4+mouseX*2;
        s.vx+=((tx-s.x)*105-s.vx*15)*dt;s.vy+=((ty-s.y)*105-s.vy*14)*dt;s.vr+=((tr-s.r)*90-s.vr*13)*dt;
        s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=s.vr*dt;
        titleLetters[i].style.transform=`translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0) rotate(${(s.base+s.r).toFixed(2)}deg) rotateY(${(mouseX*4-s.r*.3).toFixed(2)}deg)`;
        titleLetters[i].style.boxShadow=`${(3+s.r*.1).toFixed(1)}px ${(5+Math.abs(s.y)*.2).toFixed(1)}px ${Math.abs(s.y*.2).toFixed(1)}px #11271c50`;
        totalX+=s.x;
      });
      titleEl.dataset.impulse=Math.abs(totalX/titleLetters.length).toFixed(2);
      if(note){note.style.transform=running?`translateX(${(-totalX/titleLetters.length*.2).toFixed(2)}px)`:'none';note.style.opacity=running?String(Math.max(.7,1-Math.abs(speed)*2)):'';}
    }
    function line(p,x,y,w,color='#76826d44'){p.fillStyle=color;p.fillRect(x,y,w,2);}
    function contain(p,image,x,y,w,h){if(!image)return;const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight),iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;p.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
    function paperTexture(index,front=false){
      const compact=false;
      const c=document.createElement('canvas');c.width=2200;c.height=Math.round(c.width/coverRatio);const p=c.getContext('2d'),w=c.width,h=c.height;
      p.fillStyle=index===2?'#e1e9c8':'#f0eddf';p.fillRect(0,0,w,h);
      if(front){contain(p,index===2&&reel.dataset.skillCover==='herbal'?herbalCover:coverImages[index],0,0,w,h);}else{
      p.strokeStyle='#a5ad9370';p.lineWidth=2;p.strokeRect(22,22,w-44,h-44);
      p.fillStyle=tones[index];p.textAlign='left';p.font='21px Consolas,monospace';p.fillText('0'+(index+1)+' / SELECTED WORK',65,75);
      p.textAlign='right';p.fillText('CHEN SHUAI',w-65,75);line(p,65,102,w-130);
      if(index===0){
        p.fillStyle=tones[index];p.textAlign='left';
        p.font='italic 155px Georgia,serif';p.fillText('WeChat',70,335);
        p.font='bold '+(en()?40:66)+'px "Microsoft YaHei",sans-serif';p.fillText(miniProgram.name[en()?1:0],70,465);
        p.font='27px "Microsoft YaHei",sans-serif';p.fillStyle='#65735c';p.fillText(en()?'WeChat mini program':'微信小程序项目',74,540);
        const areaX=715,areaW=w-areaX-65,gap=30,col=(areaW-gap*2)/3,top=165,areaH=h-top-130;
        miniScreens.forEach((image,i)=>{
          if(!image)return;
          p.fillStyle='#e4e2d6';p.fillRect(areaX+i*(col+gap),top,col,areaH);
          contain(p,image,areaX+i*(col+gap)+8,top+8,col-16,areaH-16);
          p.textAlign='center';p.fillStyle='#53684e';p.font='26px "Microsoft YaHei",sans-serif';p.fillText(miniProgram.images[i].title[en()?1:0],areaX+i*(col+gap)+col/2,top+areaH+47);
        });
        p.textAlign='left';p.fillStyle='#78816b';p.font='20px Consolas,monospace';p.fillText('01 / BREAKFAST PERSONALITY QUIZ',70,h-46);
      }else if(index===1){
        p.fillStyle='#304b3d';p.textAlign='left';p.font='bold '+(compact?80:90)+'px Georgia,serif';p.fillText('AI POSTERS',65,compact?215:220);
        const gap=compact?18:35,areaX=65,areaW=w-130,col=(areaW-gap*2)/3,top=compact?285:255,bottom=compact?210:110;
        photos.forEach((image,i)=>{p.fillStyle='#e5e2d4';p.fillRect(areaX+i*(col+gap),top,col,h-top-bottom);contain(p,image,areaX+i*(col+gap)+8,top+8,col-16,h-top-bottom-16);});
        p.textAlign='right';p.font=(compact?24:28)+'px "Microsoft YaHei",sans-serif';p.fillStyle='#4e6350';p.fillText(en()?'8 POSTERS / PAPER COLLAGE & PLUSH 3D':'8 张作品 / PAPER COLLAGE & PLUSH 3D',w-65,h-55);
      }else if(index===2){
        p.fillStyle=tones[index];p.textAlign='left';
        p.font='italic '+(compact?145:195)+'px Georgia,serif';p.fillText('Skill',70,compact?265:340);
        p.font='bold '+(compact?62:(en()?43:52))+'px "Microsoft YaHei",sans-serif';p.fillText(en()?'Three creative Skills':'我的三个 Skill',70,compact?365:445);
        if(!compact){
          p.font='28px "Microsoft YaHei",sans-serif';p.fillStyle='#65735c';
          (en()?['Reusable creative','workflows, shaped','through making.']:['把反复做的事，','整理成自己的方法。']).forEach((text,i)=>p.fillText(text,74,555+i*49));
        }
        const startX=compact?65:675,gap=compact?24:32,areaW=w-startX-65,col=(areaW-gap*2)/3,top=compact?450:175,areaH=compact?640:610;
        skillImages.forEach((image,i)=>{
          const x=startX+i*(col+gap);p.fillStyle='#f5f3e7';p.fillRect(x,top,col,areaH);
          contain(p,image,x+12,top+12,col-24,areaH-24);
          p.fillStyle='#405b38';p.textAlign='center';p.font=(compact?31:29)+'px "Microsoft YaHei",sans-serif';
          p.fillText(creatorSkills[i].name[en()?1:0],x+col/2,top+areaH+55);
        });
        p.textAlign='left';p.fillStyle='#78816b';p.font='20px Consolas,monospace';p.fillText('03 / PAPER COLLAGE · FRUIT · HERBAL',70,h-46);
      }else if(index===3){
        p.fillStyle=tones[index];p.textAlign='left';
        p.font='bold '+(compact?118:143)+'px Arial,sans-serif';p.fillText('X READER',70,compact?265:330);
        p.font=(compact?66:(en()?45:68))+'px "Microsoft YaHei",sans-serif';p.fillText(xReader.name[en()?1:0],70,compact?365:445);
        p.fillStyle='#65735c';p.font=(compact?29:28)+'px "Microsoft YaHei",sans-serif';
        p.fillText(en()?'POSTS · VIDEO · SAVED PHRASES':'动态翻译 / 视频字幕 / 收藏导出',74,compact?435:550);
        if(!compact){p.font='24px Consolas,monospace';p.fillText('v'+xReader.version+' / EXPERIMENTAL',74,620);}
        const startX=compact?65:940,gap=compact?25:30,areaW=w-startX-65,col=(areaW-gap)/2,top=compact?510:175,areaH=compact?625:610;
        xImages.forEach((image,i)=>{
          const x=startX+i*(col+gap);p.fillStyle='#e4e7dc';p.fillRect(x,top,col,areaH);
          contain(p,image,x+10,top+10,col-20,areaH-20);
          p.textAlign='center';p.fillStyle='#53684e';p.font=(compact?30:27)+'px "Microsoft YaHei",sans-serif';
          p.fillText(xReader.images[i].title[en()?1:0],x+col/2,top+areaH+52);
        });
        p.textAlign='left';p.fillStyle='#78816b';p.font='20px Consolas,monospace';p.fillText('04 / X BILINGUAL READER · v'+xReader.version,70,h-46);
      }
      }
      // The small scalloped paper edge comes from the previously approved stamp treatment.
      p.globalCompositeOperation='destination-out';p.fillStyle='#000';
      for(let x=0;x<w;x+=34){p.beginPath();p.arc(x,0,5,0,Math.PI*2);p.arc(x,h,5,0,Math.PI*2);p.fill();}
      const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return map;
    }
    function geometry(index){const width=Math.min(paperW,6*coverRatio),height=width/coverRatio;const g=new THREE.PlaneGeometry(width,height,64,32);g.userData.base=new Float32Array(g.attributes.position.array);g.userData.width=width;return g;}
    for(let i=0;i<4;i++){
      const material=new THREE.MeshBasicMaterial({map:paperTexture(i,true),transparent:true,alphaTest:.3,side:THREE.FrontSide,toneMapped:false});
      const mesh=new THREE.Mesh(geometry(i),material);
      {
        const backMap=paperTexture(i);backMap.repeat.x=-1;backMap.offset.x=1;
        const back=new THREE.Mesh(mesh.geometry,new THREE.MeshStandardMaterial({map:backMap,transparent:true,alphaTest:.3,roughness:.93,side:THREE.BackSide}));
        back.castShadow=true;mesh.add(back);mesh.userData.back=back;
      }
      mesh.castShadow=true;mesh.receiveShadow=false;mesh.rotation.z=[-.025,.022,-.018,.025][i];scene.add(mesh);meshes.push(mesh);
    }
    function resize(){
      const width=reel.clientWidth,height=Math.max(240,viewport.clientHeight-100),nextCompact=width<651;
      renderer.setSize(width,height,false);const aspect=width/height;camera.aspect=aspect;camera.updateProjectionMatrix();
      const ratio=nextCompact?1.06:2.15;paperW=Math.min(7*aspect*(nextCompact?.86:.87),6.0*ratio);paperH=paperW/ratio;spacing=paperW*1.28;
      meshes.forEach((mesh,i)=>{mesh.geometry.dispose();mesh.geometry=geometry(i);if(mesh.userData.back)mesh.userData.back.geometry=mesh.geometry;});
      if(nextCompact!==compact){compact=nextCompact;refreshTextures();meshes.forEach((mesh,i)=>{mesh.geometry.dispose();mesh.geometry=geometry(i);if(mesh.userData.back)mesh.userData.back.geometry=mesh.geometry;});}
      receiver.position.x=view*spacing;
    }
    new ResizeObserver(resize).observe(viewport);resize();
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'160px'});observer.observe(reel);
    viewport.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const box=viewport.getBoundingClientRect();mouseX=(event.clientX-box.left)/box.width-.5;mouseY=(event.clientY-box.top)/box.height-.5;},{passive:true});
    viewport.addEventListener('pointerleave',()=>{mouseX=mouseY=0;});
    titleEl.addEventListener('pointermove',event=>{const box=titleEl.getBoundingClientRect();mouseX=(event.clientX-box.left)/box.width-.5;mouseY=((event.clientY-box.top)/Math.max(1,box.height)-.5)*.5;},{passive:true});
    titleEl.addEventListener('pointerleave',()=>{mouseX=mouseY=0;});
    function refreshTextures(){meshes.forEach((mesh,i)=>{mesh.material.map.dispose();mesh.material.map=paperTexture(i,true);mesh.material.needsUpdate=true;if(mesh.userData.back){const back=mesh.userData.back;back.material.map.dispose();back.material.map=paperTexture(i);back.material.map.repeat.x=-1;back.material.map.offset.x=1;back.material.needsUpdate=true;}});}
    function refreshFace(index,front){
      const material=front?meshes[index].material:meshes[index].userData.back.material;
      material.map.dispose();material.map=paperTexture(index,front);
      if(!front){material.map.repeat.x=-1;material.map.offset.x=1;}
      material.needsUpdate=true;
    }
    function loadGroup(sources,collection,onReady){sources.forEach((item,index)=>{loadImage(item).then(image=>{if(disposed||!image)return;collection[index]=image;onReady(index);});});}
    // The normal HTML image is also a recovery path if a hosted request arrives
    // after its texture-load timeout. Its cover stays visible until WebGL is ready.
    items.forEach((item,index)=>{
      const image=item.querySelector('.miniapp-flip-front img');
      const accept=()=>{if(disposed||!image.naturalWidth)return;if(index===2&&image.src.includes('herbal-skill-cover'))herbalCover=image;else coverImages[index]=image;refreshFace(index,true);};
      image.addEventListener('load',accept);if(image.complete&&image.naturalWidth)accept();
    });
    loadGroup([miniProgram.cover,posterCollectionCover,creatorSkills[1].cover,xReader.cover].map(src=>({src})),coverImages,index=>refreshFace(index,true));
    loadImage({src:creatorSkills[2].cover}).then(image=>{if(disposed||!image)return;herbalCover=image;refreshFace(2,true);});
    loadGroup([posters[0],posters[4],posters[5]],photos,()=>refreshFace(1,false));
    loadGroup(miniProgram.images,miniScreens,()=>refreshFace(0,false));
    loadGroup(creatorSkills,skillImages,()=>refreshFace(2,false));
    loadGroup(xReader.images.slice(0,2),xImages,()=>refreshFace(3,false));
    document.addEventListener('portfolio-language-change',refreshTextures);
    document.addEventListener('portfolio-skill-cover-change',()=>{meshes[2].material.map.dispose();meshes[2].material.map=paperTexture(2,true);meshes[2].material.needsUpdate=true;});
    const alignInitialSection=()=>{if(['#works','#about'].includes(location.hash)&&!new URL(location.href).searchParams.has('panel'))document.querySelector(location.hash)?.scrollIntoView({behavior:'instant',block:'start'});};
    if(document.readyState==='complete')requestAnimationFrame(alignInitialSection);
    else addEventListener('load',()=>requestAnimationFrame(alignInitialSection),{once:true});
    function draw(now){
      if(!reel.isConnected){if(!disposed){renderer.dispose();meshes.forEach(m=>{m.geometry.dispose();m.material.map.dispose();m.material.dispose();if(m.userData.back){m.userData.back.material.map.dispose();m.userData.back.material.dispose();}});disposed=true;}return;}
      requestAnimationFrame(draw);
      // Anchor navigation can enter the section before its first observer event.
      if(!visible){const bounds=reel.getBoundingClientRect();visible=bounds.bottom>-160&&bounds.top<innerHeight+160;}
      if(!visible||document.hidden||document.querySelector('dialog[open]')){lastDraw=now;return;}
      if(now-lastDraw<25)return;const dt=Math.min(.05,(now-lastDraw)/1000);lastDraw=now;
      const running=reel.dataset.motion==='on',target=viewport.scrollLeft/Math.max(1,viewport.clientWidth),old=view;
      view+= (target-view)*(running?.12:1);const speed=view-old;
      if(running)time+=dt;
      moveTitle(dt,running,speed);
      meshes.forEach((mesh,i)=>{
        const turn=turns[i],targetAngle=items[i].dataset.side==='back'?Math.PI:0;
        if(targetAngle!==turn.target){turn.from=turn.angle;turn.target=targetAngle;turn.started=now;}
        const flipProgress=turn.progress=running?Math.min(1,(now-turn.started)/720):1,easedFlip=flipProgress<.5?4*flipProgress**3:1-(-2*flipProgress+2)**3/2;
        turn.angle=turn.from+(turn.target-turn.from)*easedFlip;
        const pos=mesh.geometry.attributes.position,base=mesh.geometry.userData.base;
        for(let v=0;v<pos.count;v++){
          const x=base[v*3],y=base[v*3+1],edge=x/(mesh.geometry.userData.width*.5);
          const ripple=running?.22*Math.sin(x*.9+y*.55+time*1.7)+.09*Math.sin(x*2.2-y*.8-time*.8):0;
          const curl=running?Math.sin(edge*Math.PI*.5)*Math.abs(edge)*Math.min(1.4,Math.abs(speed)*6)*Math.sign(speed):0;
          const turnCurl=running?.24*Math.sin(flipProgress*Math.PI)*Math.sin(edge*Math.PI):0;
          pos.setZ(v,ripple+curl+.009*x*x+turnCurl);
        }
        pos.needsUpdate=true;mesh.geometry.computeVertexNormals();
        mesh.position.set(i*spacing,.13+(running?Math.sin(time*.65+i)*.035:0),0);
        mesh.rotation.x=running?mouseY*.055+Math.sin(time*.45+i)*.012:0;
        mesh.rotation.y=(running?-mouseX*.065-Math.max(-.3,Math.min(.3,speed*.9)):0)+turn.angle;
        items[i].dataset.renderedFace=flipProgress<1?'turning':(turn.target?'back':'front');
      });
      const x=view*spacing;camera.position.set(x+(running?mouseX*.2:0),-.4,10+(running?Math.min(1.1,Math.abs(speed)*3):0));camera.lookAt(x,.1,0);
      sun.position.x=x-6;sun.target.position.x=x;receiver.position.x=x;
      renderer.render(scene,camera);frames++;
      const currentIndex=Number(reel.dataset.index)||0;
      const frontReady=Boolean(currentIndex===2&&reel.dataset.skillCover==='herbal'?herbalCover:coverImages[currentIndex]);
      const backReady=[miniScreens,photos,skillImages,xImages][currentIndex].every(Boolean);
      const faceReady=frontReady&&(items[currentIndex].dataset.side!=='back'||backReady);
      canvas.style.visibility=faceReady?'visible':'hidden';reel.dataset.engine=faceReady?'webgl':'loading';
      reel.dataset.frame=String(frames);reel.dataset.time=time.toFixed(2);reel.dataset.progress=view.toFixed(3);reel.dataset.settled=Math.abs(target-view)<.002&&Math.abs(target-Number(reel.dataset.index))<.002?'true':'false';
      const activeTurn=turns[Number(reel.dataset.index)||0];reel.dataset.flipAngle=activeTurn.angle.toFixed(3);reel.dataset.face=activeTurn.progress<1?'turning':(activeTurn.target?'back':'front');
    }
    requestAnimationFrame(draw);
  }catch(error){canvas.remove();reel.dataset.engine='fallback';reel.dataset.stageError=error?.message||'Renderer unavailable';console.warn('The paper stage is unavailable; the original work entrances remain usable.',error);}
}
