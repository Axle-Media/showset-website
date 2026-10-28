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
  columns:getComputedStyle(el).gridTemplateColumns.split(/\\s+/).filter(Boolean).length,
  images:el.querySelectorAll('.service-event-triptych-image img').length,
  notes:el.querySelectorAll('.service-event-triptych-note').length,
  height:el.getBoundingClientRect().height
 }));
 ck('Events triptych is a compact natural-scrolling editorial layout '+tag,
   !pinned&&triptych.display==='grid'&&triptych.columns===2
   &&triptych.images===3&&triptych.notes===3&&triptych.height<900,triptych);
 }
if(slug==='creative-design'){await progress(p,0);const start=await p.locator('.service-proof-image').first().evaluate(e=>getComputedStyle(e).transform);await progress(p,1);ck('Creative proof unfolds with scroll',await p.locator('.service-proof-image').first().evaluate(e=>getComputedStyle(e).transform)!==start)}
if(slug==='digital-marketing'){await progress(p,.5);await p.getByRole('button',{name:'Content',exact:true}).click();ck('Digital channel choice responds',await p.getByRole('button',{name:'Content',exact:true}).getAttribute('aria-pressed')==='true');await p.getByRole('button',{name:'Website',exact:true}).focus();await p.keyboard.press('Space');ck('Digital choice is keyboard accessible',await p.getByRole('button',{name:'Website',exact:true}).getAttribute('aria-pressed')==='true')}
if(slug==='content-production'){await progress(p,0);const a=await p.locator('.service-scenes').evaluate(e=>getComputedStyle(e).transform);await progress(p,.5);const z=await p.locator('.service-scenes').evaluate(e=>getComputedStyle(e).transform);ck('Production photographic sequence advances',pinned&&a!==z);await progress(p,0);ck('Production sequence reverses',await p.locator('.service-scenes').evaluate(e=>getComputedStyle(e).transform)===a)}}
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
  tealPeriods:groups.every(g=>getComputedStyle(g.querySelector('.service-capability-period')).color==='rgb(18, 186, 175)'),
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
 'creative-design':['Strategy & Identity','Design & Production'],
 'digital-marketing':['Websites & Technology','Marketing & Content'],
 'content-production':['Film & Content','Technical Production']
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
if(slug==='events-experiences'){
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
 ck('Events capability cards match homepage case-study gradient and subtle borders '+tag,
   palette.section==='rgb(13, 47, 73)'&&palette.cards.length===4
   &&palette.cards.every(card=>card.background==='rgb(17, 47, 69)'
     &&card.gradient.includes('linear-gradient(160deg')
     &&card.gradient.includes('rgba(21, 59, 84, 0.95)')
     &&card.gradient.includes('rgba(9, 38, 57, 0.98)')
     &&card.border.startsWith('rgba(255, 255, 255, ')
     &&Math.abs(card.width-0.75)<0.02&&card.radius===12),palette);
}

const expectedGrid=slug==='events-experiences'&&width>=1180?4:width>640?2:1;
const expectedInner=slug==='content-production'?1:null;
ck('Compact responsive groups fit with no overlap '+tag,
 capabilityLayout.withinViewport&&capabilityLayout.groupsDontOverlap&&capabilityLayout.columns===expectedGrid&&(expectedInner===null||capabilityLayout.innerColumns===expectedInner),
 {expectedGrid,expectedInner,layout:capabilityLayout});
ck('Contact and connected links valid '+tag,await p.locator('.service-close .solid-link').getAttribute('href')==='/contact/'&&await p.locator('.service-connected a').count()===(slug==='events-experiences'?0:3)&&await p.locator('.service-work,.service-work-card').count()===0);
ck('No horizontal overflow / broken loaded images '+tag,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.service-experience img')].every(e=>!e.getBoundingClientRect().width||!e.complete||e.naturalWidth>0)));
const overlap=await p.locator('.service-hero').evaluate(e=>{const head=e.querySelector('h1'),h=head.getBoundingClientRect(),p=e.querySelector('.service-hero-copy').getBoundingClientRect(),walker=document.createTreeWalker(head,NodeFilter.SHOW_TEXT),rects=[];let node;while(node=walker.nextNode()){if(!node.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(node);rects.push(...r.getClientRects())}return{headingBottom:h.bottom,copyTop:p.top,headingWidth:Math.max(...rects.map(r=>r.right))-Math.min(...rects.map(r=>r.left)),client:head.clientWidth,inkInside:rects.every(r=>r.left>=h.left-1&&r.right<=h.right+1),maskScrollWidth:head.scrollWidth}});ck('Opening has no text overlap or clipping '+tag,overlap.headingBottom<=overlap.copyTop+1&&overlap.headingWidth<=overlap.client+1&&overlap.inkInside,overlap);await c.close();}
// Progressive enhancement, reduced motion and deliberately long edited copy.
for(const options of[{reducedMotion:'reduce'},{javaScriptEnabled:false}])for(const slug of slugs){const c=await b.newContext({viewport:{width:1440,height:900},...options}),p=await c.newPage();await p.goto(base+'/'+slug+'/');if(options.javaScriptEnabled!==false)await p.waitForSelector('[data-service-ready=true]');ck('Readable static story '+slug+' '+JSON.stringify(options),await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')!=='true'&&await p.locator('.service-scene-copy,.service-proof,.service-channel').evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility==='visible'&&getComputedStyle(e).opacity!=='0')));ck('Static expertise remains available '+slug,await p.locator('[data-service-capability]').count()===seed[slug].sections.find(s=>s.id==='section-6').items.length);await c.close()}
for(const slug of slugs){const pages=structuredClone(seed),story=pages[slug].sections.find(s=>s.id==='service-story');story.items[0].description=Array(250).fill('considered').join(' ');const c=await b.newContext({viewport:{width:1440,height:900}});await c.addInitScript(pages=>localStorage.setItem('showset-preview-published-pages',JSON.stringify(pages)),pages);const p=await c.newPage();await ready(p,slug);ck('250-word edited story stays readable '+slug,await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')==='false'&&await p.locator('.service-story').textContent().then(t=>t.includes(story.items[0].description)));await c.close()}
ck('No service runtime errors',errors.length===0,errors);
}finally{await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1}})().catch(e=>{console.error(e);process.exitCode=1});
