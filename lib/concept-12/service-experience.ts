import type {Block,BlockItem,PageData} from '@/lib/types';
import {safeHref} from '@/lib/safe';
import {servicePage,serviceNames,serviceRoutes,type ServiceKind} from './service-content';
import {groupServiceCapabilities} from './service-capability-groups';

const esc=(v:string='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const text=(v:string='')=>esc(v).replace(/&lt;br\s*\/?&gt;/gi,'<br>').replace(/&lt;(\/?)em&gt;/gi,'<$1em>');
const paras=(v:string='')=>v.split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+text(p)+'</p>').join('');
const phrase=(v:string,accent=false)=>'<span'+(accent?' class="service-accent"':'')+'>'+text(v.replace(/\.$/,''))+(v.endsWith('.')?'<span class="service-period">.</span>':'')+'</span>';
const heading=(s:Pick<Block,'headline'|'accent'>,tag='h2',id='',reveal='editorial')=>{
 const lines=(value:string,accent=false)=>value.split(/<br\s*\/?>/i).filter(Boolean).map(line=>'<span class="wipe-line'+(accent?' accent-line':'')+'">'+phrase(line,accent)+'</span>').join('');
 return '<'+tag+(id?' id="'+id+'"':'')+' class="service-heading block-heading" data-service-reveal="'+reveal+'">'+lines(s.headline)+(s.accent?lines(s.accent,true):'')+'</'+tag+'>';
};
const photo=(src:string,alt:string,eager=false)=>safeHref(src)==='#'?'':'<img src="'+esc(safeHref(src))+'" alt="'+esc(alt)+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+' decoding="async">';
const action=(label:string,href:string,solid=true)=>'<a class="'+(solid?'solid-link':'understated-link')+'" href="'+esc(safeHref(href))+'">'+text(label)+'<span aria-hidden="true">↗</span></a>';
const label=(v:string)=>'<span class="service-eyebrow">'+text(v)+'</span>';
const category=(value:string)=>'<span class="service-category">'+text(value)+'</span>';
const sceneLabel=(item:BlockItem,i:number)=>item.category||String(i+1).padStart(2,'0');
const section=(s:Block,classes:string,body:string,extra='')=>'<section class="'+classes+'" data-service-section="'+esc(s.id)+'" '+extra+'>'+(s.pattern?'<div class="service-pattern" aria-hidden="true"></div>':'')+body+'</section>';

/** One authored renderer for static HTML, native route transitions and Studio.
 * The four art directions vary composition, rather than duplicating templates. */
