// Native service scrolling, with state retained across same-DOM Studio refreshes.
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const p=clamp(value);return p*p*(3-2*p)};
const sessions=new WeakMap();
export function mountServiceExperience(host,staticMotion=false){
 const root=host.querySelector('.view.is-current [data-service-experience]');
 if(!root)return()=>{};
 const kind=root.dataset.serviceExperience,track=root.querySelector('[data-service-story-track]'),stage=track?.querySelector('.service-story-stage');
 const scenes=[...root.querySelectorAll('[data-service-scene]')],proofs=[...root.querySelectorAll('.service-proof')],channels=[...root.querySelectorAll('[data-service-channel]')];
 // Only photographic headings need scroll-triggered text masks.
 const heads=[...root.querySelectorAll('[data-service-reveal="photo"],[data-service-reveal="scene"]')];
 const process=[...root.querySelectorAll('.service-process li')];
 const measured=[...root.querySelectorAll('.service-work-card,.service-groups,.service-feature,.service-process,.service-close,.service-capability-group')];
 const eventCards=kind==='events'?root.querySelector('.service-expertise-grid'):null;
 const eventTriptych=kind==='events'?root.querySelector('.service-event-triptych'):null;
 const creativeCanvas=kind==='creative'?root.querySelector('[data-service-creative-canvas]'):null;
 const digitalCanvas=kind==='digital'?root.querySelector('[data-digital-connected]'):null;
 const state=sessions.get(root)||{reveals:new WeakMap(),choice:-1,choiceP:0};sessions.set(root,state);
 const cleanups=[];let raf=0,disposed=false,lastP=0,pinned=false;
 const on=(el,type,fn,options)=>{if(!el)return;el.addEventListener(type,fn,options);cleanups.push(()=>el.removeEventListener(type,fn,options))};
 const reduced=staticMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const storyStill=()=>track?.closest('[data-scene]')?.dataset.scene==='still';
 const count=scenes.length||proofs.length||channels.length;
 const selectChannel=index=>{
  channels.forEach((el,i)=>{el.dataset.channelActive=String(index===i);el.querySelector('button')?.setAttribute('aria-pressed',String(index===i))});
  stage?.style.setProperty('--channel-progress',String((index+1)/Math.max(1,count)));
 };
 const update=()=>{
  raf=0;if(disposed||!track||!stage)return;
  // Batch layout reads before applying scroll-derived visual styles.
  const r=track.getBoundingClientRect();
  const p=pinned?clamp(-r.top/Math.max(1,r.height-innerHeight)):clamp((innerHeight-r.top)/Math.max(1,r.height+innerHeight));lastP=p;
  const rects=new Map([...heads,...measured,...process].map(el=>[el,el.getBoundingClientRect()]));
  const u=p*count,base=Math.min(count-1,Math.floor(u)),blend=base===count-1?0:smooth((u-base-.64)/.36);
  const eventActive=Math.min(count-1,base+(blend>=.5?1:0));
  const film=clamp((p-.08)/.84)*(count-1),frame=Math.min(count-1,Math.round(film));
  stage.style.setProperty('--service-progress',String(p));
  stage.style.setProperty('--proof-progress',String(smooth((p-.08)/.8)));
  stage.dataset.servicePhase=r.top>0?'entering':r.bottom<innerHeight?'leaving':'active';
  if(kind==='events'&&pinned){
   scenes.forEach((el,i)=>{
    const figure=el.querySelector('figure'),copy=el.querySelector('.service-scene-copy');
    if(figure)figure.style.opacity=String(i===0?1:i<=base?1:i===base+1?blend:0);
    el.style.setProperty('--service-photo-scale',String(1.035-clamp((u-i)/1.3)*.035));
    if(copy){copy.style.opacity=String(i===eventActive?1:0);copy.style.visibility=i===eventActive?'visible':'hidden'}
    el.setAttribute('aria-hidden',String(i!==eventActive));el.inert=i!==eventActive;
   });
   const plan=root.querySelector('.service-plan');
   if(plan){plan.style.opacity=String((1-smooth((p-.18)/.3))*.52);plan.style.setProperty('--plan-progress',String(smooth(p*4)))}
  }else if(kind==='production'&&pinned){
   const rail=stage.querySelector('.service-scenes');
   if(rail)rail.style.transform='translate3d('+(-film*100)+'%,0,0)';
   stage.style.setProperty('--service-frame-progress',String((film+1)/Math.max(1,count)));
   scenes.forEach((el,i)=>{el.dataset.frameActive=String(frame===i);el.style.setProperty('--service-photo-scale',String(1+Math.min(.035,Math.abs(film-i)*.035)))});
  }
  if(kind==='digital'&&channels.length){
   if(state.choice>=0&&Math.abs(p-state.choiceP)>.12)state.choice=-1;
   selectChannel(state.choice>=0?state.choice:Math.min(count-1,Math.floor(p*count)));
  }
  for(const el of heads){
   const bounds=rects.get(el),scene=el.closest('[data-service-scene]');
   const still=reduced||el.closest('[data-scene=still],.c12-reveal-off');
   let visible=bounds.top<innerHeight*.92&&bounds.bottom>85;
   if(kind==='events'&&pinned&&scene)visible=Number(scene.dataset.serviceScene)===eventActive&&r.top<innerHeight*.8&&r.bottom>85;
   if(kind==='production'&&pinned&&scene)visible=Number(scene.dataset.serviceScene)===frame&&r.top<innerHeight*.8&&r.bottom>85;
   const photo=el.dataset.serviceReveal==='photo'||el.dataset.serviceReveal==='scene'&&pinned;
   if(still||visible){el.classList.add('is-revealed')}
   else if(photo)el.classList.remove('is-revealed');
   state.reveals.set(el,{visible});
  }
  for(const el of measured){
   const bounds=rects.get(el),still=reduced||el.dataset.scene==='still';
   const enter=still?1:smooth((innerHeight*.92-bounds.top)/Math.min(innerHeight*.65,Math.max(180,bounds.height)));
   el.style.setProperty('--service-rule-progress',String(enter));
   if(el.matches('.service-work-card'))el.style.setProperty('--service-image-progress',String(enter));
   if(el.matches('.service-close'))el.style.setProperty('--service-close-progress',String(still?.5:clamp((innerHeight-bounds.top)/(innerHeight+bounds.height))));
  }
  process.forEach(el=>{const bounds=rects.get(el),still=reduced||el.closest('[data-scene=still]');const progress=still?1:smooth((innerHeight*.88-bounds.top)/Math.min(350,Math.max(150,bounds.height)));el.style.setProperty('--process-unit',String(progress));el.dataset.processActive=String(progress>.5)});
 };
 const schedule=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(update)};
 const clearSceneState=()=>{
  scenes.forEach(el=>{el.removeAttribute('aria-hidden');el.inert=false;el.querySelector('figure')?.style.removeProperty('opacity');el.style.removeProperty('--service-photo-scale');const copy=el.querySelector('.service-scene-copy');copy?.style.removeProperty('opacity');copy?.style.removeProperty('visibility')});
  stage?.querySelector('.service-scenes')?.style.removeProperty('transform');
 };
 const measure=()=>{
  if(disposed||!track||!stage)return;
  const maxCopy=Math.max(0,...[...root.querySelectorAll('.service-scene-copy')].map(el=>[...el.children].reduce((height,child)=>{const style=getComputedStyle(child);return height+child.getBoundingClientRect().height+parseFloat(style.marginTop)+parseFloat(style.marginBottom)},0)));
  const proofHeight=Math.max(0,...proofs.map(el=>el.scrollHeight));
  const available=innerHeight-parseFloat(getComputedStyle(root).getPropertyValue('--header-height')||'78')-160;
  pinned=kind!=='events'&&kind!=='creative'&&kind!=='digital'&&!reduced&&!storyStill()&&innerWidth>800&&innerHeight>=700&&count>0&&maxCopy<available&&(kind!=='creative'||count===3&&proofHeight<available)&&(kind!=='digital'||count===3&&innerHeight>=850);
  track.dataset.servicePinned=String(pinned);
  if(pinned&&kind==='digital'){const board=stage.querySelector('.service-channel-board');if(board&&board.getBoundingClientRect().height>innerHeight-parseFloat(getComputedStyle(root).getPropertyValue('--header-height')||'78')-65){pinned=false;track.dataset.servicePinned='false'}}
  track.style.setProperty('--service-count',String(count));clearSceneState();update();
 };
 root.dataset.serviceMotion=reduced?'off':'on';
 // Events triptych is a naturally scrolling editorial section, not a pinned stage.
 // Reveal its photo strips and descriptions once when the layout enters view.
 if(eventTriptych){
  const still=eventTriptych.closest('[data-scene=still],.c12-reveal-off')||root.closest('[data-static-motion]');
  if(reduced||still||typeof IntersectionObserver!=='function'||state.triptychIntroduced){
   root.dataset.serviceTriptychIntro='done';
  }else{
   root.dataset.serviceTriptychIntro='pending';
   const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    root.dataset.serviceTriptychIntro='done';
    state.triptychIntroduced=true;
    observer.disconnect();
   },{threshold:0.04,rootMargin:'0px 0px -12% 0px'});
   observer.observe(eventTriptych);
   cleanups.push(()=>observer.disconnect());
  }
 }

 // Creative artwork enters naturally as a staggered design composition,
 // without hiding any editorial heading or trapping normal page scrolling.
 if(creativeCanvas){
  const still=creativeCanvas.closest('[data-scene=still],.c12-reveal-off')||root.closest('[data-static-motion]');
  if(reduced||still||typeof IntersectionObserver!=='function'||state.creativeIntroduced){
   root.dataset.serviceCreativeIntro='done';
  }else{
   root.dataset.serviceCreativeIntro='pending';
   const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    root.dataset.serviceCreativeIntro='done';
    state.creativeIntroduced=true;
    observer.disconnect();
   },{threshold:0.07,rootMargin:'0px 0px -10% 0px'});
   observer.observe(creativeCanvas);
   cleanups.push(()=>observer.disconnect());
  }
  const selectors=[...creativeCanvas.querySelectorAll('[data-creative-select]')];
  const select=index=>{
   state.creativeSelection=index;
   root.dataset.serviceCreativeInteracted='true';
   creativeCanvas.querySelectorAll('[data-creative-artboard]').forEach((art,i)=>{
    art.dataset.selected=String(i===index);
    art.querySelector('[data-creative-select]')?.setAttribute('aria-pressed',String(i===index));
   });
  };
  const initial=Number.isInteger(state.creativeSelection)?state.creativeSelection:1;
  creativeCanvas.querySelectorAll('[data-creative-artboard]').forEach((art,i)=>{
   art.dataset.selected=String(i===initial);
   art.querySelector('[data-creative-select]')?.setAttribute('aria-pressed',String(i===initial));
  });
  if(Number.isInteger(state.creativeSelection))root.dataset.serviceCreativeInteracted='true';
  selectors.forEach((button,i)=>{
   on(button,'click',()=>select(i));
   on(button,'keydown',event=>{
    const next=event.key==='ArrowRight'||event.key==='ArrowDown'?(i+1)%selectors.length:
      event.key==='ArrowLeft'||event.key==='ArrowUp'?(i+selectors.length-1)%selectors.length:-1;
    if(next<0)return;
    event.preventDefault();
    select(next);
    selectors[next].focus();
   });
  });
 }
 // The Digital connection illustration draws once. Editorial content never hides,
 // while pointer, click, keyboard and focus all shift network emphasis.
 if(digitalCanvas){
  const still=digitalCanvas.closest('[data-scene=still],.c12-reveal-off')||root.closest('[data-static-motion]');
  if(reduced||still||typeof IntersectionObserver!=='function'||state.digitalIntroduced){
   root.dataset.serviceDigitalIntro='done';
  }else{
   root.dataset.serviceDigitalIntro='pending';
   const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    root.dataset.serviceDigitalIntro='done';
    state.digitalIntroduced=true;
    observer.disconnect();
   },{threshold:.06,rootMargin:'0px 0px -9% 0px'});
   observer.observe(digitalCanvas);
   cleanups.push(()=>observer.disconnect());
  }
  const buttons=[...digitalCanvas.querySelectorAll('[data-digital-focus-button]')];
  const descriptions=[...digitalCanvas.querySelectorAll('[data-digital-story]')];
  const persist=Number.isInteger(state.digitalSelection)?state.digitalSelection:null;
  const apply=(index,engaged)=>{
   digitalCanvas.dataset.digitalFocus=String(index);
   digitalCanvas.dataset.digitalEngaged=String(engaged);
   buttons.forEach((btn,i)=>btn.setAttribute('aria-pressed',String(i===index)));
   descriptions.forEach((el,i)=>el.dataset.digitalActive=String(i===index));
  };
  const hover=index=>apply(index,true);
  const restore=()=>{
   const chosen=Number.isInteger(state.digitalSelection)?state.digitalSelection:0;
   apply(chosen,Number.isInteger(state.digitalSelection));
  };
  apply(persist===null?0:persist,persist!==null);
  buttons.forEach((btn,i)=>{
   on(btn,'click',()=>{state.digitalSelection=i;apply(i,true)});
   on(btn,'mouseenter',()=>hover(i));
   on(btn,'focus',()=>hover(i));
   on(btn,'keydown',event=>{
    const next=event.key==='ArrowRight'||event.key==='ArrowDown'?(i+1)%buttons.length:
     event.key==='ArrowLeft'||event.key==='ArrowUp'?(i+buttons.length-1)%buttons.length:-1;
    if(next>=0){event.preventDefault();buttons[next].focus()}
    if(event.key==='Escape'){event.preventDefault();state.digitalSelection=null;apply(0,false);btn.blur()}
   });
  });
  descriptions.forEach((el,i)=>on(el,'mouseenter',()=>hover(i)));
  on(digitalCanvas,'mouseleave',restore);
  on(digitalCanvas,'focusout',event=>{
   if(!digitalCanvas.contains(event.relatedTarget))restore();
  });
 }
 // Events capability cards enter once, in reading order, when the grid is visible.
 // No-JS, static/reduced motion and Studio still mode must remain immediately readable.
 if(eventCards){
  const still=eventCards.closest('[data-scene=still],.c12-reveal-off')||root.closest('[data-static-motion]');
  if(reduced||still||typeof IntersectionObserver!=='function'||state.eventCardsIntroduced){
   root.dataset.serviceCardIntro='done';
  }else{
   root.dataset.serviceCardIntro='pending';
   const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    root.dataset.serviceCardIntro='done';
    state.eventCardsIntroduced=true;
    observer.disconnect();
   },{threshold:0.08,rootMargin:'0px 0px -8% 0px'});
   observer.observe(eventCards);
   cleanups.push(()=>observer.disconnect());
  }
 }
 root.dataset.serviceReady='true';
 on(window,'scroll',schedule,{passive:true});on(window,'resize',measure,{passive:true});
 root.querySelectorAll('[data-service-channel-trigger]').forEach(button=>on(button,'click',()=>{state.choice=Number(button.dataset.serviceChannelTrigger);state.choiceP=lastP;selectChannel(state.choice)}));
 measure();document.fonts?.ready.then(()=>{if(!disposed)measure()});
 return(preserveVisualState=false)=>{disposed=true;cancelAnimationFrame(raf);cleanups.reverse().forEach(fn=>fn());if(!preserveVisualState){clearSceneState();root.removeAttribute('data-service-ready');root.removeAttribute('data-service-motion');root.removeAttribute('data-service-card-intro');root.removeAttribute('data-service-triptych-intro');root.removeAttribute('data-service-creative-intro');root.removeAttribute('data-service-creative-interacted');root.removeAttribute('data-service-digital-intro');track?.removeAttribute('data-service-pinned')}};
}
