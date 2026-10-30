// A real photographic cat lives between the meadow and its foreground grass.
// It never creates a foreground DOM sprite or follows a screen-space route.
export async function createMeadowCat({THREE,scene,uniforms,bladeMaterial,host}){
  if(!document.body.classList.contains('page-home'))return null;
  const image=await new THREE.TextureLoader().loadAsync(new URL('./assets/meadow-cat-peek.png',import.meta.url).href);
  image.colorSpace=THREE.SRGBColorSpace;
  const catUniforms={...uniforms,uCatImage:{value:image},uCatRoot:{value:new THREE.Vector2(.18,.08)},uCatSize:{value:new THREE.Vector2(.18,.2)},uCatReveal:{value:0}};
  const material=new THREE.ShaderMaterial({uniforms:catUniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:`
      uniform vec2 uCatRoot,uCatSize;varying vec2 vUv,vFieldUV;
      void main(){vUv=uv;vec2 point=uCatRoot+vec2((uv.x-.5)*uCatSize.x,uv.y*uCatSize.y);vFieldUV=point;gl_Position=vec4(point*2.-1.,0.,1.);}`,
    fragmentShader:`
      uniform sampler2D uCatImage,uMap;uniform float uCatReveal,uTime,uAspect,uTextureAspect;varying vec2 vUv,vFieldUV;
      void main(){
        // The image rises behind a fixed grass edge, rather than fading in as a sticker.
        vec2 sampleUV=vUv;float angle=sin(uTime*.68)*.023*uCatReveal;
        vec2 centred=sampleUV-vec2(.5,.44);float c=cos(angle),s=sin(angle);
        sampleUV=mat2(c,-s,s,c)*centred+vec2(.5,.44);
        sampleUV.y+=(1.-uCatReveal)*1.04;
        if(sampleUV.x<0.||sampleUV.x>1.||sampleUV.y<0.||sampleUV.y>1.)discard;
        vec4 cat=texture2D(uCatImage,sampleUV);
        // Use real bright grass tips from the same photograph as a foreground matte.
        // This avoids a regular serrated cutout edge at the bottom of the ruff.
        vec2 fit=vec2(1.);if(uAspect>uTextureAspect)fit.y=uTextureAspect/uAspect;else fit.x=uAspect/uTextureAspect;
        vec3 grass=texture2D(uMap,(vFieldUV-.5)*fit+.5).rgb;
        float grassLight=dot(grass,vec3(.2126,.7152,.0722));
        float blades=smoothstep(.12,.38,grassLight)*(1.-smoothstep(.30,.61,vUv.y));
        float reveal=smoothstep(.19,.39,vUv.y)*(1.-blades*.86);
        cat.a*=reveal*smoothstep(0.,.035,uCatReveal);
        if(cat.a<.012)discard;
        // Meadow shade and reflected green keep the white ruff inside the scene.
        cat.rgb*=vec3(.90,.94,.84)*(.91+.025*sin(uTime*.4));
        gl_FragColor=cat;
        #include <colorspace_fragment>
      }`
  });
  const geometry=new THREE.PlaneGeometry(2,2),cat=new THREE.Mesh(geometry,material);
  cat.frustumCulled=false;cat.renderOrder=.5;scene.add(cat);
  const tuft=new THREE.Mesh(new THREE.InstancedBufferGeometry(),bladeMaterial);
  tuft.frustumCulled=false;tuft.renderOrder=2;scene.add(tuft);
  const abort=new AbortController();
  let width=1,height=1,size=180,patch=null,layoutDirty=true,lastLayout=-100,lastPhase='',lastCycle=-1,disposed=false;
  const candidates=[[.18,.96],[.68,.43],[.86,.88],[.15,.53],[.88,.44],[.11,.30],[.80,.25],[.32,.88]];
  const blockers='[data-journey-station],.journey-message,.flat-curiosity,.site-header,.journey-index,.journey-topline,.journey-bottom,.work-reel,.unified-work-title,.collage-work-note,.unified-section-top,.personal-about-copy';

  function makeTuft(){
    const positions=[],indices=[],segments=7,count=90;
    for(let j=0;j<=segments;j++)positions.push(-.5,j/segments,0,.5,j/segments,0);
    for(let j=0;j<segments;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
    const roots=new Float32Array(count*2),shapes=new Float32Array(count*4);let seed=8237;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<count;i++){
      roots[i*2]=patch.x+(rand()-.5)*size*1.35/width;
      roots[i*2+1]=patch.y+(rand()-.5)*size*.13/height;
      shapes[i*4]=size*(.26+rand()*.23);shapes[i*4+1]=.65+rand()*1.05;
      shapes[i*4+2]=.55+rand()*.6;shapes[i*4+3]=rand()*Math.PI*2;
    }
    g.setAttribute('aRoot',new THREE.InstancedBufferAttribute(roots,2));g.setAttribute('aBlade',new THREE.InstancedBufferAttribute(shapes,4));g.instanceCount=count;
    tuft.geometry.dispose();tuft.geometry=g;
  }
  function choosePatch(){
    const boxes=[...document.querySelectorAll(blockers)].map(node=>node.getBoundingClientRect()).filter(box=>box.width&&box.height&&box.bottom>0&&box.top<height);
    let best=null;
    for(const [x,y]of candidates){
      const bottom=Math.min(height-8,height*y),left=width*x-size*.5,top=bottom-size;
      if(left<8||left+size>width-8||top<85)continue;
      let covered=0;
      for(const box of boxes){const w=Math.max(0,Math.min(left+size,box.right+10)-Math.max(left,box.left-10)),h=Math.max(0,Math.min(bottom,box.bottom+8)-Math.max(top,box.top-8));covered+=w*h;}
      const score=covered/(size*size);
      if(!best||score<best.score)best={x:x,y:1-bottom/height,score};
      if(score===0)break;
    }
    patch=best&&best.score<.24?best:null;cat.visible=Boolean(patch);tuft.visible=Boolean(patch);
    if(patch){catUniforms.uCatRoot.value.set(patch.x,patch.y);makeTuft();host.dataset.catAnchor=`${Math.round(patch.x*width)},${Math.round((1-patch.y)*height)}`;}
    layoutDirty=false;
  }
  function resize(w,h){
    width=w;height=h;size=w<650?Math.min(140,w*.33):Math.max(150,Math.min(190,w*.17));
    catUniforms.uCatSize.value.set(size/width,size/height);layoutDirty=true;
    // Resizing changes the field of view, so pick a patch before the next reveal.
    catUniforms.uCatReveal.value=0;choosePatch();
  }
  function update(time){
    if(disposed)return;
    if(document.querySelector('dialog[open]')){catUniforms.uCatReveal.value=0;host.dataset.catReveal='0.000';host.dataset.catState='hidden';lastPhase='hidden';return;}
    // The first visit starts with a quiet peek, then continues the hide / reveal cycle.
    const catTime=time+4,cycle=Math.floor(catTime/18),phase=catTime%18;
    if((cycle!==lastCycle||layoutDirty)&&catUniforms.uCatReveal.value<.015&&time-lastLayout>.2){choosePatch();lastCycle=cycle;lastLayout=time;}
    let reveal=0,state='hidden';
    const ease=value=>value*value*(3-2*value);
    if(phase>=2&&phase<3.6){reveal=ease((phase-2)/1.6);state='rising';}
    else if(phase>=3.6&&phase<9.3){reveal=1;state='peeking';}
    else if(phase>=9.3&&phase<10.8){reveal=1-ease((phase-9.3)/1.5);state='hiding';}
    if(!patch){reveal=0;state='no-room';}
    catUniforms.uCatReveal.value=reveal;
    if(state!==lastPhase){host.dataset.catState=state;lastPhase=state;}
    host.dataset.catReveal=reveal.toFixed(3);
  }
  addEventListener('scroll',()=>layoutDirty=true,{passive:true,signal:abort.signal});
  host.dataset.catLayer='behind-foreground-grass';host.dataset.catIdentity='user-calico';
  return {resize,update,dispose(){disposed=true;abort.abort();scene.remove(cat,tuft);image.dispose();geometry.dispose();material.dispose();tuft.geometry.dispose();}};
}