export function renderServiceExperience(host:HTMLElement,rawPage:PageData,kind:ServiceKind,catalog:Record<string,PageData>,mark:(node:Element|null,s:Block)=>void){
 const view=host.querySelector('.view[data-view="service"]');if(!view)return;
 const page=servicePage(rawPage),byId=(id:string)=>page.sections.find(s=>s.id===id);
 const hero=byId('section-1')||page.sections[0],story=byId('service-story');
 const digitalArt='<div class="service-digital-art" aria-hidden="true"><div class="service-art-orbit"></div><span class="service-art-arrow">↗</span>'+ (story?.items||[]).map((item,i)=>'<span class="service-art-label service-art-label-'+i+'">'+text(sceneLabel(item,i))+'</span>').join('')+'</div>';
 const heroArt=kind==='digital'?digitalArt:'<div class="service-hero-art">'+photo(hero.image,serviceNames[kind]+' creative direction',true)+'</div>';
 const heroBody=heroArt+'<div class="service-hero-content">'+label(serviceNames[kind])+heading(hero,'h1','category-title',kind==='events'||kind==='production'?'photo':'editorial')+'<div class="service-hero-copy">'+paras(hero.body)+'</div><div class="service-hero-actions">'+action(hero.buttonLabel||'Let’s talk',hero.buttonHref||'/contact/')+action('Explore our expertise','#service-expertise',false)+'</div></div>';
 const renderStory=(s:Block)=>{
  const intro='<header class="service-section-head service-gutter">'+(kind==='production'?label('The sequence'):'')+heading(s)+paras(s.body)+'</header>';
  // Events uses a compact editorial triptych rather than another pinned
  // full-viewport scene sequence. All imagery and text remain Studio-editable.
  if(kind==='events'){
   const images='<div class="service-event-triptych-visuals" aria-hidden="true">'+s.items.map((item,i)=>
    '<figure class="service-event-triptych-image" style="--triptych-index:'+i+'">'+photo(item.image||'',item.title)+'</figure>'
   ).join('')+'</div>';
   const notes='<div class="service-event-triptych-notes">'+s.items.map((item,i)=>
    '<article class="service-event-triptych-note service-scene-copy" data-service-scene="'+i+'" style="--triptych-index:'+i+'">'+
     category(sceneLabel(item,i))+'<h3>'+text(item.title)+'</h3>'+paras(item.description)+'</article>'
   ).join('')+'</div>';
   const layout='<div class="service-story-track service-event-triptych-wrap" data-service-story-track>'+
    '<div class="service-story-stage service-event-triptych">'+images+notes+'</div></div>';
   return section(s,'service-story service-story--events',intro+layout);
  }
  if(kind==='creative'){
   // A compact creative canvas, not a pinned three-screen presentation.
   // Each artwork and complete description stays visible, with a selectable
   // focus state for mouse, touch and keyboard users.
   const artboards='<div class="service-creative-artboards" role="group" aria-label="Explore thinking, identity and application">'+s.items.map((item,i)=>
    '<article class="service-creative-artboard" data-creative-artboard="'+i+'" data-selected="'+(i===1?'true':'false')+'" style="--creative-index:'+i+'">'+
     '<button class="service-creative-select" type="button" data-creative-select="'+i+'" aria-pressed="'+(i===1?'true':'false')+'" aria-label="Explore '+esc(sceneLabel(item,i))+': '+esc(item.title)+'">'+
      '<figure class="service-creative-artboard-image">'+photo(item.image||'',item.title)+
       '<span class="service-creative-corner service-creative-corner--top" aria-hidden="true"></span>'+
       '<span class="service-creative-corner service-creative-corner--bottom" aria-hidden="true"></span></figure>'+
     '</button>'+
     '<div class="service-creative-artboard-copy">'+category(sceneLabel(item,i))+'<h3>'+text(item.title)+'</h3>'+paras(item.description)+'</div>'+
    '</article>'
   ).join('')+'</div>';
   const layout='<div class="service-story-track service-creative-canvas-wrap" data-service-story-track>'+
    '<div class="service-story-stage service-creative-canvas" data-service-creative-canvas>'+artboards+'</div></div>';
   return section(s,'service-story service-story--creative',intro+layout);
  }
  if(kind==='digital'){
   // A compact connected-system composition, not another pinned stage.
   // Every description is visible; selecting a channel only shifts emphasis.
   // A living signal constellation, not four dashboard buttons in a box.
   // Routes remain exactly four accessible, selectable disciplines.
   const routes=[
    {d:'M360 280 C315 224 276 150 185 110',x:185,y:110},
    {d:'M360 280 C410 216 466 166 548 142',x:548,y:142},
    {d:'M360 280 C445 307 506 368 540 428',x:540,y:428},
    {d:'M360 280 C302 346 247 418 185 438',x:185,y:438}
   ];
   const icons=[
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M9 22h6M12 19v3"/>',
    '<path d="M4 12a8 8 0 0 1 8-8M20 12a8 8 0 0 1-8 8"/><path d="M8 12h8M12 8v8"/>',
    '<path d="M5 5h14v11H9l-4 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 7.5 11 16M17 7.5 13 16M7 6h10"/>'
   ];
   const links='<svg class="service-digital-network-lines" viewBox="0 0 720 560" preserveAspectRatio="none" aria-hidden="true">'+
     '<defs><radialGradient id="showset-digital-core-glow"><stop offset="0%" stop-color="#12BAAF" stop-opacity=".2"/><stop offset="100%" stop-color="#12BAAF" stop-opacity="0"/></radialGradient></defs>'+
     '<ellipse class="service-digital-orbit service-digital-orbit--outer" cx="360" cy="280" rx="242" ry="217"/>'+
     '<ellipse class="service-digital-orbit service-digital-orbit--inner" cx="360" cy="280" rx="157" ry="142"/>'+
     '<circle class="service-digital-core-ambient" cx="360" cy="280" r="157"/>'+
     routes.map((route,i)=>'<path id="showset-digital-route-'+i+'" data-digital-network-path="'+i+'" d="'+route.d+'" pathLength="1"/>').join('')+
     routes.map((route,i)=>'<use href="#showset-digital-route-'+i+'" class="service-digital-signal" data-digital-signal="'+i+'" pathLength="1"/>').join('')+
     routes.map(route=>'<circle class="service-digital-route-endpoint" cx="'+route.x+'" cy="'+route.y+'" r="3.5"/>').join('')+
     '<circle class="service-digital-hub-ring" cx="360" cy="280" r="101"/>'+
     '<circle class="service-digital-hub-inner" cx="360" cy="280" r="89"/>'+
     '<circle class="service-digital-hub-core" cx="360" cy="280" r="3.5"/></svg>';
   const nodes='<div class="service-digital-network-nodes" role="group" aria-label="Explore connected digital channels">'+s.items.map((item,i)=>
    '<button type="button" class="service-digital-network-node" data-digital-focus-button="'+i+'" aria-pressed="'+(i===0?'true':'false')+'" style="--digital-index:'+i+'" aria-label="Explore '+esc(sceneLabel(item,i))+'">'+
     '<span class="service-digital-network-node-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">'+(icons[i]||icons[0])+'</svg></span>'+
     '<span class="service-digital-network-node-name">'+text(sceneLabel(item,i))+'</span></button>'
   ).join('')+'</div>';
   const network='<div class="service-digital-network" aria-label="A single creative idea connects websites, campaigns, social content and technology">'+
     '<span class="service-digital-canvas-signature" aria-hidden="true">CONNECTED BY DESIGN</span>'+
     links+'<div class="service-digital-hub-label" aria-hidden="true"><span>ONE</span><span>IDEA<span class="service-digital-hub-period">.</span></span></div>'+nodes+'</div>';
   const rows='<div class="service-digital-editorial">'+s.items.map((item,i)=>
    '<article class="service-digital-editorial-item" data-digital-story="'+i+'" data-digital-active="'+(i===0?'true':'false')+'">'+
     category(sceneLabel(item,i))+'<h3>'+text(item.title)+'</h3>'+paras(item.description)+'</article>'
   ).join('')+'</div>';
   const layout='<div class="service-story-track service-digital-connected-wrap" data-service-story-track>'+
    '<div class="service-story-stage service-digital-connected" data-digital-connected>'+network+rows+'</div></div>';
   return section(s,'service-story service-story--digital',intro+layout);
  }
  if(kind==='production'){
   // A compact cinematic production frame: a real photographic change for each
   // step, with all three descriptions always visible and Studio-editable.
   const frames='<div class="service-production-frames">'+s.items.map((item,i)=>
    '<figure class="service-production-frame" data-production-frame="'+i+'" data-production-active="'+(i===0?'true':'false')+'" aria-hidden="'+(i===0?'false':'true')+'" style="--production-index:'+i+'">'+
     photo(item.image||'',item.title)+'</figure>'
   ).join('')+'</div>';
   const image='<div class="service-production-visual" aria-label="Photography from the production journey">'+frames+
    '<div class="service-production-frame-rule" aria-hidden="true"></div></div>';
   const notes='<div class="service-production-timeline" role="group" aria-label="Production stages">'+s.items.map((item,i)=>
    '<article class="service-production-step" data-production-step="'+i+'" data-production-active="'+(i===0?'true':'false')+'">'+
     '<button type="button" class="service-production-step-trigger" data-production-step-trigger="'+i+'" aria-pressed="'+(i===0?'true':'false')+'">'+
      category(sceneLabel(item,i))+'<h3>'+text(item.title)+'</h3></button>'+paras(item.description)+'</article>'
   ).join('')+'</div>';
   const layout='<div class="service-story-track service-production-timeline-wrap" data-service-story-track>'+
    '<div class="service-story-stage service-production-composition" data-production-composition>'+image+notes+'</div></div>';
   return section(s,'service-story service-story--production',intro+layout);
  }
  const body='<div class="service-scenes">'+s.items.map((item,i)=>'<article class="service-scene" data-service-scene="'+i+'"><figure>'+photo(item.image||'',item.title)+'</figure><div class="service-scene-copy">'+category(sceneLabel(item,i))+heading({headline:item.title,accent:''},'h3','','editorial')+paras(item.description)+'</div></article>').join('')+'</div>'+'<div class="service-film-progress" aria-hidden="true"><i></i></div>';
  return section(s,'service-story service-story--'+kind,intro+'<div class="service-story-track" data-service-story-track><div class="service-story-stage">'+body+'</div></div>');
 };
 const renderGroups=(s:Block)=>section(s,'service-groups service-gutter','<header>'+heading(s)+paras(s.body)+'</header><div class="service-group-list">'+s.items.map((item,i)=>'<article><span class="service-index" aria-hidden="true">0'+(i+1)+'</span><h3>'+text(item.title)+'</h3>'+paras(item.description)+'</article>').join('')+'</div>');
 const renderExpertise=(s:Block)=>{
  const groups=groupServiceCapabilities(kind,s.items);
  const list=groups.map(group=>
   '<article class="service-capability-group'+(group.title?'':' service-capability-group--plain')+'">'+
   (group.title?'<h3>'+text(group.title)+'<span class="service-capability-period" aria-hidden="true">.</span></h3>':'')+
   '<ul class="service-capability-list">'+group.items.map(item=>
    '<li class="service-capability" data-service-capability data-capability-id="'+esc(item.id)+'"><span class="service-capability-name">'+text(item.title)+'</span></li>'
   ).join('')+'</ul></article>'
  ).join('');
  return section(s,'service-expertise service-gutter',
   '<header class="service-editorial-row"><div>'+heading(s)+'</div><div>'+paras(s.body)+'</div></header>'+
   '<div class="service-expertise-grid service-expertise-grid--'+kind+'">'+list+'</div>',
   'id="service-expertise"');
 };
 const renderProcess=(s:Block)=>section(s,'service-process service-gutter service-process--'+kind,'<header>'+heading(s)+paras(s.body)+'</header><ol>'+s.items.map((item,i)=>'<li>'+(kind==='creative'&&story?.items[i]?.image?'<figure class="service-process-proof">'+photo(story.items[i].image||'',story.items[i].title)+'</figure>':'')+'<span class="service-process-number" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+text(item.title)+'</h3>'+paras(item.description)+'</div></li>').join('')+'</ol>');
 const renderWork=(s:Block)=>section(s,'service-work service-gutter','<header>'+(kind!=='production'?label(kind==='creative'?'Identity in context':kind==='digital'?'Across the channels':'A creative exploration'):'')+heading(s)+paras(s.body)+'</header><div class="service-work-list">'+s.items.map(item=>{
  const project=Object.values(catalog).find(p=>p.route===safeHref(item.href));
  const src=item.image||project?.caseExperience?.openingImage||project?.sections[0]?.image||'';
  return '<a class="service-work-card" href="'+esc(safeHref(item.href))+'"><figure>'+photo(src,item.title||project?.title||'Creative concept')+'<span class="service-work-caption">Creative concept study <span aria-hidden="true">↗</span></span></figure><div><h3>'+text(item.title||project?.title||'Explore the story')+'</h3>'+paras(item.description||project?.seo.description||'')+'</div></a>';
 }).join('')+'</div>');
 let markup='';
 for(const s of page.sections){
  if(s===hero)markup+=section(s,'service-hero service-hero--'+kind,heroBody);
  else if(s.id==='service-story')markup+=renderStory(s);
  else if(s.id==='service-work'||s.type==='work')markup+=renderWork(s);
  else if(s.id==='section-2'){
   const formats=kind==='events'&&s.items.length
    ?'<ul class="service-event-types" aria-label="Event formats">'+s.items.map(item=>'<li>'+text(item.title)+'</li>').join('')+'</ul>'
    :'';
   markup+=section(s,'service-intro service-gutter','<div class="service-editorial-row"><div>'+heading(s)+'</div><div>'+paras(s.body)+'</div></div>'+formats);
  }
  else if(s.id==='section-3')markup+=renderGroups(s);
  else if(s.id==='section-4')markup+=section(s,'service-feature service-gutter','<div class="service-editorial-row"><div>'+heading(s)+'</div><div>'+paras(s.body)+'</div></div>');
  else if(s.id==='section-5')markup+=renderProcess(s);
  else if(s.type==='accordion')markup+=renderExpertise(s);
  else if(s.id==='section-8')markup+=section(s,'service-connected service-gutter',heading(s)+'<nav aria-label="Connected capabilities">'+(Object.keys(serviceRoutes) as ServiceKind[]).filter(k=>k!==kind).map(k=>'<a href="'+serviceRoutes[k]+'">'+serviceNames[k]+' <span aria-hidden="true">↗</span></a>').join('')+'</nav>');
  else if(s.type==='visual'){
   if(kind==='events'||kind==='creative'||kind==='digital'||kind==='production'){
    // Reuse the compact patterned editorial CTA for Events, Creative and Digital;
    // preserve authored copy, brand pattern and ivory terminal period.
    const first='<span class="plain-line">'+text(s.headline)+'</span>';
    const accent=s.accent||'';
    const terminal=accent.match(/([.!?])$/);
    const second=accent
     ?'<span class="plain-line accent-text">'+text(terminal?accent.slice(0,-1):accent)
       +(terminal?'<span class="service-period">'+text(terminal[1])+'</span>':'')+'</span>'
     :'';
    const closeHeading='<h2 class="section-title plain-heading service-heading">'+first+second+'</h2>';
    const cta=action(s.buttonLabel||hero.buttonLabel||'Let’s talk',s.buttonHref||'/contact/').replace('class="solid-link"','class="solid-link end-link"');
    markup+=section(s,'service-close service-close--editorial end-section section-gutter',
     closeHeading+'<div class="end-bottom"><div class="service-close-description">'+paras(s.body)+'</div>'+cta+'</div>');
   }else{
    markup+=section(s,'service-close','<div class="service-close-art">'+photo(s.image,serviceNames[kind]+' visual concept')+'</div><div class="service-close-copy">'+heading(s,'h2','','photo')+paras(s.body)+action(s.buttonLabel||hero.buttonLabel||'Let’s talk',s.buttonHref||'/contact/')+'</div>');
   }
  }
  else markup+=section(s,'service-extra service-gutter',heading(s)+paras(s.body));
 }
 view.innerHTML='<div class="service-experience service-experience--'+kind+'" data-service-experience="'+kind+'">'+markup+'</div>';
 page.sections.forEach(s=>mark([...view.querySelectorAll('[data-service-section]')].find(el=>el.getAttribute('data-service-section')===s.id)||null,s));
}
