const embedded=document.documentElement.classList.contains('is-embedded');
const isHome=document.body.classList.contains('page-home');
const panel=document.getElementById('page-panel');
const frame=document.getElementById('page-panel-frame');
const pages={reading:['2026 年度书单','2026 reading list'],photography:['摄影作品','Photography'],experience:['工作经历','Experience'],contact:['联系方式','Contact'],projects:['微信小程序项目','WeChat mini programs'],skills:['技能与实践','Skills & practice'],xplugins:['X 的插件制作','Extensions for X']};
const english=()=>document.documentElement.lang==='en';
const caseStudyPages=['projects','skills','xplugins'];
const pageKey=href=>{const url=new URL(href,location.href);if(url.origin!==location.origin)return null;return Object.keys(pages).find(key=>url.pathname.endsWith('/'+key+'.html'));};
let opener=null,currentPage=null;
function translate(){
  document.querySelectorAll('[data-unified-zh]').forEach(node=>node.textContent=english()?node.dataset.unifiedEn:node.dataset.unifiedZh);
  if(panel){panel.querySelector('h2').textContent=currentPage?pages[currentPage][english()?1:0]:'';frame.title=currentPage?pages[currentPage][english()?1:0]:'';panel.querySelector('button').setAttribute('aria-label',english()?'Close, return home':'退出，回到首页');}
}
function closePanel(){
  if(!panel?.open)return;
  panel.close();
  const url=new URL(location.href);url.searchParams.delete('panel');history.replaceState(null,'',url);
}
function showPanel(key,href,push=true){
  if(key==='contact'&&isHome&&document.getElementById('contact')){
    closePanel();
    const contactURL=new URL(location.href);contactURL.searchParams.delete('panel');contactURL.hash='contact';history.replaceState(null,'',contactURL);
    document.getElementById('contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
    document.getElementById('contact').focus({preventScroll:true});
    return;
  }
  if(!pages[key]||!panel)return;
  opener=document.activeElement;
  document.querySelectorAll('dialog[open]').forEach(dialog=>{if(dialog!==panel)dialog.close();});
  currentPage=key;panel.dataset.page=key;panel.toggleAttribute('data-case-study',caseStudyPages.includes(key));translate();
  const url=new URL(href,location.href);url.searchParams.set('panel','1');
  const readingVersion=document.querySelector('[data-reading-version]')?.dataset.readingVersion;
  if(key==='reading'&&readingVersion)url.searchParams.set('v',readingVersion);
  frame.src=url.href;
  if(!panel.open)panel.showModal();
  if(push){const parentURL=new URL(location.href);parentURL.searchParams.set('panel',key);history.pushState({portfolioPanel:true},'',parentURL);}
  (caseStudyPages.includes(key)?frame:panel.querySelector('button')).focus({preventScroll:true});
}
function route(href){
  const url=new URL(href,location.href);
  const key=pageKey(href);
  if(embedded){parent.postMessage({type:'chen:page',href:url.href},location.origin);return true;}
  if(isHome&&key){showPanel(key,url.href);return true;}
  if(isHome&&(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/'))){
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    const target=document.getElementById(url.hash.slice(1)||'top');
    if(target){history.replaceState(null,'',url.pathname+url.search+url.hash);target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});if(url.hash==='#contact')target.focus({preventScroll:true});return true;}
  }
  return false;
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin)return;
  // Journey stations open their page after the cat arrives. Let that handler own the click.
  if(isHome&&link.closest('[data-journey-station]'))return;
  if(link.hasAttribute('data-page-exit')){if(embedded){event.preventDefault();parent.postMessage({type:'chen:close'},location.origin);}return;}
  // Month anchors stay inside the reading panel.
  if(embedded&&url.pathname===location.pathname&&url.hash){
    const target=document.getElementById(url.hash.slice(1));
    if(target){event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});history.replaceState(null,'',url);}
    return;
  }
  if(route(link.href)){if(isHome&&pageKey(link.href))opener=link;event.preventDefault();}
},true);
document.addEventListener('portfolio-open-page',event=>{if(route(event.detail.href))event.preventDefault();});
document.addEventListener('portfolio-language-change',()=>{translate();if(panel?.open)frame.contentWindow?.postMessage({type:'chen:language',en:english()},location.origin);});
if(embedded){
  document.addEventListener('portfolio-language-change',()=>parent.postMessage({type:'chen:language-change',en:english()},location.origin));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]'))parent.postMessage({type:'chen:close'},location.origin);});
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='chen:language')return;if(english()!==event.data.en)document.querySelector('[data-language-toggle]')?.click();});
}else if(panel){
  panel.querySelector('[data-panel-close]').addEventListener('click',closePanel);
  panel.addEventListener('cancel',event=>{event.preventDefault();closePanel();});
  panel.addEventListener('close',()=>{if(panel.open)return;frame.removeAttribute('src');delete panel.dataset.page;panel.removeAttribute('data-case-study');currentPage=null;opener?.focus({preventScroll:true});});
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePanel();}});
  panel.addEventListener('click',event=>{if(event.target===panel){const box=panel.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)closePanel();}});
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
    if(event.data?.type==='chen:close')closePanel();
    if(event.data?.type==='chen:language-change'&&typeof event.data.en==='boolean'&&english()!==event.data.en)document.querySelector('[data-language-toggle]')?.click();
    if(event.data?.type==='chen:page'&&typeof event.data.href==='string'){
      const url=new URL(event.data.href,location.href),key=pageKey(url.href);
      if(url.origin!==location.origin)return;
      if(key)showPanel(key,url.href,false);
      else{closePanel();document.getElementById(url.hash.slice(1)||'top')?.scrollIntoView();}
    }
  });
  addEventListener('popstate',()=>{const key=new URL(location.href).searchParams.get('panel');if(pages[key])showPanel(key,key+'.html',false);else if(panel.open)panel.close();});
  const initial=new URL(location.href).searchParams.get('panel');if(pages[initial])showPanel(initial,initial+'.html',false);
}
translate();
