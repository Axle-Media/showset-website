// Circular, drag-driven gallery with gentle, visibility-aware autoplay.
// Clones remain presentation-only, and reduced-motion visitors see no autoplay.
export function mountCaseGallery(gallery,{thumbs,onOpen=()=>{},reduced=false,autoplay=true,speed=24,linkCards=false}) {
 if(!gallery)return ()=>{};
 const cleanups=[];
 const on=(target,event,fn,options)=>{target.addEventListener(event,fn,options);cleanups.push(()=>target.removeEventListener(event,fn,options))};
 let period=0,loop=false,drag=null,suppressClick=false,timer=0,animation=0,autoFrame=0,autoTime=0,signature='',disposed=false;
 let autoRemainder=0;
 let onScreen=false,pointerOver=false,hasFocus=false,interacting=false,pauseUntil=0,userPaused=false;
 const motionToggle=gallery.parentElement?.querySelector('[data-case-gallery-motion-toggle]');
 const motionLabel=motionToggle?.querySelector('[data-case-gallery-motion-label]');
 const motionIcon=motionToggle?.querySelector('[data-case-gallery-motion-icon]');
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mod=(value,size)=>((value%size)+size)%size;
 const stop=()=>{cancelAnimationFrame(animation);animation=0};
 // Advance gently only while users are actually looking at the carousel.
 // Respect hover, keyboard focus, dragging, lightbox, tab visibility and motion preferences.
 const cancelAuto=()=>{if(autoFrame)cancelAnimationFrame(autoFrame);autoFrame=0;autoTime=0;};
 const hold=(ms=2200)=>{pauseUntil=performance.now()+ms;};
 const tick=time=>{
   autoFrame=0;
   if(disposed||!loop||!onScreen||document.hidden||!autoplay||reduced||userPaused||motionPreference.matches)return;
   const elapsed=autoTime?Math.min(time-autoTime,48):0;
   autoTime=time;
   if(!pointerOver&&!hasFocus&&!interacting&&!drag&&
      !document.body.classList.contains('case-lightbox-open')&&time>=pauseUntil&&elapsed>0){
     // Retain subpixel travel: browsers may round scrollLeft at 24px/s.
     autoRemainder+=elapsed*(speed/1000);
     const pixels=Math.floor(autoRemainder);
     gallery.scrollLeft+=pixels;autoRemainder-=pixels;
     normalize();
   }
   autoFrame=requestAnimationFrame(tick);
 };
 const startAuto=()=>{
   if(disposed||autoFrame||!loop||!onScreen||document.hidden||!autoplay||reduced||userPaused||motionPreference.matches)return;
   autoTime=0;
   autoFrame=requestAnimationFrame(tick);
 };
 const refreshAuto=()=>{
   if(motionToggle)motionToggle.hidden=!loop||!autoplay||reduced||motionPreference.matches;
   if(!loop||!onScreen||document.hidden||motionPreference.matches||userPaused)cancelAuto();
   else startAuto();
 };
 const reflectPause=()=>{
   if(!motionToggle)return;
   motionToggle.setAttribute('aria-pressed',String(userPaused));
   motionToggle.setAttribute('aria-label',userPaused?'Resume automatic carousel movement':'Pause automatic carousel movement');
   if(motionLabel)motionLabel.textContent=userPaused?'Play':'Pause';
   if(motionIcon)motionIcon.textContent=userPaused?'▶':'Ⅱ';
 };
 if(motionToggle)on(motionToggle,'click',()=>{
   userPaused=!userPaused;
   reflectPause();
   hold(400);
   refreshAuto();
 });
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
  // Portfolio originals are links, so their visual clones must also be
  // clickable links. They stay hidden from keyboard and assistive technology.
  const el=document.createElement(linkCards&&card.matches('a[href]')?'a':'div');
  el.className=card.className.replace(/\bis-active\b/g,'').trim()+' case-gallery-clone';
  el.dataset.caseSource=String(index);el.dataset.caseImageId=card.dataset.caseImageId;
  if(linkCards&&el.tagName==='A')el.setAttribute('href',card.getAttribute('href'));
  el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1');
  el.innerHTML=card.innerHTML;
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
  // scrollLeft is in layout pixels; bounding rectangles include ancestor transforms.
  period=thumbs.reduce((sum,el)=>sum+el.offsetWidth+gap,0);
  loop=thumbs.length>1&&period>gallery.clientWidth+1;
  gallery.classList.toggle('is-looping',loop);gallery.dataset.caseLoop=String(loop);
  if(loop){
   const before=document.createDocumentFragment(),after=document.createDocumentFragment();
   thumbs.forEach((el,i)=>{before.append(clone(el,i));after.append(clone(el,i))});
   gallery.prepend(before);gallery.append(after);gallery.scrollLeft=period+phase*period;
  }else gallery.scrollLeft=0;
  refreshAuto();
 };
 rebuild();
 const observer=new ResizeObserver(rebuild);observer.observe(gallery);cleanups.push(()=>observer.disconnect());
 on(gallery,'scroll',normalize,{passive:true});
 // A bounded observer avoids running frames for off-screen carousels.
 const visibilityObserver=new IntersectionObserver(entries=>{
   onScreen=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>.05);
   refreshAuto();
 },{threshold:[0,.05,.25]});
 visibilityObserver.observe(gallery);
 cleanups.push(()=>visibilityObserver.disconnect());
 on(document,'visibilitychange',refreshAuto);
 on(window,'pagehide',cancelAuto);on(window,'pageshow',refreshAuto);
 const motionChanged=()=>refreshAuto();
 motionPreference.addEventListener('change',motionChanged);
 cleanups.push(()=>motionPreference.removeEventListener('change',motionChanged));
 on(gallery,'pointerenter',()=>{pointerOver=true;hold(500)});
 on(gallery,'pointerleave',()=>{pointerOver=false;hold(1100)});
 on(gallery,'focusin',()=>{hasFocus=true;hold(500)});
 on(gallery,'focusout',e=>{
   if(!gallery.contains(e.relatedTarget)){hasFocus=false;hold(1500);}
 });

 on(gallery,'wheel',()=>{stop();hold(2400)},{passive:true});
 on(gallery,'touchstart',()=>{stop();interacting=true;hold(2500)},{passive:true});
 on(gallery,'touchend',()=>{interacting=false;hold(2500)},{passive:true});
 on(gallery,'touchcancel',()=>{interacting=false;hold(2500)},{passive:true});
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
  const card=e.target.closest('[data-case-image],[data-case-source],[data-case-slide]');
  if(!card)return;
  if(suppressClick){e.preventDefault();e.stopPropagation();return}
  // On the homepage, original and cloned cards remain native links. Let
  // the application's existing route handler preserve its SVG transition.
  if(linkCards)return;
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
  disposed=true;stop();cancelAuto();clearTimeout(timer);
  if(drag&&gallery.hasPointerCapture(drag.id))gallery.releasePointerCapture(drag.id);
  cleanups.reverse().forEach(fn=>fn());
  const phase=loop&&period?mod(gallery.scrollLeft-period,period):gallery.scrollLeft;
  gallery.querySelectorAll('.case-gallery-clone').forEach(el=>el.remove());
  gallery.classList.remove('is-looping','is-dragging');delete gallery.dataset.caseLoop;
  gallery.scrollLeft=phase;
 };
}

