import { mountCaseGallery } from "./case-gallery";
// Scoped case-study motion: no document-level scroll trapping or wheel hijacking.
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
// Smooth scroll-linked opacity ramps without overlapping chapter copy.
const easeFade=(position,start,end)=>{const t=clamp((position-start)/(end-start));return t*t*(3-2*t);};
export function mountCaseExperience(host,staticMotion=false) {
 const root=host.querySelector('.view.is-current [data-case-experience]');
 if(!root)return ()=>{};
 const opening=root.querySelector('[data-case-opening]');
 const narrative=root.querySelector('[data-case-narrative]');
 const track=root.querySelector('[data-case-track]');
 const chapters=[...root.querySelectorAll('[data-case-chapter]')];
 const storyImages=[...root.querySelectorAll('[data-case-story-image]')];
 let scheduleStory=()=>{},shownChapter=0,wasWaiting=false,catchup=null;
 let lastText=[1,0,0],lastPhotos=[1,0,0];
 const photoReady=storyImages.map(layer=>!layer.querySelector('img'));
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
 let raf=0,lightboxIndex=0,restoreFocus=null,disposed=false;
 // Measure actual visual lines, including custom Studio copy and resized fonts.
 // Raw server text remains readable without JS; no template-specific wording.
 let updateFlow=()=>{};
 const lineSignatures=new WeakMap();
 const layoutHeadings=(force=false)=>{
   root.querySelectorAll('[data-case-heading]').forEach(heading=>{
     const text=heading.dataset.caseHeading;
     const style=getComputedStyle(heading);
     const signature=[text,heading.clientWidth,style.fontFamily,style.fontSize,style.fontWeight,style.lineHeight,style.letterSpacing].join('|');
     if((!force&&lineSignatures.get(heading)===signature)||!heading.clientWidth)return;
     lineSignatures.set(heading,signature);
     const measure=document.createElement('span');measure.className='case-heading-measure';
     const words=text.trim().split(/\s+/);
     words.forEach((word,i)=>{
       const span=document.createElement('span');span.textContent=word;
       measure.append(span);if(i<words.length-1)measure.append(' ');
     });
     heading.replaceChildren(measure);
     const lines=[];let top=-Infinity;
     [...measure.children].forEach(word=>{
       const y=word.getBoundingClientRect().top;
       if(Math.abs(y-top)>2){lines.push([]);top=y;}
       lines[lines.length-1].push(word.textContent);
     });
     const photo=heading.classList.contains('case-primary-heading');
     heading.replaceChildren(...lines.map((words,i)=>{
       const line=document.createElement('span');
       line.className=(photo?'wipe-line':'case-heading-line')+(i?' case-heading-accent':'');
       const content=document.createElement('span');
       const value=words.join(' ');
       content.textContent=value;
       if(value.endsWith('.')){
         content.textContent=value.slice(0,-1);
         const period=document.createElement('span');period.className='case-heading-period';period.textContent='.';content.append(period);
       }
       if(i<lines.length-1)content.append(' ');
       line.append(content);
       return line;
     }));
   });
   updateFlow();
 };
 layoutHeadings();
 document.fonts?.ready.then(()=>{if(!disposed)layoutHeadings(true)});
 const resizeObserver=new ResizeObserver(()=>{if(!disposed)layoutHeadings()});
 resizeObserver.observe(root);
 cleanups.push(()=>resizeObserver.disconnect());
 storyImages.forEach((layer,i)=>{
   const image=layer.querySelector('img');if(!image)return;
   const ready=()=>{
     Promise.resolve(image.decode?.()).catch(()=>{}).then(()=>{
       if(disposed)return;
       photoReady[i]=true;layer.classList.toggle('is-unavailable',!image.naturalWidth);scheduleStory();
     });
   };
   on(image,'load',ready);
   on(image,'error',()=>{photoReady[i]=true;layer.classList.add('is-unavailable');scheduleStory()});
   if(image.complete)ready();
 });
 const setLightbox=index=>{
   lightboxIndex=(index+thumbs.length)%thumbs.length;
   const thumbnail=thumbs[lightboxIndex]?.querySelector('img');
   if(!thumbnail)return;
   lightboxImage.src=thumbnail.currentSrc||thumbnail.src;
   lightboxImage.alt=thumbnail.alt||'Event photograph';
   lightboxCaption.textContent=thumbnail.alt||'Event photograph';
   lightboxCount.textContent=String(lightboxIndex+1).padStart(2,'0')+' / '+String(thumbs.length).padStart(2,'0');
   if(photoCredit){
     const card=thumbs[lightboxIndex];
     photoCredit.replaceChildren();
     const credit=card.dataset.photoCredit,href=card.dataset.photoCreditHref;
     photoCredit.hidden=!credit;
     if(credit){
       const author=document.createElement(href&&href!=='#'?'a':'span');author.textContent=credit;
       if(author.tagName==='A'){author.href=href;author.target='_blank';author.rel='noopener noreferrer';}
       photoCredit.append(author);
       if(card.dataset.photoLicense){
         const license=document.createElement(card.dataset.photoLicenseHref&&card.dataset.photoLicenseHref!=='#'?'a':'span');
         license.textContent=card.dataset.photoLicense;
         if(license.tagName==='A'){license.href=card.dataset.photoLicenseHref;license.target='_blank';license.rel='noopener noreferrer';}
         photoCredit.append(' · ',license);
       }
     }
   }
 };
 const background=[...host.children].filter(el=>!el.contains(lightbox));
 const priorInert=new Map();
 const close=()=>{
   if(!lightbox)return;
   if(lightbox.hidden&&!priorInert.size)return;
   lightbox.hidden=true;
   document.body.classList.remove('case-lightbox-open');
   priorInert.forEach((value,element)=>element.inert=value);priorInert.clear();
   restoreFocus?.focus?.({preventScroll:true});
   restoreFocus=null;
 };
 const open=index=>{
   if(!lightbox||!thumbs.length)return;
   restoreFocus=thumbs[index]||document.activeElement;
   setLightbox(index);
   lightbox.hidden=false;
   [...background,root].forEach(el=>{priorInert.set(el,el.inert);el.inert=true});
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
     const buttons=[...lightbox.querySelectorAll('button,a[href]')].filter(el=>el.getClientRects().length);
     const first=buttons[0],last=buttons[buttons.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
 });
 const smallViewport=window.matchMedia('(max-width: 800px)');
 let copyOverflow=chapters.map(()=>0);
 const reduced=staticMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 updateFlow=()=>{
   const stage=root.querySelector('.case-narrative-stage');
   if(!stage)return;
   const style=getComputedStyle(root);
   const flowing=reduced||smallViewport.matches;
   root.toggleAttribute('data-case-flow',flowing);
   const available=Math.max(1,innerHeight-parseFloat(style.getPropertyValue('--header-height'))-parseFloat(style.getPropertyValue('--case-stage-inset'))-parseFloat(style.getPropertyValue('--case-stage-bottom')));
   const heights=chapters.map(ch=>ch.querySelector('.case-chapter-copy')?.scrollHeight||0);
   const longest=Math.max(...heights);
   copyOverflow=heights.map(height=>Math.max(0,height-available));
   root.style.setProperty('--case-copy-top',Math.max(0,(available-longest)/2)+'px');
   // Native page travel reads oversized copy inside the same pinned state.
   // Four times the longest overflow gives each act enough physical reading distance.
   root.style.setProperty('--case-story-extra',flowing?'0px':Math.max(...copyOverflow)*4+'px');
   scheduleStory();
 };
 updateFlow();
 cleanups.push(mountCaseGallery(gallery,{thumbs,onOpen:open,reduced}));
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
     firstHeading?.classList.toggle('is-revealed',op<.53);
     secondHeading?.classList.toggle('is-revealed',op>.47);
     // The frame moves horizontally; captions have no secondary rise or fade.
     if(secondCopy){secondCopy.style.opacity='1';secondCopy.style.transform='none';}
     if(firstImage)firstImage.style.transform='scale('+(1.035+op*.085)+')';
     if(secondImage)secondImage.style.transform='scale('+(1.12-op*.08)+')';
     const n=narrative.getBoundingClientRect();
     const t=clamp(-n.top/Math.max(1,n.height-vh));
     // Gentle scroll-linked text hand-off: longer eased ramps, with each
     // chapter fully faded before the next appears (no double-exposed text).
     let visibility=[
       1-easeFade(t,.235,.315),
       easeFade(t,.315,.395)*(1-easeFade(t,.575,.655)),
       easeFade(t,.655,.735),
     ];
     let active=t<.315?0:t<.655?1:2;
     const flowing=root.hasAttribute('data-case-flow');
     const incoming=t<.235?0:t<.575?1:2;
     const waiting=!photoReady[incoming];
     if(waiting&&!flowing){
       active=shownChapter;visibility=chapters.map((_,i)=>i===active?1:0);
       wasWaiting=true;catchup=null;
     }
     // The previous opaque layer stays beneath the next one: no dark/blank dip.
     let imageAlpha=waiting?[1,shownChapter>=1?1:0,shownChapter>=2?1:0]:[1,clamp((t-.27)/.09),clamp((t-.61)/.09)];
     if(!waiting&&!flowing){
       if(wasWaiting)catchup={at:performance.now(),from:shownChapter,to:active,text:lastText.slice(),photos:lastPhotos.slice()};
       wasWaiting=false;
       if(catchup&&catchup.to!==active)catchup=null;
       if(catchup){
         const progress=clamp((performance.now()-catchup.at)/850);
         const ease=progress*progress*(3-2*progress);
         if(catchup.from!==catchup.to)visibility=visibility.map((alpha,i)=>i===catchup.from?catchup.text[i]*(1-clamp(progress*2)):alpha*clamp(progress*2-1));
         imageAlpha=imageAlpha.map((alpha,i)=>catchup.photos[i]+(alpha-catchup.photos[i])*ease);
         active=progress<.5?catchup.from:catchup.to;
         if(progress<1)scheduleStory();else catchup=null;
       }
     }else if(flowing){catchup=null;wasWaiting=false;}
     shownChapter=active;lastText=visibility.slice();lastPhotos=imageAlpha.slice();
     storyImages.forEach((image,i)=>{
       image.style.opacity=String(imageAlpha[i]);
       image.setAttribute('aria-hidden',flowing||i!==active?'true':'false');
     });
     chapters.forEach((ch,i)=>{
       const alpha=flowing?1:visibility[i];
       ch.style.opacity=String(alpha);
       ch.style.visibility=alpha>.02?'visible':'hidden';
       ch.style.transform='none';
       const reading=[clamp(t/.27),clamp((t-.36)/.25),clamp((t-.70)/.30)][i];
       const copy=ch.querySelector('.case-chapter-copy');
       if(copy)copy.style.transform=flowing?'none':'translate3d(0,'+(-copyOverflow[i]*reading)+'px,0)';
       ch.style.pointerEvents=flowing||i===active?'auto':'none';
       ch.setAttribute('aria-hidden',flowing||i===active?'false':'true');
       if('inert' in ch)ch.inert=!flowing&&i!==active;
     });

   };
   const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};
   scheduleStory=schedule;
   root.dataset.caseReady='true';
   updateFlow();
   on(window,'scroll',schedule,{passive:true});
   on(window,'resize',()=>{layoutHeadings();updateFlow();schedule()},{passive:true});
   update();
 }
 return ()=>{
   disposed=true;
   if(raf)cancelAnimationFrame(raf);
   close();
   cleanups.reverse().forEach(fn=>fn());
   root.removeAttribute('data-case-ready');
   root.removeAttribute('data-case-flow');
   root.style.removeProperty('--case-copy-top');
   root.style.removeProperty('--case-story-extra');
   storyImages.forEach(image=>{image.style.removeProperty('opacity');image.removeAttribute('aria-hidden')});
   // A live reduced-motion toggle or Studio refresh can reuse these DOM nodes.
   // Remove only styles/accessibility state owned by this motion instance.
   chapters.forEach(ch=>{
     ['opacity','visibility','transform','pointer-events'].forEach(name=>ch.style.removeProperty(name));
     ch.querySelector('.case-chapter-copy')?.style.removeProperty('transform');
     ch.removeAttribute('aria-hidden');ch.inert=false;
   });
   track?.style.removeProperty('transform');
   [firstImage,secondImage].forEach(image=>image?.style.removeProperty('transform'));
   ['opacity','transform'].forEach(name=>secondCopy?.style.removeProperty(name));
 };
}
