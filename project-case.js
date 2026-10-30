const paper=document.querySelector('.case-paper');
if(paper){
  const caseKind=document.body.dataset.casePage||'projects';
  // Reconcile an already-open older parent shell as well as a freshly loaded home.
  // This prevents duplicate close bars when only the project iframe has refreshed.
  if(document.documentElement.classList.contains('is-embedded'))try{
    const parentDoc=parent.document,parentPanel=parentDoc.getElementById('page-panel');
    if(parentPanel){
      const localStyle=document.querySelector('link[href*="project-case.css"]');
      let parentStyle=parentDoc.querySelector('link[href*="project-case.css"]');
      if(!parentStyle){parentStyle=parentDoc.createElement('link');parentStyle.rel='stylesheet';parentDoc.head.append(parentStyle);}
      if(parentStyle.href!==localStyle.href)parentStyle.href=localStyle.href;
      parentPanel.dataset.page=caseKind;parentPanel.setAttribute('data-case-study','');
      addEventListener('pagehide',()=>{if(parentPanel.dataset.page===caseKind){delete parentPanel.dataset.page;parentPanel.removeAttribute('data-case-study');}},{once:true});
    }
  }catch{}
  const chapters=[...paper.querySelectorAll('.case-chapter')],buttons=[...document.querySelectorAll('[data-case-target]')];
  const progress=document.querySelector('.case-reading-progress progress'),output=document.querySelector('.case-reading-progress output');
  let scheduled=0;
  function update(){
    const en=document.documentElement.lang==='en';
    document.querySelector('.case-index nav').setAttribute('aria-label',en?'Contents':'作品目录');
    progress.setAttribute('aria-label',en?'Reading progress':'阅读进度');paper.setAttribute('aria-label',en?'Work details':'作品介绍');
    paper.querySelectorAll('[data-miniapp-view]').forEach((button,i)=>{const name=button.dataset[en?'viewEn':'viewZh']||(en?['home','quiz','result']:['首页','答题页','结果页'])[i]||button.querySelector('img')?.alt;button.setAttribute('aria-label',en?`View ${name}`:`查看${name}大图`);});
    const max=paper.scrollHeight-paper.clientHeight,percent=max>0?Math.min(100,Math.round(paper.scrollTop/max*100)):100;
    progress.value=percent;output.textContent=percent+'%';
    const top=paper.getBoundingClientRect().top+110;
    const active=[...chapters].reverse().find(section=>section.getBoundingClientRect().top<=top)||chapters[0];
    buttons.forEach(button=>{if(button.dataset.caseTarget===active.id)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
    paper.dataset.chapter=active.id;paper.dataset.readingProgress=String(percent);
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const target=document.getElementById(button.dataset.caseTarget);
    const top=target===chapters[0]?0:paper.scrollTop+target.getBoundingClientRect().top-paper.getBoundingClientRect().top-28;
    paper.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }));
  paper.addEventListener('scroll',()=>{cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(update);},{passive:true});
  paper.querySelectorAll('img').forEach(image=>image.addEventListener('load',update));
  document.addEventListener('portfolio-language-change',update);new ResizeObserver(update).observe(paper);update();
}
