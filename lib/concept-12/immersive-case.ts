import type { PageData, CaseExperience, CaseStoryChapter } from "@/lib/types";
import { safeHref } from "@/lib/safe";

const esc=(v:string="")=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const src=(v?:string)=>{const s=safeHref(v||"");return s==="#"?"/media/evening.webp":s;};
const img=(v:string,alt="",eager=false)=>'<img src="'+esc(src(v))+'" alt="'+esc(alt)+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+' decoding="async">';
const paras=(s:string)=>s.split(/\n\s*\n/).filter(Boolean).map(v=>"<p>"+esc(v)+"</p>").join("");

function storyFor(page:PageData):CaseExperience {
 const hero=page.sections[0], split=page.sections.find(s=>s.type==="split"), visual=page.sections.find(s=>s.type==="visual");
 const pictures=(page.projectModules||[]).filter(m=>m.kind==="image"&&m.src).map(m=>({src:m.src!,alt:m.alt||m.title}));
 const fallback:CaseExperience={
  openingTitle:hero?.headline||page.title,openingBody:hero?.body||"",openingImage:hero?.image||"/media/evening.webp",
  secondImage:visual?.image||"/media/details.webp",secondBody:"Every remarkable moment begins long before anyone arrives. Explore the thinking and the making behind the experience.",
  brief:{heading:"The brief.",body:split?.body||"It begins with understanding what matters.",images:pictures.slice(0,2).map(p=>p.src)},
  intention:{heading:"The intention.",body:page.projectModules?.find(m=>m.kind==="text")?.body||"Every moment should make people feel something.",images:[]},
  approach:{heading:"The approach.",body:page.projectModules?.filter(m=>m.kind==="text")[1]?.body||"We turn thoughtful creative into remarkable experiences.",images:[]},
  gallery:pictures.length?pictures:[{src:hero?.image||"/media/evening.webp",alt:page.title},{src:"/media/rigging.webp",alt:"Production details"},{src:"/media/details.webp",alt:"Event atmosphere"}],
  bannerImage:visual?.image||"/media/evening.webp",bannerAlt:"Event highlight",partners:[],demo:false
 };
 return {...fallback,...page.caseExperience};
}
function chapter(c:CaseStoryChapter,i:number,gallery:{src:string;alt:string}[]) {
 const photos=(c.images||[]).slice(0,2);
 const images=photos.length?'<div class="case-chapter-photos">'+photos.map((p,j)=>'<figure>'+img(p,c.heading+" photo "+(j+1))+'</figure>').join("")+'</div>':"";
 const carousel=i===2?'<div class="case-photo-gallery"><div class="case-gallery-topline"><span>Explore the moments.</span><span>Drag or swipe <span aria-hidden="true">↔</span></span></div>'+
  '<div class="case-gallery-viewport" data-case-gallery aria-label="Photograph carousel" tabindex="0">'+gallery.map((p,j)=>'<button type="button" class="case-gallery-item" data-case-image="'+j+'" aria-label="Enlarge photograph '+(j+1)+'">'+img(p.src,p.alt)+'<span class="case-gallery-expand" aria-hidden="true">↗</span></button>').join("")+'</div>'+
  '<div class="case-gallery-footer"><span data-case-gallery-count>01 / '+String(gallery.length).padStart(2,"0")+'</span><div class="case-gallery-buttons"><button type="button" data-case-gallery-prev aria-label="Previous image">←</button><button type="button" data-case-gallery-next aria-label="Next image">→</button></div></div></div>':"";
 return '<article class="case-chapter" data-case-chapter="'+i+'"><div class="case-chapter-copy"><h2>'+esc(c.heading)+'</h2><div class="case-body-copy">'+paras(c.body)+'</div></div>'+images+carousel+'</article>';
}
export function renderImmersiveCase(host:HTMLElement,page:PageData,catalog:Record<string,PageData>) {
 const view=host.querySelector<HTMLElement>('.view[data-view="case-study"]');if(!view)return;
 const s=storyFor(page),gallery=s.gallery.filter(p=>safeHref(p.src)!=="#");
 const chapters=[s.brief,s.intention,s.approach];
 const others=Object.values(catalog).filter(p=>p.route.startsWith("/work/")&&p.route!==page.route).slice(0,2);
 const partners=s.partners||[];
 view.innerHTML='<div class="case-experience" data-case-experience>'+
  '<section class="case-scroll-opening" data-case-opening><div class="case-scroll-frame"><div class="case-scroll-track" data-case-track>'+
  '<article class="case-opening-scene case-opening-first">'+img(s.openingImage,s.openingTitle,true)+'<div class="case-scene-shade"></div><div class="case-scene-copy"><h1 class="case-primary-heading">'+esc(s.openingTitle)+'</h1><p>'+esc(s.openingBody)+'</p></div></article>'+
  '<article class="case-opening-scene case-opening-second">'+img(s.secondImage,"Event story")+'<div class="case-scene-shade"></div><div class="case-scene-copy"><h2 class="case-primary-heading">This is how we made it happen<span class="teal-dot">.</span></h2><p>'+esc(s.secondBody)+'</p></div></article>'+
  '</div><div class="case-opening-indicator" aria-hidden="true"><span>01</span><div><i data-case-opening-progress></i></div><span>02</span></div></div></section>'+
  '<section class="case-scroll-narrative" data-case-narrative><div class="case-narrative-stage"><div class="case-chapter-marker" aria-hidden="true"><span data-case-chapter-label>The brief</span><span data-case-chapter-number>01 / 03</span></div><div class="case-chapter-stack">'+chapters.map((c,i)=>chapter(c,i,gallery)).join("")+'</div><div class="case-chapter-progress" aria-hidden="true"><span data-case-dot="0"></span><span data-case-dot="1"></span><span data-case-dot="2"></span></div></div></section>'+
  '<section class="case-window" data-case-window>'+img(s.bannerImage,s.bannerAlt||"Event highlight")+'<div class="case-window-shade"></div><div class="case-window-caption">The moments that stay with us<span class="teal-dot">.</span></div></section>'+
  (partners.length?'<section class="case-partners section-gutter"><div class="case-partners-intro"><h2>Made possible together<span class="teal-dot">.</span></h2><p>Great experiences take great people. These are the teams behind the moment.</p></div><div class="case-partner-list">'+partners.map(p=>{const part=(p.logo?img(p.logo,p.name):'<span class="case-partner-name">'+esc(p.name)+'</span>')+'<span class="case-partner-role">'+esc(p.role||"")+'</span>';const href=safeHref(p.href||"");return href==="#"?'<div class="case-partner">'+part+'</div>':'<a class="case-partner" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+part+'</a>';}).join("")+'</div></section>':"")+
  (others.length?'<section class="case-related section-gutter"><div class="case-related-heading"><h2>More stories worth exploring<span class="teal-dot">.</span></h2><a class="understated-link" href="/our-work/">Explore our work <span aria-hidden="true">↗</span></a></div><div class="case-related-grid">'+others.map(p=>'<a class="case-related-card" href="'+esc(safeHref(p.route))+'"><div class="case-related-photo">'+img(p.sections[0]?.image||"/media/evening.webp")+'</div><div class="case-related-card-caption"><h3>'+esc(p.sections[0]?.headline||p.title)+'</h3><span aria-hidden="true">↗</span></div></a>').join("")+'</div></section>':"")+
  (s.demo?'<p class="case-demo-disclaimer section-gutter">Fictional concept demonstration inspired by the Academy Awards. Not a SHOWSET project or a claim of involvement. Event partner names and creative process are invented for testing. Red carpet reference: <a href="https://commons.wikimedia.org/wiki/File:Red_carpet_at_81st_Academy_Awards_in_Kodak_Theatre.jpg" target="_blank" rel="noopener noreferrer">Greg Hernandez via Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>.</p>':"")+
  '</div><div class="case-lightbox" data-case-lightbox role="dialog" aria-modal="true" aria-label="Image viewer" hidden><button type="button" data-case-close class="case-lightbox-close" aria-label="Close image viewer">✕</button><button type="button" class="case-lightbox-nav case-lightbox-prev" data-case-lightbox-prev aria-label="Previous image">←</button><figure class="case-lightbox-figure"><img data-case-lightbox-image src="'+esc(src(gallery[0]?.src))+'" alt=""><figcaption><span data-case-lightbox-caption></span><span data-case-lightbox-count></span></figcaption></figure><button type="button" class="case-lightbox-nav case-lightbox-next" data-case-lightbox-next aria-label="Next image">→</button></div>';
 const original=host.querySelector<HTMLElement>("#ending");
 if(original){const cloned=original.cloneNode(true) as HTMLElement;cloned.id="case-ending";view.querySelector(".case-experience")?.append(cloned);}
}
