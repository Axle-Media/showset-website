import type { PageData, CaseExperience, CaseStoryChapter } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import { primaryChapterImage } from "./chapter-image";
import { defaultPages } from "@/lib/data";

const esc=(v:string="")=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const src=(v?:string)=>{const s=safeHref(v||"");return s==="#"?"/media/evening.webp":s;};
const img=(v:string,alt="",eager=false)=>'<img src="'+esc(src(v))+'" alt="'+esc(alt)+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+' decoding="async">';
const paras=(s:string)=>s.split(/\n\s*\n/).filter(Boolean).map(v=>"<p>"+esc(v)+"</p>").join("");

// Raw text is the accessible, server-rendered fallback. The motion module wraps
// measured visual lines after fonts load; editorial and photo headings share it.
const photoId=(value:string)=>{let hash=2166136261;for(const c of value)hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(36);};
const heading=(text:string,tag="h2",photo=false)=>'<'+tag+' class="'+(photo?'case-primary-heading block-heading':'case-editorial-heading')+'" data-case-heading="'+esc(text)+'">'+esc(text)+'</'+tag+'>';

// A 24-column canvas permits exact centring of partial rows at every breakpoint.
function partnerPositions(count:number,columns:number) {
 const rows=Math.ceil(count/columns),base=Math.floor(count/rows),extra=count%rows;
 const positions:string[]=[];let index=0;
 for(let row=0;row<rows;row++){
  const size=base+(row<extra?1:0),span=24/columns,start=(24-size*span)/2+1;
  for(let col=0;col<size;col++,index++)positions[index]=(row+1)+" / "+(start+col*span)+" / span 1 / span "+span;
 }
 return positions;
}
function partnerLayouts(count:number) {
 const desktop=count<=4?count:count===5||count===6||count===9?3:4;
 return {desktop:partnerPositions(count,desktop),tablet:partnerPositions(count,count===4?2:Math.min(3,count)),mobile:partnerPositions(count,Math.min(2,count))};
}

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
  partners:[],demo:false
 };
 return {...fallback,...page.caseExperience};
}
function chapter(c:CaseStoryChapter,i:number) {
 const photo=primaryChapterImage(c);
 const image=photo?'<figure class="case-chapter-photo">'+img(photo,c.imageAlt||c.heading+' photograph')+'</figure>':"";
 return '<article class="case-chapter" data-case-chapter="'+i+'"><div class="case-chapter-reading"><div class="case-chapter-copy"><span class="case-chapter-eyebrow">'+["THE BRIEF","THE INTENTION","THE APPROACH"][i]+'</span>'+heading(c.heading)+'<div class="case-body-copy">'+paras(c.body)+'</div></div></div>'+image+'</article>';
}
function storyVisual(chapters:CaseStoryChapter[]) {
 return '<figure class="case-story-visual" aria-label="Chapter photography">'+chapters.map((c,i)=>{
  const photo=primaryChapterImage(c);
  return '<div class="case-story-image" data-case-story-image="'+i+'" aria-hidden="'+(i!==0)+'">'+(photo?img(photo,c.imageAlt||c.heading+' photograph'):'<span class="sr-only">No chapter photograph supplied.</span>')+'</div>';
 }).join("")+'</figure>';
}

