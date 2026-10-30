import type { PageData, CaseExperience, CaseStoryChapter } from "@/lib/types";
import { safeHref } from "@/lib/safe";
import { primaryChapterImage } from "./chapter-image";
import { caseExperienceFor } from "./case-content";
import { defaultPages } from "@/lib/data";

const esc=(v:string="")=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const src=(v?:string)=>{const s=safeHref(v||"");return s==="#"?"/brand/showset-approved.svg":s;};
const img=(v:string,alt="",eager=false)=>'<img src="'+esc(src(v))+'" alt="'+esc(alt)+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+' decoding="async">';
const paras=(s:string)=>s.split(/\n\s*\n/).filter(Boolean).map(v=>"<p>"+esc(v)+"</p>").join("");

// Raw text is the accessible, server-rendered fallback. The motion module wraps
// measured visual lines after fonts load; editorial and photo headings share it.
const photoId=(value:string)=>{let hash=2166136261;for(const c of value)hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(36);};
const heading=(text:string,tag="h2",photo=false)=>'<'+tag+' class="'+(photo?'case-primary-heading block-heading':'case-editorial-heading')+'" data-case-heading="'+esc(text)+'">'+esc(text)+'</'+tag+'>';

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
 const s=caseExperienceFor(page),gallery=s.gallery.filter(p=>safeHref(p.src)!=="#").map(photo=>({
  // Old local drafts predate per-image credits. Retain the matching seed credit
  // without replacing custom copy, order, media or explicitly edited credit data.
  ...defaultPages[page.slug]?.caseExperience?.gallery.find(seed=>seed.src===photo.src),
  ...photo,
 }));
 const chapters=[s.brief,s.intention,s.approach];
 const creditAttrs=(p:CaseExperience["gallery"][number])=>' data-photo-credit="'+esc(p.credit||'')+'" data-photo-credit-href="'+esc(safeHref(p.creditHref))+'" data-photo-license="'+esc(p.license||'')+'" data-photo-license-href="'+esc(safeHref(p.licenseHref))+'"';
 const galleryMarkup=gallery.length?'<section class="case-photo-gallery section-gutter" aria-label="Project imagery">'+
   '<div class="case-gallery-heading-row">'+heading("Explore the moments.")+
   '</div>'+
   '<div class="case-gallery-viewport" data-case-gallery role="group" aria-roledescription="carousel" aria-label="Photographs. Drag, swipe or use arrow keys" tabindex="0">'+
   gallery.map((p,j)=>'<button type="button" class="case-gallery-item" data-case-image="'+j+'" data-case-image-id="'+esc(p.id||photoId(p.src)+'-'+gallery.slice(0,j).filter(x=>x.src===p.src).length)+'"'+creditAttrs(p)+' aria-label="Enlarge photograph '+(j+1)+'">'+img(p.src,p.alt)+'</button>').join("")+'</div></section>':"";
 const studies=Object.values(catalog).filter(p=>p.route.startsWith("/work/"));
 const index=studies.findIndex(p=>p.route===page.route);
 const others=Array.from({length:Math.min(2,Math.max(0,studies.length-1))},(_,i)=>studies[(index+i+1)%studies.length]).filter(p=>p.route!==page.route);
 view.innerHTML='<div class="case-experience" data-case-experience>'+
  '<section class="case-scroll-opening" data-case-opening><div class="case-scroll-frame"><div class="case-scroll-track" data-case-track>'+
  '<article class="case-opening-scene case-opening-first">'+img(s.openingImage,s.openingTitle,true)+'<div class="case-scene-shade"></div><div class="case-scene-copy">'+heading(s.openingTitle,"h1",true)+'<p>'+esc(s.openingBody)+'</p></div></article>'+
  '<article class="case-opening-scene case-opening-second">'+img(s.secondImage,page.title+" project story")+'<div class="case-scene-shade"></div><div class="case-scene-copy">'+heading(s.secondTitle||"This is how we made it happen.","h2",true)+'<p>'+esc(s.secondBody)+'</p></div></article>'+
  '</div></div></section>'+
  '<section class="case-scroll-narrative" data-case-narrative><div class="case-narrative-stage"><div class="case-chapter-stack">'+chapters.map((c,i)=>chapter(c,i)).join("")+storyVisual(chapters)+'</div></div></section>'+
  galleryMarkup+
  (others.length?'<section class="case-related section-gutter"><div class="case-related-heading">'+heading("More stories worth exploring.")+'<a class="understated-link" href="/our-work/">Explore our work <span aria-hidden="true">↗</span></a></div><div class="case-related-grid">'+others.map(p=>'<a class="case-related-card" href="'+esc(safeHref(p.route))+'"><div class="case-related-photo">'+img(caseExperienceFor(p).openingImage)+'</div><div class="case-related-card-caption"><div>'+heading(caseExperienceFor(p).openingTitle||p.title,"h3")+'<p>'+esc(caseExperienceFor(p).openingBody||p.seo?.description||'')+'</p></div><span aria-hidden="true">↗</span></div></a>').join("")+'</div></section>':"")+
  '</div><div class="case-lightbox" data-case-lightbox role="dialog" aria-modal="true" aria-label="Image viewer" hidden><button type="button" data-case-close class="case-lightbox-close" aria-label="Close image viewer">✕</button><button type="button" class="case-lightbox-nav case-lightbox-prev" data-case-lightbox-prev aria-label="Previous image">←</button><figure class="case-lightbox-figure"><img data-case-lightbox-image src="'+esc(src(gallery[0]?.src))+'" alt=""><figcaption><span data-case-lightbox-caption></span><span data-case-lightbox-count></span><span class="case-photo-credit" data-case-photo-credit hidden></span></figcaption></figure><button type="button" class="case-lightbox-nav case-lightbox-next" data-case-lightbox-next aria-label="Next image">→</button></div>';
 const original=host.querySelector<HTMLElement>("#ending");
 if(original){const cloned=original.cloneNode(true) as HTMLElement;cloned.id="case-ending";view.querySelector(".case-experience")?.append(cloned);}
}
