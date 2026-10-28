// Computed motion acceptance against the real export. Classes alone are not evidence.
const{chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright'),fs=require('fs'),path=require('path');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3003',out=process.env.SHOWSET_MOTION_EVIDENCE_DIR||'qa-results/service-motion';fs.mkdirSync(out,{recursive:true});
const slugs=['events-experiences','creative-design','digital-marketing','content-production'],checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
const scroll=async(p,selector,offset=110)=>{await p.locator(selector).evaluate((e,offset)=>scrollTo({top:scrollY+e.getBoundingClientRect().top-offset,behavior:'instant'}),offset);await p.waitForTimeout(100)};
async function sampleHeading(p,selector,photo,actions){
 const head=p.locator(selector);if(actions)await actions.reset();else await head.evaluate(e=>{const box=e.closest('section').getBoundingClientRect();scrollTo({top:scrollY+box.top+(e.closest('.service-hero')?box.height+100:-innerHeight-100),behavior:'instant'})});await p.waitForTimeout(120);
 await head.evaluate(e=>{window.__serviceSamples=[];const start=performance.now();function frame(){const span=e.querySelector('.wipe-line>span'),line=span.parentElement,t=getComputedStyle(span),bar=getComputedStyle(line,'::after');window.__serviceSamples.push({clip:t.clipPath,transform:t.transform,translate:t.translate,opacity:t.opacity,marker:bar.clipPath,animation:t.animationName,barAnimation:bar.animationName});if(performance.now()-start<1150)requestAnimationFrame(frame)}frame()});
 if(actions)await actions.enter();else await scroll(p,selector,150);await p.waitForTimeout(1200);const samples=await p.evaluate(()=>window.__serviceSamples);const first=samples[0],last=samples.at(-1);
 ck('Photo heading starts masked; editorial heading is immediately readable '+selector,photo?/100%/.test(first.clip):first.clip==='none'&&first.animation==='none'&&first.opacity==='1',first);
 ck('Photo heading reveals; editorial heading stays static '+selector,photo?/^inset\(0px(?: 0px){0,3}\)$/.test(last.clip):samples.every(x=>x.clip==='none'&&x.animation==='none'&&x.opacity==='1'),last);
 ck('Heading glyphs never rise, fade or translate '+selector,samples.every(s=>(s.transform==='none'||s.transform==='matrix(1, 0, 0, 1, 0, 0)')&&s.translate==='none'&&s.opacity==='1'));
 if(photo){ck('Approved rectangular bar traverses the type '+selector,samples.some(s=>s.barAnimation==='showsetPhotoBlockSwipe'&&s.marker!==first.marker&&s.marker!=='inset(0px 0px 0px 100%)'),samples.filter((_,i)=>i%15===0));ck('Photo text uses discrete approved unmask '+selector,samples.some(s=>s.animation==='showsetPhotoTextUnmask')&&!samples.some(s=>s.animation.includes('Radial')))}else ck('Editorial heading has no introductory animation '+selector,samples.every(x=>x.animation==='none'&&x.clip==='none'&&x.barAnimation==='none'));
 return samples;
}
(async()=>{const b=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});try{
for(const width of(process.env.SHOWSET_SERVICE_WIDTHS?process.env.SHOWSET_SERVICE_WIDTHS.split(',').map(Number):[1920,1440,1024,768,390,320]))for(const slug of slugs){const video=process.env.SHOWSET_SERVICE_VIDEO==='1'&&width===1440,c=await b.newContext({viewport:{width,height:900},hasTouch:width<=390,isMobile:width<=390,...(video?{recordVideo:{dir:path.join(out,'videos'),size:{width:1440,height:900}}}:{})}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.goto(base+'/'+slug+'/');await p.waitForSelector('[data-service-ready=true]');await p.evaluate(()=>document.fonts.ready);const tag=slug+'-'+width,photo=slug==='events-experiences'||slug==='content-production';
if(photo)await sampleHeading(p,'.service-hero h1',true);else{await sampleHeading(p,'.service-intro h2',false);await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));}await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(100);await p.screenshot({path:path.join(out,tag+'-opening.png')});
const type=await p.locator('.service-experience').evaluate(root=>{const near=(a,b)=>Math.abs(a-b)<.001;return{headings:[...root.querySelectorAll('h1,h2,h3')].every(e=>{const s=getComputedStyle(e),size=parseFloat(s.fontSize);return s.fontWeight===s.getPropertyValue('--refine-heading-weight').trim()&&near(parseFloat(s.lineHeight)/size,parseFloat(s.getPropertyValue('--refine-heading-leading')))&&near(parseFloat(s.letterSpacing)/size,parseFloat(s.getPropertyValue('--v12-head-tracking')))}),body:[...root.querySelectorAll('p')].every(e=>{const s=getComputedStyle(e);return s.fontSize==='17px'&&near(parseFloat(s.lineHeight)/17,parseFloat(s.getPropertyValue('--v12-body-leading')))&&near(parseFloat(s.letterSpacing)/17,parseFloat(s.getPropertyValue('--v12-body-tracking')))}),buttons:[...root.querySelectorAll('.solid-link,.understated-link,button')].every(e=>getComputedStyle(e).fontSize==='14px'),eyebrows:root.querySelectorAll('.service-eyebrow').length}});
ck('Global heading/body/action tokens '+tag,type.headings&&type.body&&type.buttons,type);ck('Only selected contextual eyebrows '+tag,type.eyebrows<=3,type);
await scroll(p,'.service-intro');await p.waitForTimeout(1200);await p.screenshot({path:path.join(out,tag+'-editorial.png')});
if(slug==='creative-design'&&width===1440){
 const creativeBefore=await p.locator('.service-experience').evaluate(root=>({
  status:root.dataset.serviceCreativeIntro,
  opacity:[...root.querySelectorAll('.service-creative-artboard-image')].map(el=>getComputedStyle(el).opacity)
 }));
 ck('Creative artboards await view before revealing '+tag,
  creativeBefore.status==='pending'&&creativeBefore.opacity.length===3&&creativeBefore.opacity.every(x=>x==='0'),creativeBefore);
 await scroll(p,'.service-creative-canvas',150);await p.waitForTimeout(1400);
 const creativeAfter=await p.locator('.service-experience').evaluate(root=>({
  status:root.dataset.serviceCreativeIntro,
  pinned:root.querySelector('[data-service-story-track]').dataset.servicePinned,
  images:[...root.querySelectorAll('.service-creative-artboard-image')].map(el=>({opacity:getComputedStyle(el).opacity,clip:getComputedStyle(el).clipPath})),
  descriptions:[...root.querySelectorAll('.service-creative-artboard-copy p')].map(el=>getComputedStyle(el).opacity)
 }));
 ck('Creative artboards reveal naturally, without hiding copy or pinning '+tag,
   creativeAfter.status==='done'&&creativeAfter.pinned==='false'
   &&creativeAfter.images.length===3&&creativeAfter.images.every(x=>x.opacity==='1'&&(x.clip==='inset(0px)'||x.clip==='inset(0px 0px 0px 0px)'))
   &&creativeAfter.descriptions.every(x=>x==='1'),creativeAfter);
}
if(slug==='events-experiences'&&width===1440){
 const before=await p.locator('.service-experience').evaluate(root=>({
  state:root.dataset.serviceTriptychIntro,
  images:[...root.querySelectorAll('.service-event-triptych-image')].map(el=>getComputedStyle(el).opacity)
 }));
 ck('Events triptych awaits scroll entry '+tag,
   before.state==='pending'&&before.images.length===3&&before.images.every(v=>v==='0'),before);
 await scroll(p,'.service-event-triptych',140);
 await p.waitForTimeout(1600);
 const after=await p.locator('.service-experience').evaluate(root=>({
  state:root.dataset.serviceTriptychIntro,
  pinned:root.querySelector('[data-service-story-track]')?.dataset.servicePinned,
  images:[...root.querySelectorAll('.service-event-triptych-image')].map(el=>{
   const c=getComputedStyle(el);return {opacity:c.opacity,clip:c.clipPath}
  }),
  notes:[...root.querySelectorAll('.service-event-triptych-note')].map(el=>getComputedStyle(el).opacity)
 }));
 ck('Events triptych reveals three photo strips and notes without pinning '+tag,
   after.state==='done'&&after.pinned==='false'
   &&after.images.length===3&&after.images.every(el=>el.opacity==='1'&&(el.clip==='inset(0px)'||el.clip==='inset(0px 0px 0px 0px)'))
   &&after.notes.length===3&&after.notes.every(v=>v==='1'),after);
}
const states=[];for(const f of[.1,.5,.9,.5,.1]){const pinned=await p.locator('[data-service-story-track]').getAttribute('data-service-pinned')==='true';await p.locator('[data-service-story-track]').evaluate((e,f)=>scrollTo({top:scrollY+e.getBoundingClientRect().top+Math.max(0,e.offsetHeight-innerHeight)*f,behavior:'instant'}),f);await p.waitForTimeout(1050);states.push(await p.locator('.service-story-stage').evaluate(e=>({p:e.style.getPropertyValue('--service-progress'),proof:e.style.getPropertyValue('--proof-progress'),channel:e.style.getPropertyValue('--channel-progress'),film:e.style.getPropertyValue('--service-frame-progress'),rail:e.querySelector('.service-scenes')?.style.transform,active:[...e.querySelectorAll('[data-service-scene]')].map(s=>s.getAttribute('aria-hidden')),pinned:e.parentElement.dataset.servicePinned})));if(states.length<=3)await p.screenshot({path:path.join(out,tag+'-story-'+f+'.png')});if(pinned&&slug==='events-experiences')ck('Active photographic story heading is readable '+tag+' '+f,await p.locator('[data-service-scene][aria-hidden=false] .wipe-line>span').evaluate(e=>/^inset\(0px(?: 0px){0,3}\)$/.test(getComputedStyle(e).clipPath)))}
if(width>800&&!['events-experiences','creative-design'].includes(slug)){ck('Signature changes during actual forward scroll '+tag,JSON.stringify(states[0])!==JSON.stringify(states[2]),states);ck('Signature returns to its prior reverse state '+tag,JSON.stringify(states[0])===JSON.stringify(states.at(-1)),states)}
if(slug==='digital-marketing'){const choice=p.getByRole('button',{name:'Content',exact:true});if(width<=390)await choice.tap();else await choice.click();const a=await p.locator('.service-channel-lines').evaluate(e=>getComputedStyle(e).strokeDashoffset);await p.waitForTimeout(600);const z=await p.locator('.service-channel-lines').evaluate(e=>getComputedStyle(e).strokeDashoffset);ck('Channel selection links path and active response '+tag,await choice.getAttribute('aria-pressed')==='true'&&(width<=800||a!==z),{a,z});await p.getByRole('button',{name:'Website',exact:true}).focus();await p.keyboard.press('Space');ck('Channel keyboard selection '+tag,await p.getByRole('button',{name:'Website',exact:true}).getAttribute('aria-pressed')==='true')}
if(await p.locator('.service-process').count()){await scroll(p,'.service-process',600);const a=await p.locator('.service-process li').first().evaluate(e=>e.style.getPropertyValue('--process-unit'));await scroll(p,'.service-process',90);await p.waitForTimeout(1200);const z=await p.locator('.service-process li').first().evaluate(e=>e.style.getPropertyValue('--process-unit'));ck('Process assembly follows reading progress '+tag,a!==z||Number(z)===1,{a,z});await p.screenshot({path:path.join(out,tag+'-process.png')});}
else ck('No duplicated Events or Creative process '+tag,['events-experiences','creative-design'].includes(slug));
if(slug==='events-experiences'&&width===1440){
 const start=await p.locator('.service-experience').evaluate(root=>({
  state:root.dataset.serviceCardIntro,
  cards:[...root.querySelectorAll('.service-expertise-grid > .service-capability-group')].map(el=>getComputedStyle(el).opacity)
 }));
 ck('Events cards begin hidden until their section enters the viewport '+tag,
   start.state==='pending'&&start.cards.length===4&&start.cards.every(opacity=>opacity==='0'),start);
}
await scroll(p,'.service-expertise');await p.waitForTimeout(1200);
if(slug==='events-experiences'&&width===1440){
 const end=await p.locator('.service-experience').evaluate(root=>({
  state:root.dataset.serviceCardIntro,
  cards:[...root.querySelectorAll('.service-expertise-grid > .service-capability-group')].map(el=>{
   const c=getComputedStyle(el);
   return {opacity:c.opacity,verticalShift:new DOMMatrixReadOnly(c.transform).m42,delay:c.transitionDelay};
  })
 }));
 ck('Events cards stagger upward and fade into view in reading order '+tag,
   end.state==='done'
   &&end.cards.length===4
   &&end.cards.every(card=>card.opacity==='1'&&Math.abs(card.verticalShift)<0.05)
   &&end.cards.map(card=>Number.parseFloat(card.delay)).join(',')==='0,0.12,0.24,0.36',end);
}
if(width<=390){ck('Mobile cards are readable without tapping a control '+tag,await p.locator('.service-capability-name').first().evaluate(el=>getComputedStyle(el).visibility==='visible'&&el.getBoundingClientRect().height>10)&&await p.locator('.service-expertise button,.service-expertise summary').count()===0&&await p.locator('.service-capability-group').first().evaluate(el=>{const width=parseFloat(getComputedStyle(el).borderTopWidth);return width>0&&width<=1}))}await p.screenshot({path:path.join(out,tag+'-expertise.png')});
ck('No redundant related-work section '+tag,await p.locator('.service-work,.service-work-card').count()===0);
if(['events-experiences','creative-design'].includes(slug)){
 const close=await p.locator('.service-close--editorial').evaluate(el=>({
   height:el.getBoundingClientRect().height,
   viewport:innerHeight,
   imageCount:el.querySelectorAll('img,.service-close-art').length,
   headingAnimation:getComputedStyle(el.querySelector('h2')).animationName,
   accent:getComputedStyle(el.querySelector('h2 .accent-text')).color,
   period:getComputedStyle(el.querySelector('h2 .service-period')).color
 }));
 ck('Events closing CTA is compact, static and uses the homepage editorial layout '+tag,
   close.imageCount===0&&close.headingAnimation==='none'
   &&close.accent==='rgb(18, 186, 175)'&&close.period==='rgb(250, 249, 253)'
   &&close.height<close.viewport,close);
}else await sampleHeading(p,'.service-close h2',true);
await p.screenshot({path:path.join(out,tag+'-closing.png')});
ck('Wrapped type and punctuation fit each line '+tag,await p.locator('[data-service-reveal] .wipe-line').evaluateAll(es=>es.every(e=>{const span=e.firstElementChild,r=document.createRange();r.selectNodeContents(span);const ink=r.getBoundingClientRect(),box=span.getBoundingClientRect();return ink.left>=box.left-1&&ink.right<=box.right+1&&ink.top>=box.top-1&&ink.bottom<=box.bottom+1})));ck('No document overflow '+tag,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
if(width>800&&!['events-experiences','creative-design'].includes(slug)){await p.locator('[data-service-story-track]').evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().bottom-innerHeight+120,behavior:'instant'}));await p.waitForTimeout(120);ck('Pinned story releases cleanly '+tag,await p.locator('.service-story-stage').evaluate(e=>e.dataset.servicePhase==='leaving'&&e.getBoundingClientRect().top< -100));}
if(width===1440&&slug==='events-experiences')ck('Events no longer has pinned photo headlines '+tag,await p.locator('.service-event-triptych-note .wipe-line').count()===0);
const vid=video?p.video():null;await c.close();if(vid)await vid.saveAs(path.join(out,'videos',slug+'.webm'));
}
for(const options of[{reducedMotion:'reduce'},{javaScriptEnabled:false}])for(const slug of slugs){const c=await b.newContext({viewport:{width:1440,height:900},...options}),p=await c.newPage();await p.goto(base+'/'+slug+'/');if(options.javaScriptEnabled!==false)await p.waitForSelector('[data-service-ready=true]');ck('All heading glyphs readable without motion '+slug+' '+JSON.stringify(options),await p.locator('[data-service-reveal] .wipe-line>span').evaluateAll(es=>es.every(e=>getComputedStyle(e).clipPath==='none'&&getComputedStyle(e).opacity==='1')));
if(slug==='creative-design')ck('Creative artwork and descriptions remain visible without motion '+JSON.stringify(options),
 await p.locator('.service-creative-artboard').evaluateAll(es=>es.length===3&&es.every(el=>getComputedStyle(el.querySelector('.service-creative-artboard-image')).opacity==='1'
 &&getComputedStyle(el.querySelector('p')).opacity==='1')));
if(slug==='events-experiences')ck('Events triptych remains readable without motion '+JSON.stringify(options),
 await p.locator('.service-event-triptych-note').evaluateAll(es=>es.length===3&&es.every(el=>getComputedStyle(el).opacity==='1')));
if(slug==='events-experiences')ck('Events capability cards remain visible without motion '+JSON.stringify(options),
 await p.locator('.service-expertise-grid > .service-capability-group').evaluateAll(es=>es.length===4&&es.every(el=>getComputedStyle(el).opacity==='1')));
await c.close()}
ck('No console, hydration or runtime errors',!errors.length,errors);
}finally{await b.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors},null,2));if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1}})().catch(e=>{console.error(e);process.exitCode=1});
