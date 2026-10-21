'use client';
import React,{useState,useEffect,useMemo,useRef} from 'react';
import {useRouter} from 'next/navigation';
import type {PageData,Globals,Block,BlockItem} from '@/lib/types';
import {apiEndpoint,defaultGlobals} from '@/lib/data';
import {safeHref,lines} from '@/lib/safe';

type ShellProps={initialPage:PageData;initialGlobals:Globals;editor?:boolean;onSelect?:(id:string)=>void;selectedId?:string};
function vars(g:Globals):React.CSSProperties {const t=g.theme;return {'--navy':t.navy,'--navy-dark':t.navyDark,'--blue':t.blue,'--teal':t.teal,'--sand':t.sand,'--white':t.white,'--h-track':t.headingTracking,'--b-track':t.bodyTracking,'--h-leading':String(t.headingLeading),'--b-leading':String(t.bodyLeading),'--section-space':`${t.sectionSpace}px`,'--radius':`${t.radius}px`,'--btn-height':`${t.buttonHeight}px`,'--pattern-opacity':String(t.patternOpacity),'--font-heading':t.fontHeading+', Arial, sans-serif','--font-body':t.fontBody+', Arial, sans-serif'} as React.CSSProperties;}
// A reveal must never leave essential text invisible when content or preview state changes.
function useReveal(enabled:boolean,page:PageData,editor?:boolean){
 useEffect(()=>{
  const els=[...document.querySelectorAll<HTMLElement>('.ss-reveal,.ss-soft-rise')];
  const scrollRoot=document.querySelector<HTMLElement>('.studio-stage') || null;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!enabled||reduce||typeof IntersectionObserver==='undefined'){
   els.forEach(el=>{el.classList.remove('is-pending');el.classList.add('is-visible')});
   return;
  }
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting){
    entry.target.classList.remove('is-pending');entry.target.classList.add('is-visible');observer.unobserve(entry.target);
   }})
  },{threshold:.09,root:scrollRoot,rootMargin:'0px 0px -4% 0px'});
  els.forEach(el=>{
   if(el.classList.contains('is-visible'))return;
   const rect=el.getBoundingClientRect();
   const viewport=scrollRoot?.getBoundingClientRect();
   if((viewport ? rect.top<viewport.bottom*.94 && rect.bottom>viewport.top : rect.top<window.innerHeight*.94 && rect.bottom>0)){el.classList.add('is-visible')}
   else{el.classList.add('is-pending');observer.observe(el)}
  });
  return()=>{observer.disconnect();els.forEach(el=>el.classList.remove('is-pending'))};
 },[enabled,page,editor]);
}
function useRafScene(node:React.RefObject<HTMLElement|null>,enabled:boolean,update:(el:HTMLElement,rect:DOMRect,progress:number)=>void){
 const fn=useRef(update);fn.current=update;
 useEffect(()=>{
  const el=node.current;
  if(!el || !enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame=0;const scrollRoot=el.closest<HTMLElement>('.studio-stage');
  const scroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{
   frame=0;const rect=el.getBoundingClientRect();const viewport=scrollRoot?.getBoundingClientRect();
   const height=viewport?.height||window.innerHeight;const top=rect.top-(viewport?.top||0);
   if(rect.bottom < (viewport?.top||0)-height*.1 || top > height*1.1)return;
   const max=Math.max(1,rect.height-height);
   const progress=Math.min(1,Math.max(0,-top/max));
   fn.current(el,rect,progress);
  })};
  window.addEventListener('scroll',scroll,{passive:true});scrollRoot?.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll,{passive:true});scroll();
  return()=>{window.removeEventListener('scroll',scroll);scrollRoot?.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);cancelAnimationFrame(frame)};
 },[node,enabled]);
}
const limit=(n:number)=>Math.min(1,Math.max(0,n));
function Title({section,as='h2',animate=true}:{section:Block;as?:'h1'|'h2'|'h3';animate?:boolean}){const H=as;return <H className={`ss-title ${animate&&section.reveal?'ss-circle-reveal ss-reveal':''}`}>{section.headline}{section.accent&&<><br/><span>{section.accent}</span></>}</H>}
function Para({body}:{body:string}){return <div className="ss-copy">{lines(body).map((l,i)=><p key={i}>{l}</p>)}</div>}
function Action({label,href,ghost=false}:{label?:string;href?:string;ghost?:boolean}){return label?<a className={`ss-button${ghost?' ghost':''}`} href={safeHref(href)}>{label}<span aria-hidden="true">↗</span></a>:null}
function Pattern({on}:{on:boolean}){return on?<div className="ss-pattern" aria-hidden="true"/>:null;}
function Header({g,editor}:{g:Globals;editor?:boolean}){const [open,setOpen]=useState(false);const [mobile,setMobile]=useState(false);const menu=useRef<HTMLDivElement>(null);useEffect(()=>{const outside=(e:PointerEvent)=>{const target=e.target as Node;if(menu.current&&!menu.current.contains(target))setOpen(false);if(mobile && !(target as Element).closest?.('.ss-nav-shell'))setMobile(false)};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);setMobile(false)}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key)}},[mobile]);return <header className="ss-header"><div className="ss-nav-shell"><a className="ss-wordmark" href="/" aria-label="SHOWSET home">{g.brand.wordmark}<i>.</i><small>{g.brand.tagline}</small></a><nav className={`ss-primary-nav ${mobile?'open':''}`} aria-label="Main navigation"><div className="ss-dropdown" ref={menu}><button className="ss-nav-trigger" type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>What we do <span aria-hidden="true">⌄</span></button>{open&&<div className="ss-dropdown-panel">{g.header.services.map(s=><a href={safeHref(s.href)} key={s.href} onClick={()=>{setOpen(false);setMobile(false)}}>{s.label}<span aria-hidden>↗</span></a>)}</div>}</div>{g.header.links.filter(l=>l.label.toLowerCase()!=='what we do').map(l=><a href={safeHref(l.href)} key={l.href} onClick={()=>setMobile(false)}>{l.label}</a>)}</nav><div className="ss-nav-actions"><Action label={g.header.buttonLabel} href={g.header.buttonHref}/><button type="button" className="ss-mobile-toggle" aria-label={mobile?'Close menu':'Open menu'} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?'×':'☰'}</button></div></div>{editor&&<div className="ss-editor-ribbon">Visual preview</div>}</header>}
function Footer({g}:{g:Globals}){return <footer className="ss-footer"><div className="ss-wrap ss-footer-inner"><div><a className="ss-wordmark" href="/">{g.brand.wordmark}<i>.</i><small>{g.brand.tagline}</small></a><p>{g.footer.description}</p></div><div className="ss-footer-links">{g.footer.links.map(x=><a href={safeHref(x.href)} key={x.href}>{x.label}</a>)}</div></div><div className="ss-wrap ss-footer-bottom"><span>© {new Date().getFullYear()} {g.footer.copyright}</span><span>Ideas shouldn't sit still.</span></div></footer>}
function Hero({s,compact=false,motion,scale=1.14}:{s:Block;compact?:boolean;motion:boolean;scale?:number}){
 const root=useRef<HTMLElement>(null);
 const visual=useRef<HTMLDivElement>(null);
 const photo=useRef<HTMLDivElement>(null);
 const foreground=useRef<HTMLDivElement>(null);
 const second=useRef<HTMLDivElement>(null);
 useRafScene(root,motion,(el,rect,p)=>{
  if(compact){
   const depth=limit((window.innerHeight-rect.top)/(window.innerHeight+rect.height));
   photo.current?.style.setProperty('transform',`translate3d(0,${((depth-.5)*-24).toFixed(1)}px,0) scale(${Math.max(1.05,scale).toFixed(3)})`);
   return;
  }
  const visualEl=visual.current;
  if(visualEl){
   visualEl.style.inset=`${(15*(1-p)).toFixed(3)}% ${(7.6*(1-p)).toFixed(3)}% ${(10*(1-p)).toFixed(3)}%`;
   visualEl.style.borderRadius=`${(16*(1-p)).toFixed(2)}px`;
   visualEl.style.boxShadow=`0 ${Math.round(42*(1-p))}px ${Math.round(110*(1-p))}px rgba(0,0,0,.25)`;
  }
  if(photo.current)photo.current.style.transform=`translate3d(0,${(-2.4+p*4).toFixed(2)}%,0) scale(${(Math.max(1.08,scale)-p*.11).toFixed(4)})`;
  const fade=1-limit((p-.22)/.26);const fore=foreground.current;
  if(fore){fore.style.opacity=String(fade);fore.style.transform=`translate3d(0,${(-45*limit(p/.6)).toFixed(1)}px,0)`;fore.style.pointerEvents=fade<.1?'none':'auto'}
  const enter=limit((p-.55)/.2);
  if(second.current){second.current.style.opacity=String(enter);second.current.style.transform=`translate3d(0,${(28*(1-enter)).toFixed(1)}px,0)`;second.current.style.pointerEvents=enter<.2?'none':'auto'}
 });
 const secondScene=s.items?.[0];
 const secondTitle=secondScene?.title||'An idea is a start.';
 const secondAccent=secondScene?.accent||'Let’s see what it becomes.';
 const secondBody=secondScene?.description||'We take the good part of “what if?” and turn it into something you can actually experience.';
 return <section ref={root} className={`${compact?'ss-hero ss-page-hero':'ss-hero-track'}`} aria-label={s.headline}>
  <div className={compact?'ss-page-hero-stage':'ss-hero-sticky'}>
   <div className="ss-hero-media" ref={visual} aria-hidden="true"><div className="ss-hero-photo" ref={photo} style={{backgroundImage:`linear-gradient(90deg,rgba(5,25,38,.52),rgba(5,25,38,.05) 76%),url("${s.image}")`}}/></div>
   <div className="ss-hero-glow" aria-hidden="true"/>
   <div className="ss-wrap ss-hero-content" ref={foreground}>
    <Title section={s} as="h1" animate={false}/><Para body={s.body}/>
    <div className="ss-button-group"><Action label={s.buttonLabel} href={s.buttonHref}/><Action label={s.secondaryLabel} href={s.secondaryHref} ghost/></div>
   </div>
   {!compact&&<div className="ss-wrap ss-hero-second" ref={second} aria-hidden={!motion?false:undefined}>
    <h2 className="ss-title">{secondTitle}<br/><span>{secondAccent}</span></h2><p>{secondBody}</p>
   </div>}
  </div>
 </section>;
}
function Split({s}:{s:Block}){return <section className="ss-section ss-split"><Pattern on={s.pattern}/><div className="ss-wrap ss-split-grid"><div><Title section={s}/></div><div className="ss-split-body"><Para body={s.body}/><Action label={s.buttonLabel} href={s.buttonHref} ghost/></div></div></section>}
function Story({s,motion,parallax=1}:{s:Block;motion:boolean;parallax?:number}){
 const root=useRef<HTMLElement>(null);const frames=useRef<HTMLDivElement>(null);const progressBar=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0);const count=Math.max(1,s.items.length);
 useRafScene(root,motion,(_el,_rect,p)=>{
  const idx=Math.min(count-1,Math.floor(Math.min(.999,p)*count));
  setActive(prev=>prev===idx?prev:idx);
  if(progressBar.current)progressBar.current.style.transform=`scaleX(${p})`;
  const local=p*count-idx;
  const img=frames.current?.children[idx] as HTMLElement |undefined;
  if(img)img.style.setProperty('--photo-depth',`${(1.025+Math.max(0,local)*.045*Math.max(0,parallax)).toFixed(4)}`);
 });
 const scene=s.items[active]||s.items[0];
 if(!scene)return null;
 return <section ref={root} className="ss-story-outer" style={{'--chapters':count} as React.CSSProperties}>
  <div className="ss-story-sticky">
   <div ref={frames} className="ss-story-frames" aria-hidden="true">{s.items.map((item,n)=><div key={item.id} className={`ss-story-frame ${n===active?'active':''}`} style={{backgroundImage:`linear-gradient(90deg,rgba(5,24,38,.75),rgba(6,24,35,.08)),url("${item.image||s.image}")`}}/>)}</div>
   <div className="ss-wrap ss-story-copy"><div className="ss-story-words" key={scene.id}>
    <h2 className="ss-chapter-circle">{scene.title}<br/><span>{scene.accent}</span></h2><p>{scene.description}</p>
   </div></div>
   <div className="ss-story-progress" aria-hidden="true"><div ref={progressBar}/></div>
  </div>
  <div className="ss-story-reduced" aria-label="The creative process">{s.items.map(item=><article key={item.id}><h2>{item.title} <span>{item.accent}</span></h2><p>{item.description}</p></article>)}</div>
 </section>;
}
function Services({s,motion}:{s:Block;motion:boolean}){
 const root=useRef<HTMLElement>(null);const [current,setCurrent]=useState(0);const activeRef=useRef<number|null>(null);
 const max=Math.max(1,s.items.length);
 useRafScene(root,motion,(_el,_rect,p)=>{
  if(window.matchMedia('(max-width: 800px)').matches || activeRef.current!==null)return;
  const idx=Math.min(max-1,Math.floor(Math.min(.999,p)*max));
  setCurrent(previous=>previous===idx?previous:idx);
 });
 const setHover=(n:number)=>{activeRef.current=n;setCurrent(n)};
 return <section ref={root} id="services" className="ss-services-track" style={{'--chapters':max} as React.CSSProperties}>
  <div className="ss-services-sticky ss-section"><div className="ss-wrap ss-services-layout">
   <div className="ss-services-intro"><Title section={s} animate={false}/><Para body={s.body}/></div>
   <div className="ss-services-rows">{s.items.map((item,n)=><a key={item.id} href={safeHref(item.href)} onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(n)}} onPointerLeave={()=>{activeRef.current=null}} onTouchStart={()=>setCurrent(n)} onFocus={()=>setHover(n)} onBlur={()=>{activeRef.current=null}} className={`ss-service-row ${n===current?'active':''}`} aria-label={`${item.title}: ${item.description}`}>
    <span>{item.title}</span><span aria-hidden="true">↗</span>
   </a>)}</div>
   <div className="ss-service-feature" aria-live="off">{s.items.map((item,n)=><div key={item.id} className={`ss-service-scene ${n===current?'active':''}`} aria-hidden={n!==current} style={{backgroundImage:`linear-gradient(180deg,transparent,#081c2b7a),url('${item.image}')`}}/>) }
    <div className="ss-service-feature-copy" key={s.items[current]?.id}>{s.items[current]?.description}</div>
   </div>
  </div></div>
 </section>;
}
function Work({s,g}:{s:Block;g:Globals}){
 const viewport=useRef<HTMLDivElement>(null);const rail=useRef<HTMLDivElement>(null);
 const cardCount=s.items.length;
 const [index,setIndex]=useState(0);const moving=useRef(false);const [visible,setVisible]=useState(false);
 const paused=useRef(false);const focus=useRef(false);
 const [autoplay,setAutoplay]=useState(false);
 useEffect(()=>{const target=viewport.current;if(!target||!cardCount)return;
  const observer=new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{threshold:.2});observer.observe(target);
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setAutoplay(g.motion.enabled&&!query.matches);
  sync();query.addEventListener('change',sync);
  return()=>{observer.disconnect();query.removeEventListener('change',sync)};
 },[g.motion.enabled,cardCount]);
 const position=useRef(0);
 const moveTo=(next:number,animate=true)=>{
  const track=rail.current;if(!track||!cardCount)return;
  const child=track.querySelector<HTMLElement>('.ss-case-card');if(!child)return;
  const gap=parseFloat(getComputedStyle(track).columnGap)||18;
  const step=child.getBoundingClientRect().width+gap;
  track.style.transition=animate?'transform .95s cubic-bezier(.76,0,.24,1)':'none';
  track.style.transform=`translate3d(${(-next*step).toFixed(2)}px,0,0)`;
 };
 const advance=(delta=1)=>{
  if(moving.current||!cardCount)return;
  moving.current=true;let next=position.current+delta;
  if(next<0){position.current=cardCount-1;moveTo(position.current,false);next=position.current-1;requestAnimationFrame(()=>{position.current=next;moveTo(next,true)})}
  else{position.current=next;moveTo(next,true)}
  setTimeout(()=>{
   if(position.current>=cardCount){position.current=0;moveTo(0,false)}
   setIndex(position.current%cardCount);moving.current=false;
  },1020);
 };
 useEffect(()=>{
  if(!autoplay||!visible||cardCount<2)return;
  const timer=window.setInterval(()=>{if(!paused.current&&!focus.current&&!document.hidden)advance(1)},Math.max(3,s.speed||g.motion.carouselSeconds)*1000);
  return()=>clearInterval(timer);
 },[autoplay,visible,cardCount,s.speed,g.motion.carouselSeconds]);
 useEffect(()=>{const resize=()=>moveTo(position.current,false);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[cardCount]);
 if(!cardCount)return null;
 return <section className="ss-section ss-work"><Pattern on={s.pattern}/><div className="ss-wrap">
  <div className="ss-split-grid ss-work-top"><Title section={s}/><Para body={s.body}/></div>
  <div className="ss-carousel" ref={viewport} tabIndex={0} aria-label="Creative explorations carousel" onPointerEnter={()=>paused.current=true} onPointerLeave={()=>paused.current=false} onFocusCapture={()=>focus.current=true} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))focus.current=false}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();advance(e.key==='ArrowRight'?1:-1)}else if(e.key==='Enter'&&e.target===e.currentTarget){e.preventDefault();rail.current?.querySelectorAll<HTMLAnchorElement>('.ss-case-card')[index]?.click()}}} onTouchStart={e=>{(e.currentTarget as HTMLDivElement).dataset.touchStart=String(e.touches[0]?.clientX)}} onTouchEnd={e=>{const start=Number((e.currentTarget as HTMLDivElement).dataset.touchStart);const delta=e.changedTouches[0]?.clientX-start;if(Math.abs(delta)>45)advance(delta<0?1:-1)}}>
   <div className="ss-case-rail" ref={rail}>{[...s.items,...s.items].map((item,n)=><a className="ss-case-card" key={`${item.id}-${n}`} tabIndex={n>=cardCount?-1:undefined} aria-hidden={n>=cardCount?'true':undefined} href={safeHref(item.href)}><img src={item.image} alt="" loading="lazy"/><span className="ss-case-caption"><strong>{item.title}</strong><small>{item.description}</small><b aria-hidden="true">↗</b></span></a>)}</div>
  </div>
  <div className="ss-carousel-bottom"><a className="ss-text-link" href="/our-work/">Explore our case studies <span aria-hidden="true">↗</span></a></div>
 </div></section>;
}
function DotHeadline({s}:{s:Block}){
 const lines=s.headline.split(/<br\s*\/?>/gi);
 return <h2 className="ss-dot-heading">{lines.map((line,i)=>{
  const nodes:React.ReactNode[]=[];const re=/<em>(.*?)<\/em>/gi;let m:RegExpExecArray|null;let at=0;
  while((m=re.exec(line))!==null){if(m.index>at)nodes.push(line.slice(at,m.index));nodes.push(<em key={m.index}>{m[1]}</em>);at=re.lastIndex}
  if(at<line.length)nodes.push(line.slice(at));return <span key={i} className="ss-dot-line">{nodes}</span>;
 })}</h2>
}
function Dot({s,motion}:{s:Block;motion:boolean}){
 const root=useRef<HTMLElement>(null);const stage=useRef<HTMLDivElement>(null);const circle=useRef<HTMLDivElement>(null);
 const content=useRef<HTMLDivElement>(null);
 useRafScene(root,motion,(_el,_rect,p)=>{
  const st=stage.current, c=circle.current;if(!st||!c)return;
  const w=st.clientWidth,h=st.clientHeight;
  const full=Math.hypot(w/2,h/2)+5;
  const radius=10+Math.pow(p,1.5)*(full-10);
  c.style.clipPath=`circle(${radius.toFixed(2)}px at 50% 50%)`;
  if(content.current)content.current.style.transform=`translate3d(0,${(9-p*18).toFixed(2)}px,0)`;
 });
 return <section className="ss-dot-track" ref={root}><div className="ss-dot-sticky" ref={stage}>
  <div className="ss-dot-circle" ref={circle} aria-hidden="true"/>
  <div className="ss-dot-content" ref={content}><DotHeadline s={s}/><p>{s.body||'A little unexpected. Entirely intentional.'}</p></div>
 </div></section>;
}
function Cards({s}:{s:Block}){return <section className="ss-section ss-feature-section"><Pattern on={s.pattern}/><div className="ss-wrap"><div className="ss-section-heading"><Title section={s}/><Para body={s.body}/></div><div className="ss-feature-grid">{s.items.map(x=><div className="ss-feature ss-soft-rise" key={x.id}><strong>{x.title}</strong><p>{x.description}</p></div>)}</div></div></section>}
function Accordion({s}:{s:Block}){return <section className="ss-section ss-accordion-section"><Pattern on={s.pattern}/><div className="ss-wrap ss-split-grid"><Title section={s}/><div><Para body={s.body}/><div className="ss-accordion ss-soft-rise">{s.items.map(x=><details key={x.id}><summary>{x.title}<span aria-hidden>+</span></summary><p>{x.description}</p></details>)}</div></div></div></section>}
function Visual({s,motion}:{s:Block;motion:boolean}){
 const root=useRef<HTMLElement>(null);const photo=useRef<HTMLDivElement>(null);
 useRafScene(root,motion,(_el,rect,_p)=>{
  const amount=limit((window.innerHeight-rect.top)/(window.innerHeight+rect.height));
  if(photo.current)photo.current.style.transform=`translate3d(0,${((amount-.5)*-28).toFixed(1)}px,0) scale(1.07)`;
 });
 return <section className="ss-visual" ref={root}>
  <div className="ss-visual-background" aria-hidden="true" ref={photo} style={{backgroundImage:`linear-gradient(90deg,rgba(5,25,38,.83),rgba(5,25,38,.12)),url('${s.image}')`}}/>
  <div className="ss-wrap ss-soft-rise"><Title section={s}/><Para body={s.body}/><Action label={s.buttonLabel} href={s.buttonHref}/></div>
 </section>;
}
function CTA({s}:{s:Block}){return <section className="ss-section ss-cta"><Pattern on={s.pattern}/><div className="ss-wrap ss-cta-grid"><Title section={s} animate={false}/><div><Para body={s.body}/><Action label={s.buttonLabel} href={s.buttonHref}/></div></div></section>}
function Contact({s}:{s:Block}){const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');const [open,setOpen]=useState(false);const [category,setCategory]=useState('');const pop=useRef<HTMLDivElement>(null);useEffect(()=>{const listener=(e:PointerEvent)=>{if(pop.current&&!pop.current.contains(e.target as Node))setOpen(false)};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('pointerdown',listener);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',listener);document.removeEventListener('keydown',key)}},[]);async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setStatus('sending');const form=new FormData(e.currentTarget);form.set('category',category);try{const resp=await fetch(`${apiEndpoint}?action=enquiry`,{method:'POST',body:form});if(!resp.ok)throw new Error('Failed');const d=await resp.json();setStatus(d.ok?'sent':'error')}catch{setStatus('error')}}return <section className="ss-section ss-contact"><div className="ss-wrap ss-contact-grid"><div><Title section={s}/><Para body={s.body}/></div><form onSubmit={submit} className="ss-form"><h2>{s.formTitle||'Tell us the interesting bit.'}</h2><label>Your name<input name="name" autoComplete="name" required placeholder="What should we call you?"/></label><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="Somewhere we can get back to you"/></label><label>Company or organisation<input name="company" placeholder="Optional, if there is one"/></label><div className="ss-form-select" ref={pop}><label>What are we making?</label><button aria-expanded={open} type="button" className="ss-select-button" onClick={()=>setOpen(!open)}>{category||'Choose the closest fit'}<span>⌄</span></button>{open&&<div className="ss-select-options">{s.items.map(o=><button key={o.id} type="button" onClick={()=>{setCategory(o.title);setOpen(false)}}>{o.title}</button>)}</div>}</div><label>Tell us about it<textarea name="message" required rows={5} placeholder="The idea, the challenge, the wonderfully complicated bits. Start anywhere."/></label><label>When is it happening?<input name="date" placeholder="Optional date or month"/></label><label>Rough budget<input name="budget" placeholder="Optional"/></label><div className="ss-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><button className="ss-button" disabled={status==='sending'} type="submit">{status==='sending'?'Sending...':s.buttonLabel||'Send the idea'} <span>↗</span></button><small>{s.helperText}</small>{status==='sent'&&<p role="status">And so it begins. Your message is in.</p>}{status==='error'&&<p role="alert">That did not go through. Please try again or email us directly.</p>}</form></div></section>}
// Keep the wrapper component identity stable between renders (otherwise React remounts
// every section and removes the observer-applied is-visible class).
function SectionWrap({editor,sectionId,selectedId,onSelect,children}:{editor?:boolean;sectionId:string;selectedId?:string;onSelect?:(id:string)=>void;children:React.ReactNode}){
 if(!editor)return <>{children}</>;
 return <div className={`ss-editable-section ${sectionId===selectedId?'selected':''}`} onClickCapture={e=>{if((e.target as HTMLElement).closest('a,button'))e.preventDefault();onSelect?.(sectionId)}}>{children}</div>;
}
export function PageSections({page,g,editor,onSelect,selectedId}:{page:PageData;g:Globals;editor?:boolean;onSelect?:(id:string)=>void;selectedId?:string}){return <>{page.sections.map((s)=>{let content:React.ReactNode;switch(s.type){case 'hero':case 'pagehero':content=<Hero s={s} compact={s.type==='pagehero'} motion={g.motion.enabled&&!editor} scale={g.motion.heroScale}/>;break;case 'split':content=<Split s={s}/>;break;case 'story':content=<Story s={s} motion={g.motion.enabled&&!editor} parallax={g.motion.storyParallax}/>;break;case 'services':content=<Services s={s} motion={g.motion.enabled&&!editor}/>;break;case 'work':content=<Work s={s} g={g}/>;break;case 'dot':content=<Dot s={s} motion={g.motion.enabled&&!editor}/>;break;case 'items':content=<Cards s={s}/>;break;case 'accordion':content=<Accordion s={s}/>;break;case 'visual':content=<Visual s={s} motion={g.motion.enabled&&!editor}/>;break;case 'cta':content=<CTA s={s}/>;break;case 'contact':content=<Contact s={s}/>;break;default:content=null}const custom=s.design||{};const cssVars={'--block-top':custom.spaceTop!=null?`${custom.spaceTop}px`:undefined,'--block-bottom':custom.spaceBottom!=null?`${custom.spaceBottom}px`:undefined,'--block-heading':custom.headingSize!=null?`${custom.headingSize}px`:undefined,'--block-mobile-heading':custom.mobileHeadingSize!=null?`${custom.mobileHeadingSize}px`:undefined,'--block-body':custom.bodySize!=null?`${custom.bodySize}px`:undefined,'--block-image-position':custom.imagePosition||undefined,'--block-radius':custom.radius!=null?`${custom.radius}px`:undefined} as React.CSSProperties;return <SectionWrap key={s.id} editor={editor} sectionId={s.id} selectedId={selectedId} onSelect={onSelect}><div className="ss-block-root" style={cssVars} data-heading={custom.headingSize!=null?'custom':undefined} data-body={custom.bodySize!=null?'custom':undefined} data-mobile-heading={custom.mobileHeadingSize!=null?'custom':undefined}>{content}</div></SectionWrap>})}</>}
function ReadingProgress({editor}:{editor?:boolean}){
 const bar=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(editor)return;let raf=0;
  const update=()=>{if(raf)return;raf=requestAnimationFrame(()=>{
   raf=0;const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
   if(bar.current)bar.current.style.transform=`scaleX(${Math.min(1,Math.max(0,window.scrollY/max))})`;
  })};
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});update();
  return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);cancelAnimationFrame(raf)};
 },[editor]);
 return <div className="ss-reading-progress" aria-hidden="true"><div ref={bar}/></div>;
}
export function SiteLayout({page,g,editor,onSelect,selectedId}:{page:PageData;g:Globals;editor?:boolean;onSelect?:(id:string)=>void;selectedId?:string}){
 const router=useRouter();
 const [curtain,setCurtain]=useState<'arriving'|'leaving'|'idle'>(editor?'idle':'arriving');
 const navigating=useRef(false);
 useEffect(()=>{navigating.current=false;setCurtain(editor?'idle':'arriving');if(editor)return;const t=setTimeout(()=>setCurtain('idle'),650);return()=>clearTimeout(t)},[editor,page.slug]);
 useReveal(g.motion.enabled&&g.motion.circleReveal&&!editor,page,editor);
 const onNavigate=(event:React.MouseEvent<HTMLDivElement>)=>{
  if(editor||navigating.current||!g.motion.enabled||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  const element=event.target as HTMLElement;const anchor=element.closest<HTMLAnchorElement>('a[href]');
  if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;
  let next:URL;try{next=new URL(anchor.href,location.href)}catch{return}
  if(next.origin!==location.origin)return;
  const current=new URL(location.href);
  if(next.pathname===current.pathname&&next.search===current.search)return; // same-page anchors stay native
  event.preventDefault();navigating.current=true;setCurtain('leaving');
  window.setTimeout(()=>{router.push(next.pathname+next.search+next.hash)},430);
 };
 return <div data-motion={g.motion.enabled?'on':'off'} data-circle={g.motion.circleReveal?'on':'off'} className={`ss-site ${editor?'in-editor':''}`} style={vars(g)} onClickCapture={onNavigate}>
  <div className={`ss-route-curtain ${curtain}`} aria-hidden="true"/><ReadingProgress editor={editor}/>
  <Header g={g} editor={editor}/><main><PageSections page={page} g={g} editor={editor} onSelect={onSelect} selectedId={selectedId}/></main><Footer g={g}/>
 </div>;
}
export default function SiteShell({initialPage,initialGlobals,editor,onSelect,selectedId}:ShellProps){const [page,setPage]=useState(initialPage);const [globals,setGlobals]=useState(initialGlobals);useEffect(()=>{setPage(initialPage);setGlobals(initialGlobals)},[initialPage.slug]);useEffect(()=>{if(editor)return;
    // Browser-local publish preview: strictly localhost-only; never modifies production content.
    if(typeof window!=='undefined' && ['localhost','127.0.0.1'].includes(window.location.hostname)){
      try{
        const p=localStorage.getItem('showset-preview-published-pages');
        const g=localStorage.getItem('showset-preview-published-globals');
        if(p){const pages=JSON.parse(p);if(pages[initialPage.slug]?.sections)setPage(pages[initialPage.slug])}
        if(g){const globals=JSON.parse(g);if(globals?.theme)setGlobals(globals)}
      }catch(e){console.warn('Invalid local published preview, using defaults',e)}
      return;
    }
    const abort=new AbortController();async function load(){try{const r=await fetch(`${apiEndpoint}?action=published&slug=${encodeURIComponent(initialPage.slug)}`,{signal:abort.signal,cache:'no-store'});if(!r.ok)return;const j=await r.json();if(j.page?.sections)setPage(j.page);if(j.globals?.theme)setGlobals(j.globals)}catch{}}load();return()=>abort.abort()},[editor,initialPage.slug]);return <SiteLayout page={page} g={globals} editor={editor} onSelect={onSelect} selectedId={selectedId}/>}
