// Service-only motion: native scrolling, deterministic progress, owned cleanup.
const clamp=v=>Math.max(0,Math.min(1,v));
export function mountServiceExperience(host,staticMotion=false){
 const root=host.querySelector('.view.is-current [data-service-experience]');if(!root)return()=>{};
 const kind=root.dataset.serviceExperience,track=root.querySelector('[data-service-story-track]'),stage=track?.querySelector('.service-story-stage');
 const scenes=[...root.querySelectorAll('[data-service-scene]')],proofs=[...root.querySelectorAll('.service-proof')],channels=[...root.querySelectorAll('[data-service-channel]')];
 const cleanups=[];let raf=0,disposed=false,lastP=0,choice=-1,choiceP=0,pinned=false;
 const on=(el,type,fn,opts)=>{if(!el)return;el.addEventListener(type,fn,opts);cleanups.push(()=>el.removeEventListener(type,fn,opts))};
 const reduced=staticMotion||track?.closest('[data-scene]')?.dataset.scene==='still'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const count=scenes.length||proofs.length||channels.length;
 const selectChannel=i=>channels.forEach((el,j)=>{el.dataset.channelActive=String(i===j);el.querySelector('button')?.setAttribute('aria-pressed',String(i===j))});
 const update=()=>{
  raf=0;if(disposed||!track||!stage)return;
  const r=track.getBoundingClientRect(),p=pinned?clamp(-r.top/Math.max(1,r.height-innerHeight)):clamp((innerHeight-r.top)/Math.max(1,r.height+innerHeight));lastP=p;
  stage.style.setProperty('--service-progress',String(p));
  if(kind==='events'&&pinned){
   const u=p*count,base=Math.min(count-1,Math.floor(u)),blend=base===count-1?0:clamp((u-base-.72)/.28),active=Math.min(count-1,base+(blend>=.5?1:0));
   scenes.forEach((el,i)=>{const fig=el.querySelector('figure'),copy=el.querySelector('.service-scene-copy');if(fig)fig.style.opacity=String(i===0?1:clamp((u-i+.28)/.28));const alpha=i===base?1-clamp(blend*2):i===base+1?clamp(blend*2-1):0;if(copy){copy.style.opacity=String(alpha);copy.style.visibility=alpha>.01?'visible':'hidden'}el.setAttribute('aria-hidden',String(i!==active));el.inert=i!==active});
   const plan=root.querySelector('.service-plan');if(plan){plan.style.opacity=String((1-clamp(p*3))*.5);plan.style.strokeDasharray='1800';plan.style.strokeDashoffset=String(1800*(1-clamp(p*5)))}
  }else if(kind==='production'&&pinned){const rail=stage.querySelector('.service-scenes');if(rail)rail.style.transform='translate3d('+(-clamp((p-.08)/.84)*(count-1)*100)+'%,0,0)'}
  if(kind==='digital'){if(choice>=0&&Math.abs(p-choiceP)>.12)choice=-1;selectChannel(choice>=0?choice:Math.min(count-1,Math.floor(p*count)))}
 };
 const schedule=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(update)};
 const clearSceneState=()=>{scenes.forEach(el=>{el.removeAttribute('aria-hidden');el.inert=false;el.querySelector('figure')?.style.removeProperty('opacity');const copy=el.querySelector('.service-scene-copy');copy?.style.removeProperty('opacity');copy?.style.removeProperty('visibility')});stage?.querySelector('.service-scenes')?.style.removeProperty('transform')};
 const measure=()=>{
  if(disposed||!track||!stage)return;
  const maxCopy=Math.max(0,...[...root.querySelectorAll('.service-scene-copy')].map(el=>[...el.children].reduce((height,child)=>{const style=getComputedStyle(child);return height+child.getBoundingClientRect().height+parseFloat(style.marginTop)+parseFloat(style.marginBottom)},0)));
  const proofHeight=Math.max(0,...proofs.map(el=>el.scrollHeight));
  const available=innerHeight-parseFloat(getComputedStyle(root).getPropertyValue('--header-height')||'78')-160;
  pinned=!reduced&&innerWidth>800&&innerHeight>=700&&count>0&&maxCopy<available&&(kind!=='creative'||count===3&&proofHeight<available)&&(kind!=='digital'||count===3&&innerHeight>=850);
  track.dataset.servicePinned=String(pinned);
  if(pinned&&kind==='digital'){const board=stage.querySelector('.service-channel-board');if(board&&board.getBoundingClientRect().height>innerHeight-parseFloat(getComputedStyle(root).getPropertyValue('--header-height')||'78')-65){pinned=false;track.dataset.servicePinned='false'}}
  track.style.setProperty('--service-count',String(count));clearSceneState();schedule();
 };
 root.dataset.serviceReady='true';
 on(window,'scroll',schedule,{passive:true});on(window,'resize',measure,{passive:true});
 root.querySelectorAll('[data-service-channel-trigger]').forEach(button=>on(button,'click',()=>{choice=Number(button.dataset.serviceChannelTrigger);choiceP=lastP;selectChannel(choice)}));
 const input=root.querySelector('#service-search-input'),details=[...root.querySelectorAll('[data-service-capability]')],status=root.querySelector('[data-service-search-status]'),empty=root.querySelector('[data-service-search-empty]');
 const normal=s=>s.toLocaleLowerCase('en-GB').normalize('NFD').replace(/\p{Diacritic}/gu,'');
 const filter=()=>{const query=normal(input?.value.trim()||'');let found=0;details.forEach(el=>{const match=normal(el.textContent).includes(query);el.hidden=!match;if(match)found++});if(status)status.textContent=found+' '+(found===1?'service':'services');if(empty)empty.hidden=found>0};
 on(input,'input',filter);on(input,'search',filter);on(root.querySelector('[data-service-search-clear]'),'click',()=>{input.value='';filter();input.focus()});filter();
 measure();document.fonts?.ready.then(()=>{if(!disposed)measure()});
 return()=>{disposed=true;cancelAnimationFrame(raf);cleanups.reverse().forEach(fn=>fn());clearSceneState();root.removeAttribute('data-service-ready');track?.removeAttribute('data-service-pinned');track?.style.removeProperty('--service-count');stage?.style.removeProperty('--service-progress');details.forEach(el=>el.hidden=false);if(empty)empty.hidden=true;root.querySelectorAll('.service-plan').forEach(el=>['opacity','stroke-dasharray','stroke-dashoffset'].forEach(k=>el.style.removeProperty(k)))};
}
