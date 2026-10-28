const{chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright'),fs=require('fs'),path=require('path');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3003',out=process.env.SHOWSET_SERVICE_EVIDENCE_DIR||'qa-results/services';fs.mkdirSync(out,{recursive:true});const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/pages.json'))),slugs=['events-experiences','creative-design','digital-marketing','content-production'],checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
const homeHeroByWidth=new Map();
const getHeadingMetrics=el=>{const style=getComputedStyle(el);return {
  fontSize:style.fontSize,
  lineHeight:style.lineHeight,
  letterSpacing:style.letterSpacing,
  fontWeight:style.fontWeight,
  fontFamily:style.fontFamily
}};
async function ready(p,slug){await p.goto(base+'/'+slug+'/');await p.waitForSelector('[data-service-ready=true]');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(750)}
async function progress(p,f){await p.locator('[data-service-story-track]').evaluate((e,f)=>scrollTo(0,scrollY+e.getBoundingClientRect().top+Math.max(0,e.offsetHeight-innerHeight)*f),f);await p.waitForTimeout(250)}
(async()=>{const b=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});try{
for(const width of[1920,1440,1024,768,390,320])for(const slug of slugs){const c=await b.newContext({viewport:{width,height:900}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));const page=seed[slug],hero=page.sections.find(s=>s.id==='section-1'),caps=page.sections.find(s=>s.id==='section-6');await ready(p,slug);const tag=slug+'-'+width;
ck('No repeated case studies on service pages '+tag,await p.locator('.service-work,.service-work-card').count()===0);
if(slug==='events-experiences'){
 const closing=await p.locator('.service-close--editorial').evaluate(el=>{
   const h=el.querySelector('h2'),pseudo=getComputedStyle(el,'::before');
   return {
     height:el.getBoundingClientRect().height,
     viewport:innerHeight,
     photoCount:el.querySelectorAll('img,.service-close-art').length,
     headline:h.textContent.trim().replace(/\\s+/g,' '),
     copy:el.querySelector('.service-close-description')?.textContent.trim()||'',
     button:el.querySelector('.solid-link')?.textContent.trim()||'',
     pattern:pseudo.backgroundImage,
     patternRight:pseudo.right
   };
 });
 ck('Events closing matches compact homepage editorial CTA and keeps original copy '+tag,
   closing.height<closing.viewport
   &&closing.photoCount===0
   &&closing.headline==="Let's make a roomworth remembering."
   &&closing.copy.includes("Got an idea worth getting excited about?")
   &&closing.copy.includes("Bring us the possibilities.")
   &&closing.button.includes("Bring us your brief")
   &&closing.pattern.includes('closing-pattern.svg'),closing);
}

if(slug==='digital-marketing'){
 const cta=await p.locator('.service-close--editorial').evaluate(el=>{
  const body=el.querySelector('.service-close-description').getBoundingClientRect();
  const button=el.querySelector('.end-link').getBoundingClientRect();
  return {image:el.querySelectorAll('img,.service-close-art').length,
    copy:el.querySelector('.service-close-description').textContent,
    button:el.querySelector('.end-link').textContent,
    leftAligned:Math.abs(body.left-button.left)<2,
    accent:getComputedStyle(el.querySelector('.accent-text')).color,
    period:getComputedStyle(el.querySelector('.service-period')).color};
 });
 ck('Digital closes with compact editorial CTA and its own wording '+tag,
  cta.image===0&&cta.leftAligned&&cta.copy.includes("Got an idea that needs to go further?")
  &&cta.button.includes("Tell us what you're building")
  &&cta.accent==='rgb(18, 186, 175)'&&cta.period==='rgb(250, 249, 253)',cta);
}
if(slug==='creative-design'){
 const heroAngle=await p.locator('.service-hero--creative .service-hero-art').evaluate(el=>({
   transform:getComputedStyle(el).transform,
   imgTransform:getComputedStyle(el.querySelector('img')).transform
 }));
 ck('Creative hero photograph is straight, with no tilted frame '+tag,
   heroAngle.transform==='none',heroAngle);
 const ctaAlignment=await p.locator('.service-close--editorial').evaluate(el=>{
   const copy=el.querySelector('.service-close-description'),button=el.querySelector('.end-link.solid-link');
   const body=copy.getBoundingClientRect(),last=copy.lastElementChild.getBoundingClientRect(),cta=button.getBoundingClientRect();
   return {copyLeft:body.left,buttonLeft:cta.left,bodyBottom:last.bottom,buttonTop:cta.top,
     marginLeft:getComputedStyle(button).marginLeft,alignSelf:getComputedStyle(button).alignSelf};
 });
 ck('Creative closing CTA button aligns beneath body copy '+tag,
    Math.abs(ctaAlignment.copyLeft-ctaAlignment.buttonLeft)<2
    &&ctaAlignment.buttonTop>=ctaAlignment.bodyBottom-2
    &&ctaAlignment.marginLeft==='0px',ctaAlignment);
}

if(slug==='events-experiences')ck('Approved five-section Events journey '+tag,
page.sections.map(s=>s.id).join(',')==='section-1,section-2,service-story,section-6,section-7'
&&await p.locator('.service-event-types li').count()===6
&&await p.locator('.service-process,.service-groups,.service-connected').count()===0);
ck('Authored hero '+tag,(await p.locator('.service-hero h1').innerText()).replace(/\s+/g,'').trim()===(hero.headline+hero.accent).replace(/\s+/g,''));
ck('Service hero has no decorative footer labels '+tag,
 await p.locator('.service-hero-foot').count()===0
 &&await p.locator('.service-hero').evaluate(el=>!el.textContent.includes('SHOWSET / ')&&!el.textContent.includes('Big ideas. Every detail.')));
if(!homeHeroByWidth.has(width)){
 const hp=await c.newPage();await hp.goto(base+'/');await hp.waitForSelector('[data-concept-ready=true]');
 await hp.evaluate(()=>document.fonts.ready);
 homeHeroByWidth.set(width,await hp.locator('.hero-title').evaluate(getHeadingMetrics));
 await hp.close();
}
const serviceHeading=await p.locator('.service-hero h1').evaluate(getHeadingMetrics);
const homepageHeading=homeHeroByWidth.get(width);
ck('Service hero headline matches homepage font size, line spacing and tracking '+tag,
 Object.keys(homepageHeading).every(key=>serviceHeading[key]===homepageHeading[key]),
 {serviceHeading,homepageHeading});
ck('Shared design typography '+tag,await p.locator('.service-hero-copy p').first().evaluate(e=>getComputedStyle(e).fontSize==='17px')&&await p.locator('.service-hero .solid-link').evaluate(e=>getComputedStyle(e).fontSize==='14px'));
ck('All editable sections rendered '+tag,await p.locator('[data-service-section]').count()===page.sections.length);
ck('Full expertise inventory '+tag,await p.locator('[data-service-capability]').evaluateAll((els,items)=>els.length===items.length&&els.every(el=>items.some(item=>item.id===el.dataset.capabilityId&&item.title===el.textContent.trim())),caps.items));
ck('No video placeholders or playback controls '+tag,await p.locator('.service-experience video,.service-experience button[aria-label*="Pause"],.service-experience button[aria-label*="Play"]').count()===0);
await p.screenshot({path:path.join(out,tag+'-hero.png')});
const pinned=await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')==='true';ck('Dedicated mobile reading adaptation '+tag,width>800||!pinned);
const positions=[];for(const f of[0,.5,.98,.5,0]){if(pinned)await progress(p,f);else await p.locator('.service-story-stage').scrollIntoViewIfNeeded();const m=await p.locator('.service-story-stage').evaluate(e=>({y:e.getBoundingClientRect().top,h:e.getBoundingClientRect().height,progress:Number(e.style.getPropertyValue('--service-progress'))}));positions.push(m);if(pinned)ck('Pinned reversible stage '+tag+' '+f,Math.abs(m.y)<1&&m.h===900,m);if(width===1440||width===390)await p.screenshot({path:path.join(out,tag+'-story-'+f+'.png')})}
if(pinned)ck('Stage restores forward/reverse geometry '+tag,JSON.stringify(positions[0])===JSON.stringify(positions.at(-1)));
if(width===1440){if(slug==='events-experiences'){
 const triptych=await p.locator('.service-event-triptych').evaluate(el=>({
  display:getComputedStyle(el).display,
  columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
  images:el.querySelectorAll('.service-event-triptych-image img').length,
  notes:el.querySelectorAll('.service-event-triptych-note').length,
  height:el.getBoundingClientRect().height
 }));
 ck('Events triptych is a compact natural-scrolling editorial layout '+tag,
   !pinned&&triptych.display==='grid'&&triptych.columns===2
   &&triptych.images===3&&triptych.notes===3&&triptych.height<900,triptych);
 }
if(slug==='creative-design'){
  const design=await p.locator('.service-creative-canvas').evaluate(el=>({
   boards:el.querySelectorAll('.service-creative-artboard').length,
   buttons:el.querySelectorAll('.service-creative-select').length,
   descriptions:el.querySelectorAll('.service-creative-artboard-copy p').length,
   height:el.getBoundingClientRect().height
  }));
  ck('Creative canvas keeps three complete stories in a natural compact layout '+tag,
    !pinned&&design.boards===3&&design.buttons===3&&design.descriptions===3&&design.height<900,design);
  for(const i of [0,2,1]){
   await p.locator('.service-creative-select').nth(i).click();
   ck('Creative artboard selection is accessible and keeps all descriptions visible '+i,
     await p.locator('.service-creative-artboard').evaluateAll((els,i)=>els.length===3&&els.every((el,j)=>
      (el.dataset.selected==='true')===(i===j)
      &&el.querySelector('button').getAttribute('aria-pressed')===String(i===j)
      &&el.querySelector('p').getBoundingClientRect().height>0),i));
  }
  await p.locator('.service-creative-select').nth(1).focus();
  await p.keyboard.press('ArrowRight');
  ck('Creative keyboard arrow navigation selects the next artwork '+tag,
    await p.locator('.service-creative-select').nth(2).getAttribute('aria-pressed')==='true'
    &&await p.locator('.service-creative-select').nth(2).evaluate(e=>e===document.activeElement));
  await p.locator('.service-creative-select').nth(1).click();
  await p.locator('.service-creative-select').nth(0).hover();
  await p.waitForTimeout(400);
  const hover=await p.locator('.service-creative-artboards').evaluate(board=>[...board.querySelectorAll('.service-creative-artboard-image img')].map(el=>getComputedStyle(el).filter));
  ck('Creative artwork hover softly mutes the other boards without hiding content '+tag,
    hover[0]==='none'&&hover.slice(1).every(f=>f.includes('grayscale(0.34)')&&f.includes('brightness(0.78)')),hover);
  await p.mouse.move(0,0);
  await p.waitForTimeout(400);
  ck('Creative images restore full colour when pointer leaves '+tag,
    await p.locator('.service-creative-artboard-image img').evaluateAll(es=>es.every(el=>getComputedStyle(el).filter==='none')));
 }
if(slug==='digital-marketing'){
 const system=await p.locator('[data-digital-connected]').evaluate(el=>({
  columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length,
  nodes:el.querySelectorAll('[data-digital-focus-button]').length,
  rows:el.querySelectorAll('[data-digital-story]').length,
  textVisible:[...el.querySelectorAll('[data-digital-story] p')].every(p=>p.getBoundingClientRect().height>0),
  height:el.getBoundingClientRect().height
 }));
 const visual=await p.locator('.service-digital-network').evaluate(el=>({
  border:getComputedStyle(el).borderTopWidth,
  routes:el.querySelectorAll('[data-digital-network-path]').length,
  curvedRoutes:[...el.querySelectorAll('[data-digital-network-path]')].every(p=>p.getAttribute('d').includes('C')),
  signalPaths:el.querySelectorAll('[data-digital-signal]').length,
  symbols:el.querySelectorAll('.service-digital-network-node-mark svg').length,
  orbitalTracks:el.querySelectorAll('.service-digital-orbit').length,
  overlapping:[...el.querySelectorAll('[data-digital-focus-button]')].some((x,i,all)=>
    all.some((y,j)=>j>i && !(
     x.getBoundingClientRect().right < y.getBoundingClientRect().left ||
     x.getBoundingClientRect().left > y.getBoundingClientRect().right ||
     x.getBoundingClientRect().bottom < y.getBoundingClientRect().top ||
     x.getBoundingClientRect().top > y.getBoundingClientRect().bottom
    )))
 }));
 ck('Digital constellation replaces boxed flowchart with curved routes and distinct glyphs '+tag,
  visual.border==='0px'&&visual.routes===4&&visual.curvedRoutes&&visual.signalPaths===4
  &&visual.symbols===4&&visual.orbitalTracks===2&&!visual.overlapping,visual);
 ck('Digital has four readable connected disciplines without a pinned scroll '+tag,
  !pinned&&system.nodes===4&&system.rows===4&&system.textVisible&&system.height<950,system);
 for(const i of [3,1,2,0]){
  await p.locator('[data-digital-focus-button]').nth(i).click();
  ck('Digital interactive focus selects matching node and story '+i+' '+tag,
   await p.locator('[data-digital-connected]').evaluate((el,i)=>
    el.dataset.digitalFocus===String(i)&&el.dataset.digitalEngaged==='true'
    &&el.querySelectorAll('[data-digital-story] p').length===4
    &&[...el.querySelectorAll('[data-digital-focus-button]')].every((btn,n)=>btn.getAttribute('aria-pressed')===String(n===i)),i));
 }
 await p.locator('[data-digital-focus-button]').nth(0).focus();
 await p.keyboard.press('ArrowRight');
 ck('Digital network supports keyboard navigation '+tag,
  await p.locator('[data-digital-focus-button]').nth(1).evaluate(el=>el===document.activeElement&&el.getAttribute('aria-pressed')==='true'));
}
if(slug==='content-production'){
 const layout=await p.locator('[data-production-composition]').evaluate(el=>({
  frames:el.querySelectorAll('[data-production-frame]').length,
  stages:el.querySelectorAll('[data-production-step]').length,
  descriptions:[...el.querySelectorAll('.service-production-step p')].map(p=>p.getBoundingClientRect().height),
  height:el.getBoundingClientRect().height
 }));
 ck('Production uses compact editorial timeline, not pinned full-screen scenes '+tag,
  !pinned&&layout.frames===3&&layout.stages===3
  &&layout.descriptions.every(h=>h>0)&&layout.height<950,layout);
 for(const i of[2,1,0]){
  await p.locator('[data-production-step-trigger]').nth(i).click();
  const selected=await p.locator('[data-production-composition]').evaluate(el=>({
   frames:[...el.querySelectorAll('[data-production-frame]')].map(f=>f.dataset.productionActive),
   pressed:[...el.querySelectorAll('[data-production-step-trigger]')].map(b=>b.getAttribute('aria-pressed')),
   visibleText:[...el.querySelectorAll('.service-production-step p')].every(p=>p.getBoundingClientRect().height>0)
  }));
  ck('Production selection changes the photograph while keeping copy visible '+tag+' '+i,
   selected.frames.length===3&&selected.frames.every((v,j)=>v===String(i===j))
   &&selected.pressed.every((v,j)=>v===String(i===j))&&selected.visibleText,selected);
 }
 await p.locator('[data-production-step-trigger]').nth(0).focus();await p.keyboard.press('ArrowDown');
 ck('Production timeline supports keyboard navigation '+tag,
  await p.locator('[data-production-step-trigger]').nth(1).evaluate(el=>el===document.activeElement&&el.getAttribute('aria-pressed')==='true'));
 await p.locator('[data-production-step-trigger]').nth(2).hover();
 await p.waitForTimeout(140);
 ck('Production hover previews the matching frame '+tag,
  await p.locator('[data-production-frame="2"]').getAttribute('data-production-active')==='true');
}
}
for(const selector of['.service-intro','.service-groups','.service-process','.service-expertise','.service-work','.service-close']){if(!await p.locator(selector).count())continue;await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(100);if(width===1440||width===390)await p.screenshot({path:path.join(out,tag+'-'+selector.slice(1)+'.png')})}
ck('Expertise has no search, accordion, or unnecessary controls '+tag,await p.locator('.service-expertise input,.service-expertise button,.service-expertise details,.service-expertise summary,.service-expertise [data-service-search]').count()===0);
const capabilityLayout=await p.locator('.service-expertise-grid').evaluate(grid=>{
 const groups=[...grid.querySelectorAll('.service-capability-group')];
 const entries=[...grid.querySelectorAll('[data-service-capability]')];
 const names=entries.map(el=>el.querySelector('.service-capability-name'));
 const rects=groups.map(el=>el.getBoundingClientRect());
 const cellRects=entries.map(el=>el.getBoundingClientRect());
 const tracks=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/);
 const flat=grid.classList.contains('service-expertise-grid--production');
 const innerList=grid.querySelector('.service-capability-list');
 return {
  titles:groups.flatMap(g=>[...g.querySelectorAll(':scope > h3')].map(h=>h.textContent.trim().replace(/\.$/,''))),
  groupCount:groups.length,
  count:entries.length,
  ids:entries.map(el=>el.dataset.capabilityId),
  itemTexts:entries.map(el=>el.textContent.trim()),
  descriptionAbsent:!grid.querySelector('.service-capability-description,.service-search'),
  groupTitlesSimple:groups.every(g=>[...g.querySelectorAll(':scope > h3')].every(h=>!/^\s*[\d\-–—]/.test(h.textContent))),
  periods:groups.every(g=>g.querySelector('h3 .service-capability-period')?.textContent==='.'),
  tealPeriods:groups.every(g=>{
   const h=g.querySelector('h3');
   const expected=h.dataset.showsetMultiline==='true'?'rgb(250, 249, 253)':'rgb(18, 186, 175)';
   return getComputedStyle(g.querySelector('.service-capability-period')).color===expected;
  }),
  rules:groups.every(g=>{const rule=getComputedStyle(g.querySelector('h3'),'::after');return rule.content!=='none'&&rule.width==='52px'&&rule.height==='2px'&&rule.backgroundColor==='rgb(18, 186, 175)'}),
  cards:groups.every(g=>{const style=getComputedStyle(g);return parseFloat(style.borderTopWidth)>0&&parseFloat(style.borderTopWidth)<=1&&parseFloat(style.borderRadius)>=8&&style.backgroundColor!=='rgba(0, 0, 0, 0)'}),
  headings:groups.flatMap(g=>[...g.querySelectorAll(':scope > h3')].map(h=>({fontSize:getComputedStyle(h).fontSize,letterSpacing:getComputedStyle(h).letterSpacing}))),
  fontSizes:names.map(el=>getComputedStyle(el).fontSize),
  allVisible:names.every(el=>el.getBoundingClientRect().height>8&&getComputedStyle(el).visibility==='visible'),
  columns:tracks.length,
  innerColumns:flat?getComputedStyle(innerList).gridTemplateColumns.trim().split(/\s+/).length:null,
  withinViewport:[...rects,...cellRects].every(r=>r.width>0&&r.left>=-1&&r.right<=innerWidth+1),
  groupsDontOverlap:rects.every((r,i)=>rects.slice(i+1).every(q=>r.right<=q.left+1||q.right<=r.left+1||r.bottom<=q.top+1||q.bottom<=r.top+1))
 };
});
const expectedGroupTitles={
 'events-experiences':['Concept & Design','Planning & People','Space & Production','The Experience'],
 'creative-design':['Brand & Identity','Graphic & Creative','Print & Packaging','Spaces & Experiences'],
 'digital-marketing':['Websites & Digital Experiences','Marketing & Campaigns','Social & Content','Technology & Partnerships'],
 'content-production':['Concept & Pre-Production','Film & Photography','Motion & Post-Production','Live & Technical Production']
};
ck('Cards have plain names, with only the brand full stop '+tag,
 capabilityLayout.groupTitlesSimple&&JSON.stringify(capabilityLayout.titles)===JSON.stringify(expectedGroupTitles[slug])&&capabilityLayout.periods,capabilityLayout.titles);
ck('Service cards match reference outlines and short teal rules '+tag,
 capabilityLayout.cards&&capabilityLayout.tealPeriods&&capabilityLayout.rules,capabilityLayout);
ck('All capability names remain visible without paragraphs '+tag,
 capabilityLayout.allVisible&&capabilityLayout.descriptionAbsent&&capabilityLayout.count===caps.items.length,capabilityLayout);
ck('All stable item IDs are retained exactly once '+tag,
 JSON.stringify([...capabilityLayout.ids].sort())===JSON.stringify(caps.items.map(x=>x.id).sort()),capabilityLayout.ids);
ck('Service names use compact 15px list typography '+tag,capabilityLayout.fontSizes.every(x=>x==='15px'),capabilityLayout.fontSizes);
if(['events-experiences','creative-design','digital-marketing','content-production'].includes(slug)){
 const palette=await p.locator('.service-expertise').evaluate(section=>{
  const style=getComputedStyle(section);
  return {
   section:style.backgroundColor,
   cards:[...section.querySelectorAll('.service-capability-group')].map(card=>{
    const c=getComputedStyle(card);
    return {background:c.backgroundColor,gradient:c.backgroundImage,border:c.borderTopColor,width:parseFloat(c.borderTopWidth),radius:parseFloat(c.borderTopLeftRadius)};
   })
  };
 });
 ck('Events, Creative and Digital capability cards match approved navy gradient '+tag,
   palette.section==='rgb(13, 47, 73)'&&palette.cards.length===4
   &&palette.cards.every(card=>card.background==='rgb(17, 47, 69)'
     &&card.gradient.includes('linear-gradient(160deg')
     &&card.gradient.includes('rgba(21, 59, 84, 0.95)')
     &&card.gradient.includes('rgba(9, 38, 57, 0.98)')
     &&card.border.startsWith('rgba(255, 255, 255, ')
     &&card.width>0&&card.width<=1&&card.radius===12),palette);
}

const expectedGrid=['events-experiences','creative-design','digital-marketing','content-production'].includes(slug)&&width>=1180?4:width>640?2:1;
const expectedInner=null;
ck('Compact responsive groups fit with no overlap '+tag,
 capabilityLayout.withinViewport&&capabilityLayout.groupsDontOverlap&&capabilityLayout.columns===expectedGrid&&(expectedInner===null||capabilityLayout.innerColumns===expectedInner),
 {expectedGrid,expectedInner,layout:capabilityLayout});
if(slug==='content-production'){
 const live=seed[slug].sections.find(s=>s.id==='section-6').items.find(s=>s.title==='Live Streaming');
 ck('Live Streaming remains an independently editable capability with detailed scope '+tag,
   !!live&&live.id==='production-live-streaming-20261028'
   &&/multi-camera|camera feeds/i.test(live.description)
   &&/switching/i.test(live.description)&&/audio/i.test(live.description)
   &&/remote participation/i.test(live.description)&&/recording/i.test(live.description)
   &&await p.locator('[data-capability-id="production-live-streaming-20261028"]').count()===1,
   live?.description);
 const ending=await p.locator('.service-close--editorial').evaluate(el=>{
  const body=el.querySelector('.service-close-description').getBoundingClientRect(),
    button=el.querySelector('.end-link').getBoundingClientRect();
  return {photo:el.querySelectorAll('img,.service-close-art').length,
   heading:el.querySelector('h2').textContent,
   copy:el.querySelector('.service-close-description').textContent,
   button:el.querySelector('.end-link').textContent,
   aligned:Math.abs(body.left-button.left)<2,
   period:getComputedStyle(el.querySelector('.service-period')).color};
 });
 ck('Production closing CTA stays compact and aligned with body copy '+tag,
  ending.photo===0&&ending.aligned&&ending.heading.includes('next frame say?')
  &&ending.copy.includes('a live stream')&&ending.button.includes("Let's get producing")
  &&ending.period==='rgb(250, 249, 253)',ending);
}
ck('Contact and connected links valid '+tag,await p.locator('.service-close .solid-link').getAttribute('href')==='/contact/'&&await p.locator('.service-connected a').count()===(['events-experiences','creative-design','digital-marketing','content-production'].includes(slug)?0:3)&&await p.locator('.service-work,.service-work-card').count()===0);
ck('No horizontal overflow / broken loaded images '+tag,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.service-experience img')].every(e=>!e.getBoundingClientRect().width||!e.complete||e.naturalWidth>0)));
const overlap=await p.locator('.service-hero').evaluate(e=>{const head=e.querySelector('h1'),h=head.getBoundingClientRect(),p=e.querySelector('.service-hero-copy').getBoundingClientRect(),walker=document.createTreeWalker(head,NodeFilter.SHOW_TEXT),rects=[];let node;while(node=walker.nextNode()){if(!node.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(node);rects.push(...r.getClientRects())}return{headingBottom:h.bottom,copyTop:p.top,headingWidth:Math.max(...rects.map(r=>r.right))-Math.min(...rects.map(r=>r.left)),client:head.clientWidth,inkInside:rects.every(r=>r.left>=h.left-1&&r.right<=h.right+1),maskScrollWidth:head.scrollWidth}});ck('Opening has no text overlap or clipping '+tag,overlap.headingBottom<=overlap.copyTop+1&&overlap.headingWidth<=overlap.client+1&&overlap.inkInside,overlap);await c.close();}
// Progressive enhancement, reduced motion and deliberately long edited copy.
for(const options of[{reducedMotion:'reduce'},{javaScriptEnabled:false}])for(const slug of slugs){const c=await b.newContext({viewport:{width:1440,height:900},...options}),p=await c.newPage();await p.goto(base+'/'+slug+'/');if(options.javaScriptEnabled!==false)await p.waitForSelector('[data-service-ready=true]');ck('Readable static story '+slug+' '+JSON.stringify(options),await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')!=='true'&&await p.locator('.service-scene-copy,.service-proof,.service-channel').evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility==='visible'&&getComputedStyle(e).opacity!=='0')));ck('Static expertise remains available '+slug,await p.locator('[data-service-capability]').count()===seed[slug].sections.find(s=>s.id==='section-6').items.length);await c.close()}
for(const slug of slugs){const pages=structuredClone(seed),story=pages[slug].sections.find(s=>s.id==='service-story');story.items[0].description=Array(250).fill('considered').join(' ');const c=await b.newContext({viewport:{width:1440,height:900}});await c.addInitScript(pages=>localStorage.setItem('showset-preview-published-pages',JSON.stringify(pages)),pages);const p=await c.newPage();await ready(p,slug);ck('250-word edited story stays readable '+slug,await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')==='false'&&await p.locator('.service-story').textContent().then(t=>t.includes(story.items[0].description)));await c.close()}
ck('No service runtime errors',errors.length===0,errors);
}finally{await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1}})().catch(e=>{console.error(e);process.exitCode=1});
