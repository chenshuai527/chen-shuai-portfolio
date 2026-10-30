import * as THREE from './vendor/three-r170.module.js';
import {createMeadowCat} from './meadow-cat.js?v=ea091d0639';

// Embedded detail pages share the parent's meadow rather than rendering it twice.
const host=document.querySelector('.site-background');
if(host&&!document.documentElement.classList.contains('is-embedded')){
  const canvas=document.createElement('canvas');canvas.className='meadow-wind-canvas';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
  try{
    const texture=await new THREE.TextureLoader().loadAsync(new URL('./assets/meadow-sunlit-long-grass.webp',import.meta.url).href);
    texture.colorSpace=THREE.SRGBColorSpace;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;
    const uniforms={uMap:{value:texture},uTime:{value:0},uAspect:{value:1},uTextureAspect:{value:texture.image.width/texture.image.height},uResolution:{value:new THREE.Vector2(1280,900)},uPointer:{value:new THREE.Vector2(-10,-10)}};
    const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
      vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader:`
        uniform sampler2D uMap; uniform float uTime,uAspect,uTextureAspect; uniform vec2 uResolution; varying vec2 vUv;
        void main(){
          vec2 fit=vec2(1.);
          if(uAspect>uTextureAspect)fit.y=uTextureAspect/uAspect;else fit.x=uAspect/uTextureAspect;
          vec2 uv=(vUv-.5)*fit+.5;
          // Local motion follows the same travelling gust as the rooted foreground blades.
          // Bright fine tips move more than shaded roots; there is no whole-image pan or zoom.
          vec3 still=texture2D(uMap,uv).rgb;
          float gust=.66*sin(vUv.x*9.+vUv.y*5.-uTime*1.25)+.28*sin(vUv.y*17.-vUv.x*4.-uTime*.81);
          float tipPattern=.45+.55*pow(.5+.5*sin(vUv.x*97.+vUv.y*73.),2.);
          float luminance=dot(still,vec3(.2126,.7152,.0722));
          float tips=tipPattern*mix(.2,1.,smoothstep(.05,.55,luminance));
          float flutter=sin(vUv.x*112.+vUv.y*65.-uTime*2.7)*1.3;
          float amplitude=mix(5.,9.,clamp(uResolution.x/1200.,0.,1.));
          float bend=(gust*amplitude+flutter)*tips;
          vec2 windUV=uv+vec2(bend,bend*.22)*fit/uResolution;
          vec3 colour=texture2D(uMap,clamp(windUV,vec2(.001),vec2(.999))).rgb;
          float light=.98+.045*gust+.012*sin(vUv.x*7.+vUv.y*4.-uTime*.35);
          gl_FragColor=vec4(colour*light,1.);
          #include <colorspace_fragment>
        }`
    });
    const scene=new THREE.Scene(),geometry=new THREE.PlaneGeometry(2,2),ground=new THREE.Mesh(geometry,material);ground.renderOrder=0;scene.add(ground);
    const bladeMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
      vertexShader:`
        uniform sampler2D uMap;uniform float uTime,uAspect,uTextureAspect;uniform vec2 uResolution,uPointer;
        attribute vec2 aRoot;attribute vec4 aBlade;
        varying vec3 vColour;varying float vHeight,vSide,vWind;
        void main(){
          float h=position.y,phase=aBlade.w;
          float gust=.66*sin(aRoot.x*9.+aRoot.y*5.-uTime*1.25)+.28*sin(aRoot.y*17.-aRoot.x*4.-uTime*.81);
          float flutter=.045*sin(uTime*2.7+phase+aRoot.x*27.);
          vec2 nearPointer=(aRoot-uPointer)*vec2(uAspect,1.);
          float brush=exp(-dot(nearPointer,nearPointer)*105.)*sign(nearPointer.x)*.7;
          float bend=(gust*.6+flutter+brush*.5)*aBlade.x*h*h;
          float taper=.035+.965*pow(1.-h,.8);
          vec2 local=vec2(position.x*aBlade.y*taper+sin(phase*1.7)*aBlade.x*.2*h*h,aBlade.x*h*(1.-.13*abs(gust)*h));
          float c=cos(aBlade.z),s=sin(aBlade.z);local=mat2(c,-s,s,c)*local;
          local.x+=bend;
          vec2 fit=vec2(1.);if(uAspect>uTextureAspect)fit.y=uTextureAspect/uAspect;else fit.x=uAspect/uTextureAspect;
          vec2 sampleUV=(aRoot-.5)*fit+.5;
          vColour=texture2D(uMap,sampleUV).rgb;
          vHeight=h;vSide=position.x*2.;vWind=gust;
          gl_Position=vec4(aRoot*2.-1.+local*2./uResolution,0.,1.);
        }`,
      fragmentShader:`
        varying vec3 vColour;varying float vHeight,vSide,vWind;
        void main(){
          float edge=1.-smoothstep(.68,1.,abs(vSide));
          float alpha=edge*smoothstep(0.,.14,vHeight)*.76;
          vec3 green=mix(vColour,vec3(.13,.23,.025),.08);
          float light=.77+vHeight*.34+vSide*.05+vWind*.045;
          gl_FragColor=vec4(green*light,alpha);
          #include <colorspace_fragment>
        }`
    });
    function makeBlades(count){
      const g=new THREE.InstancedBufferGeometry(),positions=[],indices=[],segments=7;
      for(let j=0;j<=segments;j++)positions.push(-.5,j/segments,0,.5,j/segments,0);
      for(let j=0;j<segments;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
      const roots=new Float32Array(count*2),shapes=new Float32Array(count*4);let seed=72419,rx=0,ry=0;
      const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<count;i++){
        if(i%4===0){rx=rand();ry=rand();}
        roots[i*2]=rx+(rand()-.5)*.012;roots[i*2+1]=ry+(rand()-.5)*.009;
        shapes[i*4]=(22+Math.pow(rand(),1.5)*43)*(.8+(1-ry)*.4);
        shapes[i*4+1]=.55+rand()*1.2;shapes[i*4+2]=.65+rand()*.55;shapes[i*4+3]=rand()*6.283;
      }
      g.setAttribute('aRoot',new THREE.InstancedBufferAttribute(roots,2));g.setAttribute('aBlade',new THREE.InstancedBufferAttribute(shapes,4));g.instanceCount=count;return g;
    }
    const blades=new THREE.Mesh(makeBlades(1200),bladeMaterial);blades.frustumCulled=false;blades.renderOrder=1;scene.add(blades);
    // Keep the cat behind all foreground blades, in the same photographic scene.
    const meadowCat=await createMeadowCat({THREE,scene,uniforms,bladeMaterial,host}).catch(()=>{host.dataset.catState='unavailable';return null;});
    const camera=new THREE.Camera();let lastDraw=performance.now(),time=0,dirty=true,frames=0,lastCount=0;
    const stage=document.getElementById('journey-stage');
    function enabled(){
      if(stage)return stage.dataset.motion==='on';
      try{const saved=localStorage.getItem('chen-shuai-motion-choice');if(saved!==null)return saved==='on';}catch{}
      return true;
    }
    function resize(){
      const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);uniforms.uAspect.value=w/Math.max(1,h);uniforms.uResolution.value.set(w,h);
      const count=Math.max(1200,Math.min(9500,Math.round(w*h/145)));
      if(count!==lastCount){blades.geometry.dispose();blades.geometry=makeBlades(count);lastCount=count;host.dataset.grassBlades=String(count);}
      meadowCat?.resize(w,h);
      dirty=true;
    }
    new ResizeObserver(resize).observe(host);resize();
    if(stage)new MutationObserver(()=>dirty=true).observe(stage,{attributes:true,attributeFilter:['data-motion']});
    addEventListener('storage',()=>dirty=true);
    document.addEventListener('pointermove',event=>{if(!enabled())return;uniforms.uPointer.value.set(event.clientX/host.clientWidth,1-event.clientY/host.clientHeight);dirty=true;},{passive:true});
    document.addEventListener('pointerleave',()=>{uniforms.uPointer.value.set(-10,-10);dirty=true;});
    host.dataset.grassEngine='webgl';host.dataset.windMode='gusts-and-blades';
    function draw(now){
      if(!host.isConnected){meadowCat?.dispose();texture.dispose();geometry.dispose();material.dispose();blades.geometry.dispose();bladeMaterial.dispose();renderer.dispose();return;}
      requestAnimationFrame(draw);
      if(document.hidden){lastDraw=now;return;}
      const running=enabled();host.dataset.wind=running?'on':'off';
      if(!running&&!dirty)return;
      if(now-lastDraw<33)return;const dt=Math.min(.1,(now-lastDraw)/1000);lastDraw=now;
      if(running)time+=dt;else uniforms.uPointer.value.set(-10,-10);uniforms.uTime.value=time;
      meadowCat?.update(time);
      renderer.render(scene,camera);dirty=false;frames++;
      host.dataset.windFrame=String(frames);host.dataset.windTime=time.toFixed(2);
    }
    requestAnimationFrame(draw);
  }catch(error){canvas.remove();host.dataset.grassEngine='static';host.dataset.grassError=error?.message||'Renderer unavailable';console.warn('The meadow animation could not start; the photographic background remains visible.',error);}
}
