// Input-driven circular gallery. No autoplay and no duplicate accessible slides.
export function mountCaseGallery(gallery,{thumbs,onOpen,reduced=false}) {
 if(!gallery)return ()=>{};
 const cleanups=[];
 const on=(target,event,fn,options)=>{target.addEventListener(event,fn,options);cleanups.push(()=>target.removeEventListener(event,fn,options))};
 let period=0,loop=false,drag=null,suppressClick=false,timer=0,animation=0,signature='',disposed=false;
 const mod=(value,size)=>((value%size)+size)%size;
 const stop=()=>{cancelAnimationFrame(animation);animation=0};
 const normalize=()=>{
  if(!loop||!period)return;
  const x=gallery.scrollLeft;
  if(x>=period&&x<period*2)return;
  const next=period+mod(x-period,period),shift=next-x;
  gallery.scrollLeft=next;
  // Keep the captured drag origin in the same coordinate space after wrapping.
  if(drag)drag.left+=shift;
 };
 const clone=(card,index)=>{
  const el=document.createElement('div');el.className=card.className+' case-gallery-clone';
  el.dataset.caseSource=String(index);el.dataset.caseImageId=card.dataset.caseImageId;
  el.setAttribute('aria-hidden','true');el.innerHTML=card.innerHTML;
  return el;
 };
 const rebuild=()=>{
  if(disposed)return;
  const gap=parseFloat(getComputedStyle(gallery).columnGap)||0;
  const nextSignature=[gallery.clientWidth,gap,...thumbs.map(el=>el.clientWidth)].join('|');
  if(signature===nextSignature)return;
  signature=nextSignature;stop();
  const phase=loop&&period?mod(gallery.scrollLeft-period,period)/period:0;
  gallery.querySelectorAll('.case-gallery-clone').forEach(el=>el.remove());
  period=thumbs.reduce((sum,el)=>sum+el.getBoundingClientRect().width+gap,0);
  loop=thumbs.length>1&&period>gallery.clientWidth+1;
  gallery.classList.toggle('is-looping',loop);gallery.dataset.caseLoop=String(loop);
  if(loop){
   const before=document.createDocumentFragment(),after=document.createDocumentFragment();
   thumbs.forEach((el,i)=>{before.append(clone(el,i));after.append(clone(el,i))});
   gallery.prepend(before);gallery.append(after);gallery.scrollLeft=period+phase*period;
  }else gallery.scrollLeft=0;
 };
 rebuild();
 const observer=new ResizeObserver(rebuild);observer.observe(gallery);cleanups.push(()=>observer.disconnect());
 on(gallery,'scroll',normalize,{passive:true});
 on(gallery,'wheel',stop,{passive:true});
 on(gallery,'touchstart',stop,{passive:true});
 on(gallery,'pointerdown',e=>{
  stop();if(e.pointerType==='touch'||e.button!==0)return;
  drag={id:e.pointerId,x:e.clientX,left:gallery.scrollLeft,moved:false};
 });
 on(gallery,'pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x;if(Math.abs(dx)>6)drag.moved=true;
  if(!drag.moved)return;
  if(!gallery.hasPointerCapture(e.pointerId))gallery.setPointerCapture(e.pointerId);
  gallery.classList.add('is-dragging');gallery.scrollLeft=drag.left-dx;normalize();
 });
 const finish=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const moved=drag.moved;drag=null;gallery.classList.remove('is-dragging');
  if(gallery.hasPointerCapture(e.pointerId))gallery.releasePointerCapture(e.pointerId);
  if(moved){suppressClick=true;clearTimeout(timer);timer=setTimeout(()=>{suppressClick=false},120)}
 };
 on(gallery,'pointerup',finish);on(gallery,'pointercancel',finish);
 on(gallery,'click',e=>{
  const card=e.target.closest('[data-case-image],[data-case-source]');
  if(!card||suppressClick){e.preventDefault();return}
  onOpen(Number(card.dataset.caseImage??card.dataset.caseSource));
 });
 on(gallery,'keydown',e=>{
  if(e.target!==gallery||!['ArrowRight','ArrowLeft'].includes(e.key))return;
  e.preventDefault();stop();
  const gap=parseFloat(getComputedStyle(gallery).columnGap)||0;
  const distance=((thumbs[0]?.clientWidth||320)+gap)*(e.key==='ArrowRight'?1:-1);
  if(reduced){gallery.scrollLeft+=distance;normalize();return}
  let start=0,previous=0;
  const step=time=>{
   if(!start)start=time;
   const t=Math.min(1,(time-start)/360),position=(1-Math.pow(1-t,3))*distance;
   gallery.scrollLeft+=position-previous;previous=position;normalize();
   animation=t<1?requestAnimationFrame(step):0;
  };
  animation=requestAnimationFrame(step);
 });
 return ()=>{
  disposed=true;stop();clearTimeout(timer);
  if(drag&&gallery.hasPointerCapture(drag.id))gallery.releasePointerCapture(drag.id);
  cleanups.reverse().forEach(fn=>fn());
  const phase=loop&&period?mod(gallery.scrollLeft-period,period):gallery.scrollLeft;
  gallery.querySelectorAll('.case-gallery-clone').forEach(el=>el.remove());
  gallery.classList.remove('is-looping','is-dragging');delete gallery.dataset.caseLoop;
  gallery.scrollLeft=phase;
 };
}