export function renderImmersiveCase(host:HTMLElement,page:PageData,catalog:Record<string,PageData>) {
 const view=host.querySelector<HTMLElement>('.view[data-view="case-study"]');if(!view)return;
 const s=storyFor(page),gallery=s.gallery.filter(p=>safeHref(p.src)!=="#").map(photo=>({
  // Old local drafts predate per-image credits. Retain the matching seed credit
  // without replacing custom copy, order, media or explicitly edited credit data.
  ...defaultPages[page.slug]?.caseExperience?.gallery.find(seed=>seed.src===photo.src),
  ...photo,
 }));
 const chapters=[s.brief,s.intention,s.approach];
 const creditAttrs=(p:CaseExperience["gallery"][number])=>' data-photo-credit="'+esc(p.credit||'')+'" data-photo-credit-href="'+esc(safeHref(p.creditHref))+'" data-photo-license="'+esc(p.license||'')+'" data-photo-license-href="'+esc(safeHref(p.licenseHref))+'"';
 const galleryMarkup=gallery.length?'<section class="case-photo-gallery section-gutter" aria-label="Event photography">'+
   heading("Explore the moments.")+
   '<div class="case-gallery-viewport" data-case-gallery role="group" aria-roledescription="carousel" aria-label="Photographs. Drag, swipe or use arrow keys" tabindex="0">'+
   gallery.map((p,j)=>'<button type="button" class="case-gallery-item" data-case-image="'+j+'" data-case-image-id="'+esc(p.id||photoId(p.src)+'-'+gallery.slice(0,j).filter(x=>x.src===p.src).length)+'"'+creditAttrs(p)+' aria-label="Enlarge photograph '+(j+1)+'">'+img(p.src,p.alt)+'<span class="case-gallery-expand" aria-hidden="true">↗</span></button>').join("")+'</div></section>':"";
 const others=Object.values(catalog).filter(p=>p.route.startsWith("/work/")&&p.route!==page.route).slice(0,2);
 const partners=s.partners||[];
 const positions=partners.length?partnerLayouts(partners.length):null;
 const partnerStyle=(i:number)=>' style="--partner-desktop:'+positions!.desktop[i]+';--partner-tablet:'+positions!.tablet[i]+';--partner-mobile:'+positions!.mobile[i]+'"';
 view.innerHTML='<div class="case-experience" data-case-experience>'+
  '<section class="case-scroll-opening" data-case-opening><div class="case-scroll-frame"><div class="case-scroll-track" data-case-track>'+
  '<article class="case-opening-scene case-opening-first">'+img(s.openingImage,s.openingTitle,true)+'<div class="case-scene-shade"></div><div class="case-scene-copy">'+heading(s.openingTitle,"h1",true)+'<p>'+esc(s.openingBody)+'</p></div></article>'+
  '<article class="case-opening-scene case-opening-second">'+img(s.secondImage,"Event story")+'<div class="case-scene-shade"></div><div class="case-scene-copy">'+heading(s.secondTitle||"This is how we made it happen.","h2",true)+'<p>'+esc(s.secondBody)+'</p></div></article>'+
  '</div></div></section>'+
  '<section class="case-scroll-narrative" data-case-narrative><div class="case-narrative-stage"><div class="case-chapter-stack">'+chapters.map((c,i)=>chapter(c,i)).join("")+storyVisual(chapters)+'</div></div></section>'+
  galleryMarkup+
  (partners.length?'<section class="case-partners section-gutter"><div class="case-partners-intro"><h2>Made possible together<span class="teal-dot">.</span></h2><p>Great experiences take great people. These are the teams behind the moment.</p></div><div class="case-partner-list">'+partners.map((p,i)=>{const part='<div class="case-partner-logo">'+img(p.logo||'/brand/showset-approved.svg',p.logo?p.name+' logo':'SHOWSET placeholder logo')+'</div><span class="case-partner-name">'+esc(p.name)+'</span><span class="case-partner-role">'+esc(p.role||"")+'</span>';const href=safeHref(p.href||"");return href==="#"?'<div class="case-partner"'+partnerStyle(i)+'>'+part+'</div>':'<a class="case-partner"'+partnerStyle(i)+' href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+part+'</a>';}).join("")+'</div></section>':"")+
  (others.length?'<section class="case-related section-gutter"><div class="case-related-heading">'+heading("More stories worth exploring.")+'<a class="understated-link" href="/our-work/">Explore our work <span aria-hidden="true">↗</span></a></div><div class="case-related-grid">'+others.map(p=>'<a class="case-related-card" href="'+esc(safeHref(p.route))+'"><div class="case-related-photo">'+img(p.sections[0]?.image||"/media/evening.webp")+'</div><div class="case-related-card-caption"><div>'+heading(p.sections[0]?.headline||p.title,"h3")+'<p>'+esc(p.sections[0]?.body||p.seo?.description||'Explore the story behind the experience.')+'</p></div><span aria-hidden="true">↗</span></div></a>').join("")+'</div></section>':"")+
  '</div><div class="case-lightbox" data-case-lightbox role="dialog" aria-modal="true" aria-label="Image viewer" hidden><button type="button" data-case-close class="case-lightbox-close" aria-label="Close image viewer">✕</button><button type="button" class="case-lightbox-nav case-lightbox-prev" data-case-lightbox-prev aria-label="Previous image">←</button><figure class="case-lightbox-figure"><img data-case-lightbox-image src="'+esc(src(gallery[0]?.src))+'" alt=""><figcaption><span data-case-lightbox-caption></span><span data-case-lightbox-count></span><span class="case-photo-credit" data-case-photo-credit hidden></span></figcaption></figure><button type="button" class="case-lightbox-nav case-lightbox-next" data-case-lightbox-next aria-label="Next image">→</button></div>';
 const original=host.querySelector<HTMLElement>("#ending");
 if(original){const cloned=original.cloneNode(true) as HTMLElement;cloned.id="case-ending";view.querySelector(".case-experience")?.append(cloned);}
}
