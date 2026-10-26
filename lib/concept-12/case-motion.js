// Scoped case-study motion: no document-level scroll trapping or wheel hijacking.
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
export function mountCaseExperience(host,staticMotion=false) {
 const root=host.querySelector('.view.is-current [data-case-experience]');
 if(!root)return ()=>{};
 const opening=root.querySelector('[data-case-opening]');
 const narrative=root.querySelector('[data-case-narrative]');
 const track=root.querySelector('[data-case-track]');
 const chapters=[...root.querySelectorAll('[data-case-chapter]')];
 const firstHeading=root.querySelector('.case-opening-first .case-primary-heading');
 const secondHeading=root.querySelector('.case-opening-second .case-primary-heading');
 const secondCopy=root.querySelector('.case-opening-second .case-scene-copy');
 const firstImage=root.querySelector('.case-opening-first > img');
 const secondImage=root.querySelector('.case-opening-second > img');
 const gallery=root.querySelector('[data-case-gallery]');
 const thumbs=[...root.querySelectorAll('[data-case-image]')];
 const lightbox=root.parentElement.querySelector('[data-case-lightbox]');
 const lightboxImage=lightbox?.querySelector('[data-case-lightbox-image]');
 const lightboxCaption=lightbox?.querySelector('[data-case-lightbox-caption]');
 const lightboxCount=lightbox?.querySelector('[data-case-lightbox-count]');
 const photoCredit=lightbox?.querySelector('[data-case-photo-credit]');
 const cleanups=[];
 const on=(target,event,fn,opts)=>{if(!target)return;target.addEventListener(event,fn,opts);cleanups.push(()=>target.removeEventListener(event,fn,opts));};
 let raf=0,lightboxIndex=0,restoreFocus=null,drag=null,suppressClick=false;
 const setLightbox=index=>{
   lightboxIndex=(index+thumbs.length)%thumbs.length;
   const thumbnail=thumbs[lightboxIndex]?.querySelector('img');
   if(!thumbnail)return;
   lightboxImage.src=thumbnail.currentSrc||thumbnail.src;
   lightboxImage.alt=thumbnail.alt||'Event photograph';
   lightboxCaption.textContent=thumbnail.alt||'Event photograph';
   lightboxCount.textContent=String(lightboxIndex+1).padStart(2,'0')+' / '+String(thumbs.length).padStart(2,'0');
   if(photoCredit)photoCredit.hidden=!thumbnail.src.includes('commons.wikimedia.org');
 };
 const close=()=>{
   if(!lightbox||lightbox.hidden)return;
   lightbox.hidden=true;
   document.body.classList.remove('case-lightbox-open');
   restoreFocus?.focus?.({preventScroll:true});
   restoreFocus=null;
 };
 const open=index=>{
   if(!lightbox||!thumbs.length)return;
   restoreFocus=document.activeElement;
   setLightbox(index);
   lightbox.hidden=false;
   document.body.classList.add('case-lightbox-open');
   lightbox.querySelector('[data-case-close]')?.focus({preventScroll:true});
 };
 on(lightbox?.querySelector('[data-case-close]'),'click',close);
 on(lightbox?.querySelector('[data-case-lightbox-prev]'),'click',()=>setLightbox(lightboxIndex-1));
 on(lightbox?.querySelector('[data-case-lightbox-next]'),'click',()=>setLightbox(lightboxIndex+1));
 on(lightbox,'click',e=>{if(e.target===lightbox)close()});
 on(document,'keydown',e=>{
   if(lightbox?.hidden!==false)return;
   if(e.key==='Escape'){e.preventDefault();close();}
   else if(e.key==='ArrowLeft'){e.preventDefault();setLightbox(lightboxIndex-1);}
   else if(e.key==='ArrowRight'){e.preventDefault();setLightbox(lightboxIndex+1);}
   else if(e.key==='Tab'){
     const buttons=[...lightbox.querySelectorAll('button')];
     const first=buttons[0],last=buttons[buttons.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
 });
 on(gallery,'click',e=>{
   const card=e.target.closest('[data-case-image]');
   if(!card||suppressClick){e.preventDefault();e.stopPropagation();return;}
   open(Number(card.dataset.caseImage));
 });
 on(gallery,'pointerdown',e=>{
   if(e.pointerType==='touch'||e.button!==0)return; // Touch uses native horizontal scrolling.
   drag={id:e.pointerId,x:e.clientX,left:gallery.scrollLeft,moved:false};
 });
 on(gallery,'pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const dx=e.clientX-drag.x;
   if(Math.abs(dx)>6)drag.moved=true;
   if(drag.moved){
     if(!gallery.hasPointerCapture(e.pointerId))gallery.setPointerCapture(e.pointerId);
     gallery.classList.add('is-dragging');
     gallery.scrollLeft=drag.left-dx;
   }
 });
 const finish=e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const moved=drag.moved;
   drag=null;gallery.classList.remove('is-dragging');
   if(gallery.hasPointerCapture(e.pointerId))gallery.releasePointerCapture(e.pointerId);
   if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false},90);}
 };
 on(gallery,'pointerup',finish);on(gallery,'pointercancel',finish);
 const slide=dir=>{if(!gallery)return;gallery.scrollBy({left:dir*(thumbs[0]?.clientWidth||320)+dir*14,behavior:'smooth'});};
 on(gallery,'keydown',e=>{
   if(e.target!==gallery)return;
   if(e.key==='ArrowRight'){e.preventDefault();slide(1);}
   if(e.key==='ArrowLeft'){e.preventDefault();slide(-1);}
 });
 const reduced=staticMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Same homepage block-swipe animation for every heading shown over photography.
 firstHeading?.classList.add('is-revealed');
 if(reduced)secondHeading?.classList.add('is-revealed');
 if(!reduced&&opening&&narrative&&track&&chapters.length===3){
   const update=()=>{
     raf=0;
     const vh=Math.max(1,window.innerHeight);
     const o=opening.getBoundingClientRect();
     const op=clamp(-o.top/Math.max(1,o.height-vh));
     track.style.transform='translate3d('+(-op*50)+'%,0,0)';
     const reveal=clamp((op-.43)/.35);
     secondHeading?.classList.toggle('is-revealed',op>.47);
     if(secondCopy){secondCopy.style.opacity=String(reveal);secondCopy.style.transform='translate3d(0,'+((1-reveal)*42)+'px,0)';}
     if(firstImage)firstImage.style.transform='scale('+(1.035+op*.085)+')';
     if(secondImage)secondImage.style.transform='scale('+(1.12-op*.08)+')';
     // On phones and short screens, all expanded chapter copy and collages
     // remain in natural document flow. Desktop keeps the pinned story.
     const flow=window.innerWidth<=800 || vh<690;
     root.dataset.caseFlow=flow?'true':'false';
     if(flow){
       chapters.forEach(ch=>{
         ch.style.removeProperty('opacity');
         ch.style.removeProperty('visibility');
         ch.style.removeProperty('transform');
         ch.style.removeProperty('pointer-events');
         ch.setAttribute('aria-hidden','false');
         if('inert' in ch)ch.inert=false;
       });
     }else{
       const n=narrative.getBoundingClientRect();
       const t=clamp(-n.top/Math.max(1,n.height-vh));
       const visibility=[
         clamp((.36-t)/.09),
         clamp((t-.27)/.09)*clamp((.70-t)/.09),
         clamp((t-.61)/.09),
       ];
       const active=t<.315?0:t<.655?1:2;
       chapters.forEach((ch,i)=>{
         const alpha=visibility[i];
         ch.style.opacity=String(alpha);
         ch.style.visibility=alpha>.02?'visible':'hidden';
         ch.style.transform='translate3d(0,'+((1-alpha)*36)+'px,0)';
         ch.style.pointerEvents=i===active?'auto':'none';
         ch.setAttribute('aria-hidden',i===active?'false':'true');
         if('inert' in ch)ch.inert=i!==active;
       });
     }

   };
   const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};
   root.dataset.caseReady='true';
   on(window,'scroll',schedule,{passive:true});
   on(window,'resize',schedule,{passive:true});
   update();
 }
 return ()=>{
   if(raf)cancelAnimationFrame(raf);
   close();
   cleanups.reverse().forEach(fn=>fn());
   root.removeAttribute('data-case-ready');
   root.removeAttribute('data-case-flow');
 };
}
