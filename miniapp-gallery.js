const viewer=document.querySelector('.miniapp-image-viewer');
if(viewer){
  const image=viewer.querySelector('img');
  document.querySelectorAll('[data-miniapp-view]').forEach(button=>button.addEventListener('click',()=>{
    const source=button.querySelector('img');image.src=source.src;image.alt=source.alt;viewer.showModal();
  }));
  viewer.querySelector('button').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();});
}
